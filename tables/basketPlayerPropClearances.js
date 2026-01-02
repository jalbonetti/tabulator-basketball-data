// tables/basketPlayerPropClearances.js - Basketball Player Prop Clearances (UPDATED)
// Changes: 
// - Removed "Player Info" combined header - Name and Team are now standalone columns
// - Name column is frozen on mobile/tablet, fills remaining space on desktop
// - All columns except Name auto-fit to content width
// - All headers are center-justified (via CSS)
// - Desktop text scaling to fit browser width
// - Clustered column widths for visual consistency
// - Abbreviations for Prop, Split, and Lineup values
// - Renamed headers: Prop Rank (Average), Season Prop Rank, Med
// - Split moved under Clearance section
// - Best Odds truncated; book names shown in new subtable
// - Subtables contract to fit data

import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { createMinMaxFilter, minMaxFilterFunction } from '../components/minMaxFilter.js';
import { isMobile, isTablet } from '../shared/config.js';

export class BasketPlayerPropClearancesTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'BasketPlayerPropClearances');
    }

    initialize() {
        const mobile = isMobile();
        const tablet = isTablet();
        const isSmallScreen = mobile || tablet;
        
        const config = {
            ...this.tableConfig,
            // Optimize for large datasets
            virtualDom: true,
            virtualDomBuffer: 500,
            renderVertical: "virtual",
            renderHorizontal: "virtual",
            pagination: false,
            paginationSize: false,
            layoutColumnsOnNewData: false,
            responsiveLayout: false,
            maxHeight: "600px",
            height: "600px",
            placeholder: "Loading basketball player prop clearances...",
            
            // CRITICAL: Use fitDataStretch to auto-fit columns, Name fills remaining space on desktop
            layout: isSmallScreen ? "fitDataFill" : "fitDataStretch",
            
            columns: this.getColumns(isSmallScreen),
            initialSort: [
                {column: "Player Name", dir: "asc"},
                {column: "Player Team", dir: "asc"},
                {column: "Player Prop", dir: "asc"},
                {column: "Player Prop Value", dir: "asc"}
            ],
            rowFormatter: this.createRowFormatter(),
            dataLoaded: (data) => {
                console.log(`Basketball table loaded ${data.length} records successfully`);
                this.dataLoaded = true;
                
                data.forEach(row => {
                    if (row._expanded === undefined) {
                        row._expanded = false;
                    }
                });
                
                const element = document.querySelector(this.elementId);
                if (element) {
                    const loadingDiv = element.querySelector('.loading-indicator');
                    if (loadingDiv) {
                        loadingDiv.remove();
                    }
                }
            },
            ajaxError: (error) => {
                console.error("Error loading basketball data:", error);
            }
        };

        this.table = new Tabulator(this.elementId, config);
        this.setupRowExpansion();
        
        this.table.on("tableBuilt", () => {
            console.log("Basketball Player Prop Clearances table built successfully");
            // Apply desktop scaling if needed
            if (!isSmallScreen) {
                this.applyDesktopScaling();
            }
        });
    }
    
    // Apply scaling to fit table in browser width on desktop
    applyDesktopScaling() {
        const tableElement = document.querySelector(this.elementId);
        if (!tableElement) return;
        
        const tabulatorElement = tableElement.querySelector('.tabulator');
        if (!tabulatorElement) return;
        
        // Check if table is wider than container
        const containerWidth = tableElement.offsetWidth;
        const tableWidth = tabulatorElement.scrollWidth;
        
        if (tableWidth > containerWidth) {
            // Calculate scale factor
            const scaleFactor = Math.max(0.75, containerWidth / tableWidth);
            
            // Apply font size scaling
            const baseFontSize = 13;
            const scaledFontSize = Math.floor(baseFontSize * scaleFactor);
            
            tabulatorElement.style.fontSize = `${scaledFontSize}px`;
            
            // Force redraw
            if (this.table) {
                this.table.redraw(true);
            }
            
            console.log(`Applied desktop scaling: ${scaleFactor.toFixed(2)}, font size: ${scaledFontSize}px`);
        }
    }

    // Custom sorter for "X/Y" format - sorts by FULL first number (15 > 9, not 1 > 9)
    gamesPlayedSorter(a, b, aRow, bRow, column, dir, sorterParams) {
        const getFirstNum = (val) => {
            if (!val || val === '-') return -1;
            const str = String(val).trim();
            const match = str.match(/^(\d+)/);
            if (match) {
                return parseInt(match[1], 10);
            }
            if (str.includes('/')) {
                const firstPart = str.split('/')[0].trim();
                const num = parseInt(firstPart, 10);
                return isNaN(num) ? -1 : num;
            }
            const num = parseInt(str, 10);
            return isNaN(num) ? -1 : num;
        };
        return getFirstNum(a) - getFirstNum(b);
    }

    // Custom sorter for "X (Y.Y)" format - sorts by first number (rank)
    rankWithValueSorter(a, b, aRow, bRow, column, dir, sorterParams) {
        const getFirstNum = (val) => {
            if (!val || val === '-') return 9999;
            const str = String(val).trim();
            const match = str.match(/^(\d+)/);
            if (match) {
                return parseInt(match[1], 10);
            }
            if (str.includes('(')) {
                const firstPart = str.split('(')[0].trim();
                const num = parseInt(firstPart, 10);
                return isNaN(num) ? 9999 : num;
            }
            const num = parseInt(str, 10);
            return isNaN(num) ? 9999 : num;
        };
        return getFirstNum(a) - getFirstNum(b);
    }

    // Custom sorter for odds that may include book names like "-110 (DraftKings)"
    oddsSorter(a, b, aRow, bRow, column, dir, sorterParams) {
        const getOddsNum = (val) => {
            if (!val || val === '-') return 0;
            const str = String(val).trim();
            const match = str.match(/^([+-]?\d+)/);
            if (match) {
                return parseInt(match[1], 10);
            }
            const numPart = str.split('(')[0].trim();
            const num = parseInt(numPart, 10);
            return isNaN(num) ? 0 : num;
        };
        return getOddsNum(a) - getOddsNum(b);
    }

    getColumns(isSmallScreen = false) {
        const self = this;
        
        // =====================================================
        // CLUSTERED WIDTH CONSTANTS
        // Columns in each cluster share the same width
        // =====================================================
        const CLUSTER_A_WIDTH = 55;  // % Over, Games
        const CLUSTER_B_WIDTH = 85;  // Prop Rank (Average), Season Prop Rank
        const CLUSTER_C_WIDTH = 45;  // Med, Avg, High, Low, Mode (Player Stats)
        const CLUSTER_D_WIDTH = 55;  // All 4 Odds columns (Median Over/Under, Best Over/Under)
        
        // =====================================================
        // FORMATTERS
        // =====================================================
        
        // Clearance formatter - ensures exactly ONE decimal place
        const clearanceFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            // Strip any existing % sign and parse the number
            const str = String(value).replace('%', '').trim();
            const num = parseFloat(str);
            if (isNaN(num)) return '-';
            return num.toFixed(1) + '%';
        };

        // One decimal formatter
        const oneDecimalFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const num = parseFloat(value);
            if (isNaN(num)) return '-';
            return num.toFixed(1);
        };

        // Prop formatter - abbreviates "3-Pointers" to "3-Pt"
        const propFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            let str = String(value);
            if (str === '3-Pointers') return '3-Pt';
            return str;
        };

        // Split formatter - abbreviates "Full Season" and "Last 30 Days"
        const splitFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            let str = String(value);
            if (str === 'Full Season') return 'Season';
            if (str === 'Last 30 Days') return 'L30 Days';
            return str;
        };

        // Lineup formatter - abbreviates "(Expected)" and "(Confirmed)"
        const lineupFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            let str = String(value);
            str = str.replace('(Expected)', '(Exp)');
            str = str.replace('(Confirmed)', '(Conf)');
            return str;
        };

        // Simple odds formatter for median odds (no book name)
        const simpleOddsFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const num = parseInt(value, 10);
            if (isNaN(num)) return '-';
            return num > 0 ? `+${num}` : `${num}`;
        };

        // Best odds formatter - TRUNCATED (removes book name, shows only numeric odds)
        const bestOddsFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const str = String(value).trim();
            
            // Extract just the numeric part (before any parenthesis)
            let numPart = str;
            if (str.includes('(')) {
                numPart = str.split('(')[0].trim();
            }
            
            const num = parseInt(numPart, 10);
            if (isNaN(num)) return '-';
            return num > 0 ? `+${num}` : `${num}`;
        };

        return [
            // =====================================================
            // NAME COLUMN - Standalone (no combined header)
            // Frozen on mobile/tablet, fills remaining space on desktop
            // On small screens: follows same sizing as other columns
            // =====================================================
            {
                title: "Name", 
                field: "Player Name", 
                frozen: isSmallScreen,
                widthGrow: isSmallScreen ? 0 : 1,
                minWidth: isSmallScreen ? 80 : 120,
                sorter: "string", 
                headerFilter: true,
                resizable: false,
                formatter: this.createNameFormatter(),
                hozAlign: "left"
            },
            
            // =====================================================
            // TEAM COLUMN - Standalone (no combined header)
            // Auto-fit to content (header first, then data)
            // =====================================================
            {
                title: "Team", 
                field: "Player Team", 
                widthGrow: 0,
                minWidth: 50,
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center"
            },
            
            // =====================================================
            // PROP INFO GROUP - Now only contains Prop and Line
            // (Split moved to Clearance section)
            // =====================================================
            {
                title: "Prop Info", 
                columns: [
                    {
                        title: "Prop", 
                        field: "Player Prop", 
                        widthGrow: 0,
                        minWidth: 60,
                        sorter: "string", 
                        headerFilter: createCustomMultiSelect,
                        resizable: false,
                        hozAlign: "center",
                        formatter: propFormatter
                    },
                    {
                        title: "Line", 
                        field: "Player Prop Value", 
                        widthGrow: 0,
                        minWidth: 45,
                        sorter: "number", 
                        headerFilter: createMinMaxFilter,
                        headerFilterFunc: minMaxFilterFunction,
                        headerFilterLiveFilter: false,
                        resizable: false,
                        hozAlign: "center"
                    }
                ]
            },

            // =====================================================
            // CLEARANCE DATA GROUP - Now includes Split
            // Cluster A: % Over and Games share same width
            // =====================================================
            {
                title: "Clearance", 
                columns: [
                    {
                        title: "% Over", 
                        field: "Player Clearance", 
                        widthGrow: 0,
                        minWidth: CLUSTER_A_WIDTH,
                        width: CLUSTER_A_WIDTH,
                        sorter: "number",
                        resizable: false,
                        formatter: clearanceFormatter,
                        hozAlign: "center"
                    },
                    {
                        title: "Games", 
                        field: "Player Games", 
                        widthGrow: 0,
                        minWidth: CLUSTER_A_WIDTH,
                        width: CLUSTER_A_WIDTH,
                        sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                            return self.gamesPlayedSorter(a, b, aRow, bRow, column, dir, sorterParams);
                        },
                        resizable: false,
                        hozAlign: "center"
                    },
                    {
                        title: "Split", 
                        field: "Split", 
                        widthGrow: 0,
                        minWidth: 65,
                        headerFilter: createCustomMultiSelect,
                        resizable: false,
                        hozAlign: "center",
                        formatter: splitFormatter
                    }
                ]
            },

            // =====================================================
            // OPPONENT GROUP - Renamed headers
            // Cluster B: Both rank columns share same width
            // =====================================================
            {
                title: "Opponent", 
                columns: [
                    {
                        title: "Prop Rank (Average)", 
                        field: "Opponent Prop Rank", 
                        widthGrow: 0,
                        minWidth: CLUSTER_B_WIDTH,
                        width: CLUSTER_B_WIDTH,
                        sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                            return self.rankWithValueSorter(a, b, aRow, bRow, column, dir, sorterParams);
                        },
                        resizable: false,
                        hozAlign: "center"
                    },
                    {
                        title: "Season Prop Rank", 
                        field: "Opponent Pace Rank", 
                        widthGrow: 0,
                        minWidth: CLUSTER_B_WIDTH,
                        width: CLUSTER_B_WIDTH,
                        sorter: "number",
                        resizable: false,
                        hozAlign: "center"
                    }
                ]
            },

            // =====================================================
            // LINEUP STATUS - Standalone column with abbreviations
            // =====================================================
            {
                title: "Lineup", 
                field: "Lineup Status", 
                widthGrow: 0,
                minWidth: 70,
                sorter: "string",
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center",
                formatter: lineupFormatter
            },

            // =====================================================
            // PLAYER STATS GROUP - "Median" renamed to "Med"
            // Cluster C: All 5 stats columns share same width
            // =====================================================
            {
                title: "Player Stats", 
                columns: [
                    {
                        title: "Med", 
                        field: "Player Prop Median", 
                        widthGrow: 0,
                        minWidth: CLUSTER_C_WIDTH,
                        width: CLUSTER_C_WIDTH,
                        sorter: "number",
                        resizable: false,
                        hozAlign: "center",
                        formatter: oneDecimalFormatter
                    },
                    {
                        title: "Avg", 
                        field: "Player Prop Average", 
                        widthGrow: 0,
                        minWidth: CLUSTER_C_WIDTH,
                        width: CLUSTER_C_WIDTH,
                        sorter: "number",
                        resizable: false,
                        hozAlign: "center",
                        formatter: oneDecimalFormatter
                    },
                    {
                        title: "High", 
                        field: "Player Prop High", 
                        widthGrow: 0,
                        minWidth: CLUSTER_C_WIDTH,
                        width: CLUSTER_C_WIDTH,
                        sorter: "number",
                        resizable: false,
                        hozAlign: "center"
                    },
                    {
                        title: "Low", 
                        field: "Player Prop Low", 
                        widthGrow: 0,
                        minWidth: CLUSTER_C_WIDTH,
                        width: CLUSTER_C_WIDTH,
                        sorter: "number",
                        resizable: false,
                        hozAlign: "center"
                    },
                    {
                        title: "Mode", 
                        field: "Player Prop Mode", 
                        widthGrow: 0,
                        minWidth: CLUSTER_C_WIDTH,
                        width: CLUSTER_C_WIDTH,
                        sorter: "number",
                        resizable: false,
                        hozAlign: "center"
                    }
                ]
            },

            // =====================================================
            // MEDIAN ODDS GROUP
            // Cluster D: All 4 odds columns share same width
            // =====================================================
            {
                title: "Median Odds", 
                columns: [
                    {
                        title: "Over", 
                        field: "Player Median Over Odds", 
                        widthGrow: 0,
                        minWidth: CLUSTER_D_WIDTH,
                        width: CLUSTER_D_WIDTH,
                        sorter: "number",
                        headerFilter: createMinMaxFilter,
                        headerFilterFunc: minMaxFilterFunction,
                        headerFilterLiveFilter: false,
                        resizable: false,
                        formatter: simpleOddsFormatter,
                        hozAlign: "center"
                    },
                    {
                        title: "Under", 
                        field: "Player Median Under Odds", 
                        widthGrow: 0,
                        minWidth: CLUSTER_D_WIDTH,
                        width: CLUSTER_D_WIDTH,
                        sorter: "number",
                        headerFilter: createMinMaxFilter,
                        headerFilterFunc: minMaxFilterFunction,
                        headerFilterLiveFilter: false,
                        resizable: false,
                        formatter: simpleOddsFormatter,
                        hozAlign: "center"
                    }
                ]
            },

            // =====================================================
            // BEST ODDS GROUP - Truncated (book names removed)
            // Book names now shown in expandable subtable
            // Cluster D: All 4 odds columns share same width
            // =====================================================
            {
                title: "Best Odds", 
                columns: [
                    {
                        title: "Over", 
                        field: "Player Best Over Odds", 
                        widthGrow: 0,
                        minWidth: CLUSTER_D_WIDTH,
                        width: CLUSTER_D_WIDTH,
                        sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                            return self.oddsSorter(a, b, aRow, bRow, column, dir, sorterParams);
                        },
                        headerFilter: createMinMaxFilter,
                        headerFilterFunc: minMaxFilterFunction,
                        headerFilterLiveFilter: false,
                        resizable: false,
                        formatter: bestOddsFormatter,
                        hozAlign: "center"
                    },
                    {
                        title: "Under", 
                        field: "Player Best Under Odds", 
                        widthGrow: 0,
                        minWidth: CLUSTER_D_WIDTH,
                        width: CLUSTER_D_WIDTH,
                        sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                            return self.oddsSorter(a, b, aRow, bRow, column, dir, sorterParams);
                        },
                        headerFilter: createMinMaxFilter,
                        headerFilterFunc: minMaxFilterFunction,
                        headerFilterLiveFilter: false,
                        resizable: false,
                        formatter: bestOddsFormatter,
                        hozAlign: "center"
                    }
                ]
            }
        ];
    }

    createRowFormatter() {
        const self = this;
        
        return (row) => {
            const data = row.getData();
            const rowElement = row.getElement();
            
            if (data._expanded === undefined) {
                data._expanded = false;
            }
            
            // Clear any existing subrows first
            const existingSubrows = rowElement.parentNode?.querySelectorAll('.subrow-container');
            existingSubrows?.forEach(sr => {
                if (sr.dataset.rowId === row.getPosition()) {
                    sr.remove();
                }
            });
            
            if (data._expanded) {
                self.createSubtable(row, data);
            }
        };
    }

    // Helper function to extract book name from odds string like "-110 (DraftKings)"
    extractBookName(oddsValue) {
        if (!oddsValue || oddsValue === '-') return '-';
        const str = String(oddsValue).trim();
        const match = str.match(/\(([^)]+)\)/);
        if (match && match[1]) {
            return match[1];
        }
        return '-';
    }

    createSubtable(row, data) {
        const rowElement = row.getElement();
        
        // Remove existing subtable if any
        const existingSubtable = rowElement.nextElementSibling;
        if (existingSubtable && existingSubtable.classList.contains('subrow-container')) {
            existingSubtable.remove();
        }
        
        // Create subtable container
        const subrowContainer = document.createElement('div');
        subrowContainer.className = 'subrow-container';
        subrowContainer.dataset.rowId = row.getPosition();
        subrowContainer.style.cssText = `
            padding: 15px 20px;
            background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
            border-top: 2px solid #f97316;
            margin: 0;
        `;
        
        // Build subtable content
        const matchup = data["Matchup"] || '-';
        const spread = data["Matchup Spread"] || '-';
        const total = data["Matchup Total"] || '-';
        const medianMinutes = data["Player Median Minutes"] || '-';
        const avgMinutes = data["Player Average Minutes"] || '-';
        
        // Extract book names from Best Odds columns
        const bestOverBook = this.extractBookName(data["Player Best Over Odds"]);
        const bestUnderBook = this.extractBookName(data["Player Best Under Odds"]);
        
        // Subtables now use inline-block and fit-content to contract to data size
        subrowContainer.innerHTML = `
            <div style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: flex-start;">
                <div style="background: white; padding: 12px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: inline-block; min-width: fit-content;">
                    <h4 style="margin: 0 0 8px 0; color: #f97316; font-size: 13px; font-weight: 600;">Matchup Details</h4>
                    <div style="font-size: 12px; color: #333;">
                        <div style="margin-bottom: 4px;"><strong>Game:</strong> ${matchup}</div>
                        <div style="margin-bottom: 4px;"><strong>Spread:</strong> ${spread}</div>
                        <div><strong>Total:</strong> ${total}</div>
                    </div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: inline-block; min-width: fit-content;">
                    <h4 style="margin: 0 0 8px 0; color: #f97316; font-size: 13px; font-weight: 600;">Minutes Data</h4>
                    <div style="font-size: 12px; color: #333;">
                        <div style="margin-bottom: 4px;"><strong>Median:</strong> ${medianMinutes}</div>
                        <div><strong>Average:</strong> ${avgMinutes}</div>
                    </div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: inline-block; min-width: fit-content;">
                    <h4 style="margin: 0 0 8px 0; color: #f97316; font-size: 13px; font-weight: 600;">Best Books</h4>
                    <div style="font-size: 12px; color: #333;">
                        <div style="margin-bottom: 4px;"><strong>Over:</strong> ${bestOverBook}</div>
                        <div><strong>Under:</strong> ${bestUnderBook}</div>
                    </div>
                </div>
            </div>
        `;
        
        // Insert after the row
        rowElement.insertAdjacentElement('afterend', subrowContainer);
    }
}
