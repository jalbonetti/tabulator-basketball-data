// components/minMaxFilter.js - Min/Max Range Filter for Tabulator
// Provides a dual-input filter for numeric columns (e.g., prop values, odds)

/**
 * Create a min/max filter element for Tabulator header filters
 * @param {object} cell - Tabulator cell object
 * @param {function} onRendered - Callback when rendered
 * @param {function} success - Success callback
 * @param {function} cancel - Cancel callback
 * @param {object} editorParams - Additional parameters
 * @returns {HTMLElement} Filter container element
 */
export function createMinMaxFilter(cell, onRendered, success, cancel, editorParams = {}) {
    const container = document.createElement('div');
    container.className = 'min-max-filter-container';
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 3px;
        width: 100%;
    `;
    
    // Create min input
    const minInput = document.createElement('input');
    minInput.type = 'number';
    minInput.className = 'min-max-input min-input';
    minInput.placeholder = 'Min';
    minInput.style.cssText = `
        width: 100%;
        padding: 3px 5px;
        font-size: 10px;
        border: 1px solid #ccc;
        border-radius: 2px;
        text-align: center;
        box-sizing: border-box;
        -moz-appearance: textfield;
    `;
    
    // Create max input
    const maxInput = document.createElement('input');
    maxInput.type = 'number';
    maxInput.className = 'min-max-input max-input';
    maxInput.placeholder = 'Max';
    maxInput.style.cssText = `
        width: 100%;
        padding: 3px 5px;
        font-size: 10px;
        border: 1px solid #ccc;
        border-radius: 2px;
        text-align: center;
        box-sizing: border-box;
        -moz-appearance: textfield;
    `;
    
    // Debounce timer
    let filterTimeout = null;
    
    // Apply filter function
    function applyFilter() {
        if (filterTimeout) {
            clearTimeout(filterTimeout);
        }
        
        filterTimeout = setTimeout(() => {
            const minVal = minInput.value !== '' ? parseFloat(minInput.value) : null;
            const maxVal = maxInput.value !== '' ? parseFloat(maxInput.value) : null;
            
            if (minVal === null && maxVal === null) {
                success(null); // Clear filter
            } else {
                success({ min: minVal, max: maxVal });
            }
        }, 300);
    }
    
    // Event listeners
    minInput.addEventListener('input', applyFilter);
    maxInput.addEventListener('input', applyFilter);
    
    minInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            applyFilter();
        }
        if (e.key === 'Escape') {
            minInput.value = '';
            maxInput.value = '';
            success(null);
        }
    });
    
    maxInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            applyFilter();
        }
        if (e.key === 'Escape') {
            minInput.value = '';
            maxInput.value = '';
            success(null);
        }
    });
    
    // Focus styling
    minInput.addEventListener('focus', function() {
        minInput.style.borderColor = '#f97316';
        minInput.style.boxShadow = '0 0 0 2px rgba(249, 115, 22, 0.2)';
    });
    
    minInput.addEventListener('blur', function() {
        minInput.style.borderColor = '#ccc';
        minInput.style.boxShadow = 'none';
    });
    
    maxInput.addEventListener('focus', function() {
        maxInput.style.borderColor = '#f97316';
        maxInput.style.boxShadow = '0 0 0 2px rgba(249, 115, 22, 0.2)';
    });
    
    maxInput.addEventListener('blur', function() {
        maxInput.style.borderColor = '#ccc';
        maxInput.style.boxShadow = 'none';
    });
    
    container.appendChild(minInput);
    container.appendChild(maxInput);
    
    return container;
}

/**
 * Filter function for min/max range filtering
 * @param {object} headerValue - Object with min/max values
 * @param {*} rowValue - The cell value to test
 * @param {object} rowData - Full row data
 * @param {object} filterParams - Additional filter parameters
 * @returns {boolean} Whether row should be shown
 */
export function minMaxFilterFunction(headerValue, rowValue, rowData, filterParams) {
    // If no filter value, show all rows
    if (!headerValue || (headerValue.min === null && headerValue.max === null)) {
        return true;
    }
    
    // Parse the row value - handle various formats
    let numValue;
    
    if (rowValue === null || rowValue === undefined || rowValue === '' || rowValue === '-') {
        return false; // Don't show rows with no value when filtering
    }
    
    const strValue = String(rowValue).trim();
    
    // Handle odds format like "-110 (DraftKings)" or "+150"
    if (strValue.includes('(')) {
        const numPart = strValue.split('(')[0].trim();
        numValue = parseFloat(numPart);
    } else if (strValue.startsWith('+') || strValue.startsWith('-')) {
        // Handle odds format like "+150" or "-110"
        numValue = parseFloat(strValue);
    } else {
        numValue = parseFloat(strValue);
    }
    
    if (isNaN(numValue)) {
        return false;
    }
    
    // Apply min/max filters
    const { min, max } = headerValue;
    
    if (min !== null && max !== null) {
        return numValue >= min && numValue <= max;
    } else if (min !== null) {
        return numValue >= min;
    } else if (max !== null) {
        return numValue <= max;
    }
    
    return true;
}

// Export default
export default {
    createMinMaxFilter,
    minMaxFilterFunction
};
