// tables/basketPlayerPropClearances.js - Basketball Player Prop Clearances (UPDATED)
// Changes: 
// - Removed "Player Info" combined header - Name and Team are now standalone columns
// - Name column is frozen on mobile/tablet, fills remaining space on desktop
// - All columns except Name auto-fit to content width
// - All headers are center-justified
// - Desktop text scaling to fit browser width

import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { createMinMaxFilter, minMaxFilterFunction } from '../components/minMaxFilter.js';
import { CONFIG, isMobile, isTablet } from '../shared/config.js';

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
            
            // CRITICAL: Use fitDataStretch to auto-fit columns, Name fills remaining space
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
        
        // Clearance formatter - value is already a %, just display it directly
        const clearanceFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const str = String(value);
            if (str.includes('%')) return str;
            const num = parseFloat(value);
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

        // Odds formatter - adds + prefix for positive, shows full value including book name
        const oddsFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const str = String(value);
            
            if (str.includes('(')) {
                const parts = str.split('(');
                const numPart = parts[0].trim();
                const bookPart = '(' + parts[1];
                const num = parseInt(numPart, 10);
                if (isNaN(num)) return str;
                const formattedNum = num > 0 ? `+${num}` : `${num}`;
                return `${formattedNum} ${bookPart}`;
            }
            
            const num = parseInt(str, 10);
            if (isNaN(num)) return '-';
            return num > 0 ? `+${num}` : `${num}`;
        };

        // Simple odds formatter for median odds (no book name)
        const simpleOddsFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const num = parseInt(value, 10);
            if (isNaN(num)) return '-';
            return num > 0 ? `+${num}` : `${num}`;
        };

        return [
            // =====================================================
            // NAME COLUMN - Standalone (no combined header)
            // Frozen on mobile/tablet, fills remaining space on desktop
            // =====================================================
            {
                title: "Name", 
                field: "Player Name", 
                // On small screens: frozen and auto-width; On desktop: fills remaining space
                frozen: isSmallScreen,
                widthGrow: isSmallScreen ? 0 : 1,
                minWidth: isSmallScreen ? 100 : 120,
                sorter: "string", 
                headerFilter: true,
                resizable: false,
                formatter: this.createNameFormatter(),
                titleHozAlign: "center",
                hozAlign: "left"
            },
            
            // =====================================================
            // TEAM COLUMN - Standalone (no combined header)
            // Auto-fit to content
            // =====================================================
            {
                title: "Team", 
                field: "Player Team", 
                widthGrow: 0,
                minWidth: 50,
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                resizable: false,
                titleHozAlign: "center",
                hozAlign: "center"
            },
            
            // =====================================================
            // PROP INFO GROUP - Center justified headers
            // =====================================================
            {
                title: "Prop Info", 
                titleHozAlign: "center",
                columns: [
                    {
                        title: "Prop", 
                        field: "Player Prop", 
                        widthGrow: 0,
                        minWidth: 60,
                        sorter: "string", 
                        headerFilter: createCustomMultiSelect,
                        resizable: false,
                        titleHozAlign: "center",
                        hozAlign: "center"
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
                        titleHozAlign: "center",
                        hozAlign: "center"
                    },
                    {
                        title: "Split", 
                        field: "Split", 
                        widthGrow: 0,
                        minWidth: 50,
                        headerFilter: createCustomMultiSelect,
                        resizable: false,
                        titleHozAlign: "center",
                        hozAlign: "center"
                    }
                ]
            },

            // =====================================================
            // CLEARANCE DATA GROUP - Center justified headers
            // =====================================================
            {
                title: "Clearance", 
                titleHozAlign: "center",
                columns: [
                    {
                        title: "% Over", 
                        field: "Player Clearance", 
                        widthGrow: 0,
                        minWidth: 55,
                        sorter: "number",
                        resizable: false,
                        formatter: clearanceFormatter,
                        titleHozAlign: "center",
                        hozAlign: "center"
                    },
                    {
                        title: "Games", 
                        field: "Player Games", 
                        widthGrow: 0,
                        minWidth: 50,
                        sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                            return self.gamesPlayedSorter(a, b, aRow, bRow, column, dir, sorterParams);
                        },
                        resizable: false,
                        titleHozAlign: "center",
                        hozAlign: "center"
                    }
                ]
            },

            // =====================================================
            // OPPONENT GROUP - Center justified headers
            // =====================================================
            {
                title: "Opponent", 
                titleHozAlign: "center",
                columns: [
                    {
                        title: "Prop Rank", 
                        field: "Opponent Prop Rank", 
                        widthGrow: 0,
                        minWidth: 70,
                        sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                            return self.rankWithValueSorter(a, b, aRow, bRow, column, dir, sorterParams);
                        },
                        resizable: false,
                        titleHozAlign: "center",
                        hozAlign: "center"
                    },
                    {
                        title: "Pace Rank", 
                        field: "Opponent Pace Rank", 
                        widthGrow: 0,
                        minWidth: 70,
                        sorter: "number",
                        resizable: false,
                        titleHozAlign: "center",
                        hozAlign: "center"
                    }
                ]
            },

            // =====================================================
            // LINEUP STATUS - Standalone column, center justified
            // =====================================================
            {
                title: "Lineup", 
                field: "Lineup Status", 
                widthGrow: 0,
                minWidth: 70,
                sorter: "string",
                headerFilter: createCustomMultiSelect,
                resizable: false,
                titleHozAlign: "center",
                hozAlign: "center"
            },

            // =====================================================
            // PLAYER STATS GROUP - Center justified headers
            // =====================================================
            {
                title: "Player Stats", 
                titleHozAlign: "center",
                columns: [
                    {
                        title: "Median", 
                        field: "Player Prop Median", 
                        widthGrow: 0,
                        minWidth: 50,
                        sorter: "number",
                        resizable: false,
                        titleHozAlign: "center",
                        hozAlign: "center",
                        formatter: oneDecimalFormatter
                    },
                    {
                        title: "Avg", 
                        field: "Player Prop Average", 
                        widthGrow: 0,
                        minWidth: 40,
                        sorter: "number",
                        resizable: false,
                        titleHozAlign: "center",
                        hozAlign: "center",
                        formatter: oneDecimalFormatter
                    },
                    {
                        title: "High", 
                        field: "Player Prop High", 
                        widthGrow: 0,
                        minWidth: 40,
                        sorter: "number",
                        resizable: false,
                        titleHozAlign: "center",
                        hozAlign: "center"
                    },
                    {
                        title: "Low", 
                        field: "Player Prop Low", 
                        widthGrow: 0,
                        minWidth: 35,
                        sorter: "number",
                        resizable: false,
                        titleHozAlign: "center",
                        hozAlign: "center"
                    },
                    {
                        title: "Mode", 
                        field: "Player Prop Mode", 
                        widthGrow: 0,
                        minWidth: 45,
                        sorter: "number",
                        resizable: false,
                        titleHozAlign: "center",
                        hozAlign: "center"
                    }
                ]
            },

            // =====================================================
            // MEDIAN ODDS GROUP - Center justified headers
            // =====================================================
            {
                title: "Median Odds", 
                titleHozAlign: "center",
                columns: [
                    {
                        title: "Over", 
                        field: "Player Median Over Odds", 
                        widthGrow: 0,
                        minWidth: 50,
                        sorter: "number",
                        headerFilter: createMinMaxFilter,
                        headerFilterFunc: minMaxFilterFunction,
                        headerFilterLiveFilter: false,
                        resizable: false,
                        formatter: simpleOddsFormatter,
                        titleHozAlign: "center",
                        hozAlign: "center"
                    },
                    {
                        title: "Under", 
                        field: "Player Median Under Odds", 
                        widthGrow: 0,
                        minWidth: 50,
                        sorter: "number",
                        headerFilter: createMinMaxFilter,
                        headerFilterFunc: minMaxFilterFunction,
                        headerFilterLiveFilter: false,
                        resizable: false,
                        formatter: simpleOddsFormatter,
                        titleHozAlign: "center",
                        hozAlign: "center"
                    }
                ]
            },

            // =====================================================
            // BEST ODDS GROUP - Center justified headers
            // =====================================================
            {
                title: "Best Odds", 
                titleHozAlign: "center",
                columns: [
                    {
                        title: "Over", 
                        field: "Player Best Over Odds", 
                        widthGrow: 0,
                        minWidth: 80,
                        sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                            return self.oddsSorter(a, b, aRow, bRow, column, dir, sorterParams);
                        },
                        headerFilter: createMinMaxFilter,
                        headerFilterFunc: minMaxFilterFunction,
                        headerFilterLiveFilter: false,
                        resizable: false,
                        formatter: oddsFormatter,
                        titleHozAlign: "center",
                        hozAlign: "center"
                    },
                    {
                        title: "Under", 
                        field: "Player Best Under Odds", 
                        widthGrow: 0,
                        minWidth: 80,
                        sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                            return self.oddsSorter(a, b, aRow, bRow, column, dir, sorterParams);
                        },
                        headerFilter: createMinMaxFilter,
                        headerFilterFunc: minMaxFilterFunction,
                        headerFilterLiveFilter: false,
                        resizable: false,
                        formatter: oddsFormatter,
                        titleHozAlign: "center",
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
        
        subrowContainer.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div style="background: white; padding: 12px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <h4 style="margin: 0 0 8px 0; color: #f97316; font-size: 13px; font-weight: 600;">Matchup Details</h4>
                    <div style="font-size: 12px; color: #333;">
                        <div style="margin-bottom: 4px;"><strong>Game:</strong> ${matchup}</div>
                        <div style="margin-bottom: 4px;"><strong>Spread:</strong> ${spread}</div>
                        <div><strong>Total:</strong> ${total}</div>
                    </div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <h4 style="margin: 0 0 8px 0; color: #f97316; font-size: 13px; font-weight: 600;">Minutes Data</h4>
                    <div style="font-size: 12px; color: #333;">
                        <div style="margin-bottom: 4px;"><strong>Median:</strong> ${medianMinutes}</div>
                        <div><strong>Average:</strong> ${avgMinutes}</div>
                    </div>
                </div>
            </div>
        `;
        
        // Insert after the row
        rowElement.insertAdjacentElement('afterend', subrowContainer);
    }
}
