#!/usr/bin/env node

/**
 * AI Helper Script
 * 
 * This script is designed to help AI assistants run commands and immediately see their output
 * without getting stuck waiting for long-running processes to complete.
 * 
 * It runs a command in the background, captures the initial output, and returns control to the terminal.
 * 
 * Usage:
 *   node scripts/ai-helper.js [command] [options]
 * 
 * Commands:
 *   start-server      Start the server in the background
 *   check-logs        Check the most recent logs
 *   check-cluster     Check cluster-related logs
 *   check-status      Check if the server is running
 *   stop-server       Stop the server
 *   verify-config     Verify the current environment configuration
 * 
 * Options:
 *   --env=<env>       Environment (prod, dev, or dev:no-cluster, default: prod)
 *   --lines=<number>  Number of log lines to show (default: 20)
 *   --help            Show this help message
 * 
 * Examples:
 *   node scripts/ai-helper.js start-server --env=prod
 *   node scripts/ai-helper.js check-logs --lines=50
 *   node scripts/ai-helper.js check-cluster
 *   node scripts/ai-helper.js verify-config
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];
const options = {
  env: getArgValue(args, '--env') || 'prod',
  lines: parseInt(getArgValue(args, '--lines') || '20', 10),
  help: args.includes('--help') || args.includes('-h')
};

// Show help if requested or no command provided
if (options.help || !command) {
  console.log(fs.readFileSync(__filename, 'utf8')
    .split('\n')
    .filter(line => line.startsWith(' *'))
    .map(line => line.substring(3))
    .join('\n'));
  process.exit(0);
}

// Validate environment
if (!['prod', 'prod:no-cluster', 'dev', 'dev:no-cluster'].includes(options.env)) {
  console.error(`Error: Unknown environment "${options.env}". Use "prod", "prod:no-cluster", "dev", or "dev:no-cluster".`);
  process.exit(1);
}

// Ensure logs directory exists
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Create a unique log file for this run
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFile = `logs/ai-helper-${timestamp}.log`;

// Execute the requested command
switch (command) {
  case 'start-server':
    startServer(options.env);
    break;
  case 'check-logs':
    checkLogs(options.lines);
    break;
  case 'check-cluster':
    checkClusterLogs(options.lines);
    break;
  case 'check-status':
    checkStatus();
    break;
  case 'stop-server':
    stopServer();
    break;
  case 'verify-config':
    verifyConfig();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.log('Run with --help to see available commands');
    process.exit(1);
}

// Helper function to get argument value
function getArgValue(args, name) {
  const arg = args.find(a => a.startsWith(`${name}=`));
  return arg ? arg.split('=')[1] : null;
}

// Start the server in the background
function startServer(env) {
  console.log(`Starting server in ${env} mode...`);
  
  try {
    // First, configure the environment
    execSync(`node scripts/configure-env.js ${env}`, { stdio: 'inherit' });
    
    // Build the application if needed
    if (env === 'prod') {
      console.log('Building the application...');
      execSync('npm run build', { stdio: 'inherit' });
    }
    
    // Start the server in the background
    const serverProcess = spawn('node', [
      env === 'prod' ? 'dist/server.js' : 'scripts/start.js', 
      env === 'prod' ? '' : 'dev:mock'
    ].filter(Boolean), {
      detached: true,
      stdio: ['ignore', fs.openSync(logFile, 'w'), fs.openSync(logFile, 'w')]
    });
    
    // Don't wait for the server to exit
    serverProcess.unref();
    
    console.log(`Server started with PID ${serverProcess.pid}`);
    console.log(`Logs are being written to ${logFile}`);
    
    // Wait a moment for the server to start
    setTimeout(() => {
      // Show the initial logs
      console.log('\nInitial server logs:');
      try {
        const initialLogs = execSync(`tail -n 20 ${logFile}`).toString();
        console.log(initialLogs || 'No logs yet');
      } catch (error) {
        console.log('No logs available yet');
      }
      
      console.log('\nTo check logs later, run:');
      console.log(`  node scripts/ai-helper.js check-logs`);
      console.log('To stop the server, run:');
      console.log(`  node scripts/ai-helper.js stop-server`);
      
      // For development mode, remind the user to access the application on port 7654
      if (env !== 'prod') {
        console.log('\nAccess the application at:');
        console.log('  http://localhost:7654');
      }
    }, 2000);
  } catch (error) {
    console.error('Error starting server:', error.message);
    process.exit(1);
  }
}

// Check the most recent logs
function checkLogs(lines) {
  console.log(`Checking the most recent logs (${lines} lines)...`);
  
  try {
    // Find the most recent log file
    const logDir = path.resolve(process.cwd(), 'logs');
    const logFiles = fs.readdirSync(logDir)
      .filter(file => file.endsWith('.log'))
      .map(file => ({
        name: file,
        time: fs.statSync(path.join(logDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);
    
    if (logFiles.length === 0) {
      console.log('No log files found');
      return;
    }
    
    const recentLogFile = path.join(logDir, logFiles[0].name);
    console.log(`Most recent log file: ${recentLogFile}`);
    
    // Show the logs
    const logs = execSync(`tail -n ${lines} ${recentLogFile}`).toString();
    console.log('\nRecent logs:');
    console.log(logs || 'No logs found');
  } catch (error) {
    console.error('Error checking logs:', error.message);
  }
}

// Check cluster-related logs
function checkClusterLogs(lines) {
  console.log('Checking cluster-related logs...');
  
  try {
    // Find the most recent log file
    const logDir = path.resolve(process.cwd(), 'logs');
    const logFiles = fs.readdirSync(logDir)
      .filter(file => file.endsWith('.log'))
      .map(file => ({
        name: file,
        time: fs.statSync(path.join(logDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);
    
    if (logFiles.length === 0) {
      console.log('No log files found');
      return;
    }
    
    const recentLogFile = path.join(logDir, logFiles[0].name);
    console.log(`Searching in: ${recentLogFile}`);
    
    // Search for cluster-related logs
    const grepCommand = `grep -i "cluster\\|clusterMode\\|autoDetectCluster" ${recentLogFile} | tail -n ${lines}`;
    try {
      const clusterLogs = execSync(grepCommand).toString();
      console.log('\nCluster-related logs:');
      console.log(clusterLogs || 'No cluster-related logs found');
    } catch (error) {
      // grep returns exit code 1 if no matches found
      console.log('No cluster-related logs found');
    }
  } catch (error) {
    console.error('Error checking cluster logs:', error.message);
  }
}

// Check if the server is running
function checkStatus() {
  console.log('Checking server status...');
  
  try {
    const psOutput = execSync('ps aux | grep "[n]ode.*server.js\\|[n]ode.*start.js"').toString();
    console.log('\nRunning server processes:');
    console.log(psOutput || 'No server processes found');
    
    // Check if the frontend is responding
    try {
      console.log('\nChecking frontend on port 7654:');
      // Just check if we get a 200 response, don't try to parse the HTML
      const frontendResponse = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:7654/').toString();
      if (frontendResponse.trim() === '200') {
        console.log('✅ Frontend is responding (HTTP 200)');
      } else {
        console.log(`❌ Frontend returned HTTP ${frontendResponse}`);
      }
    } catch (error) {
      console.log('❌ Frontend is not responding');
    }
    
    // Check if the mock server is responding (in dev mode)
    try {
      console.log('\nChecking mock server on port 7656:');
      const mockResponse = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:7656/').toString();
      if (mockResponse.trim() === '200') {
        console.log('✅ Mock server is responding (HTTP 200)');
      } else {
        console.log(`❌ Mock server returned HTTP ${mockResponse}`);
      }
    } catch (error) {
      console.log('❌ Mock server is not responding (this is normal in production mode)');
    }
    
    // Check if the API is responding
    try {
      console.log('\nChecking API on port 7654 (via frontend proxy):');
      const apiResponse = execSync('curl -s http://localhost:7654/api/nodes | head -n 5').toString();
      if (apiResponse && apiResponse.includes('nodes')) {
        console.log('✅ API is responding via frontend proxy');
        console.log('First few lines of API response:');
        console.log(apiResponse);
      } else {
        console.log('❌ API response via frontend proxy is invalid');
        console.log(apiResponse);
      }
    } catch (error) {
      console.log('❌ API is not responding via frontend proxy');
      
      // Try direct API access on port 7656 (for development mode)
      try {
        console.log('\nTrying direct API access on port 7656:');
        const directApiResponse = execSync('curl -s http://localhost:7656/api/nodes | head -n 5').toString();
        console.log(directApiResponse);
        console.log('✅ API is responding directly on port 7656');
      } catch (error) {
        console.log('❌ API is not responding on port 7656 either');
      }
    }
    
    console.log('\nServer information:');
    console.log('- The frontend is running on port 7654 (accessible in browser)');
    console.log('- The backend API is running on port 7656 (internal only)');
    console.log('- The mock data server is running on port 7656 (in development mode)');
    
  } catch (error) {
    console.log('No server processes found');
  }
}

// Stop the server
function stopServer() {
  console.log('Stopping server processes...');
  
  try {
    // Kill processes by pattern
    execSync('pkill -f "node.*server.js\\|node.*start.js\\|vite"');
    console.log('Server processes stopped by pattern');
  } catch (error) {
    console.log('No matching processes found to stop by pattern');
  }
  
  try {
    // Kill processes by port
    execSync('npx kill-port 7654 7656 3000');
    console.log('Processes on ports 7654, 7656, and 3000 stopped');
  } catch (error) {
    console.log('No processes found on ports 7654, 7656, or 3000');
  }
  
  console.log('All server processes have been stopped');
}

// Verify the current environment configuration
function verifyConfig() {
  console.log('Verifying environment configuration...');
  
  try {
    execSync('node scripts/verify-cluster-config.js', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error verifying configuration:', error.message);
    process.exit(1);
  }
} 