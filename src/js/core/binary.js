/**
 * TheoTown Save Editor - Binary Utilities
 * Low-level binary read/write operations
 */

const BinaryUtils = {
    /**
     * Read 4-byte big-endian integer (with bounds check)
     */
    readInt32BE(data, offset) {
        if (!data || offset < 0 || offset + 4 > data.length) return 0;
        return (data[offset] << 24) | (data[offset+1] << 16) | 
               (data[offset+2] << 8) | data[offset+3];
    },

    /**
     * Read 2-byte big-endian integer (with bounds check)
     */
    readInt16BE(data, offset) {
        if (!data || offset < 0 || offset + 2 > data.length) return 0;
        return (data[offset] << 8) | data[offset+1];
    },

    /**
     * Write 4-byte big-endian integer (with bounds check)
     */
    writeInt32BE(data, offset, value) {
        if (!data || offset < 0 || offset + 4 > data.length) return false;
        value = value >>> 0; // Convert to unsigned
        data[offset] = (value >> 24) & 0xFF;
        data[offset+1] = (value >> 16) & 0xFF;
        data[offset+2] = (value >> 8) & 0xFF;
        data[offset+3] = value & 0xFF;
        return true;
    },

    /**
     * Write 2-byte big-endian integer (with bounds check)
     */
    writeInt16BE(data, offset, value) {
        if (!data || offset < 0 || offset + 2 > data.length) return false;
        value = value & 0xFFFF;
        data[offset] = (value >> 8) & 0xFF;
        data[offset+1] = value & 0xFF;
        return true;
    },

    /**
     * Find a byte pattern in data and return offset
     * @param {Uint8Array} data - Binary data to search
     * @param {number[]} pattern - Pattern to find
     * @returns {number} Offset or -1 if not found
     */
    findPattern(data, pattern) {
        outer:
        for (let i = 0; i <= data.length - pattern.length; i++) {
            for (let j = 0; j < pattern.length; j++) {
                if (data[i + j] !== pattern[j]) continue outer;
            }
            return i;
        }
        return -1;
    },

    /**
     * Type byte constants for TheoTown binary format
     */
    TYPE: {
        DOUBLE: 0x07,      // 8 bytes
        INT32: 0x08,       // 4 bytes
        INT16: 0x0e,       // 2 bytes
        INT8: 0x0f,        // 1 byte
        BOOL_TRUE: 0x11,   // No value byte
        BOOL_FALSE: 0x12,  // No value byte
        STRING: 0x16       // Variable length
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BinaryUtils;
}
