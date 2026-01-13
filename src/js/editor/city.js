/**
 * TheoTown Save Editor - City Manager
 * High-level city data management
 */

const CityManager = {
    // Current city state
    currentCity: null,
    fileName: null,
    binaryFields: null,
    hasChanges: false,

    /**
     * Load a city file
     * @param {File} file - File object from input
     * @returns {Promise<Object>} Loaded city data
     */
    async load(file) {
        const buffer = await file.arrayBuffer();
        this.currentCity = await FileParser.parse(buffer);
        this.fileName = file.name;
        this.hasChanges = false;
        
        // Find all binary fields
        this.binaryFields = BinaryFields.findAllFields(this.currentCity.binaryData);
        
        return this.getDisplayData();
    },

    /**
     * Get city data formatted for UI display
     * @returns {Object} Display-ready city data
     */
    getDisplayData() {
        if (!this.currentCity) return null;
        
        const header = this.currentCity.header;
        const binary = this.currentCity.binaryData;
        const fields = this.binaryFields;
        
        // Read binary values
        let binaryEstate = null;
        let binaryRank = null;
        let binaryUber = null;
        let binaryGamemode = null;
        let binaryDsaSupplies = null;
        
        if (fields.ESTATE) {
            binaryEstate = BinaryFields.readEstate(binary, fields.ESTATE);
        }
        if (fields.RANK) {
            binaryRank = BinaryFields.readRank(binary, fields.RANK);
        }
        if (fields.UBER) {
            binaryUber = BinaryFields.readUber(binary, fields.UBER);
        }
        if (fields.GAMEMODE) {
            binaryGamemode = BinaryFields.readGamemode(binary, fields.GAMEMODE);
        }
        if (fields.DSA_SUPPLIES) {
            binaryDsaSupplies = BinaryFields.readDsaSupplies(binary, fields.DSA_SUPPLIES);
        }
        
        return {
            fileName: this.fileName,
            header: {
                name: header.name || '(Unnamed)',
                size: `${header.width}x${header.height}`,
                gamemode: header.gamemode || 'UNKNOWN',
                version: header.version || 'Unknown',
                population: header.habitants || 0,
                playtime: header.info?.playtime || 0,
                saves: header['save counter'] || 0,
                lastModified: header['last modified']
            },
            editable: {
                headerMoney: header.money || 0,
                headerRank: header['rank lvl'] || 0,
                headerUber: header.uber === true,
                binaryEstate: binaryEstate,
                binaryRank: binaryRank,
                binaryUber: binaryUber,
                binaryGamemode: binaryGamemode,
                binaryDsaSupplies: binaryDsaSupplies
            },
            fieldOffsets: {
                estate: fields.ESTATE?.valueOffset,
                rank: fields.RANK?.valueOffset,
                uber: fields.UBER?.typeOffset,
                gamemode: fields.GAMEMODE?.valueOffset,
                dsaSupplies: fields.DSA_SUPPLIES?.valueOffset
            },
            hasChanges: this.hasChanges
        };
    },

    /**
     * Update money value
     * @param {number} value - New money value
     */
    setMoney(value) {
        if (!this.currentCity) return;
        
        // Update header
        this.currentCity.header.money = value;
        
        // Update binary if field found
        if (this.binaryFields.ESTATE) {
            BinaryFields.writeEstate(
                this.currentCity.binaryData, 
                this.binaryFields.ESTATE, 
                value
            );
        }
        
        this.hasChanges = true;
    },

    /**
     * Update rank value
     * @param {number} value - New rank value (0-5000)
     */
    setRank(value) {
        if (!this.currentCity) return;
        
        value = Math.max(0, Math.min(5000, value));
        
        // Update header
        this.currentCity.header['rank lvl'] = value;
        
        // Update binary if field found
        if (this.binaryFields.RANK) {
            BinaryFields.writeRank(
                this.currentCity.binaryData, 
                this.binaryFields.RANK, 
                value
            );
        }
        
        this.hasChanges = true;
    },

    /**
     * Toggle uber mode
     */
    toggleUber() {
        if (!this.currentCity || !this.binaryFields.UBER) return;
        
        const currentValue = BinaryFields.readUber(
            this.currentCity.binaryData, 
            this.binaryFields.UBER
        );
        const newValue = !currentValue;
        
        // Update header
        this.currentCity.header.uber = newValue;
        
        // Update binary
        BinaryFields.writeUber(
            this.currentCity.binaryData, 
            this.binaryFields.UBER, 
            newValue
        );
        
        this.hasChanges = true;
        return newValue;
    },

    /**
     * Set DSA supplies value
     * @param {number} value - New supplies value (0-32767)
     */
    setDsaSupplies(value) {
        if (!this.currentCity || !this.binaryFields.DSA_SUPPLIES) return;
        
        value = Math.max(0, Math.min(32767, value));
        
        BinaryFields.writeDsaSupplies(
            this.currentCity.binaryData, 
            this.binaryFields.DSA_SUPPLIES, 
            value
        );
        
        this.hasChanges = true;
    },

    /**
     * Save city to file
     * @returns {Blob} File blob for download
     */
    save() {
        if (!this.currentCity) return null;
        
        const fileData = FileParser.serialize(this.currentCity);
        this.hasChanges = false;
        
        return new Blob([fileData], { type: 'application/octet-stream' });
    },

    /**
     * Get filename for save
     * @returns {string} Suggested filename
     */
    getSaveFilename() {
        return this.fileName || 'city.city';
    },

    /**
     * Reset to original data
     */
    reset() {
        if (!this.currentCity) return;
        
        // Restore original values
        this.currentCity.header = JSON.parse(JSON.stringify(this.currentCity.originalHeader));
        this.currentCity.binaryData = new Uint8Array(this.currentCity.originalBinary);
        
        // Re-find fields
        this.binaryFields = BinaryFields.findAllFields(this.currentCity.binaryData);
        
        this.hasChanges = false;
    },

    /**
     * Clear current city
     */
    clear() {
        this.currentCity = null;
        this.fileName = null;
        this.binaryFields = null;
        this.hasChanges = false;
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CityManager;
}
