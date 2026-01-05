// tables/basketPlayerPropOdds.js - Basketball Player Prop Odds Table
// Simple flat table with no expandable rows or grouped headers
// UPDATED: Left-justified with content-based width, scanDataForMaxWidths for proper column sizing
// FIXED: Desktop container width reset on tab switch - prevents grey/blue space

import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { createMinMaxFilter, minMaxFilterFunction } from '../components/minMaxFilter.js';
import { isMobile, isTablet } from '../shared/config.js';

export class BasketPlayerPropOddsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'BasketPlayerPropOdds');
    }

    initialize() {
        const mobile = isMobile();
        const tablet = isTablet();
        const isSmallScreen = mobile || tablet;
        
        // Get base config and override specific settings
        const baseConfig = this.getBaseConfig();
        
        const config = {
            ...baseConfig,
            virtualDom: true,
            virtualDomBuffer: 500,
            renderVertical: "virtual",
            renderHorizontal: "basic", // Use "basic" for compatibility with fitData layout
            pagination: false,
            paginationSize: false,
            layoutColumnsOnNewData: false,
            responsiveLayout: false,
            maxHeight: "600px",
            height: "600px",
            placeholder: "Loading player prop odds...",
            
            // fitData: columns size to content only (not full width)
            layout: "fitData",
            
            columns: this.getColumns(isSmallScreen),
            initialSort: [
                {column: "Player Name", dir: "asc"}
            ],
            dataLoaded: (data) => {
                console.log(`Player Prop Odds table loaded ${data.length} records successfully`);
                this.dataLoaded = true;
                
                if (data.length > 0) {
                    console.log('DEBUG - Player Prop Odds First row sample:', {
                        'Player Name': data[0]["Player Name"],
                        'Player Prop Type': data[0]["Player Prop Type"],
                        'Player Prop Odds': data[0]["Player Prop Odds"]
                    });
                }
                
                const element = document.querySelector(this.elementId);
                if (element) {
                    const loadingDiv = element.querySelector('.loading-indicator');
                    if (loadingDiv) {
                        loadingDiv.remove();
                    }
                }
            },
            ajaxError: (error) => {
                console.error("Error loading Player Prop Odds data:", error);
            }
        };

        this.table = new Tabulator(this.elementId, config);
        
        this.table.on("tableBuilt", () => {
            console.log("Player Prop Odds table built successfully");
            setTimeout(() => {
                const rowCount = this.table.getDataCount();
                console.log(`Player Prop Odds Table has ${rowCount} rows loaded`);
                
                if (rowCount > 0) {
                    const data = this.table.getData();
                    this.scanDataForMaxWidths(data);
                    this.equalizeClusteredColumns();
                    this.calculateAndApplyWidths();
                } else {
                    console.log('No data yet, width calculation deferred');
                }
            }, 200);
            
            window.addEventListener('resize', this.debounce(() => {
                if (this.table && this.table.getDataCount() > 0) {
                    this.equalizeClusteredColumns();
                    this.calculateAndApplyWidths();
                }
            }, 250));
        });
        
        this.table.on("dataLoaded", () => {
            setTimeout(() => {
                console.log("Player Prop Odds Data loaded event, recalculating widths...");
                const data = this.table.getData();
                this.scanDataForMaxWidths(data);
                this.equalizeClusteredColumns();
                this.calculateAndApplyWidths();
            }, 100);
        });
    }
    
    // Backward compatibility alias for main.js resize handler and TabManager
    expandNameColumnToFill() {
        this.forceRecalculateWidths();
    }
    
    // Simple debounce helper
    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
    
    // Equalize column widths within each cluster
    equalizeClusteredColumns() {
        if (!this.table) return;
        
        // Define clusters for odds columns
        const clusters = {
            'cluster-odds': ['Player Prop Odds', 'Player Median Odds', 'Player Best Odds']
        };
        
        Object.keys(clusters).forEach(clusterName => {
            const fields = clusters[clusterName];
            let maxWidth = 0;
            
            fields.forEach(field => {
                const column = this.table.getColumn(field);
                if (column) {
                    const width = column.getWidth();
                    if (width > maxWidth) {
                        maxWidth = width;
                    }
                }
            });
            
            if (maxWidth > 0) {
                fields.forEach(field => {
                    const column = this.table.getColumn(field);
                    if (column) {
                        column.setWidth(maxWidth);
                    }
                });
                console.log(`Player Prop Odds Cluster ${clusterName}: equalized to ${maxWidth}px`);
            }
        });
    }
    
    // Calculate and apply widths based on content
    calculateAndApplyWidths() {
        if (!this.table) {
            console.log('calculateAndApplyWidths: table not ready');
            return;
        }
        
        const tableElement = this.table.element;
        if (!tableElement) {
            console.log('calculateAndApplyWidths: tableElement not ready');
            return;
        }
        
        // DESKTOP FIX: Reset explicit widths before recalculating to allow proper shrinking
        // This fixes the grey/blue space issue when switching tabs
        if (!isMobile() && !isTablet()) {
            // Reset outer element widths to allow recalculation
            tableElement.style.width = 'auto';
            tableElement.style.minWidth = 'auto';
            tableElement.style.maxWidth = 'none';
            
            // Reset internal Tabulator elements that may have cached widths
            const tableHolder = tableElement.querySelector('.tabulator-tableholder');
            if (tableHolder) {
                tableHolder.style.width = 'auto';
                tableHolder.style.maxWidth = 'none';
            }
            
            const tabulatorHeader = tableElement.querySelector('.tabulator-header');
            if (tabulatorHeader) {
                tabulatorHeader.style.width = 'auto';
            }
            
            const tabulatorTable = tableElement.querySelector('.tabulator-table');
            if (tabulatorTable) {
                tabulatorTable.style.width = 'auto';
            }
            
            // CRITICAL: Force a browser reflow so layout recalculates before we read widths
            void tableElement.offsetWidth;
        }
        
        try {
            const columns = this.table.getColumns();
            let totalColumnWidth = 0;
            
            columns.forEach(col => {
                const width = col.getWidth();
                totalColumnWidth += width;
            });
            
            console.log(`Player Prop Odds Width calculation: Total columns=${totalColumnWidth}px`);
            
            const SCROLLBAR_WIDTH = 17;
            const totalWidthWithScrollbar = totalColumnWidth + SCROLLBAR_WIDTH;
            
            // Store the calculated width for persistence across tab switches
            this._calculatedTableWidth = totalWidthWithScrollbar;
            
            tableElement.style.width = totalWidthWithScrollbar + 'px';
            tableElement.style.minWidth = totalWidthWithScrollbar + 'px';
            tableElement.style.maxWidth = totalWidthWithScrollbar + 'px';
            
            // CRITICAL FIX: Also constrain internal Tabulator elements to prevent grey space
            // BUT ONLY ON DESKTOP - mobile needs tableholder to remain unconstrained for horizontal scroll
            if (!isMobile() && !isTablet()) {
                const tableHolder = tableElement.querySelector('.tabulator-tableholder');
                if (tableHolder) {
                    tableHolder.style.width = totalWidthWithScrollbar + 'px';
                    tableHolder.style.maxWidth = totalWidthWithScrollbar + 'px';
                }
                
                const tabulatorHeader = tableElement.querySelector('.tabulator-header');
                if (tabulatorHeader) {
                    tabulatorHeader.style.width = totalWidthWithScrollbar + 'px';
                }
            }
            
            const tableContainer = tableElement.closest('.table-container');
            if (tableContainer) {
                tableContainer.style.width = 'fit-content';
                tableContainer.style.minWidth = 'auto';
                tableContainer.style.maxWidth = 'none';
            }
            
            console.log(`Player Prop Odds Set table width to ${totalWidthWithScrollbar}px (columns: ${totalColumnWidth}px + scrollbar: ${SCROLLBAR_WIDTH}px)`);
            
        } catch (error) {
            console.error('Error in calculateAndApplyWidths:', error);
        }
    }
    
    // Force width recalculation - called by TabManager on tab switch
    forceRecalculateWidths() {
        console.log('Player Prop Odds forceRecalculateWidths called');
        const data = this.table ? this.table.getData() : [];
        if (data.length > 0) {
            this.scanDataForMaxWidths(data);
            this.equalizeClusteredColumns();
            this.calculateAndApplyWidths();
        }
    }

    // Scan ALL data to find max widths needed for text columns
    scanDataForMaxWidths(data) {
        if (!data || data.length === 0 || !this.table) return;
        
        console.log(`Player Prop Odds Scanning ${data.length} rows for max column widths...`);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = '500 12px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        
        const maxWidths = {
            "Player Name": 0,
            "Player Matchup": 0,
            "Player Team": 0,
            "Player Prop Type": 0,
            "Player Over/Under": 0,
            "Player Book": 0,
            "Player Best Odds Books": 0
        };
        
        data.forEach(row => {
            Object.keys(maxWidths).forEach(field => {
                const value = row[field];
                if (value !== null && value !== undefined && value !== '') {
                    const textWidth = ctx.measureText(String(value)).width;
                    if (textWidth > maxWidths[field]) {
                        maxWidths[field] = textWidth;
                    }
                }
            });
        });
        
        const CELL_PADDING = 16;
        const BUFFER = 10;
        
        Object.keys(maxWidths).forEach(field => {
            if (maxWidths[field] > 0) {
                const column = this.table.getColumn(field);
                if (column) {
                    const requiredWidth = maxWidths[field] + CELL_PADDING + BUFFER;
                    const currentWidth = column.getWidth();
                    
                    if (requiredWidth > currentWidth) {
                        column.setWidth(Math.ceil(requiredWidth));
                        console.log(`Player Prop Odds Expanded ${field} from ${currentWidth}px to ${Math.ceil(requiredWidth)}px (text: ${Math.ceil(maxWidths[field])}px)`);
                    }
                }
            }
        });
        
        console.log('Player Prop Odds Max width scan complete');
    }

    // Custom sorter for odds with +/- prefix
    oddsSorter(a, b, aRow, bRow, column, dir, sorterParams) {
        const getOddsNum = (val) => {
            if (val === null || val === undefined || val === '' || val === '-') return -99999;
            const str = String(val).trim();
            
            if (str.startsWith('+')) {
                const parsed = parseInt(str.substring(1), 10);
                return isNaN(parsed) ? -99999 : parsed;
            } else if (str.startsWith('-')) {
                const parsed = parseInt(str, 10);
                return isNaN(parsed) ? -99999 : parsed;
            }
            
            const num = parseInt(str, 10);
            return isNaN(num) ? -99999 : num;
        };
        
        const aNum = getOddsNum(a);
        const bNum = getOddsNum(b);
        
        return aNum - bNum;
    }

    getColumns(isSmallScreen = false) {
        const self = this;
        
        // Odds formatter - handles +/- prefixes for display
        const oddsFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '' || value === '-') return '-';
            const num = parseInt(value, 10);
            if (isNaN(num)) return '-';
            return num > 0 ? `+${num}` : `${num}`;
        };

        // Line formatter - always show 1 decimal place
        const lineFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const num = parseFloat(value);
            if (isNaN(num)) return '-';
            return num.toFixed(1);
        };

        return [
            {
                title: "Name", 
                field: "Player Name", 
                frozen: true,
                widthGrow: 0,
                minWidth: 120,
                sorter: "string", 
                headerFilter: true,
                resizable: false,
                hozAlign: "left"
            },
            {
                title: "Matchup", 
                field: "Player Matchup", 
                widthGrow: 0,
                minWidth: 80,
                sorter: "string",
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center"
            },
            {
                title: "Team", 
                field: "Player Team", 
                widthGrow: 0,
                minWidth: 45,
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center"
            },
            {
                title: "Prop", 
                field: "Player Prop Type", 
                widthGrow: 0,
                minWidth: 60,
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center"
            },
            {
                title: "O/U", 
                field: "Player Over/Under", 
                widthGrow: 0,
                minWidth: 50,
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center"
            },
            {
                title: "Line", 
                field: "Player Prop Line", 
                widthGrow: 0,
                minWidth: 50,
                sorter: "number", 
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center",
                formatter: lineFormatter
            },
            {
                title: "Book", 
                field: "Player Book", 
                widthGrow: 0,
                minWidth: 60,
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center"
            },
            {
                title: "Book Odds", 
                field: "Player Prop Odds", 
                widthGrow: 0,
                minWidth: 55,
                sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                    return self.oddsSorter(a, b, aRow, bRow, column, dir, sorterParams);
                },
                headerFilter: createMinMaxFilter,
                headerFilterFunc: minMaxFilterFunction,
                headerFilterLiveFilter: false,
                resizable: false,
                formatter: oddsFormatter,
                hozAlign: "center",
                cssClass: "cluster-odds"
            },
            {
                title: "Median Odds", 
                field: "Player Median Odds", 
                widthGrow: 0,
                minWidth: 55,
                sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                    return self.oddsSorter(a, b, aRow, bRow, column, dir, sorterParams);
                },
                headerFilter: createMinMaxFilter,
                headerFilterFunc: minMaxFilterFunction,
                headerFilterLiveFilter: false,
                resizable: false,
                formatter: oddsFormatter,
                hozAlign: "center",
                cssClass: "cluster-odds"
            },
            {
                title: "Best Odds", 
                field: "Player Best Odds", 
                widthGrow: 0,
                minWidth: 55,
                sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                    return self.oddsSorter(a, b, aRow, bRow, column, dir, sorterParams);
                },
                headerFilter: createMinMaxFilter,
                headerFilterFunc: minMaxFilterFunction,
                headerFilterLiveFilter: false,
                resizable: false,
                formatter: oddsFormatter,
                hozAlign: "center",
                cssClass: "cluster-odds"
            },
            {
                title: "Best Books", 
                field: "Player Best Odds Books", 
                widthGrow: 0,
                minWidth: 70,
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center"
            }
        ];
    }
}
