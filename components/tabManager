
// components/tabManager.js - FIXED VERSION WITH RESPONSIVE TABS

// Export TAB_STYLES constant with responsive improvements
export const TAB_STYLES = `
    /* FULL WIDTH TAB CONTAINER */
    .tabs-container {
        width: 100% !important;
        max-width: 100% !important;
        background: #ffffff !important;
        border-bottom: 2px solid #dee2e6 !important;
        margin-bottom: 20px !important;
        padding: 0 !important;
        position: relative !important;
        z-index: 100 !important;
        overflow: hidden !important;
        /* Ensure tabs don't scale with tables */
        transform: none !important;
    }

    .tab-buttons {
        display: flex !important;
        flex-wrap: nowrap !important;
        gap: 0 !important; /* Remove gap for full width */
        padding: 0 !important; /* Remove padding for full width */
        background: #f8f9fa !important;
        overflow-x: auto !important;
        overflow-y: hidden !important;
        -webkit-overflow-scrolling: touch !important;
        scrollbar-width: thin !important;
        width: 100% !important;
        max-width: 100% !important;
        justify-content: stretch !important; /* Stretch buttons */
        /* Ensure tabs don't scale with tables */
        transform: none !important;
    }

    /* Make scrollbar visible for tabs */
    .tab-buttons::-webkit-scrollbar {
        height: 6px !important;
        display: block !important;
    }

    .tab-buttons::-webkit-scrollbar-track {
        background: #f1f1f1 !important;
    }

    .tab-buttons::-webkit-scrollbar-thumb {
        background: #888 !important;
        border-radius: 3px !important;
    }

    .tab-buttons::-webkit-scrollbar-thumb:hover {
        background: #555 !important;
    }

    /* FULL WIDTH TAB BUTTONS */
    .tab-button {
        /* Sizing - make buttons expand */
        padding: 12px 8px !important;
        flex: 1 1 auto !important; /* Allow buttons to grow */
        min-width: 120px !important; /* Minimum width */
        
        /* Make clickable */
        pointer-events: auto !important;
        cursor: pointer !important;
        position: relative !important;
        z-index: 101 !important;
        
        /* Styling */
        background: #ffffff !important;
        border: 1px solid #dee2e6 !important;
        border-radius: 0 !important; /* Remove rounded corners for seamless look */
        border-right: none !important; /* Remove right border except last */
        color: #495057 !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        white-space: nowrap !important;
        transition: all 0.2s ease !important;
        text-align: center !important;
        
        /* Remove any transforms - IMPORTANT */
        transform: none !important;
    }
    
    .tab-button:last-child {
        border-right: 1px solid #dee2e6 !important; /* Add right border to last button */
    }

    .tab-button:hover:not(.active) {
        background: #f8f9fa !important;
        border-color: #adb5bd !important;
        color: #212529 !important;
    }

    .tab-button.active {
        background: #007bff !important;
        color: #ffffff !important;
        border-color: #007bff !important;
        font-weight: 600 !important;
        z-index: 102 !important;
    }

    .tab-button:focus {
        outline: 2px solid #007bff !important;
        outline-offset: -2px !important;
    }

    /* Ensure tables container doesn't overflow */
    .tables-container {
        width: 100% !important;
        max-width: 100% !important;
        overflow: hidden !important;
        position: relative !important;
    }

    .table-container {
        width: 100% !important;
        max-width: 100% !important;
        overflow: auto !important;
        position: relative !important;
    }

    /* Mobile responsive - tabs stay normal size */
    @media screen and (max-width: 768px) {
        .tabs-container {
            transform: none !important;
            width: 100% !important;
        }
        
        .tab-buttons {
            padding: 4px !important;
            transform: none !important;
        }
        
        .tab-button {
            padding: 8px 12px !important;
            font-size: 12px !important;
            min-width: 100px !important;
            transform: none !important;
        }
    }
    
    /* Tablet responsive - tabs stay normal size */
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

    /* Fix for tab loading indicator */
    .tab-loading-indicator {
        display: none !important;
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
        this.setupTabSwitching();
        
        // Only initialize the first tab
        this.initializeTab(this.currentActiveTab);
        
        // Inject styles when TabManager is created
        this.injectStyles();
        
        // Add resize observer for responsive handling
        this.setupResponsiveHandler();
    }
    
    injectStyles() {
        // Check if styles already exist
        if (!document.querySelector('#tab-manager-styles')) {
            const style = document.createElement('style');
            style.id = 'tab-manager-styles';
            style.textContent = TAB_STYLES;
            document.head.appendChild(style);
        }
    }

    setupResponsiveHandler() {
        // Ensure tabs maintain proper sizing on resize
        const handleResize = () => {
            const width = window.innerWidth;
            const tabButtons = document.querySelectorAll('.tab-button');
            const tabContainer = document.querySelector('.tabs-container');
            
            // Ensure tabs never get scaled
            if (tabContainer) {
                tabContainer.style.transform = 'none';
                tabContainer.style.width = '100%';
            }
            
            // Adjust font size based on screen width
            tabButtons.forEach(button => {
                button.style.transform = 'none';
                if (width <= 768) {
                    button.style.fontSize = '12px';
                    button.style.padding = '8px 12px';
                } else {
                    button.style.fontSize = '13px';
                    button.style.padding = '12px 8px';
                }
            });
        };
        
        // Use ResizeObserver for better performance
        if (window.ResizeObserver) {
            const resizeObserver = new ResizeObserver(handleResize);
            const tabContainer = document.querySelector('.tabs-container');
            if (tabContainer) {
                resizeObserver.observe(tabContainer);
            }
        }
        
        // Also use traditional resize listener as fallback
        window.addEventListener('resize', handleResize);
        
        // Initial call
        handleResize();
    }

    initializeTab(tabId) {
        if (this.tabInitialized[tabId]) {
            return Promise.resolve();
        }
        
        console.log(`Lazy initializing tab: ${tabId}`);
        
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
                    
                    // Apply responsive scaling immediately after initialization
                    if (window.applyResponsiveScaling) {
                        setTimeout(() => {
                            window.applyResponsiveScaling();
                        }, 50);
                    }
                    
                    setTimeout(resolve, 100);
                } else {
                    resolve();
                }
            });
        });
    }

    setupTabSwitching() {
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
                    const currentContainer = document.querySelector(`#${this.getContainerIdForTab(this.currentActiveTab)}`);
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
                    const targetContainer = document.querySelector(`#${this.getContainerIdForTab(targetTab)}`);
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
                        targetTableWrapper.table.redraw();
                        this.restoreTabState(targetTab);
                        
                        // Apply responsive scaling after tab switch
                        if (window.applyResponsiveScaling) {
                            setTimeout(() => {
                                window.applyResponsiveScaling();
                            }, 100);
                        }
                    }
                    
                } finally {
                    this.isTransitioning = false;
                }
            }
        });
    }

    getContainerIdForTab(tabId) {
        const containerMap = {
            'table0': 'table0-container',
            'table1': 'table1-container',
            'table2': 'table2-container',
            'table3': 'table3-container',
            'table4': 'table4-container',
            'table5': 'table5-container',
            'table6': 'table6-container',
            'table7': 'table7-container',
            'table8': 'table8-container',
            'table9': 'table9-container'
        };
        return containerMap[tabId] || `${tabId}-container`;
    }

    saveTabState(tabId) {
        const tableWrapper = this.tables[tabId];
        if (!tableWrapper || !tableWrapper.table) return;
        
        const tableHolder = tableWrapper.table.element.querySelector('.tabulator-tableHolder');
        if (tableHolder) {
            this.scrollPositions[tabId] = tableHolder.scrollTop;
        }
        
        const expandedRows = [];
        const rows = tableWrapper.table.getRows();
        rows.forEach(row => {
            const data = row.getData();
            if (data._expanded) {
                expandedRows.push(tableWrapper.generateRowId ? 
                    tableWrapper.generateRowId(data) : JSON.stringify(data));
            }
        });
        
        this.expandedRowsStates[this.currentActiveTab] = expandedRows;
        
        console.log(`Saved state for ${this.currentActiveTab}: ${expandedRows.length} expanded rows, scroll: ${this.scrollPositions[this.currentActiveTab]}`);
    }

    restoreTabState(tabId) {
        const tableWrapper = this.tables[tabId];
        if (!tableWrapper || !tableWrapper.table) return;
        
        if (tableWrapper.restoreState && typeof tableWrapper.restoreState === 'function') {
            tableWrapper.restoreState();
        }
        
        const expandedRowIds = this.expandedRowsStates[tabId] || [];
        if (expandedRowIds.length > 0) {
            console.log(`Restoring ${expandedRowIds.length} expanded rows for ${tabId}`);
            
            setTimeout(() => {
                const rows = tableWrapper.table.getRows();
                rows.forEach(row => {
                    const data = row.getData();
                    const rowId = tableWrapper.generateRowId ? tableWrapper.generateRowId(data) : JSON.stringify(data);
                    
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
        
        if (this.scrollPositions[tabId]) {
            setTimeout(() => {
                const tableHolder = tableWrapper.table.element.querySelector('.tabulator-tableHolder');
                if (tableHolder) {
                    tableHolder.scrollTop = this.scrollPositions[tabId];
                }
            }, 300);
        }
    }

    createTabStructure(tableElement) {
        if (tableElement && !tableElement.parentElement.classList.contains('table-wrapper')) {
            var wrapper = document.createElement('div');
            wrapper.className = 'table-wrapper';
            wrapper.style.cssText = 'display: flex; flex-direction: column; align-items: center; width: 100%; margin: 0 auto;';
            
            var tabsContainer = document.createElement('div');
            tabsContainer.className = 'tabs-container';
            tabsContainer.innerHTML = `
                <div class="tab-buttons">
                    <button class="tab-button active" data-tab="table0">Matchups</button>
                    <button class="tab-button" data-tab="table1">Batter Prop Clearances</button>
                    <button class="tab-button" data-tab="table2">Batter Prop Clearances (Alt. View)</button>
                    <button class="tab-button" data-tab="table3">Pitcher Prop Clearances</button>
                    <button class="tab-button" data-tab="table4">Pitcher Prop Clearances (Alt. View)</button>
                    <button class="tab-button" data-tab="table5">Model Projected Batter Stats</button>
                    <button class="tab-button" data-tab="table6">Model Projected Pitcher Stats</button>
                    <button class="tab-button" data-tab="table7">Batter Props</button>
                    <button class="tab-button" data-tab="table8">Pitcher Props</button>
                    <button class="tab-button" data-tab="table9">Game Props</button>
                </div>
            `;
            
            // Create table containers wrapper
            var tablesContainer = document.createElement('div');
            tablesContainer.className = 'tables-container';
            tablesContainer.style.cssText = 'width: 100%; position: relative; min-height: 500px;';
            
            // Create containers for all tables
            for (let i = 0; i <= 9; i++) {
                var container = document.createElement('div');
                container.className = i === 0 ? 'table-container active-table' : 'table-container inactive-table';
                container.id = `table${i}-container`;
                container.style.cssText = i === 0 ? 'width: 100%; display: block;' : 'width: 100%; display: none;';
                tablesContainer.appendChild(container);
            }
            
            wrapper.appendChild(tabsContainer);
            wrapper.appendChild(tablesContainer);
            
            return wrapper;
        }
        return null;
    }
}

