/**
 * Script to clear persisted data files when switching between environments
 * This script is called by the start-dev.sh and start-prod.sh scripts
 */

const fs = require('fs');
const path = require('path');

// Directories to clear
const dataDirs = [
  'data',
  'logs',
  'tmp'
];

// Function to clear a directory
function clearDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory ${dirPath} does not exist, creating it...`);
    fs.mkdirSync(dirPath, { recursive: true });
    return;
  }
  
  try {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Skip .git and node_modules directories
        if (file !== '.git' && file !== 'node_modules') {
          clearDirectory(filePath);
        }
      } else {
        // Delete the file
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${filePath}`);
      }
    }
    
    console.log(`Cleared directory: ${dirPath}`);
  } catch (error) {
    console.error(`Error clearing directory ${dirPath}:`, error.message);
  }
}

// Main function
function clearData() {
  console.log('Clearing persisted data files...');
  
  // Get the project root directory
  const rootDir = path.resolve(__dirname, '..');
  
  // Clear each directory
  for (const dir of dataDirs) {
    const dirPath = path.join(rootDir, dir);
    clearDirectory(dirPath);
  }
  
  console.log('Data clearing complete.');
}

// Run the script if called directly
if (require.main === module) {
  clearData();
}

// Export for use in other scripts
module.exports = clearData; 