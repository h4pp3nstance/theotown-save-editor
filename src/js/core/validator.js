/**
 * TheoTown Save Editor - Validator
 * Validates city data before saving
 */

const Validator = {
    // Field value constraints
    // Note: estate max is dynamic based on binary type, see getEstateConstraint()
    CONSTRAINTS: {
        estate: { 
            min: 0, 
            // max is dynamic, determined by field type
            warnAbove: 1000000000000, // 1 trillion - warn for very high values
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

    // Max values by type byte
    // Note: Double can store up to ~1.8e308, but we use MAX_VALUE for practical validation
    TYPE_MAX_VALUES: {
        0x0e: 32767,              // Int16
        0x0f: 127,                // Int8
        0x08: 2147483647,         // Int32
        0x10: Number.MAX_VALUE,   // Double64 (alternative) - full Double range
        0x07: Number.MAX_VALUE    // Double - full Double range
    },

    /**
     * Get estate constraint with dynamic max based on field type
     * @param {Object} estateField - Estate field info from BinaryFields
     * @returns {Object} Constraint with correct max value
     */
    getEstateConstraint(estateField) {
        const baseConstraint = { ...this.CONSTRAINTS.estate };
        
        if (estateField && estateField.type) {
            baseConstraint.max = this.TYPE_MAX_VALUES[estateField.type] || Number.MAX_SAFE_INTEGER;
        } else {
            // Default to safe max if type unknown
            baseConstraint.max = Number.MAX_SAFE_INTEGER;
        }
        
        return baseConstraint;
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

            // Estate (Money) - uses dynamic constraint based on field type
            if (e.binaryEstate !== null) {
                const estateField = binaryFields?.ESTATE;
                const result = this.checkNumericFieldWithConstraint(
                    this.getEstateConstraint(estateField), 
                    e.binaryEstate
                );
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
        return this.checkNumericFieldWithConstraint(constraint, value);
    },

    /**
     * Check a numeric field against a specific constraint
     * @param {Object} constraint - Constraint object with min, max, warnAbove, name
     * @param {number} value - Current value
     * @returns {Object} { error, warning }
     */
    checkNumericFieldWithConstraint(constraint, value) {
        if (!constraint) return {};

        const result = {};
        const displayName = constraint.name || 'Field';

        // Check for non-numeric
        if (typeof value !== 'number' || isNaN(value)) {
            result.error = `${displayName}: Invalid number value`;
            return result;
        }

        // Check min/max bounds
        if (value < constraint.min) {
            result.error = `${displayName}: Value ${value} is below minimum (${constraint.min})`;
        } else if (constraint.max !== undefined && value > constraint.max) {
            result.error = `${displayName}: Value ${value.toLocaleString()} exceeds maximum (${constraint.max.toLocaleString()})`;
        } else if (constraint.warnAbove && value > constraint.warnAbove) {
            result.warning = `${displayName}: Very high value (${value.toLocaleString()}) - use with caution`;
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
     * @param {Object} fieldInfo - Optional field info (for dynamic constraints like estate)
     * @returns {Object} { valid, message }
     */
    quickCheck(fieldName, value, fieldInfo) {
        let constraint = this.CONSTRAINTS[fieldName];
        
        // For estate, get dynamic constraint based on field type
        if (fieldName === 'estate' && fieldInfo) {
            constraint = this.getEstateConstraint(fieldInfo);
        }
        
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
        if (constraint.max !== undefined && numValue > constraint.max) {
            return { valid: false, message: `Max: ${constraint.max.toLocaleString()}` };
        }

        return { valid: true };
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validator;
}
