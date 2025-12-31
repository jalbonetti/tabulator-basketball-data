// styles/tableStyles.js - Basketball Table Styles
// UPDATED: 
// - Center-justified headers (both primary and secondary)
// - Dropdown filters positioned above table
// - Auto-fit column widths
// - Frozen column support for Name on mobile/tablet
// - Responsive text scaling for desktop

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
        
        /* CRITICAL: No word wrapping in headers - single line */
        .tabulator-col-title {
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
        }
        
        /* CENTER JUSTIFY ALL HEADERS - Primary and Secondary */
        .tabulator-col-title,
        .tabulator-col-group .tabulator-col-title {
            text-align: center !important;
            justify-content: center !important;
        }
        
        /* CRITICAL: Dropdown filters open ABOVE with maximum z-index */
        .custom-multiselect-dropdown,
        [id^="dropdown_"] {
            z-index: 2147483647 !important;
            position: fixed !important;
        }
        
        /* Ensure header allows overflow for dropdowns */
        .tabulator-header {
            overflow: visible !important;
        }
        
        .tabulator-header-filter {
            overflow: visible !important;
        }
        
        .tabulator-col {
            overflow: visible !important;
        }
        
        /* FROZEN COLUMN STYLES */
        .tabulator-frozen {
            position: sticky !important;
            left: 0 !important;
            z-index: 10 !important;
            background: white !important;
        }
        
        .tabulator-frozen.tabulator-frozen-left {
            border-right: 2px solid #f97316 !important;
        }
        
        .tabulator-row .tabulator-frozen {
            background: inherit !important;
        }
        
        .tabulator-row:nth-child(even) .tabulator-frozen {
            background: #fafafa !important;
        }
        
        .tabulator-row:hover .tabulator-frozen {
            background: #fff7ed !important;
        }
        
        /* Min/Max Filter Styles - no arrows */
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
            -moz-appearance: textfield !important;
        }
        
        /* Hide number input arrows */
        .min-max-input::-webkit-outer-spin-button,
        .min-max-input::-webkit-inner-spin-button {
            -webkit-appearance: none !important;
            margin: 0 !important;
        }
        
        .min-max-input:focus {
            outline: none !important;
            border-color: #f97316 !important;
            box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2) !important;
        }
        
        /* Expandable row basketball theme */
        .subrow-container {
            background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%) !important;
            border-top: 2px solid #f97316 !important;
        }
    `;
    document.head.appendChild(style);
    console.log('Basketball minimal styles injected');
}

function injectFullStyles() {
    const mobile = isMobile();
    const tablet = isTablet();
    const isSmallScreen = mobile || tablet;
    
    // Calculate appropriate font size based on screen
    const baseFontSize = isSmallScreen ? 11 : 12;
    
    const style = document.createElement('style');
    style.setAttribute('data-source', 'github-basketball-full');
    style.setAttribute('data-table-styles', 'github');
    style.textContent = `
        /* ===================================
           BASKETBALL TABLE STYLES - UPDATED
           Center-justified headers, auto-fit columns,
           frozen Name column, dropdowns above table
           =================================== */
        
        /* GLOBAL FONT SIZE - Responsive */
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
            font-size: ${baseFontSize}px !important;
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
            overflow: visible;
        }
        
        /* Tabulator base styles */
        .tabulator {
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            font-size: ${baseFontSize}px !important;
            line-height: 1.4 !important;
            background-color: white;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            overflow: visible !important;
        }
        
        /* CRITICAL: Allow overflow for dropdowns */
        .tabulator-tableholder {
            overflow: visible !important;
        }
        
        /* Header styling - Basketball Orange/Blue theme */
        .tabulator-header {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            color: white;
            font-weight: bold;
            border-bottom: 2px solid #c2410c;
            font-size: ${baseFontSize}px !important;
            overflow: visible !important;
        }
        
        .tabulator-col {
            background: transparent;
            border-right: 1px solid rgba(255, 255, 255, 0.2);
            padding: 8px 4px;
            font-size: ${baseFontSize}px !important;
            overflow: visible !important;
        }
        
        .tabulator-col:last-child {
            border-right: none;
        }
        
        /* CENTER JUSTIFY ALL HEADERS - PRIMARY AND SECONDARY */
        .tabulator-col-title {
            color: white;
            font-weight: 600;
            font-size: ${baseFontSize}px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            text-align: center !important;
            justify-content: center !important;
            display: flex !important;
            align-items: center !important;
        }
        
        /* Column group headers (secondary headers) - also centered */
        .tabulator-col-group .tabulator-col-title {
            text-align: center !important;
            justify-content: center !important;
        }
        
        .tabulator-col-group-cols {
            border-top: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .tabulator-col-group .tabulator-col-group-cols .tabulator-col {
            padding: 6px 4px;
        }
        
        /* Header filter containers must allow dropdowns to overflow */
        .tabulator-header-filter {
            overflow: visible !important;
            margin-top: 4px;
        }
        
        /* DROPDOWN FILTER STYLES - POSITIONED ABOVE TABLE */
        .custom-multiselect-dropdown,
        [id^="dropdown_"] {
            z-index: 2147483647 !important;
            position: fixed !important;
            background: white !important;
            border: 1px solid #333 !important;
            border-radius: 4px !important;
            box-shadow: 0 -4px 12px rgba(0,0,0,0.3) !important;
        }
        
        .custom-multiselect-button {
            width: 100%;
            padding: 4px 8px;
            border: 1px solid #ccc;
            background: white;
            cursor: pointer;
            font-size: 11px !important;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            border-radius: 3px;
            transition: border-color 0.2s ease;
        }
        
        .custom-multiselect-button:hover {
            border-color: #f97316;
        }
        
        .custom-multiselect-button:focus {
            outline: none;
            border-color: #f97316;
            box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2);
        }
        
        /* FROZEN COLUMN STYLES - For Name column on mobile/tablet */
        .tabulator-frozen {
            position: sticky !important;
            left: 0 !important;
            z-index: 10 !important;
            background: white !important;
        }
        
        .tabulator-frozen.tabulator-frozen-left {
            border-right: 2px solid #f97316 !important;
            box-shadow: 2px 0 4px rgba(0,0,0,0.1) !important;
        }
        
        /* Frozen column in header */
        .tabulator-header .tabulator-frozen {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important;
        }
        
        /* Frozen column in rows - maintain alternating colors */
        .tabulator-row .tabulator-frozen {
            background: inherit !important;
        }
        
        .tabulator-row:nth-child(even) .tabulator-frozen {
            background: #fafafa !important;
        }
        
        .tabulator-row:nth-child(odd) .tabulator-frozen {
            background: white !important;
        }
        
        .tabulator-row:hover .tabulator-frozen {
            background: #fff7ed !important;
        }
        
        /* Row styling with alternating colors */
        .tabulator-row {
            border-bottom: 1px solid #f0f0f0;
            transition: all 0.2s ease;
            font-size: ${baseFontSize}px !important;
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
        
        /* Cell styling - NO WRAP for single row content */
        .tabulator-cell {
            padding: 6px 4px;
            border-right: 1px solid #f0f0f0;
            font-size: ${baseFontSize}px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
        }
        
        .tabulator-cell:last-child {
            border-right: none;
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
            -moz-appearance: textfield !important;
        }
        
        /* Hide number input arrows */
        .min-max-input::-webkit-outer-spin-button,
        .min-max-input::-webkit-inner-spin-button {
            -webkit-appearance: none !important;
            margin: 0 !important;
        }
        
        .min-max-input:focus {
            outline: none !important;
            border-color: #f97316 !important;
            box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2) !important;
        }
        
        /* Expandable row basketball theme */
        .subrow-container {
            padding: 15px 20px !important;
            background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%) !important;
            border-top: 2px solid #f97316 !important;
            margin: 0 !important;
            display: block !important;
            width: 100% !important;
        }
        
        /* Expand icon styling */
        .expand-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 16px;
            height: 16px;
            margin-right: 6px;
            font-size: 10px;
            color: #f97316;
            transition: transform 0.2s ease;
        }
        
        /* RESPONSIVE ADJUSTMENTS */
        @media screen and (max-width: 768px) {
            .tabulator,
            .tabulator *,
            .tabulator-header *,
            .tabulator-row *,
            .tabulator-cell * {
                font-size: 10px !important;
            }
            
            .tabulator-col {
                padding: 6px 2px !important;
            }
            
            .tabulator-cell {
                padding: 4px 2px !important;
            }
            
            .custom-multiselect-button {
                font-size: 9px !important;
                padding: 3px 4px !important;
            }
            
            .min-max-input {
                font-size: 9px !important;
                padding: 2px 3px !important;
            }
        }
        
        @media screen and (max-width: 480px) {
            .tabulator,
            .tabulator *,
            .tabulator-header *,
            .tabulator-row *,
            .tabulator-cell * {
                font-size: 9px !important;
            }
            
            .tabulator-col {
                padding: 4px 1px !important;
            }
            
            .tabulator-cell {
                padding: 3px 1px !important;
            }
        }
        
        /* DESKTOP: Ensure table fits in browser width */
        @media screen and (min-width: 1025px) {
            .tabulator {
                width: 100% !important;
                max-width: 100% !important;
            }
            
            .table-container {
                overflow-x: auto !important;
            }
        }
        
        /* Header text filter input styling */
        .tabulator-header-filter input[type="search"],
        .tabulator-header-filter input[type="text"] {
            width: 100% !important;
            padding: 4px 6px !important;
            font-size: 11px !important;
            border: 1px solid #ccc !important;
            border-radius: 3px !important;
            box-sizing: border-box !important;
        }
        
        .tabulator-header-filter input[type="search"]:focus,
        .tabulator-header-filter input[type="text"]:focus {
            outline: none !important;
            border-color: #f97316 !important;
            box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2) !important;
        }
        
        /* Loading indicator */
        .loading-indicator {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px;
            color: #666;
            font-size: 14px;
        }
        
        .loading-indicator::before {
            content: '';
            width: 20px;
            height: 20px;
            border: 2px solid #f97316;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-right: 10px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        /* Scrollbar styling */
        .tabulator::-webkit-scrollbar,
        .tabulator-tableholder::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        
        .tabulator::-webkit-scrollbar-track,
        .tabulator-tableholder::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
        }
        
        .tabulator::-webkit-scrollbar-thumb,
        .tabulator-tableholder::-webkit-scrollbar-thumb {
            background: #f97316;
            border-radius: 4px;
        }
        
        .tabulator::-webkit-scrollbar-thumb:hover,
        .tabulator-tableholder::-webkit-scrollbar-thumb:hover {
            background: #ea580c;
        }
    `;
    document.head.appendChild(style);
    console.log('Basketball full styles injected');
}
