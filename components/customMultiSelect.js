// components/customMultiSelect.js - Custom Multi-Select Dropdown Filter for Tabulator
// UPDATED: Dropdowns now open ABOVE the table header, matching Baseball repository behavior
// This solves the issue where dropdowns were appearing below/behind the table

export function createCustomMultiSelect(cell, onRendered, success, cancel, options = {}) {
    // Extract options with defaults
    const dropdownWidth = options.dropdownWidth || 200;
    
    var button = document.createElement("button");
    button.className = "custom-multiselect-button";
    button.textContent = "Loading...";
    button.style.cssText = `
        width: 100%;
        padding: 4px 8px;
        border: 1px solid #ccc;
        background: white;
        cursor: pointer;
        font-size: 11px;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        border-radius: 3px;
    `;
    
    var field = cell.getColumn().getField();
    var table = cell.getTable();
    var allValues = [];
    var selectedValues = [];
    var dropdownId = 'dropdown_' + field.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Math.random().toString(36).substr(2, 9);
    var isOpen = false;
    var isInitialized = false;
    var filterTimeout = null;
    var clickTimeout = null;
    var loadAttempts = 0;
    
    // Store reference to column
    var column = cell.getColumn();
    
    // Store expanded rows before filter operations
    function saveExpandedState() {
        const expandedRows = new Set();
        const rows = table.getRows();
        
        rows.forEach(row => {
            const data = row.getData();
            if (data._expanded) {
                // Generate a unique ID for the row
                let rowId = '';
                if (data["Player Name"]) {
                    rowId = `player_${data["Player Name"]}_${data["Player Team"]}`;
                    if (data["Player Prop"]) rowId += `_${data["Player Prop"]}`;
                    if (data["Player Prop Value"]) rowId += `_${data["Player Prop Value"]}`;
                    if (data["Split"]) rowId += `_${data["Split"]}`;
                }
                
                if (rowId) {
                    expandedRows.add(rowId);
                }
            }
        });
        
        return expandedRows;
    }
    
    // Restore expanded rows after filter operations
    function restoreExpandedState(expandedRows) {
        if (!expandedRows || expandedRows.size === 0) return;
        
        setTimeout(() => {
            const rows = table.getRows();
            
            rows.forEach(row => {
                const data = row.getData();
                
                // Generate the same unique ID
                let rowId = '';
                if (data["Player Name"]) {
                    rowId = `player_${data["Player Name"]}_${data["Player Team"]}`;
                    if (data["Player Prop"]) rowId += `_${data["Player Prop"]}`;
                    if (data["Player Prop Value"]) rowId += `_${data["Player Prop Value"]}`;
                    if (data["Split"]) rowId += `_${data["Split"]}`;
                }
                
                if (rowId && expandedRows.has(rowId)) {
                    if (!data._expanded) {
                        data._expanded = true;
                        row.update(data);
                        row.reformat();
                    }
                    
                    // Update the expander icon
                    const cells = row.getCells();
                    const nameCell = cells.find(c => c.getField() === "Player Name");
                    if (nameCell) {
                        const cellElement = nameCell.getElement();
                        const expander = cellElement.querySelector('.expand-icon');
                        if (expander) {
                            expander.style.transform = 'rotate(90deg)';
                        }
                    }
                }
            });
            
            console.log(`Restored ${expandedRows.size} expanded rows after filter update`);
        }, 200);
    }
    
    function createDropdown() {
        var existing = document.getElementById(dropdownId);
        if (existing) {
            existing.remove();
        }
        
        var dropdown = document.createElement("div");
        dropdown.id = dropdownId;
        dropdown.style.cssText = `
            position: fixed;
            background: white;
            border: 1px solid #333;
            min-width: ${dropdownWidth}px;
            max-width: ${Math.max(dropdownWidth, 300)}px;
            max-height: 300px;
            overflow-y: auto;
            box-shadow: 0 -4px 12px rgba(0,0,0,0.3);
            z-index: 2147483647;
            display: none;
            padding: 0;
            border-radius: 4px;
        `;
        
        document.body.appendChild(dropdown);
        return dropdown;
    }
    
    // Optimized filter function with debouncing
    function customFilterFunction(headerValue, rowValue, rowData, filterParams) {
        // If no header value, show all
        if (!headerValue) return true;
        
        // Convert row value to string for comparison
        var rowValueStr = String(rowValue || '');
        
        // If headerValue is our special hide-all value
        if (headerValue === "IMPOSSIBLE_VALUE_THAT_MATCHES_NOTHING") {
            return false;
        }
        
        // If headerValue is an array (our selected values)
        if (Array.isArray(headerValue)) {
            return headerValue.indexOf(rowValueStr) !== -1;
        }
        
        // Default: exact match
        return rowValueStr === String(headerValue);
    }
    
    // Set the custom filter function on the column
    column.getDefinition().headerFilterFunc = customFilterFunction;
    
    // Debounced filter update with state preservation
    function updateFilter() {
        // Clear any pending filter update
        if (filterTimeout) {
            clearTimeout(filterTimeout);
        }
        
        // Save expanded state before filtering
        const expandedState = saveExpandedState();
        
        // Debounce filter updates to prevent rapid redraws
        filterTimeout = setTimeout(() => {
            console.log("Updating filter for", field, "- selected:", selectedValues.length, "of", allValues.length);
            
            if (selectedValues.length === 0) {
                // No values selected - hide all rows
                success("IMPOSSIBLE_VALUE_THAT_MATCHES_NOTHING");
            } else if (selectedValues.length === allValues.length) {
                // All selected - show all rows
                success("");
            } else {
                // Some selected - pass the array of selected values
                success([...selectedValues]);
            }
            
            // Restore expanded state after filter completes
            setTimeout(() => {
                restoreExpandedState(expandedState);
            }, 100);
        }, 150);
    }
    
    // Check for existing filter value and sync with it
    function getCurrentFilterValue() {
        const headerFilters = table.getHeaderFilters();
        const currentFilter = headerFilters.find(f => f.field === field);
        
        if (currentFilter && currentFilter.value) {
            if (currentFilter.value === "IMPOSSIBLE_VALUE_THAT_MATCHES_NOTHING") {
                return [];
            } else if (Array.isArray(currentFilter.value)) {
                return currentFilter.value.map(v => String(v));
            } else if (currentFilter.value === "") {
                return null;
            } else {
                return [String(currentFilter.value)];
            }
        }
        
        return null;
    }
    
    // Load values with filter state sync
    function loadValues() {
        if (!isInitialized) {
            var uniqueValues = new Set();
            var data = table.getData();
            
            for (var i = 0; i < data.length; i++) {
                var value = data[i][field];
                if (value !== null && value !== undefined && value !== '') {
                    uniqueValues.add(String(value));
                }
            }
            
            allValues = Array.from(uniqueValues);
            
            // Sort prop value fields numerically
            if (field === "Player Prop Value") {
                allValues.sort(function(a, b) {
                    return parseFloat(a) - parseFloat(b);
                });
            } else {
                allValues.sort();
            }
            
            // Check for existing filter and sync selected values
            const existingFilter = getCurrentFilterValue();
            
            if (existingFilter !== null) {
                selectedValues = existingFilter;
                console.log(`Synced with existing filter for ${field}: ${selectedValues.length} of ${allValues.length} selected`);
            } else {
                selectedValues = [...allValues];
            }
            
            isInitialized = true;
            updateButtonText();
            
            console.log(`Loaded ${allValues.length} unique values for ${field}`);
        }
    }
    
    function updateButtonText() {
        if (selectedValues.length === 0) {
            button.textContent = "None";
            button.style.color = "#999";
        } else if (selectedValues.length === allValues.length) {
            button.textContent = "All";
            button.style.color = "#333";
        } else {
            button.textContent = selectedValues.length + " of " + allValues.length;
            button.style.color = "#f97316";
        }
    }
    
    function createOptionElement(value, isSelectAll = false) {
        var optionDiv = document.createElement('div');
        optionDiv.style.cssText = `
            padding: 8px 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            border-bottom: 1px solid #eee;
            background: white;
            transition: background 0.15s ease;
        `;
        
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.style.cssText = 'margin: 0; cursor: pointer;';
        
        var label = document.createElement('span');
        label.textContent = isSelectAll ? (selectedValues.length === allValues.length ? 'Deselect All' : 'Select All') : value;
        label.style.cssText = isSelectAll ? 'font-weight: bold; color: #f97316;' : '';
        
        if (isSelectAll) {
            checkbox.checked = selectedValues.length === allValues.length;
        } else {
            checkbox.checked = selectedValues.indexOf(value) !== -1;
        }
        
        optionDiv.appendChild(checkbox);
        optionDiv.appendChild(label);
        
        optionDiv.addEventListener('click', function(e) {
            e.stopPropagation();
            
            if (isSelectAll) {
                if (selectedValues.length === allValues.length) {
                    selectedValues = [];
                } else {
                    selectedValues = [...allValues];
                }
                renderDropdown();
            } else {
                var index = selectedValues.indexOf(value);
                if (index === -1) {
                    selectedValues.push(value);
                    checkbox.checked = true;
                } else {
                    selectedValues.splice(index, 1);
                    checkbox.checked = false;
                }
                // Update select all checkbox
                var selectAllCheckbox = dropdown.querySelector('input[type="checkbox"]');
                if (selectAllCheckbox) {
                    selectAllCheckbox.checked = selectedValues.length === allValues.length;
                    var selectAllLabel = selectAllCheckbox.nextElementSibling;
                    if (selectAllLabel) {
                        selectAllLabel.textContent = selectedValues.length === allValues.length ? 'Deselect All' : 'Select All';
                    }
                }
            }
            
            updateButtonText();
            updateFilter();
        });
        
        optionDiv.addEventListener('mouseenter', function() {
            optionDiv.style.background = '#f5f5f5';
        });
        
        optionDiv.addEventListener('mouseleave', function() {
            optionDiv.style.background = 'white';
        });
        
        return optionDiv;
    }
    
    var dropdown = createDropdown();
    
    function renderDropdown() {
        dropdown.innerHTML = '';
        
        // Add select all option
        dropdown.appendChild(createOptionElement(null, true));
        
        // Add separator
        var separator = document.createElement('div');
        separator.style.cssText = 'height: 1px; background: #ccc; margin: 0;';
        dropdown.appendChild(separator);
        
        // Add individual options
        allValues.forEach(function(value) {
            dropdown.appendChild(createOptionElement(value, false));
        });
    }
    
    function showDropdown() {
        renderDropdown();
        
        var buttonRect = button.getBoundingClientRect();
        
        // CRITICAL: Position dropdown ABOVE the button (opens upward)
        dropdown.style.display = 'block';
        
        // Calculate position - open above the button
        var dropdownHeight = Math.min(300, dropdown.scrollHeight);
        var topPosition = buttonRect.top - dropdownHeight - 2;
        
        // If not enough space above, position below (fallback)
        if (topPosition < 10) {
            topPosition = buttonRect.bottom + 2;
        }
        
        dropdown.style.left = buttonRect.left + 'px';
        dropdown.style.top = topPosition + 'px';
        dropdown.style.width = Math.max(dropdownWidth, buttonRect.width) + 'px';
        
        // Ensure dropdown doesn't go off screen horizontally
        var dropdownRect = dropdown.getBoundingClientRect();
        if (dropdownRect.right > window.innerWidth - 10) {
            dropdown.style.left = (window.innerWidth - dropdown.offsetWidth - 10) + 'px';
        }
        
        isOpen = true;
    }
    
    function hideDropdown() {
        dropdown.style.display = 'none';
        isOpen = false;
    }
    
    // Close handler for clicking outside
    var closeHandler = function(e) {
        if (!dropdown.contains(e.target) && !button.contains(e.target)) {
            hideDropdown();
        }
    };
    
    document.addEventListener('click', closeHandler);
    
    // Button click handler
    button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Close other dropdowns
        document.querySelectorAll('[id^="dropdown_"]').forEach(function(otherDropdown) {
            if (otherDropdown.id !== dropdownId) {
                otherDropdown.style.display = 'none';
            }
        });
        
        if (isOpen) {
            hideDropdown();
        } else {
            if (!isInitialized) {
                loadValues();
            }
            showDropdown();
        }
    });
    
    // Handle window resize and scroll
    window.addEventListener('resize', function() {
        if (isOpen) {
            var buttonRect = button.getBoundingClientRect();
            var dropdownHeight = Math.min(300, dropdown.scrollHeight);
            var topPosition = buttonRect.top - dropdownHeight - 2;
            
            if (topPosition < 10) {
                topPosition = buttonRect.bottom + 2;
            }
            
            dropdown.style.left = buttonRect.left + 'px';
            dropdown.style.top = topPosition + 'px';
        }
    });
    
    window.addEventListener('scroll', function() {
        if (isOpen) {
            var buttonRect = button.getBoundingClientRect();
            var dropdownHeight = Math.min(300, dropdown.scrollHeight);
            var topPosition = buttonRect.top - dropdownHeight - 2;
            
            if (topPosition < 10) {
                topPosition = buttonRect.bottom + 2;
            }
            
            dropdown.style.left = buttonRect.left + 'px';
            dropdown.style.top = topPosition + 'px';
        }
    }, true);
    
    // Initial load attempt
    var tryLoad = function() {
        loadAttempts++;
        var data = table.getData();
        
        if (data && data.length > 0) {
            loadValues();
        } else if (loadAttempts < 5) {
            setTimeout(tryLoad, 500);
        }
    };
    
    // Defer initial load
    requestAnimationFrame(() => {
        tryLoad();
    });
    
    // Listen for table events
    table.on("dataLoaded", function() {
        if (!isInitialized) {
            setTimeout(function() {
                loadValues();
                const existingFilter = getCurrentFilterValue();
                if (existingFilter === null && selectedValues.length !== allValues.length) {
                    updateFilter();
                }
            }, 100);
        }
    });
    
    // Listen for filter changes from other sources
    table.on("dataFiltered", function() {
        if (isInitialized) {
            const currentFilter = getCurrentFilterValue();
            if (currentFilter !== null) {
                const currentSet = new Set(currentFilter);
                const selectedSet = new Set(selectedValues);
                
                if (currentSet.size !== selectedSet.size || 
                    [...currentSet].some(v => !selectedSet.has(v))) {
                    console.log(`External filter change detected for ${field}, syncing...`);
                    selectedValues = currentFilter;
                    updateButtonText();
                }
            }
        }
    });
    
    // Cleanup
    var cleanup = function() {
        var dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            dropdown.remove();
        }
        document.removeEventListener('click', closeHandler);
        if (filterTimeout) {
            clearTimeout(filterTimeout);
        }
        if (clickTimeout) {
            clearTimeout(clickTimeout);
        }
    };
    
    return button;
}
