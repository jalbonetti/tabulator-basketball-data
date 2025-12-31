// tables/basketPlayerPropClearances.js - Basketball Player Prop Clearances (v3 - All Fixes)
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
            virtualDom: true,
            virtualDomBuffer: 500,
            renderVertical: "virtual",
            pagination: false,
            paginationSize: false,
            layoutColumnsOnNewData: false,
            responsiveLayout: false,
            layout: "fitColumns",
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

    // Custom sorter for "X/Y" format
    gamesPlayedSorter(a, b, aRow, bRow, column, dir, sorterParams) {
        const getFirstNum = (val) => {
            if (!val || val === '-') return -1;
            const str = String(val).trim();
            const match = str.match(/^(\d+)/);
            if (match) return parseInt(match[1], 10);
            return -1;
        };
        return getFirstNum(a) - getFirstNum(b);
    }

    // Custom sorter for "X (Y.Y)" format
    rankWithValueSorter(a, b, aRow, bRow, column, dir, sorterParams) {
        const getFirstNum = (val) => {
            if (!val || val === '-') return 9999;
            const str = String(val).trim();
            const match = str.match(/^(\d+)/);
            if (match) return parseInt(match[1], 10);
            return 9999;
        };
        return getFirstNum(a) - getFirstNum(b);
    }

    // Custom sorter for odds
    oddsSorter(a, b, aRow, bRow, column, dir, sorterParams) {
        const getOddsNum = (val) => {
            if (!val || val === '-') return 0;
            const str = String(val).trim();
            const match = str.match(/^([+-]?\d+)/);
            if (match) return parseInt(match[1], 10);
            return 0;
        };
        return getOddsNum(a) - getOddsNum(b);
    }

    // Helper to extract book name from odds string
    extractBookName(oddsStr) {
        if (!oddsStr || oddsStr === '-') return '-';
        const str = String(oddsStr);
        const match = str.match(/\(([^)]+)\)/);
        return match ? match[1] : '-';
    }

    getColumns() {
        const self = this;
        
        // Clearance formatter - 1 decimal place only
        const clearanceFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const str = String(value).replace('%', '').trim();
            const num = parseFloat(str);
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

        // Simple odds formatter - just the number
        const simpleOddsFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const str = String(value).trim();
            const match = str.match(/^([+-]?\d+)/);
            if (match) {
                const num = parseInt(match[1], 10);
                return num > 0 ? `+${num}` : `${num}`;
            }
            const num = parseInt(str, 10);
            if (isNaN(num)) return '-';
            return num > 0 ? `+${num}` : `${num}`;
        };

        // Prop formatter - abbreviate "3-Pointers" to "3-PTs"
        const propFormatter = (cell) => {
            const value = cell.getValue();
            if (!value) return '-';
            const str = String(value);
            if (str === '3-Pointers') return '3-PTs';
            return str;
        };

        // Split formatter - abbreviate values
        const splitFormatter = (cell) => {
            const value = cell.getValue();
            if (!value) return '-';
            const str = String(value);
            if (str === 'Full Season') return 'Season';
            if (str === 'Last 30 Days') return 'L30 Days';
            return str;
        };

        // Lineup formatter - abbreviate values
        const lineupFormatter = (cell) => {
            const value = cell.getValue();
            if (!value) return '-';
            let str = String(value);
            str = str.replace('(Expected)', '(Exp)');
            str = str.replace('Expected', 'Exp');
            str = str.replace('Confirmed', 'Conf');
            str = str.replace('(Confirmed)', '(Conf)');
            return str;
        };

        return [
            // Player Info Group - NO FROZEN for mobile compatibility
            {title: "Player Info", columns: [
                {
                    title: "Name", 
                    field: "Player Name", 
                    minWidth: 130,
                    widthGrow: 2,
                    sorter: "string", 
                    headerFilter: true,
                    resizable: false,
                    formatter: this.createNameFormatter()
                },
                {
                    title: "Team", 
                    field: "Player Team", 
                    minWidth: 50,
                    widthGrow: 0.5,
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
                    minWidth: 70,
                    widthGrow: 0.8,
                    sorter: "string", 
                    headerFilter: createCustomMultiSelect,
                    resizable: false,
                    hozAlign: "center",
                    formatter: propFormatter
                },
                {
                    title: "Line", 
                    field: "Player Prop Value", 
                    minWidth: 55,
                    widthGrow: 0.5,
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
                    minWidth: 80,
                    widthGrow: 0.8,
                    headerFilter: createCustomMultiSelect,
                    resizable: false,
                    hozAlign: "center",
                    formatter: splitFormatter
                }
            ]},

            // Clearance Data Group
            {title: "Clearance", columns: [
                {
                    title: "% Over", 
                    field: "Player Clearance", 
                    minWidth: 65,
                    widthGrow: 0.6,
                    sorter: "number",
                    resizable: false,
                    formatter: clearanceFormatter,
                    hozAlign: "center"
                },
                {
                    title: "Games", 
                    field: "Player Games", 
                    minWidth: 55,
                    widthGrow: 0.5,
                    sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                        return self.gamesPlayedSorter(a, b, aRow, bRow, column, dir, sorterParams);
                    },
                    resizable: false,
                    hozAlign: "center"
                }
            ]},

            // Opponent Group - Headers can wrap to 3 lines
            {title: "Opponent", columns: [
                {
                    title: "Prop Rank (Avg)", 
                    field: "Opponent Prop Rank", 
                    minWidth: 65,
                    widthGrow: 0.7,
                    sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                        return self.rankWithValueSorter(a, b, aRow, bRow, column, dir, sorterParams);
                    },
                    resizable: false,
                    hozAlign: "center",
                    titleFormatter: function(cell) {
                        return "<div style='line-height:1.2; text-align:center;'>Prop<br>Rank<br>(Avg)</div>";
                    }
                },
                {
                    title: "Season Pace Rank", 
                    field: "Opponent Pace Rank", 
                    minWidth: 65,
                    widthGrow: 0.7,
                    sorter: "number",
                    resizable: false,
                    hozAlign: "center",
                    titleFormatter: function(cell) {
                        return "<div style='line-height:1.2; text-align:center;'>Season<br>Pace<br>Rank</div>";
                    }
                }
            ]},

            // Lineup Status
            {
                title: "Lineup", 
                field: "Lineup Status", 
                minWidth: 85,
                widthGrow: 0.8,
                sorter: "string",
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center",
                formatter: lineupFormatter
            },

            // Player Stats Group
            {title: "Player Stats", columns: [
                {
                    title: "Med", 
                    field: "Player Prop Median", 
                    minWidth: 48,
                    widthGrow: 0.5,
                    sorter: "number",
                    resizable: false,
                    hozAlign: "center",
                    formatter: oneDecimalFormatter
                },
                {
                    title: "Avg", 
                    field: "Player Prop Average", 
                    minWidth: 48,
                    widthGrow: 0.5,
                    sorter: "number",
                    resizable: false,
                    hozAlign: "center",
                    formatter: oneDecimalFormatter
                },
                {
                    title: "High", 
                    field: "Player Prop High", 
                    minWidth: 48,
                    widthGrow: 0.5,
                    sorter: "number",
                    resizable: false,
                    hozAlign: "center"
                },
                {
                    title: "Low", 
                    field: "Player Prop Low", 
                    minWidth: 45,
                    widthGrow: 0.5,
                    sorter: "number",
                    resizable: false,
                    hozAlign: "center"
                },
                {
                    title: "Mode", 
                    field: "Player Prop Mode", 
                    minWidth: 50,
                    widthGrow: 0.5,
                    sorter: "number",
                    resizable: false,
                    hozAlign: "center"
                }
            ]},

            // Median Odds Group
            {title: "Median Odds", columns: [
                {
                    title: "Over", 
                    field: "Player Median Over Odds", 
                    minWidth: 55,
                    widthGrow: 0.6,
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
                    minWidth: 55,
                    widthGrow: 0.6,
                    sorter: "number",
                    headerFilter: createMinMaxFilter,
                    headerFilterFunc: minMaxFilterFunction,
                    headerFilterLiveFilter: false,
                    resizable: false,
                    formatter: simpleOddsFormatter,
                    hozAlign: "center"
                }
            ]},

            // Best Odds Group - just numbers, books in expandable
            {title: "Best Odds", columns: [
                {
                    title: "Over", 
                    field: "Player Best Over Odds", 
                    minWidth: 55,
                    widthGrow: 0.6,
                    sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                        return self.oddsSorter(a, b, aRow, bRow, column, dir, sorterParams);
                    },
                    headerFilter: createMinMaxFilter,
                    headerFilterFunc: minMaxFilterFunction,
                    headerFilterLiveFilter: false,
                    resizable: false,
                    formatter: simpleOddsFormatter,
                    hozAlign: "center"
                },
                {
                    title: "Under", 
                    field: "Player Best Under Odds", 
                    minWidth: 55,
                    widthGrow: 0.6,
                    sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                        return self.oddsSorter(a, b, aRow, bRow, column, dir, sorterParams);
                    },
                    headerFilter: createMinMaxFilter,
                    headerFilterFunc: minMaxFilterFunction,
                    headerFilterLiveFilter: false,
                    resizable: false,
                    formatter: simpleOddsFormatter,
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
            
            const existingSubrow = rowElement.querySelector('.subrow-container');
            if (existingSubrow) {
                existingSubrow.remove();
            }
            
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
        // Extract book names from best odds
        const bestOverBook = this.extractBookName(data['Player Best Over Odds']);
        const bestUnderBook = this.extractBookName(data['Player Best Under Odds']);

        // Spread and Total are STRINGS with prefixes like "MIA +3.5" and "O/U 250.5"
        // Display them as-is, not as decimals
        const spreadValue = data['Matchup Spread'] || '-';
        const totalValue = data['Matchup Total'] || '-';
        
        // For minutes, format as decimals
        const formatDecimal = (value) => {
            if (value === null || value === undefined || value === '') return '-';
            const num = parseFloat(value);
            if (isNaN(num)) return '-';
            return num.toFixed(1);
        };

        const html = `
            <div style="display: flex; flex-wrap: wrap; gap: 25px; align-items: flex-start;">
                <div style="flex: 1; min-width: 260px; max-width: 400px;">
                    <h4 style="margin: 0 0 10px 0; color: #ea580c; font-size: 14px; font-weight: 600; border-bottom: 2px solid #f97316; padding-bottom: 5px;">
                        Matchup Details
                    </h4>
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <tr>
                            <td style="padding: 6px 10px; font-weight: 500; color: #555; width: 30%;">Matchup:</td>
                            <td style="padding: 6px 10px; color: #333;">${data['Matchup'] || '-'}</td>
                        </tr>
                        <tr style="background: rgba(249, 115, 22, 0.05);">
                            <td style="padding: 6px 10px; font-weight: 500; color: #555;">Spread:</td>
                            <td style="padding: 6px 10px; color: #333;">${spreadValue}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 10px; font-weight: 500; color: #555;">Total:</td>
                            <td style="padding: 6px 10px; color: #333;">${totalValue}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="flex: 1; min-width: 180px; max-width: 260px;">
                    <h4 style="margin: 0 0 10px 0; color: #ea580c; font-size: 14px; font-weight: 600; border-bottom: 2px solid #f97316; padding-bottom: 5px;">
                        Minutes Data
                    </h4>
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <tr>
                            <td style="padding: 6px 10px; font-weight: 500; color: #555; width: 55%;">Median Min:</td>
                            <td style="padding: 6px 10px; color: #333;">${formatDecimal(data['Player Median Minutes'])}</td>
                        </tr>
                        <tr style="background: rgba(249, 115, 22, 0.05);">
                            <td style="padding: 6px 10px; font-weight: 500; color: #555;">Avg Min:</td>
                            <td style="padding: 6px 10px; color: #333;">${formatDecimal(data['Player Average Minutes'])}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="flex: 1; min-width: 180px; max-width: 260px;">
                    <h4 style="margin: 0 0 10px 0; color: #ea580c; font-size: 14px; font-weight: 600; border-bottom: 2px solid #f97316; padding-bottom: 5px;">
                        Best Odds Books
                    </h4>
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <tr>
                            <td style="padding: 6px 10px; font-weight: 500; color: #555; width: 45%;">Best Over:</td>
                            <td style="padding: 6px 10px; color: #333;">${bestOverBook}</td>
                        </tr>
                        <tr style="background: rgba(249, 115, 22, 0.05);">
                            <td style="padding: 6px 10px; font-weight: 500; color: #555;">Best Under:</td>
                            <td style="padding: 6px 10px; color: #333;">${bestUnderBook}</td>
                        </tr>
                    </table>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }
}
