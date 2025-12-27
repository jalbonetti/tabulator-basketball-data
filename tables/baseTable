// tables/baseTable.js - ENHANCED VERSION WITH FILTER AND SORT STATE PRESERVATION
import { API_CONFIG, TEAM_NAME_MAP } from '../shared/config.js';
import { getOpponentTeam, getSwitchHitterVersus, formatPercentage } from '../shared/utils.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';

// Global data cache to persist between tab switches
const dataCache = new Map();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes to match Supabase update interval

// IndexedDB for persistent cross-user caching
const DB_NAME = 'TabulatorCache';
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
            
            request.onerror = () => {
                console.error('Failed to read from IndexedDB');
                resolve(null);
            };
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
            
            request.onsuccess = () => {
                console.log(`Data cached in IndexedDB for ${key}`);
                resolve();
            };
            
            request.onerror = () => {
                console.error('Failed to write to IndexedDB');
                reject(request.error);
            };
        });
    }

    async clearOldCache() {
        if (!this.db) await this.initDB();
        
        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('timestamp');
        const cutoffTime = Date.now() - CACHE_DURATION;
        
        const request = index.openCursor(IDBKeyRange.upperBound(cutoffTime));
        
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                store.delete(cursor.primaryKey);
                cursor.continue();
            }
        };
    }
}

// Global cache manager instance
const cacheManager = new CacheManager();

// CRITICAL: Make GLOBAL_EXPANDED_STATE globally accessible
window.GLOBAL_EXPANDED_STATE = window.GLOBAL_EXPANDED_STATE || new Map();
const GLOBAL_EXPANDED_STATE = window.GLOBAL_EXPANDED_STATE;

// NEW: Global state for filters and sorts
window.GLOBAL_FILTER_STATE = window.GLOBAL_FILTER_STATE || new Map();
window.GLOBAL_SORT_STATE = window.GLOBAL_SORT_STATE || new Map();
const GLOBAL_FILTER_STATE = window.GLOBAL_FILTER_STATE;
const GLOBAL_SORT_STATE = window.GLOBAL_SORT_STATE;

export class BaseTable {
    constructor(elementId, endpoint) {
        this.elementId = elementId;
        this.endpoint = endpoint;
        this.table = null;
        this.isInitialized = false;
        this.dataLoaded = false;
        this.pendingStateRestore = false;
        this.expandedRowsCache = new Map();
        this.expandedRowsSet = new Set();
        this.expandedRowsMetadata = new Map();
        this.temporaryExpandedRows = new Set();
        this.lastScrollPosition = 0;
        this.tableConfig = this.getBaseConfig();
        this.isRestoringState = false;
        this.pendingRestoration = null;
        this.restorationAttempts = 0;
        this.maxRestorationAttempts = 5;
        
        // NEW: Track filter and sort states
        this.filterState = new Map();
        this.sortState = [];
        
        // Initialize global state for this table if not exists
        if (!GLOBAL_EXPANDED_STATE.has(elementId)) {
            GLOBAL_EXPANDED_STATE.set(elementId, new Map());
        }
        if (!GLOBAL_FILTER_STATE.has(elementId)) {
            GLOBAL_FILTER_STATE.set(elementId, new Map());
        }
        if (!GLOBAL_SORT_STATE.has(elementId)) {
            GLOBAL_SORT_STATE.set(elementId, []);
        }
    }

    // Helper methods to access global state
    getGlobalState() {
        if (GLOBAL_EXPANDED_STATE.has(this.elementId)) {
            return GLOBAL_EXPANDED_STATE.get(this.elementId);
        }
        const newState = new Map();
        GLOBAL_EXPANDED_STATE.set(this.elementId, newState);
        return newState;
    }
    
    setGlobalState(state) {
        GLOBAL_EXPANDED_STATE.set(this.elementId, state);
    }

    // NEW: Helper methods for filter state
    getGlobalFilterState() {
        if (GLOBAL_FILTER_STATE.has(this.elementId)) {
            return GLOBAL_FILTER_STATE.get(this.elementId);
        }
        const newState = new Map();
        GLOBAL_FILTER_STATE.set(this.elementId, newState);
        return newState;
    }
    
