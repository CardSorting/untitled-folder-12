const fs = require('fs');
const path = require('path');

// Create dist directory if it doesn't exist
const distDir = path.resolve(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Copy manifest.json
fs.copyFileSync(
    path.resolve(__dirname, '../manifest.json'),
    path.resolve(distDir, 'manifest.json')
);

// Copy icons directory if it exists
const iconsDir = path.resolve(__dirname, '../icons');
const distIconsDir = path.resolve(distDir, 'icons');
if (fs.existsSync(iconsDir)) {
    if (!fs.existsSync(distIconsDir)) {
        fs.mkdirSync(distIconsDir, { recursive: true });
    }
    const icons = fs.readdirSync(iconsDir);
    icons.forEach(icon => {
        fs.copyFileSync(
            path.resolve(iconsDir, icon),
            path.resolve(distIconsDir, icon)
        );
    });
}

console.log('Static files copied successfully!');
