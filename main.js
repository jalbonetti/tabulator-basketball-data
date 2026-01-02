// main.js - Basketball Props Table System
// COMPLETE SYSTEM WITH PROPER DOM CREATION AND TABMANAGER INTEGRATION
// Based on working baseball repository pattern

import { injectStyles } from './styles/tableStyles.js';
import { BasketPlayerPropClearancesTable } from './tables/basketPlayerPropClearances.js';
import { BasketPlayerDDTDTable } from './tables/basketPlayerDDTD.js';
import { TabManager } from './components/tabManager.js';

// Global state for expanded rows - shared across all tables
window.globalExpandedState = window.globalExpandedState || new Map();

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM loaded - initializing basketball table system with tabs");
    
    // Inject styles first
    injectStyles();
    
    // Initialize global state management
    initializeGlobalState();
    
    // Find the existing basketball-table element
    const existingTable = document.getElementById('basketball-table');
    if (!existingTable) {
        console.log("No basketball-table element found - cannot proceed with table initialization");
        return;
    }

    console.log("Found existing basketball-table element, creating complete structure...");

    try {
        // Create the complete DOM structure
        createCompleteTableStructure(existingTable);
        
        // Create all table instances but don't initialize them yet (lazy loading)
        console.log("Creating table instances...");
        const tableInstances = createAllTableInstances();
        
        // Initialize TabManager with all table instances
        console.log("Initializing TabManager with all tables...");
        const tabManager = new TabManager(tableInstances);
        window.tabManager = tabManager;
        
        // Store references globally for debugging
        window.basketballTables = tableInstances;
        
        // Setup debug tools
        setupDebugTools(tabManager, tableInstances);
        
        console.log("✅ Basketball table system initialized successfully!");
        
    } catch (error) {
        console.error("❌ Error initializing basketball table system:", error);
        console.log("Falling back to basic table functionality...");
        // Fallback - just initialize the prop clearances table
        try {
            const fallbackTable = new BasketPlayerPropClearancesTable('#basketball-table');
            fallbackTable.initialize();
            console.log("Fallback table initialized");
        } catch (fallbackError) {
            console.error("Even fallback failed:", fallbackError);
        }
    }
});

function createCompleteTableStructure(existingTable) {
    console.log("Creating complete DOM structure...");
    
    // Create main wrapper
    const tabWrapper = document.createElement('div');
    tabWrapper.className = 'table-wrapper';
    tabWrapper.style.cssText = 'display: flex; flex-direction: column; align-items: center; width: 100%; margin: 0 auto;';
    
    // Create tabs container with all tab buttons
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'tabs-container';
    tabsContainer.innerHTML = `
        <div class="tab-buttons">
            <button class="tab-button active" data-tab="table0">Prop Clearances</button>
            <button class="tab-button" data-tab="table1">DD-TD Clearances</button>
        </div>
    `;
    
    // Create table containers wrapper
    const tablesContainer = document.createElement('div');
    tablesContainer.className = 'tables-container';
    tablesContainer.style.cssText = 'width: 100%; position: relative; min-height: 500px;';
    
    // Table 0 - Prop Clearances (active by default)
    const table0Container = document.createElement('div');
    table0Container.className = 'table-container active-table';
    table0Container.id = 'table0-container';
    table0Container.style.cssText = 'width: 100%; display: block;';
    
    // Create the table element for prop clearances
    const propClearancesElement = document.createElement('div');
    propClearancesElement.id = 'prop-clearances-table';
    table0Container.appendChild(propClearancesElement);
    tablesContainer.appendChild(table0Container);
    
    // Table 1 - DD-TD Clearances (inactive)
    const ddtdElement = document.createElement('div');
    ddtdElement.id = 'ddtd-clearances-table';
    const table1Container = document.createElement('div');
    table1Container.className = 'table-container inactive-table';
    table1Container.id = 'table1-container';
    table1Container.style.cssText = 'width: 100%; display: none;';
    table1Container.appendChild(ddtdElement);
    tablesContainer.appendChild(table1Container);
    
    // Insert the wrapper before the existing table, then remove the original
    existingTable.parentNode.insertBefore(tabWrapper, existingTable);
    tabWrapper.appendChild(tabsContainer);
    tabWrapper.appendChild(tablesContainer);
    
    // Remove the original table element (we've created new containers)
    existingTable.remove();
    
    console.log("✅ DOM structure created with tab containers");
}

