// main.js - Basketball Props Table System
// Entry point that initializes multiple tables with tab navigation
// Dynamically creates tab UI and table containers inside the Webflow container

import { injectStyles } from './styles/tableStyles.js';
import { BasketPlayerPropClearancesTable } from './tables/basketPlayerPropClearances.js';
import { BasketPlayerDDTDTable } from './tables/basketPlayerDDTD.js';
import { TabManager, TAB_STYLES } from './components/tabManager.js';

// Global state for expanded rows
window.globalExpandedState = window.globalExpandedState || new Map();

// Tab configuration - defines all tabs in order
// Set enabled: false for placeholder tabs not yet implemented
const TAB_CONFIG = [
    {
        id: 'table0',
        label: 'Prop Clearances',
        tableClass: BasketPlayerPropClearancesTable,
        enabled: true
    },
    {
        id: 'table1',
        label: 'Coming Soon',
        tableClass: null,  // Placeholder - no table class yet
        enabled: false     // Disabled placeholder
    },
    {
        id: 'table2',
        label: 'DD-TD Clearances',
        tableClass: BasketPlayerDDTDTable,
        enabled: true
    }
];

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM loaded - initializing basketball table system with tabs");
    
    // Inject styles first
    injectStyles();
    injectTabStyles();
    
    // Initialize global state management
    initializeGlobalState();
    
    // Find the main container element
    const mainContainer = document.getElementById('basketball-table');
    if (!mainContainer) {
        console.error("No #basketball-table element found - cannot initialize");
        return;
    }
    
    console.log("Found main container: #basketball-table");
    
    // Build the tab UI and table containers dynamically
    const { tablesWrapper, tables } = buildTabStructure(mainContainer);
    
    // Initialize TabManager with the table instances
    const tabManager = new TabManager(tables);
    
    // Store references globally for debugging
    window.basketballTables = tables;
    window.tabManager = tabManager;
    
    // Setup debug tools
    setupDebugTools(tabManager, tables);
    
    console.log("✅ Basketball table system initialized with tabs!");
});

/**
 * Build the tab structure dynamically inside the container
 * Creates: tab buttons + table containers for each configured tab
 */
function buildTabStructure(container) {
    // Clear any existing content
    container.innerHTML = '';
    
    // Create wrapper div
    const wrapper = document.createElement('div');
    wrapper.className = 'basketball-tables-wrapper';
    wrapper.style.cssText = 'width: 100%;';
    
    // Create tab buttons container
    const tabButtonsContainer = document.createElement('div');
    tabButtonsContainer.className = 'tab-buttons';
    
    // Create tab buttons for each enabled tab
    const enabledTabs = TAB_CONFIG.filter(tab => tab.enabled);
    enabledTabs.forEach((tab, index) => {
        const button = document.createElement('button');
        button.className = 'tab-button' + (index === 0 ? ' active' : '');
        button.setAttribute('data-tab', tab.id);
        button.textContent = tab.label;
        tabButtonsContainer.appendChild(button);
    });
    
    wrapper.appendChild(tabButtonsContainer);
    
    // Create table containers
    const tables = {};
    
    enabledTabs.forEach((tab, index) => {
        // Create container div
        const tableContainer = document.createElement('div');
        tableContainer.id = `${tab.id}-container`;
        tableContainer.className = 'table-container' + (index === 0 ? ' active-table' : '');
        tableContainer.style.display = index === 0 ? 'block' : 'none';
        
        // Create the actual table div inside the container
        const tableDiv = document.createElement('div');
        tableDiv.id = tab.id;
        tableContainer.appendChild(tableDiv);
        
        wrapper.appendChild(tableContainer);
        
        // Create table instance (but don't initialize yet - TabManager handles lazy init)
        if (tab.tableClass) {
            const tableInstance = new tab.tableClass(`#${tab.id}`);
            tableInstance.isInitialized = false;
            tables[tab.id] = tableInstance;
        }
    });
    
    container.appendChild(wrapper);
    
    console.log(`Built tab structure with ${enabledTabs.length} tabs`);
    
    return { tablesWrapper: wrapper, tables };
}

/**
 * Inject tab-specific styles
 */
function injectTabStyles() {
    if (document.querySelector('style[data-tab-styles]')) {
        return; // Already injected
    }
    
    const style = document.createElement('style');
    style.setAttribute('data-tab-styles', 'true');
    style.textContent = TAB_STYLES;
    document.head.appendChild(style);
    
    console.log("Tab styles injected");
}

