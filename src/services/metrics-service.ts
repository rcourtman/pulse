import { EventEmitter } from 'events';
import { createLogger } from '../utils/logger';
import { nodeManager } from './node-manager';
import config from '../config';
import { MetricsData, ProxmoxNodeStatus, ProxmoxVM, ProxmoxContainer } from '../types';

export class MetricsService extends EventEmitter {
  private logger = createLogger('MetricsService');
  private metricsHistory: Map<string, MetricsData[]> = new Map();
  private lastMetrics: Map<string, MetricsData> = new Map();
  private historyMaxLength: number;
  // Add a map to store recent network rate values for smoothing
  private recentNetworkRates: Map<string, { inRates: number[], outRates: number[] }> = new Map();
  // Number of samples to use for the moving average - keeping it small for responsiveness
  private readonly movingAverageSamples: number = 3;
  // Maximum allowed deviation for spike detection (as a multiplier)
  private readonly maxRateDeviation: number = 2.0;
  // Bias factor for increasing speeds (makes the app more responsive to speed increases)
  private readonly speedIncreaseBias: number = 0.7;

  constructor() {
    super();
    
    // Calculate max history length based on configuration
    // Assuming we collect metrics every 30 seconds
    this.historyMaxLength = Math.ceil((config.metricsHistoryMinutes * 60) / 30);
    
    this.logger.info(`Metrics history configured for ${config.metricsHistoryMinutes} minutes (${this.historyMaxLength} data points)`);
    
    // Subscribe to node manager events
    this.subscribeToEvents();
  }

  /**
   * Subscribe to node manager events
   */
  private subscribeToEvents(): void {
    nodeManager.on('metricsUpdated', this.handleMetricsUpdate.bind(this));
  }

  /**
   * Handle metrics update from node manager
   */
  private handleMetricsUpdate(data: any): void {
    const { nodeId, timestamp, nodeStatus, vms, containers } = data;
    
    // Process node metrics
    this.processNodeMetrics(nodeId, timestamp, nodeStatus);
    
    // Process VM metrics
    for (const vm of vms) {
      this.processGuestMetrics(nodeId, timestamp, vm, 'vm');
    }
    
    // Process container metrics
    for (const container of containers) {
      this.processGuestMetrics(nodeId, timestamp, container, 'container');
    }
  }

  /**
   * Process node metrics
   */
  private processNodeMetrics(nodeId: string, timestamp: number, nodeStatus: ProxmoxNodeStatus): void {
    const metrics: MetricsData = {
      timestamp,
      nodeId,
      type: 'node',
      metrics: {
        cpu: nodeStatus.cpu,
        memory: {
          total: nodeStatus.memory.total,
          used: nodeStatus.memory.used,
          usedPercentage: nodeStatus.memory.usedPercentage
        },
        disk: {
          total: nodeStatus.disk.total,
          used: nodeStatus.disk.used,
          usedPercentage: nodeStatus.disk.usedPercentage
        },
        uptime: nodeStatus.uptime,
        status: nodeStatus.status
      }
    };
    
    // Store last metrics
    this.lastMetrics.set(nodeId, metrics);
    
    // Add to history
    this.addToHistory(nodeId, metrics);
    
    // Emit metrics update event
    this.emit('metricsUpdated', metrics);
  }

