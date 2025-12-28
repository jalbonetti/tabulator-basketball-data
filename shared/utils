// shared/utils.js - Basketball Utility Functions

/**
 * Format a decimal value as a percentage with one decimal place
 * @param {number|string} value - The value to format (0-1 scale or already percentage)
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(value, decimals = 1) {
    if (value === null || value === undefined || value === '' || value === '-') {
        return '-';
    }
    
    const num = parseFloat(value);
    if (isNaN(num)) return '-';
    
    // If value is between 0 and 1, multiply by 100
    const percentage = num <= 1 && num >= 0 ? num * 100 : num;
    
    return percentage.toFixed(decimals) + '%';
}

/**
 * Format a clearance percentage (assumes value is already 0-100 scale)
 * @param {number|string} value - The value to format
 * @returns {string} Formatted percentage string
 */
export function formatClearancePercentage(value) {
    if (value === null || value === undefined || value === '' || value === '-') {
        return '-';
    }
    
    const num = parseFloat(value);
    if (isNaN(num)) return '-';
    
    return num.toFixed(1) + '%';
}

/**
 * Format a number with specified decimal places
 * @param {number|string} value - The value to format
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted number string
 */
export function formatDecimal(value, decimals = 1) {
    if (value === null || value === undefined || value === '' || value === '-') {
        return '-';
    }
    
    const num = parseFloat(value);
    if (isNaN(num)) return '-';
    
    return num.toFixed(decimals);
}

/**
 * Format odds value (adds + prefix for positive values)
 * @param {number|string} value - The odds value
 * @returns {string} Formatted odds string
 */
export function formatOdds(value) {
    if (value === null || value === undefined || value === '' || value === '-') {
        return '-';
    }
    
    const num = parseInt(value, 10);
    if (isNaN(num)) return '-';
    
    return num > 0 ? `+${num}` : `${num}`;
}

/**
 * Parse a "games played" string in format "X/Y" and return first number
 * @param {string} value - The games string (e.g., "19/31")
 * @returns {number} The first number, or 0 if invalid
 */
export function parseGamesPlayed(value) {
    if (!value || value === '-') return 0;
    
    const str = String(value);
    if (str.includes('/')) {
        return parseInt(str.split('/')[0], 10) || 0;
    }
    
    return parseInt(str, 10) || 0;
}

/**
 * Parse a "rank with value" string in format "X (Y.Y)" and return rank number
 * @param {string} value - The rank string (e.g., "21 (25.2)")
 * @returns {number} The rank number, or 9999 if invalid (sorts to end)
 */
export function parseRankWithValue(value) {
    if (!value || value === '-') return 9999;
    
    const str = String(value);
    if (str.includes('(')) {
        return parseInt(str.split('(')[0].trim(), 10) || 9999;
    }
    
    return parseInt(str, 10) || 9999;
}

/**
 * Format a rank with value ensuring proper decimal formatting
 * @param {string} value - The rank string (e.g., "21 (25.2)")
 * @returns {string} Formatted rank string
 */
export function formatRankWithValue(value) {
    if (!value || value === '-') return '-';
    
    const str = String(value);
    if (str.includes('(')) {
        const match = str.match(/^(\d+)\s*\(([^)]+)\)$/);
        if (match) {
            const rank = match[1];
            const avg = parseFloat(match[2]);
            if (!isNaN(avg)) {
                return `${rank} (${avg.toFixed(1)})`;
            }
        }
    }
    
    return str;
}

/**
 * Remove leading zero from decimal values (e.g., "0.350" -> ".350")
 * @param {string|number} value - The value to format
 * @param {number} decimals - Number of decimal places (default: 3)
 * @returns {string} Formatted value without leading zero
 */
export function removeLeadingZeroFromValue(value) {
    if (value === null || value === undefined || value === '' || value === '-') {
        return '-';
    }
    
    const str = String(value);
    
    // If it starts with "0." remove the leading zero
    if (str.startsWith('0.')) {
        return str.substring(1);
    }
    
    // If it starts with "-0." keep the minus but remove the zero
    if (str.startsWith('-0.')) {
        return '-' + str.substring(2);
    }
    
    return str;
}

/**
 * Format a ratio value to specified decimal places, removing leading zero
 * @param {number|string} value - The value to format
 * @param {number} decimals - Number of decimal places (default: 3)
 * @returns {string} Formatted ratio string
 */
export function formatRatio(value, decimals = 3) {
    if (value === null || value === undefined || value === '' || value === '-') {
        return '-';
    }
    
    const num = parseFloat(value);
    if (isNaN(num)) return '-';
    
    const formatted = num.toFixed(decimals);
    return removeLeadingZeroFromValue(formatted);
}

/**
 * Extract opponent team from a matchup string
 * @param {string} matchup - The matchup string (e.g., "LAL vs BOS" or "LAL @ BOS")
 * @param {string} team - The player's team to extract opponent from
 * @returns {string} The opponent team abbreviation
 */
export function getOpponentTeam(matchup, team) {
    if (!matchup || !team) return '';
    
    const str = String(matchup);
    
    // Handle "vs" format
    if (str.includes(' vs ')) {
        const parts = str.split(' vs ');
        return parts[0].trim() === team ? parts[1].trim() : parts[0].trim();
    }
    
    // Handle "@" format
    if (str.includes(' @ ')) {
        const parts = str.split(' @ ');
        return parts[0].trim() === team ? parts[1].trim() : parts[0].trim();
    }
    
    // Handle "-" format
    if (str.includes('-')) {
        const parts = str.split('-');
        return parts[0].trim() === team ? parts[1].trim() : parts[0].trim();
    }
    
    return '';
}

/**
 * Debounce function to limit function call frequency
 * @param {Function} func - The function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function to limit function call frequency
 * @param {Function} func - The function to throttle
 * @param {number} limit - Minimum time between calls in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Check if a value is empty (null, undefined, empty string, or dash)
 * @param {*} value - The value to check
 * @returns {boolean} True if empty
 */
export function isEmpty(value) {
    return value === null || 
           value === undefined || 
           value === '' || 
           value === '-' ||
           (typeof value === 'string' && value.trim() === '');
}

/**
 * Safe number parsing with fallback
 * @param {*} value - The value to parse
 * @param {number} fallback - Fallback value if parsing fails (default: 0)
 * @returns {number} Parsed number or fallback
 */
export function safeParseNumber(value, fallback = 0) {
    if (isEmpty(value)) return fallback;
    
    const num = parseFloat(value);
    return isNaN(num) ? fallback : num;
}

/**
 * Generate a unique ID for a row based on its data
 * @param {Object} data - The row data
 * @returns {string} Unique row identifier
 */
export function generateRowId(data) {
    const fields = [];
    
    if (data["Player Name"]) {
        fields.push(data["Player Name"]);
        if (data["Player Team"]) fields.push(data["Player Team"]);
        if (data["Player Prop"]) fields.push(data["Player Prop"]);
        if (data["Player Prop Value"]) fields.push(data["Player Prop Value"]);
        if (data["Split"]) fields.push(data["Split"]);
        return `player_${fields.join('_')}`;
    }
    
    // Fallback - use first 5 non-internal fields
    const keys = Object.keys(data).filter(k => !k.startsWith('_') && data[k] != null);
    return keys.slice(0, 5).map(k => `${k}:${data[k]}`).join('|');
}
