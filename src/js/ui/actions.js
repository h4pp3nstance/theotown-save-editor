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
        document.getElementById('undoBtn')?.addEventListener('click', this.handleUndo.bind(this));
        document.getElementById('redoBtn')?.addEventListener('click', this.handleRedo.bind(this));
        document.getElementById('downloadOriginalBtn')?.addEventListener('click', this.handleDownloadOriginal.bind(this));
        
        // Input changes
        document.getElementById('binaryEstate')?.addEventListener('change', this.handleMoneyChange.bind(this));
        document.getElementById('binaryRank')?.addEventListener('change', this.handleRankChange.bind(this));
        document.getElementById('dsaSupplies')?.addEventListener('change', this.handleDsaChange.bind(this));
        document.getElementById('gamemodeSelect')?.addEventListener('change', this.handleGamemodeChange.bind(this));
        document.getElementById('binaryName')?.addEventListener('change', this.handleNameChange.bind(this));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    },

    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyDown(e) {
        // Only handle when editor is visible
        if (document.getElementById('editor').style.display === 'none') return;
        
        // Ctrl+Z = Undo
        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            this.handleUndo();
        }
        // Ctrl+Y or Ctrl+Shift+Z = Redo
        if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
            e.preventDefault();
            this.handleRedo();
        }
        // Ctrl+S = Save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            this.handleSave();
        }
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
     * Handle gamemode change
     * @param {Event} e - Change event
     */
    handleGamemodeChange(e) {
        const value = e.target.value;
        const success = CityManager.setGamemode(value);
        if (success) {
            Display.showSuccess(`Difficulty changed to ${value}`);
        } else {
            Display.showError('Failed to change difficulty');
        }
        this.refreshDisplay();
    },

    /**
     * Handle city name change
     * @param {Event} e - Change event
     */
    handleNameChange(e) {
        const value = e.target.value.trim();
        if (!value) {
            Display.showError('City name cannot be empty');
            this.refreshDisplay();
            return;
        }
        const success = CityManager.setName(value);
        if (success) {
            Display.showSuccess(`City renamed to "${value}"`);
        } else {
            Display.showError('Failed to change city name');
        }
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
     * Handle undo
     */
    handleUndo() {
        if (CityManager.undo()) {
            Display.showSuccess('Undo');
            this.refreshDisplay();
        }
    },

    /**
     * Handle redo
     */
    handleRedo() {
        if (CityManager.redo()) {
            Display.showSuccess('Redo');
            this.refreshDisplay();
        }
    },

    /**
     * Handle download original
     */
    async handleDownloadOriginal() {
        const blob = await CityManager.getOriginalBlob();
        if (!blob) {
            Display.showError('No backup available');
            return;
        }
        
        const filename = 'original_' + CityManager.getSaveFilename();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Display.showSuccess('Original file downloaded: ' + filename);
    },

    /**
     * Handle save button
     */
    handleSave() {
        // Validate before saving
        const validation = CityManager.validate();
        if (!validation.valid) {
            Display.showError('Validation failed: ' + validation.errors.join(', '));
            return;
        }
        if (validation.warnings.length > 0) {
            if (!confirm('Warnings: ' + validation.warnings.join('\\n') + '\\n\\nSave anyway?')) {
                return;
            }
        }
        
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
