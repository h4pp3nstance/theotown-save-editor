/**
 * TheoTown Save Editor - File Parser
 * Handles .city file format parsing and serialization
 */

const FileParser = {
    /**
     * Parse a .city file
     * @param {ArrayBuffer} buffer - Raw file data
     * @returns {Object} Parsed city data with header and binary
     */
    async parse(buffer) {
        const data = new Uint8Array(buffer);
        
        // Parse header length (big-endian 2 bytes)
        const headerLen = (data[0] << 8) | data[1];
        
        // Parse JSON header
        const headerBytes = data.slice(2, 2 + headerLen);
        const headerText = new TextDecoder('utf-8').decode(headerBytes);
        const header = JSON.parse(headerText);
        
        // Decompress binary data using pako
        const compressedData = data.slice(2 + headerLen);
        let binaryData;
        try {
            binaryData = pako.ungzip(compressedData);
        } catch (e) {
            throw new Error('Error decompressing file: ' + e.message);
        }
        
        // Convert to mutable Uint8Array
        binaryData = new Uint8Array(binaryData);
        
        return {
            header: header,
            binaryData: binaryData,
            originalHeader: JSON.parse(JSON.stringify(header)),
            originalBinary: new Uint8Array(binaryData)
        };
    },

    /**
     * Serialize city data back to .city file format
     * @param {Object} cityData - City data with header and binaryData
     * @returns {Uint8Array} Serialized file data
     */
    serialize(cityData) {
        // Update timestamp and save counter
        cityData.header['last modified'] = Date.now();
        cityData.header['save counter'] = (cityData.header['save counter'] || 0) + 1;
        
        // Encode header
        const headerStr = JSON.stringify(cityData.header);
        const headerBytes = new TextEncoder().encode(headerStr);
        const headerLen = headerBytes.length;
        
        // Compress binary data
        const compressedBinary = pako.gzip(cityData.binaryData);
        
        // Build file
        const fileData = new Uint8Array(2 + headerLen + compressedBinary.length);
        fileData[0] = (headerLen >> 8) & 0xFF;
        fileData[1] = headerLen & 0xFF;
        fileData.set(headerBytes, 2);
        fileData.set(compressedBinary, 2 + headerLen);
        
        return fileData;
    },

    /**
     * Get file info for display
     * @param {Object} header - Parsed header
     * @returns {Object} Formatted file info
     */
    getFileInfo(header) {
        return {
            name: header.name || '(Unnamed)',
            size: `${header.width}x${header.height}`,
            gamemode: header.gamemode || 'UNKNOWN',
            version: header.version || 'Unknown',
            money: header.money || 0,
            population: header.habitants || 0,
            rank: header['rank lvl'] || 0,
            uber: header.uber === true,
            playtime: header.info?.playtime || 0,
            saves: header['save counter'] || 0,
            lastModified: header['last modified']
        };
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileParser;
}
