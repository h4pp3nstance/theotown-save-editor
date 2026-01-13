# TheoTown Save Editor

🏙️ Web-based editor for TheoTown .city save files

## Features

- **View city info**: Name, size, population, playtime, etc.
- **Edit money**: Modify estate/money values
- **Edit rank**: Change rank level (0-5000)
- **Toggle Uber Mode**: Enable/disable uber mode
- **Edit DSA Supplies**: Modify `_dsarocketprocentage` for DSA integration
- **Moon file support**: Works with moon map files too

## Usage

### Online
Visit the GitHub Pages deployment (after setup).

### Local Development
```bash
# Install dependencies (none required, just Node.js)
npm run dev
# Opens http://localhost:8080
```

### Build
```bash
npm run build
# Output: dist/theotown_web_viewer.html
```

## Project Structure

```
├── src/
│   ├── index.html          # Development HTML
│   ├── css/
│   │   └── styles.css      # All styles
│   └── js/
│       ├── core/
│       │   ├── binary.js   # Binary read/write utilities
│       │   └── parser.js   # File parsing logic
│       ├── editor/
│       │   ├── fields.js   # Binary field detection
│       │   └── city.js     # City data management
│       └── ui/
│           ├── display.js  # UI rendering
│           └── actions.js  # Event handlers
├── dist/
│   └── theotown_web_viewer.html  # Bundled output
├── build.js                # Build script
├── package.json
└── .github/
    └── workflows/
        └── build-deploy.yml  # GitHub Actions
```

## TheoTown Save File Format

### File Structure
```
[2 bytes] Header length (big-endian)
[N bytes] JSON header (UTF-8)
[...rest] GZIP-compressed binary data
```

### Binary Field Format
```
[1 byte]  Field name length
[N bytes] Field name (ASCII)
[1 byte]  Type indicator
[N bytes] Value (if applicable)
```

### Type Bytes
| Byte | Type     | Value Size |
|------|----------|------------|
| 0x07 | double   | 8 bytes    |
| 0x08 | int32    | 4 bytes    |
| 0x0e | int16    | 2 bytes    |
| 0x0f | int8     | 1 byte     |
| 0x11 | bool_true| 0 bytes    |
| 0x12 | bool_false| 0 bytes   |
| 0x16 | string   | 2+N bytes  |

> **Note**: Bool types (0x11/0x12) are implicit - the type byte IS the value.

## GitHub Pages Deployment

1. Push to `main` or `master` branch
2. GitHub Actions will build and deploy automatically
3. Enable Pages in repository settings (use GitHub Actions as source)

## License

MIT
