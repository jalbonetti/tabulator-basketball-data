// tables/basketPlayerPropClearances.js - Basketball Player Prop Clearances (FULLY UPDATED v2)
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
            // Fill the entire width of the container
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
                
                // Log first row to see all field names
                if (data.length > 0) {
                    console.log('First row data keys:', Object.keys(data[0]));
                    console.log('First row full data:', data[0]);
                }
                
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
            const match = str.match(/^(\d+)/);
            if (match) {
                return parseInt(match[1], 10);
            }
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

    // Custom sorter for odds - extracts number from formats like "-110 (DraftKings)"
    oddsSorter(a, b, aRow, bRow, column, dir, sorterParams) {
        const getOddsNum = (val) => {
            if (!val || val === '-') return 0;
            const str = String(val).trim();
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

    // Helper to extract book name from odds string like "-110 (DraftKings)"
    extractBookName(oddsStr) {
        if (!oddsStr || oddsStr === '-') return '-';
        const str = String(oddsStr);
        const match = str.match(/\(([^)]+)\)/);
        return match ? match[1] : '-';
    }

    // Helper to extract just the odds number from odds string
    extractOddsNumber(oddsStr) {
        if (!oddsStr || oddsStr === '-') return '-';
        const str = String(oddsStr).trim();
        const match = str.match(/^([+-]?\d+)/);
        if (match) {
            const num = parseInt(match[1], 10);
            return num > 0 ? `+${num}` : `${num}`;
        }
        return '-';
    }

    getColumns() {
        const self = this;
        
        // Clearance formatter - 1 decimal place only
        const clearanceFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const str = String(value);
            // Remove any existing % sign and parse
            const numStr = str.replace('%', '').trim();
            const num = parseFloat(numStr);
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

        // Simple odds formatter - just the number, no book name
        const simpleOddsFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const str = String(value).trim();
            // Extract just the number part
            const match = str.match(/^([+-]?\d+)/);
            if (match) {
                const num = parseInt(match[1], 10);
                return num > 0 ? `+${num}` : `${num}`;
            }
            const num = parseInt(str, 10);
            if (isNaN(num)) return '-';
            return num > 0 ? `+${num}` : `${num}`;
        };

        return [
            // Player Info Group - FROZEN for mobile scrolling
            {title: "Player Info", frozen: true, columns: [
                {
                    title: "Name", 
                    field: "Player Name", 
                    minWidth: 140,
                    widthGrow: 2,
                    sorter: "string", 
                    headerFilter: true,
                    resizable: false,
                    frozen: true,
                    formatter: this.createNameFormatter()
                },
                {
                    title: "Team", 
                    field: "Player Team", 
                    minWidth: 55,
                    widthGrow: 0.5,
                    sorter: "string", 
                    headerFilter: createCustomMultiSelect,
                    resizable: false,
                    frozen: true,
                    hozAlign: "center"
                }
            ]},
            
            // Prop Info Group
            {title: "Prop Info", columns: [
                {
                    title: "Prop", 
                    field: "Player Prop", 
                    minWidth: 90,
                    widthGrow: 1,
                    sorter: "string", 
                    headerFilter: createCustomMultiSelect,
                    resizable: false,
                    hozAlign: "center"
                },
                {
                    title: "Line", 
                    field: "Player Prop Value", 
                    minWidth: 60,
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
                    minWidth: 100,
                    widthGrow: 1,
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
                    minWidth: 70,
                    widthGrow: 0.7,
                    sorter: "number",
                    resizable: false,
                    formatter: clearanceFormatter,
                    hozAlign: "center"
                },
                {
                    title: "Games", 
                    field: "Player Games", 
                    minWidth: 60,
                    widthGrow: 0.6,
                    sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                        return self.gamesPlayedSorter(a, b, aRow, bRow, column, dir, sorterParams);
                    },
                    resizable: false,
                    hozAlign: "center"
                }
            ]},

            // Opponent Group - Renamed columns
            {title: "Opponent", columns: [
                {
                    title: "Prop Rank (Avg)", 
                    field: "Opponent Prop Rank", 
                    minWidth: 95,
                    widthGrow: 1,
                    sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                        return self.rankWithValueSorter(a, b, aRow, bRow, column, dir, sorterParams);
                    },
                    resizable: false,
                    hozAlign: "center"
                },
                {
                    title: "Season Pace Rank", 
                    field: "Opponent Pace Rank", 
                    minWidth: 95,
                    widthGrow: 1,
                    sorter: "number",
                    resizable: false,
                    hozAlign: "center"
                }
            ]},

            // Lineup Status
            {
                title: "Lineup", 
                field: "Lineup Status", 
                minWidth: 100,
                widthGrow: 1,
                sorter: "string",
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center"
            },

            // Player Stats Group - "Med" instead of "Median", consistent widths
            {title: "Player Stats", columns: [
                {
                    title: "Med", 
                    field: "Player Prop Median", 
                    minWidth: 55,
                    widthGrow: 0.6,
                    sorter: "number",
                    resizable: false,
                    hozAlign: "center",
                    formatter: oneDecimalFormatter
                },
                {
                    title: "Avg", 
                    field: "Player Prop Average", 
                    minWidth: 55,
                    widthGrow: 0.6,
                    sorter: "number",
                    resizable: false,
                    hozAlign: "center",
                    formatter: oneDecimalFormatter
                },
                {
                    title: "High", 
                    field: "Player Prop High", 
                    minWidth: 55,
                    widthGrow: 0.6,
                    sorter: "number",
                    resizable: false,
                    hozAlign: "center"
                },
                {
                    title: "Low", 
                    field: "Player Prop Low", 
                    minWidth: 50,
                    widthGrow: 0.5,
                    sorter: "number",
                    resizable: false,
                    hozAlign: "center"
                },
                {
                    title: "Mode", 
                    field: "Player Prop Mode", 
                    minWidth: 55,
                    widthGrow: 0.6,
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
                    minWidth: 65,
                    widthGrow: 0.7,
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
                    minWidth: 65,
                    widthGrow: 0.7,
                    sorter: "number",
                    headerFilter: createMinMaxFilter,
                    headerFilterFunc: minMaxFilterFunction,
                    headerFilterLiveFilter: false,
                    resizable: false,
                    formatter: simpleOddsFormatter,
                    hozAlign: "center"
                }
            ]},

            // Best Odds Group - JUST THE NUMBER, book names in expandable section
            {title: "Best Odds", columns: [
                {
                    title: "Over", 
                    field: "Player Best Over Odds", 
                    minWidth: 65,
                    widthGrow: 0.7,
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
                    minWidth: 65,
                    widthGrow: 0.7,
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

        // Extract book names from best odds
        const bestOverBook = this.extractBookName(data['Player Best Over Odds']);
        const bestUnderBook = this.extractBookName(data['Player Best Under Odds']);

        // Debug: log all data keys to find the correct field names
        console.log('=== EXPANDABLE ROW DEBUG ===');
        console.log('All data keys:', Object.keys(data));
        
        // Try various possible field names for spread and total
        const spreadValue = data['Matchup Spread'] || data['MatchupSpread'] || data['Spread'] || data['matchup_spread'] || data['Game Spread'] || '-';
        const totalValue = data['Matchup Total'] || data['MatchupTotal'] || data['Total'] || data['matchup_total'] || data['Game Total'] || '-';
        
        console.log('Spread attempts:', {
            'Matchup Spread': data['Matchup Spread'],
            'MatchupSpread': data['MatchupSpread'],
            'Spread': data['Spread'],
            'matchup_spread': data['matchup_spread'],
            'Game Spread': data['Game Spread']
        });
        console.log('Total attempts:', {
            'Matchup Total': data['Matchup Total'],
            'MatchupTotal': data['MatchupTotal'],
            'Total': data['Total'],
            'matchup_total': data['matchup_total'],
            'Game Total': data['Game Total']
        });
        console.log('Final spread value:', spreadValue);
        console.log('Final total value:', totalValue);

        const html = `
            <div style="display: flex; flex-wrap: wrap; gap: 30px; align-items: flex-start;">
                <div style="flex: 1; min-width: 280px; max-width: 450px;">
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
                            <td style="padding: 6px 10px; color: #333;">${formatDecimal(spreadValue)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 10px; font-weight: 500; color: #555;">Total:</td>
                            <td style="padding: 6px 10px; color: #333;">${formatDecimal(totalValue)}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="flex: 1; min-width: 200px; max-width: 280px;">
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
                
                <div style="flex: 1; min-width: 200px; max-width: 280px;">
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
