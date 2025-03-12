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
  private recentNetworkRates: Map<string, { 
    inRates: number[], 
    outRates: number[],
    stableInRate: boolean,
    stableOutRate: boolean,
    stableInRateValue: number,
    stableOutRateValue: number,
    stableInRateCounter: number,
    stableOutRateCounter: number,
    maxObservedInRate: number,
    maxObservedOutRate: number,
    calibratedInRate: number | null,
    calibratedOutRate: number | null
  }> = new Map();
  // Number of samples to use for the moving average - balanced for stability and responsiveness
  private readonly movingAverageSamples: number = 4;
  // Maximum allowed deviation for spike detection (as a multiplier)
  private readonly maxRateDeviation: number = 2.5;
  // Bias factor for increasing speeds (makes the app more responsive to speed increases)
  private readonly speedIncreaseBias: number = 0.6;
  // Bias factor for decreasing speeds (makes the app more stable during speed decreases)
  private readonly speedDecreaseBias: number = 0.4;
  // Stability threshold - percentage variation allowed for a rate to be considered stable
  private readonly stabilityThreshold: number = 0.15; // 15%
  // Number of consecutive samples within threshold to consider a rate stable
  private readonly stabilityCounter: number = 3;
  // Calibration factor - how much to weight new values vs. calibrated value
  private readonly calibrationFactor: number = 0.2;
  // Maximum realistic network rate (in bytes/second)
  // Default: 125 MB/s (1 Gbps), but can be configured via environment variable
  private readonly maxRealisticRate: number;

  constructor() {
    super();
    
    // Calculate max history length based on configuration
    // Assuming we collect metrics every 30 seconds
    this.historyMaxLength = Math.ceil((config.metricsHistoryMinutes * 60) / 30);
    
    // Initialize maxRealisticRate from config (in MB/s) and convert to bytes/second
    this.maxRealisticRate = config.maxRealisticRate * 1024 * 1024;
    
    this.logger.info(`Metrics history configured for ${config.metricsHistoryMinutes} minutes (${this.historyMaxLength} data points)`);
    this.logger.info(`Maximum realistic network rate set to ${config.maxRealisticRate} MB/s`);
    
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
    
    // Log detailed network metrics for debugging
    if (previousMetrics) {
      this.logger.debug(`Raw network metrics for ${guestId}:`, {
        currentNetin: guest.netin,
        previousNetin: previousMetrics.metrics.network?.in,
        currentNetout: guest.netout,
        previousNetout: previousMetrics.metrics.network?.out,
        timeDiff: (timestamp - previousMetrics.timestamp) / 1000,
        calculatedInRate: networkInRate,
        calculatedOutRate: networkOutRate,
        inRateMBps: (networkInRate / (1024 * 1024)).toFixed(2),
        outRateMBps: (networkOutRate / (1024 * 1024)).toFixed(2)
      });
    }
    
    // Apply moving average to smooth network rates
    const smoothedNetworkRates = this.applyMovingAverage(guestId, networkInRate, networkOutRate);
    
    // Log the smoothed rates
    this.logger.debug(`Smoothed network rates for ${guestId}: in=${(smoothedNetworkRates.inRate / (1024 * 1024)).toFixed(2)} MB/s, out=${(smoothedNetworkRates.outRate / (1024 * 1024)).toFixed(2)} MB/s`);
    
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
    // Apply sanity check to input rates - cap at maximum realistic rate
    inRate = Math.min(inRate, this.maxRealisticRate);
    outRate = Math.min(outRate, this.maxRealisticRate);
    
    // Get or initialize the recent rates array for this guest
    if (!this.recentNetworkRates.has(guestId)) {
      this.recentNetworkRates.set(guestId, { 
        inRates: [inRate], 
        outRates: [outRate],
        stableInRate: false,
        stableOutRate: false,
        stableInRateValue: 0,
        stableOutRateValue: 0,
        stableInRateCounter: 0,
        stableOutRateCounter: 0,
        maxObservedInRate: inRate,
        maxObservedOutRate: outRate,
        calibratedInRate: null,
        calibratedOutRate: null
      });
      return { inRate, outRate };
    }
    
    const rates = this.recentNetworkRates.get(guestId)!;
    
    // Add new rates to the arrays
    rates.inRates.push(inRate);
    rates.outRates.push(outRate);
    
    // Trim arrays to keep only the most recent samples
    if (rates.inRates.length > this.movingAverageSamples) {
      rates.inRates.shift();
    }
    if (rates.outRates.length > this.movingAverageSamples) {
      rates.outRates.shift();
    }
    
    // Calculate simple averages
    const smoothedInRate = rates.inRates.reduce((sum, rate) => sum + rate, 0) / rates.inRates.length;
    const smoothedOutRate = rates.outRates.reduce((sum, rate) => sum + rate, 0) / rates.outRates.length;
    
    // Update the stored rates
    this.recentNetworkRates.set(guestId, rates);
    
    this.logger.debug(`Network rates for ${guestId}: Raw in=${inRate.toFixed(2)}, Smoothed in=${smoothedInRate.toFixed(2)}, Raw out=${outRate.toFixed(2)}, Smoothed out=${smoothedOutRate.toFixed(2)}`);
    
    return { inRate: smoothedInRate, outRate: smoothedOutRate };
  }

  /**
   * Calculate rate between two values over time
   * Generic rate calculation for any cumulative counter
   */
  private calculateRate(currentValue: number, previousValue: number, currentTime: number, previousTime: number): number {
    // Sanity check for time difference
    if (currentTime <= previousTime) return 0;
    
    // Handle counter reset or counter going backwards
    if (currentValue < previousValue) return 0;
    
    // Calculate time difference in seconds
    const timeDiff = (currentTime - previousTime) / 1000;
    
    // Calculate the rate
    const rate = (currentValue - previousValue) / timeDiff;
    
    // Apply a simple cap for rates that are unrealistic
    if (rate > this.maxRealisticRate) {
      return this.maxRealisticRate;
    }
    
    return rate;
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