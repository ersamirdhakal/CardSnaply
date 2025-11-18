const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const assetsDir = path.join(__dirname, 'assets');

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

// CardSnaply brand colors
const primaryColor = '#2563EB';
const primaryDark = '#1D4ED8';
const white = '#FFFFFF';

async function generateIcon() {
    const svg = `
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <rect width="1024" height="1024" fill="${primaryColor}" rx="200"/>
        <circle cx="512" cy="380" r="180" fill="${white}" opacity="0.2"/>
        <rect x="262" y="480" width="500" height="320" rx="40" fill="${white}" opacity="0.9"/>
        <rect x="322" y="540" width="380" height="40" rx="20" fill="${primaryColor}"/>
        <rect x="322" y="620" width="380" height="40" rx="20" fill="${primaryColor}"/>
        <rect x="322" y="700" width="280" height="40" rx="20" fill="${primaryColor}"/>
    </svg>
    `;
    
    await sharp(Buffer.from(svg))
        .png()
        .toFile(path.join(assetsDir, 'icon.png'));
    console.log('✓ Generated icon.png (1024x1024)');
}

async function generateSplash() {
    const svg = `
    <svg width="2048" height="2048" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:1" />
                <stop offset="100%" style="stop-color:${primaryDark};stop-opacity:1" />
            </linearGradient>
        </defs>
        <rect width="2048" height="2048" fill="url(#grad)"/>
        <g transform="translate(1024, 800)">
            <circle cx="0" cy="0" r="360" fill="${white}" opacity="0.2"/>
            <rect x="-500" y="200" width="1000" height="640" rx="80" fill="${white}" opacity="0.9"/>
            <rect x="-380" y="380" width="760" height="80" rx="40" fill="${primaryColor}"/>
            <rect x="-380" y="520" width="760" height="80" rx="40" fill="${primaryColor}"/>
            <rect x="-380" y="660" width="560" height="80" rx="40" fill="${primaryColor}"/>
        </g>
        <text x="1024" y="1400" font-family="Arial, sans-serif" font-size="180" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">CardSnaply</text>
        <text x="1024" y="1620" font-family="Arial, sans-serif" font-size="90" fill="white" text-anchor="middle" dominant-baseline="middle">Snap. Scan. Save.</text>
    </svg>
    `;
    
    await sharp(Buffer.from(svg))
        .png()
        .toFile(path.join(assetsDir, 'splash.png'));
    console.log('✓ Generated splash.png (2048x2048)');
}

async function generateAdaptiveIcon() {
    const svg = `
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <rect width="1024" height="1024" fill="${primaryColor}" rx="200"/>
        <circle cx="512" cy="380" r="180" fill="${white}" opacity="0.2"/>
        <rect x="262" y="480" width="500" height="320" rx="40" fill="${white}" opacity="0.9"/>
        <rect x="322" y="540" width="380" height="40" rx="20" fill="${primaryColor}"/>
        <rect x="322" y="620" width="380" height="40" rx="20" fill="${primaryColor}"/>
        <rect x="322" y="700" width="280" height="40" rx="20" fill="${primaryColor}"/>
    </svg>
    `;
    
    await sharp(Buffer.from(svg))
        .png()
        .toFile(path.join(assetsDir, 'adaptive-icon.png'));
    console.log('✓ Generated adaptive-icon.png (1024x1024)');
}

async function generateFavicon() {
    const svg = `
    <svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" fill="${primaryColor}" rx="8"/>
        <rect x="12" y="22" width="24" height="18" rx="2" fill="${white}" opacity="0.9"/>
        <rect x="15" y="25" width="18" height="2" rx="1" fill="${primaryColor}"/>
        <rect x="15" y="30" width="18" height="2" rx="1" fill="${primaryColor}"/>
        <rect x="15" y="35" width="12" height="2" rx="1" fill="${primaryColor}"/>
    </svg>
    `;
    
    await sharp(Buffer.from(svg))
        .png()
        .toFile(path.join(assetsDir, 'favicon.png'));
    console.log('✓ Generated favicon.png (48x48)');
}

async function generateAll() {
    try {
        console.log('Generating CardSnaply assets...\n');
        await generateIcon();
        await generateSplash();
        await generateAdaptiveIcon();
        await generateFavicon();
        console.log('\n✅ All assets generated successfully in assets/ folder!');
    } catch (error) {
        console.error('Error generating assets:', error);
        process.exit(1);
    }
}

generateAll();

