/**
 * TheoTown Save Editor - UI Display Components
 * Handles rendering city data to the DOM
 */

const Display = {
    /**
     * Show the editor panel with city data
     * @param {Object} cityData - Data from CityManager.getDisplayData()
     */
    showEditor(cityData) {
        document.getElementById('fileInfo').style.display = 'none';
        document.getElementById('editor').style.display = 'block';
        
        this.updateDisplay(cityData);
    },

    /**
     * Update all display values
     * @param {Object} cityData - Data from CityManager.getDisplayData()
     */
    updateDisplay(cityData) {
        const h = cityData.header;
        const e = cityData.editable;
        const o = cityData.fieldOffsets;
        
        // File info
        document.getElementById('cityName').textContent = h.name;
        document.getElementById('citySize').textContent = h.size;
        document.getElementById('cityVersion').textContent = h.version;
        document.getElementById('cityGamemode').textContent = h.gamemode;
        document.getElementById('cityPopulation').textContent = this.formatNumber(h.population);
        document.getElementById('cityPlaytime').textContent = this.formatTime(h.playtime);
        document.getElementById('citySaves').textContent = h.saves;
        document.getElementById('cityLastModified').textContent = this.formatDate(h.lastModified);
        
        // Editable fields - Header
        document.getElementById('headerMoney').value = Math.floor(e.headerMoney);
        document.getElementById('headerRank').value = e.headerRank;
        
        // Editable fields - Binary
        if (e.binaryEstate !== null) {
            document.getElementById('binaryEstate').value = Math.floor(e.binaryEstate);
            document.getElementById('binaryEstateRow').style.display = '';
            document.getElementById('estateOffset').textContent = o.estate || '-';
        } else {
            document.getElementById('binaryEstateRow').style.display = 'none';
        }
        
        if (e.binaryRank !== null) {
            document.getElementById('binaryRank').value = e.binaryRank;
            document.getElementById('binaryRankRow').style.display = '';
            document.getElementById('rankOffset').textContent = o.rank || '-';
        } else {
            document.getElementById('binaryRankRow').style.display = 'none';
        }
        
        // Uber mode
        if (e.binaryUber !== null) {
            document.getElementById('uberStatus').textContent = e.binaryUber ? 'ON' : 'OFF';
            document.getElementById('uberStatus').className = e.binaryUber ? 'status-on' : 'status-off';
            document.getElementById('toggleUberBtn').textContent = e.binaryUber ? 'Disable Uber' : 'Enable Uber';
            document.getElementById('uberRow').style.display = '';
            document.getElementById('uberOffset').textContent = o.uber || '-';
        } else {
            document.getElementById('uberRow').style.display = 'none';
        }
        
        // Gamemode (read-only)
        if (e.binaryGamemode !== null) {
            document.getElementById('gamemodeValue').textContent = e.binaryGamemode;
            document.getElementById('gamemodeRow').style.display = '';
            document.getElementById('gamemodeOffset').textContent = o.gamemode || '-';
        } else {
            document.getElementById('gamemodeRow').style.display = 'none';
        }
        
        // DSA Supplies
        if (e.binaryDsaSupplies !== null) {
            document.getElementById('dsaSupplies').value = e.binaryDsaSupplies;
            document.getElementById('dsaRow').style.display = '';
            document.getElementById('dsaOffset').textContent = o.dsaSupplies || '-';
        } else {
            document.getElementById('dsaRow').style.display = 'none';
        }
        
        // Changes indicator
        this.updateChangesIndicator(cityData.hasChanges);
    },

    /**
     * Update the unsaved changes indicator
     * @param {boolean} hasChanges - Whether there are unsaved changes
     */
    updateChangesIndicator(hasChanges) {
        const indicator = document.getElementById('changesIndicator');
        if (indicator) {
            indicator.style.display = hasChanges ? 'block' : 'none';
        }
    },

    /**
     * Show/hide loading state
     * @param {boolean} loading - Whether loading is in progress
     */
    setLoading(loading) {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = loading ? 'block' : 'none';
        }
    },

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        const errorEl = document.getElementById('error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        } else {
            alert('Error: ' + message);
        }
    },

    /**
     * Hide error message
     */
    hideError() {
        const errorEl = document.getElementById('error');
        if (errorEl) {
            errorEl.style.display = 'none';
        }
    },

    /**
     * Show success message
     * @param {string} message - Success message to display
     */
    showSuccess(message) {
        const successEl = document.getElementById('success');
        if (successEl) {
            successEl.textContent = message;
            successEl.style.display = 'block';
            setTimeout(() => {
                successEl.style.display = 'none';
            }, 3000);
        }
    },

    /**
     * Reset to initial state
     */
    reset() {
        document.getElementById('fileInfo').style.display = 'block';
        document.getElementById('editor').style.display = 'none';
        this.hideError();
    },

    // Formatting helpers
    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    },

    formatTime(seconds) {
        if (!seconds) return '0:00';
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    },

    formatDate(timestamp) {
        if (!timestamp) return 'Unknown';
        return new Date(timestamp).toLocaleString();
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Display;
}
