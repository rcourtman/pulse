# Metrics Service

This document describes the metrics service in Pulse and how it handles data processing, rate calculation, and unrealistic rate detection.

## Overview

The metrics service is responsible for:
- Collecting raw metrics from Proxmox nodes
- Processing and calculating derived metrics
- Detecting and handling unrealistic rate values
- Maintaining historical data for trend analysis
- Broadcasting metrics updates to connected clients

## Rate Calculation

The metrics service calculates various rates from cumulative counters provided by Proxmox:
- Network in/out rates
- Disk read/write rates
- CPU usage rates

These calculations convert cumulative counters into rates by comparing the current value with the previous value and dividing by the time difference.

## Unrealistic Rate Handling

In some cases, Proxmox may report counter values that result in unrealistic rates when calculated. This can happen due to:
- Counter resets
- Proxmox API reporting inconsistencies
- Very short sampling intervals
- Network or disk bursts that exceed realistic hardware capabilities

To handle these cases, the metrics service implements rate capping:

```typescript
// Maximum realistic network rate (in bytes/second) - 125 MB/s (1 Gbps)
private readonly maxRealisticRate: number = 125 * 1024 * 1024;

// Apply sanity check to input rates - cap at maximum realistic rate
inRate = Math.min(inRate, this.maxRealisticRate);
outRate = Math.min(outRate, this.maxRealisticRate);

// In the calculateRate function
if (rate > this.maxRealisticRate) {
  return this.maxRealisticRate;
}
```

When an unrealistic rate is detected:
1. The rate is silently capped at 125 MB/s (equivalent to 1 Gbps)
2. The capped value is used for display and calculations
3. This prevents UI graphs from showing unrealistic spikes

## Rate Smoothing

To provide a more stable and realistic view of network and disk activity, the metrics service implements rate smoothing:

1. **Moving Average**: Rates are smoothed using a simple moving average over the last few samples
2. **Spike Detection**: Sudden large increases in rates are detected and smoothed
3. **Calibration**: The service gradually calibrates to stable rates over time

## Configuration

The metrics service behavior can be configured through environment variables:

```
# Maximum history length (number of data points to keep)
METRICS_HISTORY_LENGTH=100

# Polling interval in milliseconds
METRICS_POLLING_INTERVAL=2000

# Maximum realistic rate in MB/s (default: 125 MB/s = 1 Gbps)
# Increase this value for faster networks:
# - 1250 for 10 Gbps networks
# - 3125 for 25 Gbps networks
# - 12500 for 100 Gbps networks
METRICS_MAX_REALISTIC_RATE=125
```

## Performance Considerations

The rate capping mechanism ensures that the UI displays reasonable values and prevents graphs from being skewed by unrealistic spikes. This is particularly important when:

- A VM or container has a sudden burst of network or disk activity
- The Proxmox API reports counter values that result in unrealistic rates
- The sampling interval is very short, magnifying small counter differences

If you have faster network hardware, you should adjust the rate capping behavior:

```bash
# Example: Set max rate to 1250 MB/s for a 10 Gbps network
METRICS_MAX_REALISTIC_RATE=1250

# Example: Set max rate to 3125 MB/s for a 25 Gbps network
METRICS_MAX_REALISTIC_RATE=3125

# Example: Set max rate to 12500 MB/s for a 100 Gbps network
METRICS_MAX_REALISTIC_RATE=12500
```

You can also adjust these other parameters:
1. Increase the polling interval to reduce the chance of catching short bursts
2. Adjust the maximum realistic rate if your hardware supports higher rates

## Advanced Usage

For advanced users who want to customize the metrics service behavior, you can modify the following parameters in the source code:

- `movingAverageSamples`: Number of samples to use for the moving average
- `maxRateDeviation`: Maximum allowed deviation for spike detection
- `speedIncreaseBias`: Bias factor for increasing speeds
- `speedDecreaseBias`: Bias factor for decreasing speeds
- `stabilityThreshold`: Percentage variation allowed for a rate to be considered stable
- `stabilityCounter`: Number of consecutive samples within threshold to consider a rate stable
- `calibrationFactor`: How much to weight new values vs. calibrated value 