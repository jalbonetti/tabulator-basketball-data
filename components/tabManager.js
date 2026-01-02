// components/tabManager.js - Tab Manager for Basketball Tables
// Updated to work with dynamically generated tab structure

export const TAB_STYLES = `
    .basketball-tables-wrapper {
        width: 100%;
    }
    
    .tab-buttons {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 5px;
        padding: 10px;
        background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
        border-radius: 8px 8px 0 0;
        margin-bottom: 0;
    }
    
    .tab-button {
        padding: 10px 16px;
        border: none;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.2s ease;
        white-space: nowrap;
    }
    
    .tab-button:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
    }
    
    .tab-button.active {
        background: white;
        color: #ea580c;
        font-weight: bold;
    }
    
    .tab-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
    }
    
    .table-container {
        width: 100%;
        display: none;
    }
    
    .table-container.active-table {
        display: block;
    }
    
    /* Ensure table connects visually to tabs */
    .table-container .tabulator {
        border-radius: 0 0 6px 6px;
        border-top: none;
    }
    
    @media screen and (max-width: 768px) {
        .tab-button {
            padding: 8px 12px;
            font-size: 11px;
        }
        
        .tab-buttons {
            gap: 4px;
            padding: 8px;
        }
    }
`;

export class TabManager {
    constructor(tables) {
        this.tables = tables;
        this.currentActiveTab = null;
        this.tabInitialized = {};
        this.tableStates = {};
        this.scrollPositions = {};
        this.expandedRowsStates = {};
        this.isTransitioning = false;
        
        // Find the first available tab
        const tabIds = Object.keys(tables);
        if (tabIds.length > 0) {
            this.currentActiveTab = tabIds[0];
        }
        
        // Mark all tabs as not initialized
        tabIds.forEach(tabId => {
            this.tabInitialized[tabId] = false;
        });
        
        // Make TabManager globally accessible for components that need to check state
        window.tabManager = this;
        
        this.init();
    }

    init() {
        console.log("TabManager: Initializing...");
        
        // Setup tab click handlers
        this.setupTabHandlers();
        
        // Setup responsive behavior
        this.setupResponsive();
        
        // Initialize first tab
        if (this.currentActiveTab) {
            this.initializeTab(this.currentActiveTab);
        }
        
        console.log("TabManager: Initialization complete");
    }

