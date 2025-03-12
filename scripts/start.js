/**
 * Unified cross-platform script to start Pulse in different environments
 * Usage: node start.js [dev|prod] [--dry-run]
 */

const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Parse command line arguments
const args = process.argv.slice(2);
const mode = args[0] || 'dev'; // Default to dev mode if not specified
const isDryRun = args.includes('--dry-run');

// Detect the platform
const isWindows = os.platform() === 'win32';

console.log(`Detected platform: ${os.platform()}`);
console.log(`Starting Pulse in ${mode} mode on ${isWindows ? 'Windows' : 'Unix-like'} system...`);
if (isDryRun) {
  console.log('Dry run mode enabled - commands will be shown but not executed');
}

// Load environment variables
function loadEnvironment() {
  // Load from .env file
  dotenv.config();
  
  // For development mode, override with development settings if not already set
  if (mode === 'dev' && process.env.NODE_ENV !== 'development') {
    process.env.NODE_ENV = 'development';
    process.env.USE_MOCK_DATA = 'true';
    process.env.MOCK_DATA_ENABLED = 'true';
    process.env.MOCK_SERVER_PORT = '7656';
    console.log('Using development settings with mock data');
  } else if (mode === 'prod' && process.env.NODE_ENV !== 'production') {
    process.env.NODE_ENV = 'production';
    process.env.USE_MOCK_DATA = 'false';
    process.env.MOCK_DATA_ENABLED = 'false';
    console.log('Using production settings with real data');
  }
}

// Ensure logo files are properly copied to frontend/public/logos
function ensureLogoFiles() {
  console.log('Ensuring logo files are properly available in frontend...');
  
  const sourceDir = path.join(process.cwd(), 'public', 'logos');
  const targetDir = path.join(process.cwd(), 'frontend', 'public', 'logos');
  
  // Create target directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    console.log('Creating frontend/public/logos directory...');
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  // Copy all logo files
  try {
    const files = fs.readdirSync(sourceDir);
    for (const file of files) {
      if (file.endsWith('.png') || file.endsWith('.svg')) {
        const sourcePath = path.join(sourceDir, file);
        const targetPath = path.join(targetDir, file);
        
        // Only copy if the file doesn't exist or is older
        if (!fs.existsSync(targetPath) || 
            fs.statSync(sourcePath).mtime > fs.statSync(targetPath).mtime) {
          console.log(`Copying ${file} to frontend/public/logos...`);
          fs.copyFileSync(sourcePath, targetPath);
        }
      }
    }
    console.log('Logo files are up to date.');
  } catch (error) {
    console.warn(`Warning: Could not copy logo files: ${error.message}`);
    console.warn('This is not critical, continuing with startup...');
  }
}

// Start the appropriate script based on the platform and mode
function startScript() {
  let scriptPath;
  
  if (isWindows) {
    // Windows scripts
    if (mode === 'prod') {
      scriptPath = path.join(process.cwd(), 'scripts', 'start-prod.bat');
    } else {
      scriptPath = path.join(process.cwd(), 'scripts', 'start-dev.bat');
    }
  } else {
    // Unix-like scripts
    if (mode === 'prod') {
      scriptPath = path.join(process.cwd(), 'scripts', 'start-prod.sh');
    } else {
      scriptPath = path.join(process.cwd(), 'scripts', 'start-dev.sh');
    }
    
    // Make the script executable
    try {
      fs.chmodSync(scriptPath, '755');
    } catch (error) {
      console.error(`Error making script executable: ${error.message}`);
      process.exit(1);
    }
  }
  
  console.log(`Starting script: ${scriptPath}`);
  
  if (isDryRun) {
    console.log('Dry run mode - not actually executing the script');
    return;
  }
  
  // Execute the script
  const scriptArgs = args.filter(arg => arg !== mode && arg !== '--dry-run');
  const child = isWindows
    ? spawn('cmd.exe', ['/c', scriptPath, ...scriptArgs], { stdio: 'inherit' })
    : spawn(scriptPath, scriptArgs, { stdio: 'inherit' });
  
  child.on('error', (error) => {
    console.error(`Error starting script: ${error.message}`);
    process.exit(1);
  });
  
  child.on('close', (code) => {
    console.log(`Script exited with code ${code}`);
    process.exit(code);
  });
}

// Main execution
loadEnvironment();
ensureLogoFiles();
startScript(); 