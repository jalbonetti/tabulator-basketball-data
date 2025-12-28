// components/tabManager.js - Tab Manager for Basketball Tables
export const TAB_STYLES = `
    .tabs-container {
        display: flex;
        flex-direction: column;
        width: 100%;
        margin-bottom: 20px;
    }
    
    .tab-buttons {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 5px;
        padding: 10px;
        background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
        border-radius: 8px;
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
    
    .table-container {
        width: 100%;
        display: none;
    }
    
    .table-container.active-table {
        display: block;
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
        this.currentActiveTab = 'table0';
        this.tabInitialized = {};
        this.tableStates = {};
        this.scrollPositions = {};
        this.expandedRowsStates = {};
        
        // Mark first tab as initialized
        this.tabInitialized['table0'] = false;
        
        this.init();
    }

    init() {
        console.log("TabManager: Initializing...");
        
        // Inject tab styles
        this.injectTabStyles();
        
        // Setup tab click handlers
        this.setupTabHandlers();
        
        // Setup responsive behavior
        this.setupResponsive();
        
        // Initialize first tab
        this.initializeTab('table0');
        
        console.log("TabManager: Initialization complete");
    }

    injectTabStyles() {
        if (!document.querySelector('style[data-tab-styles]')) {
            const style = document.createElement('style');
            style.setAttribute('data-tab-styles', 'true');
            style.textContent = TAB_STYLES;
            document.head.appendChild(style);
        }
    }

    setupTabHandlers() {
        const tabButtons = document.querySelectorAll('.tab-button');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                this.switchTab(tabId);
            });
        });
    }

    switchTab(tabId) {
        if (tabId === this.currentActiveTab) return;
        
        console.log(`TabManager: Switching from ${this.currentActiveTab} to ${tabId}`);
        
        // Save state of current tab
        this.saveTabState(this.currentActiveTab);
        
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
        
        // Initialize tab if needed
        if (!this.tabInitialized[tabId]) {
            this.initializeTab(tabId);
        } else {
            // Restore state and redraw
            this.restoreTabState(tabId);
            const tableWrapper = this.tables[tabId];
            if (tableWrapper && tableWrapper.table) {
                tableWrapper.table.redraw(true);
            }
        }
        
        this.currentActiveTab = tabId;
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
                    tableWrapper.initialize();
                    tableWrapper.isInitialized = true;
                    this.tabInitialized[tabId] = true;
                    
                    if (!this.tableStates[tabId]) {
                        this.tableStates[tabId] = {};
                    }
                    this.tableStates[tabId].initializedAt = Date.now();
                    
                    console.log(`TabManager: Tab ${tabId} initialized`);
                }
                
                resolve();
            });
        });
    }

    saveTabState(tabId) {
        const tableWrapper = this.tables[tabId];
        if (!tableWrapper || !tableWrapper.table) return;
        
        // Save scroll position
        const tableHolder = tableWrapper.table.element.querySelector('.tabulator-tableHolder');
        if (tableHolder) {
            this.scrollPositions[tabId] = tableHolder.scrollTop;
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
    }

    restoreTabState(tabId) {
        const tableWrapper = this.tables[tabId];
        if (!tableWrapper || !tableWrapper.table) return;
        
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
                const tableHolder = tableWrapper.table.element.querySelector('.tabulator-tableHolder');
                if (tableHolder) {
                    tableHolder.scrollTop = this.scrollPositions[tabId];
                }
            }, 300);
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

    // Get current active table
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
        }
    }
}
