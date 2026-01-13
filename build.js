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
        path.join(SRC_DIR, 'js', 'editor', 'fields.js'),
        path.join(SRC_DIR, 'js', 'editor', 'city.js'),
        path.join(SRC_DIR, 'js', 'ui', 'display.js'),
        path.join(SRC_DIR, 'js', 'ui', 'actions.js')
    ],
    html: path.join(SRC_DIR, 'index.html')
};

// Build configuration
const VERSION = '3.0';
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

// Build the bundled HTML
const bundledHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TheoTown Save Editor</title>
    <!-- pako for gzip compression -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js"></script>
    <style>
${css}
    </style>
</head>
<body>
    <div class="container">
        <h1>🏙️ TheoTown Save Editor</h1>
        <p class="version">v${VERSION} - Built ${BUILD_DATE}</p>
        
        <div id="error"></div>
        <div id="success"></div>
        <div id="changesIndicator">⚠️ You have unsaved changes</div>
        
        <div id="loader">
            <div class="spinner"></div>
            <p>Loading city data...</p>
        </div>
        
        <!-- File Selection -->
        <div id="fileInfo" id="dropZone">
            <h2>📂 Select a City File</h2>
            <p>Choose a .city file from your TheoTown save folder<br>
            <small>Supports regular cities and moon files</small></p>
            <label class="file-label">
                <input type="file" id="fileInput" accept=".city">
                Browse Files
            </label>
            <p style="margin-top: 20px; font-size: 0.9em;">
                Or drag and drop a .city file here
            </p>
        </div>
        
        <!-- Editor Panel -->
        <div id="editor">
            <!-- City Info -->
            <div class="panel">
                <h2>📋 City Information</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <label>City Name</label>
                        <span id="cityName">-</span>
                    </div>
                    <div class="info-item">
                        <label>Size</label>
                        <span id="citySize">-</span>
                    </div>
                    <div class="info-item">
                        <label>Version</label>
                        <span id="cityVersion">-</span>
                    </div>
                    <div class="info-item">
                        <label>Game Mode</label>
                        <span id="cityGamemode">-</span>
                    </div>
                    <div class="info-item">
                        <label>Population</label>
                        <span id="cityPopulation">-</span>
                    </div>
                    <div class="info-item">
                        <label>Playtime</label>
                        <span id="cityPlaytime">-</span>
                    </div>
                    <div class="info-item">
                        <label>Save Count</label>
                        <span id="citySaves">-</span>
                    </div>
                    <div class="info-item">
                        <label>Last Modified</label>
                        <span id="cityLastModified">-</span>
                    </div>
                </div>
            </div>
            
            <!-- Header Editor -->
            <div class="panel">
                <h2>📝 Header Values</h2>
                <table class="edit-table">
                    <tr>
                        <th>Field</th>
                        <th>Value</th>
                        <th>Note</th>
                    </tr>
                    <tr>
                        <td>Money</td>
                        <td><input type="number" id="headerMoney" min="0"></td>
                        <td>JSON header value</td>
                    </tr>
                    <tr>
                        <td>Rank Level</td>
                        <td><input type="number" id="headerRank" min="0" max="5000"></td>
                        <td>0-5000</td>
                    </tr>
                </table>
            </div>
            
            <!-- Binary Editor -->
            <div class="panel">
                <h2>🔧 Binary Values</h2>
                <table class="edit-table">
                    <tr>
                        <th>Field</th>
                        <th>Value</th>
                        <th>Offset</th>
                        <th>Action</th>
                    </tr>
                    <tr id="binaryEstateRow">
                        <td>Estate (Money)</td>
                        <td><input type="number" id="binaryEstate" min="0"></td>
                        <td class="offset" id="estateOffset">-</td>
                        <td></td>
                    </tr>
                    <tr id="binaryRankRow">
                        <td>Rank Level</td>
                        <td><input type="number" id="binaryRank" min="0" max="5000"></td>
                        <td class="offset" id="rankOffset">-</td>
                        <td></td>
                    </tr>
                    <tr id="uberRow">
                        <td>Uber Mode</td>
                        <td><span id="uberStatus" class="status-off">OFF</span></td>
                        <td class="offset" id="uberOffset">-</td>
                        <td><button class="btn btn-small btn-warning" id="toggleUberBtn">Toggle</button></td>
                    </tr>
                    <tr id="gamemodeRow">
                        <td>Gamemode</td>
                        <td><span id="gamemodeValue" class="readonly">-</span></td>
                        <td class="offset" id="gamemodeOffset">-</td>
                        <td><span class="readonly">(read-only)</span></td>
                    </tr>
                    <tr id="dsaRow">
                        <td>DSA Supplies</td>
                        <td><input type="number" id="dsaSupplies" min="0" max="32767"></td>
                        <td class="offset" id="dsaOffset">-</td>
                        <td>
                            <span class="tooltip">ℹ️
                                <span class="tooltip-text">_dsarocketprocentage - Max: 32767</span>
                            </span>
                        </td>
                    </tr>
                </table>
            </div>
            
            <!-- Actions -->
            <div class="panel">
                <h2>💾 Actions</h2>
                <div class="actions">
                    <button class="btn btn-primary" id="saveBtn">💾 Save File</button>
                    <button class="btn btn-secondary" id="resetBtn">🔄 Reset Changes</button>
                    <button class="btn btn-secondary" id="closeBtn">❌ Close</button>
                </div>
            </div>
        </div>
    </div>
    
    <script>
${js}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    Actions.init();
});
    </script>
</body>
</html>`;

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
