/**
 * TheoTown Save Editor - Validator
 * Validates city data before saving
 */

const Validator = {
    // Field value constraints
    CONSTRAINTS: {
        estate: { 
            min: 0, 
            max: 2147483647, 
            warnAbove: 1000000000,
            name: 'Money (Estate)'
        },
        rank: { 
            min: 0, 
            max: 64,
            name: 'Rank Level'
        },
        dsaSupplies: { 
            min: 0, 
            max: 32767,
            name: 'DSA Supplies'
        },
        name: {
            minLength: 1,
            maxLength: 255,
            name: 'City Name'
        }
    },

    // Valid gamemodes
    VALID_GAMEMODES: ['EASY', 'NORMAL', 'HARD', 'SANDBOX'],

    /**
     * Validate city data before saving
     * @param {Object} cityData - City data from CityManager
     * @param {Object} binaryFields - Binary fields info
     * @param {Object} displayData - Display data with current values
     * @returns {Object} Validation result { valid, errors, warnings }
     */
    validate(cityData, binaryFields, displayData) {
        const errors = [];
        const warnings = [];

        // Header structure validation
        if (!cityData || !cityData.header) {
            errors.push('Invalid city data structure');
            return { valid: false, errors, warnings };
        }

        if (!cityData.binaryData || cityData.binaryData.length === 0) {
            errors.push('Missing or empty binary data');
            return { valid: false, errors, warnings };
        }

        // City name validation
        const name = cityData.header.name;
        if (!name || name.trim().length === 0) {
            errors.push('City name cannot be empty');
        } else if (name.length > this.CONSTRAINTS.name.maxLength) {
            errors.push(`City name too long (max ${this.CONSTRAINTS.name.maxLength} chars)`);
        }

        // Gamemode validation
        const gamemode = cityData.header.gamemode;
        if (gamemode && !this.VALID_GAMEMODES.includes(gamemode)) {
            warnings.push(`Unknown gamemode "${gamemode}" - may cause issues`);
        }

        // Numeric field validations
        if (displayData && displayData.editable) {
            const e = displayData.editable;

            // Estate (Money)
            if (e.binaryEstate !== null) {
                const result = this.checkNumericField('estate', e.binaryEstate);
                if (result.error) errors.push(result.error);
                if (result.warning) warnings.push(result.warning);
            }

            // Rank
            if (e.binaryRank !== null) {
                const result = this.checkNumericField('rank', e.binaryRank);
                if (result.error) errors.push(result.error);
                if (result.warning) warnings.push(result.warning);
            }

            // DSA Supplies
            if (e.binaryDsaSupplies !== null) {
                const result = this.checkNumericField('dsaSupplies', e.binaryDsaSupplies);
                if (result.error) errors.push(result.error);
                if (result.warning) warnings.push(result.warning);
            }
        }

        // Binary field integrity check
        const integrityResult = this.checkBinaryIntegrity(binaryFields);
        if (integrityResult.warning) {
            warnings.push(integrityResult.warning);
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    },

    /**
     * Check a numeric field against constraints
     * @param {string} fieldName - Name of the field to check
     * @param {number} value - Current value
     * @returns {Object} { error, warning }
     */
    checkNumericField(fieldName, value) {
        const constraint = this.CONSTRAINTS[fieldName];
        if (!constraint) return {};

        const result = {};
        const displayName = constraint.name || fieldName;

        // Check for non-numeric
        if (typeof value !== 'number' || isNaN(value)) {
            result.error = `${displayName}: Invalid number value`;
            return result;
        }

        // Check min/max bounds
        if (value < constraint.min) {
            result.error = `${displayName}: Value ${value} is below minimum (${constraint.min})`;
        } else if (value > constraint.max) {
            result.error = `${displayName}: Value ${value} exceeds maximum (${constraint.max})`;
        } else if (constraint.warnAbove && value > constraint.warnAbove) {
            result.warning = `${displayName}: High value (${value.toLocaleString()}) may cause game issues`;
        }

        return result;
    },

    /**
     * Check binary field integrity
     * @param {Object} binaryFields - Binary fields from findAllFields
     * @returns {Object} { warning }
     */
    checkBinaryIntegrity(binaryFields) {
        const result = {};
        
        if (!binaryFields) {
            result.warning = 'Could not verify binary field locations';
            return result;
        }

        // Check if critical fields were found
        const criticalFields = ['GAMEMODE'];
        const missingFields = criticalFields.filter(f => !binaryFields[f]);
        
        if (missingFields.length > 0) {
            result.warning = `Some fields not found in binary: ${missingFields.join(', ')}`;
        }

        return result;
    },

    /**
     * Quick validation check (for real-time validation)
     * @param {string} fieldName - Field being edited
     * @param {*} value - New value
     * @returns {Object} { valid, message }
     */
    quickCheck(fieldName, value) {
        const constraint = this.CONSTRAINTS[fieldName];
        if (!constraint) return { valid: true };

        if (fieldName === 'name') {
            if (!value || value.trim().length < constraint.minLength) {
                return { valid: false, message: 'Name cannot be empty' };
            }
            if (value.length > constraint.maxLength) {
                return { valid: false, message: `Max ${constraint.maxLength} characters` };
            }
            return { valid: true };
        }

        // Numeric validation
        const numValue = Number(value);
        if (isNaN(numValue)) {
            return { valid: false, message: 'Must be a number' };
        }
        if (numValue < constraint.min) {
            return { valid: false, message: `Min: ${constraint.min}` };
        }
        if (numValue > constraint.max) {
            return { valid: false, message: `Max: ${constraint.max.toLocaleString()}` };
        }

        return { valid: true };
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validator;
}