    setupTabHandlers() {
        const tabButtons = document.querySelectorAll('.tab-button');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                if (tabId && !e.target.disabled) {
                    this.switchTab(tabId);
                }
            });
        });
        
        console.log(`TabManager: Set up handlers for ${tabButtons.length} tabs`);
    }

    switchTab(tabId) {
        if (tabId === this.currentActiveTab) return;
        if (this.isTransitioning) return;
        
        console.log(`TabManager: Switching from ${this.currentActiveTab} to ${tabId}`);
        
        this.isTransitioning = true;
        
        // Save state of current tab
        if (this.currentActiveTab) {
            this.saveTabState(this.currentActiveTab);
        }
        
        // Update button states
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        
        // Hide all containers
        document.querySelectorAll('.table-container').forEach(container => {
            container.classList.remove('active-table');
            container.style.display = 'none';
        });
        
        // Show target container
        const targetContainer = document.getElementById(`${tabId}-container`);
        if (targetContainer) {
            targetContainer.classList.add('active-table');
            targetContainer.style.display = 'block';
        }
        
        const previousTab = this.currentActiveTab;
        this.currentActiveTab = tabId;
        
        // Initialize tab if needed, then restore state
        if (!this.tabInitialized[tabId]) {
            this.initializeTab(tabId).then(() => {
                this.isTransitioning = false;
            });
        } else {
            // Restore state and redraw
            this.restoreTabState(tabId);
            const tableWrapper = this.tables[tabId];
            if (tableWrapper && tableWrapper.table) {
                // Force redraw after tab switch
                setTimeout(() => {
                    tableWrapper.table.redraw(true);
                    
                    // Re-equalize columns after redraw (desktop only)
                    if (window.innerWidth > 1024) {
                        if (tableWrapper.equalizeClusteredColumns) {
                            tableWrapper.equalizeClusteredColumns();
                        }
                        if (tableWrapper.expandNameColumnToFill) {
                            tableWrapper.expandNameColumnToFill();
                        }
                    }
                    
                    this.isTransitioning = false;
                }, 100);
            } else {
                this.isTransitioning = false;
            }
        }
    }

    initializeTab(tabId) {
        if (this.tabInitialized[tabId]) {
            return Promise.resolve();
        }
        
        console.log(`TabManager: Lazy initializing tab: ${tabId}`);
        
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                const tableWrapper = this.tables[tabId];
                
                if (tableWrapper && !tableWrapper.isInitialized) {
                    try {
                        tableWrapper.initialize();
                        tableWrapper.isInitialized = true;
                        this.tabInitialized[tabId] = true;
                        
                        if (!this.tableStates[tabId]) {
                            this.tableStates[tabId] = {};
                        }
                        this.tableStates[tabId].initializedAt = Date.now();
                        
                        console.log(`TabManager: Tab ${tabId} initialized successfully`);
                    } catch (error) {
                        console.error(`TabManager: Error initializing tab ${tabId}:`, error);
                    }
                } else if (!tableWrapper) {
                    console.warn(`TabManager: No table wrapper found for tab ${tabId}`);
                }
                
                resolve();
            });
        });
    }

    saveTabState(tabId) {
        const tableWrapper = this.tables[tabId];
        if (!tableWrapper || !tableWrapper.table) return;
        
        try {
            // Save scroll position
            const tableHolder = tableWrapper.table.element.querySelector('.tabulator-tableholder');
            if (tableHolder) {
                this.scrollPositions[tabId] = {
                    top: tableHolder.scrollTop,
                    left: tableHolder.scrollLeft
                };
            }
            
            // Save filter state
            if (tableWrapper.saveState) {
                tableWrapper.saveState();
            }
            
            // Save expanded rows
            const expandedRows = [];
            const rows = tableWrapper.table.getRows();
            rows.forEach(row => {
                const data = row.getData();
                if (data._expanded) {
                    expandedRows.push(tableWrapper.generateRowId ? 
                        tableWrapper.generateRowId(data) : JSON.stringify(data));
                }
            });
            
            this.expandedRowsStates[tabId] = expandedRows;
            
            console.log(`TabManager: Saved state for ${tabId}: ${expandedRows.length} expanded rows`);
        } catch (error) {
            console.error(`TabManager: Error saving state for ${tabId}:`, error);
        }
    }

    restoreTabState(tabId) {
        const tableWrapper = this.tables[tabId];
        if (!tableWrapper || !tableWrapper.table) return;
        
        try {
            // Restore filter/sort state
            if (tableWrapper.restoreState) {
                tableWrapper.restoreState();
            }
            
            // Restore expanded rows
            const expandedRowIds = this.expandedRowsStates[tabId] || [];
            if (expandedRowIds.length > 0) {
                console.log(`TabManager: Restoring ${expandedRowIds.length} expanded rows for ${tabId}`);
                
                setTimeout(() => {
                    const rows = tableWrapper.table.getRows();
                    rows.forEach(row => {
                        const data = row.getData();
                        const rowId = tableWrapper.generateRowId ? 
                            tableWrapper.generateRowId(data) : JSON.stringify(data);
                        
                        if (expandedRowIds.includes(rowId)) {
                            if (!data._expanded) {
                                data._expanded = true;
                                row.reformat();
                            }
                        }
                    });
                }, 200);
            }
            
            // Restore scroll position
            if (this.scrollPositions[tabId]) {
                setTimeout(() => {
                    const tableHolder = tableWrapper.table.element.querySelector('.tabulator-tableholder');
                    if (tableHolder) {
                        tableHolder.scrollTop = this.scrollPositions[tabId].top || 0;
                        tableHolder.scrollLeft = this.scrollPositions[tabId].left || 0;
                    }
                }, 300);
            }
        } catch (error) {
            console.error(`TabManager: Error restoring state for ${tabId}:`, error);
        }
    }

    setupResponsive() {
        const handleResize = () => {
            const tabButtons = document.querySelectorAll('.tab-button');
            const width = window.innerWidth;
            
            tabButtons.forEach(button => {
                if (width <= 768) {
                    button.style.fontSize = '11px';
                    button.style.padding = '8px 12px';
                } else {
                    button.style.fontSize = '13px';
                    button.style.padding = '10px 16px';
                }
            });
        };
        
        window.addEventListener('resize', handleResize);
        handleResize();
    }

    // Get current active table instance
    getActiveTable() {
        return this.tables[this.currentActiveTab];
    }

    // Refresh current tab's data
    refreshCurrentTab() {
        const table = this.getActiveTable();
        if (table && table.refreshData) {
            return table.refreshData();
        }
    }

    // Clear filters on current tab
    clearCurrentFilters() {
        const table = this.getActiveTable();
        if (table && table.clearFilters) {
            table.clearFilters();
        } else if (table && table.table) {
            table.table.clearHeaderFilter();
        }
    }
    
    // Get list of all tab IDs
    getTabIds() {
        return Object.keys(this.tables);
    }
    
    // Check if a tab is initialized
    isTabInitialized(tabId) {
        return this.tabInitialized[tabId] === true;
    }
}
