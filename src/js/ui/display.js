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
        document.getElementById('dropZone').style.display = 'none';
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
        
        // City Name (editable)
        if (e.binaryName !== null) {
            document.getElementById('binaryName').value = e.binaryName;
            document.getElementById('cityNameRow').style.display = '';
            document.getElementById('nameOffset').textContent = o.name || '-';
        } else {
            document.getElementById('cityNameRow').style.display = 'none';
        }
        
        // Editable fields - Binary
        if (e.binaryEstate !== null) {
            const estateInput = document.getElementById('binaryEstate');
            
            // Format and display the value
            let displayValue = Math.floor(e.binaryEstate);
            
            // For very large numbers, use scientific notation or localized string
            if (displayValue > 1e15) {
                // Use scientific notation for extremely large numbers
                estateInput.value = displayValue.toExponential(6);
            } else {
                // Use localized number with thousand separators for readability
                estateInput.value = displayValue.toLocaleString('en-US', { useGrouping: true, maximumFractionDigits: 0 });
            }
            
            document.getElementById('binaryEstateRow').style.display = '';
            document.getElementById('estateOffset').textContent = o.estate || '-';
            
            // Update tooltip based on type
            if (cityData.estateType && cityData.estateType.info) {
                const typeInfo = cityData.estateType.info;
                
                // Update tooltip with type info
                const tooltipText = document.querySelector('#binaryEstateRow .tooltip-text');
                if (tooltipText) {
                    let tooltipContent = `Binary: estate (${typeInfo.name})`;
                    
                    // Show max value info
                    if (typeInfo.name === 'Double' || typeInfo.name === 'Double64') {
                        tooltipContent += `\nMax: ~1.8×10³⁰⁸ (Double)`;
                        tooltipContent += `\nTip: Use scientific notation (e.g., 1.5e15)`;
                    } else {
                        tooltipContent += `\nMax: ${this.formatNumber(typeInfo.max)}`;
                    }
                    tooltipText.textContent = tooltipContent;
                }
                
                // Remove precision warning class (no longer limiting to MAX_SAFE_INTEGER)
                estateInput.classList.remove('precision-warning');
                estateInput.title = `Type: ${typeInfo.name} | Enter value with commas or scientific notation`;
            }
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
        
        // Gamemode (editable dropdown)
        if (e.binaryGamemode !== null) {
            const gamemodeSelect = document.getElementById('gamemodeSelect');
            if (gamemodeSelect && cityData.gamemodes) {
                // Clear existing options
                gamemodeSelect.innerHTML = '';
                cityData.gamemodes.forEach(mode => {
                    const option = document.createElement('option');
                    option.value = mode;
                    option.textContent = mode;
                    if (mode === e.binaryGamemode) {
                        option.selected = true;
                    }
                    gamemodeSelect.appendChild(option);
                });
            }
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
        
        // Undo/Redo buttons
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        if (undoBtn) {
            undoBtn.disabled = !cityData.canUndo;
        }
        if (redoBtn) {
            redoBtn.disabled = !cityData.canRedo;
        }
        
        // Backup status
        const backupStatus = document.getElementById('backupStatus');
        const downloadOriginalBtn = document.getElementById('downloadOriginalBtn');
        if (cityData.hasBackup) {
            if (backupStatus) {
                backupStatus.innerHTML = '<span class="backup-icon">✓</span> Original file backed up';
                backupStatus.className = 'backup-status active';
            }
            if (downloadOriginalBtn) {
                downloadOriginalBtn.style.display = '';
            }
        } else {
            if (backupStatus) {
                backupStatus.className = 'backup-status';
            }
            if (downloadOriginalBtn) {
                downloadOriginalBtn.style.display = 'none';
            }
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
            successEl.className = 'toast success';
            successEl.style.display = 'block';
            setTimeout(() => {
                successEl.style.display = 'none';
            }, 3000);
        }
    },

    /**
     * Show warning message
     * @param {string} message - Warning message to display
     */
    showWarning(message) {
        const successEl = document.getElementById('success');
        if (successEl) {
            successEl.textContent = '⚠️ ' + message;
            successEl.className = 'toast warning';
            successEl.style.display = 'block';
            setTimeout(() => {
                successEl.style.display = 'none';
            }, 5000);
        } else {
            alert('Warning: ' + message);
        }
    },

    /**
     * Reset to initial state
     */
    reset() {
        document.getElementById('dropZone').style.display = 'block';
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