function createAllTableInstances() {
    console.log("Creating all table instances (with lazy loading)...");
    
    // Create table instances but DON'T initialize them yet - TabManager handles lazy loading
    const tableInstances = {
        table0: new BasketPlayerPropClearancesTable("#prop-clearances-table"),
        table1: new BasketPlayerDDTDTable("#ddtd-clearances-table")
    };
    
    // Enhance each table instance with state management
    Object.keys(tableInstances).forEach(key => {
        const instance = tableInstances[key];
        if (instance) {
            enhanceTableInstance(instance);
            console.log(`✅ Enhanced table instance: ${key} (${instance.elementId})`);
        } else {
            console.log(`⚠️ Failed to create table instance: ${key}`);
        }
    });
    
    console.log("✅ All table instances created and enhanced");
    return tableInstances;
}

function enhanceTableInstance(instance) {
    // Add isInitialized flag if not present
    if (instance.isInitialized === undefined) {
        instance.isInitialized = false;
    }
    
    // Wrap the initialize method to set the flag
    const originalInitialize = instance.initialize.bind(instance);
    instance.initialize = function() {
        console.log(`Initializing table: ${instance.elementId}`);
        originalInitialize();
        instance.isInitialized = true;
        console.log(`Table initialized: ${instance.elementId}`);
    };
    
    // Ensure saveState and restoreState exist
    if (!instance.saveState) {
        instance.saveState = function() {
            if (instance.table) {
                instance._savedFilters = instance.table.getHeaderFilters();
                instance._savedSort = instance.table.getSorters();
            }
        };
    }
    
    if (!instance.restoreState) {
        instance.restoreState = function() {
            if (instance.table && instance._savedFilters) {
                instance._savedFilters.forEach(filter => {
                    instance.table.setHeaderFilterValue(filter.field, filter.value);
                });
            }
            if (instance.table && instance._savedSort && instance._savedSort.length > 0) {
                instance.table.setSort(instance._savedSort);
            }
        };
    }
    
    // Ensure generateRowId exists
    if (!instance.generateRowId) {
        instance.generateRowId = function(data) {
            return `${data["Player Name"] || ''}_${data["Player Team"] || ''}_${data["Player Prop"] || ''}_${data["Split"] || ''}`;
        };
    }
}

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

function setupDebugTools(tabManager, tables) {
    window.tableDebug = {
        getActiveTable: function() {
            return tabManager.getActiveTable();
        },
        getTable: function(tableId) {
            if (tableId) {
                return tables[tableId];
            }
            return tabManager.getActiveTable();
        },
        getAllTables: function() {
            return tables;
        },
        getTabManager: function() {
            return tabManager;
        },
        getGlobalState: function() {
            return window.globalExpandedState;
        },
        clearGlobalState: function() {
            window.globalExpandedState.clear();
            console.log("Global state cleared");
        },
        getExpandedRows: function() {
            const activeTable = tabManager.getActiveTable();
            if (activeTable && activeTable.expandedRowsCache) {
                return Array.from(activeTable.expandedRowsCache);
            }
            return [];
        },
        refreshData: function() {
            return tabManager.refreshCurrentTab();
        },
        redraw: function(force = false) {
            const activeTable = tabManager.getActiveTable();
            if (activeTable && activeTable.table) {
                return activeTable.table.redraw(force);
            }
        },
        getFilters: function() {
            const activeTable = tabManager.getActiveTable();
            if (activeTable && activeTable.table) {
                return activeTable.table.getHeaderFilters();
            }
            return [];
        },
        clearFilters: function() {
            tabManager.clearCurrentFilters();
            console.log("Filters cleared");
        },
        getData: function() {
            const activeTable = tabManager.getActiveTable();
            if (activeTable && activeTable.table) {
                return activeTable.table.getData();
            }
            return [];
        },
        getRowCount: function() {
            const activeTable = tabManager.getActiveTable();
            if (activeTable && activeTable.table) {
                return activeTable.table.getDataCount();
            }
            return 0;
        },
        switchTab: function(tabId) {
            tabManager.switchTab(tabId);
        },
        getCurrentTab: function() {
            return tabManager.currentActiveTab;
        },
        listTabs: function() {
            return Object.keys(tables);
        }
    };
    
    console.log("Debug tools available via window.tableDebug");
}

// Handle window resize
window.addEventListener('resize', debounce(function() {
    if (window.tabManager) {
        const activeTable = window.tabManager.getActiveTable();
        if (activeTable && activeTable.table) {
            console.log("Window resized - redrawing active table");
            activeTable.table.redraw(true);
            
            if (window.innerWidth > 1024) {
                if (activeTable.equalizeClusteredColumns) {
                    setTimeout(() => activeTable.equalizeClusteredColumns(), 100);
                }
                if (activeTable.expandNameColumnToFill) {
                    setTimeout(() => activeTable.expandNameColumnToFill(), 150);
                }
            }
        }
    }
}, 250));

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

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
});
