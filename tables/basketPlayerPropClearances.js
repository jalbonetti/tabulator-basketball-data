// tables/basketPlayerPropClearances.js - Basketball Player Prop Clearances (matching baseball Alt pattern)
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
            // Optimize for large datasets - matching baseball Alt table pattern
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
            placeholder: "Loading basketball player prop clearances... This may take a moment for large datasets.",
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
                
                // Initialize expansion state
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
                console.error("Error loading basketball data:", error);
            }
        };

        this.table = new Tabulator(this.elementId, config);
        
        // Setup row expansion
        this.setupRowExpansion();
        
        this.table.on("tableBuilt", () => {
            console.log("Basketball Player Prop Clearances table built successfully");
        });
    }

    getColumns() {
        // Formatters
        const clearanceFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const num = parseFloat(value);
            if (isNaN(num)) return '-';
            return (num * 100).toFixed(1) + '%';
        };

        const oneDecimalFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const num = parseFloat(value);
            if (isNaN(num)) return '-';
            return num.toFixed(1);
        };

        const oddsFormatter = (cell) => {
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
                    width: 160, 
                    minWidth: 130,
                    sorter: "string", 
                    headerFilter: true,
                    resizable: false,
                    formatter: this.createNameFormatter()
                },
                {
                    title: "Team", 
                    field: "Player Team", 
                    width: 70,
                    minWidth: 55,
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
                    width: 110, 
                    minWidth: 90,
                    sorter: "string", 
                    headerFilter: createCustomMultiSelect,
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
                    width: 80, 
                    minWidth: 70,
                    sorter: "number",
                    resizable: false,
                    formatter: clearanceFormatter,
                    hozAlign: "center"
                },
                {
                    title: "Games", 
                    field: "Player Games", 
                    width: 75, 
                    minWidth: 65,
                    sorter: "string",
                    resizable: false,
                    hozAlign: "center"
                }
            ]},

            // Opponent Group
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
                    sorter: "string",
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
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center"
            },

            // Player Stats Group
            {title: "Player Stats", columns: [
                {
                    title: "Median", 
                    field: "Player Prop Median", 
                    width: 70, 
                    minWidth: 60,
                    sorter: "number",
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
                    resizable: false,
                    hozAlign: "center"
                },
                {
                    title: "Low", 
                    field: "Player Prop Low", 
                    width: 55, 
                    minWidth: 50,
                    sorter: "number",
                    resizable: false,
                    hozAlign: "center"
                },
                {
                    title: "Mode", 
                    field: "Player Prop Mode", 
                    width: 60, 
                    minWidth: 50,
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
                    width: 70, 
                    minWidth: 60,
                    sorter: "number",
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
                
                // Create expandable content
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

        const html = `
            <div style="display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start;">
                <div style="flex: 1; min-width: 250px;">
                    <h4 style="margin: 0 0 10px 0; color: #ea580c; font-size: 14px; font-weight: 600; border-bottom: 2px solid #f97316; padding-bottom: 5px;">
                        Matchup Details
                    </h4>
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <tr>
                            <td style="padding: 6px 10px; font-weight: 500; color: #555; width: 40%;">Matchup:</td>
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
                
                <div style="flex: 1; min-width: 200px;">
                    <h4 style="margin: 0 0 10px 0; color: #ea580c; font-size: 14px; font-weight: 600; border-bottom: 2px solid #f97316; padding-bottom: 5px;">
                        Minutes Data
                    </h4>
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <tr>
                            <td style="padding: 6px 10px; font-weight: 500; color: #555; width: 50%;">Median Minutes:</td>
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
