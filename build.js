#!/usr/bin/env node
/**
 * TheoTown Save Editor - Build Script
 * Bundles all modules into a single HTML file for deployment
 * 
 * Usage: node build.js
 * Output: dist/theotown_web_viewer.html
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
const DIST_DIR = path.join(__dirname, 'dist');

// File paths
const files = {
    css: path.join(SRC_DIR, 'css', 'styles.css'),
    js: [
        path.join(SRC_DIR, 'js', 'core', 'binary.js'),
        path.join(SRC_DIR, 'js', 'core', 'parser.js'),
        path.join(SRC_DIR, 'js', 'core', 'validator.js'),
        path.join(SRC_DIR, 'js', 'core', 'backup.js'),
        path.join(SRC_DIR, 'js', 'core', 'history.js'),
        path.join(SRC_DIR, 'js', 'editor', 'fields.js'),
        path.join(SRC_DIR, 'js', 'editor', 'city.js'),
        path.join(SRC_DIR, 'js', 'ui', 'display.js'),
        path.join(SRC_DIR, 'js', 'ui', 'actions.js')
    ],
    html: path.join(SRC_DIR, 'index.html')
};

// Build configuration
const VERSION = '3.0.1';
const BUILD_DATE = new Date().toISOString().split('T')[0];

console.log('🏗️  Building TheoTown Save Editor...');
console.log(`   Version: ${VERSION}`);
console.log(`   Date: ${BUILD_DATE}`);

// Read all source files
function readFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (err) {
        console.error(`❌ Error reading ${filePath}: ${err.message}`);
        process.exit(1);
    }
}

// Read CSS
console.log('\n📦 Bundling CSS...');
const css = readFile(files.css);
console.log(`   ✓ styles.css (${css.length} bytes)`);

// Read and concatenate JS
console.log('\n📦 Bundling JavaScript...');
let js = '';
for (const jsFile of files.js) {
    if (!fs.existsSync(jsFile)) {
        console.log(`   ⚠ ${path.basename(jsFile)} not found, skipping`);
        continue;
    }
    const content = readFile(jsFile);
    const filename = path.basename(jsFile);
    js += `\n// === ${filename} ===\n`;
    // Remove module.exports lines for browser
    js += content.replace(/if \(typeof module.*\n.*\n\}/g, '');
    console.log(`   ✓ ${filename} (${content.length} bytes)`);
}

// Read HTML template
console.log('\n📦 Processing HTML...');
let html = readFile(files.html);

// Replace external CSS link with inline styles
html = html.replace(
    /<link rel="stylesheet" href="css\/styles\.css">/,
    `<style>\n${css}\n    </style>`
);

// Remove all external script tags for our JS files
html = html.replace(/<script src="js\/core\/binary\.js"><\/script>\s*/g, '');
html = html.replace(/<script src="js\/core\/parser\.js"><\/script>\s*/g, '');
html = html.replace(/<script src="js\/core\/validator\.js"><\/script>\s*/g, '');
html = html.replace(/<script src="js\/core\/backup\.js"><\/script>\s*/g, '');
html = html.replace(/<script src="js\/core\/history\.js"><\/script>\s*/g, '');
html = html.replace(/<script src="js\/editor\/fields\.js"><\/script>\s*/g, '');
html = html.replace(/<script src="js\/editor\/city\.js"><\/script>\s*/g, '');
html = html.replace(/<script src="js\/ui\/display\.js"><\/script>\s*/g, '');
html = html.replace(/<script src="js\/ui\/actions\.js"><\/script>\s*/g, '');

// Insert bundled JS before the DOMContentLoaded script
html = html.replace(
    /<script>\s*document\.addEventListener\('DOMContentLoaded'/,
    `<script>\n${js}\n    </script>\n    \n    <script>\n        document.addEventListener('DOMContentLoaded'`
);

const bundledHtml = html;

// Ensure dist directory exists
if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
}

// Write bundled file
const outputPath = path.join(DIST_DIR, 'theotown_web_viewer.html');
fs.writeFileSync(outputPath, bundledHtml);

// Also write as index.html for GitHub Pages
const indexPath = path.join(DIST_DIR, 'index.html');
fs.writeFileSync(indexPath, bundledHtml);

const stats = fs.statSync(outputPath);
console.log(`\n✅ Build complete!`);
console.log(`   Output: ${outputPath}`);
console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
console.log(`\n🚀 Ready for deployment!`);
