/**
 * TheoTown Save Editor - History Manager
 * Handles undo/redo functionality with memory-efficient delta tracking
 */

const HistoryManager = {
    // Configuration
    maxHistory: 50,
    
    // State
    undoStack: [],
    redoStack: [],
    isApplyingHistory: false,

    /**
     * Clear all history
     */
    clear() {
        this.undoStack = [];
        this.redoStack = [];
    },

    /**
     * Record a change action
     * @param {Object} action - Action to record
     * @param {string} action.type - Type of action (setMoney, setRank, setName, etc.)
     * @param {string} action.field - Field that was changed
     * @param {*} action.oldValue - Value before the change
     * @param {*} action.newValue - Value after the change
     * @param {string} action.description - Human-readable description
     */
    record(action) {
        // Don't record changes while undoing/redoing
        if (this.isApplyingHistory) return;

        // Don't record if old and new values are the same
        if (action.oldValue === action.newValue) return;

        // Add to undo stack
        this.undoStack.push({
            ...action,
            timestamp: Date.now()
        });

        // Clear redo stack on new action
        this.redoStack = [];

        // Trim history if too long
        if (this.undoStack.length > this.maxHistory) {
            this.undoStack.shift();
        }
    },

    /**
     * Check if undo is available
     * @returns {boolean}
     */
    canUndo() {
        return this.undoStack.length > 0;
    },

    /**
     * Check if redo is available
     * @returns {boolean}
     */
    canRedo() {
        return this.redoStack.length > 0;
    },

    /**
     * Get the last action without removing it
     * @returns {Object|null} Last action or null
     */
    peekUndo() {
        if (this.undoStack.length === 0) return null;
        return this.undoStack[this.undoStack.length - 1];
    },

    /**
     * Get the next redo action without removing it
     * @returns {Object|null} Next redo action or null
     */
    peekRedo() {
        if (this.redoStack.length === 0) return null;
        return this.redoStack[this.redoStack.length - 1];
    },

    /**
     * Pop the last undo action
     * @returns {Object|null} Action to undo or null
     */
    popUndo() {
        if (this.undoStack.length === 0) return null;
        const action = this.undoStack.pop();
        this.redoStack.push(action);
        return action;
    },

    /**
     * Pop the next redo action
     * @returns {Object|null} Action to redo or null
     */
    popRedo() {
        if (this.redoStack.length === 0) return null;
        const action = this.redoStack.pop();
        this.undoStack.push(action);
        return action;
    },

    /**
     * Start applying history (prevents recording)
     */
    startApplying() {
        this.isApplyingHistory = true;
    },

    /**
     * Stop applying history
     */
    stopApplying() {
        this.isApplyingHistory = false;
    },

    /**
     * Get undo stack length
     * @returns {number}
     */
    getUndoCount() {
        return this.undoStack.length;
    },

    /**
     * Get redo stack length
     * @returns {number}
     */
    getRedoCount() {
        return this.redoStack.length;
    },

    /**
     * Get history summary for display
     * @param {number} limit - Maximum items to return
     * @returns {Array} Array of action descriptions
     */
    getHistorySummary(limit = 10) {
        const items = [];
        const stack = [...this.undoStack].reverse();
        
        for (let i = 0; i < Math.min(limit, stack.length); i++) {
            items.push({
                description: stack[i].description || `${stack[i].field}: ${stack[i].oldValue} → ${stack[i].newValue}`,
                timestamp: stack[i].timestamp,
                isCurrent: i === 0
            });
        }
        
        return items;
    },

    /**
     * Create action description helper
     * @param {string} field - Field name
     * @param {*} oldValue - Old value
     * @param {*} newValue - New value
     * @returns {string} Human-readable description
     */
    createDescription(field, oldValue, newValue) {
        const formatValue = (v) => {
            if (typeof v === 'number') {
                return v.toLocaleString();
            }
            if (typeof v === 'boolean') {
                return v ? 'ON' : 'OFF';
            }
            if (typeof v === 'string' && v.length > 20) {
                return v.substring(0, 17) + '...';
            }
            return String(v);
        };

        const fieldNames = {
            'estate': 'Money',
            'money': 'Money',
            'rank': 'Rank',
            'name': 'City Name',
            'gamemode': 'Difficulty',
            'uber': 'Uber Mode',
            'dsaSupplies': 'DSA Supplies'
        };

        const displayName = fieldNames[field] || field;
        return `${displayName}: ${formatValue(oldValue)} → ${formatValue(newValue)}`;
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HistoryManager;
}
