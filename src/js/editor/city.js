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
    hasBackup: false,

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
        
        // Store backup of original file
        if (typeof BackupManager !== 'undefined') {
            await BackupManager.store(
                file.name, 
                this.currentCity.originalBinary,
                this.currentCity.originalHeader
            );
            this.hasBackup = true;
        }
        
        // Clear history for new file
        if (typeof HistoryManager !== 'undefined') {
            HistoryManager.clear();
        }
        
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
        let binaryName = null;
        
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
        if (fields.NAME) {
            binaryName = BinaryFields.readName(binary, fields.NAME);
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
                binaryDsaSupplies: binaryDsaSupplies,
                binaryName: binaryName
            },
            fieldOffsets: {
                estate: fields.ESTATE?.valueOffset,
                rank: fields.RANK?.valueOffset,
                uber: fields.UBER?.typeOffset,
                gamemode: fields.GAMEMODE?.valueOffset,
                dsaSupplies: fields.DSA_SUPPLIES?.valueOffset,
                name: fields.NAME?.valueOffset
            },
            gamemodes: BinaryFields.GAMEMODES,
            hasBackup: this.hasBackup,
            historyCount: typeof HistoryManager !== 'undefined' ? HistoryManager.getUndoCount() : 0,
            canUndo: typeof HistoryManager !== 'undefined' ? HistoryManager.canUndo() : false,
            canRedo: typeof HistoryManager !== 'undefined' ? HistoryManager.canRedo() : false,
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
     * @param {number} value - New rank value (0-64)
     */
    setRank(value) {
        if (!this.currentCity) return;
        
        value = Math.max(0, Math.min(BinaryFields.MAX_RANK, value));
        
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
     * Update gamemode (difficulty)
     * @param {string} value - New gamemode (EASY/NORMAL/HARD/SANDBOX)
     * @returns {boolean} Success status
     */
    setGamemode(value) {
        if (!this.currentCity) return false;
        
        // Update header
        this.currentCity.header.gamemode = value;
        
        // Update binary if field found
        if (this.binaryFields.GAMEMODE) {
            const newBinaryData = BinaryFields.writeGamemode(
                this.currentCity.binaryData, 
                this.binaryFields.GAMEMODE, 
                value
            );
            if (newBinaryData) {
                this.currentCity.binaryData = newBinaryData;
                // Re-find all fields since offsets may have changed
                this.binaryFields = BinaryFields.findAllFields(this.currentCity.binaryData);
            } else {
                console.warn('Failed to write gamemode to binary');
                return false;
            }
        }
        
        this.hasChanges = true;
        return true;
    },

    /**
     * Update city name
     * @param {string} name - New city name
     * @returns {boolean} Success status
     */
    setName(name) {
        if (!this.currentCity) return false;
        
        // Sanitize name
        name = name.trim();
        if (!name) return false;
        
        // Update header
        this.currentCity.header.name = name;
        
        // Update binary if field found
        if (this.binaryFields.NAME) {
            const newBinaryData = BinaryFields.writeName(
                this.currentCity.binaryData, 
                this.binaryFields.NAME, 
                name
            );
            if (newBinaryData) {
                this.currentCity.binaryData = newBinaryData;
                // Re-find all fields since offsets may have changed
                this.binaryFields = BinaryFields.findAllFields(this.currentCity.binaryData);
            } else {
                console.warn('Failed to write name to binary');
                return false;
            }
        }
        
        this.hasChanges = true;
        return true;
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
        
        // Re-find the UBER field since type byte changed
        this.binaryFields.UBER = BinaryFields.findField(
            this.currentCity.binaryData, 
            BinaryFields.FIELD_NAMES.UBER
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
        
        const oldValue = BinaryFields.readDsaSupplies(
            this.currentCity.binaryData, 
            this.binaryFields.DSA_SUPPLIES
        );
        
        value = Math.max(0, Math.min(32767, value));
        
        // Record history
        if (typeof HistoryManager !== 'undefined') {
            HistoryManager.record({
                type: 'setDsaSupplies',
                field: 'dsaSupplies',
                oldValue: oldValue,
                newValue: value,
                description: HistoryManager.createDescription('dsaSupplies', oldValue, value)
            });
        }
        
        BinaryFields.writeDsaSupplies(
            this.currentCity.binaryData, 
            this.binaryFields.DSA_SUPPLIES, 
            value
        );
        
        this.hasChanges = true;
    },

    /**
     * Validate city data before saving
     * @returns {Object} Validation result { valid, errors, warnings }
     */
    validate() {
        if (!this.currentCity) {
            return { valid: false, errors: ['No city loaded'], warnings: [] };
        }
        
        if (typeof Validator === 'undefined') {
            return { valid: true, errors: [], warnings: [] };
        }
        
        return Validator.validate(
            this.currentCity,
            this.binaryFields,
            this.getDisplayData()
        );
    },

    /**
     * Undo the last action
     * @returns {boolean} Whether undo was performed
     */
    undo() {
        if (typeof HistoryManager === 'undefined' || !HistoryManager.canUndo()) {
            return false;
        }
        
        const action = HistoryManager.popUndo();
        if (!action) return false;
        
        HistoryManager.startApplying();
        this.applyValue(action.field, action.oldValue);
        HistoryManager.stopApplying();
        
        return true;
    },

    /**
     * Redo the last undone action
     * @returns {boolean} Whether redo was performed
     */
    redo() {
        if (typeof HistoryManager === 'undefined' || !HistoryManager.canRedo()) {
            return false;
        }
        
        const action = HistoryManager.popRedo();
        if (!action) return false;
        
        HistoryManager.startApplying();
        this.applyValue(action.field, action.newValue);
        HistoryManager.stopApplying();
        
        return true;
    },

    /**
     * Apply a value to a field (used by undo/redo)
     * @param {string} field - Field name
     * @param {*} value - Value to apply
     */
    applyValue(field, value) {
        switch (field) {
            case 'money':
            case 'estate':
                this.setMoney(value);
                break;
            case 'rank':
                this.setRank(value);
                break;
            case 'name':
                this.setName(value);
                break;
            case 'gamemode':
                this.setGamemode(value);
                break;
            case 'uber':
                // Uber is a toggle, need special handling
                const currentUber = BinaryFields.readUber(
                    this.currentCity.binaryData, 
                    this.binaryFields.UBER
                );
                if (currentUber !== value) {
                    this.toggleUber();
                }
                break;
            case 'dsaSupplies':
                this.setDsaSupplies(value);
                break;
        }
    },

    /**
     * Get original file as blob for download
     * @returns {Promise<Blob|null>} Original file blob
     */
    async getOriginalBlob() {
        if (typeof BackupManager === 'undefined') return null;
        return await BackupManager.getAsBlob(this.fileName);
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
