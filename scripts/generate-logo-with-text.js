const fs = require('fs');
const path = require('path');
const { createCanvas, registerFont } = require('canvas');

// Create directory for logos if it doesn't exist
const logoDir = path.join(__dirname, '../public/logos');
if (!fs.existsSync(logoDir)) {
  fs.mkdirSync(logoDir, { recursive: true });
}

// Try to register a system font (fallback to sans-serif if not available)
try {
  // On macOS, try to use SF Pro
  registerFont('/System/Library/Fonts/SFCompactDisplay-Bold.otf', { family: 'SFPro', weight: 'bold' });
} catch (e) {
  console.log('Could not register system font, will use default sans-serif');
}

// Sizes to generate (in pixels) - width x height
const sizes = [
  { width: 200, height: 60 },
  { width: 400, height: 120 },
  { width: 800, height: 240 },
];

// Function to draw the Pulse logo with text
function drawLogoWithText(ctx, width, height) {
  const logoSize = height * 0.9;
  const logoX = height * 0.05;
  const logoY = height * 0.05;
  const center = logoSize / 2;
  const radius = logoSize / 2;
  
  // Draw the logo
  // Background circle with gradient
  const bgGradient = ctx.createLinearGradient(logoX, logoY, logoX + logoSize, logoY + logoSize);
  bgGradient.addColorStop(0, 'rgba(58, 123, 213, 0.8)'); // #3a7bd5 with opacity
  bgGradient.addColorStop(1, 'rgba(58, 123, 213, 0.7)');
  
  ctx.fillStyle = bgGradient;
  ctx.beginPath();
  ctx.arc(logoX + center, logoY + center, radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Outer ring gradient
  const ringGradient = ctx.createLinearGradient(logoX, logoY, logoX + logoSize, logoY + logoSize);
  ringGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
  ringGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
  
  ctx.fillStyle = ringGradient;
  ctx.beginPath();
  ctx.arc(logoX + center, logoY + center, radius * 0.95, 0, Math.PI * 2);
  ctx.fill();
  
  // Pulse ring (static representation)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = logoSize * 0.06;
  ctx.beginPath();
  ctx.arc(logoX + center, logoY + center, radius * 0.7, 0, Math.PI * 2);
  ctx.stroke();
  
  // Center dot with gradient
  const centerGradient = ctx.createLinearGradient(
    logoX + center - radius * 0.3, 
    logoY + center - radius * 0.3, 
    logoX + center + radius * 0.3, 
    logoY + center + radius * 0.3
  );
  centerGradient.addColorStop(0, '#ffffff');
  centerGradient.addColorStop(1, '#f0f0f0');
  
  // Add glow to center dot
  ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
  ctx.shadowBlur = logoSize * 0.1;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  ctx.fillStyle = centerGradient;
  ctx.beginPath();
  ctx.arc(logoX + center, logoY + center, radius * 0.3, 0, Math.PI * 2);
  ctx.fill();
  
  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  
  // Draw text
  const textX = logoX + logoSize + (logoSize * 0.2);
  const textY = height / 2 + (height * 0.1);
  const fontSize = height * 0.5;
  
  ctx.font = `bold ${fontSize}px "SFPro", sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText('Pulse', textX, textY);
}

// Generate logos for each size
sizes.forEach(size => {
  const canvas = createCanvas(size.width, size.height);
  const ctx = canvas.getContext('2d');
  
  // Fill with transparent background
  ctx.clearRect(0, 0, size.width, size.height);
  
  // Draw the logo with text
  drawLogoWithText(ctx, size.width, size.height);
  
  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(logoDir, `pulse-logo-with-text-${size.width}x${size.height}.png`), buffer);
  
  console.log(`Generated ${size.width}x${size.height} logo with text`);
});

console.log('Logo with text generation complete!'); 