// components/customMultiSelect.js - FIXED VERSION WITH STATE SYNC
export function createCustomMultiSelect(cell, onRendered, success, cancel, options = {}) {
    // Extract options with defaults
    const dropdownWidth = options.dropdownWidth || 200; // Default width
    
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
    `;
    
    var field = cell.getColumn().getField();
    var table = cell.getTable();
    var allValues = [];
    var selectedValues = [];
    var dropdownId = 'dropdown_' + field.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Math.random().toString(36).substr(2, 9);
    var isOpen = false;
    var isInitialized = false;
    var filterTimeout = null;
    
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
                if (data["Matchup Game ID"]) {
                    rowId = `matchup_${data["Matchup Game ID"]}`;
                } else if (data["Batter Name"]) {
                    rowId = `batter_${data["Batter Name"]}_${data["Batter Team"]}`;
                    if (data["Batter Prop Type"]) rowId += `_${data["Batter Prop Type"]}`;
                    if (data["Batter Prop Value"]) rowId += `_${data["Batter Prop Value"]}`;
                    if (data["Batter Prop Split ID"]) rowId += `_${data["Batter Prop Split ID"]}`;
                } else if (data["Pitcher Name"]) {
                    rowId = `pitcher_${data["Pitcher Name"]}_${data["Pitcher Team"]}`;
                    if (data["Pitcher Prop Type"]) rowId += `_${data["Pitcher Prop Type"]}`;
                    if (data["Pitcher Prop Value"]) rowId += `_${data["Pitcher Prop Value"]}`;
                    if (data["Pitcher Prop Split ID"]) rowId += `_${data["Pitcher Prop Split ID"]}`;
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
                if (data["Matchup Game ID"]) {
                    rowId = `matchup_${data["Matchup Game ID"]}`;
                } else if (data["Batter Name"]) {
                    rowId = `batter_${data["Batter Name"]}_${data["Batter Team"]}`;
                    if (data["Batter Prop Type"]) rowId += `_${data["Batter Prop Type"]}`;
                    if (data["Batter Prop Value"]) rowId += `_${data["Batter Prop Value"]}`;
                    if (data["Batter Prop Split ID"]) rowId += `_${data["Batter Prop Split ID"]}`;
                } else if (data["Pitcher Name"]) {
                    rowId = `pitcher_${data["Pitcher Name"]}_${data["Pitcher Team"]}`;
                    if (data["Pitcher Prop Type"]) rowId += `_${data["Pitcher Prop Type"]}`;
                    if (data["Pitcher Prop Value"]) rowId += `_${data["Pitcher Prop Value"]}`;
                    if (data["Pitcher Prop Split ID"]) rowId += `_${data["Pitcher Prop Split ID"]}`;
                }
                
                if (rowId && expandedRows.has(rowId)) {
                    if (!data._expanded) {
                        data._expanded = true;
                        row.update(data);
                        row.reformat();
                    }
                    
                    // Update the expander icon
                    const cells = row.getCells();
                    const nameFields = ["Batter Name", "Pitcher Name", "Matchup Team"];
                    
                    for (let nameField of nameFields) {
                        const nameCell = cells.find(c => c.getField() === nameField);
                        if (nameCell) {
                            const cellElement = nameCell.getElement();
                            const expander = cellElement.querySelector('.row-expander');
                            if (expander) {
                                expander.innerHTML = "−";
                            }
                            break;
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
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 2147483647;
            display: none;
            padding: 0;
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
                // Make a copy to ensure it's a new reference
                success([...selectedValues]);
            }
            
            // Redraw the table
            if (table.getRowCount && table.getRowCount() > 1000) {
                // For large tables, use progressive redraw
                requestAnimationFrame(() => {
                    table.redraw(false);
                    // Restore expanded state after redraw
                    restoreExpandedState(expandedState);
                });
            } else {
                table.redraw();
                // Restore expanded state after redraw
                restoreExpandedState(expandedState);
            }
        }, 150); // 150ms debounce
    }
    
    // Optimized dropdown rendering with virtual scrolling for large lists
    function renderDropdown() {
        var dropdown = document.getElementById(dropdownId) || createDropdown();
        
        // Use DocumentFragment for better performance
        var fragment = document.createDocumentFragment();
        
        // Clear existing content
        dropdown.innerHTML = '';
        
        // Add select all
        var selectAll = document.createElement("div");
        selectAll.style.cssText = `
            padding: 8px 12px;
            border-bottom: 2px solid #007bff;
            font-weight: bold;
            background: #f8f9fa;
            position: sticky;
            top: 0;
            z-index: 1;
        `;
        
        var selectAllLabel = document.createElement("label");
        selectAllLabel.style.cssText = "display: flex; align-items: center; cursor: pointer;";
        
        var selectAllCheckbox = document.createElement("input");
        selectAllCheckbox.type = "checkbox";
        selectAllCheckbox.checked = selectedValues.length === allValues.length;
        selectAllCheckbox.style.marginRight = "8px";
        
        var selectAllText = document.createElement("span");
        selectAllText.textContent = selectedValues.length === allValues.length ? 'None' : 'All';
        
        selectAllLabel.appendChild(selectAllCheckbox);
        selectAllLabel.appendChild(selectAllText);
        selectAll.appendChild(selectAllLabel);
        
        selectAll.addEventListener('click', function(e) {
            e.stopPropagation();
            
            if (selectedValues.length === allValues.length) {
                selectedValues = [];
            } else {
                selectedValues = [...allValues];
            }
            
            // Update immediately
            updateButtonText();
            updateFilter();
            
            // Then re-render dropdown to update checkboxes
            renderDropdown();
        });
        
        fragment.appendChild(selectAll);
        
        // For large lists, implement virtual scrolling
        if (allValues.length > 100) {
            // Create a container for virtual scrolling
            var scrollContainer = document.createElement("div");
            scrollContainer.style.cssText = `height: 250px; overflow-y: auto;`;
            
            // Add all items (simplified for stability)
            allValues.forEach(function(value) {
                fragment.appendChild(createOptionElement(value));
            });
        } else {
            // For smaller lists, render all items
            allValues.forEach(function(value) {
                fragment.appendChild(createOptionElement(value));
            });
        }
        
        dropdown.appendChild(fragment);
    }
    
    // Create individual option element
    function createOptionElement(value) {
        var optionDiv = document.createElement("div");
        optionDiv.style.cssText = `
            padding: 6px 12px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
        `;
        
        var optionLabel = document.createElement("label");
        optionLabel.style.cssText = "display: flex; align-items: center; cursor: pointer;";
        
        var optionCheckbox = document.createElement("input");
        optionCheckbox.type = "checkbox";
        optionCheckbox.checked = selectedValues.indexOf(value) !== -1;
        optionCheckbox.style.marginRight = "8px";
        
        var optionText = document.createElement("span");
        optionText.textContent = value;
        
        optionLabel.appendChild(optionCheckbox);
        optionLabel.appendChild(optionText);
        optionDiv.appendChild(optionLabel);
        
        optionDiv.addEventListener('click', function(e) {
            e.stopPropagation();
            
            var index = selectedValues.indexOf(value);
            if (index > -1) {
                selectedValues.splice(index, 1);
            } else {
                selectedValues.push(value);
            }
            
            console.log("Selection changed:", value, "- now selected:", selectedValues);
            
            // Update immediately
            updateButtonText();
            updateFilter();
            
            // Update checkbox
            optionCheckbox.checked = selectedValues.indexOf(value) !== -1;
            
            // Update select all checkbox
            var selectAllCheckbox = dropdown.querySelector('input[type="checkbox"]');
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = selectedValues.length === allValues.length;
                var selectAllText = dropdown.querySelector('span');
                if (selectAllText) {
                    selectAllText.textContent = selectedValues.length === allValues.length ? 'None' : 'All';
                }
            }
        });
        
        optionDiv.addEventListener('mouseenter', function() {
            optionDiv.style.background = '#f0f0f0';
        });
        
        optionDiv.addEventListener('mouseleave', function() {
            optionDiv.style.background = 'white';
        });
        
        return optionDiv;
    }
    
    function showDropdown() {
        var dropdown = document.getElementById(dropdownId) || createDropdown();
        
        renderDropdown();
        
        var buttonRect = button.getBoundingClientRect();
        dropdown.style.left = buttonRect.left + 'px';
        dropdown.style.top = (buttonRect.bottom + 2) + 'px';
        dropdown.style.display = 'block';
        
        setTimeout(function() {
            var dropdownRect = dropdown.getBoundingClientRect();
            if (dropdownRect.bottom > window.innerHeight) {
                dropdown.style.top = (buttonRect.top - dropdown.offsetHeight - 2) + 'px';
            }
            if (dropdownRect.right > window.innerWidth) {
                dropdown.style.left = (window.innerWidth - dropdown.offsetWidth - 10) + 'px';
            }
        }, 0);
        
        isOpen = true;
    }
    
    function hideDropdown() {
        var dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            dropdown.style.display = 'none';
        }
        isOpen = false;
    }
    
    function updateButtonText() {
        if (selectedValues.length === 0) {
            button.textContent = "None";
        } else if (selectedValues.length === allValues.length) {
            button.textContent = "All";
        } else {
            button.textContent = selectedValues.length + " of " + allValues.length;
        }
    }
    
    // NEW: Check for existing filter value and sync with it
    function getCurrentFilterValue() {
        // Get the current filter value for this column
        const headerFilters = table.getHeaderFilters();
        const currentFilter = headerFilters.find(f => f.field === field);
        
        if (currentFilter && currentFilter.value) {
            // Check what type of filter value we have
            if (currentFilter.value === "IMPOSSIBLE_VALUE_THAT_MATCHES_NOTHING") {
                return [];
            } else if (Array.isArray(currentFilter.value)) {
                return currentFilter.value.map(v => String(v));
            } else if (currentFilter.value === "") {
                return null; // All values
            } else {
                return [String(currentFilter.value)];
            }
        }
        
        return null; // No filter set
    }
    
    // ENHANCED: Load values with filter state sync
    function loadValues() {
        if (!isInitialized) {
            // Use a Set for better performance with large datasets
            var uniqueValues = new Set();
            
            // Get data more efficiently
            var data = table.getData();
            
            // Use for loop for better performance
            for (var i = 0; i < data.length; i++) {
                var value = data[i][field];
                if (value !== null && value !== undefined && value !== '') {
                    uniqueValues.add(String(value));
                }
            }
            
            allValues = Array.from(uniqueValues);
            
            // Sort prop value fields numerically for both batter and pitcher tables
            if (field === "Batter Prop Value" || field === "Pitcher Prop Value") {
                allValues.sort(function(a, b) {
                    return parseFloat(a) - parseFloat(b);
                });
            } else {
                allValues.sort();
            }
            
            // NEW: Check for existing filter and sync selected values
            const existingFilter = getCurrentFilterValue();
            
            if (existingFilter !== null) {
                // Filter is set, use those values
                selectedValues = existingFilter;
                console.log(`Synced with existing filter for ${field}: ${selectedValues.length} of ${allValues.length} selected`);
            } else {
                // No filter set, select all
                selectedValues = [...allValues];
            }
            
            isInitialized = true;
        }
        
        updateButtonText();
    }
    
    // Button click with debouncing
    var clickTimeout;
    button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Debounce rapid clicks
        if (clickTimeout) {
            clearTimeout(clickTimeout);
        }
        
        clickTimeout = setTimeout(() => {
            if (isOpen) {
                hideDropdown();
            } else {
                if (!isInitialized) {
                    loadValues();
                }
                showDropdown();
            }
        }, 50);
    });
    
    // Close on outside click
    var closeHandler = function(e) {
        if (isOpen) {
            var dropdown = document.getElementById(dropdownId);
            if (dropdown && !dropdown.contains(e.target) && e.target !== button) {
                hideDropdown();
            }
        }
    };
    
    setTimeout(function() {
        document.addEventListener('click', closeHandler);
    }, 100);
    
    // ENHANCED: Initial load with filter state check
    var loadAttempts = 0;
    var initialLoadComplete = false;
    
    // Check if we're in a tab switch scenario
    var isTabSwitch = false;
    if (window.tabManager && window.tabManager.isTransitioning) {
        isTabSwitch = true;
    }
    
    var tryLoad = function() {
        loadAttempts++;
        
        var data = table.getData();
        if (data && data.length > 0) {
            loadValues();
            if (!initialLoadComplete) {
                initialLoadComplete = true;
                
                // During tab switch, the filter is already applied
                // We just need to make sure our UI reflects it
                if (isTabSwitch) {
                    // Just update the button text, don't reapply filter
                    updateButtonText();
                } else if (selectedValues.length !== allValues.length) {
                    // Normal load - update filter if needed
                    updateFilter();
                }
            }
        } else if (loadAttempts < 5) {
            setTimeout(tryLoad, 500);
        }
    };
    
    // Defer initial load to avoid blocking
    requestAnimationFrame(() => {
        tryLoad();
    });
    
    // Listen for table events - but check for filter state
    table.on("dataLoaded", function() {
        if (!isInitialized) {
            setTimeout(function() {
                loadValues();
                // Don't update filter on data load if it's already set
                const existingFilter = getCurrentFilterValue();
                if (existingFilter === null && selectedValues.length !== allValues.length) {
                    updateFilter();
                }
            }, 100);
        }
    });
    
    // NEW: Listen for filter changes from other sources (like state restoration)
    table.on("dataFiltered", function() {
        // If filter was changed externally, sync our state
        if (isInitialized) {
            const currentFilter = getCurrentFilterValue();
            if (currentFilter !== null) {
                const currentSet = new Set(currentFilter);
                const selectedSet = new Set(selectedValues);
                
                // Check if they're different
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
