// components/customMultiSelect.js - Custom Multi-Select Dropdown Filter for Tabulator
export function createCustomMultiSelect(cell, onRendered, success, cancel, editorParams = {}) {
    const container = document.createElement('div');
    container.classList.add('custom-multiselect-container');
    container.style.cssText = 'position: relative; width: 100%;';
    
    // Create the display input
    const displayInput = document.createElement('input');
    displayInput.type = 'text';
    displayInput.readOnly = true;
    displayInput.placeholder = editorParams.placeholder || 'All';
    displayInput.classList.add('custom-multiselect-input');
    displayInput.style.cssText = `
        width: 100%;
        padding: 4px 20px 4px 6px;
        border: 1px solid #ccc;
        border-radius: 3px;
        font-size: 11px;
        cursor: pointer;
        box-sizing: border-box;
        background: white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath fill='%23666' d='M0 2l4 4 4-4z'/%3E%3C/svg%3E") no-repeat right 6px center;
    `;
    
    // Create dropdown container
    const dropdown = document.createElement('div');
    dropdown.classList.add('custom-multiselect-dropdown');
    dropdown.style.cssText = `
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        width: ${editorParams.dropdownWidth || 150}px;
        max-height: 250px;
        overflow-y: auto;
        background: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        margin-top: 2px;
    `;
    
    // Search input for filtering options
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search...';
    searchInput.style.cssText = `
        width: calc(100% - 12px);
        margin: 6px;
        padding: 6px 8px;
        border: 1px solid #ddd;
        border-radius: 3px;
        font-size: 11px;
        box-sizing: border-box;
    `;
    
    // Options container
    const optionsContainer = document.createElement('div');
    optionsContainer.classList.add('options-container');
    optionsContainer.style.cssText = 'padding: 4px 0;';
    
    // Action buttons container
    const actionsContainer = document.createElement('div');
    actionsContainer.style.cssText = `
        display: flex;
        gap: 4px;
        padding: 6px;
        border-top: 1px solid #eee;
        background: #f8f9fa;
    `;
    
    const selectAllBtn = document.createElement('button');
    selectAllBtn.textContent = 'All';
    selectAllBtn.type = 'button';
    selectAllBtn.style.cssText = `
        flex: 1;
        padding: 4px 8px;
        border: 1px solid #ddd;
        border-radius: 3px;
        background: white;
        cursor: pointer;
        font-size: 10px;
    `;
    
    const clearAllBtn = document.createElement('button');
    clearAllBtn.textContent = 'Clear';
    clearAllBtn.type = 'button';
    clearAllBtn.style.cssText = `
        flex: 1;
        padding: 4px 8px;
        border: 1px solid #ddd;
        border-radius: 3px;
        background: white;
        cursor: pointer;
        font-size: 10px;
    `;
    
    actionsContainer.appendChild(selectAllBtn);
    actionsContainer.appendChild(clearAllBtn);
    
    dropdown.appendChild(searchInput);
    dropdown.appendChild(optionsContainer);
    dropdown.appendChild(actionsContainer);
    
    container.appendChild(displayInput);
    container.appendChild(dropdown);
    
    // State
    let selectedValues = new Set();
    let allValues = [];
    let isOpen = false;
    
    // Get unique values from the column
    function getColumnValues() {
        const table = cell.getTable();
        const field = cell.getColumn().getField();
        const values = new Set();
        
        table.getData().forEach(row => {
            const value = row[field];
            if (value !== null && value !== undefined && value !== '') {
                values.add(String(value));
            }
        });
        
        return Array.from(values).sort((a, b) => {
            // Try numeric sort first
            const numA = parseFloat(a);
            const numB = parseFloat(b);
            if (!isNaN(numA) && !isNaN(numB)) {
                return numA - numB;
            }
            // Fall back to string sort
            return a.localeCompare(b);
        });
    }
    
    // Render options
    function renderOptions(filterText = '') {
        optionsContainer.innerHTML = '';
        
        const filteredValues = allValues.filter(value => 
            value.toLowerCase().includes(filterText.toLowerCase())
        );
        
        filteredValues.forEach(value => {
            const option = document.createElement('label');
            option.style.cssText = `
                display: flex;
                align-items: center;
                padding: 6px 10px;
                cursor: pointer;
                font-size: 12px;
                transition: background 0.15s;
            `;
            option.addEventListener('mouseenter', () => {
                option.style.background = '#f0f4ff';
            });
            option.addEventListener('mouseleave', () => {
                option.style.background = 'transparent';
            });
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = selectedValues.has(value);
            checkbox.style.cssText = 'margin-right: 8px; cursor: pointer;';
            
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    selectedValues.add(value);
                } else {
                    selectedValues.delete(value);
                }
                updateDisplay();
                applyFilter();
            });
            
            const text = document.createElement('span');
            text.textContent = value;
            text.style.cssText = 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
            
            option.appendChild(checkbox);
            option.appendChild(text);
            optionsContainer.appendChild(option);
        });
    }
    
    // Update display input
    function updateDisplay() {
        if (selectedValues.size === 0 || selectedValues.size === allValues.length) {
            displayInput.value = '';
            displayInput.placeholder = 'All';
        } else if (selectedValues.size === 1) {
            displayInput.value = Array.from(selectedValues)[0];
        } else {
            displayInput.value = `${selectedValues.size} selected`;
        }
    }
    
    // Apply filter
    function applyFilter() {
        if (selectedValues.size === 0 || selectedValues.size === allValues.length) {
            success(null); // Clear filter
        } else {
            success(Array.from(selectedValues));
        }
    }
    
    // Toggle dropdown
    function toggleDropdown() {
        isOpen = !isOpen;
        dropdown.style.display = isOpen ? 'block' : 'none';
        if (isOpen) {
            allValues = getColumnValues();
            renderOptions();
            searchInput.value = '';
            searchInput.focus();
        }
    }
    
    // Close dropdown
    function closeDropdown() {
        isOpen = false;
        dropdown.style.display = 'none';
    }
    
    // Event listeners
    displayInput.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown();
    });
    
    searchInput.addEventListener('input', () => {
        renderOptions(searchInput.value);
    });
    
    searchInput.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    selectAllBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedValues = new Set(allValues);
        renderOptions(searchInput.value);
        updateDisplay();
        applyFilter();
    });
    
    clearAllBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedValues.clear();
        renderOptions(searchInput.value);
        updateDisplay();
        applyFilter();
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            closeDropdown();
        }
    });
    
    // Close on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDropdown();
        }
    });
    
    // Initialize
    onRendered(() => {
        allValues = getColumnValues();
    });
    
    return container;
}

// Custom filter function for multi-select
export function multiSelectFilterFunction(headerValue, rowValue, rowData, filterParams) {
    if (!headerValue || headerValue.length === 0) {
        return true;
    }
    
    const cellValue = String(rowValue);
    return headerValue.includes(cellValue);
}
