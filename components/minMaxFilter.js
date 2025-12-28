// components/minMaxFilter.js - Min/Max numeric range filter for Tabulator columns
export function createMinMaxFilter(cell, onRendered, success, cancel, editorParams = {}) {
    const container = document.createElement('div');
    container.classList.add('min-max-filter-container');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 4px;
        width: 100%;
        box-sizing: border-box;
    `;
    
    // Create min input
    const minInput = document.createElement('input');
    minInput.type = 'number';
    minInput.placeholder = 'Min';
    minInput.classList.add('min-max-input', 'min-input');
    minInput.style.cssText = `
        width: 100%;
        padding: 4px 6px;
        border: 1px solid #ccc;
        border-radius: 3px;
        font-size: 11px;
        box-sizing: border-box;
        text-align: center;
    `;
    
    // Create max input
    const maxInput = document.createElement('input');
    maxInput.type = 'number';
    maxInput.placeholder = 'Max';
    maxInput.classList.add('min-max-input', 'max-input');
    maxInput.style.cssText = `
        width: 100%;
        padding: 4px 6px;
        border: 1px solid #ccc;
        border-radius: 3px;
        font-size: 11px;
        box-sizing: border-box;
        text-align: center;
    `;
    
    // Set step for decimal values if specified
    if (editorParams.step) {
        minInput.step = editorParams.step;
        maxInput.step = editorParams.step;
    } else {
        minInput.step = 'any';
        maxInput.step = 'any';
    }
    
    // Add placeholder customization
    if (editorParams.minPlaceholder) {
        minInput.placeholder = editorParams.minPlaceholder;
    }
    if (editorParams.maxPlaceholder) {
        maxInput.placeholder = editorParams.maxPlaceholder;
    }
    
    container.appendChild(minInput);
    container.appendChild(maxInput);
    
    // Debounce function to prevent too many filter calls
    let debounceTimer;
    const debounceDelay = editorParams.debounceDelay || 300;
    
    function applyFilter() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const minVal = minInput.value !== '' ? parseFloat(minInput.value) : null;
            const maxVal = maxInput.value !== '' ? parseFloat(maxInput.value) : null;
            
            if (minVal === null && maxVal === null) {
                success(null); // Clear filter
            } else {
                success({ min: minVal, max: maxVal });
            }
        }, debounceDelay);
    }
    
    // Event listeners
    minInput.addEventListener('input', applyFilter);
    maxInput.addEventListener('input', applyFilter);
    
    minInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            applyFilter();
        } else if (e.key === 'Escape') {
            minInput.value = '';
            maxInput.value = '';
            cancel();
        }
    });
    
    maxInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            applyFilter();
        } else if (e.key === 'Escape') {
            minInput.value = '';
            maxInput.value = '';
            cancel();
        }
    });
    
    // Focus handling
    onRendered(() => {
        minInput.focus();
    });
    
    return container;
}

// Custom filter function for min/max range
export function minMaxFilterFunction(headerValue, rowValue, rowData, filterParams) {
    // Handle null/undefined filter
    if (!headerValue || (headerValue.min === null && headerValue.max === null)) {
        return true;
    }
    
    // Parse the row value - handle various formats
    let numValue = rowValue;
    
    if (typeof rowValue === 'string') {
        // Handle formats like "19/31" - extract first number
        if (rowValue.includes('/')) {
            numValue = parseFloat(rowValue.split('/')[0]);
        }
        // Handle formats like "21 (25.2)" - extract first number
        else if (rowValue.includes('(')) {
            numValue = parseFloat(rowValue.split('(')[0].trim());
        }
        // Handle percentage strings
        else if (rowValue.includes('%')) {
            numValue = parseFloat(rowValue.replace('%', ''));
        }
        // Handle odds formats like "+150" or "-110"
        else if (rowValue.startsWith('+') || rowValue.startsWith('-')) {
            numValue = parseFloat(rowValue);
        }
        else {
            numValue = parseFloat(rowValue);
        }
    }
    
    // If we couldn't parse a number, don't filter this row
    if (isNaN(numValue)) {
        return true;
    }
    
    const { min, max } = headerValue;
    
    // Apply min/max checks
    if (min !== null && max !== null) {
        return numValue >= min && numValue <= max;
    } else if (min !== null) {
        return numValue >= min;
    } else if (max !== null) {
        return numValue <= max;
    }
    
    return true;
}

// Export combined function for easy column configuration
export function createMinMaxFilterWithFunction(editorParams = {}) {
    return {
        headerFilter: (cell, onRendered, success, cancel) => {
            return createMinMaxFilter(cell, onRendered, success, cancel, editorParams);
        },
        headerFilterFunc: minMaxFilterFunction
    };
}
