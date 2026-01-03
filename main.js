// main.js - Basketball Props Table System
// COMPLETE SYSTEM WITH PROPER DOM CREATION AND TABMANAGER INTEGRATION
// Based exactly on working baseball repository pattern

import { injectStyles } from './styles/tableStyles.js';
import { BasketPlayerPropClearancesTable } from './tables/basketPlayerPropClearances.js';
import { BasketPlayerDDTDTable } from './tables/basketPlayerDDTD.js';
import { BasketPlayerDKTable } from './tables/basketPlayerDK.js';
import { BasketPlayerFDTable } from './tables/basketPlayerFD.js';
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
        
        console.log("✅ Basketball table system initialized successfully!");
        
    } catch (error) {
        console.error("❌ Error initializing basketball table system:", error);
        console.log("Falling back to basic table functionality...");
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
            <button class="tab-button" data-tab="table2">DraftKings DFS</button>
            <button class="tab-button" data-tab="table3">FanDuel DFS</button>
        </div>
    `;
    
    // Create tables container that will hold all table divs
    const tablesContainer = document.createElement('div');
    tablesContainer.className = 'tables-container';
    tablesContainer.style.cssText = 'width: 100%; position: relative;';
    
    // Build the main structure FIRST (before inserting into DOM)
    tabWrapper.appendChild(tabsContainer);
    tabWrapper.appendChild(tablesContainer);
    
    // Insert into DOM - insert before the existing element
    if (existingTable && existingTable.parentElement) {
        existingTable.parentElement.insertBefore(tabWrapper, existingTable);
        existingTable.style.display = 'none'; // Hide original element but keep it
    } else {
        document.body.appendChild(tabWrapper);
    }
    
    // Create all individual table containers and elements
    createAllTableContainers(tablesContainer);
    
    console.log("✅ Complete DOM structure created");
}

function createAllTableContainers(tablesContainer) {
    console.log("Creating all table containers...");
    
    // Table 0 - Prop Clearances (Active by default)
    const propClearancesElement = document.createElement('div');
    propClearancesElement.id = 'prop-clearances-table';
    const table0Container = document.createElement('div');
    table0Container.className = 'table-container active-table';
    table0Container.id = 'table0-container';
    table0Container.style.cssText = 'width: 100%; display: block;';
    table0Container.appendChild(propClearancesElement);
    tablesContainer.appendChild(table0Container);
    console.log("✅ Created table0-container (Prop Clearances)");
    
    // Table 1 - DD-TD Clearances (Inactive)
    const ddtdElement = document.createElement('div');
    ddtdElement.id = 'ddtd-clearances-table';
    const table1Container = document.createElement('div');
    table1Container.className = 'table-container inactive-table';
    table1Container.id = 'table1-container';
    table1Container.style.cssText = 'width: 100%; display: none;';
    table1Container.appendChild(ddtdElement);
    tablesContainer.appendChild(table1Container);
    console.log("✅ Created table1-container (DD-TD Clearances)");
    
    // Table 2 - DraftKings DFS (Inactive)
    const dkElement = document.createElement('div');
    dkElement.id = 'dk-dfs-table';
    const table2Container = document.createElement('div');
    table2Container.className = 'table-container inactive-table';
    table2Container.id = 'table2-container';
    table2Container.style.cssText = 'width: 100%; display: none;';
    table2Container.appendChild(dkElement);
    tablesContainer.appendChild(table2Container);
    console.log("✅ Created table2-container (DraftKings DFS)");
    
    // Table 3 - FanDuel DFS (Inactive)
    const fdElement = document.createElement('div');
    fdElement.id = 'fd-dfs-table';
    const table3Container = document.createElement('div');
    table3Container.className = 'table-container inactive-table';
    table3Container.id = 'table3-container';
    table3Container.style.cssText = 'width: 100%; display: none;';
    table3Container.appendChild(fdElement);
    tablesContainer.appendChild(table3Container);
    console.log("✅ Created table3-container (FanDuel DFS)");
    
    console.log("✅ All table containers created");
}

function createAllTableInstances() {
    console.log("Creating all table instances (with lazy loading)...");
    
    // Create table instances but DON'T initialize them yet - TabManager handles lazy loading
    const tableInstances = {
        table0: new BasketPlayerPropClearancesTable("#prop-clearances-table"),
        table1: new BasketPlayerDDTDTable("#ddtd-clearances-table"),
        table2: new BasketPlayerDKTable("#dk-dfs-table"),
        table3: new BasketPlayerFDTable("#fd-dfs-table")
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
        console.log(`✅ Table initialized: ${instance.elementId}`);
    };
    
    // Ensure saveState exists
    if (!instance.saveState) {
        instance.saveState = function() {
            if (instance.table) {
                instance._savedFilters = instance.table.getHeaderFilters();
                instance._savedSort = instance.table.getSorters();
            }
        };
    }
    
    // Ensure restoreState exists
    if (!instance.restoreState) {
        instance.restoreState = function() {
            if (instance.table && instance._savedFilters) {
                instance._savedFilters.forEach(filter => {
                    try {
                        instance.table.setHeaderFilterValue(filter.field, filter.value);
                    } catch (e) {
                        console.warn("Could not restore filter:", filter.field);
                    }
                });
            }
            if (instance.table && instance._savedSort && instance._savedSort.length > 0) {
                try {
                    instance.table.setSort(instance._savedSort);
                } catch (e) {
                    console.warn("Could not restore sort");
                }
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

// Handle window resize
window.addEventListener('resize', debounce(function() {
    if (window.tabManager) {
        const activeTable = window.tabManager.getActiveTable();
        if (activeTable && activeTable.table) {
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