/**
 * Initialize global state management
 */
function initializeGlobalState() {
    if (!window.globalExpandedState) {
        window.globalExpandedState = new Map();
    }
    
    window.saveExpandedState = function(tableId, rowId, expanded) {
        const key = `${tableId}_${rowId}`;
        if (expanded) {
            window.globalExpandedState.set(key, true);
        } else {
            window.globalExpandedState.delete(key);
        }
    };
    
    window.getExpandedState = function(tableId, rowId) {
        const key = `${tableId}_${rowId}`;
        return window.globalExpandedState.get(key) || false;
    };
    
    window.clearExpandedState = function() {
        window.globalExpandedState.clear();
        console.log("Cleared global expanded state");
    };
    
    console.log("Global state management initialized");
}

/**
 * Setup debug tools accessible via console
 */
function setupDebugTools(tabManager, tables) {
    window.tableDebug = {
        // Get current active table
        getActiveTable: function() {
            return tabManager.getActiveTable();
        },
        
        // Get specific table by ID
        getTable: function(tableId) {
            if (tableId) {
                return tables[tableId];
            }
            return tabManager.getActiveTable();
        },
        
        // Get all tables
        getAllTables: function() {
            return tables;
        },
        
        // Get TabManager instance
        getTabManager: function() {
            return tabManager;
        },
        
        // Get global expanded state
        getGlobalState: function() {
            return window.globalExpandedState;
        },
        
        // Clear global state
        clearGlobalState: function() {
            window.globalExpandedState.clear();
            console.log("Global state cleared");
        },
        
        // Get expanded rows for active table
        getExpandedRows: function() {
            const activeTable = tabManager.getActiveTable();
            if (activeTable && activeTable.expandedRowsCache) {
                return Array.from(activeTable.expandedRowsCache);
            }
            return [];
        },
        
        // Refresh current tab's data
        refreshData: function() {
            return tabManager.refreshCurrentTab();
        },
        
        // Redraw active table
        redraw: function(force = false) {
            const activeTable = tabManager.getActiveTable();
            if (activeTable && activeTable.table) {
                return activeTable.table.redraw(force);
            }
        },
        
        // Get filters for active table
        getFilters: function() {
            const activeTable = tabManager.getActiveTable();
            if (activeTable && activeTable.table) {
                return activeTable.table.getHeaderFilters();
            }
            return [];
        },
        
        // Clear filters on active table
        clearFilters: function() {
            tabManager.clearCurrentFilters();
            console.log("Filters cleared");
        },
        
        // Get data from active table
        getData: function() {
            const activeTable = tabManager.getActiveTable();
            if (activeTable && activeTable.table) {
                return activeTable.table.getData();
            }
            return [];
        },
        
        // Get row count from active table
        getRowCount: function() {
            const activeTable = tabManager.getActiveTable();
            if (activeTable && activeTable.table) {
                return activeTable.table.getDataCount();
            }
            return 0;
        },
        
        // Switch to a specific tab
        switchTab: function(tabId) {
            tabManager.switchTab(tabId);
        },
        
        // Get current tab ID
        getCurrentTab: function() {
            return tabManager.currentActiveTab;
        },
        
        // List all tab IDs
        listTabs: function() {
            return Object.keys(tables);
        }
    };
    
    console.log("Debug tools available via window.tableDebug");
    console.log("  - getActiveTable(), getTable(id), getAllTables()");
    console.log("  - switchTab(id), getCurrentTab(), listTabs()");
    console.log("  - refreshData(), redraw(), getFilters(), clearFilters()");
}

// Handle window resize - redraw active table and reapply scaling
window.addEventListener('resize', debounce(function() {
    if (window.tabManager) {
        const activeTable = window.tabManager.getActiveTable();
        if (activeTable && activeTable.table) {
            console.log("Window resized - redrawing active table");
            activeTable.table.redraw(true);
            
            // Reapply desktop scaling if needed
            if (window.innerWidth > 1024) {
                if (activeTable.applyDesktopScaling) {
                    activeTable.applyDesktopScaling();
                }
                if (activeTable.equalizeClusteredColumns) {
                    activeTable.equalizeClusteredColumns();
                }
                if (activeTable.expandNameColumnToFill) {
                    activeTable.expandNameColumnToFill();
                }
            }
        }
    }
}, 250));

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Global error handler
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
});

// Export for module usage
export { buildTabStructure, initializeGlobalState, TAB_CONFIG };
