// components/customMultiSelect.js - Custom Multi-Select Dropdown Filter for Tabulator
// Uses position:fixed like baseball version for proper visibility

export function createCustomMultiSelect(cell, onRendered, success, cancel, editorParams = {}) {
    const dropdownWidth = editorParams.dropdownWidth || 150;
    const dropdownId = 'multiselect-dropdown-' + Math.random().toString(36).substr(2, 9);
    
    // State
    let selectedValues = [];
    let allValues = [];
    let isOpen = false;
    let isInitialized = false;
    
    const table = cell.getTable();
    const field = cell.getColumn().getField();
    
    // Create the container
    const container = document.createElement('div');
    container.classList.add('custom-multiselect');
    container.style.cssText = 'position: relative; width: 100%; z-index: 103;';
    
    // Create the button
    const button = document.createElement('div');
    button.classList.add('custom-multiselect-button');
    button.style.cssText = `
        width: 100%;
        padding: 4px 8px;
        border: 1px solid #ccc;
        background: white;
        cursor: pointer;
        font-size: 11px;
        user-select: none;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        border-radius: 3px;
        text-align: left;
    `;
    button.textContent = 'All';
    
    container.appendChild(button);
    
    // Create dropdown (will be appended to body)
    function createDropdown() {
        let existing = document.getElementById(dropdownId);
        if (existing) {
            existing.remove();
        }
        
        const dropdown = document.createElement('div');
        dropdown.id = dropdownId;
        dropdown.style.cssText = `
            position: fixed;
            background: white;
            border: 2px solid #f97316;
            min-width: ${dropdownWidth}px;
            max-width: ${Math.max(dropdownWidth, 250)}px;
            max-height: 300px;
            overflow-y: auto;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 2147483647;
            display: none;
            padding: 0;
            border-radius: 4px;
        `;
        
        document.body.appendChild(dropdown);
        return dropdown;
    }
    
    // Load unique values from column
    function loadValues() {
        if (!isInitialized) {
            const uniqueValues = new Set();
            const data = table.getData();
            
            for (let i = 0; i < data.length; i++) {
                const value = data[i][field];
                if (value !== null && value !== undefined && value !== '') {
                    uniqueValues.add(String(value));
                }
            }
            
            allValues = Array.from(uniqueValues);
            
            // Sort numerically if it looks like numbers
            if (allValues.length > 0 && !isNaN(parseFloat(allValues[0]))) {
                allValues.sort((a, b) => parseFloat(a) - parseFloat(b));
            } else {
                allValues.sort();
            }
            
            selectedValues = [...allValues];
            isInitialized = true;
        }
    }
    
    // Render dropdown content
    function renderDropdown() {
        let dropdown = document.getElementById(dropdownId) || createDropdown();
        dropdown.innerHTML = '';
        
        // Select All option
        const selectAll = document.createElement('div');
        selectAll.style.cssText = `
            padding: 8px 12px;
            border-bottom: 2px solid #f97316;
            font-weight: bold;
            background: #fff7ed;
            position: sticky;
            top: 0;
            z-index: 1;
            cursor: pointer;
        `;
        
        const selectAllLabel = document.createElement('label');
        selectAllLabel.style.cssText = 'display: flex; align-items: center; cursor: pointer;';
        
        const selectAllCheckbox = document.createElement('input');
        selectAllCheckbox.type = 'checkbox';
        selectAllCheckbox.checked = selectedValues.length === allValues.length;
        selectAllCheckbox.style.marginRight = '8px';
        
        const selectAllText = document.createElement('span');
        selectAllText.textContent = selectedValues.length === allValues.length ? 'Deselect All' : 'Select All';
        
        selectAllCheckbox.addEventListener('change', function(e) {
            e.stopPropagation();
            if (this.checked) {
                selectedValues = [...allValues];
            } else {
                selectedValues = [];
            }
            renderDropdown();
            applyFilter();
        });
        
        selectAllLabel.appendChild(selectAllCheckbox);
        selectAllLabel.appendChild(selectAllText);
        selectAll.appendChild(selectAllLabel);
        dropdown.appendChild(selectAll);
        
        // Individual options
        allValues.forEach(value => {
            const option = document.createElement('div');
            option.style.cssText = `
                padding: 6px 12px;
                cursor: pointer;
                font-size: 12px;
                border-bottom: 1px solid #eee;
            `;
            option.addEventListener('mouseenter', () => option.style.background = '#fff7ed');
            option.addEventListener('mouseleave', () => option.style.background = 'white');
            
            const label = document.createElement('label');
            label.style.cssText = 'display: flex; align-items: center; cursor: pointer;';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = selectedValues.includes(value);
            checkbox.style.marginRight = '8px';
            
            checkbox.addEventListener('change', function(e) {
                e.stopPropagation();
                if (this.checked) {
                    if (!selectedValues.includes(value)) {
                        selectedValues.push(value);
                    }
                } else {
                    selectedValues = selectedValues.filter(v => v !== value);
                }
                renderDropdown();
                applyFilter();
            });
            
            const text = document.createElement('span');
            text.textContent = value;
            text.style.cssText = 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
            
            label.appendChild(checkbox);
            label.appendChild(text);
            option.appendChild(label);
            dropdown.appendChild(option);
        });
        
        return dropdown;
    }
    
    // Apply filter
    function applyFilter() {
        updateButtonText();
        
        if (selectedValues.length === 0) {
            // Nothing selected - show nothing
            success('IMPOSSIBLE_VALUE_THAT_MATCHES_NOTHING');
        } else if (selectedValues.length === allValues.length) {
            // All selected - clear filter
            success('');
        } else {
            // Some selected
            success([...selectedValues]);
        }
    }
    
    // Update button text
    function updateButtonText() {
        if (selectedValues.length === 0) {
            button.textContent = 'None';
        } else if (selectedValues.length === allValues.length) {
            button.textContent = 'All';
        } else if (selectedValues.length === 1) {
            button.textContent = selectedValues[0];
        } else {
            button.textContent = `${selectedValues.length} selected`;
        }
    }
    
    // Position dropdown
    function positionDropdown() {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;
        
        const rect = button.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // Try to position above first
        let top = rect.top - dropdown.offsetHeight - 2;
        
        // If not enough space above, position below
        if (top < 10) {
            top = rect.bottom + 2;
        }
        
        // Ensure it doesn't go off the right edge
        let left = rect.left;
        if (left + dropdown.offsetWidth > window.innerWidth - 10) {
            left = window.innerWidth - dropdown.offsetWidth - 10;
        }
        
        dropdown.style.top = top + 'px';
        dropdown.style.left = left + 'px';
    }
    
    // Toggle dropdown
    function toggleDropdown() {
        isOpen = !isOpen;
        const dropdown = document.getElementById(dropdownId) || createDropdown();
        
        if (isOpen) {
            loadValues();
            renderDropdown();
            dropdown.style.display = 'block';
            positionDropdown();
        } else {
            dropdown.style.display = 'none';
        }
    }
    
    // Close dropdown
    function closeDropdown() {
        isOpen = false;
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    }
    
    // Event listeners
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown();
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown && !container.contains(e.target) && !dropdown.contains(e.target)) {
            closeDropdown();
        }
    });
    
    // Close on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDropdown();
        }
    });
    
    // Reposition on scroll/resize
    window.addEventListener('scroll', positionDropdown, true);
    window.addEventListener('resize', positionDropdown);
    
    // Initialize
    onRendered(() => {
        loadValues();
        updateButtonText();
    });
    
    return container;
}

// Custom filter function for multi-select
export function multiSelectFilterFunction(headerValue, rowValue, rowData, filterParams) {
    if (!headerValue || headerValue === '') {
        return true;
    }
    
    if (headerValue === 'IMPOSSIBLE_VALUE_THAT_MATCHES_NOTHING') {
        return false;
    }
    
    if (Array.isArray(headerValue)) {
        return headerValue.includes(String(rowValue));
    }
    
    return String(rowValue) === String(headerValue);
}
