// main.js - COMPLETE SYSTEM WITH PROPER DOM CREATION AND TABMANAGER INTEGRATION
import { injectStyles } from './styles/tableStyles.js';
import { MatchupsTable } from './tables/combinedMatchupsTable.js';
import { BatterClearancesTable } from './tables/batterClearancesTable.js';
import { BatterClearancesAltTable } from './tables/batterClearancesAltTable.js';
import { PitcherClearancesTable } from './tables/pitcherClearancesTable.js';
import { PitcherClearancesAltTable } from './tables/pitcherClearancesAltTable.js';
import { ModBatterStatsTable } from './tables/modBatterStats.js';
import { ModPitcherStatsTable } from './tables/modPitcherStats.js';
import { BatterPropsTable } from './tables/batterProps.js';
import { PitcherPropsTable } from './tables/pitcherProps.js';
import { GamePropsTable } from './tables/gameProps.js';
import { TabManager } from './components/tabManager.js';

// Global state for expanded rows - shared across all tables
window.globalExpandedState = window.globalExpandedState || new Map();

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM loaded - initializing complete enhanced table system with DOM creation");
    
    // Inject styles first
    injectStyles();
    
    // Initialize global state management
    initializeGlobalState();
    
    // Find the existing batter-table element or create structure
    const existingBatterTable = document.getElementById('batter-table');
    if (!existingBatterTable) {
        console.log("No batter-table element found - cannot proceed with table initialization");
        return;
    }

    console.log("Found existing batter-table element, creating complete structure...");

    try {
        // Create the complete DOM structure
        createCompleteTableStructure(existingBatterTable);
        
        // Create all table instances but don't initialize them yet (lazy loading)
        console.log("Creating table instances...");
        const tableInstances = createAllTableInstances();
        
        // Initialize TabManager with all table instances
        console.log("Initializing TabManager with all tables...");
        const tabManager = new TabManager(tableInstances);
        window.tabManager = tabManager;
        
        // Setup matchups table specific integration
        setupMatchupsTableIntegration(tableInstances.table0, tabManager);
        
        console.log("✅ Complete enhanced table system initialized successfully!");
        
    } catch (error) {
        console.error("❌ Error initializing complete table system:", error);
        console.log("Falling back to basic table functionality...");
        // Fallback - just initialize the batter clearances table
        try {
            const fallbackTable = new BatterClearancesTable('#batter-table');
            fallbackTable.initialize();
            console.log("Fallback table initialized");
        } catch (fallbackError) {
            console.error("Even fallback failed:", fallbackError);
        }
    }
});

