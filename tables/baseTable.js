// tables/baseTable.js - Base Table Class for Basketball Props (matching baseball pattern)
import { API_CONFIG, TEAM_NAME_MAP } from '../shared/config.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';

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
        this.isInitialized = false;
        this.tableConfig = this.getBaseConfig();
        
        // State management
        this.filterState = {};
        this.sortState = [];
        this.expandedRows = new Set();
        
        console.log(`BaseTable initialized for ${endpoint} at ${elementId}`);
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

    getBaseConfig() {
        const self = this;
        const url = API_CONFIG.baseURL + this.endpoint;
        const cacheKey = `basketball_${this.endpoint}`;
        
        const config = {
            height: "600px",
            maxHeight: "600px",
            layout: "fitDataFill",
            // Critical for large datasets - match baseball settings
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
            }
        };

        return config;
    }

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
                    ...config,
                    headers: {
                        ...config.headers,
                        'Range': `${offset}-${offset + pageSize - 1}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (!data || data.length === 0) {
                    hasMore = false;
                } else {
                    allRecords.push(...data);
                    offset += pageSize;
                    
                    // Update progress
                    const progressText = document.getElementById('progress-text');
                    if (progressText) {
                        progressText.textContent = `Loaded ${allRecords.length} records...`;
                    }
                    
                    // Check if we've received less than a full page
                    if (data.length < pageSize) {
                        hasMore = false;
                    }
                }
                
                retryCount = 0; // Reset retry count on success
                
            } catch (error) {
                console.error(`Error fetching data (attempt ${retryCount + 1}):`, error);
                retryCount++;
                
                if (retryCount >= maxRetries) {
                    console.error('Max retries reached, returning partial data');
                    hasMore = false;
                } else {
                    // Wait before retrying
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                }
            }
        }
        
        // Remove loading indicator
        const progressDiv = document.getElementById('loading-progress');
        if (progressDiv) {
            progressDiv.remove();
        }
        
        console.log(`Fetched total of ${allRecords.length} records`);
        return allRecords;
    }

    // Row expansion setup
    setupRowExpansion() {
        if (!this.table) return;
        
        const self = this;
        
        this.table.on("rowClick", function(e, row) {
            // Don't toggle if clicking on a filter or interactive element
            if (e.target.closest('.tabulator-header-filter') || 
                e.target.closest('input') || 
                e.target.closest('select') ||
                e.target.closest('.min-max-filter-container')) {
                return;
            }
            
            const data = row.getData();
            data._expanded = !data._expanded;
            
            // Update global state
            const rowId = self.generateRowId(data);
            if (data._expanded) {
                self.expandedRows.add(rowId);
                if (window.globalExpandedState) {
                    window.globalExpandedState.set(`${self.endpoint}_${rowId}`, true);
                }
            } else {
                self.expandedRows.delete(rowId);
                if (window.globalExpandedState) {
                    window.globalExpandedState.delete(`${self.endpoint}_${rowId}`);
                }
            }
            
            row.reformat();
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

    // Create name formatter
    createNameFormatter() {
        return (cell) => {
            const value = cell.getValue();
            if (!value) return '-';
            
            const container = document.createElement('div');
            container.style.cssText = 'display: flex; align-items: center; cursor: pointer;';
            
            const icon = document.createElement('span');
            icon.className = 'expand-icon';
            icon.style.cssText = 'margin-right: 8px; font-size: 10px; transition: transform 0.2s; color: #f97316;';
            icon.innerHTML = '▶';
            
            const data = cell.getRow().getData();
            if (data._expanded) {
                icon.style.transform = 'rotate(90deg)';
            }
            
            const text = document.createElement('span');
            text.textContent = value;
            text.style.cssText = 'font-weight: 500;';
            
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
}
