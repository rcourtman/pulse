#!/usr/bin/env node

/**
 * Log Monitor Script
 * 
 * This script provides real-time monitoring of application logs with filtering capabilities.
 * It makes troubleshooting easier by allowing you to focus on specific log types or components.
 * 
 * Usage:
 *   node scripts/monitor-logs.js [options]
 * 
 * Options:
 *   --level=<level>     Filter by log level (error, warn, info, debug)
 *   --component=<name>  Filter by component name (e.g., ProxmoxClient, NodeManager)
 *   --search=<text>     Search for specific text in logs
 *   --follow            Follow log file in real-time (default: true)
 *   --lines=<number>    Number of lines to show initially (default: 50)
 *   --file=<filename>   Log file to monitor (default: latest combined log)
 *   --color             Use colored output (default: true)
 *   --help              Show this help message
 * 
 * Examples:
 *   node scripts/monitor-logs.js --level=error
 *   node scripts/monitor-logs.js --component=ProxmoxClient
 *   node scripts/monitor-logs.js --search=cluster
 *   node scripts/monitor-logs.js --level=info --component=NodeManager
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  level: getArgValue(args, '--level'),
  component: getArgValue(args, '--component'),
  search: getArgValue(args, '--search'),
  follow: getArgValue(args, '--follow') !== 'false',
  lines: parseInt(getArgValue(args, '--lines') || '50', 10),
  file: getArgValue(args, '--file'),
  color: getArgValue(args, '--color') !== 'false',
  help: args.includes('--help') || args.includes('-h')
};

// Show help if requested
if (options.help) {
  console.log(fs.readFileSync(__filename, 'utf8')
    .split('\n')
    .filter(line => line.startsWith(' *'))
    .map(line => line.substring(3))
    .join('\n'));
  process.exit(0);
}

// Find the log directory
const logDir = path.resolve(process.cwd(), 'logs');

// Find the most recent log file if not specified
if (!options.file) {
  try {
    const logFiles = fs.readdirSync(logDir)
      .filter(file => file.startsWith('combined') && file.endsWith('.log'))
      .map(file => ({
        name: file,
        time: fs.statSync(path.join(logDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);
    
    if (logFiles.length > 0) {
      options.file = logFiles[0].name;
    } else {
      options.file = 'combined.log';
    }
  } catch (error) {
    console.error('Error finding log files:', error.message);
    options.file = 'combined.log';
  }
}

const logFile = path.join(logDir, options.file);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
};

// Color mapping for log levels
const levelColors = {
  error: colors.red,
  warn: colors.yellow,
  info: colors.green,
  debug: colors.blue,
  silly: colors.magenta
};

// Check if the log file exists
if (!fs.existsSync(logFile)) {
  console.error(`Log file not found: ${logFile}`);
  process.exit(1);
}

console.log(`Monitoring log file: ${logFile}`);
console.log(`Filters: ${Object.entries(options)
  .filter(([key, value]) => ['level', 'component', 'search'].includes(key) && value)
  .map(([key, value]) => `${key}=${value}`)
  .join(', ') || 'none'}`);
console.log('Press Ctrl+C to exit\n');

// Build the tail command
const tailArgs = ['-n', options.lines.toString()];
if (options.follow) {
  tailArgs.push('-f');
}
tailArgs.push(logFile);

// Start the tail process
const tail = spawn('tail', tailArgs);

// Process each line of output
tail.stdout.setEncoding('utf8');
const rl = readline.createInterface({
  input: tail.stdout,
  terminal: false
});

rl.on('line', (line) => {
  try {
    // Try to parse the line as JSON
    const logEntry = JSON.parse(line);
    
    // Apply filters
    if (options.level && logEntry.level !== options.level) {
      return;
    }
    
    if (options.component && 
        (!logEntry.component || !logEntry.component.includes(options.component))) {
      return;
    }
    
    if (options.search && 
        !line.toLowerCase().includes(options.search.toLowerCase())) {
      return;
    }
    
    // Format the output
    let formattedLine = '';
    
    if (options.color) {
      const levelColor = levelColors[logEntry.level] || colors.white;
      
      // Timestamp
      formattedLine += `${colors.dim}${new Date(logEntry.timestamp).toISOString()}${colors.reset} `;
      
      // Level
      formattedLine += `${levelColor}${logEntry.level.toUpperCase().padEnd(5)}${colors.reset} `;
      
      // Component
      if (logEntry.component) {
        formattedLine += `${colors.cyan}[${logEntry.component}]${colors.reset} `;
      }
      
      // Message
      formattedLine += logEntry.message;
      
      // Highlight search term if specified
      if (options.search) {
        const regex = new RegExp(options.search, 'gi');
        formattedLine = formattedLine.replace(regex, match => 
          `${colors.bgYellow}${colors.bright}${match}${colors.reset}`);
      }
      
      // Add metadata if present
      if (logEntry.meta && Object.keys(logEntry.meta).length > 0) {
        formattedLine += `\n${colors.dim}${JSON.stringify(logEntry.meta, null, 2)}${colors.reset}`;
      }
    } else {
      // Simple formatting without colors
      formattedLine = `${new Date(logEntry.timestamp).toISOString()} ${logEntry.level.toUpperCase().padEnd(5)} `;
      
      if (logEntry.component) {
        formattedLine += `[${logEntry.component}] `;
      }
      
      formattedLine += logEntry.message;
      
      // Add metadata if present
      if (logEntry.meta && Object.keys(logEntry.meta).length > 0) {
        formattedLine += `\n${JSON.stringify(logEntry.meta, null, 2)}`;
      }
    }
    
    console.log(formattedLine);
  } catch (error) {
    // If not JSON, just print the line as is
    if (options.search && !line.toLowerCase().includes(options.search.toLowerCase())) {
      return;
    }
    
    if (options.color && options.search) {
      const regex = new RegExp(options.search, 'gi');
      console.log(line.replace(regex, match => 
        `${colors.bgYellow}${colors.bright}${match}${colors.reset}`));
    } else {
      console.log(line);
    }
  }
});

// Handle errors
tail.stderr.on('data', (data) => {
  console.error(`Error: ${data}`);
});

tail.on('close', (code) => {
  console.log(`Monitoring ended with code ${code}`);
});

// Helper function to get argument value
function getArgValue(args, name) {
  const arg = args.find(a => a.startsWith(`${name}=`));
  return arg ? arg.split('=')[1] : null;
} 