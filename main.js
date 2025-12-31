// main.js - Basketball Props Table System
// Entry point that initializes the table and manages global state

import { injectStyles } from './styles/tableStyles.js';
import { BasketPlayerPropClearancesTable } from './tables/basketPlayerPropClearances.js';

// Global state for expanded rows
window.globalExpandedState = window.globalExpandedState || new Map();

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM loaded - initializing basketball table system");
    
    // Inject styles first
    injectStyles();
    
    // Initialize global state management
    initializeGlobalState();
    
    // Find the table element
    const tableElement = document.getElementById('basketball-table');
    if (!tableElement) {
        console.log("No basketball-table element found - looking for alternate IDs...");
        // Try alternate element IDs
        const altElement = document.getElementById('player-props-table') || 
                          document.getElementById('clearances-table') ||
                          document.getElementById('batter-table'); // fallback to existing ID if reusing
        
        if (!altElement) {
            console.error("No table element found - cannot initialize");
            return;
        }
        
        console.log("Found alternate table element:", altElement.id);
        initializeTable('#' + altElement.id);
    } else {
        initializeTable('#basketball-table');
    }
});

function initializeTable(elementId) {
    try {
        console.log("Initializing basketball clearances table...");
        
        const table = new BasketPlayerPropClearancesTable(elementId);
        table.initialize();
        
        // Store reference globally for debugging
        window.basketballTable = table;
        
        // Setup debug tools
        setupDebugTools(table);
        
        console.log("✅ Basketball table initialized successfully!");
        
    } catch (error) {
        console.error("❌ Error initializing basketball table:", error);
    }
}

function initializeGlobalState() {
    // Ensure global state exists
    if (!window.globalExpandedState) {
        window.globalExpandedState = new Map();
    }
    
    // Add state persistence helpers
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

function setupDebugTools(tableInstance) {
    // Setup debug tools accessible via console
    window.tableDebug = {
        getTable: function() {
            return tableInstance.table;
        },
        getTableInstance: function() {
            return tableInstance;
        },
        getGlobalState: function() {
            return window.globalExpandedState;
        },
        clearGlobalState: function() {
            window.globalExpandedState.clear();
            console.log("Global state cleared");
        },
        getExpandedRows: function() {
            return Array.from(tableInstance.expandedRowsCache);
        },
        refreshData: function() {
            return tableInstance.refreshData();
        },
        redraw: function(force = false) {
            return tableInstance.redraw(force);
        },
        getFilters: function() {
            if (tableInstance.table) {
                return tableInstance.table.getHeaderFilters();
            }
            return [];
        },
        clearFilters: function() {
            if (tableInstance.table) {
                tableInstance.table.clearHeaderFilter();
                console.log("Filters cleared");
            }
        },
        getData: function() {
            if (tableInstance.table) {
                return tableInstance.table.getData();
            }
            return [];
        },
        getRowCount: function() {
            if (tableInstance.table) {
                return tableInstance.table.getDataCount();
            }
            return 0;
        }
    };
    
    console.log("Debug tools available via window.tableDebug");
}

// Handle window resize - redraw table and reapply scaling
window.addEventListener('resize', debounce(function() {
    if (window.basketballTable && window.basketballTable.table) {
        console.log("Window resized - redrawing table");
        window.basketballTable.table.redraw(true);
        
        // Reapply desktop scaling if needed
        if (window.innerWidth > 1024) {
            window.basketballTable.applyDesktopScaling && 
            window.basketballTable.applyDesktopScaling();
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
export { initializeTable, initializeGlobalState };
