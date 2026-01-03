// tables/basketPlayerPropOdds.js - Basketball Player Prop Odds Table
// Simple flat table with no expandable rows or grouped headers

import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { createMinMaxFilter, minMaxFilterFunction } from '../components/minMaxFilter.js';
import { isMobile, isTablet } from '../shared/config.js';

export class BasketPlayerPropOddsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'BasketPlayerPropOdds');
    }

    initialize() {
        const mobile = isMobile();
        const tablet = isTablet();
        const isSmallScreen = mobile || tablet;
        
        const config = {
            ...this.tableConfig,
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
            placeholder: "Loading player prop odds...",
            layout: "fitDataFill",
            
            columns: this.getColumns(isSmallScreen),
            initialSort: [
                {column: "Player Name", dir: "asc"}
            ],
            dataLoaded: (data) => {
                console.log(`Player Prop Odds table loaded ${data.length} records successfully`);
                this.dataLoaded = true;
                
                if (data.length > 0) {
                    console.log('DEBUG - Player Prop Odds First row sample:', {
                        'Player Name': data[0]["Player Name"],
                        'Player Prop Type': data[0]["Player Prop Type"],
                        'Player Prop Odds': data[0]["Player Prop Odds"]
                    });
                }
                
                const element = document.querySelector(this.elementId);
                if (element) {
                    const loadingDiv = element.querySelector('.loading-indicator');
                    if (loadingDiv) {
                        loadingDiv.remove();
                    }
                }
            },
            ajaxError: (error) => {
                console.error("Error loading Player Prop Odds data:", error);
            }
        };

        this.table = new Tabulator(this.elementId, config);
        
        this.table.on("tableBuilt", () => {
            console.log("Player Prop Odds table built successfully");
            setTimeout(() => {
                this.equalizeClusteredColumns();
                if (!isSmallScreen) {
                    this.expandNameColumnToFill();
                }
            }, 200);
            
            if (!isSmallScreen) {
                window.addEventListener('resize', this.debounce(() => {
                    this.equalizeClusteredColumns();
                    this.expandNameColumnToFill();
                }, 250));
            }
        });
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
        
        // Define clusters for odds columns
        const clusters = {
            'cluster-odds': ['Player Prop Odds', 'Player Median Odds', 'Player Best Odds']
        };
        
        Object.keys(clusters).forEach(clusterName => {
            const fields = clusters[clusterName];
            let maxWidth = 0;
            
            fields.forEach(field => {
                const column = this.table.getColumn(field);
                if (column) {
                    const width = column.getWidth();
                    if (width > maxWidth) {
                        maxWidth = width;
                    }
                }
            });
            
            if (maxWidth > 0) {
                fields.forEach(field => {
                    const column = this.table.getColumn(field);
                    if (column) {
                        column.setWidth(maxWidth);
                    }
                });
                console.log(`Player Prop Odds Cluster ${clusterName}: equalized to ${maxWidth}px`);
            }
        });
    }
    
    expandNameColumnToFill() {
        if (!this.table) return;
        
        const tableElement = this.table.element;
        const containerWidth = tableElement.offsetWidth;
        
        let totalColumnWidth = 0;
        const columns = this.table.getColumns();
        columns.forEach(col => {
            totalColumnWidth += col.getWidth();
        });
        
        const remainingSpace = containerWidth - totalColumnWidth - 20;
        
        if (remainingSpace > 0) {
            const nameColumn = this.table.getColumn("Player Name");
            if (nameColumn) {
                const currentWidth = nameColumn.getWidth();
                nameColumn.setWidth(currentWidth + remainingSpace);
                console.log(`Player Prop Odds Name column expanded by ${remainingSpace}px to fill container`);
            }
        }
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
        
        // Odds formatter - handles +/- prefixes for display
        const oddsFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '' || value === '-') return '-';
            const num = parseInt(value, 10);
            if (isNaN(num)) return '-';
            return num > 0 ? `+${num}` : `${num}`;
        };

        // Line formatter - always show 1 decimal place
        const lineFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const num = parseFloat(value);
            if (isNaN(num)) return '-';
            return num.toFixed(1);
        };

        return [
            {
                title: "Name", 
                field: "Player Name", 
                frozen: isSmallScreen,
                widthGrow: 1,
                minWidth: 120,
                sorter: "string", 
                headerFilter: true,
                resizable: false,
                hozAlign: "left"
            },
            {
                title: "Matchup", 
                field: "Player Matchup", 
                widthGrow: 0,
                minWidth: 80,
                sorter: "string",
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center"
            },
            {
                title: "Team", 
                field: "Player Team", 
                widthGrow: 0,
                minWidth: 45,
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center"
            },
            {
                title: "Prop", 
                field: "Player Prop Type", 
                widthGrow: 0,
                minWidth: 60,
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center"
            },
            {
                title: "O/U", 
                field: "Player Over/Under", 
                widthGrow: 0,
                minWidth: 50,
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center"
            },
            {
                title: "Line", 
                field: "Player Prop Line", 
                widthGrow: 0,
                minWidth: 50,
                sorter: "number", 
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center",
                formatter: lineFormatter
            },
            {
                title: "Book", 
                field: "Player Book", 
                widthGrow: 0,
                minWidth: 60,
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center"
            },
            {
                title: "Book Odds", 
                field: "Player Prop Odds", 
                widthGrow: 0,
                minWidth: 55,
                sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                    return self.oddsSorter(a, b, aRow, bRow, column, dir, sorterParams);
                },
                headerFilter: createMinMaxFilter,
                headerFilterFunc: minMaxFilterFunction,
                headerFilterLiveFilter: false,
                resizable: false,
                formatter: oddsFormatter,
                hozAlign: "center",
                cssClass: "cluster-odds"
            },
            {
                title: "Median Odds", 
                field: "Player Median Odds", 
                widthGrow: 0,
                minWidth: 55,
                sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                    return self.oddsSorter(a, b, aRow, bRow, column, dir, sorterParams);
                },
                headerFilter: createMinMaxFilter,
                headerFilterFunc: minMaxFilterFunction,
                headerFilterLiveFilter: false,
                resizable: false,
                formatter: oddsFormatter,
                hozAlign: "center",
                cssClass: "cluster-odds"
            },
            {
                title: "Best Odds", 
                field: "Player Best Odds", 
                widthGrow: 0,
                minWidth: 55,
                sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                    return self.oddsSorter(a, b, aRow, bRow, column, dir, sorterParams);
                },
                headerFilter: createMinMaxFilter,
                headerFilterFunc: minMaxFilterFunction,
                headerFilterLiveFilter: false,
                resizable: false,
                formatter: oddsFormatter,
                hozAlign: "center",
                cssClass: "cluster-odds"
            },
            {
                title: "Best Books", 
                field: "Player Best Odds Books", 
                widthGrow: 0,
                minWidth: 70,
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center"
            }
        ];
    }
}
