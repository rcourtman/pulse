const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, '..', 'public', 'images');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate different sizes of the logo
const sizes = [16, 32, 64, 128, 256, 512];

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Set background
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, size, size);

  // Draw pulse wave
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = size * 0.1;
  ctx.beginPath();
  
  const amplitude = size * 0.3;
  const frequency = 2 * Math.PI / size;
  
  for (let x = 0; x < size; x++) {
    const y = size/2 + amplitude * Math.sin(frequency * x);
    if (x === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  
  ctx.stroke();

  // Save the image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(outputDir, `logo-${size}.png`), buffer);
  console.log(`Generated logo-${size}.png`);
}); 