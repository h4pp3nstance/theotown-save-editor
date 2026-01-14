/**
 * TheoTown Save Editor - Backup Manager
 * Handles backup storage using IndexedDB with memory fallback
 */

const BackupManager = {
    dbName: 'theotown-save-editor',
    storeName: 'backups',
    db: null,
    memoryBackup: null, // Fallback for when IndexedDB is unavailable

    /**
     * Initialize IndexedDB
     * @returns {Promise<boolean>} Success status
     */
    async init() {
        if (this.db) return true;

        return new Promise((resolve) => {
            try {
                const request = indexedDB.open(this.dbName, 1);

                request.onerror = () => {
                    console.warn('IndexedDB not available, using memory backup');
                    resolve(false);
                };

                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    resolve(true);
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        db.createObjectStore(this.storeName, { keyPath: 'filename' });
                    }
                };
            } catch (e) {
                console.warn('IndexedDB error:', e);
                resolve(false);
            }
        });
    },

    /**
     * Store a backup of the original file
     * @param {string} filename - Original filename
     * @param {Uint8Array} data - Original file data (before any edits)
     * @param {Object} header - Original header
     * @returns {Promise<boolean>} Success status
     */
    async store(filename, data, header) {
        const backup = {
            filename: filename,
            data: new Uint8Array(data), // Clone the data
            header: JSON.parse(JSON.stringify(header)), // Deep clone
            timestamp: Date.now()
        };

        // Always store in memory as fallback
        this.memoryBackup = backup;

        // Try to persist to IndexedDB
        await this.init();
        if (!this.db) return true; // Memory backup succeeded

        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction(this.storeName, 'readwrite');
                const store = tx.objectStore(this.storeName);
                const request = store.put(backup);

                request.onsuccess = () => resolve(true);
                request.onerror = () => {
                    console.warn('Failed to store backup in IndexedDB');
                    resolve(true); // Memory backup still valid
                };
            } catch (e) {
                console.warn('IndexedDB store error:', e);
                resolve(true); // Memory backup still valid
            }
        });
    },

    /**
     * Retrieve a backup
     * @param {string} filename - Filename to retrieve
     * @returns {Promise<Object|null>} Backup data or null
     */
    async retrieve(filename) {
        // Check memory backup first
        if (this.memoryBackup && this.memoryBackup.filename === filename) {
            return this.memoryBackup;
        }

        // Try IndexedDB
        await this.init();
        if (!this.db) return null;

        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction(this.storeName, 'readonly');
                const store = tx.objectStore(this.storeName);
                const request = store.get(filename);

                request.onsuccess = () => {
                    const result = request.result;
                    if (result) {
                        this.memoryBackup = result; // Cache in memory
                    }
                    resolve(result || null);
                };
                request.onerror = () => resolve(null);
            } catch (e) {
                resolve(null);
            }
        });
    },

    /**
     * Check if a backup exists
     * @param {string} filename - Filename to check
     * @returns {Promise<boolean>} Whether backup exists
     */
    async hasBackup(filename) {
        if (this.memoryBackup && this.memoryBackup.filename === filename) {
            return true;
        }

        const backup = await this.retrieve(filename);
        return backup !== null;
    },

    /**
     * Get backup as downloadable Blob
     * @param {string} filename - Filename to retrieve
     * @returns {Promise<Blob|null>} Blob for download or null
     */
    async getAsBlob(filename) {
        const backup = await this.retrieve(filename);
        if (!backup || !backup.data) return null;

        return new Blob([backup.data], { type: 'application/octet-stream' });
    },

    /**
     * Get backup info for display
     * @param {string} filename - Filename to check
     * @returns {Promise<Object|null>} Backup info { filename, timestamp, size }
     */
    async getBackupInfo(filename) {
        const backup = await this.retrieve(filename);
        if (!backup) return null;

        return {
            filename: backup.filename,
            timestamp: backup.timestamp,
            size: backup.data ? backup.data.length : 0,
            hasHeader: !!backup.header
        };
    },

    /**
     * Clear backup for a file
     * @param {string} filename - Filename to clear
     * @returns {Promise<boolean>} Success status
     */
    async clear(filename) {
        // Clear memory backup
        if (this.memoryBackup && this.memoryBackup.filename === filename) {
            this.memoryBackup = null;
        }

        // Clear from IndexedDB
        await this.init();
        if (!this.db) return true;

        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction(this.storeName, 'readwrite');
                const store = tx.objectStore(this.storeName);
                const request = store.delete(filename);

                request.onsuccess = () => resolve(true);
                request.onerror = () => resolve(false);
            } catch (e) {
                resolve(false);
            }
        });
    },

    /**
     * Clear all backups
     * @returns {Promise<boolean>} Success status
     */
    async clearAll() {
        this.memoryBackup = null;

        await this.init();
        if (!this.db) return true;

        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction(this.storeName, 'readwrite');
                const store = tx.objectStore(this.storeName);
                const request = store.clear();

                request.onsuccess = () => resolve(true);
                request.onerror = () => resolve(false);
            } catch (e) {
                resolve(false);
            }
        });
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackupManager;
}