  /**
   * Process guest (VM or container) metrics
   */
  private processGuestMetrics(
    nodeId: string, 
    timestamp: number, 
    guest: ProxmoxVM | ProxmoxContainer,
    type: 'vm' | 'container'
  ): void {
    const guestId = guest.id;
    const previousMetrics = this.lastMetrics.get(guestId);
    
    // Calculate network rates from cumulative counters
    const networkInRate = previousMetrics ? 
      this.calculateRate(guest.netin, previousMetrics.metrics.network?.in || 0, timestamp, previousMetrics.timestamp) : 
      0;
    
    const networkOutRate = previousMetrics ? 
      this.calculateRate(guest.netout, previousMetrics.metrics.network?.out || 0, timestamp, previousMetrics.timestamp) : 
      0;

    // Log raw values for debugging
    this.logger.debug(`Network rates for ${guestId}:`, {
      currentNetin: guest.netin,
      previousNetin: previousMetrics?.metrics.network?.in,
      currentNetout: guest.netout,
      previousNetout: previousMetrics?.metrics.network?.out,
      timeDiff: previousMetrics ? (timestamp - previousMetrics.timestamp) / 1000 : 0,
      calculatedInRate: networkInRate,
      calculatedOutRate: networkOutRate
    });
    
    // Apply moving average to smooth network rates
    const smoothedNetworkRates = this.applyMovingAverage(guestId, networkInRate, networkOutRate);
    
    // Calculate disk rates
    const diskReadRate = previousMetrics ? 
      this.calculateRate(guest.diskread, previousMetrics.metrics.disk?.readRate || 0, timestamp, previousMetrics.timestamp) : 
      0;
    
    const diskWriteRate = previousMetrics ? 
      this.calculateRate(guest.diskwrite, previousMetrics.metrics.disk?.writeRate || 0, timestamp, previousMetrics.timestamp) : 
      0;
    
    // Create metrics object
    const metrics: MetricsData = {
      timestamp,
      nodeId,
      guestId,
      type,
      metrics: {
        cpu: guest.cpu !== undefined ? guest.cpu * 100 : (guest.cpus > 0 ? 0 : 0),
        memory: {
          total: guest.maxmem,
          used: guest.memory,
          usedPercentage: guest.maxmem > 0 ? (guest.memory / guest.maxmem) * 100 : 0
        },
        network: {
          in: guest.netin,
          out: guest.netout,
          inRate: smoothedNetworkRates.inRate,
          outRate: smoothedNetworkRates.outRate
        },
        disk: {
          total: guest.maxdisk,
          used: guest.disk,
          usedPercentage: guest.maxdisk > 0 ? (guest.disk / guest.maxdisk) * 100 : 0,
          readRate: diskReadRate,
          writeRate: diskWriteRate
        },
        uptime: guest.uptime,
        status: guest.status
      }
    };
    
    // Store last metrics
    this.lastMetrics.set(guestId, metrics);
    
    // Add to history
    this.addToHistory(guestId, metrics);
    
    // Emit metrics update event
    this.emit('metricsUpdated', metrics);
  }

  /**
   * Apply moving average to network rates to smooth out fluctuations
   */
  private applyMovingAverage(guestId: string, inRate: number, outRate: number): { inRate: number, outRate: number } {
    // Get or initialize the recent rates array for this guest
    if (!this.recentNetworkRates.has(guestId)) {
      this.recentNetworkRates.set(guestId, { 
        inRates: [inRate], 
        outRates: [outRate] 
      });
      return { inRate, outRate };
    }
    
    const rates = this.recentNetworkRates.get(guestId)!;
    
    // Detect and handle spikes in the input rate
    let filteredInRate = inRate;
    let filteredOutRate = outRate;
    
    if (rates.inRates.length > 0) {
      const lastInRate = rates.inRates[rates.inRates.length - 1];
      
      // If the new rate is significantly higher than the last one, it might be a spike
      if (inRate > lastInRate * this.maxRateDeviation) {
        // Use a weighted average instead of the raw value to dampen the spike
        filteredInRate = (lastInRate + inRate) / 2;
        this.logger.debug(`Detected download rate spike for ${guestId}: ${inRate.toFixed(2)} -> ${filteredInRate.toFixed(2)}`);
      } 
      // If speed is increasing but not dramatically (normal acceleration), be more responsive
      else if (inRate > lastInRate) {
        // Apply less smoothing for increasing speeds to be more responsive
        filteredInRate = lastInRate + (inRate - lastInRate) * this.speedIncreaseBias;
        this.logger.debug(`Speed increasing for ${guestId}: ${inRate.toFixed(2)} -> ${filteredInRate.toFixed(2)}`);
      }
    }
    
    if (rates.outRates.length > 0) {
      const lastOutRate = rates.outRates[rates.outRates.length - 1];
      
      // If the new rate is significantly higher than the last one, it might be a spike
      if (outRate > lastOutRate * this.maxRateDeviation) {
        // Use a weighted average instead of the raw value to dampen the spike
        filteredOutRate = (lastOutRate + outRate) / 2;
        this.logger.debug(`Detected upload rate spike for ${guestId}: ${outRate.toFixed(2)} -> ${filteredOutRate.toFixed(2)}`);
      }
      // If speed is increasing but not dramatically (normal acceleration), be more responsive
      else if (outRate > lastOutRate) {
        // Apply less smoothing for increasing speeds to be more responsive
        filteredOutRate = lastOutRate + (outRate - lastOutRate) * this.speedIncreaseBias;
        this.logger.debug(`Speed increasing for ${guestId}: ${outRate.toFixed(2)} -> ${filteredOutRate.toFixed(2)}`);
      }
    }
    
    // Add new rates to the arrays
    rates.inRates.push(filteredInRate);
    rates.outRates.push(filteredOutRate);
    
    // Trim arrays to keep only the most recent samples
    if (rates.inRates.length > this.movingAverageSamples) {
      rates.inRates.shift();
    }
    if (rates.outRates.length > this.movingAverageSamples) {
      rates.outRates.shift();
    }
    
    // Calculate weighted average - giving more weight to recent values for better responsiveness
    let smoothedInRate = 0;
    let smoothedOutRate = 0;
    let totalWeight = 0;
    
    for (let i = 0; i < rates.inRates.length; i++) {
      // Weight increases with index (more recent values have higher weight)
      const weight = i + 1;
      smoothedInRate += rates.inRates[i] * weight;
      smoothedOutRate += rates.outRates[i] * weight;
      totalWeight += weight;
    }
    
    smoothedInRate = smoothedInRate / totalWeight;
    smoothedOutRate = smoothedOutRate / totalWeight;
    
    // Update the stored rates
    this.recentNetworkRates.set(guestId, rates);
    
    this.logger.debug(`Network rates for ${guestId}: Raw in=${inRate.toFixed(2)}, Filtered in=${filteredInRate.toFixed(2)}, Smoothed in=${smoothedInRate.toFixed(2)}, Raw out=${outRate.toFixed(2)}, Filtered out=${filteredOutRate.toFixed(2)}, Smoothed out=${smoothedOutRate.toFixed(2)}`);
    
    return { inRate: smoothedInRate, outRate: smoothedOutRate };
  }

