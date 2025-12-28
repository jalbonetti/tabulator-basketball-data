// styles/tableStyles.js - Basketball Table Styles
import { CONFIG, isMobile, isTablet, getDeviceScale } from '../shared/config.js';

export function injectStyles() {
    // Check if Webflow custom styles are already applied
    if (document.querySelector('style[data-table-styles="webflow"]')) {
        console.log('Using Webflow custom styles, applying minimal overrides only');
        injectMinimalStyles();
        return;
    }

    // Full style injection for non-Webflow environments
    injectFullStyles();
}

function injectMinimalStyles() {
    const style = document.createElement('style');
    style.setAttribute('data-source', 'github-basketball-minimal');
    style.textContent = `
        /* GitHub basketball table-specific settings only */
        
        /* CRITICAL FIX: Force visibility */
        .table-wrapper {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            width: 100% !important;
        }
        
        .table-container {
            display: block !important;
            visibility: visible !important;
        }
        
        /* Min/Max Filter Styles */
        .min-max-filter-container {
            display: flex !important;
            flex-direction: column !important;
            gap: 3px !important;
        }
        
        .min-max-input {
            width: 100% !important;
            padding: 3px 5px !important;
            font-size: 10px !important;
            border: 1px solid #ccc !important;
            border-radius: 2px !important;
            text-align: center !important;
        }
        
        .min-max-input:focus {
            outline: none !important;
            border-color: #667eea !important;
            box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2) !important;
        }
    `;
    document.head.appendChild(style);
    console.log('Basketball minimal styles injected');
}

