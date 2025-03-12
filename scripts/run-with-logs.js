#!/usr/bin/env node

/**
 * Run With Logs Script
 * 
 * This script runs the application and monitors logs in a split terminal.
 * It makes it easier to see what's happening in the application in real-time.
 * 
 * Usage:
 *   node scripts/run-with-logs.js [dev|prod] [options]
 * 
 * Options:
 *   --search=<text>     Search for specific text in logs
 *   --level=<level>     Filter by log level (error, warn, info, debug)
 *   --component=<n>     Filter by component name
 *   --help              Show this help message
 * 
 * Examples:
 *   node scripts/run-with-logs.js dev
 *   node scripts/run-with-logs.js prod --search=cluster
 *   node scripts/run-with-logs.js dev --level=error
 */

const { spawn } = require('child_process');
const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);
const env = args[0] === 'prod' ? 'prod' : 'dev';
const help = args.includes('--help') || args.includes('-h');

// Show help if requested
if (help) {
  console.log(fs.readFileSync(__filename, 'utf8')
    .split('\n')
    .filter(line => line.startsWith(' *'))
    .map(line => line.substring(3))
    .join('\n'));
  process.exit(0);
}

// Extract log options
const logOptions = args
  .filter(arg => arg.startsWith('--'))
  .join(' ');

// Determine which npm script to run
const npmScript = env;

console.log(`Starting application in ${env} mode...`);

// Create a unique log file for this run
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFile = `logs/app-${env}-${timestamp}.log`;

// Ensure logs directory exists
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Start the application and redirect output to the log file
const app = spawn('npm', ['run', npmScript], {
  stdio: ['ignore', fs.openSync(logFile, 'w'), fs.openSync(logFile, 'w')],
  detached: true
});

// Don't wait for the app to exit
app.unref();

console.log(`Application started with PID ${app.pid}`);
console.log(`Logs are being written to ${logFile}`);
console.log('Starting log monitor...\n');

// Wait a moment for the app to start writing logs
setTimeout(() => {
  // Start the log monitor
  const logMonitor = spawn('node', ['scripts/monitor-logs.js', `--file=${logFile.split('/')[1]}`, '--follow=true', ...logOptions.split(' ').filter(Boolean)], {
    stdio: 'inherit'
  });

  // Handle log monitor exit
  logMonitor.on('exit', (code) => {
    console.log(`\nLog monitor exited with code ${code}`);
    console.log(`The application is still running with PID ${app.pid}`);
    console.log('To stop the application, run:');
    console.log(`  kill ${app.pid}`);
    process.exit(0);
  });

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    console.log('\nStopping application and log monitor...');
    process.kill(-app.pid, 'SIGINT');
    process.exit(0);
  });
}, 1000); 