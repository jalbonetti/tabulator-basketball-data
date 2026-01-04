// tables/basketMatchups.js - Basketball Matchups Table
// Pulls from three Supabase tables: BasketMatchupsGame, BasketMatchupsDefense, BasketMatchupsPlayers
// Features expandable rows with 4 stacked subtables
// UPDATED: 
// - Column widths: Matchup 50%, Spread 25%, Total 25%
// - FT header changed to FTM in player subtables
// - All player stats now have forced decimal places
// - Out/OFS players consolidated to single row, sorted at bottom (Out above OFS)

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
            layout: "fitColumns",
            
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
            
            // Log actual row data to see all fields
            if (data.length > 0) {
                console.log('DEBUG - tableBuilt: First row ALL DATA:', JSON.stringify(data[0], null, 2));
                console.log('DEBUG - tableBuilt: First row keys:', Object.keys(data[0]));
                console.log('DEBUG - tableBuilt: Spread value:', data[0]["Spread"]);
                console.log('DEBUG - tableBuilt: Total value:', data[0]["Total"]);
            }
            
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
            // UPDATED: Spread column now 25% width
            {
                title: "Spread", 
                field: "Spread", 
                width: "25%",
                minWidth: 100,
                sorter: "string",
                resizable: false,
                hozAlign: "center"
            },
            // UPDATED: Total column now 25% width
            {
                title: "Total", 
                field: "Total", 
                width: "25%",
                minWidth: 100,
                sorter: "string",
                resizable: false,
                hozAlign: "center"
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

    // Row formatter for expanded state
    createRowFormatter() {
        return (row) => {
            const data = row.getData();
            if (data._expanded) {
                row.getElement().classList.add('row-expanded');
            } else {
                row.getElement().classList.remove('row-expanded');
            }
        };
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
            row.update(data);
            
            // Handle expansion/collapse
            self.handleRowExpansion(row, data._expanded);
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
            
            requestAnimationFrame(() => {
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
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 60px;">Season Pace Rank</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 70px;">Split</th>
                <th colspan="4" style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; background: #f0f0f0;">Scoring Ranks (Avg)</th>
                <th colspan="3" style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; background: #e8e8e8;">Rebounds Ranks (Avg)</th>
                <th colspan="3" style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; background: #f0f0f0;">Defensive Ranks (Avg)</th>
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
        
        // UPDATED: New sorting logic for Out/OFS players
        // 1. Active players first (Starters before Bench, alphabetically within each, Full Season before Last 30 Days)
        // 2. Then Out players (alphabetically, single row each)
        // 3. Then OFS players at very bottom (alphabetically, single row each)
        
        // First, separate players into categories
        const activePlayers = [];
        const outPlayers = [];
        const ofsPlayers = [];
        
        // Group by player name to handle duplicates (Full Season / Last 30 Days)
        const playersByName = new Map();
        
        playerData.forEach(row => {
            const playerName = row["Player"] || '';
            const isOut = playerName.includes('(Out)');
            const isOFS = playerName.includes('(OFS)');
            
            if (isOut) {
                // For Out players, only keep one row per player (dedupe)
                if (!playersByName.has(playerName)) {
                    playersByName.set(playerName, row);
                    outPlayers.push(row);
                }
            } else if (isOFS) {
                // For OFS players, only keep one row per player (dedupe)
                if (!playersByName.has(playerName)) {
                    playersByName.set(playerName, row);
                    ofsPlayers.push(row);
                }
            } else {
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
        
        // Combine: Active players, then Out, then OFS
        const sortedData = [...activePlayers, ...outPlayers, ...ofsPlayers];
        
        // Create table
        const table = document.createElement('table');
        table.style.cssText = 'font-size: 11px; border-collapse: collapse; width: 100%;';
        
        // Header - UPDATED: Changed "FT" to "FTM"
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr style="background: #f8f9fa;">
                <th style="padding: 4px 8px; text-align: left; border-bottom: 1px solid #ddd; min-width: 200px;">Player</th>
                <th colspan="4" style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; background: #f0f0f0;">Scoring Medians</th>
                <th colspan="3" style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; background: #e8e8e8;">Rebounds Medians</th>
                <th colspan="3" style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; background: #f0f0f0;">Defensive Medians</th>
                <th colspan="2" style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; background: #e8e8e8;">Combos Totals</th>
            </tr>
            <tr style="background: #fafafa;">
                <th style="padding: 4px 8px; text-align: left; border-bottom: 1px solid #ddd;"></th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">Points</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">3PM</th>
                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd; min-width: 50px;">FTM</th>
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
            
            const playerName = row["Player"] || '-';
            const lineup = row["Lineup"] || '';
            const split = row["Split"] || '';
            const games = row["Games"] || '0';
            const minutes = this.formatMinutes(row["Minutes"]);
            
            // Check if player is Out or OFS (injury status in name)
            const isOut = playerName.includes('(Out)');
            const isOFS = playerName.includes('(OFS)');
            const isInactive = isOut || isOFS;
            
            // UPDATED: Format player info differently for Out/OFS vs active players
            let playerInfo;
            if (isInactive) {
                // For Out/OFS players: just show name (no Starter/Bench, no Split, no Games/Mins)
                playerInfo = playerName;
            } else {
                // For active players: "Name - Starter/Bench - Split - X Games - X Mins"
                playerInfo = `${playerName} - ${lineup} - ${split} - ${games} Games - ${minutes} Mins`;
            }
            
            // If player is Out/OFS, show "-" for all stats
            if (isInactive) {
                tr.innerHTML = `
                    <td style="padding: 4px 8px; text-align: left; white-space: nowrap;">${playerInfo}</td>
                    <td style="padding: 4px 8px; text-align: center;">-</td>
                    <td style="padding: 4px 8px; text-align: center;">-</td>
                    <td style="padding: 4px 8px; text-align: center;">-</td>
                    <td style="padding: 4px 8px; text-align: center;">-</td>
                    <td style="padding: 4px 8px; text-align: center;">-</td>
                    <td style="padding: 4px 8px; text-align: center;">-</td>
                    <td style="padding: 4px 8px; text-align: center;">-</td>
                    <td style="padding: 4px 8px; text-align: center;">-</td>
                    <td style="padding: 4px 8px; text-align: center;">-</td>
                    <td style="padding: 4px 8px; text-align: center;">-</td>
                    <td style="padding: 4px 8px; text-align: center;">-</td>
                    <td style="padding: 4px 8px; text-align: center;">-</td>
                `;
            } else {
                // UPDATED: Use formatStatValue for all stats to force decimal places
                tr.innerHTML = `
                    <td style="padding: 4px 8px; text-align: left; white-space: nowrap;">${playerInfo}</td>
                    <td style="padding: 4px 8px; text-align: center;">${this.formatStatValue(row["Pts"])}</td>
                    <td style="padding: 4px 8px; text-align: center;">${this.formatStatValue(row["3P"])}</td>
                    <td style="padding: 4px 8px; text-align: center;">${this.formatStatValue(row["FT"])}</td>
                    <td style="padding: 4px 8px; text-align: center;">${this.formatStatValue(row["Assists"])}</td>
                    <td style="padding: 4px 8px; text-align: center;">${this.formatStatValue(row["ORebs"])}</td>
                    <td style="padding: 4px 8px; text-align: center;">${this.formatStatValue(row["DRebs"])}</td>
                    <td style="padding: 4px 8px; text-align: center;">${this.formatStatValue(row["Rebs"])}</td>
                    <td style="padding: 4px 8px; text-align: center;">${this.formatStatValue(row["Blocks"])}</td>
                    <td style="padding: 4px 8px; text-align: center;">${this.formatStatValue(row["Steals"])}</td>
                    <td style="padding: 4px 8px; text-align: center;">${this.formatStatValue(row["TOs"])}</td>
                    <td style="padding: 4px 8px; text-align: center;">${this.formatIntegerValue(row["DD"])}</td>
                    <td style="padding: 4px 8px; text-align: center;">${this.formatIntegerValue(row["TD"])}</td>
                `;
            }
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

    // ADDED: Format stat values with 1 decimal place (for medians)
    formatStatValue(value) {
        if (value === null || value === undefined || value === '' || value === '-') return '-';
        const num = parseFloat(value);
        if (isNaN(num)) return '-';
        return num.toFixed(1);
    }

    // ADDED: Format integer values (for DD/TD totals - no decimal needed)
    formatIntegerValue(value) {
        if (value === null || value === undefined || value === '' || value === '-') return '-';
        const num = parseInt(value, 10);
        if (isNaN(num)) return '-';
        return String(num);
    }
}
