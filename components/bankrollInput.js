// components/bankrollInput.js - Bankroll Input for Kelly % Column
// Creates a currency input in the header filter area
// When bankroll > 0, Kelly % values convert to monetary amounts

/**
 * Create a bankroll input element for Tabulator header filters
 * @param {object} cell - Tabulator cell object
 * @param {function} onRendered - Callback when rendered
 * @param {function} success - Success callback
 * @param {function} cancel - Cancel callback
 * @param {object} editorParams - Additional parameters (supports bankrollKey for separate storage)
 * @returns {HTMLElement} Bankroll input container element
 */
export function createBankrollInput(cell, onRendered, success, cancel, editorParams = {}) {
    const table = cell.getTable();
    const field = cell.getColumn().getField();
    
    // Use custom bankroll key if provided, otherwise use field name
    // This allows Player Prop Odds and Game Odds to have separate bankroll values
    const bankrollKey = editorParams.bankrollKey || field;
    
    const container = document.createElement('div');
    container.className = 'bankroll-input-container';
    container.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        max-width: 70px;
        margin: 0 auto;
    `;
    
    // Create the dollar sign prefix
    const dollarSign = document.createElement('span');
    dollarSign.textContent = '$';
    dollarSign.style.cssText = `
        font-size: 9px;
        font-weight: 600;
        color: #333;
        margin-right: 1px;
    `;
    
    // Create the input
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'bankroll-input';
    input.placeholder = 'Bankroll';
    input.min = '0';
    input.step = '1';
    input.style.cssText = `
        width: 100%;
        padding: 2px 3px;
        font-size: 9px;
        border: 1px solid #ccc;
        border-radius: 2px;
        text-align: left;
        box-sizing: border-box;
        -moz-appearance: textfield;
        -webkit-appearance: none;
        appearance: none;
    `;
    
    // Debounce timer
    let updateTimeout = null;
    
    // Function to update the table's bankroll state and trigger re-render
    function updateBankroll() {
        if (updateTimeout) {
            clearTimeout(updateTimeout);
        }
        
        updateTimeout = setTimeout(() => {
            const bankrollValue = input.value !== '' ? parseFloat(input.value) : 0;
            
            // Store bankroll value on the table instance for access by formatters
            // This allows the formatter to check the bankroll and convert values
            if (!window.tableBankrollState) {
                window.tableBankrollState = {};
            }
            window.tableBankrollState[bankrollKey] = bankrollValue;
            
            console.log(`Bankroll updated for ${bankrollKey}: $${bankrollValue}`);
            
            // Refresh the Kelly column cells by reformatting each row
            if (table) {
                const rows = table.getRows();
                rows.forEach(row => {
                    // reformat() re-runs the formatter for all cells in the row
                    row.reformat();
                });
            }
            
            // Call success with null since this isn't actually filtering
            success(null);
        }, 300);
    }
    
    // Event listeners
    input.addEventListener('input', updateBankroll);
    
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            updateBankroll();
        }
        if (e.key === 'Escape') {
            input.value = '';
            updateBankroll();
        }
    });
    
    // Focus styling
    input.addEventListener('focus', function() {
        input.style.borderColor = '#f97316';
        input.style.boxShadow = '0 0 0 1px rgba(249, 115, 22, 0.2)';
    });
    
    input.addEventListener('blur', function() {
        input.style.borderColor = '#ccc';
        input.style.boxShadow = 'none';
    });
    
    // Restore value from state if it exists (for tab switching)
    onRendered(function() {
        if (window.tableBankrollState && window.tableBankrollState[bankrollKey]) {
            input.value = window.tableBankrollState[bankrollKey];
        }
    });
    
    container.appendChild(dollarSign);
    container.appendChild(input);
    
    return container;
}

/**
 * Bankroll filter function - always returns true (doesn't filter, just stores value)
 * The actual conversion happens in the cell formatter
 */
export function bankrollFilterFunction(headerValue, rowValue, rowData, filterParams) {
    // This filter doesn't actually filter - it just stores the bankroll value
    // Always return true to show all rows
    return true;
}

/**
 * Get the current bankroll value for a given field
 * @param {string} field - The field name to get bankroll for
 * @returns {number} The bankroll value (0 if not set)
 */
export function getBankrollValue(field) {
    if (window.tableBankrollState && window.tableBankrollState[field]) {
        return window.tableBankrollState[field];
    }
    return 0;
}

// Export default
export default {
    createBankrollInput,
    bankrollFilterFunction,
    getBankrollValue
};
