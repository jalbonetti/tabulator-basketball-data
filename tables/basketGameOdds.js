// tables/basketGameOdds.js - Basketball Game Odds Table
// Simple flat table with no expandable rows or grouped headers

import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { createMinMaxFilter, minMaxFilterFunction } from '../components/minMaxFilter.js';
import { isMobile, isTablet } from '../shared/config.js';

export class BasketGameOddsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'BasketGameOdds');
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
            placeholder: "Loading game odds...",
            layout: "fitDataFill",
            
            columns: this.getColumns(isSmallScreen),
            initialSort: [
                {column: "Game Matchup", dir: "asc"}
            ],
            dataLoaded: (data) => {
                console.log(`Game Odds table loaded ${data.length} records successfully`);
                this.dataLoaded = true;
                
                if (data.length > 0) {
                    console.log('DEBUG - Game Odds First row sample:', {
                        'Game Matchup': data[0]["Game Matchup"],
                        'Game Prop Type': data[0]["Game Prop Type"],
                        'Game Odds': data[0]["Game Odds"]
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
                console.error("Error loading Game Odds data:", error);
            }
        };

        this.table = new Tabulator(this.elementId, config);
        
        this.table.on("tableBuilt", () => {
            console.log("Game Odds table built successfully");
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
            'cluster-odds': ['Game Odds', 'Game Median Odds', 'Game Best Odds']
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
                console.log(`Game Odds Cluster ${clusterName}: equalized to ${maxWidth}px`);
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
            const matchupColumn = this.table.getColumn("Game Matchup");
            if (matchupColumn) {
                const currentWidth = matchupColumn.getWidth();
                matchupColumn.setWidth(currentWidth + remainingSpace);
                console.log(`Game Odds Matchup column expanded by ${remainingSpace}px to fill container`);
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

        // Line formatter - always show 1 decimal place, but empty if null
        const lineFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '';
            const num = parseFloat(value);
            if (isNaN(num)) return '';
            return num.toFixed(1);
        };

        return [
            {
                title: "Matchup", 
                field: "Game Matchup", 
                frozen: isSmallScreen,
                widthGrow: 1,
                minWidth: 120,
                sorter: "string",
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "left"
            },
            {
                title: "Prop", 
                field: "Game Prop Type", 
                widthGrow: 0,
                minWidth: 60,
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center"
            },
            {
                title: "Label", 
                field: "Game Label", 
                widthGrow: 0,
                minWidth: 60,
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center"
            },
            {
                title: "Line", 
                field: "Game Line", 
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
                field: "Game Book", 
                widthGrow: 0,
                minWidth: 60,
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center"
            },
            {
                title: "Book Odds", 
                field: "Game Odds", 
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
                field: "Game Median Odds", 
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
                field: "Game Best Odds", 
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
                field: "Game Best Odds Books", 
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
