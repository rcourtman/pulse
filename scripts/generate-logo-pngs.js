const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Create directory for logos if it doesn't exist
const logoDir = path.join(__dirname, '../public/logos');
if (!fs.existsSync(logoDir)) {
  fs.mkdirSync(logoDir, { recursive: true });
}

// Sizes to generate (in pixels)
const sizes = [16, 32, 64, 128, 256, 512, 1024];

// Function to draw the Pulse logo
function drawLogo(ctx, size) {
  const center = size / 2;
  const radius = size / 2;
  
  // Background circle with gradient
  const bgGradient = ctx.createLinearGradient(0, 0, size, size);
  bgGradient.addColorStop(0, 'rgba(58, 123, 213, 0.8)'); // #3a7bd5 with opacity
  bgGradient.addColorStop(1, 'rgba(58, 123, 213, 0.7)');
  
  ctx.fillStyle = bgGradient;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Outer ring gradient
  const ringGradient = ctx.createLinearGradient(0, 0, size, size);
  ringGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
  ringGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
  
  ctx.fillStyle = ringGradient;
  ctx.beginPath();
  ctx.arc(center, center, radius * 0.95, 0, Math.PI * 2);
  ctx.fill();
  
  // Pulse ring (static representation)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = size * 0.06;
  ctx.beginPath();
  ctx.arc(center, center, radius * 0.7, 0, Math.PI * 2);
  ctx.stroke();
  
  // Center dot with gradient
  const centerGradient = ctx.createLinearGradient(
    center - radius * 0.3, 
    center - radius * 0.3, 
    center + radius * 0.3, 
    center + radius * 0.3
  );
  centerGradient.addColorStop(0, '#ffffff');
  centerGradient.addColorStop(1, '#f0f0f0');
  
  // Add glow to center dot
  ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
  ctx.shadowBlur = size * 0.1;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  ctx.fillStyle = centerGradient;
  ctx.beginPath();
  ctx.arc(center, center, radius * 0.3, 0, Math.PI * 2);
  ctx.fill();
  
  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

// Generate logos for each size
sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Draw the logo
  drawLogo(ctx, size);
  
  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(logoDir, `pulse-logo-${size}x${size}.png`), buffer);
  
  console.log(`Generated ${size}x${size} logo`);
});

console.log('Logo generation complete!'); 