// tables/basketPlayerPropOdds.js - Basketball Player Prop Odds Table
// Simple flat table with no expandable rows or grouped headers
// UPDATED: Left-justified with content-based width, scanDataForMaxWidths for proper column sizing
// FIXED: Desktop container width reset on tab switch - prevents grey/blue space
// UPDATED: Mobile/tablet shows abbreviated team names in Matchup column (e.g., "LAC @ BOS")
// UPDATED: Desktop properly sizes for longest team names like "Los Angeles Clippers"
// FIXED: All 3 odds columns (Book, Median, Best) now equalize to same width
// FIXED: Best Books column now properly expands for long multi-book values
// FIXED: Player Name column now uses fixed minimum width
// FIXED: Best Books column now properly expands on mobile/tablet devices
// ADDED: EV % and Quarter Kelly % columns with bankroll input
// ADDED: Prop abbreviations matching Player Prop Clearances table
// UPDATED: Default sort by EV % descending

import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { createMinMaxFilter, minMaxFilterFunction } from '../components/minMaxFilter.js';
import { createBankrollInput, bankrollFilterFunction, getBankrollValue } from '../components/bankrollInput.js';
import { isMobile, isTablet } from '../shared/config.js';

// Minimum width for Player Name column based on longest realistic name + status indicator
// "Yanic Konan Niederhauser (Q)" is about the longest we'll see
const NAME_COLUMN_MIN_WIDTH = 205;

// Minimum width for EV% and Kelly% columns - should fit percentage values and bankroll amounts
const EV_KELLY_COLUMN_MIN_WIDTH = 65;

