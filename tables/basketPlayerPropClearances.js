// tables/basketPlayerPropClearances.js - Basketball Player Prop Clearances Table (OPTIMIZED)
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
                {column: "Player Name", dir: "asc"}
            ],
            dataLoaded: (data) => {
                console.log(`Basketball table loaded ${data.length} records`);
            }
        };

        this.table = new Tabulator(this.elementId, config);
        
        this.table.on("tableBuilt", () => {
            console.log("Basketball Player Prop Clearances table built successfully");
        });
    }

    getColumns() {
        // Simple formatters - return strings, not DOM elements
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
                    resizable: false
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
}
