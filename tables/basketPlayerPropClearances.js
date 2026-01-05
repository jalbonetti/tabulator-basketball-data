// tables/basketPlayerPropClearances.js - Basketball Player Prop Clearances (FIXED)
// FIXES APPLIED:
// - Changed from rowClick to cellClick on "Player Name" field for expansion toggle
// - Subtable now appends INSIDE the row element (not after it) - fixes scrolling/anchor issue
// - Properly removes subtable from within row element when collapsing - fixes close issue
// - Calls row.normalizeHeight() after expansion/collapse changes
// - Minutes data now displays with 1 decimal place
// - MOVED Lineup column between Team and Prop Info (all standalone headers now adjacent)
// - Based on working baseball repository expansion pattern
// - UPDATED: Clearance now converts from decimal to percentage (multiply by 100)
// - UPDATED: Matchup Total now displays with 1 forced decimal place
// - UPDATED: Dynamic width calculation - container contracts to content, expands for subtables
// - UPDATED: Rank columns now display with "#" prefix (e.g., "#5 (12.3)")

import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { createMinMaxFilter, minMaxFilterFunction } from '../components/minMaxFilter.js';
import { isMobile, isTablet } from '../shared/config.js';

// Minimum width needed for subtables (3 boxes + gaps)
// Matchup Details (~180px) + Minutes Data (~150px) + Best Books (~150px) + gaps (30px)
const SUBTABLE_MIN_WIDTH = 550;

export class BasketPlayerPropClearancesTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'BasketPlayerPropClearances');
    }

    initialize() {
        const mobile = isMobile();
        const tablet = isTablet();
        const isSmallScreen = mobile || tablet;
        
        // Get base config but we need to override some settings
        const baseConfig = this.tableConfig;
        
        // Build config - use fitData for content-based sizing
        const config = {
            ...baseConfig,
            // Override virtual rendering to avoid compatibility issues
            virtualDom: true,
            virtualDomBuffer: 500,
            renderVertical: "virtual",
            renderHorizontal: "basic",  // Use basic instead of virtual - compatible with fitData
            pagination: false,
            paginationSize: false,
            layoutColumnsOnNewData: false,
            responsiveLayout: false,
            maxHeight: "600px",
            height: "600px",
            placeholder: "Loading basketball player prop clearances...",
            
            // fitData: columns size to content only, table width = sum of column widths
            layout: "fitData",
            
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
                
                // Debug: Log first row to verify clean data structure
                if (data.length > 0) {
                    console.log('DEBUG - First row data sample:', {
                        'Player Name': data[0]["Player Name"],
                        'Median Over Odds': data[0]["Player Median Over Odds"],
                        'Median Under Odds': data[0]["Player Median Under Odds"],
                        'Best Over Odds': data[0]["Player Best Over Odds"],
                        'Best Under Odds': data[0]["Player Best Under Odds"],
                        'Best Over Books': data[0]["Player Best Over Odds Books"],
                        'Best Under Books': data[0]["Player Best Under Odds Books"]
                    });
                }
                
                // Initialize expansion state for each row
                data.forEach(row => {
                    if (row._expanded === undefined) {
                        row._expanded = false;
                    }
                });
                
                // Remove loading indicator
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
            // Wait for table to be fully rendered before adjusting column widths
            setTimeout(() => {
                // Only proceed if we have data loaded
                const rowCount = this.table.getDataCount();
                console.log(`Table has ${rowCount} rows loaded`);
                
                if (rowCount > 0) {
                    // First scan all data for max widths
                    const data = this.table.getData();
                    this.scanDataForMaxWidths(data);
                    // Then equalize clusters
                    this.equalizeClusteredColumns();
                    // Finally calculate total width
                    this.calculateAndApplyWidths();
                } else {
                    console.log('No data yet, width calculation deferred');
                }
            }, 200);
            
            // Re-adjust on window resize
            window.addEventListener('resize', this.debounce(() => {
                if (this.table && this.table.getDataCount() > 0) {
                    this.equalizeClusteredColumns();
                    this.calculateAndApplyWidths();
                }
            }, 250));
        });
        
        // Also run width calculation after data loads
        this.table.on("dataLoaded", () => {
            setTimeout(() => {
                console.log("Data loaded event, recalculating widths...");
                const data = this.table.getData();
                // Scan all data for max widths first
                this.scanDataForMaxWidths(data);
                // Then equalize clusters
                this.equalizeClusteredColumns();
                // Finally calculate total width
                this.calculateAndApplyWidths();
            }, 100);
        });
    }
    
    // Backward compatibility alias for main.js resize handler
    expandNameColumnToFill() {
        this.calculateAndApplyWidths();
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
        // Note: Odds columns separated into two clusters (Median vs Best) for better sizing
        const clusters = {
            'cluster-a': ['Player Clearance', 'Player Games'],
            'cluster-b': ['Opponent Prop Rank', 'Opponent Pace Rank'],
            'cluster-c': ['Player Prop Median', 'Player Prop Average', 'Player Prop High', 'Player Prop Low', 'Player Prop Mode'],
            'cluster-d-median': ['Player Median Over Odds', 'Player Median Under Odds'],
            'cluster-d-best': ['Player Best Over Odds', 'Player Best Under Odds']
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
    
    // Calculate and apply widths based on content and subtable requirements
// Calculate and apply widths based on content and subtable requirements
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
            }
            
            const tabulatorHeader = tableElement.querySelector('.tabulator-header');
            if (tabulatorHeader) {
                tabulatorHeader.style.width = 'auto';
            }
            
            const tabulatorTable = tableElement.querySelector('.tabulator-table');
            if (tabulatorTable) {
                tabulatorTable.style.width = 'auto';
            }
        }
        
        try {
            // Get all columns and calculate total width
            const columns = this.table.getColumns();
            let totalColumnWidth = 0;
            let nameColumn = null;
            let nameColumnWidth = 0;
            
            columns.forEach(col => {
                const field = col.getField();
                const width = col.getWidth();
                
                if (field === "Player Name") {
                    nameColumn = col;
                    nameColumnWidth = width;
                }
                totalColumnWidth += width;
            });
            
            console.log(`Width calculation: Total columns=${totalColumnWidth}px, Name=${nameColumnWidth}px, Subtable Min=${SUBTABLE_MIN_WIDTH}px`);
            
            // If subtables need more width than current total, expand Name column
            if (SUBTABLE_MIN_WIDTH > totalColumnWidth && nameColumn) {
                const additionalWidthNeeded = SUBTABLE_MIN_WIDTH - totalColumnWidth;
                const newNameWidth = nameColumnWidth + additionalWidthNeeded;
                
                nameColumn.setWidth(newNameWidth);
                totalColumnWidth = SUBTABLE_MIN_WIDTH;
                console.log(`Expanded Name column from ${nameColumnWidth}px to ${newNameWidth}px to accommodate subtables`);
            }
            
            // Add scrollbar width to prevent horizontal scrollbar (scrollbar is typically 16-17px)
            const SCROLLBAR_WIDTH = 17;
            const totalWidthWithScrollbar = totalColumnWidth + SCROLLBAR_WIDTH;
            
            // Constrain the table element width to prevent full-page stretch
            tableElement.style.width = totalWidthWithScrollbar + 'px';
            tableElement.style.minWidth = totalWidthWithScrollbar + 'px';
            tableElement.style.maxWidth = totalWidthWithScrollbar + 'px';
            
            // Also constrain the table container
            const tableContainer = tableElement.closest('.table-container');
            if (tableContainer) {
                tableContainer.style.width = 'fit-content';
                tableContainer.style.minWidth = 'auto';
                tableContainer.style.maxWidth = 'none';
            }
            
            console.log(`Set table width to ${totalWidthWithScrollbar}px (columns: ${totalColumnWidth}px + scrollbar: ${SCROLLBAR_WIDTH}px)`);
            
        } catch (error) {
            console.error('Error in calculateAndApplyWidths:', error);
        }
    }

    // Scan ALL data to find max widths needed for text columns
    // This ensures columns are properly sized even with virtual scrolling
    scanDataForMaxWidths(data) {
        if (!data || data.length === 0 || !this.table) return;
        
        console.log(`Scanning ${data.length} rows for max column widths...`);
        
        // Create a hidden canvas for text measurement
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = '500 12px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'; // Match table font
        
        // Track max widths for text columns
        const maxWidths = {
            "Player Name": 0,
            "Lineup Status": 0,
            "Player Prop": 0,
            "Player Team": 0
        };
        
        // Scan all data to find longest values
        data.forEach(row => {
            Object.keys(maxWidths).forEach(field => {
                let value = row[field];
                if (value !== null && value !== undefined && value !== '') {
                    // Apply formatters where needed
                    if (field === "Lineup Status") {
                        value = String(value).replace('(Expected)', '(Exp)').replace('(Confirmed)', '(Conf)');
                    } else if (field === "Player Prop") {
                        if (value === '3-Pointers') value = '3-Pt';
                    }
                    
                    const textWidth = ctx.measureText(String(value)).width;
                    if (textWidth > maxWidths[field]) {
                        maxWidths[field] = textWidth;
                    }
                }
            });
        });
        
        // Add padding for cell padding, expand icon (for Name), and some buffer
        const CELL_PADDING = 16; // 8px on each side
        const EXPAND_ICON_WIDTH = 18; // For the ▶ icon and margin
        const BUFFER = 10; // Extra safety buffer
        
        // Apply minimum widths to columns
        Object.keys(maxWidths).forEach(field => {
            if (maxWidths[field] > 0) {
                const column = this.table.getColumn(field);
                if (column) {
                    let requiredWidth = maxWidths[field] + CELL_PADDING + BUFFER;
                    
                    // Add expand icon width for Name column
                    if (field === "Player Name") {
                        requiredWidth += EXPAND_ICON_WIDTH;
                    }
                    
                    const currentWidth = column.getWidth();
                    
                    // Only expand, never shrink
                    if (requiredWidth > currentWidth) {
                        column.setWidth(Math.ceil(requiredWidth));
                        console.log(`Expanded ${field} from ${currentWidth}px to ${Math.ceil(requiredWidth)}px (text: ${Math.ceil(maxWidths[field])}px)`);
                    }
                }
            }
        });
        
        console.log('Max width scan complete');
    }

    // Custom sorter for Games format "X/Y" - sorts by first number
    gamesPlayedSorter(a, b, aRow, bRow, column, dir, sorterParams) {
        const getGamesNum = (val) => {
            if (!val || val === '-') return -1;
            const str = String(val);
            const match = str.match(/^(\d+)/);
            return match ? parseInt(match[1], 10) : -1;
        };
        
        const aNum = getGamesNum(a);
        const bNum = getGamesNum(b);
        
        return aNum - bNum;
    }

    // Custom sorter for Rank with value format "X (Y.Y)" - sorts by rank number
    rankWithValueSorter(a, b, aRow, bRow, column, dir, sorterParams) {
        const getRankNum = (val) => {
            if (!val || val === '-') return 99999;
            const str = String(val);
            const match = str.match(/^(\d+)/);
            return match ? parseInt(match[1], 10) : 99999;
        };
        
        const aNum = getRankNum(a);
        const bNum = getRankNum(b);
        
        return aNum - bNum;
    }

    // Custom sorter for odds with +/- prefix
    oddsSorter(a, b, aRow, bRow, column, dir, sorterParams) {
        const getOddsNum = (val) => {
            if (val === null || val === undefined || val === '' || val === '-') return -99999;
            const str = String(val).trim();
            
            // Handle +/- prefix
            if (str.startsWith('+')) {
                const parsed = parseInt(str.substring(1), 10);
                return isNaN(parsed) ? -99999 : parsed;
            } else if (str.startsWith('-')) {
                const parsed = parseInt(str, 10);
                return isNaN(parsed) ? -99999 : parsed;
            }
            
            // Fallback: try direct parse
            const num = parseInt(str, 10);
            return isNaN(num) ? -99999 : num;
        };
        
        const aNum = getOddsNum(a);
        const bNum = getOddsNum(b);
        
        // Ensure we always return a valid number (never NaN)
        return aNum - bNum;
    }

    getColumns(isSmallScreen = false) {
        const self = this;
        
        // =====================================================
        // FORMATTERS
        // =====================================================
        
        // Clearance formatter - converts decimal to percentage with exactly ONE decimal place
        const clearanceFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            // Strip any existing % sign and parse the number
            const str = String(value).replace('%', '').trim();
            const num = parseFloat(str);
            if (isNaN(num)) return '-';
            // Multiply by 100 to convert decimal (e.g., 0.75) to percentage (e.g., 75.0%)
            return (num * 100).toFixed(1) + '%';
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

        // Odds formatter - handles +/- prefixes for display
        const oddsFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '' || value === '-') return '-';
            const num = parseInt(value, 10);
            if (isNaN(num)) return '-';
            return num > 0 ? `+${num}` : `${num}`;
        };

        // Rank formatter - prepends "#" to rank values (e.g., "5 (12.3)" -> "#5 (12.3)")
        const rankFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '' || value === '-') return '-';
            return '#' + value;
        };

        return [
            // =====================================================
            // NAME COLUMN - widthGrow:0 sizes to content
            // Will be expanded by calculateAndApplyWidths() if subtables need more space
            // Frozen on mobile/tablet for horizontal scrolling
            // Standalone header (no parent group)
            // =====================================================
            {
                title: "Name", 
                field: "Player Name", 
                frozen: true,
                widthGrow: 0,  // Size to content only - expanded dynamically if needed for subtables
                minWidth: 120,
                sorter: "string", 
                headerFilter: true,
                resizable: false,
                formatter: this.createNameFormatter(),
                hozAlign: "left",
                cssClass: "standalone-header"
            },
            
            // =====================================================
            // TEAM COLUMN - widthGrow:0 means size to content only
            // Standalone header (no parent group)
            // =====================================================
            {
                title: "Team", 
                field: "Player Team", 
                widthGrow: 0,
                minWidth: 45,
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center",
                cssClass: "standalone-header"
            },

            // =====================================================
            // LINEUP STATUS - MOVED HERE (between Team and Prop Info)
            // Standalone header (no parent group) - now adjacent to Name and Team
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
                formatter: lineupFormatter,
                cssClass: "standalone-header"
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
                        minWidth: 75,
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
            // CLEARANCE GROUP - includes Split (now first)
            // =====================================================
            {
                title: "Clearance", 
                columns: [
                    {
                        title: "Split", 
                        field: "Split", 
                        widthGrow: 0,
                        minWidth: 55,
                        headerFilter: createCustomMultiSelect,
                        resizable: false,
                        hozAlign: "center",
                        formatter: splitFormatter
                    },
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
                    }
                ]
            },

            // =====================================================
            // OPPONENT GROUP - renamed headers
            // UPDATED: Added rankFormatter to display "#" prefix
            // =====================================================
            {
                title: "Opponent", 
                columns: [
                    {
                        title: "Prop Rank (Avg)", 
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
                            return "Prop<br>Rank<br>(Avg)";
                        },
                        formatter: rankFormatter
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
                        },
                        formatter: rankFormatter
                    }
                ]
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
            // MEDIAN ODDS GROUP - uses custom oddsSorter for +/- values
            // =====================================================
            {
                title: "Median Odds", 
                columns: [
                    {
                        title: "Over", 
                        field: "Player Median Over Odds", 
                        widthGrow: 0,
                        minWidth: 45,
                        sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                            return self.oddsSorter(a, b, aRow, bRow, column, dir, sorterParams);
                        },
                        headerFilter: createMinMaxFilter,
                        headerFilterFunc: minMaxFilterFunction,
                        headerFilterLiveFilter: false,
                        resizable: false,
                        formatter: oddsFormatter,
                        hozAlign: "center",
                        cssClass: "cluster-d-median"
                    },
                    {
                        title: "Under", 
                        field: "Player Median Under Odds", 
                        widthGrow: 0,
                        minWidth: 45,
                        sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                            return self.oddsSorter(a, b, aRow, bRow, column, dir, sorterParams);
                        },
                        headerFilter: createMinMaxFilter,
                        headerFilterFunc: minMaxFilterFunction,
                        headerFilterLiveFilter: false,
                        resizable: false,
                        formatter: oddsFormatter,
                        hozAlign: "center",
                        cssClass: "cluster-d-median"
                    }
                ]
            },

            // =====================================================
            // BEST ODDS GROUP - uses custom oddsSorter for +/- values
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
                        formatter: oddsFormatter,
                        hozAlign: "center",
                        cssClass: "cluster-d-best"
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
                        formatter: oddsFormatter,
                        hozAlign: "center",
                        cssClass: "cluster-d-best"
                    }
                ]
            }
        ];
    }

    // =====================================================
    // FIXED: Name formatter with expand icon (matches baseball pattern)
    // =====================================================
    createNameFormatter() {
        const self = this;
        
        return (cell) => {
            const value = cell.getValue();
            if (!value) return '-';
            
            const data = cell.getRow().getData();
            const expanded = data._expanded || false;
            
            const container = document.createElement('div');
            container.style.cssText = 'display: flex; align-items: center; cursor: pointer;';
            
            const icon = document.createElement('span');
            icon.className = 'expand-icon';
            icon.style.cssText = 'margin-right: 6px; font-size: 10px; transition: transform 0.2s; color: #f97316; display: inline-flex; width: 12px;';
            icon.innerHTML = '▶';
            
            if (expanded) {
                icon.style.transform = 'rotate(90deg)';
            }
            
            const text = document.createElement('span');
            text.textContent = value;
            text.style.cssText = 'font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
            
            container.appendChild(icon);
            container.appendChild(text);
            
            return container;
        };
    }

    // =====================================================
    // FIXED: Row expansion using cellClick (matches baseball pattern)
    // This fixes the open/close issue and scrolling anchor issue
    // =====================================================
    setupRowExpansion() {
        if (!this.table) return;
        
        const self = this;
        let expansionTimeout;
        
        // Use cellClick on "Player Name" field instead of rowClick
        this.table.on("cellClick", (e, cell) => {
            const field = cell.getField();
            
            // Only expand/collapse when clicking on the Player Name column
            if (field === "Player Name") {
                e.preventDefault();
                e.stopPropagation();
                
                // Debounce rapid clicks
                if (expansionTimeout) {
                    clearTimeout(expansionTimeout);
                }
                
                expansionTimeout = setTimeout(() => {
                    const row = cell.getRow();
                    const data = row.getData();
                    
                    if (data._expanded === undefined) {
                        data._expanded = false;
                    }
                    
                    // Toggle expansion state
                    data._expanded = !data._expanded;
                    
                    // Update global state
                    const rowId = self.generateRowId(data);
                    if (data._expanded) {
                        self.expandedRowsCache.add(rowId);
                        if (window.globalExpandedState) {
                            window.globalExpandedState.set(`${self.elementId}_${rowId}`, true);
                        }
                    } else {
                        self.expandedRowsCache.delete(rowId);
                        if (window.globalExpandedState) {
                            window.globalExpandedState.delete(`${self.elementId}_${rowId}`);
                        }
                    }
                    
                    console.log(`Row ${data._expanded ? 'expanded' : 'collapsed'}: ${data["Player Name"]}`);
                    
                    // Update row data
                    row.update(data);
                    
                    // Update icon immediately
                    const cellElement = cell.getElement();
                    const expanderIcon = cellElement.querySelector('.expand-icon');
                    if (expanderIcon) {
                        expanderIcon.style.transform = data._expanded ? 'rotate(90deg)' : '';
                    }
                    
                    // Reformat row to trigger rowFormatter
                    requestAnimationFrame(() => {
                        row.reformat();
                        
                        // Update icon again after reformat (it may have been reset)
                        requestAnimationFrame(() => {
                            try {
                                const updatedCellElement = cell.getElement();
                                if (updatedCellElement) {
                                    const updatedExpanderIcon = updatedCellElement.querySelector('.expand-icon');
                                    if (updatedExpanderIcon) {
                                        updatedExpanderIcon.style.transform = data._expanded ? 'rotate(90deg)' : '';
                                    }
                                }
                            } catch (error) {
                                console.error("Error updating expander icon:", error);
                            }
                        });
                    });
                }, 50);
            }
        });
    }

    // =====================================================
    // FIXED: Row formatter - subtable INSIDE row element (matches baseball pattern)
    // This fixes the scrolling/anchor issue
    // =====================================================
    createRowFormatter() {
        const self = this;
        
        return (row) => {
            const data = row.getData();
            const rowElement = row.getElement();
            
            if (data._expanded === undefined) {
                data._expanded = false;
            }
            
            // Add/remove expanded class
            if (data._expanded) {
                rowElement.classList.add('row-expanded');
            } else {
                rowElement.classList.remove('row-expanded');
            }
            
            // Handle expansion
            if (data._expanded) {
                // Check if subtable already exists INSIDE the row element
                let existingSubrow = rowElement.querySelector('.subrow-container');
                
                if (!existingSubrow) {
                    // Create subtable container using requestAnimationFrame for better performance
                    requestAnimationFrame(() => {
                        // Double-check it doesn't exist after animation frame
                        if (rowElement.querySelector('.subrow-container')) return;
                        
                        const holderEl = document.createElement("div");
                        holderEl.classList.add('subrow-container');
                        holderEl.style.cssText = `
                            padding: 15px 20px;
                            background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
                            border-top: 2px solid #f97316;
                            margin: 0;
                            display: block;
                            width: 100%;
                            position: relative;
                            z-index: 1;
                        `;
                        
                        // Create subtable content
                        try {
                            self.createSubtableContent(holderEl, data);
                        } catch (error) {
                            console.error("Error creating subtable content:", error);
                            holderEl.innerHTML = '<div style="padding: 10px; color: red;">Error loading details</div>';
                        }
                        
                        // CRITICAL FIX: Append INSIDE the row element, not after it
                        rowElement.appendChild(holderEl);
                        
                        // Normalize row height after adding content
                        setTimeout(() => {
                            row.normalizeHeight();
                        }, 50);
                    });
                }
            } else {
                // Handle collapse - find and remove subtable from INSIDE the row element
                const existingSubrow = rowElement.querySelector('.subrow-container');
                if (existingSubrow) {
                    existingSubrow.remove();
                    rowElement.classList.remove('row-expanded');
                    
                    // Normalize row height after removing content
                    setTimeout(() => {
                        row.normalizeHeight();
                    }, 50);
                }
            }
        };
    }

    // =====================================================
    // FIXED: Helper to format minutes with 1 decimal place
    // =====================================================
    formatMinutes(value) {
        if (value === null || value === undefined || value === '' || value === '-') return '-';
        const num = parseFloat(value);
        if (isNaN(num)) return '-';
        return num.toFixed(1);
    }

    // =====================================================
    // Helper to format matchup total with 1 decimal place (handles "O/U 223.5" format)
    // =====================================================
    formatMatchupTotal(value) {
        if (value === null || value === undefined || value === '' || value === '-') return '-';
        const str = String(value);
        
        // Check if it has "O/U" prefix
        if (str.includes('O/U')) {
            // Extract the number after "O/U"
            const match = str.match(/O\/U\s*([\d.]+)/);
            if (match && match[1]) {
                const num = parseFloat(match[1]);
                if (!isNaN(num)) {
                    return 'O/U ' + num.toFixed(1);
                }
            }
            return str; // Return original if can't parse
        }
        
        // If no O/U prefix, just format the number
        const num = parseFloat(str);
        if (isNaN(num)) return str;
        return num.toFixed(1);
    }

    // =====================================================
    // UPDATED: Subtable content with flex-nowrap to keep boxes in a row
    // =====================================================
    createSubtableContent(container, data) {
        // Build subtable content
        const matchup = data["Matchup"] || '-';
        const spread = data["Matchup Spread"] || '-';
        // FIXED: Format matchup total with 1 decimal place (preserves "O/U" prefix)
        const total = this.formatMatchupTotal(data["Matchup Total"]);
        
        // FIXED: Format minutes with 1 decimal place
        const medianMinutes = this.formatMinutes(data["Player Median Minutes"]);
        const avgMinutes = this.formatMinutes(data["Player Average Minutes"]);
        
        // Read book names directly from the new Supabase columns
        const bestOverBook = data["Player Best Over Odds Books"] || '-';
        const bestUnderBook = data["Player Best Under Odds Books"] || '-';
        
        // UPDATED: flex-nowrap ensures subtables stay in a single row
        container.innerHTML = `
            <div style="display: flex; flex-wrap: nowrap; gap: 15px; justify-content: flex-start;">
                <div style="background: white; padding: 12px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: inline-block; min-width: fit-content; flex-shrink: 0;">
                    <h4 style="margin: 0 0 8px 0; color: #f97316; font-size: 13px; font-weight: 600;">Matchup Details</h4>
                    <div style="font-size: 12px; color: #333;">
                        <div style="margin-bottom: 4px;"><strong>Game:</strong> ${matchup}</div>
                        <div style="margin-bottom: 4px;"><strong>Spread:</strong> ${spread}</div>
                        <div><strong>Total:</strong> ${total}</div>
                    </div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: inline-block; min-width: fit-content; flex-shrink: 0;">
                    <h4 style="margin: 0 0 8px 0; color: #f97316; font-size: 13px; font-weight: 600;">Minutes Data</h4>
                    <div style="font-size: 12px; color: #333;">
                        <div style="margin-bottom: 4px;"><strong>Median:</strong> ${medianMinutes}</div>
                        <div><strong>Average:</strong> ${avgMinutes}</div>
                    </div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: inline-block; min-width: fit-content; flex-shrink: 0;">
                    <h4 style="margin: 0 0 8px 0; color: #f97316; font-size: 13px; font-weight: 600;">Best Books</h4>
                    <div style="font-size: 12px; color: #333;">
                        <div style="margin-bottom: 4px;"><strong>Over:</strong> ${bestOverBook}</div>
                        <div><strong>Under:</strong> ${bestUnderBook}</div>
                    </div>
                </div>
            </div>
        `;
    }
}
