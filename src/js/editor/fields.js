/**
 * TheoTown Save Editor - Binary Field Detection & Manipulation
 * Handles finding and editing binary fields in city data
 */

const BinaryFields = {
    // Field name constants
    FIELD_NAMES: {
        ESTATE: 'estate',
        RANK: 'rank lvl',
        UBER: 'uber',
        GAMEMODE: 'gamemode',
        DSA_SUPPLIES: '_dsarocketprocentage',
        NAME: 'name'
    },

    // Gamemode options
    GAMEMODES: ['EASY', 'NORMAL', 'HARD', 'SANDBOX'],

    // Max rank level
    MAX_RANK: 64,

    /**
     * Find a binary field by name
     * @param {Uint8Array} data - Binary data
     * @param {string} fieldName - Field name to find
     * @returns {Object|null} Field info with nameOffset, typeOffset, valueOffset, type
     */
    findField(data, fieldName) {
        const pattern = new TextEncoder().encode(fieldName);
        
        for (let i = 0; i < data.length - pattern.length - 2; i++) {
            // Check length byte
            if (data[i] !== pattern.length) continue;
            
            // Check field name
            let match = true;
            for (let j = 0; j < pattern.length; j++) {
                if (data[i + 1 + j] !== pattern[j]) {
                    match = false;
                    break;
                }
            }
            
            if (match) {
                const typeOffset = i + 1 + pattern.length;
                const typeByte = data[typeOffset];
                
                // Determine value offset based on type
                let valueOffset = typeOffset + 1;
                
                // Bool types (0x11, 0x12) have NO value byte - the type IS the value
                if (typeByte === 0x11 || typeByte === 0x12) {
                    valueOffset = typeOffset; // Value is the type byte itself
                }
                
                return {
                    nameOffset: i,
                    typeOffset: typeOffset,
                    valueOffset: valueOffset,
                    type: typeByte,
                    fieldName: fieldName
                };
            }
        }
        
        return null;
    },

    /**
     * Find all relevant fields in binary data
     * @param {Uint8Array} data - Binary data
     * @returns {Object} Map of field names to field info
     */
    findAllFields(data) {
        const fields = {};
        
        for (const [key, name] of Object.entries(this.FIELD_NAMES)) {
            const field = this.findField(data, name);
            if (field) {
                fields[key] = field;
            }
        }
        
        return fields;
    },

    /**
     * Read estate (money) value
     * @param {Uint8Array} data - Binary data
     * @param {Object} field - Field info from findField
     * @returns {number|null} Estate value
     */
    readEstate(data, field) {
        if (!field) return null;
        
        if (field.type === 0x07) {
            // Double (8 bytes, big-endian)
            const bytes = data.slice(field.valueOffset, field.valueOffset + 8);
            const view = new DataView(bytes.buffer);
            return view.getFloat64(0, false);
        } else if (field.type === 0x08) {
            // Int32 (4 bytes, big-endian)
            return (data[field.valueOffset] << 24) |
                   (data[field.valueOffset + 1] << 16) |
                   (data[field.valueOffset + 2] << 8) |
                   data[field.valueOffset + 3];
        }
        return null;
    },

    /**
     * Write estate (money) value
     * @param {Uint8Array} data - Binary data (modified in place)
     * @param {Object} field - Field info from findField
     * @param {number} value - New value
     */
    writeEstate(data, field, value) {
        if (!field) return;
        
        if (field.type === 0x07) {
            // Double (8 bytes, big-endian)
            const buffer = new ArrayBuffer(8);
            const view = new DataView(buffer);
            view.setFloat64(0, value, false);
            const bytes = new Uint8Array(buffer);
            for (let i = 0; i < 8; i++) {
                data[field.valueOffset + i] = bytes[i];
            }
        } else if (field.type === 0x08) {
            // Int32 (4 bytes, big-endian)
            value = Math.max(0, Math.min(2147483647, Math.floor(value)));
            data[field.valueOffset] = (value >> 24) & 0xFF;
            data[field.valueOffset + 1] = (value >> 16) & 0xFF;
            data[field.valueOffset + 2] = (value >> 8) & 0xFF;
            data[field.valueOffset + 3] = value & 0xFF;
        }
    },

    /**
     * Read rank value
     * @param {Uint8Array} data - Binary data
     * @param {Object} field - Field info from findField
     * @returns {number|null} Rank value
     */
    readRank(data, field) {
        if (!field) return null;
        
        if (field.type === 0x0e) {
            // Int16 (2 bytes)
            return (data[field.valueOffset] << 8) | data[field.valueOffset + 1];
        } else if (field.type === 0x0f) {
            // Int8 (1 byte)
            return data[field.valueOffset];
        }
        return null;
    },

    /**
     * Write rank value
     * @param {Uint8Array} data - Binary data (modified in place)
     * @param {Object} field - Field info from findField
     * @param {number} value - New value (0-64)
     */
    writeRank(data, field, value) {
        if (!field) return;
        
        value = Math.max(0, Math.min(this.MAX_RANK, value));
        
        if (field.type === 0x0e) {
            // Int16 (2 bytes)
            data[field.valueOffset] = (value >> 8) & 0xFF;
            data[field.valueOffset + 1] = value & 0xFF;
        } else if (field.type === 0x0f) {
            // Int8 (1 byte)
            data[field.valueOffset] = value & 0xFF;
        }
    },

    /**
     * Read uber mode value
     * @param {Uint8Array} data - Binary data
     * @param {Object} field - Field info from findField
     * @returns {boolean|null} Uber mode value
     */
    readUber(data, field) {
        if (!field) return null;
        // 0x11 = TRUE, 0x12 = FALSE
        return field.type === 0x11;
    },

    /**
     * Write uber mode value (toggle)
     * @param {Uint8Array} data - Binary data (modified in place)
     * @param {Object} field - Field info from findField
     * @param {boolean} value - New value
     */
    writeUber(data, field, value) {
        if (!field) return;
        // Just change the type byte: 0x11 = TRUE, 0x12 = FALSE
        data[field.typeOffset] = value ? 0x11 : 0x12;
    },

    /**
     * Read gamemode value (string)
     * @param {Uint8Array} data - Binary data
     * @param {Object} field - Field info from findField
     * @returns {string|null} Gamemode string
     */
    readGamemode(data, field) {
        if (!field || field.type !== 0x16) return null; // Must be string
        
        // String format: [type][length_int16_BE][string_bytes]
        const strLen = (data[field.valueOffset] << 8) | data[field.valueOffset + 1];
        const strBytes = data.slice(field.valueOffset + 2, field.valueOffset + 2 + strLen);
        return new TextDecoder('utf-8').decode(strBytes);
    },

    /**
     * Read DSA supplies value
     * @param {Uint8Array} data - Binary data
     * @param {Object} field - Field info from findField
     * @returns {number|null} DSA supplies value
     */
    readDsaSupplies(data, field) {
        if (!field || field.type !== 0x0e) return null; // Must be int16
        return (data[field.valueOffset] << 8) | data[field.valueOffset + 1];
    },

    /**
     * Write DSA supplies value
     * @param {Uint8Array} data - Binary data (modified in place)
     * @param {Object} field - Field info from findField
     * @param {number} value - New value (0-32767)
     */
    writeDsaSupplies(data, field, value) {
        if (!field || field.type !== 0x0e) return;
        
        value = Math.max(0, Math.min(32767, value));
        data[field.valueOffset] = (value >> 8) & 0xFF;
        data[field.valueOffset + 1] = value & 0xFF;
    },

    /**
     * Write gamemode value (handles variable length strings)
     * @param {Uint8Array} data - Binary data
     * @param {Object} field - Field info from findField
     * @param {string} newGamemode - New gamemode string
     * @returns {Uint8Array|null} New binary data array (or null on failure)
     */
    writeGamemode(data, field, newGamemode) {
        if (!field || field.type !== 0x16) return null;
        
        // Validate gamemode
        if (!this.GAMEMODES.includes(newGamemode)) return null;
        
        // Read current string length
        const currentLen = (data[field.valueOffset] << 8) | data[field.valueOffset + 1];
        const newLen = newGamemode.length;
        const lenDiff = newLen - currentLen;
        
        // Encode new gamemode
        const newGamemodeBytes = new TextEncoder().encode(newGamemode);
        
        if (lenDiff === 0) {
            // Same length - simple replace in-place
            for (let i = 0; i < newLen; i++) {
                data[field.valueOffset + 2 + i] = newGamemodeBytes[i];
            }
            return data;
        } else {
            // Different length - need to rebuild the array
            const beforeString = data.slice(0, field.valueOffset);
            const afterString = data.slice(field.valueOffset + 2 + currentLen);
            
            // Build new data
            const newData = new Uint8Array(data.length + lenDiff);
            let offset = 0;
            
            // Copy before
            newData.set(beforeString, offset);
            offset += beforeString.length;
            
            // Write new length
            newData[offset] = (newLen >> 8) & 0xFF;
            newData[offset + 1] = newLen & 0xFF;
            offset += 2;
            
            // Write new string
            newData.set(newGamemodeBytes, offset);
            offset += newLen;
            
            // Copy after
            newData.set(afterString, offset);
            
            return newData;
        }
    },

    /**
     * Read city name value
     * @param {Uint8Array} data - Binary data
     * @param {Object} field - Field info from findField
     * @returns {string|null} City name string
     */
    readName(data, field) {
        if (!field || field.type !== 0x16) return null; // Must be string
        
        // String format: [type][length_int16_BE][string_bytes]
        const strLen = (data[field.valueOffset] << 8) | data[field.valueOffset + 1];
        const strBytes = data.slice(field.valueOffset + 2, field.valueOffset + 2 + strLen);
        return new TextDecoder('utf-8').decode(strBytes);
    },

    /**
     * Write city name value (replaces string, handles length difference)
     * @param {Uint8Array} data - Binary data
     * @param {Object} field - Field info from findField
     * @param {string} newName - New city name
     * @returns {Uint8Array|null} New binary data array (or null on failure)
     */
    writeName(data, field, newName) {
        if (!field || field.type !== 0x16) return null;
        
        // Limit name length to prevent issues
        if (newName.length > 255) {
            newName = newName.substring(0, 255);
        }
        
        // Read current string length
        const currentLen = (data[field.valueOffset] << 8) | data[field.valueOffset + 1];
        const newLen = newName.length;
        const lenDiff = newLen - currentLen;
        
        // Encode new name
        const newNameBytes = new TextEncoder().encode(newName);
        
        if (lenDiff === 0) {
            // Same length - simple replace
            for (let i = 0; i < newLen; i++) {
                data[field.valueOffset + 2 + i] = newNameBytes[i];
            }
            return data;
        } else {
            // Different length - need to rebuild the array
            const beforeString = data.slice(0, field.valueOffset);
            const afterString = data.slice(field.valueOffset + 2 + currentLen);
            
            // Build new data
            const newData = new Uint8Array(data.length + lenDiff);
            let offset = 0;
            
            // Copy before
            newData.set(beforeString, offset);
            offset += beforeString.length;
            
            // Write new length
            newData[offset] = (newLen >> 8) & 0xFF;
            newData[offset + 1] = newLen & 0xFF;
            offset += 2;
            
            // Write new string
            newData.set(newNameBytes, offset);
            offset += newLen;
            
            // Copy after
            newData.set(afterString, offset);
            
            return newData;
        }
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BinaryFields;
}
