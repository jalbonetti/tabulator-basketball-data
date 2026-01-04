// tables/basketMatchups.js - Basketball Matchups Table
// Pulls from three Supabase tables: BasketMatchupsGame, BasketMatchupsDefense, BasketMatchupsPlayers
// Features expandable rows with 4 stacked subtables

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
            layout: isSmallScreen ? "fitDataFill" : "fitColumns",
            
            columns: this.getColumns(isSmallScreen),
            initialSort: [
                {column: "Matchup ID", dir: "asc"}
            ],
            rowFormatter: this.createRowFormatter(),
            dataLoaded: (data) => {
                console.log(`Matchups table loaded ${data.length} records successfully`);
                this.dataLoaded = true;
                
                // DEBUG: Log first row to see all column names
                if (data.length > 0) {
                    console.log('DEBUG - Matchups First row ALL COLUMNS:', JSON.stringify(data[0], null, 2));
                    console.log('DEBUG - Column names:', Object.keys(data[0]));
                }
                
                // Initialize expansion state for each row
                data.forEach(row => {
                    if (row._expanded === undefined) {
                        row._expanded = false;
                    }
                });
                
                // Pre-fetch defense and player data for all matchups
                console.log('DEBUG - About to call prefetchSubtableData...');
                this.prefetchSubtableData(data);
                console.log('DEBUG - prefetchSubtableData called (async)');
            },
            ajaxError: (error) => {
                console.error("Error loading matchups data:", error);
            }
        };

        this.table = new Tabulator(this.elementId, config);
        this.setupRowExpansion();
        
        this.table.on("tableBuilt", () => {
            console.log("Matchups table built successfully");
            
            // Fallback: If data is already loaded (from cache), prefetch subtable data
            const data = this.table.getData();
            console.log('DEBUG - tableBuilt: table has', data.length, 'rows');
            if (data.length > 0 && this.defenseDataCache.size === 0) {
                console.log('DEBUG - tableBuilt: Triggering prefetch as fallback...');
                this.prefetchSubtableData(data);
            }
        });
    }

    getColumns(isSmallScreen = false) {
        return [
            // Hidden Matchup ID for sorting
            {
                title: "Matchup ID",
                field: "Matchup ID",
                visible: false,
                sorter: "number"
            },
            {
                title: "Matchup", 
                field: "Matchup", 
                widthGrow: 1,
                minWidth: isSmallScreen ? 150 : undefined,
                sorter: "string",
                resizable: false,
                formatter: this.createNameFormatter(),
                hozAlign: "left"
            },
            {
                title: "Spread", 
                field: "Spread", 
                widthGrow: 1,
                minWidth: isSmallScreen ? 80 : undefined,
                sorter: "string",
                resizable: false,
                hozAlign: "center",
                formatter: (cell) => {
                    const value = cell.getValue();
                    const rowData = cell.getRow().getData();
                    console.log('DEBUG - Spread cell value:', value);
                    console.log('DEBUG - Spread row data keys:', Object.keys(rowData));
                    return value || '-';
                }
            },
            {
                title: "Total", 
                field: "Total", 
                widthGrow: 1,
                minWidth: isSmallScreen ? 80 : undefined,
                sorter: "string",
                resizable: false,
                hozAlign: "center",
                formatter: (cell) => {
                    const value = cell.getValue();
                    const rowData = cell.getRow().getData();
                    console.log('DEBUG - Total cell value:', value);
                    console.log('DEBUG - Total row data:', rowData);
                    return value || '-';
                }
            }
        ];
    }

    // Parse matchup string to extract away and home team names
    parseMatchup(matchupStr) {
        if (!matchupStr) return { away: null, home: null };
        
        // Format: "Team Name @ Team Name (date/time)" or similar
        // Find the @ symbol to split
        const atIndex = matchupStr.indexOf('@');
        if (atIndex === -1) return { away: null, home: null };
        
        const awayPart = matchupStr.substring(0, atIndex).trim();
        let homePart = matchupStr.substring(atIndex + 1).trim();
        
        // Remove date/time portion if present (usually in parentheses or after the team name)
        // Try to match team name by checking against our mapping
        let awayTeam = awayPart;
        let homeTeam = homePart;
        
        // Check if we can find a matching team name
        for (const fullName of Object.keys(this.teamAbbrevMap)) {
            if (awayPart.includes(fullName)) {
                awayTeam = fullName;
            }
            if (homePart.includes(fullName)) {
                homeTeam = fullName;
            }
        }
        
        // If we couldn't find exact matches, try to extract just the team part
        // Remove anything after common separators like ( or numbers
        homeTeam = homeTeam.replace(/\s*\(.*$/, '').replace(/\s*\d{1,2}\/\d{1,2}.*$/, '').trim();
        
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
        
        if (matchupIds.length === 0) {
            console.log('DEBUG - No Matchup IDs found in main data');
            return;
        }
        
        console.log(`Prefetching subtable data for ${matchupIds.length} matchups...`);
        console.log('DEBUG - Matchup IDs:', matchupIds);
        
        try {
            // Fetch defense data
            console.log('DEBUG - Fetching defense data from:', this.ENDPOINTS.DEFENSE);
            const defenseData = await this.fetchFromEndpoint(this.ENDPOINTS.DEFENSE);
            console.log('DEBUG - Defense data received:', defenseData ? defenseData.length : 'null', 'rows');
            if (defenseData && defenseData.length > 0) {
                console.log('DEBUG - Defense first row:', JSON.stringify(defenseData[0], null, 2));
                defenseData.forEach(row => {
                    const matchupId = row["Matchup ID"];
                    if (!this.defenseDataCache.has(matchupId)) {
                        this.defenseDataCache.set(matchupId, []);
                    }
                    this.defenseDataCache.get(matchupId).push(row);
                });
                console.log(`Cached defense data for ${this.defenseDataCache.size} matchups`);
            }
            
            // Fetch player data
            console.log('DEBUG - Fetching player data from:', this.ENDPOINTS.PLAYERS);
            const playerData = await this.fetchFromEndpoint(this.ENDPOINTS.PLAYERS);
            console.log('DEBUG - Player data received:', playerData ? playerData.length : 'null', 'rows');
            if (playerData && playerData.length > 0) {
                console.log('DEBUG - Player first row:', JSON.stringify(playerData[0], null, 2));
                playerData.forEach(row => {
                    const matchupId = row["Matchup ID"];
                    if (!this.playersDataCache.has(matchupId)) {
                        this.playersDataCache.set(matchupId, []);
                    }
                    this.playersDataCache.get(matchupId).push(row);
                });
                console.log(`Cached player data for ${this.playersDataCache.size} matchups`);
            }
        } catch (error) {
            console.error("Error prefetching subtable data:", error);
        }
    }

    // Fetch data from a specific endpoint
    async fetchFromEndpoint(endpoint) {
        console.log('DEBUG - fetchFromEndpoint called for:', endpoint);
        console.log('DEBUG - this.endpoint is:', this.endpoint);
        try {
            const baseConfig = this.getBaseConfig();
            console.log('DEBUG - baseConfig:', baseConfig);
            console.log('DEBUG - baseConfig.ajaxURL:', baseConfig?.ajaxURL);
            
            if (!baseConfig || !baseConfig.ajaxURL) {
                console.error('DEBUG - baseConfig or ajaxURL is missing!');
                return null;
            }
            
            const url = `${baseConfig.ajaxURL.replace(this.endpoint, endpoint)}`;
            console.log('DEBUG - Fetching from URL:', url);
            console.log('DEBUG - Using headers:', baseConfig.ajaxConfig?.headers);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: baseConfig.ajaxConfig.headers
            });
            
            console.log('DEBUG - Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('DEBUG - Data received from', endpoint, ':', data?.length, 'rows');
            return data;
        } catch (error) {
            console.error(`Error fetching from ${endpoint}:`, error);
            return null;
        }
    }

    // Name formatter with expand icon
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

    // Row expansion setup
    setupRowExpansion() {
        if (!this.table) return;
        
        const self = this;
        let expansionTimeout;
        
        this.table.on("cellClick", (e, cell) => {
            const field = cell.getField();
            
            if (field === "Matchup") {
                e.preventDefault();
                e.stopPropagation();
                
                if (expansionTimeout) {
                    clearTimeout(expansionTimeout);
                }
                
                expansionTimeout = setTimeout(() => {
                    const row = cell.getRow();
                    const data = row.getData();
                    
                    if (data._expanded === undefined) {
                        data._expanded = false;
                    }
                    
                    data._expanded = !data._expanded;
                    
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
                    
                    console.log(`Matchup row ${data._expanded ? 'expanded' : 'collapsed'}: ${data["Matchup"]}`);
                    
                    row.update(data);
                    
                    const cellElement = cell.getElement();
                    const expanderIcon = cellElement.querySelector('.expand-icon');
                    if (expanderIcon) {
                        expanderIcon.style.transform = data._expanded ? 'rotate(90deg)' : '';
                    }
                    
                    requestAnimationFrame(() => {
                        row.reformat();
                    });
                }, 50);
            }
        });
    }

    // Generate unique row ID
    generateRowId(data) {
        return `matchup_${data["Matchup ID"] || ''}_${data["Matchup"] || ''}`;
    }

    // Row formatter with subtable creation
    createRowFormatter() {
        const self = this;
        
        return (row) => {
            const data = row.getData();
            const rowElement = row.getElement();
            
            if (data._expanded === undefined) {
                data._expanded = false;
            }
            
            if (data._expanded) {
                rowElement.classList.add('row-expanded');
            } else {
                rowElement.classList.remove('row-expanded');
            }
            
            if (data._expanded) {
                let existingSubrow = rowElement.querySelector('.subrow-container');
                
                if (!existingSubrow) {
                    requestAnimationFrame(() => {
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
                        
                        try {
                            self.createSubtableContent(holderEl, data);
                        } catch (error) {
                            console.error("Error creating matchups subtable content:", error);
                            holderEl.innerHTML = '<div style="padding: 10px; color: red;">Error loading details</div>';
                        }
                        
                        rowElement.appendChild(holderEl);
                        
                        setTimeout(() => {
                            row.normalizeHeight();
                        }, 50);
                    });
                }
            } else {
                const existingSubrow = rowElement.querySelector('.subrow-container');
                if (existingSubrow) {
                    existingSubrow.remove();
                    rowElement.classList.remove('row-expanded');
                    
                    setTimeout(() => {
                        row.normalizeHeight();
                    }, 50);
                }
            }
        };
    }

    // Create all subtable content (4 stacked tables)
    createSubtableContent(container, data) {
        const matchupId = data["Matchup ID"];
        const matchupStr = data["Matchup"];
        
        console.log('DEBUG - Creating subtables for row:', {
            matchupId,
            matchupStr,
            allData: data
        });
        
        // Parse home/away teams
        const { away: awayTeamFull, home: homeTeamFull } = this.parseMatchup(matchupStr);
        const awayAbbrev = this.getTeamAbbrev(awayTeamFull);
        const homeAbbrev = this.getTeamAbbrev(homeTeamFull);
        
        console.log(`Creating subtables for Matchup ID ${matchupId}: Away=${awayTeamFull} (${awayAbbrev}), Home=${homeTeamFull} (${homeAbbrev})`);
        
        // Get cached data
        const defenseData = this.defenseDataCache.get(matchupId) || [];
        const playerData = this.playersDataCache.get(matchupId) || [];
        
        console.log('DEBUG - Cached data for this matchup:', {
            defenseDataCount: defenseData.length,
            playerDataCount: playerData.length,
            defenseData: defenseData,
            playerData: playerData
        });
        
        // Get lineup status and B2B info from main data
        const lineupAway = data["Lineup Status Away"] || '';
        const lineupHome = data["Lineup Status Home"] || '';
        const b2bAway = data["B2B Away"] === 'Yes';
        const b2bHome = data["B2B Home"] === 'Yes';
        
        console.log('DEBUG - Lineup and B2B:', {
            lineupAway,
            lineupHome,
            b2bAway,
            b2bHome
        });
        
        // Filter defense data by team
        const awayDefense = defenseData.filter(d => d["Team"] === awayAbbrev);
        const homeDefense = defenseData.filter(d => d["Team"] === homeAbbrev);
        
        // Filter player data by team
        const awayPlayers = playerData.filter(p => p["Team"] === awayAbbrev);
        const homePlayers = playerData.filter(p => p["Team"] === homeAbbrev);
        
        console.log('DEBUG - Filtered data:', {
            awayDefenseCount: awayDefense.length,
            homeDefenseCount: homeDefense.length,
            awayPlayersCount: awayPlayers.length,
            homePlayersCount: homePlayers.length
        });
        
        // Determine lineup type (Expected/Confirmed) from Games table
        const awayLineupType = this.getLineupType(lineupAway);
        const homeLineupType = this.getLineupType(lineupHome);
        
        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'display: flex; flex-direction: column; gap: 15px;';
        
        // 1. Away Defense
        const awayDefenseTable = this.createDefenseSubtable(
            awayDefense,
            `${awayTeamFull || awayAbbrev} (Away) Stats Against`
        );
        wrapper.appendChild(awayDefenseTable);
        
        // 2. Home Players
        const homePlayersTable = this.createPlayersSubtable(
            homePlayers,
            `${homeTeamFull || homeAbbrev} ${homeLineupType} Lineup${b2bHome ? ' - B2B Game' : ''}`
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
            `${awayTeamFull || awayAbbrev} ${awayLineupType} Lineup${b2bAway ? ' - B2B Game' : ''}`
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

    // Create defense subtable
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
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 60px;">Pace</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 70px;">Split</th>
                <th colspan="4" style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; background: #f0f0f0;">Scoring Medians</th>
                <th colspan="3" style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; background: #e8e8e8;">Rebounds Medians</th>
                <th colspan="3" style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; background: #f0f0f0;">Defensive Medians</th>
                <th colspan="2" style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; background: #e8e8e8;">Combos Totals</th>
            </tr>
            <tr style="background: #fafafa;">
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd;"></th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd;"></th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">Points</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">3PM</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">FTA</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">Assists</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">Off</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">Def</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">Total</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">Blocks</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">Steals</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">TOs</th>
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
            
            // Pace cell (merged for first row)
            if (index === 0) {
                tr.innerHTML = `
                    <td rowspan="${sortedData.length}" style="padding: 4px 8px; text-align: center; border-right: 1px solid #eee; vertical-align: middle; font-weight: 600;">${paceValue}</td>
                `;
            }
            
            tr.innerHTML += `
                <td style="padding: 4px 8px; text-align: center;">${row["Split"] || '-'}</td>
                <td style="padding: 4px 8px; text-align: center;">${row["Pts"] || '-'}</td>
                <td style="padding: 4px 8px; text-align: center;">${row["3P"] || '-'}</td>
                <td style="padding: 4px 8px; text-align: center;">${row["FTA"] || '-'}</td>
                <td style="padding: 4px 8px; text-align: center;">${row["Assists"] || '-'}</td>
                <td style="padding: 4px 8px; text-align: center;">${row["ORebs"] || '-'}</td>
                <td style="padding: 4px 8px; text-align: center;">${row["DRebs"] || '-'}</td>
                <td style="padding: 4px 8px; text-align: center;">${row["Rebs"] || '-'}</td>
                <td style="padding: 4px 8px; text-align: center;">${row["Blocks"] || '-'}</td>
                <td style="padding: 4px 8px; text-align: center;">${row["Steals"] || '-'}</td>
                <td style="padding: 4px 8px; text-align: center;">${row["TOs"] || '-'}</td>
                <td style="padding: 4px 8px; text-align: center;">${row["DD"] || '-'}</td>
                <td style="padding: 4px 8px; text-align: center;">${row["TD"] || '-'}</td>
            `;
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        
        container.appendChild(table);
        return container;
    }

    // Create players subtable
    createPlayersSubtable(playerData, title) {
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
        
        // Sort players: Starters first, then by some order (could be minutes or games)
        const sortedData = [...playerData].sort((a, b) => {
            const aStarter = (a["Lineup"] || '').includes('Starter') ? 0 : 1;
            const bStarter = (b["Lineup"] || '').includes('Starter') ? 0 : 1;
            if (aStarter !== bStarter) return aStarter - bStarter;
            
            // Secondary sort by minutes descending
            const aMins = parseFloat(a["Minutes"]) || 0;
            const bMins = parseFloat(b["Minutes"]) || 0;
            return bMins - aMins;
        });
        
        // Create table
        const table = document.createElement('table');
        table.style.cssText = 'font-size: 11px; border-collapse: collapse; width: 100%;';
        
        // Header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr style="background: #f8f9fa;">
                <th style="padding: 4px 8px; text-align: left; border-bottom: 1px solid #ddd; min-width: 200px;">Player</th>
                <th colspan="4" style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; background: #f0f0f0;">Scoring</th>
                <th colspan="3" style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; background: #e8e8e8;">Rebounds</th>
                <th colspan="3" style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; background: #f0f0f0;">Defense</th>
                <th colspan="2" style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; background: #e8e8e8;">Combos</th>
            </tr>
            <tr style="background: #fafafa;">
                <th style="padding: 4px 8px; text-align: left; border-bottom: 1px solid #ddd;"></th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">Points</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">3PM</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">FT</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">Assists</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">Off</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">Def</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">Total</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">Blocks</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">Steals</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">TOs</th>
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
            
            // Format player cell: "Name - Split - X Games - X Mins"
            const playerName = row["Player"] || '-';
            const split = row["Split"] || '';
            const games = row["Games"] || '0';
            const minutes = this.formatMinutes(row["Minutes"]);
            const playerInfo = `${playerName} - ${split} - ${games} Games - ${minutes} Mins`;
            
            tr.innerHTML = `
                <td style="padding: 4px 8px; text-align: left; white-space: nowrap;">${playerInfo}</td>
                <td style="padding: 4px 8px; text-align: center;">${row["Pts"] || '-'}</td>
                <td style="padding: 4px 8px; text-align: center;">${row["3P"] || '-'}</td>
                <td style="padding: 4px 8px; text-align: center;">${row["FT"] || '-'}</td>
                <td style="padding: 4px 8px; text-align: center;">${row["Assists"] || '-'}</td>
                <td style="padding: 4px 8px; text-align: center;">${row["ORebs"] || '-'}</td>
                <td style="padding: 4px 8px; text-align: center;">${row["DRebs"] || '-'}</td>
                <td style="padding: 4px 8px; text-align: center;">${row["Rebs"] || '-'}</td>
                <td style="padding: 4px 8px; text-align: center;">${row["Blocks"] || '-'}</td>
                <td style="padding: 4px 8px; text-align: center;">${row["Steals"] || '-'}</td>
                <td style="padding: 4px 8px; text-align: center;">${row["TOs"] || '-'}</td>
                <td style="padding: 4px 8px; text-align: center;">${row["DD"] || '-'}</td>
                <td style="padding: 4px 8px; text-align: center;">${row["TD"] || '-'}</td>
            `;
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        
        container.appendChild(table);
        return container;
    }

    // Format minutes with 1 decimal
    formatMinutes(value) {
        if (value === null || value === undefined || value === '' || value === '-') return '0.0';
        const num = parseFloat(value);
        if (isNaN(num)) return '0.0';
        return num.toFixed(1);
    }
}
