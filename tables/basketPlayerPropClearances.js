// tables/basketPlayerPropClearances.js - Basketball Player Prop Clearances (FULLY UPDATED)
import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { createMinMaxFilter, minMaxFilterFunction } from '../components/minMaxFilter.js';

export class BasketPlayerPropClearancesTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'BasketPlayerPropClearances');
    }

    initialize() {
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
            columns: this.getColumns(),
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
        });
    }

    // Custom sorter for "X/Y" format - sorts by FULL first number (15 > 9, not 1 > 9)
    gamesPlayedSorter(a, b, aRow, bRow, column, dir, sorterParams) {
        const getFirstNum = (val) => {
            if (!val || val === '-') return -1;
            const str = String(val).trim();
            // Extract all digits before the slash
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
            // Extract all digits before the parenthesis or space
            const match = str.match(/^(\d+)/);
            if (match) {
                return parseInt(match[1], 10);
            }
            // If format is "X (Y.Y)", split and get first part
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
            // Extract the number (including negative sign) before any parenthesis
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

    getColumns() {
        const self = this;
        
        // Clearance formatter - value is already a %, just display it directly
        const clearanceFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            // Value is already a percentage like "75.5%" or just "75.5"
            const str = String(value);
            if (str.includes('%')) return str;
            const num = parseFloat(value);
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

        // Odds formatter - adds + prefix for positive, shows full value including book name
        const oddsFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const str = String(value);
            
            // If it already has a book name in parentheses, format appropriately
            if (str.includes('(')) {
                const parts = str.split('(');
                const numPart = parts[0].trim();
                const bookPart = '(' + parts[1];
                const num = parseInt(numPart, 10);
                if (isNaN(num)) return str;
                const formattedNum = num > 0 ? `+${num}` : `${num}`;
                return `${formattedNum} ${bookPart}`;
            }
            
            // Just a number
            const num = parseInt(str, 10);
            if (isNaN(num)) return '-';
            return num > 0 ? `+${num}` : `${num}`;
        };

        // Simple odds formatter for median odds (no book name)
        const simpleOddsFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const num = parseInt(value, 10);
            if (isNaN(num)) return '-';
            return num > 0 ? `+${num}` : `${num}`;
        };

        return [
            // Player Info Group
            {title: "Player Info", columns: [
                {
                    title: "Name", 
                    field: "Player Name", 
                    width: 150,
                    sorter: "string", 
                    headerFilter: true,
                    resizable: false,
                    formatter: this.createNameFormatter()
                },
                {
                    title: "Team", 
                    field: "Player Team", 
                    width: 65,
                    sorter: "string", 
                    headerFilter: createCustomMultiSelect,
                    resizable: false,
                    hozAlign: "center"
                }
            ]},
            
            // Prop Info Group
            {title: "Prop Info", columns: [
                {
                    title: "Prop", 
                    field: "Player Prop", 
                    width: 100,
                    sorter: "string", 
                    headerFilter: createCustomMultiSelect,
                    resizable: false,
                    hozAlign: "center"
                },
                {
                    title: "Line", 
                    field: "Player Prop Value", 
                    width: 70,
                    sorter: "number", 
                    headerFilter: createMinMaxFilter,
                    headerFilterFunc: minMaxFilterFunction,
                    headerFilterLiveFilter: false,
                    resizable: false,
                    hozAlign: "center"
                },
                {
                    title: "Split", 
                    field: "Split", 
                    width: 110,
                    headerFilter: createCustomMultiSelect,
                    resizable: false,
                    hozAlign: "center"
                }
            ]},

            // Clearance Data Group
            {title: "Clearance", columns: [
                {
                    title: "% Over", 
                    field: "Player Clearance", 
                    width: 75,
                    sorter: "number",
                    resizable: false,
                    formatter: clearanceFormatter,
                    hozAlign: "center"
                },
                {
                    title: "Games", 
                    field: "Player Games", 
                    width: 70,
                    sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                        return self.gamesPlayedSorter(a, b, aRow, bRow, column, dir, sorterParams);
                    },
                    resizable: false,
                    hozAlign: "center"
                }
            ]},

            // Opponent Group - SWAPPED: Prop Rank first, then Pace Rank
            {title: "Opponent", columns: [
                {
                    title: "Prop Rank", 
                    field: "Opponent Prop Rank", 
                    width: 90,
                    sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                        return self.rankWithValueSorter(a, b, aRow, bRow, column, dir, sorterParams);
                    },
                    resizable: false,
                    hozAlign: "center"
                },
                {
                    title: "Pace Rank", 
                    field: "Opponent Pace Rank", 
                    width: 85,
                    sorter: "number",
                    resizable: false,
                    hozAlign: "center"
                }
            ]},

            // Lineup Status
            {
                title: "Lineup", 
                field: "Lineup Status", 
                width: 110,
                sorter: "string",
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center"
            },

            // Player Stats Group - all same width (70px)
            {title: "Player Stats", columns: [
                {
                    title: "Median", 
                    field: "Player Prop Median", 
                    width: 70,
                    sorter: "number",
                    resizable: false,
                    hozAlign: "center",
                    formatter: oneDecimalFormatter
                },
                {
                    title: "Avg", 
                    field: "Player Prop Average", 
                    width: 70,
                    sorter: "number",
                    resizable: false,
                    hozAlign: "center",
                    formatter: oneDecimalFormatter
                },
                {
                    title: "High", 
                    field: "Player Prop High", 
                    width: 70,
                    sorter: "number",
                    resizable: false,
                    hozAlign: "center"
                },
                {
                    title: "Low", 
                    field: "Player Prop Low", 
                    width: 70,
                    sorter: "number",
                    resizable: false,
                    hozAlign: "center"
                },
                {
                    title: "Mode", 
                    field: "Player Prop Mode", 
                    width: 70,
                    sorter: "number",
                    resizable: false,
                    hozAlign: "center"
                }
            ]},

            // Median Odds Group - same width (75px), with min/max filters
            {title: "Median Odds", columns: [
                {
                    title: "Over", 
                    field: "Player Median Over Odds", 
                    width: 75,
                    sorter: "number",
                    headerFilter: createMinMaxFilter,
                    headerFilterFunc: minMaxFilterFunction,
                    headerFilterLiveFilter: false,
                    resizable: false,
                    formatter: simpleOddsFormatter,
                    hozAlign: "center"
                },
                {
                    title: "Under", 
                    field: "Player Median Under Odds", 
                    width: 75,
                    sorter: "number",
                    headerFilter: createMinMaxFilter,
                    headerFilterFunc: minMaxFilterFunction,
                    headerFilterLiveFilter: false,
                    resizable: false,
                    formatter: simpleOddsFormatter,
                    hozAlign: "center"
                }
            ]},

            // Best Odds Group - wider for book names, with min/max filters
            {title: "Best Odds", columns: [
                {
                    title: "Over", 
                    field: "Player Best Over Odds", 
                    width: 130,
                    minWidth: 100,
                    sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                        return self.oddsSorter(a, b, aRow, bRow, column, dir, sorterParams);
                    },
                    headerFilter: createMinMaxFilter,
                    headerFilterFunc: minMaxFilterFunction,
                    headerFilterLiveFilter: false,
                    resizable: false,
                    formatter: oddsFormatter,
                    hozAlign: "center"
                },
                {
                    title: "Under", 
                    field: "Player Best Under Odds", 
                    width: 130,
                    minWidth: 100,
                    sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                        return self.oddsSorter(a, b, aRow, bRow, column, dir, sorterParams);
                    },
                    headerFilter: createMinMaxFilter,
                    headerFilterFunc: minMaxFilterFunction,
                    headerFilterLiveFilter: false,
                    resizable: false,
                    formatter: oddsFormatter,
                    hozAlign: "center"
                }
            ]}
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
            
            // Clear any existing subrow
            const existingSubrow = rowElement.querySelector('.subrow-container');
            if (existingSubrow) {
                existingSubrow.remove();
            }
            
            // If expanded, create expandable content
            if (data._expanded) {
                const subrowContainer = document.createElement('div');
                subrowContainer.className = 'subrow-container';
                subrowContainer.style.cssText = `
                    padding: 15px 20px;
                    background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
                    border-top: 2px solid #f97316;
                    margin-top: 0;
                `;
                
                this.createExpandableContent(subrowContainer, data);
                
                rowElement.appendChild(subrowContainer);
                rowElement.style.backgroundColor = '#fff7ed';
            } else {
                rowElement.style.backgroundColor = '';
            }
        };
    }

    createExpandableContent(container, data) {
        const formatDecimal = (value) => {
            if (value === null || value === undefined || value === '') return '-';
            const num = parseFloat(value);
            if (isNaN(num)) return '-';
            return num.toFixed(1);
        };

        // Debug: log all data keys to see what's available
        console.log('Expandable row data keys:', Object.keys(data));
        console.log('Matchup Spread value:', data['Matchup Spread']);
        console.log('Matchup Total value:', data['Matchup Total']);

        const html = `
            <div style="display: flex; flex-wrap: wrap; gap: 30px; align-items: flex-start;">
                <div style="flex: 1; min-width: 300px; max-width: 500px;">
                    <h4 style="margin: 0 0 10px 0; color: #ea580c; font-size: 14px; font-weight: 600; border-bottom: 2px solid #f97316; padding-bottom: 5px;">
                        Matchup Details
                    </h4>
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <tr>
                            <td style="padding: 6px 10px; font-weight: 500; color: #555; width: 35%;">Matchup:</td>
                            <td style="padding: 6px 10px; color: #333;">${data['Matchup'] || '-'}</td>
                        </tr>
                        <tr style="background: rgba(249, 115, 22, 0.05);">
                            <td style="padding: 6px 10px; font-weight: 500; color: #555;">Spread:</td>
                            <td style="padding: 6px 10px; color: #333;">${formatDecimal(data['Matchup Spread'])}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 10px; font-weight: 500; color: #555;">Total:</td>
                            <td style="padding: 6px 10px; color: #333;">${formatDecimal(data['Matchup Total'])}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="flex: 1; min-width: 200px; max-width: 300px;">
                    <h4 style="margin: 0 0 10px 0; color: #ea580c; font-size: 14px; font-weight: 600; border-bottom: 2px solid #f97316; padding-bottom: 5px;">
                        Minutes Data
                    </h4>
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <tr>
                            <td style="padding: 6px 10px; font-weight: 500; color: #555; width: 55%;">Median Minutes:</td>
                            <td style="padding: 6px 10px; color: #333;">${formatDecimal(data['Player Median Minutes'])}</td>
                        </tr>
                        <tr style="background: rgba(249, 115, 22, 0.05);">
                            <td style="padding: 6px 10px; font-weight: 500; color: #555;">Average Minutes:</td>
                            <td style="padding: 6px 10px; color: #333;">${formatDecimal(data['Player Average Minutes'])}</td>
                        </tr>
                    </table>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }
}
