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

import { BaseTable } from './baseTable.js';
import { isMobile, isTablet } from '../shared/config.js';

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
        });
        
        // Handle render complete - restore any missing subtables
        this.table.on("renderComplete", () => {
            if (this.subtableDataReady && !this.isScrolling) {
                setTimeout(() => {
                    this.restoreExpandedSubtables();
                }, 50);
            }
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
                minWidth: 200,
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
                minWidth: 100,
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
                minWidth: 100,
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

    // Expand Matchup column to fill remaining container width (desktop only)
    expandMatchupColumnToFill() {
        if (!this.table) return;
        
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
        // Note: max-height/overflow is on the inner wrapper, not here
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
    parseMatchup(matchupStr) {
        if (!matchupStr) return { away: null, home: null };
        
        // Format: "Away Team @ Home Team" or "Away Team @ Home Team 1/4 7:00PM"
        const parts = matchupStr.split('@');
        if (parts.length !== 2) return { away: null, home: null };
        
        const awayTeam = parts[0].trim();
        // Remove date/time if present
        const homeTeam = parts[1].replace(/\s+\d{1,2}:\d{2}(AM|PM)?.*$/, '').replace(/\s*\d{1,2}\/\d{1,2}.*$/, '').trim();
        
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
        wrapper.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 15px;
            max-height: 450px;
            overflow-y: scroll;
            overflow-x: hidden;
            box-sizing: border-box;
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

    // Create defense subtable - UPDATED with # prefix on prop ranks
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
        
        // Create table
        const table = document.createElement('table');
        table.style.cssText = 'font-size: 11px; border-collapse: collapse; width: 100%;';
        
        // Header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr style="background: #f8f9fa;">
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 60px;">Season Pace Rank</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 70px;">Split</th>
                <th colspan="5" style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; background: #f0f0f0;">Offensive Ranks (Avg)</th>
                <th colspan="3" style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; background: #e8e8e8;">Rebounds Ranks (Avg)</th>
                <th colspan="2" style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; background: #f0f0f0;">Defensive Ranks (Avg)</th>
                <th colspan="2" style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; background: #e8e8e8;">Combos Ranks (Tot)</th>
            </tr>
            <tr style="background: #fafafa;">
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd;"></th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd;"></th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">Points</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">3PM</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">FTA</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">Assists</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">TOs</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">Off</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">Def</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">Total</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">Blocks</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">Steals</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">DD</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">TD</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Body
        const tbody = document.createElement('tbody');
        sortedData.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.style.cssText = index % 2 === 1 ? 'background: #fafafa;' : '';
            
            // Pace cell (merged for first row) - add # prefix
            if (index === 0) {
                const paceDisplay = this.formatRankWithHash(paceValue);
                tr.innerHTML = `
                    <td rowspan="${sortedData.length}" style="padding: 4px 8px; text-align: center; border-right: 1px solid #eee; vertical-align: middle; font-weight: 600;">${paceDisplay}</td>
                `;
            }
            
            // Format all rank values with # prefix
            tr.innerHTML += `
                <td style="padding: 4px 8px; text-align: center;">${row["Split"] || '-'}</td>
                <td style="padding: 4px 8px; text-align: center;">${this.formatRankWithHash(row["Pts"])}</td>
                <td style="padding: 4px 8px; text-align: center;">${this.formatRankWithHash(row["3P"])}</td>
                <td style="padding: 4px 8px; text-align: center;">${this.formatRankWithHash(row["FTA"])}</td>
                <td style="padding: 4px 8px; text-align: center;">${this.formatRankWithHash(row["Assists"])}</td>
                <td style="padding: 4px 8px; text-align: center;">${this.formatRankWithHash(row["TOs"])}</td>
                <td style="padding: 4px 8px; text-align: center;">${this.formatRankWithHash(row["ORebs"])}</td>
                <td style="padding: 4px 8px; text-align: center;">${this.formatRankWithHash(row["DRebs"])}</td>
                <td style="padding: 4px 8px; text-align: center;">${this.formatRankWithHash(row["Rebs"])}</td>
                <td style="padding: 4px 8px; text-align: center;">${this.formatRankWithHash(row["Blocks"])}</td>
                <td style="padding: 4px 8px; text-align: center;">${this.formatRankWithHash(row["Steals"])}</td>
                <td style="padding: 4px 8px; text-align: center;">${this.formatRankWithHash(row["DD"])}</td>
                <td style="padding: 4px 8px; text-align: center;">${this.formatRankWithHash(row["TD"])}</td>
            `;
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        
        container.appendChild(table);
        return container;
    }

    // Create players subtable - UPDATED for new injured player handling
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
        // Then injured players at bottom (alphabetically)
        
        // Separate players into categories based on Lineup field
        const activePlayers = [];
        const injuredPlayers = [];
        
        playerData.forEach(row => {
            const lineup = row["Lineup"] || '';
            
            if (lineup === 'Injury') {
                // Injured player - single row
                injuredPlayers.push(row);
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
        
        // Sort injured players alphabetically by name
        injuredPlayers.sort((a, b) => {
            const aName = a["Player"] || '';
            const bName = b["Player"] || '';
            return aName.localeCompare(bName);
        });
        
        // Combine: Active players, then injured
        const sortedData = [...activePlayers, ...injuredPlayers];
        
        // Create table
        const table = document.createElement('table');
        table.style.cssText = 'font-size: 11px; border-collapse: collapse; width: 100%;';
        
        // Header - UPDATED: Changed "FT" to "FTM", renamed Scoring to Offensive, moved TOs
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr style="background: #f8f9fa;">
                <th style="padding: 4px 8px; text-align: left; border-bottom: 1px solid #ddd; min-width: 200px;">Player</th>
                <th colspan="5" style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; background: #f0f0f0;">Offensive Medians</th>
                <th colspan="3" style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; background: #e8e8e8;">Rebounds Medians</th>
                <th colspan="2" style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; background: #f0f0f0;">Defensive Medians</th>
                <th colspan="2" style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; background: #e8e8e8;">Combos Totals</th>
            </tr>
            <tr style="background: #fafafa;">
                <th style="padding: 4px 8px; text-align: left; border-bottom: 1px solid #ddd;"></th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">Points</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">3PM</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">FTM</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">Assists</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">TOs</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">Off</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">Def</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">Total</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">Blocks</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">Steals</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">DD</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">TD</th>
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
                <td style="padding: 4px 8px; text-align: left; white-space: nowrap;">${playerInfo}</td>
                <td style="padding: 4px 8px; text-align: center;">${this.formatStatValue(row["Pts"])}</td>
                <td style="padding: 4px 8px; text-align: center;">${this.formatStatValue(row["3P"])}</td>
                <td style="padding: 4px 8px; text-align: center;">${this.formatStatValue(row["FT"])}</td>
                <td style="padding: 4px 8px; text-align: center;">${this.formatStatValue(row["Assists"])}</td>
                <td style="padding: 4px 8px; text-align: center;">${this.formatStatValue(row["TOs"])}</td>
                <td style="padding: 4px 8px; text-align: center;">${this.formatStatValue(row["ORebs"])}</td>
                <td style="padding: 4px 8px; text-align: center;">${this.formatStatValue(row["DRebs"])}</td>
                <td style="padding: 4px 8px; text-align: center;">${this.formatStatValue(row["Rebs"])}</td>
                <td style="padding: 4px 8px; text-align: center;">${this.formatStatValue(row["Blocks"])}</td>
                <td style="padding: 4px 8px; text-align: center;">${this.formatStatValue(row["Steals"])}</td>
                <td style="padding: 4px 8px; text-align: center;">${this.formatIntegerValue(row["DD"])}</td>
                <td style="padding: 4px 8px; text-align: center;">${this.formatIntegerValue(row["TD"])}</td>
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
