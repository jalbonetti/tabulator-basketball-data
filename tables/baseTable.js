// tables/baseTable.js - Base Table Class for Basketball Props Tables
// Provides common functionality for all table implementations

import { CONFIG, API_CONFIG, TEAM_NAME_MAP, isMobile, isTablet, getDeviceType } from '../shared/config.js';

// Memory cache for data
const dataCache = new Map();

export class BaseTable {
    constructor(elementId, endpoint) {
        this.elementId = elementId;
        this.endpoint = endpoint;
        this.table = null;
        this.dataLoaded = false;
        this.filterState = [];
        this.sortState = [];
        this.expandedRowsCache = new Set();
        this.expandedRowsSet = new Set();
        this.expandedRowsMetadata = new Map();
        this.temporaryExpandedRows = new Set();
        this.lastScrollPosition = 0;
        this.isRestoringState = false;
        this.pendingStateRestore = false;
        this.pendingRestoration = false;
        this.restorationAttempts = 0;
        this.maxRestorationAttempts = 3;
        
        // Base table configuration
        this.tableConfig = this.createBaseConfig();
    }
    
    createBaseConfig() {
        const self = this;
        const deviceType = getDeviceType();
        const dimensions = CONFIG.TABLE_DIMENSIONS[deviceType];
        
        return {
            layout: "fitDataStretch",
            responsiveLayout: false,
            height: dimensions.maxHeight,
            maxHeight: dimensions.maxHeight,
            virtualDom: true,
            virtualDomBuffer: 300,
            renderVertical: "virtual",
            renderHorizontal: "virtual",
            pagination: false,
            paginationSize: false,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            selectable: false,
            placeholder: "Loading data...",
            
            dataFiltering: () => {
                console.log(`Data filtering for ${self.elementId}`);
                if (!self.isRestoringState) {
                    self.saveTemporaryExpandedState();
                }
            },
            
            dataFiltered: () => {
                console.log(`Data filtered for ${self.elementId}`);
                if (!self.isRestoringState && self.pendingRestoration) {
                    self.executePendingRestoration();
                }
            },
            
            dataSorted: () => {
                console.log(`Data sorted for ${self.elementId}`);
                if (!self.isRestoringState) {
                    self.restoreTemporaryExpandedState();
                }
            },
            
            dataLoaded: (data) => {
                console.log(`Table loaded ${data.length} total records`);
                self.dataLoaded = true;
                data.forEach(row => {
                    if (row._expanded === undefined) {
                        row._expanded = false;
                    }
                });
                
                if (self.pendingStateRestore) {
                    console.log(`Data loaded, now restoring pending state for ${self.elementId}`);
                    setTimeout(() => {
                        self.restoreState();
                        self.pendingStateRestore = false;
                    }, 100);
                }
            },
            
            renderComplete: function() {
                console.log(`Render complete for ${self.elementId}`);
                if (self.pendingRestoration && self.restorationAttempts < self.maxRestorationAttempts) {
                    setTimeout(() => {
                        self.executePendingRestoration();
                    }, 100);
                }
                
                if (self.isRestoringState) {
                    setTimeout(() => {
                        if (self.isRestoringState) {
                            self.applyGlobalExpandedState();
                        }
                    }, 50);
                }
            }
        };
    }
    
