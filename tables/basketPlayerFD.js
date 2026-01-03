// tables/basketPlayerFD.js - Basketball Player FanDuel DFS Table
// FanDuel Daily Fantasy Sports data
// Based on basketPlayerDK.js with FD-specific modifications

import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { createMinMaxFilter, minMaxFilterFunction } from '../components/minMaxFilter.js';
import { isMobile, isTablet } from '../shared/config.js';

export class BasketPlayerFDTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'BasketPlayerFD');
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
            placeholder: "Loading FanDuel DFS data...",
            
            // fitDataFill: columns size to content, extra space distributed by widthGrow
            layout: "fitDataFill",
            
            columns: this.getColumns(isSmallScreen),
            initialSort: [
                {column: "Player Name", dir: "asc"},
                {column: "Player Team", dir: "asc"}
            ],
            rowFormatter: this.createRowFormatter(),
            dataLoaded: (data) => {
                console.log(`FD DFS table loaded ${data.length} records successfully`);
                this.dataLoaded = true;
                
                // Debug: Log first row to verify data structure
                if (data.length > 0) {
                    console.log('DEBUG - FD DFS First row sample:', {
                        'Player Name': data[0]["Player Name"],
                        'Player FD Position': data[0]["Player FD Position"],
                        'Player FD Price': data[0]["Player FD Price"],
                        'Player FD Median': data[0]["Player FD Median"]
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
                console.error("Error loading FD DFS data:", error);
            }
        };

        this.table = new Tabulator(this.elementId, config);
        this.setupRowExpansion();
        
        this.table.on("tableBuilt", () => {
            console.log("FD DFS table built successfully");
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
            'cluster-stats': ['Player FD Median', 'Player FD Average', 'Player FD High', 'Player FD Low'],
            'cluster-opponent': ['Opponent FD Rank', 'Opponent Pace Rank'],
            'cluster-ratio': ['Player Median Ratio', 'Player High Ratio']
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
                console.log(`FD DFS Cluster ${clusterName}: equalized to ${maxWidth}px`);
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
                console.log(`FD DFS Name column expanded by ${remainingSpace}px to fill container`);
            }
        }
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

    // Custom sorter for price values (handles $X,XXX format)
    priceSorter(a, b, aRow, bRow, column, dir, sorterParams) {
        const getPriceNum = (val) => {
            if (val === null || val === undefined || val === '' || val === '-') return -1;
            const str = String(val).replace(/[$,]/g, '');
            const num = parseInt(str, 10);
            return isNaN(num) ? -1 : num;
        };
        
        const aNum = getPriceNum(a);
        const bNum = getPriceNum(b);
        
        return aNum - bNum;
    }

    // Custom sorter for ratio values
    ratioSorter(a, b, aRow, bRow, column, dir, sorterParams) {
        const getRatioNum = (val) => {
            if (val === null || val === undefined || val === '' || val === '-') return -99999;
            const num = parseFloat(val);
            return isNaN(num) ? -99999 : num;
        };
        
        const aNum = getRatioNum(a);
        const bNum = getRatioNum(b);
        
        return aNum - bNum;
    }

    getColumns(isSmallScreen = false) {
        const self = this;
        
        // =====================================================
        // FORMATTERS
        // =====================================================
        
        // One decimal formatter
        const oneDecimalFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const num = parseFloat(value);
            if (isNaN(num)) return '-';
            return num.toFixed(1);
        };

        // Price formatter - formats as $X,XXX
        const priceFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const num = parseInt(value, 10);
            if (isNaN(num)) return '-';
            return '$' + num.toLocaleString();
        };

        // Ratio formatter - formats with 2 decimal places
        const ratioFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const num = parseFloat(value);
            if (isNaN(num)) return '-';
            return num.toFixed(2);
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
            // TEAM COLUMN - Standalone header
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
            // POSITION - Standalone header
            // =====================================================
            {
                title: "Position", 
                field: "Player FD Position", 
                widthGrow: 0,
                minWidth: 60,
                sorter: "string",
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center",
                cssClass: "standalone-header"
            },

            // =====================================================
            // PRICE - Standalone header
            // =====================================================
            {
                title: "Price", 
                field: "Player FD Price", 
                widthGrow: 0,
                minWidth: 60,
                sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                    return self.priceSorter(a, b, aRow, bRow, column, dir, sorterParams);
                },
                resizable: false,
                hozAlign: "center",
                formatter: priceFormatter,
                cssClass: "standalone-header"
            },
            
            // =====================================================
            // PLAYER STATS GROUP
            // =====================================================
            {
                title: "Player Stats", 
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
                        title: "Med", 
                        field: "Player FD Median", 
                        widthGrow: 0,
                        minWidth: 45,
                        sorter: "number",
                        resizable: false,
                        formatter: oneDecimalFormatter,
                        hozAlign: "center",
                        cssClass: "cluster-stats"
                    },
                    {
                        title: "Avg", 
                        field: "Player FD Average", 
                        widthGrow: 0,
                        minWidth: 45,
                        sorter: "number",
                        resizable: false,
                        formatter: oneDecimalFormatter,
                        hozAlign: "center",
                        cssClass: "cluster-stats"
                    },
                    {
                        title: "High", 
                        field: "Player FD High", 
                        widthGrow: 0,
                        minWidth: 45,
                        sorter: "number",
                        resizable: false,
                        formatter: oneDecimalFormatter,
                        hozAlign: "center",
                        cssClass: "cluster-stats"
                    },
                    {
                        title: "Low", 
                        field: "Player FD Low", 
                        widthGrow: 0,
                        minWidth: 45,
                        sorter: "number",
                        resizable: false,
                        formatter: oneDecimalFormatter,
                        hozAlign: "center",
                        cssClass: "cluster-stats"
                    }
                ]
            },

            // =====================================================
            // OPPONENT GROUP
            // =====================================================
            {
                title: "Opponent", 
                columns: [
                    {
                        title: "FD Pts Rank", 
                        field: "Opponent FD Rank", 
                        widthGrow: 0,
                        minWidth: 55,
                        sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                            return self.rankWithValueSorter(a, b, aRow, bRow, column, dir, sorterParams);
                        },
                        resizable: false,
                        hozAlign: "center",
                        cssClass: "cluster-opponent",
                        titleFormatter: function() {
                            return "FD Pts<br>Rank";
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
                        cssClass: "cluster-opponent",
                        titleFormatter: function() {
                            return "Season<br>Pace<br>Rank";
                        }
                    }
                ]
            },

            // =====================================================
            // POINTS/PRICE RATIO GROUP
            // =====================================================
            {
                title: "Points/Price Ratio", 
                columns: [
                    {
                        title: "Med", 
                        field: "Player Median Ratio", 
                        widthGrow: 0,
                        minWidth: 50,
                        sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                            return self.ratioSorter(a, b, aRow, bRow, column, dir, sorterParams);
                        },
                        resizable: false,
                        formatter: ratioFormatter,
                        hozAlign: "center",
                        cssClass: "cluster-ratio"
                    },
                    {
                        title: "High", 
                        field: "Player High Ratio", 
                        widthGrow: 0,
                        minWidth: 50,
                        sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                            return self.ratioSorter(a, b, aRow, bRow, column, dir, sorterParams);
                        },
                        resizable: false,
                        formatter: ratioFormatter,
                        hozAlign: "center",
                        cssClass: "cluster-ratio"
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
                    
                    console.log(`FD DFS Row ${data._expanded ? 'expanded' : 'collapsed'}: ${data["Player Name"]}`);
                    
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
                            console.error("Error creating FD DFS subtable content:", error);
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
    // Helper to format percentage values (decimal to %)
    // =====================================================
    formatPercentage(value) {
        if (value === null || value === undefined || value === '' || value === '-') return '-';
        const num = parseFloat(value);
        if (isNaN(num)) return '-';
        // Convert decimal to percentage with 1 decimal place
        return (num * 100).toFixed(1) + '%';
    }

    // =====================================================
    // Subtable content with Player/Opponent Stats table
    // =====================================================
    createSubtableContent(container, data) {
        // Matchup details
        const matchup = data["Matchup"] || '-';
        const spread = data["Matchup Spread"] || '-';
        const total = this.formatMatchupTotal(data["Matchup Total"]);
        
        // Games/Minutes data
        const gamesPlayed = data["Player Games Played"] || '-';
        const medianMinutes = this.formatMinutes(data["Player Median Minutes"]);
        const avgMinutes = this.formatMinutes(data["Player Average Minutes"]);
        
        // Player FD Point % stats (convert decimals to percentages)
        const player2PtFT = this.formatPercentage(data["Player 2Pt/FT Per"]);
        const player3Ps = this.formatPercentage(data["Player 3Ps Per"]);
        const playerRebs = this.formatPercentage(data["Player Rebounds Per"]);
        const playerAsts = this.formatPercentage(data["Player Assists Per"]);
        const playerBlks = this.formatPercentage(data["Player Blocks Per"]);
        const playerStls = this.formatPercentage(data["Player Steals Per"]);
        const playerTOs = this.formatPercentage(data["Player Turnovers Per"]);
        
        // Opponent FD Point % stats (convert decimals to percentages)
        const opp2PtFT = this.formatPercentage(data["Opponent 2Pt/FT Per"]);
        const opp3Ps = this.formatPercentage(data["Opponent 3Ps Per"]);
        const oppRebs = this.formatPercentage(data["Opponent Rebounds Per"]);
        const oppAsts = this.formatPercentage(data["Opponent Assists Per"]);
        const oppBlks = this.formatPercentage(data["Opponent Blocks Per"]);
        const oppStls = this.formatPercentage(data["Opponent Steals Per"]);
        const oppTOs = this.formatPercentage(data["Opponent Turnovers Per"]);
        
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
                
                <!-- Player and Opponent DFS Points Makeup Table -->
                <div style="background: white; padding: 12px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: inline-block; min-width: fit-content;">
                    <h4 style="margin: 0 0 8px 0; color: #f97316; font-size: 13px; font-weight: 600;">Player and Opponent DFS Points Makeup</h4>
                    <table style="font-size: 11px; border-collapse: collapse; width: 100%;">
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th style="padding: 4px 8px; text-align: left; border-bottom: 1px solid #ddd;"></th>
                                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd;">2Pts/FTs</th>
                                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd;">3s</th>
                                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd;">Rebs</th>
                                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd;">Asts</th>
                                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd;">Bs</th>
                                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd;">Ss</th>
                                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd;">TOs</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 4px 8px; font-weight: 600; color: #333;">Player FD Point %</td>
                                <td style="padding: 4px 8px; text-align: center;">${player2PtFT}</td>
                                <td style="padding: 4px 8px; text-align: center;">${player3Ps}</td>
                                <td style="padding: 4px 8px; text-align: center;">${playerRebs}</td>
                                <td style="padding: 4px 8px; text-align: center;">${playerAsts}</td>
                                <td style="padding: 4px 8px; text-align: center;">${playerBlks}</td>
                                <td style="padding: 4px 8px; text-align: center;">${playerStls}</td>
                                <td style="padding: 4px 8px; text-align: center;">${playerTOs}</td>
                            </tr>
                            <tr style="background: #fafafa;">
                                <td style="padding: 4px 8px; font-weight: 600; color: #333;">Opponent FD Point %</td>
                                <td style="padding: 4px 8px; text-align: center;">${opp2PtFT}</td>
                                <td style="padding: 4px 8px; text-align: center;">${opp3Ps}</td>
                                <td style="padding: 4px 8px; text-align: center;">${oppRebs}</td>
                                <td style="padding: 4px 8px; text-align: center;">${oppAsts}</td>
                                <td style="padding: 4px 8px; text-align: center;">${oppBlks}</td>
                                <td style="padding: 4px 8px; text-align: center;">${oppStls}</td>
                                <td style="padding: 4px 8px; text-align: center;">${oppTOs}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <!-- Games/Minutes Data -->
                <div style="background: white; padding: 12px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: inline-block; min-width: fit-content;">
                    <h4 style="margin: 0 0 8px 0; color: #f97316; font-size: 13px; font-weight: 600;">Games/Minutes Data</h4>
                    <div style="font-size: 12px; color: #333;">
                        <div style="margin-bottom: 4px;"><strong>Games Played:</strong> ${gamesPlayed}</div>
                        <div style="margin-bottom: 4px;"><strong>Median:</strong> ${medianMinutes}</div>
                        <div><strong>Average:</strong> ${avgMinutes}</div>
                    </div>
                </div>
            </div>
        `;
    }
}