    setGlobalFilterState(state) {
        GLOBAL_FILTER_STATE.set(this.elementId, state);
    }

    // NEW: Helper methods for sort state
    getGlobalSortState() {
        if (GLOBAL_SORT_STATE.has(this.elementId)) {
            return GLOBAL_SORT_STATE.get(this.elementId);
        }
        return [];
    }
    
    setGlobalSortState(state) {
        GLOBAL_SORT_STATE.set(this.elementId, state);
    }

    getBaseConfig() {
    const self = this;
    const config = {
        layout: "fitColumns",
        responsiveLayout: false,
        persistence: false,
        paginationSize: false,
        height: "600px", // Changed from 1000px to standard 600px for vertical scroll
        minWidth: 1000,
        resizableColumns: false, // DISABLE COLUMN RESIZING GLOBALLY
        resizableRows: false,
        movableColumns: false,
        placeholder: "Loading data...",
        virtualDom: true,
        virtualDomBuffer: 300,
        renderVertical: "virtual",
        renderHorizontal: "virtual",
        progressiveRender: true,
        progressiveRenderSize: 20,
        progressiveRenderMargin: 100,
        blockHozScrollKeyboard: true,
        layoutColumnsOnNewData: false,
        columnVertAlign: "center",
            
            dataProcessing: () => {
                console.log(`Data processing for ${self.elementId}`);
                if (!self.isRestoringState && self.table) {
                    self.temporaryExpandedRows.clear();
                    const expandedRows = self.table.getRows().filter(row => {
                        const rowData = row.getData();
                        const rowElement = row.getElement();
                        return rowData._expanded === true || 
                               (rowElement && rowElement.classList.contains('tabulator-row-expanded'));
                    });
                    expandedRows.forEach(row => {
                        const id = self.generateRowId(row.getData());
                        if (id) {
                            self.temporaryExpandedRows.add(id);
                        }
                    });
                }
            },
            
            dataProcessed: () => {
                console.log(`Data processed for ${self.elementId}`);
                if (self.pendingRestoration) {
                    self.executePendingRestoration();
                }
            },
            
            dataFiltered: () => {
                console.log(`Data filtered for ${self.elementId}`);
                if (!self.isRestoringState) {
                    self.restoreTemporaryExpandedState();
                }
                if (self.pendingRestoration) {
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
            
            config.ajaxRequestFunc = async (url, config, params) => {
                const cacheKey = `${this.endpoint}_data`;
                
                const memoryCached = this.getCachedData(cacheKey);
                if (memoryCached) {
                    console.log(`Memory cache hit for ${this.endpoint}`);
                    self.dataLoaded = true;
                    return memoryCached;
                }
                
                const dbCached = await cacheManager.getCachedData(cacheKey);
                if (dbCached) {
                    console.log(`IndexedDB cache hit for ${this.endpoint}`);
                    this.setCachedData(cacheKey, dbCached);
                    self.dataLoaded = true;
                    return dbCached;
                }
                
                console.log(`No cache found for ${this.endpoint}, fetching from API...`);
                const allRecords = await this.fetchAllRecords(url, config);
                
                this.setCachedData(cacheKey, allRecords);
                await cacheManager.setCachedData(cacheKey, allRecords);
                
                self.dataLoaded = true;
                return allRecords;
            };
        }

        return config;
    }

    async fetchAllRecords(url, config) {
        const allRecords = [];
        const pageSize = 1000;
        let offset = 0;
        let hasMore = true;
        let totalExpected = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        console.log(`Starting comprehensive data fetch from ${url}...`);
        
        if (this.elementId) {
            const element = document.querySelector(this.elementId);
            if (element) {
                const progressDiv = document.createElement('div');
                progressDiv.id = 'loading-progress';
                progressDiv.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000; background: white; padding: 20px; border: 1px solid #ccc; border-radius: 8px;';
                progressDiv.innerHTML = '<div>Loading data...</div><div id="progress-text">0%</div>';
                element.appendChild(progressDiv);
            }
        }
        
        while (hasMore) {
            try {
                const requestUrl = `${url}?limit=${pageSize}&offset=${offset}`;
                
                const response = await fetch(requestUrl, {
                    ...config,
                    headers: {
                        ...config.headers,
                        'Range': `${offset}-${offset + pageSize - 1}`,
                        'Range-Unit': 'items',
                        'Prefer': 'count=exact'
                    }
                });
                
                if (!response.ok) {
                    if (response.status === 416) {
                        console.log('Reached end of data');
                        hasMore = false;
                        break;
                    }
                    throw new Error(`Network response was not ok: ${response.status}`);
                }
                
                const contentRange = response.headers.get('content-range');
                if (contentRange && totalExpected === null) {
                    const match = contentRange.match(/\d+-\d+\/(\d+|\*)/);
                    if (match && match[1] !== '*') {
                        totalExpected = parseInt(match[1]);
                        console.log(`Total records to fetch: ${totalExpected}`);
                    }
                }
                
                const data = await response.json();
                
                if (data.length === 0) {
                    hasMore = false;
                    break;
                }
                
                allRecords.push(...data);
                
                if (totalExpected) {
                    const progress = ((allRecords.length / totalExpected) * 100).toFixed(1);
                    console.log(`Loading progress: ${allRecords.length}/${totalExpected} (${progress}%)`);
                    
                    const progressText = document.getElementById('progress-text');
                    if (progressText) {
                        progressText.textContent = `${progress}% - ${allRecords.length.toLocaleString()} / ${totalExpected.toLocaleString()} records`;
                    }
                }
                
                if (data.length < pageSize) {
                    hasMore = false;
                } else {
                    offset += pageSize;
                }
                
                retryCount = 0;
                
                if (hasMore && offset % 5000 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
            } catch (error) {
                console.error(`Error loading batch at offset ${offset}:`, error);
                
                retryCount++;
                if (retryCount >= maxRetries) {
                    console.error(`Failed after ${maxRetries} retries at offset ${offset}`);
                    hasMore = false;
                } else {
                    console.log(`Retrying (${retryCount}/${maxRetries})...`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                }
            }
        }
        
        const progressDiv = document.getElementById('loading-progress');
        if (progressDiv) {
            progressDiv.remove();
        }
        
        console.log(`✅ Data loading complete: ${allRecords.length} total records`);
        
        if (Math.random() < 0.1) {
            cacheManager.clearOldCache();
        }
        
        return allRecords;
    }

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

    clearCache() {
        const cacheKey = `${this.endpoint}_data`;
        dataCache.delete(cacheKey);
    }

    async refreshData() {
        const cacheKey = `${this.endpoint}_data`;
        dataCache.delete(cacheKey);
        await cacheManager.setCachedData(cacheKey, null);
        
        if (this.table) {
            this.table.setData();
        }
    }

    initialize() {
        if (this.isInitialized) {
            console.log(`Table ${this.elementId} already initialized`);
            return;
        }
        
        console.log(`Lazy initializing table ${this.elementId}`);
        this.isInitialized = true;
        
        throw new Error("initialize must be implemented by child class");
    }

    getTableScrollPosition() {
        const tableHolder = document.querySelector(`${this.elementId} .tabulator-tableHolder`);
        return tableHolder ? tableHolder.scrollTop : 0;
    }
    
    setTableScrollPosition(position) {
        const tableHolder = document.querySelector(`${this.elementId} .tabulator-tableHolder`);
        if (tableHolder) {
            tableHolder.scrollTop = position;
        }
    }
    
    getTabulator() {
        return this.table;
    }
    
    getExpandedRows() {
        return Array.from(this.expandedRowsSet);
    }
    
    setExpandedRows(expandedRowIds) {
        this.expandedRowsSet = new Set(expandedRowIds);
    }

    generateRowId(data) {
        const fields = [];
        
        if (data["Matchup Game ID"] !== undefined) {
            return `matchup_${data["Matchup Game ID"]}`;
        }
        
        if (data["Batter Name"]) {
            fields.push(data["Batter Name"]);
            if (data["Batter Team"]) fields.push(data["Batter Team"]);
            if (data["Batter Prop Type"]) fields.push(data["Batter Prop Type"]);
            if (data["Batter Prop Value"]) fields.push(data["Batter Prop Value"]);
            if (data["Batter Prop Split ID"]) fields.push(data["Batter Prop Split ID"]);
            if (data["Batter Stat Type"]) fields.push(data["Batter Stat Type"]);
            return `batter_${fields.join('_')}`;
        }
        
        if (data["Pitcher Name"]) {
            fields.push(data["Pitcher Name"]);
            if (data["Pitcher Team"]) fields.push(data["Pitcher Team"]);
            if (data["Pitcher Prop Type"]) fields.push(data["Pitcher Prop Type"]);
            if (data["Pitcher Prop Value"]) fields.push(data["Pitcher Prop Value"]);
            if (data["Pitcher Prop Split ID"]) fields.push(data["Pitcher Prop Split ID"]);
            if (data["Pitcher Stat Type"]) fields.push(data["Pitcher Stat Type"]);
            return `pitcher_${fields.join('_')}`;
        }
        
        const keys = Object.keys(data).filter(k => !k.startsWith('_') && data[k] != null);
        return keys.slice(0, 5).map(k => `${k}:${data[k]}`).join('|');
    }

    executePendingRestoration() {
        if (!this.pendingRestoration) return;
        
        const { expandedRowIds } = this.pendingRestoration;
        this.restorationAttempts++;
        
        console.log(`Executing pending restoration attempt ${this.restorationAttempts} for ${this.elementId}`);
        
        const success = this.restoreExpandedRowsWithRetry(expandedRowIds);
        
        if (success || this.restorationAttempts >= this.maxRestorationAttempts) {
            console.log(`Restoration ${success ? 'completed' : 'failed'} after ${this.restorationAttempts} attempts`);
            this.pendingRestoration = null;
            this.restorationAttempts = 0;
            this.isRestoringState = false;
        }
    }

    restoreExpandedRowsWithRetry(expandedRowIds) {
        if (!this.table || expandedRowIds.length === 0) return false;
        
        let successCount = 0;
        const allRows = this.table.getRows();
        console.log(`Checking ${allRows.length} rows for restoration`);
        
        expandedRowIds.forEach(rowId => {
            const row = allRows.find(r => this.generateRowId(r.getData()) === rowId);
            if (row) {
                try {
                    const rowData = row.getData();
                    const rowElement = row.getElement();
                    
                    rowData._expanded = true;
                    row.update(rowData);
                    
                    if (rowElement) {
                        rowElement.classList.add('tabulator-row-expanded');
                        
                        const toggle = rowElement.querySelector('.row-expander');
                        if (toggle) {
                            toggle.classList.add('open');
                            toggle.textContent = '−';
                        }
                        
                        setTimeout(() => {
                            row.reformat();
                        }, 50);
                    }
                    
                    successCount++;
                    console.log(`Found matching row to restore: ${rowId}`);
                } catch (error) {
                    console.error(`Failed to restore row ${rowId}:`, error);
                }
            } else {
                console.log(`Row ${rowId} not found in table`);
            }
        });
        
        console.log(`Found ${successCount} rows to restore`);
        return successCount === expandedRowIds.length;
    }

    restoreTemporaryExpandedState() {
        if (this.temporaryExpandedRows.size === 0) return;
        
        console.log(`Restoring ${this.temporaryExpandedRows.size} temporarily saved expanded rows for ${this.elementId}`);
        
        const expandedRowIds = Array.from(this.temporaryExpandedRows);
        this.restoreExpandedRowsWithRetry(expandedRowIds);
    }

    applyGlobalExpandedState() {
        if (!this.table || !this.isRestoringState) return;
        
        const globalState = this.getGlobalState();
        if (!globalState || globalState.size === 0) return;
        
        console.log(`Applying ${globalState.size} globally stored expanded rows to ${this.elementId} during restoration`);
        
        const rows = this.table.getRows();
        let expandedCount = 0;
        
        rows.forEach(row => {
            const data = row.getData();
            const rowId = this.generateRowId(data);
            
            if (globalState.has(rowId)) {
                if (!data._expanded) {
                    data._expanded = true;
                    row.update(data);
                    expandedCount++;
                    
                    setTimeout(() => {
                        if (this.isRestoringState) {
                            row.reformat();
                            
                            setTimeout(() => {
                                const cells = row.getCells();
                                const nameFields = ["Batter Name", "Pitcher Name", "Matchup Team"];
                                
                                for (let field of nameFields) {
                                    const nameCell = cells.find(cell => cell.getField() === field);
                                    if (nameCell) {
                                        const cellElement = nameCell.getElement();
                                        const expander = cellElement.querySelector('.row-expander');
                                        if (expander) {
                                            expander.innerHTML = "−";
                                        }
                                        break;
                                    }
                                }
                            }, 50);
                        }
                    }, 100);
                }
            }
        });
        
        if (expandedCount > 0) {
            console.log(`Successfully expanded ${expandedCount} rows during restoration`);
        }
    }

    // ENHANCED: saveState now saves filters and sorts too
    saveState() {
        if (!this.table) return;
        
        console.log(`Saving state for ${this.elementId}`);
        
        // Save scroll position
        const tableHolder = this.table.element.querySelector('.tabulator-tableHolder');
        if (tableHolder) {
            this.lastScrollPosition = tableHolder.scrollTop;
        }
        
        // CRITICAL: Get the actual current state from the DOM and data
        const globalState = this.getGlobalState();
        const actualExpandedRows = new Map();
        
        // Check each row's actual state
        const rows = this.table.getRows();
        rows.forEach(row => {
            const data = row.getData();
            const rowElement = row.getElement();
            const rowId = this.generateRowId(data);
            
            // Check multiple conditions to determine if row is truly expanded
            let isExpanded = false;
            
            // Check data._expanded flag
            if (data._expanded === true) {
                // Verify this is actually true in the DOM
                const expander = rowElement ? rowElement.querySelector('.row-expander') : null;
                const hasSubrow = rowElement ? rowElement.querySelector('.subrow-container') : null;
                
                // Only consider it expanded if the DOM shows it's expanded
                if (expander && (expander.innerHTML === '−' || expander.textContent === '−')) {
                    isExpanded = true;
                } else if (hasSubrow) {
                    isExpanded = true;
                }
            }
            
            // If row is expanded, add to the state
            if (isExpanded) {
                actualExpandedRows.set(rowId, { 
                    timestamp: Date.now(),
                    data: data 
                });
            }
        });
        
        // CRITICAL: Update global state with the actual expanded rows
        globalState.clear();
        actualExpandedRows.forEach((value, key) => {
            globalState.set(key, value);
        });
        
        // Update the global state
        this.setGlobalState(globalState);
        
        // Update local caches to match
        this.expandedRowsSet.clear();
        this.expandedRowsCache.clear();
        actualExpandedRows.forEach((value, key) => {
            this.expandedRowsSet.add(key);
            this.expandedRowsCache.set(key, true);
        });
        
        // Also update temporary expanded rows
        this.temporaryExpandedRows.clear();
        actualExpandedRows.forEach((value, key) => {
            this.temporaryExpandedRows.add(key);
        });
        
        // NEW: Save filter state
        const globalFilterState = this.getGlobalFilterState();
        globalFilterState.clear();
        
        // Get header filters
        const headerFilters = this.table.getHeaderFilters();
        headerFilters.forEach(filter => {
            if (filter.value !== "" && filter.value !== undefined) {
                globalFilterState.set(filter.field, filter.value);
            }
        });
        
        this.setGlobalFilterState(globalFilterState);
        
        // NEW: Save sort state
        const sortState = this.table.getSorters();
        const globalSortState = sortState.map(sorter => ({
            column: sorter.field,
            dir: sorter.dir
        }));
        this.setGlobalSortState(globalSortState);
        
        console.log(`Saved state for ${this.elementId}:
            - ${actualExpandedRows.size} expanded rows
            - ${globalFilterState.size} filters
            - ${globalSortState.length} sort columns`);
    }

    // ENHANCED: restoreState now restores filters and sorts too
    restoreState() {
        if (!this.table) return;
        
        const hasData = this.table.getData && this.table.getData().length > 0;
        
        if (!this.dataLoaded && !hasData) {
            console.log(`Data not yet loaded for ${this.elementId}, deferring state restore`);
            this.pendingStateRestore = true;
            return;
        }
        
        // NEW: Restore sort state first (before filters)
        const globalSortState = this.getGlobalSortState();
        if (globalSortState && globalSortState.length > 0) {
            console.log(`Restoring ${globalSortState.length} sort columns for ${this.elementId}`);
            try {
                this.table.setSort(globalSortState);
            } catch (error) {
                console.error(`Error restoring sort state:`, error);
            }
        }
        
        // NEW: Restore filter state
        const globalFilterState = this.getGlobalFilterState();
        if (globalFilterState && globalFilterState.size > 0) {
            console.log(`Restoring ${globalFilterState.size} filters for ${this.elementId}`);
            
            // Clear all existing filters first
            this.table.clearHeaderFilter();
            
            // Apply saved filters
            globalFilterState.forEach((value, field) => {
                try {
                    // Special handling for custom multiselect filters
                    const column = this.table.getColumn(field);
                    if (column) {
                        const headerElement = column.getElement();
                        const filterElement = headerElement.querySelector('.tabulator-header-filter');
                        
                        if (filterElement && filterElement.querySelector('.custom-multiselect')) {
                            // For custom multiselect, we need to trigger the filter function
                            column.setHeaderFilterValue(value);
                        } else {
                            // For regular filters
                            this.table.setHeaderFilterValue(field, value);
                        }
                    }
                } catch (error) {
                    console.error(`Error restoring filter for field ${field}:`, error);
                }
            });
            
            // Allow filters to apply before restoring expanded rows
            setTimeout(() => {
                this.restoreExpandedRowsState();
            }, 200);
        } else {
            // No filters to restore, proceed with expanded rows immediately
            this.restoreExpandedRowsState();
        }
        
        // Restore scroll position
        if (this.lastScrollPosition > 0) {
            setTimeout(() => {
                const tableHolder = this.table.element.querySelector('.tabulator-tableHolder');
                if (tableHolder) {
                    tableHolder.scrollTop = this.lastScrollPosition;
                }
            }, 400);
        }
    }

    // NEW: Separate method for restoring expanded rows state
    restoreExpandedRowsState() {
        const globalState = this.getGlobalState();
        
        if (!globalState || globalState.size === 0) {
            return;
        }
        
        console.log(`Restoring ${globalState.size} expanded rows for ${this.elementId}`);
        
        this.isRestoringState = true;
        
        const expandedRowIds = Array.from(globalState.keys());
        this.pendingRestoration = {
            expandedRowIds: expandedRowIds,
            timestamp: Date.now()
        };
        
        this.temporaryExpandedRows.clear();
        expandedRowIds.forEach(id => this.temporaryExpandedRows.add(id));
        
        this.expandedRowsCache.clear();
        expandedRowIds.forEach(id => this.expandedRowsCache.set(id, true));
        
        setTimeout(() => {
            this.executePendingRestoration();
        }, 50);
        
        [150, 300, 500, 750, 1000].forEach(delay => {
            setTimeout(() => {
                if (this.pendingRestoration) {
                    this.executePendingRestoration();
                }
            }, delay);
        });
        
        setTimeout(() => {
            if (this.isRestoringState) {
                console.log(`Cleared restoration flag for ${this.elementId}`);
                this.isRestoringState = false;
            }
        }, 2000);
    }

    destroy() {
        if (this.table) {
            this.saveState();
            this.table.destroy();
            this.table = null;
        }
        this.isInitialized = false;
        this.dataLoaded = false;
        this.pendingStateRestore = false;
        this.isRestoringState = false;
    }

    getTable() {
        return this.table;
    }

    createNameFormatter() {
        return function(cell, formatterParams, onRendered) {
            var value = cell.getValue();
            var row = cell.getRow();
            var expanded = row.getData()._expanded || false;
            
            onRendered(function() {
                try {
                    var cellElement = cell.getElement();
                    if (cellElement && cellElement.querySelector) {
                        cellElement.innerHTML = '';
                        
                        var container = document.createElement("div");
                        container.style.display = "flex";
                        container.style.alignItems = "center";
                        container.style.cursor = "pointer";
                        
                        var expander = document.createElement("span");
                        expander.innerHTML = expanded ? "−" : "+";
                        expander.style.marginRight = "8px";
                        expander.style.fontWeight = "bold";
                        expander.style.color = "#007bff";
                        expander.style.fontSize = "14px";
                        expander.style.minWidth = "12px";
                        expander.classList.add("row-expander");
                        
                        var textSpan = document.createElement("span");
                        textSpan.textContent = value || "";
                        
                        container.appendChild(expander);
                        container.appendChild(textSpan);
                        
                        cellElement.appendChild(container);
                    }
                } catch (error) {
                    console.error("Error in formatter onRendered:", error);
                }
            });
            
            return (expanded ? "− " : "+ ") + (value || "");
        };
    }

    createTeamFormatter() {
        return function(cell) {
            var value = cell.getValue();
            return value;
        };
    }

    // CRITICAL FIX: Enhanced setupRowExpansion with proper state synchronization
    setupRowExpansion() {
        if (!this.table) return;
        
        const self = this;
        let expansionTimeout;
        
        this.table.on("cellClick", (e, cell) => {
            const field = cell.getField();
            
            const expandableFields = [
                "Batter Name", 
                "Pitcher Name", 
                "Matchup Team"
            ];
            
            if (expandableFields.includes(field)) {
                e.preventDefault();
                e.stopPropagation();
                
                if (self.isRestoringState) {
                    console.log("Click during restoration - queueing for later");
                    setTimeout(() => {
                        if (!self.isRestoringState) {
                            cell.getElement().click();
                        }
                    }, 500);
                    return;
                }
                
                if (expansionTimeout) {
                    clearTimeout(expansionTimeout);
                }
                
                expansionTimeout = setTimeout(() => {
                    if (self.isRestoringState) {
                        console.log("Still restoring, ignoring click");
                        return;
                    }
                    
                    var row = cell.getRow();
                    var data = row.getData();
                    
                    if (data._expanded === undefined) {
                        data._expanded = false;
                    }
                    
                    // Toggle expansion
                    data._expanded = !data._expanded;
                    
                    // CRITICAL: Update global state immediately
                    const rowId = self.generateRowId(data);
                    const globalState = self.getGlobalState();
                    
                    if (data._expanded) {
                        // Row is being expanded - add to state
                        globalState.set(rowId, {
                            timestamp: Date.now(),
                            data: data
                        });
                    } else {
                        // Row is being collapsed - REMOVE from state
                        globalState.delete(rowId);
                    }
                    
                    // Update the global state
                    self.setGlobalState(globalState);
                    
                    // Also update local caches to stay in sync
                    if (data._expanded) {
                        self.expandedRowsSet.add(rowId);
                        self.expandedRowsCache.set(rowId, true);
                        self.temporaryExpandedRows.add(rowId);
                    } else {
                        self.expandedRowsSet.delete(rowId);
                        self.expandedRowsCache.delete(rowId);
                        self.temporaryExpandedRows.delete(rowId);
                    }
                    
                    console.log(`Row ${rowId} ${data._expanded ? 'expanded' : 'collapsed'}. Global state now has ${globalState.size} expanded rows.`);
                    
                    // Update row
                    row.update(data);
                    
                    // Update icon immediately
                    var cellElement = cell.getElement();
                    var expanderIcon = cellElement.querySelector('.row-expander');
                    if (expanderIcon) {
                        expanderIcon.innerHTML = data._expanded ? "−" : "+";
                    }
                    
                    // Reformat row
                    requestAnimationFrame(() => {
                        row.reformat();
                        
                        // Ensure icon stays correct after reformat
                        requestAnimationFrame(() => {
                            try {
                                var updatedCellElement = cell.getElement();
                                if (updatedCellElement) {
                                    var updatedExpanderIcon = updatedCellElement.querySelector('.row-expander');
                                    if (updatedExpanderIcon) {
                                        updatedExpanderIcon.innerHTML = data._expanded ? "−" : "+";
                                    }
                                }
                            } catch (error) {
                                console.error("Error updating expander icon:", error);
                            }
                        });
                    });
                }, 50);
            }
        });
    }

    createSubtable1(container, data) {
        new Tabulator(container, {
            layout: "fitColumns",
            columnHeaderSortMulti: false,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            height: false,
            virtualDom: false,
            data: [{
                propFactor: data["Batter Prop Park Factor"] || data["Pitcher Prop Park Factor"],
                lineupStatus: data["Lineup Status"] + ": " + data["Batting Position"],
                matchup: data["Matchup"],
                opposingPitcher: data["SP"]
            }],
            columns: [
                {title: "Prop Park Factor", field: "propFactor", headerSort: false, width: 300},
                {title: "Lineup Status", field: "lineupStatus", headerSort: false, width: 200},
                {title: "Matchup", field: "matchup", headerSort: false, width: 300},
                {title: "Opposing Pitcher", field: "opposingPitcher", headerSort: false, width: 400}
            ]
        });
    }

    createSubtable2(container, data) {
        console.log("createSubtable2 should be overridden by child class");
    }

    createRowFormatter() {
        const self = this;
        
        return (row) => {
            var data = row.getData();
            var rowElement = row.getElement();
            
            if (data._expanded === undefined) {
                data._expanded = false;
            }
            
            if (data._expanded) {
                rowElement.classList.add('row-expanded');
            } else {
                rowElement.classList.remove('row-expanded');
            }
            
            if (data._expanded) {
                let existingSubrow = rowElement.querySelector('.subrow-container');
                
                if (!existingSubrow || self.isRestoringState) {
                    if (existingSubrow && self.isRestoringState) {
                        existingSubrow.remove();
                        existingSubrow = null;
                    }
                    
                    if (!existingSubrow) {
                        requestAnimationFrame(() => {
                            var holderEl = document.createElement("div");
                            holderEl.classList.add('subrow-container');
                            holderEl.style.cssText = 'padding: 10px; background: #f8f9fa; margin: 10px 0; border-radius: 4px; display: block; width: 100%; position: relative; z-index: 1;';
                            
                            if (data["Matchup Team"] !== undefined) {
                                var subtableEl = document.createElement("div");
                                holderEl.appendChild(subtableEl);
                                rowElement.appendChild(holderEl);
                                
                                if (self.createMatchupsSubtable) {
                                    self.createMatchupsSubtable(subtableEl, data);
                                }
                            } else {
                                var subtable1 = document.createElement("div");
                                subtable1.style.marginBottom = "15px";
                                var subtable2 = document.createElement("div");
                                
                                holderEl.appendChild(subtable1);
                                holderEl.appendChild(subtable2);
                                rowElement.appendChild(holderEl);
                                
                                try {
                                    self.createSubtable1(subtable1, data);
                                } catch (error) {
                                    console.error("Error creating subtable1:", error);
                                    subtable1.innerHTML = '<div style="padding: 10px; color: red;">Error loading subtable 1: ' + error.message + '</div>';
                                }
                                
                                try {
                                    self.createSubtable2(subtable2, data);
                                } catch (error) {
                                    console.error("Error creating subtable2:", error);
                                    subtable2.innerHTML = '<div style="padding: 10px; color: red;">Error loading subtable 2: ' + error.message + '</div>';
                                }
                            }
                            
                            setTimeout(() => {
                                row.normalizeHeight();
                            }, 100);
                        });
                    }
                }
            } else {
                var existingSubrow = rowElement.querySelector('.subrow-container');
                if (existingSubrow) {
                    existingSubrow.remove();
                    rowElement.classList.remove('row-expanded');
                    
                    setTimeout(() => {
                        row.normalizeHeight();
                    }, 50);
                }
            }
        };
    }
}
