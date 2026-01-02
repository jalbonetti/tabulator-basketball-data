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
            
            // fitDataFill: columns size to content, extra space distributed by widthGrow
            // Name column has widthGrow:1 (absorbs extra), all others have widthGrow:0
            layout: "fitDataFill",
            
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
                    
                    // Extract and store book names from Best Odds, then strip from display value
                    // This ensures column widths are calculated on formatted data, not raw
                    if (row["Player Best Over Odds"]) {
                        const overVal = String(row["Player Best Over Odds"]);
                        const overMatch = overVal.match(/\(([^)]+)\)/);
                        row._bestOverBook = overMatch ? overMatch[1] : '-';
                        // Replace with just the numeric part
                        row["Player Best Over Odds"] = overVal.split('(')[0].trim();
                    } else {
                        row._bestOverBook = '-';
                    }
                    
                    if (row["Player Best Under Odds"]) {
                        const underVal = String(row["Player Best Under Odds"]);
                        const underMatch = underVal.match(/\(([^)]+)\)/);
                        row._bestUnderBook = underMatch ? underMatch[1] : '-';
                        // Replace with just the numeric part
                        row["Player Best Under Odds"] = underVal.split('(')[0].trim();
                    } else {
                        row._bestUnderBook = '-';
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
            // Equalize clustered column widths after render
            setTimeout(() => {
                this.equalizeClusteredColumns();
            }, 150);
            
            // Re-equalize on window resize (desktop only)
            if (!isSmallScreen) {
                window.addEventListener('resize', this.debounce(() => {
                    this.equalizeClusteredColumns();
                }, 250));
            }
        });
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
        
        // Define clusters by field names
        const clusters = {
            'cluster-a': ['Player Clearance', 'Player Games'],
            'cluster-b': ['Opponent Prop Rank', 'Opponent Pace Rank'],
            'cluster-c': ['Player Prop Median', 'Player Prop Average', 'Player Prop High', 'Player Prop Low', 'Player Prop Mode'],
            'cluster-d': ['Player Median Over Odds', 'Player Median Under Odds', 'Player Best Over Odds', 'Player Best Under Odds']
        };
        
        // For each cluster, find the max width and apply to all columns in cluster
        Object.keys(clusters).forEach(clusterName => {
            const fields = clusters[clusterName];
            let maxWidth = 0;
            
            // Find max width in this cluster
            fields.forEach(field => {
                const column = this.table.getColumn(field);
                if (column) {
                    const width = column.getWidth();
                    if (width > maxWidth) {
                        maxWidth = width;
                    }
                }
            });
            
            // Apply max width to all columns in cluster
            if (maxWidth > 0) {
                fields.forEach(field => {
                    const column = this.table.getColumn(field);
                    if (column) {
                        column.setWidth(maxWidth);
                    }
                });
                console.log(`Cluster ${clusterName}: equalized to ${maxWidth}px`);
            }
        });
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
            // NAME COLUMN - widthGrow:1 means it absorbs ALL extra space
            // Frozen on mobile/tablet for horizontal scrolling
            // =====================================================
            {
                title: "Name", 
                field: "Player Name", 
                frozen: isSmallScreen,
                widthGrow: 1,
                minWidth: 120,
                sorter: "string", 
                headerFilter: true,
                resizable: false,
                formatter: this.createNameFormatter(),
                hozAlign: "left"
            },
            
            // =====================================================
            // TEAM COLUMN - widthGrow:0 means size to content only
            // =====================================================
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
            
            // =====================================================
            // PROP INFO GROUP
            // =====================================================
            {
                title: "Prop Info", 
                columns: [
                    {
                        title: "Prop", 
                        field: "Player Prop", 
                        widthGrow: 0,
                        minWidth: 50,
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
                        minWidth: 40,
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
            // CLEARANCE GROUP - includes Split (moved here)
            // =====================================================
            {
                title: "Clearance", 
                columns: [
                    {
                        title: "% Over", 
                        field: "Player Clearance", 
                        widthGrow: 0,
                        minWidth: 50,
                        sorter: "number",
                        resizable: false,
                        formatter: clearanceFormatter,
                        hozAlign: "center",
                        cssClass: "cluster-a"
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
                        hozAlign: "center",
                        cssClass: "cluster-a"
                    },
                    {
                        title: "Split", 
                        field: "Split", 
                        widthGrow: 0,
                        minWidth: 55,
                        headerFilter: createCustomMultiSelect,
                        resizable: false,
                        hozAlign: "center",
                        formatter: splitFormatter
                    }
                ]
            },

            // =====================================================
            // OPPONENT GROUP - renamed headers
            // =====================================================
            {
                title: "Opponent", 
                columns: [
                    {
                        title: "Prop Rank (Average)", 
                        field: "Opponent Prop Rank", 
                        widthGrow: 0,
                        minWidth: 55,
                        sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                            return self.rankWithValueSorter(a, b, aRow, bRow, column, dir, sorterParams);
                        },
                        resizable: false,
                        hozAlign: "center",
                        cssClass: "cluster-b",
                        titleFormatter: function() {
                            return "Prop<br>Rank<br>(Average)";
                        }
                    },
                    {
                        title: "Season Pace Rank", 
                        field: "Opponent Pace Rank", 
                        widthGrow: 0,
                        minWidth: 55,
                        sorter: "number",
                        resizable: false,
                        hozAlign: "center",
                        cssClass: "cluster-b",
                        titleFormatter: function() {
                            return "Season<br>Pace<br>Rank";
                        }
                    }
                ]
            },

            // =====================================================
            // LINEUP STATUS
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
            // =====================================================
            {
                title: "Player Stats", 
                columns: [
                    {
                        title: "Med", 
                        field: "Player Prop Median", 
                        widthGrow: 0,
                        minWidth: 40,
                        sorter: "number",
                        resizable: false,
                        hozAlign: "center",
                        formatter: oneDecimalFormatter,
                        cssClass: "cluster-c"
                    },
                    {
                        title: "Avg", 
                        field: "Player Prop Average", 
                        widthGrow: 0,
                        minWidth: 40,
                        sorter: "number",
                        resizable: false,
                        hozAlign: "center",
                        formatter: oneDecimalFormatter,
                        cssClass: "cluster-c"
                    },
                    {
                        title: "High", 
                        field: "Player Prop High", 
                        widthGrow: 0,
                        minWidth: 40,
                        sorter: "number",
                        resizable: false,
                        hozAlign: "center",
                        cssClass: "cluster-c"
                    },
                    {
                        title: "Low", 
                        field: "Player Prop Low", 
                        widthGrow: 0,
                        minWidth: 40,
                        sorter: "number",
                        resizable: false,
                        hozAlign: "center",
                        cssClass: "cluster-c"
                    },
                    {
                        title: "Mode", 
                        field: "Player Prop Mode", 
                        widthGrow: 0,
                        minWidth: 40,
                        sorter: "number",
                        resizable: false,
                        hozAlign: "center",
                        cssClass: "cluster-c"
                    }
                ]
            },

            // =====================================================
            // MEDIAN ODDS GROUP
            // =====================================================
            {
                title: "Median Odds", 
                columns: [
                    {
                        title: "Over", 
                        field: "Player Median Over Odds", 
                        widthGrow: 0,
                        minWidth: 45,
                        sorter: "number",
                        headerFilter: createMinMaxFilter,
                        headerFilterFunc: minMaxFilterFunction,
                        headerFilterLiveFilter: false,
                        resizable: false,
                        formatter: simpleOddsFormatter,
                        hozAlign: "center",
                        cssClass: "cluster-d"
                    },
                    {
                        title: "Under", 
                        field: "Player Median Under Odds", 
                        widthGrow: 0,
                        minWidth: 45,
                        sorter: "number",
                        headerFilter: createMinMaxFilter,
                        headerFilterFunc: minMaxFilterFunction,
                        headerFilterLiveFilter: false,
                        resizable: false,
                        formatter: simpleOddsFormatter,
                        hozAlign: "center",
                        cssClass: "cluster-d"
                    }
                ]
            },

            // =====================================================
            // BEST ODDS GROUP - truncated (book names in subtable)
            // =====================================================
            {
                title: "Best Odds", 
                columns: [
                    {
                        title: "Over", 
                        field: "Player Best Over Odds", 
                        widthGrow: 0,
                        minWidth: 45,
                        sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                            return self.oddsSorter(a, b, aRow, bRow, column, dir, sorterParams);
                        },
                        headerFilter: createMinMaxFilter,
                        headerFilterFunc: minMaxFilterFunction,
                        headerFilterLiveFilter: false,
                        resizable: false,
                        formatter: bestOddsFormatter,
                        hozAlign: "center",
                        cssClass: "cluster-d"
                    },
                    {
                        title: "Under", 
                        field: "Player Best Under Odds", 
                        widthGrow: 0,
                        minWidth: 45,
                        sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                            return self.oddsSorter(a, b, aRow, bRow, column, dir, sorterParams);
                        },
                        headerFilter: createMinMaxFilter,
                        headerFilterFunc: minMaxFilterFunction,
                        headerFilterLiveFilter: false,
                        resizable: false,
                        formatter: bestOddsFormatter,
                        hozAlign: "center",
                        cssClass: "cluster-d"
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
        
        // Use pre-extracted book names (set in dataLoaded)
        const bestOverBook = data._bestOverBook || '-';
        const bestUnderBook = data._bestUnderBook || '-';
        
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
