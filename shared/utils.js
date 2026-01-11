// shared/utils.js - Utility Functions for Basketball Props Tables

/**
 * Get background color for rank values (1-10 green, 11-20 white, 21-30 red)
 * @param {number|string} rank - Rank value (can be "5" or "5 (12.3)" format)
 * @returns {string} CSS color value or empty string for default/white
 */
export function getRankBackgroundColor(rank) {
    // Extract numeric rank from various formats
    let num;
    if (typeof rank === 'number') {
        num = rank;
    } else if (typeof rank === 'string') {
        // Handle formats like "5", "#5", "5 (12.3)", "#5 (12.3)"
        const cleaned = rank.replace('#', '').trim();
        const match = cleaned.match(/^(\d+)/);
        num = match ? parseInt(match[1], 10) : NaN;
    } else {
        return '';
    }
    
    if (isNaN(num)) return '';
    
    if (num <= 10) return '#d4edda';  // Light green
    if (num >= 21) return '#f8d7da';  // Light red
    return '';  // 11-20 = white/default
}

/**
 * Format a decimal value as a percentage
 * @param {number} value - Decimal value (e.g., 0.75)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(value, decimals = 1) {
    if (value === null || value === undefined || value === '') return '-';
    const num = parseFloat(value);
    if (isNaN(num)) return '-';
    return (num * 100).toFixed(decimals) + '%';
}

/**
 * Format a clearance percentage value
 * @param {number|string} value - Value already in percentage form (e.g., 75.5)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export function formatClearancePercentage(value, decimals = 1) {
    if (value === null || value === undefined || value === '') return '-';
    const str = String(value);
    if (str.includes('%')) return str;
    const num = parseFloat(value);
    if (isNaN(num)) return '-';
    return num.toFixed(decimals) + '%';
}

/**
 * Format a ratio value with specified decimal places
 * @param {number} value - Ratio value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted ratio string
 */
export function formatRatio(value, decimals = 3) {
    if (value === null || value === undefined || value === '') return '-';
    const num = parseFloat(value);
    if (isNaN(num)) return '-';
    return num.toFixed(decimals);
}

/**
 * Extract opponent team from matchup string
 * @param {string} matchup - Matchup string (e.g., "LAL @ BOS" or "LAL vs BOS")
 * @param {string} playerTeam - Player's team abbreviation
 * @returns {string} Opponent team abbreviation
 */
export function getOpponentTeam(matchup, playerTeam) {
    if (!matchup || !playerTeam) return '-';
    
    // Try "@" format first (LAL @ BOS)
    if (matchup.includes('@')) {
        const parts = matchup.split('@').map(s => s.trim());
        if (parts.length === 2) {
            const team1 = parts[0].match(/[A-Z]{2,4}/)?.[0];
            const team2 = parts[1].match(/[A-Z]{2,4}/)?.[0];
            
            if (team1 === playerTeam) return team2 || '-';
            if (team2 === playerTeam) return team1 || '-';
        }
    }
    
    // Try "vs" format (LAL vs BOS)
    if (matchup.includes(' vs ')) {
        const parts = matchup.split(' vs ').map(s => s.trim());
        if (parts.length === 2) {
            const team1 = parts[0].match(/[A-Z]{2,4}/)?.[0];
            const team2 = parts[1].match(/[A-Z]{2,4}/)?.[0];
            
            if (team1 === playerTeam) return team2 || '-';
            if (team2 === playerTeam) return team1 || '-';
        }
    }
    
    return '-';
}

/**
 * Determine player location from matchup string
 * @param {string} matchup - Matchup string
 * @param {string} playerTeam - Player's team abbreviation
 * @returns {'Home'|'Away'|'Home/Away'} Player's location
 */
export function getPlayerLocation(matchup, playerTeam) {
    if (!matchup || !playerTeam) return 'Home/Away';
    
    // "@" format: away team @ home team
    if (matchup.includes('@')) {
        const parts = matchup.split('@').map(s => s.trim());
        if (parts.length === 2) {
            const awayTeam = parts[0].match(/[A-Z]{2,4}/)?.[0];
            const homeTeam = parts[1].match(/[A-Z]{2,4}/)?.[0];
            
            if (awayTeam === playerTeam) return 'Away';
            if (homeTeam === playerTeam) return 'Home';
        }
    }
    
    // "vs" format: home team vs away team
    if (matchup.includes(' vs ')) {
        const parts = matchup.split(' vs ').map(s => s.trim());
        if (parts.length === 2) {
            const homeTeam = parts[0].match(/[A-Z]{2,4}/)?.[0];
            const awayTeam = parts[1].match(/[A-Z]{2,4}/)?.[0];
            
            if (homeTeam === playerTeam) return 'Home';
            if (awayTeam === playerTeam) return 'Away';
        }
    }
    
    return 'Home/Away';
}

/**
 * Format odds value with +/- prefix
 * @param {number|string} value - Odds value
 * @returns {string} Formatted odds string
 */
export function formatOdds(value) {
    if (value === null || value === undefined || value === '') return '-';
    const num = parseInt(value, 10);
    if (isNaN(num)) return '-';
    return num > 0 ? `+${num}` : `${num}`;
}

/**
 * Format odds value with book name
 * @param {string} value - Odds value potentially with book name (e.g., "-110 (DraftKings)")
 * @returns {string} Formatted odds string
 */
export function formatOddsWithBook(value) {
    if (value === null || value === undefined || value === '') return '-';
    const str = String(value);
    
    if (str.includes('(')) {
        const parts = str.split('(');
        const numPart = parts[0].trim();
        const bookPart = '(' + parts[1];
        const num = parseInt(numPart, 10);
        if (isNaN(num)) return str;
        const formattedNum = num > 0 ? `+${num}` : `${num}`;
        return `${formattedNum} ${bookPart}`;
    }
    
    return formatOdds(str);
}

/**
 * Debounce function execution
 * @param {function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {function} Debounced function
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
 * Throttle function execution
 * @param {function} func - Function to throttle
 * @param {number} limit - Minimum time between calls in milliseconds
 * @returns {function} Throttled function
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
 * Remove leading zero from decimal values
 * @param {number|string} value - Value to format
 * @returns {string} Formatted value
 */
export function removeLeadingZeroFromValue(value) {
    if (value === null || value === undefined || value === '') return '-';
    const str = String(value);
    if (str.startsWith('0.')) {
        return str.substring(1);
    }
    if (str.startsWith('-0.')) {
        return '-' + str.substring(2);
    }
    return str;
}

// Default export
export default {
    getRankBackgroundColor,
    formatPercentage,
    formatClearancePercentage,
    formatRatio,
    getOpponentTeam,
    getPlayerLocation,
    formatOdds,
    formatOddsWithBook,
    debounce,
    throttle,
    removeLeadingZeroFromValue
};