  /**
   * Calculate rate between two values over time
   * Generic rate calculation for any cumulative counter
   */
  private calculateRate(currentValue: number, previousValue: number, currentTime: number, previousTime: number): number {
    if (currentTime === previousTime) return 0;
    if (currentValue < previousValue) return 0; // Counter reset
    
    const timeDiff = (currentTime - previousTime) / 1000; // Convert to seconds
    return (currentValue - previousValue) / timeDiff;
  }

  /**
   * Process network rate from Proxmox API values
   * Proxmox returns network data already in bytes/second
   */
  private calculateNetworkRate(currentValue: number, previousValue: number, currentTime: number, previousTime: number): number {
    // Proxmox already returns the rate in bytes/second, so we just need to return the current value
    // We only calculate the rate if the value looks like a cumulative counter (very large number)
    if (currentValue > 1e9) { // If value is greater than 1GB, it's probably a cumulative counter
      return this.calculateRate(currentValue, previousValue, currentTime, previousTime);
    }
    return currentValue; // Otherwise, assume it's already a rate
  }

  /**
   * Optimize metrics data for storage efficiency
   * @param metrics The metrics data to optimize
   * @returns Optimized metrics data
   */
  private optimizeMetricsForStorage(metrics: MetricsData): MetricsData {
    // Create a copy to avoid modifying the original
    const optimized: MetricsData = {
      timestamp: metrics.timestamp,
      nodeId: metrics.nodeId,
      guestId: metrics.guestId,
      type: metrics.type,
      metrics: { ...metrics.metrics }
    };
    
    // Optimize CPU - store as integer percentage (0-100)
    if (typeof optimized.metrics.cpu === 'number') {
      optimized.metrics.cpu = Math.round(optimized.metrics.cpu);
    }
    
    // Optimize memory metrics
    if (optimized.metrics.memory) {
      // Store percentage as integer (0-100)
      if (typeof optimized.metrics.memory.usedPercentage === 'number') {
        optimized.metrics.memory.usedPercentage = Math.round(optimized.metrics.memory.usedPercentage);
      }
      
      // Optionally convert bytes to MB for storage efficiency if values are large
      // This reduces precision but saves space for large values
      if (optimized.metrics.memory.total > 1024 * 1024 * 10) { // If greater than 10MB
        // Store in MB instead of bytes
        optimized.metrics.memory.total = Math.round(optimized.metrics.memory.total / (1024 * 1024));
        optimized.metrics.memory.used = Math.round(optimized.metrics.memory.used / (1024 * 1024));
        // Add a flag to indicate the unit is now MB
        (optimized.metrics.memory as any).unit = 'MB';
      }
    }
    
    // Optimize disk metrics
    if (optimized.metrics.disk) {
      // Store percentage as integer (0-100)
      if (typeof optimized.metrics.disk.usedPercentage === 'number') {
        optimized.metrics.disk.usedPercentage = Math.round(optimized.metrics.disk.usedPercentage);
      }
      
      // Optionally convert bytes to MB or GB for storage efficiency
      if (optimized.metrics.disk.total > 1024 * 1024 * 1024) { // If greater than 1GB
        // Store in GB instead of bytes
        optimized.metrics.disk.total = Math.round(optimized.metrics.disk.total / (1024 * 1024 * 1024));
        optimized.metrics.disk.used = Math.round(optimized.metrics.disk.used / (1024 * 1024 * 1024));
        // Add a flag to indicate the unit is now GB
        (optimized.metrics.disk as any).unit = 'GB';
      } else if (optimized.metrics.disk.total > 1024 * 1024 * 10) { // If greater than 10MB
        // Store in MB instead of bytes
        optimized.metrics.disk.total = Math.round(optimized.metrics.disk.total / (1024 * 1024));
        optimized.metrics.disk.used = Math.round(optimized.metrics.disk.used / (1024 * 1024));
        // Add a flag to indicate the unit is now MB
        (optimized.metrics.disk as any).unit = 'MB';
      }
      
      // Round rate values to integers if they're small
      if (typeof optimized.metrics.disk.readRate === 'number') {
        optimized.metrics.disk.readRate = Math.round(optimized.metrics.disk.readRate);
      }
      if (typeof optimized.metrics.disk.writeRate === 'number') {
        optimized.metrics.disk.writeRate = Math.round(optimized.metrics.disk.writeRate);
      }
    }
    
    // Optimize network metrics
    if (optimized.metrics.network) {
      // Round cumulative values
      if (typeof optimized.metrics.network.in === 'number') {
        optimized.metrics.network.in = Math.round(optimized.metrics.network.in);
      }
      if (typeof optimized.metrics.network.out === 'number') {
        optimized.metrics.network.out = Math.round(optimized.metrics.network.out);
      }
      
      // Round rate values to integers if they're small
      if (typeof optimized.metrics.network.inRate === 'number') {
        optimized.metrics.network.inRate = Math.round(optimized.metrics.network.inRate);
      }
      if (typeof optimized.metrics.network.outRate === 'number') {
        optimized.metrics.network.outRate = Math.round(optimized.metrics.network.outRate);
      }
    }
    
    return optimized;
  }