function createCompleteTableStructure(existingBatterTable) {
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
            <button class="tab-button active" data-tab="table0">Matchups</button>
            <button class="tab-button" data-tab="table1">Batter Prop Clearances</button>
            <button class="tab-button" data-tab="table2">Batter Prop Clearances (Alt. View)</button>
            <button class="tab-button" data-tab="table3">Pitcher Prop Clearances</button>
            <button class="tab-button" data-tab="table4">Pitcher Prop Clearances (Alt. View)</button>
            <button class="tab-button" data-tab="table5">Batter Stats</button>
            <button class="tab-button" data-tab="table6">Pitcher Stats</button>
            <button class="tab-button" data-tab="table7">Batter Props</button>
            <button class="tab-button" data-tab="table8">Pitcher Props</button>
            <button class="tab-button" data-tab="table9">Game Props</button>
        </div>
    `;
    
    // Create tables container that will hold all table divs
    const tablesContainer = document.createElement('div');
    tablesContainer.className = 'tables-container';
    tablesContainer.style.cssText = 'width: 100%; position: relative;';
    
    // Build the main structure
    tabWrapper.appendChild(tabsContainer);
    tabWrapper.appendChild(tablesContainer);
    
    // Insert into DOM - replace the existing batter-table element
    if (existingBatterTable && existingBatterTable.parentElement) {
        existingBatterTable.parentElement.insertBefore(tabWrapper, existingBatterTable);
        existingBatterTable.style.display = 'none'; // Hide original element but keep it for cloning
    } else {
        document.body.appendChild(tabWrapper);
    }
    
    // Create all individual table containers and elements
    createAllTableContainers(tablesContainer, existingBatterTable);
    
    console.log("✅ Complete DOM structure created");
}

function createAllTableContainers(tablesContainer, existingBatterTable) {
    console.log("Creating all table containers...");
    
    // Table 0 - Matchups (Active by default)
    const matchupsElement = document.createElement('div');
    matchupsElement.id = 'matchups-table';
    const table0Container = document.createElement('div');
    table0Container.className = 'table-container active-table';
    table0Container.id = 'table0-container';
    table0Container.style.cssText = 'width: 100%; display: block;';
    table0Container.appendChild(matchupsElement);
    tablesContainer.appendChild(table0Container);
    
    // Table 1 - Batter Clearances (Clone existing element)
    const table1Container = document.createElement('div');
    table1Container.className = 'table-container inactive-table';
    table1Container.id = 'table1-container';
    table1Container.style.cssText = 'width: 100%; display: none;';
    if (existingBatterTable) {
        const batterTableClone = existingBatterTable.cloneNode(true);
        batterTableClone.style.display = '';
        table1Container.appendChild(batterTableClone);
    } else {
        const batterElement = document.createElement('div');
        batterElement.id = 'batter-table';
        table1Container.appendChild(batterElement);
    }
    tablesContainer.appendChild(table1Container);
    
    // Table 2 - Batter Clearances Alt
    const batterAltElement = document.createElement('div');
    batterAltElement.id = 'batter-table-alt';
    const table2Container = document.createElement('div');
    table2Container.className = 'table-container inactive-table';
    table2Container.id = 'table2-container';
    table2Container.style.cssText = 'width: 100%; display: none;';
    table2Container.appendChild(batterAltElement);
    tablesContainer.appendChild(table2Container);
    
    // Table 3 - Pitcher Clearances
    const pitcherElement = document.createElement('div');
    pitcherElement.id = 'pitcher-table';
    const table3Container = document.createElement('div');
    table3Container.className = 'table-container inactive-table';
    table3Container.id = 'table3-container';
    table3Container.style.cssText = 'width: 100%; display: none;';
    table3Container.appendChild(pitcherElement);
    tablesContainer.appendChild(table3Container);
    
    // Table 4 - Pitcher Clearances Alt
    const pitcherAltElement = document.createElement('div');
    pitcherAltElement.id = 'pitcher-table-alt';
    const table4Container = document.createElement('div');
    table4Container.className = 'table-container inactive-table';
    table4Container.id = 'table4-container';
    table4Container.style.cssText = 'width: 100%; display: none;';
    table4Container.appendChild(pitcherAltElement);
    tablesContainer.appendChild(table4Container);
    
    // Table 5 - Mod Batter Stats
    const modBatterStatsElement = document.createElement('div');
    modBatterStatsElement.id = 'mod-batter-stats-table';
    const table5Container = document.createElement('div');
    table5Container.className = 'table-container inactive-table';
    table5Container.id = 'table5-container';
    table5Container.style.cssText = 'width: 100%; display: none;';
    table5Container.appendChild(modBatterStatsElement);
    tablesContainer.appendChild(table5Container);
    
    // Table 6 - Mod Pitcher Stats
    const modPitcherStatsElement = document.createElement('div');
    modPitcherStatsElement.id = 'mod-pitcher-stats-table';
    const table6Container = document.createElement('div');
    table6Container.className = 'table-container inactive-table';
    table6Container.id = 'table6-container';
    table6Container.style.cssText = 'width: 100%; display: none;';
    table6Container.appendChild(modPitcherStatsElement);
    tablesContainer.appendChild(table6Container);
    
    // Table 7 - Batter Props
    const batterPropsElement = document.createElement('div');
    batterPropsElement.id = 'batter-props-table';
    const table7Container = document.createElement('div');
    table7Container.className = 'table-container inactive-table';
    table7Container.id = 'table7-container';
    table7Container.style.cssText = 'width: 100%; display: none;';
    table7Container.appendChild(batterPropsElement);
    tablesContainer.appendChild(table7Container);
    
    // Table 8 - Pitcher Props
    const pitcherPropsElement = document.createElement('div');
    pitcherPropsElement.id = 'pitcher-props-table';
    const table8Container = document.createElement('div');
    table8Container.className = 'table-container inactive-table';
    table8Container.id = 'table8-container';
    table8Container.style.cssText = 'width: 100%; display: none;';
    table8Container.appendChild(pitcherPropsElement);
    tablesContainer.appendChild(table8Container);
    
    // Table 9 - Game Props
    const gamePropsElement = document.createElement('div');
    gamePropsElement.id = 'game-props-table';
    const table9Container = document.createElement('div');
    table9Container.className = 'table-container inactive-table';
    table9Container.id = 'table9-container';
    table9Container.style.cssText = 'width: 100%; display: none;';
    table9Container.appendChild(gamePropsElement);
    tablesContainer.appendChild(table9Container);
    
    console.log("✅ All table containers created");
}

function createAllTableInstances() {
    console.log("Creating all table instances (with lazy loading)...");
    
    // Create table instances but DON'T initialize them yet - TabManager handles lazy loading
    const tableInstances = {
        table0: new MatchupsTable("#matchups-table"),
        table1: new BatterClearancesTable("#batter-table"), 
        table2: new BatterClearancesAltTable("#batter-table-alt"),
        table3: new PitcherClearancesTable("#pitcher-table"),
        table4: new PitcherClearancesAltTable("#pitcher-table-alt"),
        table5: new ModBatterStatsTable("#mod-batter-stats-table"),
        table6: new ModPitcherStatsTable("#mod-pitcher-stats-table"),
        table7: new BatterPropsTable("#batter-props-table"),
        table8: new PitcherPropsTable("#pitcher-props-table"),
        table9: new GamePropsTable("#game-props-table")
    };
    
    // Enhance each table instance with state management
    Object.keys(tableInstances).forEach(key => {
        const instance = tableInstances[key];
        if (instance) {
            enhanceTableInstance(instance);
            console.log(`✅ Enhanced table instance: ${key} (${instance.elementId})`);
        } else {
            console.log(`⚠️  Failed to create table instance: ${key}`);
        }
    });
    
    console.log("✅ All table instances created and enhanced");
    return tableInstances;
}

function setupMatchupsTableIntegration(matchupsTable, tabManager) {
    if (!matchupsTable || !tabManager) {
        console.log("⚠️  Cannot setup matchups integration - missing table or tabManager");
        return;
    }
    
    console.log("Setting up enhanced matchups table integration...");
    
    // No additional setup needed - TabManager handles everything through the standard interface
    // The matchupsTable already has all the proper state management methods from enhanceTableInstance
    
    console.log("✅ Matchups table integration complete");
}

function initializeGlobalState() {
    // Initialize global expanded state if it doesn't exist
    if (!window.globalExpandedState) {
        window.globalExpandedState = new Map();
        console.log("Initialized global expanded state");
    }
    
    // Initialize global state management functions
    window.getGlobalExpandedState = function() {
        return window.globalExpandedState;
    };
    
    window.setGlobalExpandedState = function(state) {
        window.globalExpandedState = state;
    };
    
    window.clearGlobalExpandedState = function() {
        window.globalExpandedState.clear();
        console.log("Cleared global expanded state");
    };
}

function enhanceTableInstance(tableInstance) {
    if (!tableInstance) return;
    
    console.log(`Enhancing table instance: ${tableInstance.elementId}`);
    
    // Ensure global state access methods exist
    if (!tableInstance.getGlobalState) {
        tableInstance.getGlobalState = function() {
            if (!window.globalExpandedState) {
                window.globalExpandedState = new Map();
            }
            return window.globalExpandedState;
        };
    }
    
    if (!tableInstance.setGlobalState) {
        tableInstance.setGlobalState = function(state) {
            window.globalExpandedState = state;
        };
    }
    
    // Initialize state management properties if they don't exist
    if (!tableInstance.expandedRowsCache) {
        tableInstance.expandedRowsCache = new Set();
    }
    
    if (!tableInstance.expandedRowsSet) {
        tableInstance.expandedRowsSet = new Set();
    }
    
    if (!tableInstance.expandedRowsMetadata) {
        tableInstance.expandedRowsMetadata = new Map();
    }
    
    if (!tableInstance.temporaryExpandedRows) {
        tableInstance.temporaryExpandedRows = new Set();
    }
    
    if (!tableInstance.lastScrollPosition) {
        tableInstance.lastScrollPosition = 0;
    }
    
    // Store original redraw method
    const originalRedraw = tableInstance.redraw ? 
        tableInstance.redraw.bind(tableInstance) : null;
    
    // Override redraw to preserve expanded state
    tableInstance.redraw = function(force) {
        // Save current expanded state before redraw
        const expandedRows = new Set();
        if (this.table) {
            const rows = this.table.getRows();
            rows.forEach(row => {
                const data = row.getData();
                if (data._expanded) {
                    const id = this.generateRowId ? this.generateRowId(data) : JSON.stringify(data);
                    expandedRows.add(id);
                }
            });
        }
        
        // Call original redraw if it exists
        if (originalRedraw) {
            originalRedraw(force);
        } else if (this.table) {
            this.table.redraw(force);
        }
        
        // Restore expanded state after redraw
        if (expandedRows.size > 0 && this.table) {
            setTimeout(() => {
                const rows = this.table.getRows();
                rows.forEach(row => {
                    const data = row.getData();
                    const id = this.generateRowId ? this.generateRowId(data) : JSON.stringify(data);
                    if (expandedRows.has(id) && !data._expanded) {
                        data._expanded = true;
                        row.update(data);
                        row.reformat();
                    }
                });
            }, 100);
        }
    };
    
    // Enhanced saveState
    if (!tableInstance.saveState || typeof tableInstance.saveState !== 'function') {
        tableInstance.saveState = function() {
            if (!this.table) return;
            
            console.log(`Saving state for ${this.elementId}`);
            
            // Save scroll position
            const tableHolder = this.table.element.querySelector('.tabulator-tableHolder');
            if (tableHolder) {
                this.lastScrollPosition = tableHolder.scrollTop;
            }
            
            // Initialize caches if they don't exist
            if (!this.expandedRowsCache) this.expandedRowsCache = new Set();
            if (!this.expandedRowsSet) this.expandedRowsSet = new Set();
            if (!this.expandedRowsMetadata) this.expandedRowsMetadata = new Map();
            
            // Clear and rebuild expanded rows cache
            this.expandedRowsCache.clear();
            this.expandedRowsSet.clear();
            
            const rows = this.table.getRows();
            rows.forEach(row => {
                const data = row.getData();
                if (data._expanded) {
                    const id = this.generateRowId ? this.generateRowId(data) : JSON.stringify(data);
                    this.expandedRowsCache.add(id);
                    this.expandedRowsSet.add(id);
                }
            });
            
            console.log(`State saved: ${this.expandedRowsCache.size} expanded rows`);
        };
    }
    
    // Enhanced restoreState
    if (!tableInstance.restoreState || typeof tableInstance.restoreState !== 'function') {
        tableInstance.restoreState = function() {
            if (!this.table) return;
            
            console.log(`Restoring state for ${this.elementId}`);
            
            // Restore scroll position
            if (this.lastScrollPosition) {
                const tableHolder = this.table.element.querySelector('.tabulator-tableHolder');
                if (tableHolder) {
                    tableHolder.scrollTop = this.lastScrollPosition;
                }
            }
            
            // Restore expanded rows if cache exists
            if (this.expandedRowsCache && this.expandedRowsCache.size > 0) {
                console.log(`Restoring ${this.expandedRowsCache.size} expanded rows`);
                
                const rows = this.table.getRows();
                rows.forEach(row => {
                    const data = row.getData();
                    const id = this.generateRowId ? this.generateRowId(data) : JSON.stringify(data);
                    
                    if (this.expandedRowsCache.has(id)) {
                        if (!data._expanded) {
                            data._expanded = true;
                            row.update(data);
                            
                            setTimeout(() => {
                                row.reformat();
                                
                                // Update expander icon for supported tables
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
                            }, 100);
                        }
                    }
                });
            }
        };
    }
    
    // Add saveTemporaryExpandedState if not exists
    if (!tableInstance.saveTemporaryExpandedState) {
        tableInstance.saveTemporaryExpandedState = function() {
            this.temporaryExpandedRows.clear();
            if (this.table) {
                const rows = this.table.getRows();
                rows.forEach(row => {
                    const data = row.getData();
                    if (data._expanded) {
                        const id = this.generateRowId ? this.generateRowId(data) : JSON.stringify(data);
                        this.temporaryExpandedRows.add(id);
                    }
                });
            }
            console.log(`Temporarily saved ${this.temporaryExpandedRows.size} expanded rows for ${this.elementId}`);
        };
    }
    
    // Add restoreTemporaryExpandedState if not exists
    if (!tableInstance.restoreTemporaryExpandedState) {
        tableInstance.restoreTemporaryExpandedState = function() {
            if (this.temporaryExpandedRows.size > 0 && this.table) {
                console.log(`Restoring ${this.temporaryExpandedRows.size} temporarily expanded rows for ${this.elementId}`);
                
                setTimeout(() => {
                    const rows = this.table.getRows();
                    rows.forEach(row => {
                        const data = row.getData();
                        const id = this.generateRowId ? this.generateRowId(data) : JSON.stringify(data);
                        
                        if (this.temporaryExpandedRows.has(id) && !data._expanded) {
                            data._expanded = true;
                            row.update(data);
                            row.reformat();
                        }
                    });
                }, 100);
            }
        };
    }
    
    // Add generateRowId if not exists
    if (!tableInstance.generateRowId) {
        tableInstance.generateRowId = function(data) {
            const fields = [];
            
            // Matchups table ID generation
            if (data["Matchup Game ID"] !== undefined) {
                return `matchup_${data["Matchup Game ID"]}`;
            }
            
            // Batter table ID generation
            if (data["Batter Name"]) {
                fields.push(data["Batter Name"]);
                if (data["Batter Team"]) fields.push(data["Batter Team"]);
                if (data["Batter Prop Type"]) fields.push(data["Batter Prop Type"]);
                if (data["Batter Prop Value"]) fields.push(data["Batter Prop Value"]);
                if (data["Batter Prop Split ID"]) fields.push(data["Batter Prop Split ID"]);
                if (data["Batter Stat Type"]) fields.push(data["Batter Stat Type"]);
                return `batter_${fields.join('_')}`;
            }
            
            // Pitcher table ID generation
            if (data["Pitcher Name"]) {
                fields.push(data["Pitcher Name"]);
                if (data["Pitcher Team"]) fields.push(data["Pitcher Team"]);
                if (data["Pitcher Prop Type"]) fields.push(data["Pitcher Prop Type"]);
                if (data["Pitcher Prop Value"]) fields.push(data["Pitcher Prop Value"]);
                if (data["Pitcher Prop Split ID"]) fields.push(data["Pitcher Prop Split ID"]);
                if (data["Pitcher Stat Type"]) fields.push(data["Pitcher Stat Type"]);
                return `pitcher_${fields.join('_')}`;
            }
            
            // Fallback ID generation
            const keys = Object.keys(data).filter(k => !k.startsWith('_') && data[k] != null);
            return keys.slice(0, 5).map(k => `${k}:${data[k]}`).join('|');
        };
    }
    
    console.log(`✅ Enhanced table instance: ${tableInstance.elementId} with complete state management`);
}

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global error in table system:', e.error);
});

// Handle window resize
window.addEventListener('resize', function() {
    if (window.tabManager && window.tabManager.tables) {
        Object.values(window.tabManager.tables).forEach(table => {
            if (table && table.table) {
                table.table.redraw();
            }
        });
    }
});

// Preload data for next likely tab (predictive loading)
window.addEventListener('mouseover', function(e) {
    if (e.target.classList.contains('tab-button')) {
        const tabId = e.target.dataset.tab;
        const tabManager = window.tabManager;
        
        if (tabManager && !tabManager.tabInitialized[tabId]) {
            console.log(`Pre-warming tab: ${tabId}`);
            // Pre-fetch data but don't fully initialize
            const table = tabManager.tables[tabId];
            if (table && table.endpoint && !table.dataLoaded) {
                // This will trigger the data fetch and caching
                table.getBaseConfig();
            }
        }
    }
});

// Export for debugging
window.tableDebug = {
    getGlobalState: () => window.globalExpandedState,
    clearGlobalState: () => {
        window.globalExpandedState.clear();
        console.log("Global state cleared");
    },
    logState: () => {
        console.log("Current global state:", Array.from(window.globalExpandedState.entries()));
    },
    getTables: () => window.tabManager ? window.tabManager.tables : null,
    getTabManager: () => window.tabManager
};

console.log("✅ Complete enhanced table system with matchups fixes and full DOM creation loaded successfully");
