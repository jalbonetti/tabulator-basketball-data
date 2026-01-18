// tables/basketPlayerDK.js - Basketball Player DraftKings DFS Table
// DraftKings Daily Fantasy Sports data
//
// WIDTH LOGIC (order of operations):
// 1. Scan data → determine MINIMUM Name column width based on longest player name
// 2. Calculate total column width (with Name at minimum)
// 3. Calculate required subtable width based on content
// 4. DESKTOP ONLY: If subtable width > total columns, EXPAND Name to fill gap
// 5. Name column can ONLY EXPAND, NEVER contract below its data minimum

import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { createMinMaxFilter, minMaxFilterFunction } from '../components/minMaxFilter.js';
import { isMobile, isTablet } from '../shared/config.js';
import { getRankBackgroundColor } from '../shared/utils.js';

// DK Subtable component widths (has DDs/TDs columns = wider)
const DK_SUBTABLE_FIXED_WIDTH = 830; // DFS Points table + Games/Minutes + gaps
const MATCHUP_BOX_BASE_WIDTH = 120; // Base width for Matchup Details box

export class BasketPlayerDKTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'BasketPlayerDK');
        
        // MINIMUM column widths from data scan - these are FLOORS that can never be violated
        this._minDataWidths = {};
        
        // Calculated subtable minimum width
        this._subtableMinWidth = 0;
        
        // Flag to track if initial scan has been done
        this._initialScanComplete = false;
    }

    initialize() {
        const mobile = isMobile();
        const tablet = isTablet();
        const isSmallScreen = mobile || tablet;
        
        const baseConfig = this.getBaseConfig();
        
        const config = {
            ...baseConfig,
            virtualDom: true,
            virtualDomBuffer: 500,
            renderVertical: "virtual",
            renderHorizontal: "basic",
            pagination: false,
            paginationSize: false,
            layoutColumnsOnNewData: false,
            responsiveLayout: false,
            maxHeight: "600px",
            height: "600px",
            placeholder: "Loading DraftKings DFS data...",
            layout: "fitData",
            columns: this.getColumns(isSmallScreen),
            initialSort: [
                {column: "Player Name", dir: "asc"},
                {column: "Player Team", dir: "asc"}
            ],
            rowFormatter: this.createRowFormatter(),
            dataLoaded: (data) => {
                console.log(`DK DFS table loaded ${data.length} records successfully`);
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
                console.error("Error loading DK DFS data:", error);
            }
        };

        this.table = new Tabulator(this.elementId, config);
        this.setupRowExpansion();
        
        this.table.on("tableBuilt", () => {
            console.log("DK DFS table built successfully");
            setTimeout(() => {
                const rowCount = this.table.getDataCount();
                console.log(`DK DFS Table has ${rowCount} rows loaded`);
                
                if (rowCount > 0) {
                    const data = this.table.getData();
                    this.scanDataForMaxWidths(data);
                    this._initialScanComplete = true;
                    this.equalizeClusteredColumns();
                    this.calculateAndApplyWidths();
                }
            }, 200);
            
            window.addEventListener('resize', this.debounce(() => {
                if (this.table && this.table.getDataCount() > 0) {
                    this.equalizeClusteredColumns();
                    this.calculateAndApplyWidths();
                }
            }, 250));
        });
        
        this.table.on("dataLoaded", () => {
            setTimeout(() => {
                const data = this.table.getData();
                this.scanDataForMaxWidths(data);
                this._initialScanComplete = true;
                this.equalizeClusteredColumns();
                this.calculateAndApplyWidths();
            }, 100);
        });
    }
    
    expandNameColumnToFill() {
        this.forceRecalculateWidths();
    }
    
    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
    
    equalizeClusteredColumns() {
        if (!this.table) return;
        
        const clusters = {
            'cluster-stats': ['Player DK Median', 'Player DK Average', 'Player DK High', 'Player DK Low'],
            'cluster-opponent': ['Opponent DK Rank', 'Opponent Pace Rank'],
            'cluster-ratio': ['Player Median Ratio', 'Player High Ratio']
        };
        
        Object.keys(clusters).forEach(clusterName => {
            const fields = clusters[clusterName];
            let maxWidth = 0;
            
            fields.forEach(field => {
                const column = this.table.getColumn(field);
                if (column) {
                    const width = column.getWidth();
                    if (width > maxWidth) maxWidth = width;
                }
            });
            
            if (maxWidth > 0) {
                fields.forEach(field => {
                    const column = this.table.getColumn(field);
                    if (column) column.setWidth(maxWidth);
                });
            }
        });
    }
    
    /**
     * Main width calculation function
     * Order of operations:
     * 1. Ensure Name column is at least its data-scanned minimum
     * 2. Calculate total column width
     * 3. DESKTOP: If subtables need more space, expand Name column
     * 4. Apply table width constraints
     */
    calculateAndApplyWidths() {
        if (!this.table) return;
        
        const tableElement = this.table.element;
        if (!tableElement) return;
        
        const isSmallScreen = isMobile() || isTablet();
        const minNameWidth = this._minDataWidths["Player Name"] || 120;
        const subtableMinWidth = this._subtableMinWidth || 0;
        
        // STEP 1: Ensure Name column is at its minimum (FLOOR)
        const nameColumn = this.table.getColumn("Player Name");
        if (nameColumn) {
            const currentNameWidth = nameColumn.getWidth();
            if (currentNameWidth < minNameWidth) {
                nameColumn.setWidth(minNameWidth);
                console.log(`DK DFS Step 1: Name column set to minimum: ${minNameWidth}px`);
            }
        }
        
        // STEP 2: Calculate total column width
        const columns = this.table.getColumns();
        let totalColumnWidth = 0;
        let currentNameColumnWidth = 0;
        
        columns.forEach(col => {
            const field = col.getField();
            const width = col.getWidth();
            if (field === "Player Name") {
                currentNameColumnWidth = width;
            }
            totalColumnWidth += width;
        });
        
        console.log(`DK DFS Step 2: Total columns=${totalColumnWidth}px, Name=${currentNameColumnWidth}px, Subtable min=${subtableMinWidth}px`);
        
        // STEP 3: DESKTOP ONLY - If subtables need more space, EXPAND Name column
        if (!isSmallScreen && subtableMinWidth > totalColumnWidth && nameColumn) {
            const additionalWidthNeeded = subtableMinWidth - totalColumnWidth;
            const newNameWidth = currentNameColumnWidth + additionalWidthNeeded;
            
            nameColumn.setWidth(newNameWidth);
            totalColumnWidth = subtableMinWidth;
            
            console.log(`DK DFS Step 3: EXPANDED Name for subtables: ${currentNameColumnWidth}px -> ${newNameWidth}px`);
        }
        
        // STEP 4: Apply table width constraints
        if (!isSmallScreen) {
            const SCROLLBAR_WIDTH = 17;
            const finalWidth = totalColumnWidth + SCROLLBAR_WIDTH;
            
            tableElement.style.width = finalWidth + 'px';
            tableElement.style.minWidth = finalWidth + 'px';
            tableElement.style.maxWidth = finalWidth + 'px';
            
            const tableHolder = tableElement.querySelector('.tabulator-tableholder');
            if (tableHolder) {
                tableHolder.style.width = finalWidth + 'px';
                tableHolder.style.maxWidth = finalWidth + 'px';
            }
            
            const tabulatorHeader = tableElement.querySelector('.tabulator-header');
            if (tabulatorHeader) {
                tabulatorHeader.style.width = finalWidth + 'px';
            }
            
            const tableContainer = tableElement.closest('.table-container');
            if (tableContainer) {
                tableContainer.style.width = 'fit-content';
                tableContainer.style.minWidth = 'auto';
                tableContainer.style.maxWidth = 'none';
            }
            
            console.log(`DK DFS Step 4: Table width set to ${finalWidth}px`);
        } else {
            // MOBILE: Just ensure Name stays at minimum after any Tabulator recalculations
            if (nameColumn && nameColumn.getWidth() < minNameWidth) {
                nameColumn.setWidth(minNameWidth);
                console.log(`DK DFS Mobile: Re-enforced Name minimum: ${minNameWidth}px`);
            }
        }
    }
    
    forceRecalculateWidths() {
        console.log('DK DFS forceRecalculateWidths called');
        
        if (!this.table) return;
        
        const data = this.table.getData();
        if (data.length === 0) return;
        
        // Re-scan if needed
        if (!this._initialScanComplete) {
            this.scanDataForMaxWidths(data);
            this._initialScanComplete = true;
        }
        
        this.equalizeClusteredColumns();
        this.calculateAndApplyWidths();
    }

    /**
     * Scan ALL data to determine:
     * 1. Minimum column widths based on content (especially Name)
     * 2. Required subtable width based on longest matchup name
     */
    scanDataForMaxWidths(data) {
        if (!data || data.length === 0 || !this.table) return;
        
        console.log(`DK DFS Scanning ${data.length} rows for max column widths...`);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = '500 12px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        
        const maxWidths = {
            "Player Name": 0,
            "Lineup Status": 0,
            "Player Team": 0,
            "Player DK Position": 0
        };
        
        let maxMatchupWidth = 0;
        
        data.forEach(row => {
            // Measure column text widths
            Object.keys(maxWidths).forEach(field => {
                let value = row[field];
                if (value !== null && value !== undefined && value !== '') {
                    if (field === "Lineup Status") {
                        value = String(value).replace('(Expected)', '(Exp)').replace('(Confirmed)', '(Conf)');
                    }
                    const textWidth = ctx.measureText(String(value)).width;
                    if (textWidth > maxWidths[field]) {
                        maxWidths[field] = textWidth;
                    }
                }
            });
            
            // Measure matchup for subtable width calculation
            const matchup = row["Matchup"];
            if (matchup) {
                const matchupWidth = ctx.measureText(String(matchup)).width;
                if (matchupWidth > maxMatchupWidth) {
                    maxMatchupWidth = matchupWidth;
                }
            }
        });
        
        // Calculate subtable minimum width
        const matchupBoxWidth = maxMatchupWidth + MATCHUP_BOX_BASE_WIDTH;
        this._subtableMinWidth = DK_SUBTABLE_FIXED_WIDTH + matchupBoxWidth;
        console.log(`DK DFS Subtable min width: ${this._subtableMinWidth}px (matchup: ${Math.ceil(maxMatchupWidth)}px)`);
        
        // Calculate and store minimum column widths
        const CELL_PADDING = 16;
        const EXPAND_ICON_WIDTH = 18;
        const BUFFER = 10;
        
        Object.keys(maxWidths).forEach(field => {
            if (maxWidths[field] > 0) {
                const column = this.table.getColumn(field);
                if (column) {
                    let requiredWidth = maxWidths[field] + CELL_PADDING + BUFFER;
                    
                    if (field === "Player Name") {
                        requiredWidth += EXPAND_ICON_WIDTH;
                    }
                    
                    const finalWidth = Math.ceil(requiredWidth);
                    
                    // Store as the MINIMUM (floor) for this column
                    this._minDataWidths[field] = finalWidth;
                    
                    // Set the column to this width
                    column.setWidth(finalWidth);
                    console.log(`DK DFS ${field}: min width = ${finalWidth}px (text: ${Math.ceil(maxWidths[field])}px)`);
                }
            }
        });
        
        console.log('DK DFS Scan complete. Min widths:', JSON.stringify(this._minDataWidths));
    }

    rankWithValueSorter(a, b) {
        const getRankNum = (val) => {
            if (!val || val === '-') return 99999;
            const match = String(val).match(/^(\d+)/);
            return match ? parseInt(match[1], 10) : 99999;
        };
        return getRankNum(a) - getRankNum(b);
    }

    priceSorter(a, b) {
        const getPriceNum = (val) => {
            if (val === null || val === undefined || val === '' || val === '-') return -1;
            const num = parseInt(String(val).replace(/[$,]/g, ''), 10);
            return isNaN(num) ? -1 : num;
        };
        return getPriceNum(a) - getPriceNum(b);
    }

    ratioSorter(a, b) {
        const getRatioNum = (val) => {
            if (val === null || val === undefined || val === '' || val === '-') return -99999;
            const num = parseFloat(val);
            return isNaN(num) ? -99999 : num;
        };
        return getRatioNum(a) - getRatioNum(b);
    }

    getColumns(isSmallScreen = false) {
        const self = this;
        
        const oneDecimalFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const num = parseFloat(value);
            return isNaN(num) ? '-' : num.toFixed(1);
        };

        const priceFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const num = parseInt(value, 10);
            return isNaN(num) ? '-' : '$' + num.toLocaleString();
        };

        const ratioFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const num = parseFloat(value);
            return isNaN(num) ? '-' : num.toFixed(2);
        };

        const splitFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const str = String(value);
            if (str === 'Full Season') return 'Season';
            if (str === 'Last 30 Days') return 'L30 Days';
            return str;
        };

        const lineupFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            return String(value).replace('(Expected)', '(Exp)').replace('(Confirmed)', '(Conf)');
        };

        const rankFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '' || value === '-') return '-';
            const bgColor = getRankBackgroundColor(value);
            if (bgColor) cell.getElement().style.backgroundColor = bgColor;
            return '#' + value;
        };

        return [
            {
                title: "Name", 
                field: "Player Name", 
                frozen: true,
                widthGrow: 0,
                minWidth: 120,
                sorter: "string", 
                headerFilter: true,
                resizable: false,
                formatter: this.createNameFormatter(),
                hozAlign: "left",
                cssClass: "standalone-header"
            },
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
            {
                title: "Position", 
                field: "Player DK Position", 
                widthGrow: 0,
                minWidth: 60,
                sorter: "string",
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center",
                cssClass: "standalone-header"
            },
            {
                title: "Price", 
                field: "Player DK Price", 
                widthGrow: 0,
                minWidth: 70,
                sorter: (a, b) => self.priceSorter(a, b),
                headerFilter: createMinMaxFilter,
                headerFilterFunc: minMaxFilterFunction,
                headerFilterLiveFilter: false,
                resizable: false,
                hozAlign: "center",
                formatter: priceFormatter,
                cssClass: "standalone-header"
            },
            {
                title: "Player Stats", 
                columns: [
                    { title: "Split", field: "Split", widthGrow: 0, minWidth: 55, headerFilter: createCustomMultiSelect, resizable: false, hozAlign: "center", formatter: splitFormatter },
                    { title: "Med", field: "Player DK Median", widthGrow: 0, minWidth: 45, sorter: "number", resizable: false, formatter: oneDecimalFormatter, hozAlign: "center", cssClass: "cluster-stats" },
                    { title: "Avg", field: "Player DK Average", widthGrow: 0, minWidth: 45, sorter: "number", resizable: false, formatter: oneDecimalFormatter, hozAlign: "center", cssClass: "cluster-stats" },
                    { title: "High", field: "Player DK High", widthGrow: 0, minWidth: 45, sorter: "number", resizable: false, formatter: oneDecimalFormatter, hozAlign: "center", cssClass: "cluster-stats" },
                    { title: "Low", field: "Player DK Low", widthGrow: 0, minWidth: 45, sorter: "number", resizable: false, formatter: oneDecimalFormatter, hozAlign: "center", cssClass: "cluster-stats" }
                ]
            },
            {
                title: "Opponent", 
                columns: [
                    { title: "DK Pts Rank", field: "Opponent DK Rank", widthGrow: 0, minWidth: 55, sorter: (a, b) => self.rankWithValueSorter(a, b), resizable: false, hozAlign: "center", formatter: rankFormatter, cssClass: "cluster-opponent", titleFormatter: () => "DK Pts<br>Rank" },
                    { title: "Season Pace Rank", field: "Opponent Pace Rank", widthGrow: 0, minWidth: 55, sorter: "number", resizable: false, hozAlign: "center", formatter: rankFormatter, cssClass: "cluster-opponent", titleFormatter: () => "Season<br>Pace<br>Rank" }
                ]
            },
            {
                title: "Points/Price Ratio", 
                columns: [
                    { title: "Med", field: "Player Median Ratio", widthGrow: 0, minWidth: 50, sorter: (a, b) => self.ratioSorter(a, b), resizable: false, formatter: ratioFormatter, hozAlign: "center", cssClass: "cluster-ratio" },
                    { title: "High", field: "Player High Ratio", widthGrow: 0, minWidth: 50, sorter: (a, b) => self.ratioSorter(a, b), resizable: false, formatter: ratioFormatter, hozAlign: "center", cssClass: "cluster-ratio" }
                ]
            }
        ];
    }

    createNameFormatter() {
        return (cell) => {
            const value = cell.getValue();
            if (!value) return '-';
            
            const data = cell.getRow().getData();
            const expanded = data._expanded || false;
            
            const container = document.createElement('div');
            container.style.cssText = 'display: flex; align-items: center; cursor: pointer;';
            
            const icon = document.createElement('span');
            icon.className = 'expand-icon';
            icon.style.cssText = 'margin-right: 6px; font-size: 10px; transition: transform 0.2s; color: #f97316; display: inline-flex; width: 12px; flex-shrink: 0;';
            icon.innerHTML = '▶';
            if (expanded) icon.style.transform = 'rotate(90deg)';
            
            const text = document.createElement('span');
            text.textContent = value;
            text.style.cssText = 'font-weight: 500; white-space: nowrap;';
            
            container.appendChild(icon);
            container.appendChild(text);
            
            return container;
        };
    }

    setupRowExpansion() {
        if (!this.table) return;
        
        const self = this;
        let expansionTimeout;
        
        this.table.on("cellClick", (e, cell) => {
            if (cell.getField() !== "Player Name") return;
            
            e.preventDefault();
            e.stopPropagation();
            
            if (expansionTimeout) clearTimeout(expansionTimeout);
            
            expansionTimeout = setTimeout(() => {
                const row = cell.getRow();
                const data = row.getData();
                
                data._expanded = !data._expanded;
                
                const rowId = self.generateRowId(data);
                if (data._expanded) {
                    self.expandedRowsCache.add(rowId);
                    if (window.globalExpandedState) window.globalExpandedState.set(`${self.elementId}_${rowId}`, true);
                } else {
                    self.expandedRowsCache.delete(rowId);
                    if (window.globalExpandedState) window.globalExpandedState.delete(`${self.elementId}_${rowId}`);
                }
                
                row.update(data);
                
                const expanderIcon = cell.getElement().querySelector('.expand-icon');
                if (expanderIcon) expanderIcon.style.transform = data._expanded ? 'rotate(90deg)' : '';
                
                requestAnimationFrame(() => {
                    row.reformat();
                    // Re-apply widths after expansion to ensure Name column stays correct
                    setTimeout(() => self.calculateAndApplyWidths(), 100);
                });
            }, 50);
        });
    }

    createRowFormatter() {
        const self = this;
        
        return (row) => {
            const data = row.getData();
            const rowElement = row.getElement();
            
            if (data._expanded === undefined) data._expanded = false;
            
            rowElement.classList.toggle('row-expanded', data._expanded);
            
            if (data._expanded) {
                if (!rowElement.querySelector('.subrow-container')) {
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
                            holderEl.innerHTML = '<div style="padding: 10px; color: red;">Error loading details</div>';
                        }
                        
                        rowElement.appendChild(holderEl);
                        
                        setTimeout(() => {
                            row.normalizeHeight();
                            // Re-apply widths after normalizeHeight
                            self.calculateAndApplyWidths();
                        }, 50);
                    });
                }
            } else {
                const existingSubrow = rowElement.querySelector('.subrow-container');
                if (existingSubrow) {
                    existingSubrow.remove();
                    setTimeout(() => {
                        row.normalizeHeight();
                        self.calculateAndApplyWidths();
                    }, 50);
                }
            }
        };
    }

    formatMinutes(value) {
        if (value === null || value === undefined || value === '' || value === '-') return '-';
        const num = parseFloat(value);
        return isNaN(num) ? '-' : num.toFixed(1);
    }

    formatMatchupTotal(value) {
        if (value === null || value === undefined || value === '' || value === '-') return '-';
        const str = String(value);
        if (str.includes('O/U')) {
            const match = str.match(/O\/U\s*([\d.]+)/);
            if (match && match[1]) {
                const num = parseFloat(match[1]);
                if (!isNaN(num)) return 'O/U ' + num.toFixed(1);
            }
            return str;
        }
        const num = parseFloat(str);
        return isNaN(num) ? str : num.toFixed(1);
    }

    formatPercentage(value) {
        if (value === null || value === undefined || value === '' || value === '-') return '-';
        const num = parseFloat(value);
        return isNaN(num) ? '-' : (num * 100).toFixed(1) + '%';
    }

    createSubtableContent(container, data) {
        const matchup = data["Matchup"] || '-';
        const spread = data["Matchup Spread"] || '-';
        const total = this.formatMatchupTotal(data["Matchup Total"]);
        
        const gamesPlayed = data["Player Games Played"] || '-';
        const medianMinutes = this.formatMinutes(data["Player Median Minutes"]);
        const avgMinutes = this.formatMinutes(data["Player Average Minutes"]);
        
        const player2PtFT = this.formatPercentage(data["Player 2Pt/FT Per"]);
        const player3Ps = this.formatPercentage(data["Player 3Ps Per"]);
        const playerRebs = this.formatPercentage(data["Player Rebounds Per"]);
        const playerAsts = this.formatPercentage(data["Player Assists Per"]);
        const playerBlks = this.formatPercentage(data["Player Blocks Per"]);
        const playerStls = this.formatPercentage(data["Player Steals Per"]);
        const playerTOs = this.formatPercentage(data["Player Turnovers Per"]);
        const playerDDs = this.formatPercentage(data["Player DD Per"]);
        const playerTDs = this.formatPercentage(data["Player TD Per"]);
        
        const opp2PtFT = this.formatPercentage(data["Opponent 2Pt/FT Per"]);
        const opp3Ps = this.formatPercentage(data["Opponent 3Ps Per"]);
        const oppRebs = this.formatPercentage(data["Opponent Rebounds Per"]);
        const oppAsts = this.formatPercentage(data["Opponent Assists Per"]);
        const oppBlks = this.formatPercentage(data["Opponent Blocks Per"]);
        const oppStls = this.formatPercentage(data["Opponent Steals Per"]);
        const oppTOs = this.formatPercentage(data["Opponent Turnovers Per"]);
        const oppDDs = this.formatPercentage(data["Opponent DD Per"]);
        const oppTDs = this.formatPercentage(data["Opponent TD Per"]);
        
        container.innerHTML = `
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
                                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd;">DDs</th>
                                <th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #ddd;">TDs</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 4px 8px; font-weight: 600; color: #333;">Player DK Point %</td>
                                <td style="padding: 4px 8px; text-align: center;">${player2PtFT}</td>
                                <td style="padding: 4px 8px; text-align: center;">${player3Ps}</td>
                                <td style="padding: 4px 8px; text-align: center;">${playerRebs}</td>
                                <td style="padding: 4px 8px; text-align: center;">${playerAsts}</td>
                                <td style="padding: 4px 8px; text-align: center;">${playerBlks}</td>
                                <td style="padding: 4px 8px; text-align: center;">${playerStls}</td>
                                <td style="padding: 4px 8px; text-align: center;">${playerTOs}</td>
                                <td style="padding: 4px 8px; text-align: center;">${playerDDs}</td>
                                <td style="padding: 4px 8px; text-align: center;">${playerTDs}</td>
                            </tr>
                            <tr style="background: #fafafa;">
                                <td style="padding: 4px 8px; font-weight: 600; color: #333;">Opponent DK Point %</td>
                                <td style="padding: 4px 8px; text-align: center;">${opp2PtFT}</td>
                                <td style="padding: 4px 8px; text-align: center;">${opp3Ps}</td>
                                <td style="padding: 4px 8px; text-align: center;">${oppRebs}</td>
                                <td style="padding: 4px 8px; text-align: center;">${oppAsts}</td>
                                <td style="padding: 4px 8px; text-align: center;">${oppBlks}</td>
                                <td style="padding: 4px 8px; text-align: center;">${oppStls}</td>
                                <td style="padding: 4px 8px; text-align: center;">${oppTOs}</td>
                                <td style="padding: 4px 8px; text-align: center;">${oppDDs}</td>
                                <td style="padding: 4px 8px; text-align: center;">${oppTDs}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
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
