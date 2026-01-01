// tables/baseTable.js - Base Table Class for Basketball Props (matching baseball pattern)
import { API_CONFIG, TEAM_NAME_MAP, isMobile, isTablet, getDeviceType } from '../shared/config.js';

// Global data cache to persist between tab switches
const dataCache = new Map();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// IndexedDB for persistent caching
const DB_NAME = 'BasketballTabulatorCache';
const DB_VERSION = 1;
const STORE_NAME = 'tableData';

class CacheManager {
    constructor() {
        this.db = null;
        this.initDB();
    }

    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => {
                console.error('Failed to open IndexedDB');
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    async getCachedData(key) {
        if (!this.db) await this.initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(key);
            
            request.onsuccess = () => {
                const result = request.result;
                if (result && Date.now() - result.timestamp < CACHE_DURATION) {
                    console.log(`IndexedDB cache hit for ${key}`);
                    resolve(result.data);
                } else {
                    resolve(null);
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    async setCachedData(key, data) {
        if (!this.db) await this.initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put({
                key: key,
                data: data,
                timestamp: Date.now()
            });
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

const cacheManager = new CacheManager();

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
        
        // Store the base config
        this.tableConfig = this.getBaseConfig();
    }
    
    // Get base table configuration - this creates the full config with AJAX
    getBaseConfig() {
        const self = this;
        const url = API_CONFIG.baseURL + this.endpoint;
        const cacheKey = `basketball_${this.endpoint}`;
        
        return {
            height: "600px",
            maxHeight: "600px",
            layout: "fitDataFill",
            // Critical for large datasets
            virtualDom: true,
            virtualDomBuffer: 500,
            renderVertical: "virtual",
            renderHorizontal: "virtual",
            layoutColumnsOnNewData: false,
            responsiveLayout: false,
            pagination: false,
            // Standard settings
            columnHeaderSortMulti: true,
            headerSortClickElement: "header",
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            placeholder: "Loading data...",
            
            ajaxURL: url,
            ajaxConfig: {
                method: "GET",
                headers: API_CONFIG.headers
            },
            
            // Custom request function with caching
            ajaxRequestFunc: async function(url, config, params) {
                // Check memory cache first
                const memoryCached = self.getCachedData(cacheKey);
                if (memoryCached) {
                    console.log(`Memory cache hit for ${self.endpoint}`);
                    self.dataLoaded = true;
                    return memoryCached;
                }
                
                // Check IndexedDB cache
                const dbCached = await cacheManager.getCachedData(cacheKey);
                if (dbCached) {
                    console.log(`IndexedDB cache hit for ${self.endpoint}`);
                    self.setCachedData(cacheKey, dbCached);
                    self.dataLoaded = true;
                    return dbCached;
                }
                
                // Fetch from API
                console.log(`No cache found for ${self.endpoint}, fetching from API...`);
                const allRecords = await self.fetchAllRecords(url, config);
                
                // Store in both caches
                self.setCachedData(cacheKey, allRecords);
                await cacheManager.setCachedData(cacheKey, allRecords);
                
                self.dataLoaded = true;
                return allRecords;
            },
            
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
    
    // Fetch all records with pagination
    async fetchAllRecords(url, config) {
        const allRecords = [];
        const pageSize = 1000;
        let offset = 0;
        let hasMore = true;
        let retryCount = 0;
        const maxRetries = 3;
        
        console.log(`Starting data fetch from ${url}...`);
        
        // Show loading indicator
        if (this.elementId) {
            const element = document.querySelector(this.elementId);
            if (element) {
                const progressDiv = document.createElement('div');
                progressDiv.id = 'loading-progress';
                progressDiv.className = 'loading-indicator';
                progressDiv.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000; background: white; padding: 20px; border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);';
                progressDiv.innerHTML = '<div style="text-align: center;"><div>Loading data...</div><div id="progress-text" style="margin-top: 10px; font-weight: bold;">0 records</div></div>';
                element.style.position = 'relative';
                element.appendChild(progressDiv);
            }
        }
        
        while (hasMore) {
            try {
                const requestUrl = `${url}?limit=${pageSize}&offset=${offset}`;
                
                const response = await fetch(requestUrl, {
                    method: "GET",
                    headers: {
                        ...API_CONFIG.headers,
                        'Range': `${offset}-${offset + pageSize - 1}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data && data.length > 0) {
                    allRecords.push(...data);
                    offset += pageSize;
                    
                    // Update progress
                    const progressText = document.getElementById('progress-text');
                    if (progressText) {
                        progressText.textContent = `${allRecords.length} records loaded...`;
                    }
                    
                    // Check if we got less than a full page
                    if (data.length < pageSize) {
                        hasMore = false;
                    }
                    
                    retryCount = 0;
                } else {
                    hasMore = false;
                }
            } catch (error) {
                console.error(`Error fetching data (attempt ${retryCount + 1}):`, error);
                retryCount++;
                
                if (retryCount >= maxRetries) {
                    console.error('Max retries reached, stopping fetch');
                    hasMore = false;
                } else {
                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                }
            }
        }
        
        // Remove loading indicator
        const progressDiv = document.getElementById('loading-progress');
        if (progressDiv) {
            progressDiv.remove();
        }
        
        console.log(`Fetch complete: ${allRecords.length} total records`);
        return allRecords;
    }
    
    // Memory cache helpers
    getCachedData(key) {
        const cached = dataCache.get(key);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
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
        
        const cacheKey = `basketball_${this.endpoint}`;
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