export class BasketPlayerPropOddsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'BasketPlayerPropOdds');
        
        // Team full name to abbreviation mapping
        this.teamAbbrevMap = {
            'Atlanta Hawks': 'ATL',
            'Boston Celtics': 'BOS',
            'Brooklyn Nets': 'BKN',
            'Charlotte Hornets': 'CHA',
            'Chicago Bulls': 'CHI',
            'Cleveland Cavaliers': 'CLE',
            'Dallas Mavericks': 'DAL',
            'Denver Nuggets': 'DEN',
            'Detroit Pistons': 'DET',
            'Golden State Warriors': 'GSW',
            'Houston Rockets': 'HOU',
            'Indiana Pacers': 'IND',
            'Los Angeles Clippers': 'LAC',
            'LA Clippers': 'LAC',
            'Los Angeles Lakers': 'LAL',
            'LA Lakers': 'LAL',
            'Memphis Grizzlies': 'MEM',
            'Miami Heat': 'MIA',
            'Milwaukee Bucks': 'MIL',
            'Minnesota Timberwolves': 'MIN',
            'New Orleans Pelicans': 'NOP',
            'New York Knicks': 'NYK',
            'Oklahoma City Thunder': 'OKC',
            'Orlando Magic': 'ORL',
            'Philadelphia 76ers': 'PHI',
            'Phoenix Suns': 'PHX',
            'Portland Trail Blazers': 'POR',
            'Sacramento Kings': 'SAC',
            'San Antonio Spurs': 'SAS',
            'Toronto Raptors': 'TOR',
            'Utah Jazz': 'UTA',
            'Washington Wizards': 'WAS'
        };
        
        // Prop type abbreviation mapping
        // Used in table display - abbreviates combo props to single letters with +
        // Maps from Supabase values to display abbreviations
        this.propAbbrevMap = {
            '3-Pointers': '3-Pt',
            // Full name formats (in case Supabase sends these)
            'Points + Assists': 'P+A',
            'Points + Rebounds': 'P+R',
            'Points + Rebounds + Assists': 'P+R+A',
            'Rebounds + Assists': 'R+A',
            'Blocks + Steals': 'B+S',
            // Abbreviated formats from Supabase (e.g., "Rebs + Asts")
            'Pts + Asts': 'P+A',
            'Pts + Rebs': 'P+R',
            'Pts + Rebs + Asts': 'P+R+A',
            'Rebs + Asts': 'R+A',
            'Blks + Stls': 'B+S',
            // Other possible variations
            'Points + Reb': 'P+R',
            'Points + Ast': 'P+A',
            'Pts + Assists': 'P+A',
            'Pts + Rebounds': 'P+R'
        };
    }

    // Convert full team names in matchup string to abbreviations
    // UPDATED: Always abbreviate matchups in Player Prop Odds table to save space
    abbreviateMatchup(matchup) {
        if (!matchup) return '-';
        let abbreviated = matchup;
        
        // Replace each full team name with its abbreviation
        Object.entries(this.teamAbbrevMap).forEach(([fullName, abbrev]) => {
            // Use word boundary-aware replacement to avoid partial matches
            const regex = new RegExp(fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            abbreviated = abbreviated.replace(regex, abbrev);
        });
        
        return abbreviated;
    }

    // Abbreviate prop type for table display
    abbreviateProp(prop) {
        if (!prop) return '-';
        return this.propAbbrevMap[prop] || prop;
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
            // UPDATED: Default sort by EV % descending (highest first)
            initialSort: [
                {column: "EV %", dir: "desc"}
            ],
            dataLoaded: (data) => {
                console.log(`Player Prop Odds table loaded ${data.length} records successfully`);
                this.dataLoaded = true;
                
                if (data.length > 0) {
                    console.log('DEBUG - Player Prop Odds First row sample:', {
                        'Player Name': data[0]["Player Name"],
                        'Player Matchup': data[0]["Player Matchup"],
                        'Player Team': data[0]["Player Team"],
                        'EV %': data[0]["EV %"],
                        'Quarter Kelly %': data[0]["Quarter Kelly %"]
                    });
                }
                
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
                console.error("Error loading player prop odds data:", error);
            }
        };

        this.table = new Tabulator(this.elementId, config);
        
        this.table.on("tableBuilt", () => {
            console.log("Player Prop Odds table built");
            
            // Width calculations for all devices
            setTimeout(() => {
                const data = this.table ? this.table.getData() : [];
                if (data.length > 0) {
                    this.scanDataForMaxWidths(data);
                    // Desktop-specific: equalize odds columns and calculate container widths
                    if (!isMobile() && !isTablet()) {
                        this.equalizeClusteredColumns();
                        this.calculateAndApplyWidths();
                    }
                    this.ensureNameColumnWidth();
                }
            }, 100);
        });
        
        this.table.on("renderComplete", () => {
            // Recalculate widths after render (handles tab switching) - desktop only
            if (!isMobile() && !isTablet()) {
                setTimeout(() => {
                    this.calculateAndApplyWidths();
                }, 100);
            }
            
            // Always ensure Name column meets minimum width
            setTimeout(() => {
                this.ensureNameColumnWidth();
            }, 50);
        });
        
        // Handle window resize - recalculate widths (desktop only)
        window.addEventListener('resize', this.debounce(() => {
            if (this.table && this.table.getDataCount() > 0 && !isMobile() && !isTablet()) {
                this.calculateAndApplyWidths();
                this.ensureNameColumnWidth();
            }
        }, 250));
    }

    // Ensure Name column has its minimum required width
    // Uses fixed minimum based on longest realistic name "Yanic Konan Niederhauser (Q)"
    ensureNameColumnWidth() {
        if (!this.table) return;
        
        const nameColumn = this.table.getColumn("Player Name");
        if (nameColumn) {
            const currentWidth = nameColumn.getWidth();
            if (currentWidth < NAME_COLUMN_MIN_WIDTH) {
                console.log(`Player Prop Odds: Setting Name column from ${currentWidth}px to ${NAME_COLUMN_MIN_WIDTH}px`);
                nameColumn.setWidth(NAME_COLUMN_MIN_WIDTH);
            }
        }
    }

    // Debounce helper
    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Force recalculation of column widths - called by TabManager on tab switch
    forceRecalculateWidths() {
        if (!this.table) return;
        
        const data = this.table ? this.table.getData() : [];
        if (data.length > 0) {
            this.scanDataForMaxWidths(data);
            // Desktop-specific operations
            if (!isMobile() && !isTablet()) {
                this.equalizeClusteredColumns();
                this.calculateAndApplyWidths();
            }
        }
        
        // Always ensure minimum Name width is applied
        this.ensureNameColumnWidth();
    }

    // Scan ALL data to find max widths needed for text columns
    // UPDATED: Properly measures full team names for desktop display
    // FIXED: Now includes odds columns and Best Books for proper width measurement
    // FIXED: Best Books column is now scanned on ALL devices (mobile/tablet/desktop)
    // Note: Player Name uses fixed NAME_COLUMN_MIN_WIDTH constant instead of calculation
    scanDataForMaxWidths(data) {
        if (!data || data.length === 0 || !this.table) return;
        
        const mobile = isMobile();
        const tablet = isTablet();
        const isSmallScreen = mobile || tablet;
        
        console.log(`Player Prop Odds Scanning ${data.length} rows for max column widths...`);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Track max widths for text columns (excluding Player Name which uses fixed min)
        // FIXED: Always include Best Books for all devices
        const maxWidths = {
            "Player Best Odds Books": 0  // Always scan on all devices
        };
        
        // Only scan these additional columns on desktop
        if (!isSmallScreen) {
            maxWidths["Player Matchup"] = 0;
            maxWidths["Player Team"] = 0;
            maxWidths["Player Prop Type"] = 0;
            maxWidths["Player Over/Under"] = 0;
            maxWidths["Player Book"] = 0;
            maxWidths["Player Prop Odds"] = 0;
            maxWidths["Player Median Odds"] = 0;
            maxWidths["Player Best Odds"] = 0;
            maxWidths["EV %"] = 0;
            maxWidths["Quarter Kelly %"] = 0;
        }
        
        // First measure header widths (use header font weight)
        ctx.font = '600 12px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        const HEADER_PADDING = 16;
        const SORT_ICON_WIDTH = 16; // Space for sort indicator
        
        // Map field names to their display titles for header measurement
        const fieldToTitle = {
            "Player Matchup": "Matchup",
            "Player Team": "Team",
            "Player Prop Type": "Prop",
            "Player Over/Under": "O/U",
            "Player Book": "Book",
            "Player Prop Odds": "Book Odds",
            "Player Median Odds": "Median Odds",
            "Player Best Odds": "Best Odds",
            "Player Best Odds Books": "Best Books",
            "EV %": "EV %",
            "Quarter Kelly %": "Bet Size"
        };
        
        Object.keys(maxWidths).forEach(field => {
            const title = fieldToTitle[field] || field;
            const headerWidth = ctx.measureText(title).width + HEADER_PADDING + SORT_ICON_WIDTH;
            maxWidths[field] = headerWidth;
        });
        
        // Now measure data widths (use data font weight)
        ctx.font = '500 12px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        
        data.forEach(row => {
            Object.keys(maxWidths).forEach(field => {
                const value = row[field];
                if (value !== null && value !== undefined && value !== '') {
                    // For odds fields, format with +/- prefix for measurement
                    let displayValue = String(value);
                    if (field.includes('Odds') && field !== 'Player Best Odds Books') {
                        const num = parseInt(value, 10);
                        if (!isNaN(num)) {
                            displayValue = num > 0 ? `+${num}` : `${num}`;
                        }
                    }
                    // For EV% and Kelly%, format as percentage for measurement
                    if (field === 'EV %' || field === 'Quarter Kelly %') {
                        const num = parseFloat(value);
                        if (!isNaN(num)) {
                            // Measure both % format and potential $ format (for Kelly with bankroll)
                            const pctDisplay = (num * 100).toFixed(1) + '%';
                            const moneyDisplay = '$99999.99'; // Max expected monetary display
                            displayValue = pctDisplay.length > moneyDisplay.length ? pctDisplay : moneyDisplay;
                        }
                    }
                    // For Prop Type, use abbreviated version for measurement
                    if (field === 'Player Prop Type') {
                        displayValue = this.abbreviateProp(value);
                    }
                    // For Matchup, always use abbreviated version for measurement
                    if (field === 'Player Matchup') {
                        displayValue = this.abbreviateMatchup(value);
                    }
                    const textWidth = ctx.measureText(displayValue).width;
                    if (textWidth > maxWidths[field]) {
                        maxWidths[field] = textWidth;
                    }
                }
            });
        });
        
        // For Player Matchup, use abbreviated format for measurement since we always abbreviate
        // Longest abbreviated matchup is like "MIN @ OKC" which is short
        const longestAbbrevMatchup = "MIN @ OKC";
        const longestMatchupWidth = ctx.measureText(longestAbbrevMatchup).width;
        if (maxWidths["Player Matchup"] !== undefined && longestMatchupWidth > maxWidths["Player Matchup"]) {
            maxWidths["Player Matchup"] = longestMatchupWidth;
        }
        
        const CELL_PADDING = 16;
        const BUFFER = 8;
        
        // Apply widths to scanned columns
        Object.keys(maxWidths).forEach(field => {
            if (maxWidths[field] > 0) {
                const column = this.table.getColumn(field);
                if (column) {
                    const requiredWidth = maxWidths[field] + CELL_PADDING + BUFFER;
                    const currentWidth = column.getWidth();
                    // Only expand if needed (don't shrink)
                    if (requiredWidth > currentWidth) {
                        column.setWidth(Math.ceil(requiredWidth));
                        console.log(`Player Prop Odds Set ${field} to ${Math.ceil(requiredWidth)}px (was ${currentWidth}px)`);
                    }
                }
            }
        });
        
        // Ensure Name column has fixed minimum width
        this.ensureNameColumnWidth();
        
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

    // Custom sorter for percentage values (stored as decimals)
    percentSorter(a, b, aRow, bRow, column, dir, sorterParams) {
        const getNum = (val) => {
            if (val === null || val === undefined || val === '' || val === '-') return -99999;
            const num = parseFloat(val);
            return isNaN(num) ? -99999 : num;
        };
        
        return getNum(a) - getNum(b);
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

        // Matchup formatter - ALWAYS abbreviates team names in Player Prop Odds to save space
        const matchupFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            
            // Always abbreviate team names in Player Prop Odds table
            return self.abbreviateMatchup(value);
        };

        // Prop formatter - abbreviates prop types for table display
        const propFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            return self.abbreviateProp(value);
        };

        // EV % formatter - converts decimal to percentage
        const evFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '' || value === '-') return '-';
            const num = parseFloat(value);
            if (isNaN(num)) return '-';
            // Convert decimal to percentage (e.g., 0.05 -> 5.0%)
            const pct = num * 100;
            // Always show 0 before decimal if < 1, max 1 trailing decimal
            return pct.toFixed(1) + '%';
        };

        // Quarter Kelly % formatter - converts decimal to percentage OR monetary amount
        const kellyFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '' || value === '-') return '-';
            const num = parseFloat(value);
            if (isNaN(num)) return '-';
            
            // Check if bankroll is set
            const bankroll = getBankrollValue('Quarter Kelly %');
            
            if (bankroll > 0) {
                // Convert to monetary amount: Kelly % * bankroll
                const amount = num * bankroll;
                // Format as currency with 2 decimal places
                return '$' + amount.toFixed(2);
            } else {
                // Convert decimal to percentage (e.g., 0.05 -> 5.0%)
                const pct = num * 100;
                return pct.toFixed(1) + '%';
            }
        };

        return [
            {
                title: "Name", 
                field: "Player Name", 
                frozen: true,
                widthGrow: 0,
                minWidth: NAME_COLUMN_MIN_WIDTH, // Fixed minimum for "Yanic Konan Niederhauser (Q)"
                sorter: "string", 
                headerFilter: true,
                resizable: false,
                hozAlign: "left"
            },
            {
                title: "Matchup", 
                field: "Player Matchup", 
                widthGrow: 0,
                minWidth: 70, // Always abbreviated (e.g., "LAC @ BOS")
                sorter: "string",
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center",
                formatter: matchupFormatter
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
                minWidth: 55, // Sized to fit "P+R+A" or "Rebounds" (longest values after abbreviation)
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                headerFilterParams: {
                    // Custom display mapping for dropdown
                    valuesLookup: function(cell) {
                        const values = cell.getTable().getData().map(row => row["Player Prop Type"]);
                        const unique = [...new Set(values)].filter(v => v !== null && v !== undefined && v !== '');
                        return unique.sort();
                    }
                },
                resizable: false,
                hozAlign: "center",
                formatter: propFormatter
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
                resizable: false,
                hozAlign: "center"
            },
            // NEW: EV % column
            {
                title: "EV %", 
                field: "EV %", 
                widthGrow: 0,
                minWidth: EV_KELLY_COLUMN_MIN_WIDTH,
                sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                    return self.percentSorter(a, b, aRow, bRow, column, dir, sorterParams);
                },
                resizable: false,
                formatter: evFormatter,
                hozAlign: "center",
                cssClass: "cluster-ev-kelly"
            },
            // NEW: Quarter Kelly % column with bankroll input
            {
                title: "Bet Size", 
                field: "Quarter Kelly %", 
                widthGrow: 0,
                minWidth: EV_KELLY_COLUMN_MIN_WIDTH,
                sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                    return self.percentSorter(a, b, aRow, bRow, column, dir, sorterParams);
                },
                headerFilter: createBankrollInput,
                headerFilterFunc: bankrollFilterFunction,
                headerFilterLiveFilter: false,
                resizable: false,
                formatter: kellyFormatter,
                hozAlign: "center",
                cssClass: "cluster-ev-kelly"
            }
        ];
    }

    // Equalize column widths for clustered columns (odds columns and EV/Kelly columns)
    // FIXED: All three odds columns (Book Odds, Median Odds, Best Odds) now equalize to the same width
    // ADDED: EV % and Quarter Kelly % columns equalize to same width
    // Width is based on the maximum of: data width OR header text width
    equalizeClusteredColumns() {
        if (!this.table) return;
        
        // Skip on mobile/tablet
        if (isMobile() || isTablet()) return;
        
        // Measure header widths to include in calculation
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = '600 12px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'; // Header font weight
        
        const CELL_PADDING = 16;
        const SORT_ICON_WIDTH = 20; // Space for sort icon
        
        // Group 1: Odds columns
        const oddsCluster = ['Player Prop Odds', 'Player Median Odds', 'Player Best Odds'];
        let maxOddsWidth = 0;
        
        oddsCluster.forEach(field => {
            const column = this.table.getColumn(field);
            if (column) {
                const dataWidth = column.getWidth();
                if (dataWidth > maxOddsWidth) {
                    maxOddsWidth = dataWidth;
                }
                
                const headerTitle = column.getDefinition().title;
                if (headerTitle) {
                    const headerTextWidth = ctx.measureText(headerTitle).width;
                    const headerRequiredWidth = headerTextWidth + CELL_PADDING + SORT_ICON_WIDTH;
                    if (headerRequiredWidth > maxOddsWidth) {
                        maxOddsWidth = headerRequiredWidth;
                    }
                }
            }
        });
        
        if (maxOddsWidth > 0) {
            oddsCluster.forEach(field => {
                const column = this.table.getColumn(field);
                if (column) {
                    column.setWidth(Math.ceil(maxOddsWidth));
                }
            });
            console.log(`Player Prop Odds: Equalized odds columns to ${Math.ceil(maxOddsWidth)}px`);
        }
        
        // Group 2: EV and Kelly columns
        const evKellyCluster = ['EV %', 'Quarter Kelly %'];
        let maxEvKellyWidth = EV_KELLY_COLUMN_MIN_WIDTH; // Start with minimum
        
        evKellyCluster.forEach(field => {
            const column = this.table.getColumn(field);
            if (column) {
                const dataWidth = column.getWidth();
                if (dataWidth > maxEvKellyWidth) {
                    maxEvKellyWidth = dataWidth;
                }
                
                const headerTitle = column.getDefinition().title;
                if (headerTitle) {
                    const headerTextWidth = ctx.measureText(headerTitle).width;
                    const headerRequiredWidth = headerTextWidth + CELL_PADDING + SORT_ICON_WIDTH;
                    if (headerRequiredWidth > maxEvKellyWidth) {
                        maxEvKellyWidth = headerRequiredWidth;
                    }
                }
            }
        });
        
        if (maxEvKellyWidth > 0) {
            evKellyCluster.forEach(field => {
                const column = this.table.getColumn(field);
                if (column) {
                    column.setWidth(Math.ceil(maxEvKellyWidth));
                }
            });
            console.log(`Player Prop Odds: Equalized EV/Kelly columns to ${Math.ceil(maxEvKellyWidth)}px`);
        }
    }

    // Calculate and apply table width based on actual column widths
    calculateAndApplyWidths() {
        if (!this.table) return;
        
        const tableElement = this.table.element;
        if (!tableElement) return;
        
        // Check for mobile/tablet
        const mobile = isMobile();
        const tablet = isTablet();
        const isSmallScreen = mobile || tablet;
        
        // MOBILE/TABLET: Clear container widths but preserve Name column minimum
        if (isSmallScreen) {
            tableElement.style.width = '';
            tableElement.style.minWidth = '';
            tableElement.style.maxWidth = '';
            
            const tableContainer = tableElement.closest('.table-container');
            if (tableContainer) {
                tableContainer.style.width = '';
                tableContainer.style.minWidth = '';
                tableContainer.style.maxWidth = '';
            }
            
            // Ensure Name column maintains minimum width on mobile
            this.ensureNameColumnWidth();
            
            console.log(`Player Prop Odds Mobile/tablet mode: container widths cleared, Name column preserved`);
            return;
        }
        
        try {
            const columns = this.table.getColumns();
            let totalColumnWidth = 0;
            
            columns.forEach(col => {
                if (col.isVisible()) {
                    totalColumnWidth += col.getWidth();
                }
            });
            
            const tableHolder = tableElement.querySelector('.tabulator-tableholder');
            
            // Add scrollbar width buffer for desktop
            const SCROLLBAR_WIDTH = 17;
            const totalWidthWithScrollbar = totalColumnWidth + SCROLLBAR_WIDTH;
            
            tableElement.style.width = totalWidthWithScrollbar + 'px';
            tableElement.style.minWidth = totalWidthWithScrollbar + 'px';
            tableElement.style.maxWidth = totalWidthWithScrollbar + 'px';
            
            if (tableHolder) {
                tableHolder.style.width = totalWidthWithScrollbar + 'px';
                tableHolder.style.maxWidth = totalWidthWithScrollbar + 'px';
            }
            
            const tabulatorHeader = tableElement.querySelector('.tabulator-header');
            if (tabulatorHeader) {
                tabulatorHeader.style.width = totalWidthWithScrollbar + 'px';
            }
            
            const tableContainer = tableElement.closest('.table-container');
            if (tableContainer) {
                tableContainer.style.width = 'fit-content';
                tableContainer.style.minWidth = 'auto';
                tableContainer.style.maxWidth = 'none';
            }
            
            console.log(`Player Prop Odds: Set table width to ${totalWidthWithScrollbar}px (columns: ${totalColumnWidth}px + scrollbar: ${SCROLLBAR_WIDTH}px)`);
            
        } catch (error) {
            console.error('Error in Player Prop Odds calculateAndApplyWidths:', error);
        }
    }
}
