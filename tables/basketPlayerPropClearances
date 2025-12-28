// tables/basketPlayerPropClearances.js - Basketball Player Prop Clearances Table
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
            placeholder: "Loading basketball player prop clearances...",
            columns: this.getColumns(),
            initialSort: [
                {column: "Player Name", dir: "asc"},
                {column: "Player Team", dir: "asc"},
                {column: "Player Prop", dir: "asc"},
                {column: "Player Prop Value", dir: "asc"}
            ],
            rowFormatter: this.createRowFormatter()
        };

        this.table = new Tabulator(this.elementId, config);
        
        // Use the base class setupRowExpansion for proper global state management
        this.setupRowExpansion();
        
        this.table.on("tableBuilt", () => {
            console.log("Basketball Player Prop Clearances table built successfully");
        });
    }

    // Custom sorter for "X/Y" format (e.g., "19/31") - sorts by first number
    gamesPlayedSorter(a, b, aRow, bRow, column, dir, sorterParams) {
        // Extract first number from "X/Y" format
        const getFirstNum = (val) => {
            if (!val || val === '-') return -1;
            const str = String(val);
            if (str.includes('/')) {
                return parseInt(str.split('/')[0], 10) || 0;
            }
            return parseInt(str, 10) || 0;
        };
        
        const aNum = getFirstNum(a);
        const bNum = getFirstNum(b);
        
        return aNum - bNum;
    }

    // Custom sorter for "X (Y.Y)" format (e.g., "21 (25.2)") - sorts by first number
    rankWithValueSorter(a, b, aRow, bRow, column, dir, sorterParams) {
        const getFirstNum = (val) => {
            if (!val || val === '-') return 9999; // Sort blanks to end
            const str = String(val);
            if (str.includes('(')) {
                return parseInt(str.split('(')[0].trim(), 10) || 9999;
            }
            return parseInt(str, 10) || 9999;
        };
        
        const aNum = getFirstNum(a);
        const bNum = getFirstNum(b);
        
        return aNum - bNum;
    }

    getColumns() {
        const self = this;
        
        // Formatter for clearance percentage (always 1 decimal)
        const clearanceFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const num = parseFloat(value);
            if (isNaN(num)) return '-';
            return (num * 100).toFixed(1) + '%';
        };

        // Formatter for decimal values (always 1 decimal)
        const oneDecimalFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const num = parseFloat(value);
            if (isNaN(num)) return '-';
            return num.toFixed(1);
        };

        // Formatter for odds (adds + prefix for positive)
        const oddsFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const num = parseInt(value, 10);
            if (isNaN(num)) return '-';
            return num > 0 ? `+${num}` : `${num}`;
        };

        // Formatter for Opponent Prop Rank "X (Y.Y)" format - ensures 1 decimal on second number
        const rankWithValueFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const str = String(value);
            
            // If it's already in "X (Y.Y)" format, ensure decimal formatting
            if (str.includes('(')) {
                const parts = str.match(/^(\d+)\s*\(([^)]+)\)$/);
                if (parts) {
                    const rank = parts[1];
                    const avg = parseFloat(parts[2]);
                    if (!isNaN(avg)) {
                        return `${rank} (${avg.toFixed(1)})`;
                    }
                }
            }
            return str;
        };

        return [
            // Player Info Group
            {title: "Player Info", columns: [
                {
                    title: "Name", 
                    field: "Player Name", 
                    width: 160, 
                    minWidth: 130,
                    sorter: "string", 
                    headerFilter: true,
                    resizable: false,
                    formatter: this.createNameFormatter(),
                    frozen: true
                },
                {
                    title: "Team", 
                    field: "Player Team", 
                    width: 70,
                    minWidth: 55,
                    sorter: "string", 
                    headerFilter: (cell, onRendered, success, cancel, editorParams) => {
                        return createCustomMultiSelect(cell, onRendered, success, cancel, {
                            dropdownWidth: 80
                        });
                    },
                    resizable: false,
                    hozAlign: "center"
                }
            ]},
            
            // Prop Info Group
            {title: "Prop Info", columns: [
                {
                    title: "Prop", 
                    field: "Player Prop", 
                    width: 110, 
                    minWidth: 90,
                    sorter: "string", 
                    headerFilter: (cell, onRendered, success, cancel, editorParams) => {
                        return createCustomMultiSelect(cell, onRendered, success, cancel, {
                            dropdownWidth: 160
                        });
                    },
                    resizable: false
                },
                {
                    title: "Line", 
                    field: "Player Prop Value", 
                    width: 75, 
                    minWidth: 65,
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
                    width: 85, 
                    minWidth: 70,
                    headerFilter: (cell, onRendered, success, cancel, editorParams) => {
                        return createCustomMultiSelect(cell, onRendered, success, cancel, {
                            dropdownWidth: 120
                        });
                    },
                    resizable: false,
                    hozAlign: "center"
                }
            ]},

            // Clearance Data Group
            {title: "Clearance", columns: [
                {
                    title: "% Over", 
                    field: "Player Clearance", 
                    width: 80, 
                    minWidth: 70,
                    sorter: "number",
                    sorterParams: {dir: "desc"},
                    resizable: false,
                    formatter: clearanceFormatter,
                    hozAlign: "center"
                },
                {
                    title: "Games", 
                    field: "Player Games", 
                    width: 75, 
                    minWidth: 65,
                    sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                        return self.gamesPlayedSorter(a, b, aRow, bRow, column, dir, sorterParams);
                    },
                    resizable: false,
                    hozAlign: "center"
                }
            ]},

            // Matchup Context Group
            {title: "Opponent", columns: [
                {
                    title: "Pace Rnk", 
                    field: "Opponent Pace Rank", 
                    width: 70, 
                    minWidth: 60,
                    sorter: "number",
                    resizable: false,
                    hozAlign: "center"
                },
                {
                    title: "Prop Rnk", 
                    field: "Opponent Prop Rank", 
                    width: 90, 
                    minWidth: 75,
                    sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                        return self.rankWithValueSorter(a, b, aRow, bRow, column, dir, sorterParams);
                    },
                    formatter: rankWithValueFormatter,
                    resizable: false,
                    hozAlign: "center"
                }
            ]},

            // Lineup Status
            {
                title: "Lineup", 
                field: "Lineup Status", 
                width: 85, 
                minWidth: 70,
                sorter: "string",
                headerFilter: (cell, onRendered, success, cancel, editorParams) => {
                    return createCustomMultiSelect(cell, onRendered, success, cancel, {
                        dropdownWidth: 120
                    });
                },
                resizable: false,
                hozAlign: "center"
            },

            // Statistical Summary Group
            {title: "Player Stats", columns: [
                {
                    title: "Median", 
                    field: "Player Prop Median", 
                    width: 70, 
                    minWidth: 60,
                    sorter: "number",
                    headerFilter: createMinMaxFilter,
                    headerFilterFunc: minMaxFilterFunction,
                    headerFilterLiveFilter: false,
                    resizable: false,
                    hozAlign: "center",
                    formatter: oneDecimalFormatter
                },
                {
                    title: "Avg", 
                    field: "Player Prop Average", 
                    width: 65, 
                    minWidth: 55,
                    sorter: "number",
                    headerFilter: createMinMaxFilter,
                    headerFilterFunc: minMaxFilterFunction,
                    headerFilterLiveFilter: false,
                    resizable: false,
                    hozAlign: "center",
                    formatter: oneDecimalFormatter
                },
                {
                    title: "High", 
                    field: "Player Prop High", 
                    width: 60, 
                    minWidth: 50,
                    sorter: "number",
                    headerFilter: createMinMaxFilter,
                    headerFilterFunc: minMaxFilterFunction,
                    headerFilterLiveFilter: false,
                    resizable: false,
                    hozAlign: "center"
                },
                {
                    title: "Low", 
                    field: "Player Prop Low", 
                    width: 55, 
                    minWidth: 50,
                    sorter: "number",
                    headerFilter: createMinMaxFilter,
                    headerFilterFunc: minMaxFilterFunction,
                    headerFilterLiveFilter: false,
                    resizable: false,
                    hozAlign: "center"
                },
                {
                    title: "Mode", 
                    field: "Player Prop Mode", 
                    width: 60, 
                    minWidth: 50,
                    sorter: "number",
                    headerFilter: createMinMaxFilter,
                    headerFilterFunc: minMaxFilterFunction,
                    headerFilterLiveFilter: false,
                    resizable: false,
                    hozAlign: "center"
                }
            ]},

            // Median Odds Group
            {title: "Median Odds", columns: [
                {
                    title: "Over", 
                    field: "Player Median Over Odds", 
                    width: 70, 
                    minWidth: 60,
                    sorter: "number",
                    headerFilter: createMinMaxFilter,
                    headerFilterFunc: minMaxFilterFunction,
                    headerFilterLiveFilter: false,
                    resizable: false,
                    formatter: oddsFormatter,
                    hozAlign: "center"
                },
                {
                    title: "Under", 
                    field: "Player Median Under Odds", 
                    width: 70, 
                    minWidth: 60,
                    sorter: "number",
                    headerFilter: createMinMaxFilter,
                    headerFilterFunc: minMaxFilterFunction,
                    headerFilterLiveFilter: false,
                    resizable: false,
                    formatter: oddsFormatter,
                    hozAlign: "center"
                }
            ]},

            // Best Odds Group
            {title: "Best Odds", columns: [
                {
                    title: "Over", 
                    field: "Player Best Over Odds", 
                    width: 70, 
                    minWidth: 60,
                    sorter: "number",
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
                    width: 70, 
                    minWidth: 60,
                    sorter: "number",
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
            
            // Initialize _expanded if undefined
            if (data._expanded === undefined) {
                data._expanded = false;
            }
            
            // Clear any existing subrow
            const existingSubrow = rowElement.querySelector('.subrow-container');
            if (existingSubrow) {
                existingSubrow.remove();
            }
            
            // If expanded, create and append the expandable content
            if (data._expanded) {
                const subrowContainer = document.createElement('div');
                subrowContainer.className = 'subrow-container';
                subrowContainer.style.cssText = `
                    padding: 15px 20px;
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    border-top: 2px solid #667eea;
                    margin-top: 0;
                `;
                
                // Create expandable content
                this.createExpandableContent(subrowContainer, data);
                
                rowElement.appendChild(subrowContainer);
                rowElement.style.backgroundColor = '#f0f4ff';
            } else {
                rowElement.style.backgroundColor = '';
            }
        };
    }

    createExpandableContent(container, data) {
        // Formatter for 1 decimal values
        const formatDecimal = (value) => {
            if (value === null || value === undefined || value === '') return '-';
            const num = parseFloat(value);
            if (isNaN(num)) return '-';
            return num.toFixed(1);
        };

        // Build the expandable content HTML
        const html = `
            <div style="display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start;">
                <!-- Matchup Info -->
                <div style="flex: 1; min-width: 250px;">
                    <h4 style="margin: 0 0 10px 0; color: #667eea; font-size: 14px; font-weight: 600; border-bottom: 2px solid #667eea; padding-bottom: 5px;">
                        Matchup Details
                    </h4>
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <tr>
                            <td style="padding: 6px 10px; font-weight: 500; color: #555; width: 40%;">Matchup:</td>
                            <td style="padding: 6px 10px; color: #333;">${data['Matchup'] || '-'}</td>
                        </tr>
                        <tr style="background: rgba(102, 126, 234, 0.05);">
                            <td style="padding: 6px 10px; font-weight: 500; color: #555;">Spread:</td>
                            <td style="padding: 6px 10px; color: #333;">${formatDecimal(data['Matchup Spread'])}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 10px; font-weight: 500; color: #555;">Total:</td>
                            <td style="padding: 6px 10px; color: #333;">${formatDecimal(data['Matchup Total'])}</td>
                        </tr>
                    </table>
                </div>
                
                <!-- Minutes Info -->
                <div style="flex: 1; min-width: 200px;">
                    <h4 style="margin: 0 0 10px 0; color: #667eea; font-size: 14px; font-weight: 600; border-bottom: 2px solid #667eea; padding-bottom: 5px;">
                        Minutes Data
                    </h4>
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <tr>
                            <td style="padding: 6px 10px; font-weight: 500; color: #555; width: 50%;">Median Minutes:</td>
                            <td style="padding: 6px 10px; color: #333;">${formatDecimal(data['Player Median Minutes'])}</td>
                        </tr>
                        <tr style="background: rgba(102, 126, 234, 0.05);">
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