function injectFullStyles() {
    const style = document.createElement('style');
    style.setAttribute('data-source', 'github-basketball-full');
    style.setAttribute('data-table-styles', 'github');
    style.textContent = `
        /* ===================================
           BASKETBALL TABLE STYLES
           =================================== */
        
        /* GLOBAL FONT SIZE */
        .tabulator,
        .tabulator *,
        .subrow-container,
        .subrow-container *,
        .tabulator-table,
        .tabulator-table *,
        .tabulator-header,
        .tabulator-header *,
        .tabulator-row,
        .tabulator-row *,
        .tabulator-cell,
        .tabulator-cell * {
            font-size: 13px !important;
            line-height: 1.4 !important;
        }
        
        /* Base table container styles */
        .table-container {
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
            position: relative;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        
        /* Tabulator base styles */
        .tabulator {
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            font-size: 13px !important;
            line-height: 1.4 !important;
            background-color: white;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            overflow: hidden;
        }
        
        /* Header styling - Basketball Orange/Blue theme */
        .tabulator-header {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            color: white;
            font-weight: bold;
            border-bottom: 2px solid #c2410c;
            font-size: 13px !important;
        }
        
        .tabulator-col {
            background: transparent;
            border-right: 1px solid rgba(255, 255, 255, 0.2);
            padding: 10px 6px;
            font-size: 13px !important;
        }
        
        .tabulator-col:last-child {
            border-right: none;
        }
        
        .tabulator-col-title {
            color: white;
            font-weight: 600;
            font-size: 12px !important;
        }
        
        /* Column group headers */
        .tabulator-col-group-cols {
            border-top: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .tabulator-col-group .tabulator-col-group-cols .tabulator-col {
            padding: 8px 4px;
        }
        
        /* Row styling with alternating colors */
        .tabulator-row {
            border-bottom: 1px solid #f0f0f0;
            transition: all 0.2s ease;
            font-size: 13px !important;
        }
        
        .tabulator-row:nth-child(even) {
            background-color: #fafafa;
        }
        
        .tabulator-row:hover {
            background-color: #fff7ed !important;
        }
        
        .tabulator-row.tabulator-selected {
            background-color: #ffedd5 !important;
        }
        
        /* Cell styling */
        .tabulator-cell {
            padding: 8px 6px;
            border-right: 1px solid #f0f0f0;
            font-size: 13px !important;
        }
        
        .tabulator-cell:last-child {
            border-right: none;
        }
        
        /* Frozen column styling */
        .tabulator-frozen {
            background-color: #fff !important;
            box-shadow: 2px 0 5px rgba(0,0,0,0.1);
        }
        
        .tabulator-frozen.tabulator-frozen-left {
            border-right: 2px solid #e0e0e0;
        }
        
        /* Header filter styling */
        .tabulator-header-filter {
            margin-top: 6px;
        }
        
        .tabulator-header-filter input {
            width: 100%;
            padding: 4px 6px;
            border: 1px solid rgba(255, 255, 255, 0.4);
            border-radius: 3px;
            font-size: 11px;
            background: rgba(255, 255, 255, 0.9);
            color: #333;
        }
        
        .tabulator-header-filter input:focus {
            outline: none;
            border-color: white;
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
        }
        
        .tabulator-header-filter input::placeholder {
            color: #999;
        }
        
        /* Min/Max Filter Styles */
        .min-max-filter-container {
            display: flex;
            flex-direction: column;
            gap: 3px;
            padding: 2px;
        }
        
        .min-max-input {
            width: 100%;
            padding: 3px 4px;
            font-size: 10px;
            border: 1px solid rgba(255, 255, 255, 0.4);
            border-radius: 2px;
            text-align: center;
            background: rgba(255, 255, 255, 0.9);
            color: #333;
        }
        
        .min-max-input:focus {
            outline: none;
            border-color: white;
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
        }
        
        .min-max-input::placeholder {
            color: #888;
            font-size: 9px;
        }
        
        /* Custom multi-select dropdown */
        .custom-multiselect-container {
            position: relative;
        }
        
        .custom-multiselect-input {
            background-color: rgba(255, 255, 255, 0.9) !important;
        }
        
        .custom-multiselect-dropdown {
            font-size: 12px;
        }
        
        /* Sorting indicators */
        .tabulator-col.tabulator-sortable .tabulator-col-title {
            padding-right: 20px;
        }
        
        .tabulator-col.tabulator-sortable[aria-sort="asc"] .tabulator-col-sorter,
        .tabulator-col.tabulator-sortable[aria-sort="desc"] .tabulator-col-sorter {
            color: white;
        }
        
        /* Expand icon in name column */
        .expand-icon {
            display: inline-block;
            width: 12px;
            text-align: center;
            color: #f97316;
            font-size: 10px;
        }
        
        /* Subrow / Expandable content styling */
        .subrow-container {
            padding: 15px 20px;
            background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
            border-top: 2px solid #f97316;
            font-size: 13px !important;
        }
        
        .subrow-container h4 {
            color: #ea580c;
            font-size: 14px;
            font-weight: 600;
            margin: 0 0 10px 0;
            padding-bottom: 5px;
            border-bottom: 2px solid #f97316;
        }
        
        .subrow-container table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }
        
        .subrow-container td {
            padding: 6px 10px;
        }
        
        .subrow-container tr:nth-child(even) {
            background: rgba(249, 115, 22, 0.05);
        }
        
        /* Scrollbar styling */
        .tabulator-tableHolder::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        
        .tabulator-tableHolder::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
        }
        
        .tabulator-tableHolder::-webkit-scrollbar-thumb {
            background: #c2410c;
            border-radius: 4px;
        }
        
        .tabulator-tableHolder::-webkit-scrollbar-thumb:hover {
            background: #9a3412;
        }
        
        /* Loading overlay */
        .tabulator-loader {
            background: rgba(255, 255, 255, 0.9);
        }
        
        .tabulator-loader-msg {
            color: #f97316;
            font-weight: 600;
        }
        
        /* Responsive adjustments */
        @media screen and (max-width: 1024px) {
            .tabulator,
            .tabulator *,
            .tabulator-cell,
            .tabulator-col-title {
                font-size: 12px !important;
            }
            
            .tabulator-cell {
                padding: 6px 4px;
            }
            
            .tabulator-col {
                padding: 8px 4px;
            }
            
            .min-max-input {
                font-size: 9px;
                padding: 2px 3px;
            }
        }
        
        @media screen and (max-width: 768px) {
            .tabulator,
            .tabulator *,
            .tabulator-cell,
            .tabulator-col-title {
                font-size: 11px !important;
            }
            
            .tabulator-cell {
                padding: 5px 3px;
            }
            
            .tabulator-col {
                padding: 6px 3px;
            }
            
            .subrow-container {
                padding: 10px 12px;
            }
            
            .min-max-input {
                font-size: 8px;
                padding: 2px;
            }
            
            .min-max-input::placeholder {
                font-size: 8px;
            }
        }
        
        /* Print styles */
        @media print {
            .tabulator {
                border: 1px solid #000;
            }
            
            .tabulator-header {
                background: #f97316 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .subrow-container {
                background: #fff7ed !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    `;
    
    document.head.appendChild(style);
    console.log('Basketball full styles injected');
}

// Apply responsive scaling
export function applyResponsiveScaling() {
    const scale = getDeviceScale();
    const tables = document.querySelectorAll('.tabulator');
    
    tables.forEach(table => {
        if (scale !== 1) {
            table.style.transform = `scale(${scale})`;
            table.style.transformOrigin = 'top left';
            table.style.width = `${100 / scale}%`;
        } else {
            table.style.transform = '';
            table.style.width = '';
        }
    });
}

// Initialize responsive behavior
if (typeof window !== 'undefined') {
    window.applyResponsiveScaling = applyResponsiveScaling;
    
    window.addEventListener('resize', () => {
        applyResponsiveScaling();
    });
}
