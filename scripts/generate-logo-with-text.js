const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

// Register the font
const fontPath = path.join(__dirname, '..', 'assets', 'fonts', 'Roboto-Bold.ttf');
registerFont(fontPath, { family: 'Roboto' });

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, '..', 'public', 'images');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create canvas
const width = 800;
const height = 200;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Set background
ctx.fillStyle = '#1a1a1a';
ctx.fillRect(0, 0, width, height);

// Draw pulse wave
ctx.strokeStyle = '#00ff00';
ctx.lineWidth = 10;
ctx.beginPath();

const amplitude = 40;
const frequency = 2 * Math.PI / width;

for (let x = 0; x < width; x++) {
  const y = height/2 + amplitude * Math.sin(frequency * x);
  if (x === 0) {
    ctx.moveTo(x, y);
  } else {
    ctx.lineTo(x, y);
  }
}

ctx.stroke();

// Add text
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 48px Roboto';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('Pulse', width/2, height/2);

// Save the image
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(path.join(outputDir, 'logo-with-text.png'), buffer);
console.log('Generated logo-with-text.png'); 