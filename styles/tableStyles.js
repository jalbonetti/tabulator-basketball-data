// styles/tableStyles.js - Basketball Table Styles
// FIXED: 
// - Headers wrap at word boundaries (one word per line allowed)
// - Center-justified headers via CSS (not titleHozAlign option)
// - Data cells remain single-line with ellipsis
// - Dropdown filters positioned above table
// - Vertical scrollbar visible on desktop only
// - Subtle frozen column styling for mobile/tablet
// - More compact min/max filter inputs
// - FIXED: Standalone headers (Name, Team, Lineup) now top-aligned on mobile/tablet
//   to prevent other headers from showing above frozen columns when scrolling

import { isMobile, isTablet, getDeviceScale } from '../shared/config.js';

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
        
        /* HEADERS: Allow word wrapping at word boundaries, center-justified */
        .tabulator-col-title {
            white-space: normal !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
            text-align: center !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }
        
        /* DATA CELLS: Single-line with ellipsis */
        .tabulator-cell {
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
        }
        
        /* DROPDOWNS: Position ABOVE the table */
        .custom-multiselect-dropdown,
        [id^="dropdown_"] {
            z-index: 2147483647 !important;
            position: fixed !important;
            background: white !important;
            border: 1px solid #333 !important;
            border-radius: 4px !important;
            box-shadow: 0 -4px 12px rgba(0,0,0,0.3) !important;
        }
        
        /* =====================================================
           CRITICAL FIX: Standalone header vertical alignment
           On mobile/tablet, columns without parent groups (Name, Team, Lineup)
           need to be top-aligned and fill full header height
           ===================================================== */
        
        /* Mobile and Tablet: Fix standalone header alignment */
        @media screen and (max-width: 1024px) {
            /* Ensure header uses flexbox for proper alignment */
            .tabulator-header {
                display: flex !important;
                align-items: stretch !important;
            }
            
            /* All top-level columns should stretch to fill header height */
            .tabulator-header > .tabulator-headers > .tabulator-col {
                display: flex !important;
                flex-direction: column !important;
                align-items: stretch !important;
            }
            
            /* Standalone columns (not column groups) - align content to TOP */
            .tabulator-col.standalone-header,
            .tabulator-col:not(.tabulator-col-group) {
                justify-content: flex-start !important;
                align-items: stretch !important;
            }
            
            /* The col-content inside standalone headers should be at top */
            .tabulator-col.standalone-header > .tabulator-col-content,
            .tabulator-col:not(.tabulator-col-group) > .tabulator-col-content {
                display: flex !important;
                flex-direction: column !important;
                justify-content: flex-start !important;
                align-items: center !important;
                height: 100% !important;
                padding-top: 8px !important;
            }
            
            /* Ensure the title wrapper fills available space */
            .tabulator-col.standalone-header .tabulator-col-title-holder,
            .tabulator-col:not(.tabulator-col-group) .tabulator-col-title-holder {
                display: flex !important;
                flex-direction: column !important;
                justify-content: flex-start !important;
                height: auto !important;
            }
            
            /* Title text alignment */
            .tabulator-col.standalone-header .tabulator-col-title,
            .tabulator-col:not(.tabulator-col-group) .tabulator-col-title {
                text-align: center !important;
                padding-top: 4px !important;
            }
            
            /* Frozen columns should have solid background to hide content scrolling behind */
            .tabulator-header .tabulator-frozen {
                background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important;
                z-index: 100 !important;
            }
            
            /* Ensure frozen header cells have no transparency */
            .tabulator-header .tabulator-col.tabulator-frozen {
                background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important;
            }
        }
        
        /* Expandable row styling */
        .subrow-container {
            background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%) !important;
            border-top: 2px solid #f97316 !important;
        }
        
        /* Min/Max filter - MUST stack vertically */
        .min-max-filter-container,
        .tabulator .min-max-filter-container,
        .tabulator-header-filter .min-max-filter-container {
            display: flex !important;
            flex-direction: column !important;
            flex-wrap: nowrap !important;
            gap: 2px !important;
            max-width: 45px !important;
            margin: 0 auto !important;
        }
        
        .min-max-input,
        .min-max-filter-container > input {
            width: 100% !important;
            flex-shrink: 0 !important;
            font-size: 9px !important;
            padding: 2px 3px !important;
        }
    `;
    document.head.appendChild(style);
    console.log('Basketball minimal styles injected with standalone header fix');
}

function injectFullStyles() {
    const mobile = isMobile();
    const tablet = isTablet();
    const scale = getDeviceScale();
    
    // Base font size adjusted for device
    const baseFontSize = mobile ? 10 : tablet ? 11 : 12;
    
    const style = document.createElement('style');
    style.setAttribute('data-source', 'github-basketball-full');
    style.setAttribute('data-table-styles', 'github');
    style.textContent = `
        /* ===================================
           BASKETBALL TABLE STYLES - FIXED
           Headers wrap at word boundaries
           Center-justified via CSS
           Data cells single-line
           Desktop-only vertical scrollbar
           Subtle frozen columns
           Compact min/max filters
           Standalone headers top-aligned on mobile
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
            line-height: 1.3 !important;
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
            line-height: 1.3 !important;
            background-color: white;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            overflow: visible !important;
        }
        
        /* Note: Dropdowns use position:fixed, so they don't need overflow:visible here.
           The scrollbar rules below will handle the tableholder overflow. */
        
        /* Header styling - Basketball Orange/Blue theme */
        .tabulator-header {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            color: white;
            font-weight: bold;
            border-bottom: 2px solid #c2410c;
        }
        
        .tabulator-col {
            background: transparent !important;
            border-right: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .tabulator-col:last-child {
            border-right: none;
        }
        
        /* HEADERS: Allow word wrapping, center-justified */
        .tabulator-col-title {
            white-space: normal !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
            text-align: center !important;
            color: white !important;
            font-weight: 600 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }
        
        /* Column group headers */
        .tabulator-col-group-cols {
            border-top: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        /* DATA CELLS: Single-line with ellipsis */
        .tabulator-cell {
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            padding: 8px 6px !important;
            border-right: 1px solid #f0f0f0;
        }
        
        .tabulator-cell:last-child {
            border-right: none;
        }
        
        /* Row styling with alternating colors */
        .tabulator-row {
            border-bottom: 1px solid #f0f0f0;
            transition: background-color 0.15s ease;
        }
        
        .tabulator-row:nth-child(even) {
            background-color: #fafafa;
        }
        
        .tabulator-row:hover {
            background-color: #fff7ed !important;
        }
        
        /* Expanded row styling */
        .tabulator-row.row-expanded {
            background-color: #fff7ed !important;
        }
        
        /* =====================================================
           DROPDOWN FILTERS - Position ABOVE table
           ===================================================== */
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
        
        /* =====================================================
           FROZEN COLUMN STYLES - For Name column on mobile/tablet
           ===================================================== */
        .tabulator-frozen {
            position: sticky !important;
            left: 0 !important;
            z-index: 10 !important;
            background: white !important;
        }
        
        .tabulator-frozen.tabulator-frozen-left {
            border-right: 1px solid rgba(249, 115, 22, 0.4) !important;
            box-shadow: 1px 0 3px rgba(0,0,0,0.05) !important;
        }
        
        /* Frozen column in header - SOLID background to hide scrolling content */
        .tabulator-header .tabulator-frozen {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important;
            z-index: 100 !important;
        }
        
        /* Frozen column in rows - maintain alternating colors */
        .tabulator-row .tabulator-frozen {
            background: inherit !important;
        }
        
        .tabulator-row:nth-child(even) .tabulator-frozen {
            background: #fafafa !important;
        }
        
        .tabulator-row:hover .tabulator-frozen {
            background: #fff7ed !important;
        }
        
        /* =====================================================
           COMPACT Min/Max Filter Styles - MUST stack vertically
           High specificity to prevent override by flexbox rules
           ===================================================== */
        .min-max-filter-container,
        .tabulator .min-max-filter-container,
        .tabulator-header .min-max-filter-container,
        .tabulator-header-filter .min-max-filter-container {
            display: flex !important;
            flex-direction: column !important;
            flex-wrap: nowrap !important;
            gap: 2px !important;
            max-width: 45px !important;
            margin: 0 auto !important;
        }
        
        .min-max-input,
        .min-max-filter-container > input {
            width: 100% !important;
            flex-shrink: 0 !important;
            padding: 2px 3px !important;
            font-size: 9px !important;
            border: 1px solid #ccc !important;
            border-radius: 2px !important;
            text-align: center !important;
            box-sizing: border-box !important;
            -moz-appearance: textfield !important;
            -webkit-appearance: none !important;
            appearance: none !important;
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
            box-shadow: 0 0 0 1px rgba(249, 115, 22, 0.2) !important;
        }
        
        /* =====================================================
           EXPANDABLE ROW / SUBTABLE Styles
           ===================================================== */
        .subrow-container {
            background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%) !important;
            border-top: 2px solid #f97316 !important;
        }
        
        .expand-icon {
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        
        /* =====================================================
           SCROLLBAR - Visible on desktop, hidden on mobile/tablet
           ===================================================== */
        .tabulator-tableholder {
            overflow-y: auto !important;
            overflow-x: auto !important;
        }
        
        /* Desktop scrollbar styling */
        @media screen and (min-width: 1025px) {
            .tabulator-tableholder::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }
            
            .tabulator-tableholder::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 4px;
            }
            
            .tabulator-tableholder::-webkit-scrollbar-thumb {
                background: #f97316;
                border-radius: 4px;
            }
            
            .tabulator-tableholder::-webkit-scrollbar-thumb:hover {
                background: #ea580c;
            }
        }
        
        /* Mobile/tablet: thin scrollbar */
        @media screen and (max-width: 1024px) {
            .tabulator-tableholder::-webkit-scrollbar {
                width: 4px;
                height: 4px;
            }
        }
        
        /* =====================================================
           CRITICAL FIX: Standalone header vertical alignment
           On mobile/tablet, columns without parent groups (Name, Team, Lineup)
           need to be top-aligned and fill full header height to prevent
           other headers from showing above frozen columns when scrolling
           ===================================================== */
        
        @media screen and (max-width: 1024px) {
            /* Ensure header container uses flexbox */
            .tabulator-header {
                display: flex !important;
                align-items: stretch !important;
            }
            
            .tabulator-headers {
                display: flex !important;
                align-items: stretch !important;
            }
            
            /* All top-level columns should stretch to fill header height */
            .tabulator-headers > .tabulator-col {
                display: flex !important;
                flex-direction: column !important;
            }
            
            /* Standalone columns (marked with cssClass or not a column group) */
            .tabulator-col.standalone-header {
                justify-content: flex-start !important;
            }
            
            /* The content inside standalone headers should start at top */
            .tabulator-col.standalone-header > .tabulator-col-content {
                display: flex !important;
                flex-direction: column !important;
                justify-content: flex-start !important;
                align-items: center !important;
                height: 100% !important;
                padding-top: 6px !important;
            }
            
            /* Title holder fills space and aligns to top */
            .tabulator-col.standalone-header .tabulator-col-title-holder {
                display: flex !important;
                flex-direction: column !important;
                justify-content: flex-start !important;
                flex-grow: 0 !important;
            }
            
            /* Header filter container at bottom */
            .tabulator-col.standalone-header .tabulator-header-filter {
                margin-top: auto !important;
            }
            
            /* Ensure frozen header has opaque background */
            .tabulator-header .tabulator-col.tabulator-frozen {
                background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important;
                z-index: 100 !important;
            }
            
            /* Add a pseudo-element to fill any gap above standalone headers */
            .tabulator-col.standalone-header::before {
                content: '' !important;
                display: block !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                height: 100% !important;
                background: inherit !important;
                z-index: -1 !important;
            }
        }
        
        /* =====================================================
           RESPONSIVE BREAKPOINTS
           ===================================================== */
        
        /* Mobile styles */
        @media screen and (max-width: 768px) {
            .tabulator-col,
            .tabulator-cell {
                padding: 2px 1px !important;
            }
            
            .min-max-input {
                font-size: 8px !important;
                padding: 1px 2px !important;
            }
            
            .min-max-filter-container {
                max-width: 35px !important;
            }
        }
        
        /* Desktop: Ensure table fits in browser width */
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
    `;
    document.head.appendChild(style);
    console.log('Basketball full styles injected with standalone header fix');
}