    // Configure AJAX if endpoint is provided
    configureAjax(config) {
        if (this.endpoint) {
            config.ajaxURL = API_CONFIG.baseURL + this.endpoint;
            config.ajaxConfig = {
                method: "GET",
                headers: {
                    ...API_CONFIG.headers,
                    "Prefer": "count=exact"
                }
            };
            config.ajaxContentType = "json";
            
            config.ajaxRequestFunc = async (url, ajaxConfig, params) => {
                const cacheKey = `${this.endpoint}_data`;
                
                // Check memory cache
                const memoryCached = this.getCachedData(cacheKey);
                if (memoryCached) {
                    console.log(`Using memory cached data for ${this.endpoint}`);
                    return memoryCached;
                }
                
                // Fetch from API
                try {
                    const response = await fetch(url, {
                        method: ajaxConfig.method,
                        headers: ajaxConfig.headers
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    
                    // Cache the data
                    this.setCachedData(cacheKey, data);
                    
                    return data;
                } catch (error) {
                    console.error(`Error fetching ${this.endpoint}:`, error);
                    throw error;
                }
            };
        }
        
        return config;
    }
    
    // Memory cache helpers
    getCachedData(key) {
        const cached = dataCache.get(key);
        if (cached && Date.now() - cached.timestamp < CONFIG.CACHE_TTL) {
            return cached.data;
        }
        return null;
    }
    
    setCachedData(key, data) {
        dataCache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    // Generate unique row ID
    generateRowId(data) {
        const fields = [];
        
        if (data["Player Name"]) {
            fields.push(data["Player Name"]);
            if (data["Player Team"]) fields.push(data["Player Team"]);
            if (data["Player Prop"]) fields.push(data["Player Prop"]);
            if (data["Player Prop Value"]) fields.push(data["Player Prop Value"]);
            if (data["Split"]) fields.push(data["Split"]);
            return `player_${fields.join('_')}`;
        }
        
        // Fallback
        const keys = Object.keys(data).filter(k => !k.startsWith('_') && data[k] != null);
        return keys.slice(0, 5).map(k => `${k}:${data[k]}`).join('|');
    }

    // Create name formatter with expand icon
    createNameFormatter() {
        const self = this;
        
        return (cell) => {
            const value = cell.getValue();
            if (!value) return '-';
            
            const container = document.createElement('div');
            container.style.cssText = 'display: flex; align-items: center; cursor: pointer;';
            
            const icon = document.createElement('span');
            icon.className = 'expand-icon';
            icon.style.cssText = 'margin-right: 6px; font-size: 10px; transition: transform 0.2s; color: #f97316; display: inline-flex; width: 12px;';
            icon.innerHTML = '▶';
            
            const data = cell.getRow().getData();
            if (data._expanded) {
                icon.style.transform = 'rotate(90deg)';
            }
            
            const text = document.createElement('span');
            text.textContent = value;
            text.style.cssText = 'font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
            
            container.appendChild(icon);
            container.appendChild(text);
            
            return container;
        };
    }

    // Create team formatter
    createTeamFormatter() {
        return (cell) => {
            const value = cell.getValue();
            if (!value) return '-';
            return TEAM_NAME_MAP[value] || value;
        };
    }

    // Setup row expansion/collapse on click
    setupRowExpansion() {
        if (!this.table) return;
        
        const self = this;
        
        this.table.on("rowClick", function(e, row) {
            const data = row.getData();
            const wasExpanded = data._expanded;
            
            // Toggle expansion state
            data._expanded = !wasExpanded;
            
            // Update icon
            const cells = row.getCells();
            const nameCell = cells.find(c => c.getField() === "Player Name");
            if (nameCell) {
                const cellElement = nameCell.getElement();
                const icon = cellElement.querySelector('.expand-icon');
                if (icon) {
                    icon.style.transform = data._expanded ? 'rotate(90deg)' : '';
                }
            }
            
            // Update row
            row.update(data);
            row.reformat();
            
            // Save state globally
            const rowId = self.generateRowId(data);
            if (data._expanded) {
                self.expandedRowsCache.add(rowId);
                if (window.globalExpandedState) {
                    window.globalExpandedState.set(`${self.elementId}_${rowId}`, true);
                }
            } else {
                self.expandedRowsCache.delete(rowId);
                if (window.globalExpandedState) {
                    window.globalExpandedState.delete(`${self.elementId}_${rowId}`);
                }
            }
            
            console.log(`Row ${data._expanded ? 'expanded' : 'collapsed'}: ${rowId}`);
        });
    }

    // Save current state
    saveState() {
        if (!this.table) return;
        
        this.filterState = this.table.getHeaderFilters();
        this.sortState = this.table.getSorters();
    }

    // Restore saved state
    restoreState() {
        if (!this.table) return;
        
        if (this.filterState && this.filterState.length > 0) {
            this.filterState.forEach(filter => {
                this.table.setHeaderFilterValue(filter.field, filter.value);
            });
        }
        
        if (this.sortState && this.sortState.length > 0) {
            this.table.setSort(this.sortState);
        }
    }

    // Save temporary expanded state (before filter/sort operations)
    saveTemporaryExpandedState() {
        this.temporaryExpandedRows.clear();
        
        if (this.table) {
            const rows = this.table.getRows();
            rows.forEach(row => {
                const data = row.getData();
                if (data._expanded) {
                    const id = this.generateRowId(data);
                    this.temporaryExpandedRows.add(id);
                }
            });
        }
        console.log(`Temporarily saved ${this.temporaryExpandedRows.size} expanded rows for ${this.elementId}`);
    }
    
    // Restore temporary expanded state (after filter/sort operations)
    restoreTemporaryExpandedState() {
        if (this.temporaryExpandedRows.size > 0 && this.table) {
            console.log(`Restoring ${this.temporaryExpandedRows.size} temporarily expanded rows for ${this.elementId}`);
            
            setTimeout(() => {
                const rows = this.table.getRows();
                rows.forEach(row => {
                    const data = row.getData();
                    const id = this.generateRowId(data);
                    
                    if (this.temporaryExpandedRows.has(id) && !data._expanded) {
                        data._expanded = true;
                        row.update(data);
                        row.reformat();
                    }
                });
            }, 100);
        }
    }
    
    // Execute pending restoration
    executePendingRestoration() {
        if (!this.pendingRestoration) return;
        
        this.restorationAttempts++;
        console.log(`Executing pending restoration attempt ${this.restorationAttempts} for ${this.elementId}`);
        
        this.restoreTemporaryExpandedState();
        
        if (this.restorationAttempts >= this.maxRestorationAttempts) {
            this.pendingRestoration = false;
            this.restorationAttempts = 0;
        }
    }
    
    // Apply global expanded state
    applyGlobalExpandedState() {
        if (!this.table || !window.globalExpandedState) return;
        
        const rows = this.table.getRows();
        const prefix = `${this.elementId}_`;
        
        rows.forEach(row => {
            const data = row.getData();
            const rowId = this.generateRowId(data);
            const globalKey = `${prefix}${rowId}`;
            
            if (window.globalExpandedState.has(globalKey) && !data._expanded) {
                data._expanded = true;
                row.update(data);
                row.reformat();
            }
        });
        
        this.isRestoringState = false;
    }

    // Clear all filters
    clearFilters() {
        if (!this.table) return;
        this.table.clearHeaderFilter();
    }

    // Refresh data
    async refreshData() {
        if (!this.table) return;
        
        const cacheKey = `${this.endpoint}_data`;
        dataCache.delete(cacheKey);
        
        await this.table.setData();
    }
    
    // Redraw table
    redraw(force = false) {
        if (!this.table) return;
        
        // Save expanded state before redraw
        this.saveTemporaryExpandedState();
        
        this.table.redraw(force);
        
        // Restore expanded state after redraw
        setTimeout(() => {
            this.restoreTemporaryExpandedState();
        }, 100);
    }
}
