/**
 * Cross-platform script to clean up development processes
 * This script stops any running Docker containers with "pulse" in their name
 * and kills any processes using the development ports
 */

const { execSync } = require('child_process');
const os = require('os');

console.log('Cleaning up development environment...');

// Stop Docker containers
try {
  console.log('Stopping any running Pulse Docker containers...');
  if (os.platform() === 'win32') {
    // Windows command
    execSync('for /f "tokens=*" %i in (\'docker ps -q --filter "name=pulse"\') do docker stop %i', { stdio: 'inherit' });
  } else {
    // Unix command
    execSync('docker ps -q --filter "name=pulse" | xargs -r docker stop', { stdio: 'inherit' });
  }
} catch (error) {
  console.log('No Docker containers to stop or Docker is not installed.');
}

// Kill processes using the development ports
try {
  console.log('Killing processes using development ports...');
  
  // Backend ports
  try {
    execSync('npx kill-port 7654 7656', { stdio: 'inherit' });
  } catch (error) {
    console.log('No processes using backend ports.');
  }
  
  // Frontend ports
  try {
    execSync('npx kill-port 7654 9513', { stdio: 'inherit' });
  } catch (error) {
    console.log('No processes using frontend ports.');
  }
} catch (error) {
  console.log('Error killing port processes:', error.message);
}

console.log('Cleanup complete. Ready to start development environment.'); 