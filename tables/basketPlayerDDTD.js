// tables/basketPlayerDDTD.js - Basketball Player DD-TD Clearances Table
// Double-Double and Triple-Double clearance data
// Based on basketPlayerPropClearances.js with column modifications

import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { createMinMaxFilter, minMaxFilterFunction } from '../components/minMaxFilter.js';
import { isMobile, isTablet } from '../shared/config.js';

export class BasketPlayerDDTDTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'BasketPlayerDDTD');
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
            placeholder: "Loading DD-TD clearances...",
            
            // fitDataFill: columns size to content, extra space distributed by widthGrow
            layout: "fitDataFill",
            
            columns: this.getColumns(isSmallScreen),
            initialSort: [
                {column: "Player Name", dir: "asc"},
                {column: "Player Team", dir: "asc"},
                {column: "Player Prop", dir: "asc"}
            ],
            rowFormatter: this.createRowFormatter(),
            dataLoaded: (data) => {
                console.log(`DD-TD table loaded ${data.length} records successfully`);
                this.dataLoaded = true;
                
                // Debug: Log first row to verify data structure
                if (data.length > 0) {
                    console.log('DEBUG - DD-TD First row sample:', {
                        'Player Name': data[0]["Player Name"],
                        'Player Prop': data[0]["Player Prop"],
                        'Player Points': data[0]["Player Points"],
                        'Opponent Points': data[0]["Opponent Points"]
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
                console.error("Error loading DD-TD data:", error);
            }
        };

        this.table = new Tabulator(this.elementId, config);
        this.setupRowExpansion();
        
        this.table.on("tableBuilt", () => {
            console.log("DD-TD Clearances table built successfully");
            // Wait for table to be fully rendered before adjusting column widths
            setTimeout(() => {
                this.equalizeClusteredColumns();
                // After equalizing clusters, expand Name column to fill remaining space (desktop only)
                if (!isSmallScreen) {
                    this.expandNameColumnToFill();
                }
            }, 200);
            
            // Re-adjust on window resize (desktop only)
            if (!isSmallScreen) {
                window.addEventListener('resize', this.debounce(() => {
                    this.equalizeClusteredColumns();
                    this.expandNameColumnToFill();
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
            'cluster-c-median': ['Player Median Over Odds', 'Player Median Under Odds'],
            'cluster-c-best': ['Player Best Over Odds', 'Player Best Under Odds']
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
                console.log(`DD-TD Cluster ${clusterName}: equalized to ${maxWidth}px`);
            }
        });
    }
    
    // Expand Name column to fill remaining container width (desktop only)
    expandNameColumnToFill() {
        if (!this.table) return;
        
        const tableElement = this.table.element;
        const containerWidth = tableElement.offsetWidth;
        
        // Get current total width of all columns
        let totalColumnWidth = 0;
        const columns = this.table.getColumns();
        columns.forEach(col => {
            totalColumnWidth += col.getWidth();
        });
        
        // Calculate remaining space
        const remainingSpace = containerWidth - totalColumnWidth - 20; // 20px buffer
        
        if (remainingSpace > 0) {
            const nameColumn = this.table.getColumn("Player Name");
            if (nameColumn) {
                const currentWidth = nameColumn.getWidth();
                nameColumn.setWidth(currentWidth + remainingSpace);
                console.log(`DD-TD Name column expanded by ${remainingSpace}px to fill container`);
            }
        }
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
        
        // =====================================================
        // FORMATTERS
        // =====================================================
        
        // Clearance formatter - converts decimal to percentage with exactly ONE decimal place
        const clearanceFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const str = String(value).replace('%', '').trim();
            const num = parseFloat(str);
            if (isNaN(num)) return '-';
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

        return [
            // =====================================================
            // NAME COLUMN - widthGrow:1 means it absorbs ALL extra space
            // Frozen on mobile/tablet for horizontal scrolling
            // Standalone header (no parent group)
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
            // LINEUP STATUS - Standalone header
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
            // PROP COLUMN - Standalone (no Line column in this table)
            // widthGrow:0 allows natural expansion to fit content
            // =====================================================
            {
                title: "Prop", 
                field: "Player Prop", 
                widthGrow: 0,
                minWidth: 50,
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center",
                cssClass: "standalone-header"
            },
            
            // =====================================================
            // CLEARANCE GROUP
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
            // OPPONENT GROUP - "Prop Rank (Tot)" instead of "(Avg)"
            // =====================================================
            {
                title: "Opponent", 
                columns: [
                    {
                        title: "Prop Rank (Tot)", 
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
                            return "Prop<br>Rank<br>(Tot)";
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
                        sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                            return self.oddsSorter(a, b, aRow, bRow, column, dir, sorterParams);
                        },
                        headerFilter: createMinMaxFilter,
                        headerFilterFunc: minMaxFilterFunction,
                        headerFilterLiveFilter: false,
                        resizable: false,
                        formatter: oddsFormatter,
                        hozAlign: "center",
                        cssClass: "cluster-c-median"
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
                        cssClass: "cluster-c-median"
                    }
                ]
            },

            // =====================================================
            // BEST ODDS GROUP
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
                        cssClass: "cluster-c-best"
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
                        cssClass: "cluster-c-best"
                    }
                ]
            }
        ];
    }

    // =====================================================
    // Name formatter with expand icon
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
    // Row expansion using cellClick on "Player Name"
    // =====================================================
    setupRowExpansion() {
        if (!this.table) return;
        
        const self = this;
        let expansionTimeout;
        
        this.table.on("cellClick", (e, cell) => {
            const field = cell.getField();
            
            if (field === "Player Name") {
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
                    
                    console.log(`DD-TD Row ${data._expanded ? 'expanded' : 'collapsed'}: ${data["Player Name"]}`);
                    
                    row.update(data);
                    
                    const cellElement = cell.getElement();
                    const expanderIcon = cellElement.querySelector('.expand-icon');
                    if (expanderIcon) {
                        expanderIcon.style.transform = data._expanded ? 'rotate(90deg)' : '';
                    }
                    
                    requestAnimationFrame(() => {
                        row.reformat();
                        
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
    // Row formatter - subtable INSIDE row element
    // =====================================================
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
                            console.error("Error creating DD-TD subtable content:", error);
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

    // =====================================================
    // Helper to format minutes with 1 decimal place
    // =====================================================
    formatMinutes(value) {
        if (value === null || value === undefined || value === '' || value === '-') return '-';
        const num = parseFloat(value);
        if (isNaN(num)) return '-';
        return num.toFixed(1);
    }

    // =====================================================
    // Helper to format matchup total with 1 decimal place
    // =====================================================
    formatMatchupTotal(value) {
        if (value === null || value === undefined || value === '' || value === '-') return '-';
        const str = String(value);
        
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
        
        const num = parseFloat(str);
        if (isNaN(num)) return str;
        return num.toFixed(1);
    }

    // =====================================================
    // Helper to format stat values (with 1 decimal for medians)
    // =====================================================
    formatStatValue(value, useDecimal = true) {
        if (value === null || value === undefined || value === '' || value === '-') return '-';
        const num = parseFloat(value);
        if (isNaN(num)) return '-';
        return useDecimal ? num.toFixed(1) : String(num);
    }

    // =====================================================
    // Subtable content with Player/Opponent Stats table
    // =====================================================
    createSubtableContent(container, data) {
        // Matchup details
        const matchup = data["Matchup"] || '-';
        const spread = data["Matchup Spread"] || '-';
        const total = this.formatMatchupTotal(data["Matchup Total"]);
        
        // Minutes data
        const medianMinutes = this.formatMinutes(data["Player Median Minutes"]);
        const avgMinutes = this.formatMinutes(data["Player Average Minutes"]);
        
        // Best books
        const bestOverBook = data["Player Best Over Odds Books"] || '-';
        const bestUnderBook = data["Player Best Under Odds Books"] || '-';
        
        // Player stats (medians - use 1 decimal)
        const playerPoints = this.formatStatValue(data["Player Points"]);
        const playerRebounds = this.formatStatValue(data["Player Rebounds"]);
        const playerAssists = this.formatStatValue(data["Player Assists"]);
        const playerBlocks = this.formatStatValue(data["Player Blocks"]);
        const playerSteals = this.formatStatValue(data["Player Steals"]);
        
        // Opponent stats (ranks with averages - keep as-is from data)
        const oppPoints = data["Opponent Points"] || '-';
        const oppRebounds = data["Opponent Rebounds"] || '-';
        const oppAssists = data["Opponent Assists"] || '-';
        const oppBlocks = data["Opponent Blocks"] || '-';
        const oppSteals = data["Opponent Steals"] || '-';
        
        container.innerHTML = `
            <div style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: flex-start;">
                <!-- Matchup Details -->
                <div style="background: white; padding: 12px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: inline-block; min-width: fit-content;">
                    <h4 style="margin: 0 0 8px 0; color: #f97316; font-size: 13px; font-weight: 600;">Matchup Details</h4>
                    <div style="font-size: 12px; color: #333;">
                        <div style="margin-bottom: 4px;"><strong>Game:</strong> ${matchup}</div>
                        <div style="margin-bottom: 4px;"><strong>Spread:</strong> ${spread}</div>
                        <div><strong>Total:</strong> ${total}</div>
                    </div>
                </div>
                
                <!-- Player and Opponent Stats Table -->
                <div style="background: white; padding: 12px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: inline-block; min-width: fit-content;">
                    <h4 style="margin: 0 0 8px 0; color: #f97316; font-size: 13px; font-weight: 600;">Player and Opponent Stats</h4>
                    <table style="font-size: 11px; border-collapse: collapse; width: 100%;">
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th style="padding: 4px 8px; text-align: left; border-bottom: 1px solid #ddd;"></th>
                                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd;">Points</th>
                                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd;">Rebounds</th>
                                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd;">Assists</th>
                                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd;">Blocks</th>
                                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd;">Steals</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 4px 8px; font-weight: 600; color: #333;">Player Medians</td>
                                <td style="padding: 4px 8px; text-align: center;">${playerPoints}</td>
                                <td style="padding: 4px 8px; text-align: center;">${playerRebounds}</td>
                                <td style="padding: 4px 8px; text-align: center;">${playerAssists}</td>
                                <td style="padding: 4px 8px; text-align: center;">${playerBlocks}</td>
                                <td style="padding: 4px 8px; text-align: center;">${playerSteals}</td>
                            </tr>
                            <tr style="background: #fafafa;">
                                <td style="padding: 4px 8px; font-weight: 600; color: #333;">Opp Stat Ranks (Avg)</td>
                                <td style="padding: 4px 8px; text-align: center;">${oppPoints}</td>
                                <td style="padding: 4px 8px; text-align: center;">${oppRebounds}</td>
                                <td style="padding: 4px 8px; text-align: center;">${oppAssists}</td>
                                <td style="padding: 4px 8px; text-align: center;">${oppBlocks}</td>
                                <td style="padding: 4px 8px; text-align: center;">${oppSteals}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <!-- Minutes Data -->
                <div style="background: white; padding: 12px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: inline-block; min-width: fit-content;">
                    <h4 style="margin: 0 0 8px 0; color: #f97316; font-size: 13px; font-weight: 600;">Minutes Data</h4>
                    <div style="font-size: 12px; color: #333;">
                        <div style="margin-bottom: 4px;"><strong>Median:</strong> ${medianMinutes}</div>
                        <div><strong>Average:</strong> ${avgMinutes}</div>
                    </div>
                </div>
                
                <!-- Best Books -->
                <div style="background: white; padding: 12px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: inline-block; min-width: fit-content;">
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
