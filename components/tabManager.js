// components/tabManager.js - Tab Manager for Basketball Tables
// Based on working baseball repository pattern

export const TAB_STYLES = `
    /* Table wrapper */
    .table-wrapper {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        width: 100% !important;
        margin: 0 auto !important;
    }
    
    /* Tabs container */
    .tabs-container {
        width: 100%;
        margin-bottom: 0;
        z-index: 10;
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
    
    /* Tables container */
    .tables-container {
        width: 100%;
        position: relative;
        min-height: 500px;
    }
    
    /* Individual table containers */
    .table-container {
        width: 100%;
    }
    
    .table-container.active-table {
        display: block;
    }
    
    .table-container.inactive-table {
        display: none;
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
    
    /* Tablet responsive */
    @media screen and (min-width: 769px) and (max-width: 1199px) {
        .tabs-container {
            transform: none !important;
            width: 100% !important;
        }
        
        .tab-buttons {
            transform: none !important;
        }
        
        .tab-button {
            transform: none !important;
        }
    }
`;

export class TabManager {
    constructor(tables) {
        this.tables = tables;
        this.currentActiveTab = 'table0';
        this.scrollPositions = {};
        this.tableStates = {};
        this.tabInitialized = {};
        this.isTransitioning = false;
        this.expandedRowsStates = {};
        
        // Mark all tabs as not initialized
        Object.keys(tables).forEach(tabId => {
            this.tabInitialized[tabId] = false;
        });
        
        // Inject styles
        this.injectStyles();
        
        // Setup tab switching
        this.setupTabSwitching();
        
        // Initialize the first tab only
        this.initializeTab(this.currentActiveTab);
        
        // Setup responsive handler
        this.setupResponsiveHandler();
        
        console.log("TabManager: Initialized with tabs:", Object.keys(tables));
    }
    
    injectStyles() {
        if (!document.querySelector('#tab-manager-styles')) {
            const style = document.createElement('style');
            style.id = 'tab-manager-styles';
            style.textContent = TAB_STYLES;
            document.head.appendChild(style);
            console.log("TabManager: Styles injected");
        }
    }

    setupResponsiveHandler() {
        const handleResize = () => {
            const width = window.innerWidth;
            const tabButtons = document.querySelectorAll('.tab-button');
            
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

    setupTabSwitching() {
        // Use event delegation on document for tab clicks
        document.addEventListener('click', async (e) => {
            if (e.target.classList.contains('tab-button')) {
                e.preventDefault();
                
                if (this.isTransitioning) return;
                
                const targetTab = e.target.getAttribute('data-tab');
                if (targetTab === this.currentActiveTab) return;
                
                this.isTransitioning = true;
                
                try {
                    // Save current state
                    this.saveTabState(this.currentActiveTab);
                    
                    // Hide current table
                    const currentContainer = document.getElementById(`${this.currentActiveTab}-container`);
                    if (currentContainer) {
                        currentContainer.style.display = 'none';
                        currentContainer.classList.remove('active-table');
                        currentContainer.classList.add('inactive-table');
                    }
                    
                    // Update active tab button
                    document.querySelectorAll('.tab-button').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    e.target.classList.add('active');
                    
                    // Initialize target tab if needed
                    await this.initializeTab(targetTab);
                    
                    // Show target table
                    const targetContainer = document.getElementById(`${targetTab}-container`);
                    if (targetContainer) {
                        targetContainer.style.display = 'block';
                        targetContainer.classList.add('active-table');
                        targetContainer.classList.remove('inactive-table');
                    }
                    
                    this.currentActiveTab = targetTab;
                    
                    // Wait for display change
                    await new Promise(resolve => setTimeout(resolve, 50));
                    
                    // Redraw and restore state
                    const targetTableWrapper = this.tables[targetTab];
                    if (targetTableWrapper && targetTableWrapper.table) {
                        targetTableWrapper.table.redraw(true);
                        this.restoreTabState(targetTab);
                        
                        // Re-equalize columns after tab switch (desktop only)
                        if (window.innerWidth > 1024) {
                            setTimeout(() => {
                                if (targetTableWrapper.equalizeClusteredColumns) {
                                    targetTableWrapper.equalizeClusteredColumns();
                                }
                                if (targetTableWrapper.expandNameColumnToFill) {
                                    targetTableWrapper.expandNameColumnToFill();
                                }
                            }, 100);
                        }
                    }
                    
                } finally {
                    this.isTransitioning = false;
                }
            }
        });
        
        console.log("TabManager: Tab switching setup complete");
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
                        this.tabInitialized[tabId] = true;
                        console.log(`TabManager: Tab ${tabId} initialized successfully`);
                    } catch (error) {
                        console.error(`TabManager: Error initializing tab ${tabId}:`, error);
                    }
                } else if (tableWrapper && tableWrapper.isInitialized) {
                    this.tabInitialized[tabId] = true;
                }
                
                // Small delay to ensure table is fully rendered
                setTimeout(resolve, 100);
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
                this.scrollPositions[tabId] = tableHolder.scrollTop;
            }
            
            // Save filter/sort state
            if (tableWrapper.saveState && typeof tableWrapper.saveState === 'function') {
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
            if (tableWrapper.restoreState && typeof tableWrapper.restoreState === 'function') {
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
                                row.update(data);
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
                        tableHolder.scrollTop = this.scrollPositions[tabId];
                    }
                }, 300);
            }
        } catch (error) {
            console.error(`TabManager: Error restoring state for ${tabId}:`, error);
        }
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
    
    // Switch to specific tab programmatically
    switchTab(tabId) {
        const tabButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
        if (tabButton) {
            tabButton.click();
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
