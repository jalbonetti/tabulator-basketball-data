// tables/basketMatchups.js - Basketball Matchups Table
// Pulls from three Supabase tables: BasketMatchupsGame, BasketMatchupsDefense, BasketMatchupsPlayers
// Features expandable rows with 4 stacked subtables
// UPDATED: 
// - Column widths: Matchup 50%, Spread 25%, Total 25%
// - FT header changed to FTM in player subtables
// - All player stats now have forced decimal places
// - Out/OFS players now have single row with Lineup="Injury", Split="Full Season"
// - Out/OFS players show stats and format: "Name - All - Full Season - Games - Mins"
// - Total column formatted with 1 decimal place
// - Defense prop ranks prefixed with #
// - Defense rank cells now have conditional background colors (green/white/red)
// - Fixed parseMatchup to handle text month date formats (e.g., "Jan 5")
// - FIXED: Desktop scrollbar space reservation - prevents horizontal scrollbar when subtables expand

import { BaseTable } from './baseTable.js';
import { isMobile, isTablet } from '../shared/config.js';
import { getRankBackgroundColor } from '../shared/utils.js';

export class BasketMatchupsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'BasketMatchupsGame');
        
        // Additional endpoints for subtable data
        this.ENDPOINTS = {
            GAME: 'BasketMatchupsGame',
            DEFENSE: 'BasketMatchupsDefense',
            PLAYERS: 'BasketMatchupsPlayers'
        };
        
        // Cache for subtable data
        this.defenseDataCache = new Map();
        this.playersDataCache = new Map();
        
        // Team abbreviation to full name mapping
        this.teamNameMap = {
            'ATL': 'Atlanta Hawks',
            'BOS': 'Boston Celtics',
            'BKN': 'Brooklyn Nets',
            'CHA': 'Charlotte Hornets',
            'CHI': 'Chicago Bulls',
            'CLE': 'Cleveland Cavaliers',
            'DAL': 'Dallas Mavericks',
            'DEN': 'Denver Nuggets',
            'DET': 'Detroit Pistons',
            'GSW': 'Golden State Warriors',
            'HOU': 'Houston Rockets',
            'IND': 'Indiana Pacers',
            'LAC': 'Los Angeles Clippers',
            'LAL': 'Los Angeles Lakers',
            'MEM': 'Memphis Grizzlies',
            'MIA': 'Miami Heat',
            'MIL': 'Milwaukee Bucks',
            'MIN': 'Minnesota Timberwolves',
            'NOP': 'New Orleans Pelicans',
            'NYK': 'New York Knicks',
            'OKC': 'Oklahoma City Thunder',
            'ORL': 'Orlando Magic',
            'PHI': 'Philadelphia 76ers',
            'PHX': 'Phoenix Suns',
            'POR': 'Portland Trail Blazers',
            'SAC': 'Sacramento Kings',
            'SAS': 'San Antonio Spurs',
            'TOR': 'Toronto Raptors',
            'UTA': 'Utah Jazz',
            'WAS': 'Washington Wizards'
        };
        
        // Reverse mapping (full name to abbreviation)
        this.teamAbbrevMap = {};
        Object.entries(this.teamNameMap).forEach(([abbrev, fullName]) => {
            this.teamAbbrevMap[fullName] = abbrev;
        });
        
        // Flag to track when subtable data cache is ready
        this.subtableDataReady = false;
        
        // Track saved expanded rows for tab switching
        this.savedExpandedRows = new Set();
        
        // Watchdog and observer references
        this.subtableWatchdog = null;
        this.subtableObserver = null;
        
        // Scroll state tracking to prevent restoration during scrolling
        this.isScrolling = false;
        this.scrollEndTimeout = null;
    }

    // Override generateRowId for stable matchup identification
    generateRowId(data) {
        if (data["Matchup ID"] != null) {
            return `matchup_${data["Matchup ID"]}`;
        }
        // Fallback to matchup string
        if (data["Matchup"]) {
            return `matchup_${data["Matchup"].replace(/[^a-zA-Z0-9]/g, '_')}`;
        }
        // Last resort fallback
        return super.generateRowId ? super.generateRowId(data) : `matchup_unknown_${Date.now()}`;
    }

    initialize() {
        const mobile = isMobile();
        const tablet = isTablet();
        const isSmallScreen = mobile || tablet;
        
        const config = {
            ...this.tableConfig,
            virtualDom: false, // Disable for proper subtable rendering
            pagination: false,
            layoutColumnsOnNewData: false,
            responsiveLayout: false,
            maxHeight: "600px",
            height: "600px",
            placeholder: "Loading matchups...",
            layout: "fitColumns",
            
            columns: this.getColumns(isSmallScreen),
            initialSort: [
                {column: "Matchup ID", dir: "asc"}
            ],
            rowFormatter: this.createRowFormatter(),
            dataLoaded: (data) => {
                this.dataLoaded = true;
                
                // Initialize expansion state for each row
                data.forEach(row => {
                    if (row._expanded === undefined) {
                        row._expanded = false;
                    }
                });
                
                // Pre-fetch defense and player data for all matchups
                this.prefetchSubtableData(data);
            },
            ajaxError: (error) => {
                console.error("Error loading matchups data:", error);
            }
        };

        this.table = new Tabulator(this.elementId, config);
        this.setupRowExpansion();
        
        this.table.on("tableBuilt", () => {
            // Setup MutationObserver for subtable preservation
            this.setupSubtableObserver();
            
            // If data is already loaded (from cache), prefetch subtable data
            const data = this.table.getData();
            
            if (data.length > 0 && this.defenseDataCache.size === 0) {
                this.prefetchSubtableData(data);
            }
            
            // Calculate widths to reserve space for scrollbar (desktop only)
            setTimeout(() => {
                this.calculateAndApplyWidths();
            }, 200);
        });
        
        // Handle render complete - restore any missing subtables and recalculate widths
        this.table.on("renderComplete", () => {
            if (this.subtableDataReady && !this.isScrolling) {
                setTimeout(() => {
                    this.restoreExpandedSubtables();
                }, 50);
            }
            
            // Recalculate widths after render (handles tab switching)
            setTimeout(() => {
                this.calculateAndApplyWidths();
            }, 100);
        });
        
        // Handle data filtering/sorting - these can cause row re-renders
        this.table.on("dataFiltered", () => {
            if (this.subtableDataReady) {
                setTimeout(() => {
                    this.restoreExpandedSubtables();
                }, 100);
            }
        });
        
        this.table.on("dataSorted", () => {
            if (this.subtableDataReady) {
                setTimeout(() => {
                    this.restoreExpandedSubtables();
                }, 100);
            }
        });
        
        // Handle window resize - recalculate widths
        window.addEventListener('resize', this.debounce(() => {
            if (this.table && this.table.getDataCount() > 0) {
                this.calculateAndApplyWidths();
            }
        }, 250));
    }

    getColumns(isSmallScreen = false) {
        const self = this;
        
        // Total formatter - force 1 decimal place
        const totalFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '' || value === '-') return '-';
            const str = String(value);
            
            // Check if it has "O/U" prefix
            if (str.includes('O/U')) {
                const match = str.match(/O\/U\s*([\d.]+)/);
                if (match && match[1]) {
                    const num = parseFloat(match[1]);
                    if (!isNaN(num)) {
                        return 'O/U ' + num.toFixed(1);
                    }
                }
                return str;
            }
            
            // Try to parse as number
            const num = parseFloat(str);
            if (!isNaN(num)) {
                return num.toFixed(1);
            }
            
            return str;
        };
        
        // Responsive minWidth values - smaller on mobile/tablet
        const matchupMinWidth = isSmallScreen ? 120 : 200;
        const spreadMinWidth = isSmallScreen ? 60 : 100;
        const totalMinWidth = isSmallScreen ? 60 : 100;
        
        return [
            // Hidden Matchup ID for sorting
            {
                title: "Matchup ID",
                field: "Matchup ID",
                visible: false,
                sorter: "number"
            },
            // UPDATED: Matchup column now 50% width
            {
                title: "Matchup", 
                field: "Matchup", 
                width: "50%",
                minWidth: matchupMinWidth,
                sorter: "string",
                resizable: false,
                formatter: this.createNameFormatter(),
                hozAlign: "left",
                cssClass: "matchup-cell"
            },
            // UPDATED: Spread column now 25% width with custom numeric sorter
            // Extracts numeric value from "TEAM -X.X" or "TEAM +X.X" format
            {
                title: "Spread", 
                field: "Spread", 
                width: "25%",
                minWidth: spreadMinWidth,
                sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                    // Extract numeric value from spread format (e.g., "MIL -6.0" or "PHX +6.0")
                    const getNum = (val) => {
                        if (val === null || val === undefined || val === '' || val === '-') return -9999;
                        const str = String(val);
                        // Try to extract signed number (handles -X.X or +X.X)
                        const match = str.match(/([+-]?\d+\.?\d*)\s*$/);
                        if (match && match[1]) {
                            return parseFloat(match[1]);
                        }
                        // Fallback: try to find any number with optional sign
                        const numMatch = str.match(/([+-]?\d+\.?\d*)/);
                        if (numMatch && numMatch[1]) {
                            return parseFloat(numMatch[1]);
                        }
                        return -9999;
                    };
                    
                    const aNum = getNum(a);
                    const bNum = getNum(b);
                    
                    return aNum - bNum;
                },
                resizable: false,
                hozAlign: "center"
            },
            // UPDATED: Total column now 25% width with formatter for 1 decimal place
            // Custom sorter extracts numeric value from "O/U XXX.X" format
            {
                title: "Total", 
                field: "Total", 
                width: "25%",
                minWidth: totalMinWidth,
                sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                    // Extract numeric value from O/U format
                    const getNum = (val) => {
                        if (val === null || val === undefined || val === '' || val === '-') return -1;
                        const str = String(val);
                        // Try to extract number after "O/U"
                        const match = str.match(/O\/U\s*([\d.]+)/);
                        if (match && match[1]) {
                            return parseFloat(match[1]);
                        }
                        // Fallback: try to parse as number directly
                        const num = parseFloat(str);
                        return isNaN(num) ? -1 : num;
                    };
                    
                    const aNum = getNum(a);
                    const bNum = getNum(b);
                    
                    return aNum - bNum;
                },
                resizable: false,
                hozAlign: "center",
                formatter: totalFormatter
            }
        ];
    }

    // Simple debounce helper
    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Calculate and apply widths to always reserve space for vertical scrollbar
    // This prevents horizontal scrollbar from appearing when subtables expand
    calculateAndApplyWidths() {
        if (!this.table) {
            console.log('Matchups calculateAndApplyWidths: table not ready');
            return;
        }
        
        const tableElement = this.table.element;
        if (!tableElement) {
            console.log('Matchups calculateAndApplyWidths: tableElement not ready');
            return;
        }
        
        // Only apply on desktop
        if (isMobile() || isTablet()) {
            return;
        }
        
        try {
            // CRITICAL: Force tableholder to always show scrollbar track
            // This reserves space for the scrollbar even when not needed
            const tableHolder = tableElement.querySelector('.tabulator-tableholder');
            if (tableHolder) {
                tableHolder.style.overflowY = 'scroll';
            }
            
            // Get all columns and calculate total width
            const columns = this.table.getColumns();
            let totalColumnWidth = 0;
            
            columns.forEach(col => {
                if (col.isVisible()) {
                    totalColumnWidth += col.getWidth();
                }
            });
            
            // ALWAYS add scrollbar width to reserve space for vertical scrollbar
            // This prevents horizontal scrollbar from appearing when subtables expand
            const SCROLLBAR_WIDTH = 17;
            const totalWidthWithScrollbar = totalColumnWidth + SCROLLBAR_WIDTH;
            
            // Apply width to table element
            tableElement.style.width = totalWidthWithScrollbar + 'px';
            tableElement.style.minWidth = totalWidthWithScrollbar + 'px';
            tableElement.style.maxWidth = totalWidthWithScrollbar + 'px';
            
            // Also constrain internal elements
            if (tableHolder) {
                tableHolder.style.width = totalWidthWithScrollbar + 'px';
                tableHolder.style.maxWidth = totalWidthWithScrollbar + 'px';
            }
            
            const tabulatorHeader = tableElement.querySelector('.tabulator-header');
            if (tabulatorHeader) {
                tabulatorHeader.style.width = totalWidthWithScrollbar + 'px';
            }
            
            // Also constrain the table container
            const tableContainer = tableElement.closest('.table-container');
            if (tableContainer) {
                tableContainer.style.width = 'fit-content';
                tableContainer.style.minWidth = 'auto';
                tableContainer.style.maxWidth = 'none';
            }
            
            console.log(`Matchups: Set table width to ${totalWidthWithScrollbar}px (columns: ${totalColumnWidth}px + scrollbar: ${SCROLLBAR_WIDTH}px)`);
            
        } catch (error) {
            console.error('Error in Matchups calculateAndApplyWidths:', error);
        }
    }

    // Expand Matchup column to fill remaining container width (desktop only)
    // Also called by TabManager/main.js when switching tabs or resizing
    expandMatchupColumnToFill() {
        if (!this.table) return;
        
        // First, recalculate widths to ensure scrollbar space is reserved
        this.calculateAndApplyWidths();
        
        const tableElement = this.table.element;
        const containerWidth = tableElement.offsetWidth;
        
        // Get current total width of all columns
        let totalColumnWidth = 0;
        const columns = this.table.getColumns();
        columns.forEach(col => {
            if (col.isVisible()) {
                totalColumnWidth += col.getWidth();
            }
        });
        
        // Calculate remaining space
        const remainingSpace = containerWidth - totalColumnWidth - 20; // 20px buffer
        
        if (remainingSpace > 0) {
            const matchupColumn = this.table.getColumn("Matchup");
            if (matchupColumn) {
                const currentWidth = matchupColumn.getWidth();
                matchupColumn.setWidth(currentWidth + remainingSpace);
            }
        }
    }

    // Alias for main.js compatibility - main.js calls expandNameColumnToFill on all tables
    expandNameColumnToFill() {
        this.expandMatchupColumnToFill();
    }

    // Force recalculate widths - called by TabManager when switching tabs
    forceRecalculateWidths() {
        this.calculateAndApplyWidths();
    }

    // Create name formatter with expand icon
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
            text.style.cssText = 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
            
            container.appendChild(icon);
            container.appendChild(text);
            
            return container;
        };
    }

    // Row formatter for expanded state - CRITICAL for state preservation
    // This is called every time Tabulator renders/re-renders a row
    createRowFormatter() {
        const self = this;
        
        return (row) => {
            const data = row.getData();
            const rowElement = row.getElement();
            
            if (data._expanded) {
                rowElement.classList.add('row-expanded');
                
                // Only restore subtable if NOT actively scrolling and cache is ready
                const existingSubtable = rowElement.querySelector('.subrow-container');
                if (!existingSubtable && self.subtableDataReady && !self.isScrolling) {
                    self.createAndAppendSubtable(rowElement, data, true);
                }
            } else {
                rowElement.classList.remove('row-expanded');
                // Clean up any orphaned subtables
                const existingSubrow = rowElement.querySelector('.subrow-container');
                if (existingSubrow) {
                    existingSubrow.remove();
                }
            }
        };
    }

    // Create and append subtable directly
    // Subtables have internal scrolling to prevent main table scroll issues
    createAndAppendSubtable(rowElement, data, preserveScroll = true) {
        // Remove existing if any
        const existing = rowElement.querySelector('.subrow-container');
        if (existing) {
            existing.remove();
        }
        
        // Get scroll position BEFORE adding content
        const tableHolder = this.table?.element?.querySelector('.tabulator-tableholder');
        const scrollTopBefore = preserveScroll && tableHolder ? tableHolder.scrollTop : null;
        
        const holderEl = document.createElement("div");
        holderEl.classList.add('subrow-container');
        
        // Responsive padding and width constraints
        const isSmallScreen = isMobile() || isTablet();
        holderEl.style.cssText = `
            padding: ${isSmallScreen ? '8px 10px' : '15px 20px'};
            background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
            border-top: 2px solid #f97316;
            margin: 0;
            display: block;
            width: 100%;
            ${isSmallScreen ? 'max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch;' : ''}
            position: relative;
            z-index: 1;
        `;
        
        try {
            this.createSubtableContent(holderEl, data);
        } catch (error) {
            console.error("Error creating matchups subtable content:", error);
            holderEl.innerHTML = '<div style="padding: 10px; color: red;">Error loading details</div>';
        }
        
        rowElement.appendChild(holderEl);
        
        // Restore scroll position AFTER adding content
        if (scrollTopBefore !== null && tableHolder) {
            requestAnimationFrame(() => {
                tableHolder.scrollTop = scrollTopBefore;
            });
        }
    }

    // Setup MutationObserver to watch for subtable removal and restore them
    setupSubtableObserver() {
        const self = this;
        
        // Create observer that watches for removed subtables
        this.subtableObserver = new MutationObserver((mutations) => {
            if (!self.subtableDataReady || !self.table) return;
            
            mutations.forEach((mutation) => {
                mutation.removedNodes.forEach((node) => {
                    if (node.classList && node.classList.contains('subrow-container')) {
                        if (self.isScrolling) return;
                        
                        const rowElement = mutation.target;
                        if (rowElement.classList.contains('tabulator-row')) {
                            const rows = self.table.getRows();
                            for (const row of rows) {
                                if (row.getElement() === rowElement) {
                                    const data = row.getData();
                                    if (data._expanded) {
                                        setTimeout(() => {
                                            if (!rowElement.querySelector('.subrow-container') && data._expanded) {
                                                self.createAndAppendSubtable(rowElement, data, true);
                                            }
                                        }, 10);
                                    }
                                    break;
                                }
                            }
                        }
                    }
                });
            });
        });
        
        // Observe the table holder for subtree modifications
        const tableHolder = this.table.element.querySelector('.tabulator-tableholder');
        if (tableHolder) {
            this.subtableObserver.observe(tableHolder, {
                childList: true,
                subtree: true
            });
            
            // Setup scroll state tracking
            this.isScrolling = false;
            this.scrollEndTimeout = null;
            
            tableHolder.addEventListener('scroll', () => {
                self.isScrolling = true;
                
                if (self.scrollEndTimeout) {
                    clearTimeout(self.scrollEndTimeout);
                }
                
                self.scrollEndTimeout = setTimeout(() => {
                    self.isScrolling = false;
                    self.restoreExpandedSubtables();
                }, 200);
            }, { passive: true });
        }
    }

    // Periodic check to ensure expanded rows have their subtables
    startSubtableWatchdog() {
        const self = this;
        
        if (this.subtableWatchdog) {
            clearInterval(this.subtableWatchdog);
        }
        
        // Check every 500ms for missing subtables (but not during scrolling)
        this.subtableWatchdog = setInterval(() => {
            if (!self.table || !self.subtableDataReady || self.isScrolling) return;
            
            const rows = self.table.getRows();
            
            rows.forEach(row => {
                const data = row.getData();
                if (data._expanded) {
                    const rowElement = row.getElement();
                    if (rowElement && !rowElement.querySelector('.subrow-container')) {
                        self.createAndAppendSubtable(rowElement, data, true);
                    }
                }
            });
        }, 500);
    }

    // Stop the watchdog (call when table is destroyed)
    stopSubtableWatchdog() {
        if (this.subtableWatchdog) {
            clearInterval(this.subtableWatchdog);
            this.subtableWatchdog = null;
        }
        if (this.subtableObserver) {
            this.subtableObserver.disconnect();
            this.subtableObserver = null;
        }
        if (this.scrollEndTimeout) {
            clearTimeout(this.scrollEndTimeout);
            this.scrollEndTimeout = null;
        }
    }

    // Setup row expansion click handlers
    setupRowExpansion() {
        const self = this;
        
        this.table.on("cellClick", function(e, cell) {
            if (cell.getColumn().getField() !== "Matchup") return;
            
            const row = cell.getRow();
            const data = row.getData();
            
            // Toggle expanded state
            data._expanded = !data._expanded;
            const isExpanded = data._expanded;
            
            // Handle expansion/collapse
            self.handleRowExpansion(row, isExpanded);
            
            // Reformat the row to update the icon via the cell formatter
            // Use setTimeout to ensure DOM operations from handleRowExpansion complete first
            setTimeout(() => {
                row.reformat();
            }, 0);
        });
    }

    // Handle row expansion/collapse
    handleRowExpansion(row, expanded) {
        const self = this;
        const rowElement = row.getElement();
        const data = row.getData();
        
        if (expanded) {
            // Check if subtable already exists
            if (rowElement.querySelector('.subrow-container')) return;
            
            rowElement.classList.add('row-expanded');
            
            // Check if cache is ready
            if (!this.subtableDataReady) {
                // Cache not ready - show loading state
                const loadingEl = document.createElement("div");
                loadingEl.classList.add('subrow-container', 'subrow-loading');
                loadingEl.style.cssText = `
                    padding: 15px 20px;
                    background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
                    border-top: 2px solid #f97316;
                    margin: 0;
                    display: block;
                    width: 100%;
                    text-align: center;
                    color: #666;
                `;
                loadingEl.innerHTML = 'Loading matchup data...';
                rowElement.appendChild(loadingEl);
                return;
            }
            
            // Create and append subtable
            this.createAndAppendSubtable(rowElement, data);
        } else {
            const existingSubrow = rowElement.querySelector('.subrow-container');
            if (existingSubrow) {
                existingSubrow.remove();
                rowElement.classList.remove('row-expanded');
            }
        }
    }

    // Parse matchup string to get home/away teams
    // FIXED: Now handles text month date formats (e.g., "Jan 5")
    parseMatchup(matchupStr) {
        if (!matchupStr) return { away: null, home: null };
        
        // Format: "Away Team @ Home Team" or "Away Team @ Home Team 1/4 7:00PM" or "Away Team @ Home Team Jan 5 7:00PM"
        const parts = matchupStr.split('@');
        if (parts.length !== 2) return { away: null, home: null };
        
        const awayTeam = parts[0].trim();
        
        // Remove date/time if present - handles multiple formats:
        // - "Jan 5 7:00PM" or ", Jan 5" (text month format)
        // - "1/4 7:00PM" (numeric date format)
        // - "7:00PM" (time only)
        const homeTeam = parts[1]
            .replace(/,?\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}.*$/i, '') // Text month format
            .replace(/\s+\d{1,2}:\d{2}\s*(AM|PM)?.*$/i, '') // Time format
            .replace(/\s*\d{1,2}\/\d{1,2}.*$/, '') // Numeric date format
            .trim();
        
        return { away: awayTeam, home: homeTeam };
    }

    // Get team abbreviation from full name
    getTeamAbbrev(fullName) {
        // Direct lookup
        if (this.teamAbbrevMap[fullName]) {
            return this.teamAbbrevMap[fullName];
        }
        
        // Partial match
        for (const [name, abbrev] of Object.entries(this.teamAbbrevMap)) {
            if (fullName.includes(name) || name.includes(fullName)) {
                return abbrev;
            }
        }
        
        return null;
    }

    // Get full team name from abbreviation
    getTeamFullName(abbrev) {
        return this.teamNameMap[abbrev] || abbrev;
    }

    // Prefetch defense and player data for all matchups
    async prefetchSubtableData(mainData) {
        const matchupIds = mainData.map(row => row["Matchup ID"]).filter(id => id != null);
        
        if (matchupIds.length === 0) return;
        
        try {
            // Fetch defense data
            const defenseData = await this.fetchFromEndpoint(this.ENDPOINTS.DEFENSE);
            if (defenseData && defenseData.length > 0) {
                defenseData.forEach(row => {
                    const matchupId = row["Matchup ID"];
                    if (!this.defenseDataCache.has(matchupId)) {
                        this.defenseDataCache.set(matchupId, []);
                    }
                    this.defenseDataCache.get(matchupId).push(row);
                });
            }
            
            // Fetch player data
            const playerData = await this.fetchFromEndpoint(this.ENDPOINTS.PLAYERS);
            if (playerData && playerData.length > 0) {
                playerData.forEach(row => {
                    const matchupId = row["Matchup ID"];
                    if (!this.playersDataCache.has(matchupId)) {
                        this.playersDataCache.set(matchupId, []);
                    }
                    this.playersDataCache.get(matchupId).push(row);
                });
            }
            
            // Mark cache as ready
            this.subtableDataReady = true;
            
            // Start the watchdog to ensure subtables stay in place
            this.startSubtableWatchdog();
            
            // Restore any expanded subtables
            if (this.table) {
                this.restoreExpandedSubtables();
            }
            
        } catch (error) {
            console.error("Error prefetching subtable data:", error);
        }
    }

    // Restore subtables for any rows that are marked as expanded
    restoreExpandedSubtables() {
        if (!this.table || !this.subtableDataReady || this.isScrolling) return;
        
        const rows = this.table.getRows();
        
        rows.forEach(row => {
            const data = row.getData();
            if (data._expanded) {
                const rowElement = row.getElement();
                if (rowElement && !rowElement.querySelector('.subrow-container')) {
                    this.createAndAppendSubtable(rowElement, data, true);
                }
            }
        });
    }

    // Fetch data from a specific endpoint
    async fetchFromEndpoint(endpoint) {
        const url = `https://hcwolbvmffkmjcxsumwn.supabase.co/rest/v1/${endpoint}`;
        const headers = {
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjd29sYnZtZmZrbWpjeHN1bXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNDQzMTIsImV4cCI6MjA1NTkyMDMxMn0.tM4RwXZpZM6ZHuFFMhWcKYLT3E4NA6Ig90CHw7QtJf0",
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjd29sYnZtZmZrbWpjeHN1bXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNDQzMTIsImV4cCI6MjA1NTkyMDMxMn0.tM4RwXZpZM6ZHuFFMhWcKYLT3E4NA6Ig90CHw7QtJf0",
            "Content-Type": "application/json"
        };
        
        try {
            const response = await fetch(url, { headers });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching from ${endpoint}:`, error);
            return null;
        }
    }

    // Create all subtable content (4 stacked tables) - INSIDE A SCROLLABLE CONTAINER
    createSubtableContent(container, data) {
        const matchupId = data["Matchup ID"];
        const matchupStr = data["Matchup"];
        
        // Parse home/away teams
        const { away: awayTeamFull, home: homeTeamFull } = this.parseMatchup(matchupStr);
        const awayAbbrev = this.getTeamAbbrev(awayTeamFull);
        const homeAbbrev = this.getTeamAbbrev(homeTeamFull);
        
        // Get cached data
        const defenseData = this.defenseDataCache.get(matchupId) || [];
        const playerData = this.playersDataCache.get(matchupId) || [];
        
        // Get lineup status and B2B info from main data
        const lineupAway = data["Lineup Status Away"] || '';
        const lineupHome = data["Lineup Status Home"] || '';
        const b2bAway = data["B2B Away"] === 'Yes';
        const b2bHome = data["B2B Home"] === 'Yes';
        
        // Filter defense data by team
        const awayDefense = defenseData.filter(d => d["Team"] === awayAbbrev);
        const homeDefense = defenseData.filter(d => d["Team"] === homeAbbrev);
        
        // Filter player data by team
        const awayPlayers = playerData.filter(p => p["Team"] === awayAbbrev);
        const homePlayers = playerData.filter(p => p["Team"] === homeAbbrev);
        
        // Determine lineup type (Expected/Confirmed) from Games table
        const awayLineupType = this.getLineupType(lineupAway);
        const homeLineupType = this.getLineupType(lineupHome);
        
        // Create wrapper - THIS IS NOW THE SCROLLABLE CONTAINER
        // Max-height allows viewing all content by scrolling within the subtable
        // This prevents the main table from needing to scroll (which causes row recycling issues)
        const wrapper = document.createElement('div');
        wrapper.className = 'subtable-scroll-wrapper';
        
        // Responsive overflow - allow horizontal scroll on mobile to prevent expanding table
        const isSmallScreen = isMobile() || isTablet();
        wrapper.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: ${isSmallScreen ? '8px' : '15px'};
            max-height: ${isSmallScreen ? '350px' : '450px'};
            overflow-y: scroll;
            overflow-x: ${isSmallScreen ? 'auto' : 'hidden'};
            box-sizing: border-box;
            ${isSmallScreen ? 'max-width: 100%; -webkit-overflow-scrolling: touch;' : ''}
        `;
        
        // Inject scrollbar styles if not already done
        if (!document.getElementById('subtable-scrollbar-styles')) {
            const style = document.createElement('style');
            style.id = 'subtable-scrollbar-styles';
            style.textContent = `
                .subtable-scroll-wrapper::-webkit-scrollbar {
                    width: 8px;
                }
                .subtable-scroll-wrapper::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 4px;
                }
                .subtable-scroll-wrapper::-webkit-scrollbar-thumb {
                    background: #c1c1c1;
                    border-radius: 4px;
                }
                .subtable-scroll-wrapper::-webkit-scrollbar-thumb:hover {
                    background: #a1a1a1;
                }
                /* Firefox */
                .subtable-scroll-wrapper {
                    scrollbar-width: thin;
                    scrollbar-color: #c1c1c1 #f1f1f1;
                }
                
                /* MOBILE: Constrain matchups table to prevent subtables from expanding it */
                @media screen and (max-width: 1024px) {
                    #matchups-table .tabulator {
                        width: 100% !important;
                        min-width: 0 !important;
                        max-width: 100% !important;
                    }
                    
                    #matchups-table .tabulator-tableholder {
                        overflow-x: auto !important;
                        -webkit-overflow-scrolling: touch !important;
                    }
                    
                    #matchups-table .tabulator-row {
                        max-width: 100% !important;
                        overflow: visible !important;
                    }
                    
                    #matchups-table .subrow-container {
                        max-width: 100% !important;
                        overflow-x: auto !important;
                    }
                    
                    #matchups-table .subtable-scroll-wrapper {
                        overflow-x: auto !important;
                        max-width: 100% !important;
                    }
                    
                    /* Make subtable HTML tables scroll within their container */
                    #matchups-table .subtable-scroll-wrapper > div {
                        min-width: fit-content !important;
                    }
                    
                    #matchups-table .subtable-scroll-wrapper table {
                        min-width: 500px !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // 1. Away Defense
        const awayDefenseTable = this.createDefenseSubtable(
            awayDefense,
            `${awayTeamFull || awayAbbrev} (Away) Stats Against`
        );
        wrapper.appendChild(awayDefenseTable);
        
        // 2. Home Players
        const homePlayersTable = this.createPlayersSubtable(
            homePlayers,
            `${homeTeamFull || homeAbbrev} (Home) ${homeLineupType} Lineup${b2bHome ? ' - B2B Game' : ''}`,
            'Home'
        );
        wrapper.appendChild(homePlayersTable);
        
        // 3. Home Defense
        const homeDefenseTable = this.createDefenseSubtable(
            homeDefense,
            `${homeTeamFull || homeAbbrev} (Home) Stats Against`
        );
        wrapper.appendChild(homeDefenseTable);
        
        // 4. Away Players
        const awayPlayersTable = this.createPlayersSubtable(
            awayPlayers,
            `${awayTeamFull || awayAbbrev} (Away) ${awayLineupType} Lineup${b2bAway ? ' - B2B Game' : ''}`,
            'Away'
        );
        wrapper.appendChild(awayPlayersTable);
        
        container.appendChild(wrapper);
    }

    // Determine lineup type from Games table lineup status
    getLineupType(lineupStatus) {
        if (lineupStatus) {
            if (lineupStatus.includes('Confirmed')) return 'Confirmed';
            if (lineupStatus.includes('Expected')) return 'Expected';
        }
        
        return 'Expected';
    }

    // Helper to get rank cell style for defense subtables
    // Returns inline style string with background color if applicable
    getRankCellStyle(value, baseStyle) {
        const bgColor = getRankBackgroundColor(value);
        if (bgColor) {
            return `${baseStyle} background-color: ${bgColor};`;
        }
        return baseStyle;
    }

    // Create defense subtable - UPDATED with # prefix on prop ranks and background colors
    // FIXED: Responsive min-widths for mobile
    createDefenseSubtable(defenseData, title) {
        const container = document.createElement('div');
        container.style.cssText = 'background: white; padding: 12px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);';
        
        // Title
        const titleEl = document.createElement('h4');
        titleEl.textContent = title;
        titleEl.style.cssText = 'margin: 0 0 10px 0; color: #f97316; font-size: 13px; font-weight: 600;';
        container.appendChild(titleEl);
        
        if (!defenseData || defenseData.length === 0) {
            const noData = document.createElement('div');
            noData.textContent = 'No defense data available';
            noData.style.cssText = 'color: #666; font-size: 12px; padding: 10px;';
            container.appendChild(noData);
            return container;
        }
        
        // Get pace value (same for both splits)
        const paceValue = defenseData[0]?.["Pace"] || '-';
        
        // Sort by split (Full Season first, then Last 30 Days)
        const sortedData = [...defenseData].sort((a, b) => {
            if (a["Split"] === 'Full Season') return -1;
            if (b["Split"] === 'Full Season') return 1;
            return 0;
        });
        
        // Responsive min-widths - smaller on mobile
        const isSmallScreen = isMobile() || isTablet();
        const paceMinWidth = isSmallScreen ? '40px' : '60px';
        const splitMinWidth = isSmallScreen ? '50px' : '70px';
        const statMinWidth = isSmallScreen ? '35px' : '50px';
        const cellPadding = isSmallScreen ? '2px 4px' : '4px 8px';
        const fontSize = isSmallScreen ? '9px' : '11px';
        
        // Base cell style for data cells
        const baseCellStyle = `padding: ${cellPadding}; text-align: center;`;
        
        // Create table
        const table = document.createElement('table');
        table.style.cssText = `font-size: ${fontSize}; border-collapse: collapse; width: 100%;`;
        
        // Header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr style="background: #f8f9fa;">
                <th style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; min-width: ${paceMinWidth};">Season Pace Rank</th>
                <th style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; min-width: ${splitMinWidth};">Split</th>
                <th colspan="5" style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; background: #f0f0f0;">Offensive Ranks (Avg)</th>
                <th colspan="3" style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; background: #e8e8e8;">Rebounds Ranks (Avg)</th>
                <th colspan="2" style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; background: #f0f0f0;">Defensive Ranks (Avg)</th>
                <th colspan="2" style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; background: #e8e8e8;">Combos Ranks (Tot)</th>
            </tr>
            <tr style="background: #fafafa;">
                <th style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd;"></th>
                <th style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd;"></th>
                <th style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; min-width: ${statMinWidth};">Points</th>
                <th style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; min-width: ${statMinWidth};">3PM</th>
                <th style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; min-width: ${statMinWidth};">FTA</th>
                <th style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; min-width: ${statMinWidth};">Assists</th>
                <th style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; min-width: ${statMinWidth};">TOs</th>
                <th style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; min-width: ${statMinWidth};">Off</th>
                <th style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; min-width: ${statMinWidth};">Def</th>
                <th style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; min-width: ${statMinWidth};">Total</th>
                <th style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; min-width: ${statMinWidth};">Blocks</th>
                <th style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; min-width: ${statMinWidth};">Steals</th>
                <th style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; min-width: ${statMinWidth};">DD</th>
                <th style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; min-width: ${statMinWidth};">TD</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Body
        const tbody = document.createElement('tbody');
        sortedData.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.style.cssText = index % 2 === 1 ? 'background: #fafafa;' : '';
            
            // Pace cell (merged for first row) - add # prefix and background color
            if (index === 0) {
                const paceDisplay = this.formatRankWithHash(paceValue);
                const paceStyle = this.getRankCellStyle(paceValue, `${baseCellStyle} border-right: 1px solid #eee; vertical-align: middle; font-weight: 600;`);
                tr.innerHTML = `
                    <td rowspan="${sortedData.length}" style="${paceStyle}">${paceDisplay}</td>
                `;
            }
            
            // Format all rank values with # prefix and get background color styles
            tr.innerHTML += `
                <td style="${baseCellStyle}">${row["Split"] || '-'}</td>
                <td style="${this.getRankCellStyle(row["Pts"], baseCellStyle)}">${this.formatRankWithHash(row["Pts"])}</td>
                <td style="${this.getRankCellStyle(row["3P"], baseCellStyle)}">${this.formatRankWithHash(row["3P"])}</td>
                <td style="${this.getRankCellStyle(row["FTA"], baseCellStyle)}">${this.formatRankWithHash(row["FTA"])}</td>
                <td style="${this.getRankCellStyle(row["Assists"], baseCellStyle)}">${this.formatRankWithHash(row["Assists"])}</td>
                <td style="${this.getRankCellStyle(row["TOs"], baseCellStyle)}">${this.formatRankWithHash(row["TOs"])}</td>
                <td style="${this.getRankCellStyle(row["ORebs"], baseCellStyle)}">${this.formatRankWithHash(row["ORebs"])}</td>
                <td style="${this.getRankCellStyle(row["DRebs"], baseCellStyle)}">${this.formatRankWithHash(row["DRebs"])}</td>
                <td style="${this.getRankCellStyle(row["Rebs"], baseCellStyle)}">${this.formatRankWithHash(row["Rebs"])}</td>
                <td style="${this.getRankCellStyle(row["Blocks"], baseCellStyle)}">${this.formatRankWithHash(row["Blocks"])}</td>
                <td style="${this.getRankCellStyle(row["Steals"], baseCellStyle)}">${this.formatRankWithHash(row["Steals"])}</td>
                <td style="${this.getRankCellStyle(row["DD"], baseCellStyle)}">${this.formatRankWithHash(row["DD"])}</td>
                <td style="${this.getRankCellStyle(row["TD"], baseCellStyle)}">${this.formatRankWithHash(row["TD"])}</td>
            `;
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        
        container.appendChild(table);
        return container;
    }

    // Create players subtable - UPDATED for new injured player handling
    // FIXED: Responsive min-widths for mobile
    createPlayersSubtable(playerData, title, homeAway) {
        const container = document.createElement('div');
        container.style.cssText = 'background: white; padding: 12px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);';
        
        // Title
        const titleEl = document.createElement('h4');
        titleEl.textContent = title;
        titleEl.style.cssText = 'margin: 0 0 10px 0; color: #f97316; font-size: 13px; font-weight: 600;';
        container.appendChild(titleEl);
        
        if (!playerData || playerData.length === 0) {
            const noData = document.createElement('div');
            noData.textContent = 'No player data available';
            noData.style.cssText = 'color: #666; font-size: 12px; padding: 10px;';
            container.appendChild(noData);
            return container;
        }
        
// UPDATED: New sorting logic
        // Injured players (Lineup="Injury") now have single rows with Split="Full Season"
        // Sort: Active players first (Starters before Bench, alphabetically within each, Full Season before Last 30 Days)
        // Then Out players, then OFS players at very bottom (alphabetically within each)
        
        // Separate players into categories based on Lineup field and injury status
        const activePlayers = [];
        const outPlayers = [];
        const ofsPlayers = [];
        
        playerData.forEach(row => {
            const lineup = row["Lineup"] || '';
            const playerName = row["Player"] || '';
            
            if (lineup === 'Injury') {
                // Check if OFS or Out based on player name
                if (playerName.includes('(OFS)')) {
                    ofsPlayers.push(row);
                } else {
                    // Includes (Out) and any other injury status
                    outPlayers.push(row);
                }
            } else {
                // Active player
                activePlayers.push(row);
            }
        });
        
        // Sort active players: Starters before Bench, then by name, then Full Season before Last 30 Days
        activePlayers.sort((a, b) => {
            // First: Starters vs Bench
            const aStarter = (a["Lineup"] || '').includes('Starter') ? 0 : 1;
            const bStarter = (b["Lineup"] || '').includes('Starter') ? 0 : 1;
            if (aStarter !== bStarter) return aStarter - bStarter;
            
            // Second: Group by player name
            const aName = a["Player"] || '';
            const bName = b["Player"] || '';
            if (aName !== bName) return aName.localeCompare(bName);
            
            // Third: Full Season before Last 30 Days
            const aSplit = (a["Split"] || '').includes('Full Season') ? 0 : 1;
            const bSplit = (b["Split"] || '').includes('Full Season') ? 0 : 1;
            return aSplit - bSplit;
        });
        
        // Sort Out players alphabetically by name
        outPlayers.sort((a, b) => {
            const aName = a["Player"] || '';
            const bName = b["Player"] || '';
            return aName.localeCompare(bName);
        });
        
        // Sort OFS players alphabetically by name
        ofsPlayers.sort((a, b) => {
            const aName = a["Player"] || '';
            const bName = b["Player"] || '';
            return aName.localeCompare(bName);
        });
        
        // Combine: Active players, then Out, then OFS at very bottom
        const sortedData = [...activePlayers, ...outPlayers, ...ofsPlayers];
        
        // Responsive min-widths - smaller on mobile
        const isSmallScreen = isMobile() || isTablet();
        const playerMinWidth = isSmallScreen ? '120px' : '200px';
        const statMinWidth = isSmallScreen ? '35px' : '50px';
        const cellPadding = isSmallScreen ? '2px 4px' : '4px 8px';
        const fontSize = isSmallScreen ? '9px' : '11px';
        
        // Create table
        const table = document.createElement('table');
        table.style.cssText = `font-size: ${fontSize}; border-collapse: collapse; width: 100%;`;
        
        // Header - UPDATED: Changed "FT" to "FTM", renamed Scoring to Offensive, moved TOs
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr style="background: #f8f9fa;">
                <th style="padding: ${cellPadding}; text-align: left; border-bottom: 1px solid #ddd; min-width: ${playerMinWidth};">Player</th>
                <th colspan="5" style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; background: #f0f0f0;">Offensive Medians</th>
                <th colspan="3" style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; background: #e8e8e8;">Rebounds Medians</th>
                <th colspan="2" style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; background: #f0f0f0;">Defensive Medians</th>
                <th colspan="2" style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; background: #e8e8e8;">Combos Totals</th>
            </tr>
            <tr style="background: #fafafa;">
                <th style="padding: ${cellPadding}; text-align: left; border-bottom: 1px solid #ddd;"></th>
                <th style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; min-width: ${statMinWidth};">Points</th>
                <th style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; min-width: ${statMinWidth};">3PM</th>
                <th style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; min-width: ${statMinWidth};">FTM</th>
                <th style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; min-width: ${statMinWidth};">Assists</th>
                <th style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; min-width: ${statMinWidth};">TOs</th>
                <th style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; min-width: ${statMinWidth};">Off</th>
                <th style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; min-width: ${statMinWidth};">Def</th>
                <th style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; min-width: ${statMinWidth};">Total</th>
                <th style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; min-width: ${statMinWidth};">Blocks</th>
                <th style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; min-width: ${statMinWidth};">Steals</th>
                <th style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; min-width: ${statMinWidth};">DD</th>
                <th style="padding: ${cellPadding}; text-align: center; border-bottom: 1px solid #ddd; min-width: ${statMinWidth};">TD</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Body
        const tbody = document.createElement('tbody');
        sortedData.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.style.cssText = index % 2 === 1 ? 'background: #fafafa;' : '';
            
            const playerName = row["Player"] || '-';
            const lineup = row["Lineup"] || '';
            const split = row["Split"] || '';
            const games = row["Games"] || '0';
            const minutes = this.formatMinutes(row["Minutes"]);
            
            // Check if player is injured (Lineup = "Injury")
            const isInjured = lineup === 'Injury';
            
            // UPDATED: Format player info differently for injured vs active players
            let playerInfo;
            if (isInjured) {
                // For injured players: "Name - All - Full Season - X Games - X.X Mins"
                playerInfo = `${playerName} - All - Full Season - ${games} Games - ${minutes} Mins`;
            } else {
                // For active players: "Name - Starter/Bench - Split - X Games - X.X Mins"
                playerInfo = `${playerName} - ${lineup} - ${split} - ${games} Games - ${minutes} Mins`;
            }
            
            // UPDATED: Show stats for all players (including injured), unless values are null
            // TOs moved to after Assists in Offensive section
            tr.innerHTML = `
                <td style="padding: ${cellPadding}; text-align: left; white-space: nowrap;">${playerInfo}</td>
                <td style="padding: ${cellPadding}; text-align: center;">${this.formatStatValue(row["Pts"])}</td>
                <td style="padding: ${cellPadding}; text-align: center;">${this.formatStatValue(row["3P"])}</td>
                <td style="padding: ${cellPadding}; text-align: center;">${this.formatStatValue(row["FT"])}</td>
                <td style="padding: ${cellPadding}; text-align: center;">${this.formatStatValue(row["Assists"])}</td>
                <td style="padding: ${cellPadding}; text-align: center;">${this.formatStatValue(row["TOs"])}</td>
                <td style="padding: ${cellPadding}; text-align: center;">${this.formatStatValue(row["ORebs"])}</td>
                <td style="padding: ${cellPadding}; text-align: center;">${this.formatStatValue(row["DRebs"])}</td>
                <td style="padding: ${cellPadding}; text-align: center;">${this.formatStatValue(row["Rebs"])}</td>
                <td style="padding: ${cellPadding}; text-align: center;">${this.formatStatValue(row["Blocks"])}</td>
                <td style="padding: ${cellPadding}; text-align: center;">${this.formatStatValue(row["Steals"])}</td>
                <td style="padding: ${cellPadding}; text-align: center;">${this.formatIntegerValue(row["DD"])}</td>
                <td style="padding: ${cellPadding}; text-align: center;">${this.formatIntegerValue(row["TD"])}</td>
            `;
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        
        container.appendChild(table);
        return container;
    }

    // Format minutes with 1 decimal place
    formatMinutes(value) {
        if (value === null || value === undefined || value === '' || value === '-') return '0.0';
        const num = parseFloat(value);
        if (isNaN(num)) return '0.0';
        return num.toFixed(1);
    }

    // Format stat values with 1 decimal place (for medians)
    formatStatValue(value) {
        if (value === null || value === undefined || value === '' || value === '-') return '-';
        const num = parseFloat(value);
        if (isNaN(num)) return '-';
        return num.toFixed(1);
    }

    // Format integer values (for DD/TD totals - no decimal needed)
    formatIntegerValue(value) {
        if (value === null || value === undefined || value === '' || value === '-') return '-';
        const num = parseInt(value, 10);
        if (isNaN(num)) return '-';
        return String(num);
    }

    // NEW: Format rank values with # prefix
    formatRankWithHash(value) {
        if (value === null || value === undefined || value === '' || value === '-') return '-';
        const str = String(value).trim();
        
        // If it already has a #, return as-is
        if (str.startsWith('#')) return str;
        
        // Check if it's a rank with average format like "21 (25.2)"
        const match = str.match(/^(\d+)\s*\(([^)]+)\)$/);
        if (match) {
            return `#${match[1]} (${match[2]})`;
        }
        
        // Check if it's just a number
        const num = parseInt(str, 10);
        if (!isNaN(num)) {
            return `#${num}`;
        }
        
        // Return original if can't parse
        return str;
    }

    // Override saveState to properly save expanded rows
    saveState() {
        if (!this.table) return;
        
        // Call parent saveState if it exists
        if (super.saveState) {
            super.saveState();
        }
        
        // Save our own filter/sort state
        this.filterState = this.table.getHeaderFilters();
        this.sortState = this.table.getSorters();
        
        // Save expanded row IDs
        this.savedExpandedRows = new Set();
        const rows = this.table.getRows();
        rows.forEach(row => {
            const data = row.getData();
            if (data._expanded) {
                const rowId = this.generateRowId(data);
                this.savedExpandedRows.add(rowId);
            }
        });
        
        console.log(`Matchups saveState: saved ${this.savedExpandedRows.size} expanded rows`);
    }

    // Override restoreState to properly restore expanded rows
    restoreState() {
        if (!this.table) return;
        
        // Call parent restoreState if it exists
        if (super.restoreState) {
            super.restoreState();
        }
        
        // Recalculate widths to reserve scrollbar space (desktop only)
        // Use requestAnimationFrame to ensure the table is visible first
        requestAnimationFrame(() => {
            setTimeout(() => {
                this.calculateAndApplyWidths();
            }, 50);
        });
        
        // Restore filters
        if (this.filterState && this.filterState.length > 0) {
            this.filterState.forEach(filter => {
                try {
                    this.table.setHeaderFilterValue(filter.field, filter.value);
                } catch (e) {
                    console.warn("Could not restore filter:", filter.field);
                }
            });
        }
        
        // Restore sort
        if (this.sortState && this.sortState.length > 0) {
            try {
                this.table.setSort(this.sortState);
            } catch (e) {
                console.warn("Could not restore sort");
            }
        }
        
        // Restore expanded rows
        if (this.savedExpandedRows && this.savedExpandedRows.size > 0) {
            console.log(`Matchups restoreState: restoring ${this.savedExpandedRows.size} expanded rows`);
            
            setTimeout(() => {
                const rows = this.table.getRows();
                rows.forEach(row => {
                    const data = row.getData();
                    const rowId = this.generateRowId(data);
                    
                    if (this.savedExpandedRows.has(rowId)) {
                        // Mark as expanded
                        data._expanded = true;
                        row.update(data);
                        
                        // Recreate subtable if cache is ready
                        if (this.subtableDataReady) {
                            const rowElement = row.getElement();
                            if (rowElement && !rowElement.querySelector('.subrow-container')) {
                                this.createAndAppendSubtable(rowElement, data);
                            }
                        }
                    }
                });
            }, 100);
        }
    }
}