  /**
   * Add metrics to history with optimization
   */
  private addToHistory(id: string, metrics: MetricsData): void {
    // Optimize metrics before storing
    const optimizedMetrics = this.optimizeMetricsForStorage(metrics);
    
    // Store the optimized metrics
    if (!this.metricsHistory.has(id)) {
      this.metricsHistory.set(id, []);
    }
    
    const history = this.metricsHistory.get(id)!;
    history.push(optimizedMetrics);
    
    // Trim history if it exceeds the maximum length
    if (history.length > this.historyMaxLength) {
      history.shift();
    }
    
    // Update last metrics
    this.lastMetrics.set(id, optimizedMetrics);
  }

  /**
   * Get current metrics for a node or guest
   */
  getCurrentMetrics(id: string): MetricsData | undefined {
    return this.lastMetrics.get(id);
  }

  /**
   * Get metrics history for a node or guest
   */
  getMetricsHistory(id: string): MetricsData[] {
    return this.metricsHistory.get(id) || [];
  }

  /**
   * Get all current metrics
   */
  getAllCurrentMetrics(): MetricsData[] {
    return Array.from(this.lastMetrics.values());
  }

  /**
   * Get metrics for all nodes
   */
  getNodeMetrics(): MetricsData[] {
    return Array.from(this.lastMetrics.values())
      .filter(metrics => metrics.type === 'node');
  }

  /**
   * Get metrics for all guests
   */
  getGuestMetrics(): MetricsData[] {
    return Array.from(this.lastMetrics.values())
      .filter(metrics => metrics.type === 'vm' || metrics.type === 'container');
  }

  /**
   * Clear metrics history
   */
  clearHistory(): void {
    this.metricsHistory.clear();
    this.recentNetworkRates.clear();
    this.logger.info('Metrics history cleared');
  }
}

// Export singleton instance
export const metricsService = new MetricsService(); 