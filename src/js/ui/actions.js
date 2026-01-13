/**
 * TheoTown Save Editor - UI Actions
 * Handles user interactions and event binding
 */

const Actions = {
    /**
     * Initialize all event handlers
     */
    init() {
        // File input
        document.getElementById('fileInput').addEventListener('change', this.handleFileSelect.bind(this));
        
        // Drag and drop
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
            dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
            dropZone.addEventListener('drop', this.handleDrop.bind(this));
        }
        
        // Editor buttons
        document.getElementById('saveBtn')?.addEventListener('click', this.handleSave.bind(this));
        document.getElementById('resetBtn')?.addEventListener('click', this.handleReset.bind(this));
        document.getElementById('closeBtn')?.addEventListener('click', this.handleClose.bind(this));
        document.getElementById('toggleUberBtn')?.addEventListener('click', this.handleToggleUber.bind(this));
        
        // Input changes
        document.getElementById('headerMoney')?.addEventListener('change', this.handleMoneyChange.bind(this));
        document.getElementById('binaryEstate')?.addEventListener('change', this.handleMoneyChange.bind(this));
        document.getElementById('headerRank')?.addEventListener('change', this.handleRankChange.bind(this));
        document.getElementById('binaryRank')?.addEventListener('change', this.handleRankChange.bind(this));
        document.getElementById('dsaSupplies')?.addEventListener('change', this.handleDsaChange.bind(this));
        
        // Sync inputs
        document.getElementById('headerMoney')?.addEventListener('input', this.syncMoneyInputs.bind(this));
        document.getElementById('binaryEstate')?.addEventListener('input', this.syncMoneyInputs.bind(this));
        document.getElementById('headerRank')?.addEventListener('input', this.syncRankInputs.bind(this));
        document.getElementById('binaryRank')?.addEventListener('input', this.syncRankInputs.bind(this));
    },

    /**
     * Handle file selection
     * @param {Event} e - Change event
     */
    async handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        await this.loadFile(file);
    },

    /**
     * Handle drag over
     * @param {DragEvent} e - Drag event
     */
    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    },

    /**
     * Handle drag leave
     * @param {DragEvent} e - Drag event
     */
    handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    },

    /**
     * Handle file drop
     * @param {DragEvent} e - Drop event
     */
    async handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        
        const file = e.dataTransfer.files[0];
        if (file) {
            await this.loadFile(file);
        }
    },

    /**
     * Load a city file
     * @param {File} file - File to load
     */
    async loadFile(file) {
        if (!file.name.endsWith('.city')) {
            Display.showError('Please select a .city file');
            return;
        }
        
        Display.setLoading(true);
        Display.hideError();
        
        try {
            const cityData = await CityManager.load(file);
            Display.showEditor(cityData);
        } catch (err) {
            Display.showError('Error loading file: ' + err.message);
            console.error(err);
        } finally {
            Display.setLoading(false);
        }
    },

    /**
     * Handle money input change
     * @param {Event} e - Change event
     */
    handleMoneyChange(e) {
        const value = parseInt(e.target.value) || 0;
        CityManager.setMoney(value);
        this.refreshDisplay();
    },

    /**
     * Handle rank input change
     * @param {Event} e - Change event
     */
    handleRankChange(e) {
        const value = parseInt(e.target.value) || 0;
        CityManager.setRank(value);
        this.refreshDisplay();
    },

    /**
     * Handle DSA supplies change
     * @param {Event} e - Change event
     */
    handleDsaChange(e) {
        const value = parseInt(e.target.value) || 0;
        CityManager.setDsaSupplies(value);
        this.refreshDisplay();
    },

    /**
     * Handle uber toggle
     */
    handleToggleUber() {
        const newValue = CityManager.toggleUber();
        if (newValue !== undefined) {
            Display.showSuccess(`Uber mode ${newValue ? 'enabled' : 'disabled'}`);
            this.refreshDisplay();
        }
    },

    /**
     * Sync money inputs (header and binary)
     * @param {Event} e - Input event
     */
    syncMoneyInputs(e) {
        const value = e.target.value;
        const isHeader = e.target.id === 'headerMoney';
        const otherInput = document.getElementById(isHeader ? 'binaryEstate' : 'headerMoney');
        if (otherInput) {
            otherInput.value = value;
        }
    },

    /**
     * Sync rank inputs (header and binary)
     * @param {Event} e - Input event
     */
    syncRankInputs(e) {
        const value = e.target.value;
        const isHeader = e.target.id === 'headerRank';
        const otherInput = document.getElementById(isHeader ? 'binaryRank' : 'headerRank');
        if (otherInput) {
            otherInput.value = value;
        }
    },

    /**
     * Handle save button
     */
    handleSave() {
        const blob = CityManager.save();
        if (!blob) return;
        
        const filename = CityManager.getSaveFilename();
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Display.showSuccess('File saved: ' + filename);
        this.refreshDisplay();
    },

    /**
     * Handle reset button
     */
    handleReset() {
        if (confirm('Reset all changes to original values?')) {
            CityManager.reset();
            this.refreshDisplay();
            Display.showSuccess('Changes reset');
        }
    },

    /**
     * Handle close button
     */
    handleClose() {
        if (CityManager.hasChanges) {
            if (!confirm('You have unsaved changes. Close anyway?')) {
                return;
            }
        }
        CityManager.clear();
        Display.reset();
        document.getElementById('fileInput').value = '';
    },

    /**
     * Refresh display with current data
     */
    refreshDisplay() {
        const cityData = CityManager.getDisplayData();
        if (cityData) {
            Display.updateDisplay(cityData);
        }
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Actions;
}
