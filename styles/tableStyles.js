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
// - FIXED: Desktop scrollbar - counters Webflow's aggressive *::-webkit-scrollbar { display: none }
// - FIXED: Mobile subtable layout - reduced gap/padding for single-line display
// - FIXED: Mobile frozen columns - constrain tabulator width so scroll happens at tableholder level
// - FIXED: Matchups table scrollbar - always reserve space for vertical scrollbar on desktop

import { isMobile, isTablet, getDeviceScale } from '../shared/config.js';

export function injectStyles() {
    // Check if Webflow custom styles are already applied
    if (document.querySelector('style[data-table-styles="webflow"]')) {
        console.log('Using Webflow custom styles, applying minimal overrides only');
        injectMinimalStyles();
        // CRITICAL: Inject scrollbar fix AFTER minimal styles to counter Webflow's aggressive hiding
        injectScrollbarFix();
        return;
    }

    // Full style injection for non-Webflow environments
    injectFullStyles();
}

/**
 * CRITICAL FIX: Webflow has a global rule that hides ALL scrollbars:
 *   *::-webkit-scrollbar { display: none !important; width: 0 !important; }
 * 
 * This function injects a high-specificity counter-rule that:
 * 1. Is inserted AFTER the Webflow style element
 * 2. Uses ID + class selectors for maximum specificity
 * 3. Explicitly sets display: block to counter display: none
 */
function injectScrollbarFix() {
    // Check if fix already exists
    if (document.querySelector('style[data-source="scrollbar-fix"]')) {
        return;
    }
    
    const style = document.createElement('style');
    style.setAttribute('data-source', 'scrollbar-fix');
    
    // Use extremely high specificity selectors and counter the display:none
    style.textContent = `
        /* =====================================================
           SCROLLBAR FIX - Counters Webflow's aggressive hiding
           Webflow uses: *::-webkit-scrollbar { display: none !important }
           We counter with higher specificity + display: block
           ===================================================== */
        
        /* Desktop only - show scrollbar */
        @media screen and (min-width: 1025px) {
            /* High specificity selector chain */
            html body .tabulator .tabulator-tableholder::-webkit-scrollbar,
            html body div.tabulator div.tabulator-tableholder::-webkit-scrollbar {
                display: block !important;
                width: 16px !important;
                height: 16px !important;
                visibility: visible !important;
                -webkit-appearance: scrollbar !important;
            }
            
            html body .tabulator .tabulator-tableholder::-webkit-scrollbar-track,
            html body div.tabulator div.tabulator-tableholder::-webkit-scrollbar-track {
                display: block !important;
                background: #f1f1f1 !important;
                border-radius: 8px !important;
                visibility: visible !important;
            }
            
            html body .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb,
            html body div.tabulator div.tabulator-tableholder::-webkit-scrollbar-thumb {
                display: block !important;
                background: #f97316 !important;
                border-radius: 8px !important;
                visibility: visible !important;
                min-height: 50px !important;
            }
            
            html body .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb:hover,
            html body div.tabulator div.tabulator-tableholder::-webkit-scrollbar-thumb:hover {
                background: #ea580c !important;
            }
            
            /* Also set Firefox scrollbar */
            html body .tabulator .tabulator-tableholder,
            html body div.tabulator div.tabulator-tableholder {
                scrollbar-width: thin !important;
                scrollbar-color: #f97316 #f1f1f1 !important;
            }
            
            /* =====================================================
               MATCHUPS TABLE FIX - Always reserve space for vertical scrollbar
               This prevents horizontal scrollbar from appearing when subtables
               expand and cause the vertical scrollbar to appear
               ===================================================== */
            #matchups-table .tabulator-tableholder {
                overflow-y: scroll !important;
            }
        }
        
        /* Mobile/tablet - keep thin scrollbar */
        @media screen and (max-width: 1024px) {
            html body .tabulator .tabulator-tableholder::-webkit-scrollbar,
            html body div.tabulator div.tabulator-tableholder::-webkit-scrollbar {
                display: block !important;
                width: 4px !important;
                height: 4px !important;
                visibility: visible !important;
            }
            
            html body .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb,
            html body div.tabulator div.tabulator-tableholder::-webkit-scrollbar-thumb {
                display: block !important;
                background: #ccc !important;
                border-radius: 2px !important;
                visibility: visible !important;
            }
        }
    `;
    
    // Insert AFTER the Webflow style element for proper cascade order
    const webflowStyle = document.querySelector('style[data-table-styles="webflow"]');
    if (webflowStyle && webflowStyle.parentNode) {
        webflowStyle.parentNode.insertBefore(style, webflowStyle.nextSibling);
        console.log('Scrollbar fix injected immediately after Webflow styles');
    } else {
        // Fallback: append to head
        document.head.appendChild(style);
        console.log('Scrollbar fix injected at end of head');
    }
}

function injectMinimalStyles() {
    const style = document.createElement('style');
    style.setAttribute('data-source', 'github-basketball-minimal');
    style.textContent = `
        /* Minimal styles for Webflow environment */
        /* These supplement rather than override Webflow styles */
        
        /* =====================================================
           STANDALONE HEADER FIX for mobile/tablet
           When Name/Team columns are frozen, their headers need
           to be top-aligned so other headers don't show above them
           when horizontally scrolling.
           ===================================================== */
        @media screen and (max-width: 1024px) {
            /* All header cells should be top-aligned by default */
            .tabulator-header .tabulator-col {
                vertical-align: top !important;
            }
            
            /* Specifically target frozen header columns */
            .tabulator-header .tabulator-col.tabulator-frozen {
                vertical-align: top !important;
            }
            
            /* Ensure the column content wrapper is also top-aligned */
            .tabulator-col-content {
                vertical-align: top !important;
            }
        }
        
        /* =====================================================
           MOBILE SUBTABLE FIXES
           Reduces gap and padding on mobile/tablet for single-line layout
           ===================================================== */
        
        /* Mobile: Compact subtable layout */
        @media screen and (max-width: 768px) {
            /* Reduce container padding */
            .subrow-container {
                padding: 8px 10px !important;
            }
            
            /* Target the flex container inside subtables - reduce gap */
            .subrow-container > div {
                gap: 4px !important;
            }
            
            /* Reduce gap in subtable cells */
            .subrow-container .subtable-cell,
            .subrow-container [class*="subtable"] {
                padding: 2px 4px !important;
                gap: 2px !important;
            }
        }
        
        /* Tablet: Slightly less compact */
        @media screen and (min-width: 769px) and (max-width: 1024px) {
            .subrow-container {
                padding: 10px 15px !important;
            }
            
            .subrow-container > div {
                gap: 6px !important;
            }
        }
        
        /* =====================================================
           MOBILE FROZEN COLUMN FIX
           On mobile, we constrain BOTH container AND tabulator width so 
           tableholder becomes the scroll container.
           
           KEY INSIGHT: The tabulator element was expanding to fit content,
           which meant tableholder also expanded and had nothing to scroll.
           By setting min-width:0 and max-width:100% on tabulator, we force
           it to stay within container bounds.
           ===================================================== */
        
        @media screen and (max-width: 1024px) {
            /* Constrain container to viewport width on mobile/tablet */
            .table-container {
                width: 100% !important;
                max-width: 100vw !important;
                overflow-x: hidden !important;
            }
            
            /* CRITICAL: Constrain tabulator to container width */
            /* min-width:0 prevents flexbox from expanding it */
            /* max-width:100% keeps it within container bounds */
            .table-container .tabulator {
                width: 100% !important;
                min-width: 0 !important;
                max-width: 100% !important;
            }
            
            /* Ensure tableholder is the scroll container */
            .table-container .tabulator .tabulator-tableholder {
                overflow-x: auto !important;
                -webkit-overflow-scrolling: touch !important;
            }
            
            /* Frozen cells in data rows need proper background */
            .tabulator-row .tabulator-cell.tabulator-frozen {
                background: inherit !important;
                position: sticky !important;
                left: 0 !important;
                z-index: 10 !important;
            }
            
            /* Ensure frozen cells on even rows have correct background */
            .tabulator-row.tabulator-row-even .tabulator-cell.tabulator-frozen {
                background: #fafafa !important;
            }
            
            /* Ensure frozen cells on odd rows have correct background */
            .tabulator-row.tabulator-row-odd .tabulator-cell.tabulator-frozen {
                background: #ffffff !important;
            }
            
            /* Ensure frozen cells on hover have correct background */
            .tabulator-row:hover .tabulator-cell.tabulator-frozen {
                background: #fff7ed !important;
            }
            
            /* Frozen header needs highest z-index */
            .tabulator-header .tabulator-col.tabulator-frozen {
                position: sticky !important;
                left: 0 !important;
                z-index: 101 !important;
            }
        }
    `;
    document.head.appendChild(style);
    console.log('Basketball minimal styles injected with standalone header fix, scrollbar, mobile subtable fixes, and frozen column fix');
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
           Mobile subtable compact layout
           Mobile frozen column support
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
        
        /* Header styles - center-justified, wrapping text */
        .tabulator-header {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important;
            border-bottom: 2px solid #c2410c;
            font-weight: 600;
        }
        
        .tabulator-col {
            background: transparent !important;
            border-right: 1px solid rgba(255,255,255,0.3);
            padding: 4px 4px;
        }
        
        .tabulator-col-title {
            color: white !important;
            font-weight: 600 !important;
            text-align: center !important;
            white-space: normal !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            hyphens: none !important;
            line-height: 1.2 !important;
            padding: 2px 2px !important;
        }
        
        /* Column group header styling */
        .tabulator-col-group-cols {
            border-top: 1px solid rgba(255,255,255,0.3);
        }
        
        /* Row styles */
        .tabulator-row {
            border-bottom: 1px solid #e8e8e8;
            min-height: 32px;
        }
        
        .tabulator-row:nth-child(even) {
            background-color: #fafafa;
        }
        
        .tabulator-row:hover {
            background-color: #fff7ed;
        }
        
        .tabulator-row.row-expanded {
            background-color: #fff7ed !important;
        }
        
        /* Cell styles - SINGLE LINE with ellipsis */
        .tabulator-cell {
            padding: 6px 4px;
            border-right: 1px solid #f0f0f0;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
        }
        
        /* Scrollbar styles - Desktop only */
        @media screen and (min-width: 1025px) {
            .tabulator .tabulator-tableholder::-webkit-scrollbar {
                width: 16px !important;
                height: 16px !important;
            }
            
            .tabulator .tabulator-tableholder::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 8px;
            }
            
            .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb {
                background: #f97316;
                border-radius: 8px;
                min-height: 50px;
            }
            
            .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb:hover {
                background: #ea580c;
            }
            
            /* Firefox */
            .tabulator .tabulator-tableholder {
                scrollbar-width: auto;
                scrollbar-color: #f97316 #f1f1f1;
            }
            
            /* MATCHUPS TABLE FIX - Always reserve space for vertical scrollbar */
            #matchups-table .tabulator-tableholder {
                overflow-y: scroll !important;
            }
        }
        
        /* Dropdown filter styles - ABOVE the table */
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
        .tabulator-header-filter .min-max-filter-container {
            display: flex !important;
            flex-direction: column !important;
            flex-wrap: nowrap !important;
            gap: 2px !important;
            width: 100% !important;
            max-width: 45px !important;
            margin: 0 auto !important;
        }
        
        .min-max-input,
        .tabulator .min-max-input,
        .min-max-filter-container input,
        .min-max-filter-container > input {
            width: 100% !important;
            flex: 0 0 auto !important;
            flex-shrink: 0 !important;
            font-size: 9px !important;
            padding: 2px 3px !important;
            border: 1px solid #ccc !important;
            border-radius: 2px !important;
            text-align: center !important;
            box-sizing: border-box !important;
        }
        
        /* =====================================================
           STANDALONE HEADER FIX for mobile/tablet
           When Name/Team columns are frozen, their headers need
           to be top-aligned so other headers don't show above them
           when horizontally scrolling.
           ===================================================== */
        @media screen and (max-width: 1024px) {
            /* All header cells should be top-aligned by default */
            .tabulator-header .tabulator-col {
                vertical-align: top !important;
            }
            
            /* Specifically target frozen header columns */
            .tabulator-header .tabulator-col.tabulator-frozen {
                vertical-align: top !important;
            }
            
            /* Ensure the column content wrapper is also top-aligned */
            .tabulator-col-content {
                vertical-align: top !important;
            }
            
            /* Ensure frozen header cells have no transparency */
            .tabulator-header .tabulator-col.tabulator-frozen {
                background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important;
            }
            
            /* Frozen cells need pseudo-element for full background coverage */
            .tabulator-header .tabulator-col.tabulator-frozen::before {
                content: '' !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                height: 100% !important;
                background: inherit !important;
                z-index: -1 !important;
            }
            
            /* Mobile/tablet: thin scrollbar */
            .tabulator .tabulator-tableholder::-webkit-scrollbar {
                width: 4px !important;
                height: 4px !important;
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
        
        /* =====================================================
           MOBILE SUBTABLE FIXES
           Reduces gap and padding on mobile/tablet for single-line layout
           ===================================================== */
        
        /* Mobile: Compact subtable layout */
        @media screen and (max-width: 768px) {
            /* Reduce container padding */
            .subrow-container {
                padding: 8px 10px !important;
            }
            
            /* Target the flex container inside subtables - reduce gap */
            .subrow-container > div {
                gap: 4px !important;
            }
            
            /* Reduce gap in subtable cells */
            .subrow-container .subtable-cell,
            .subrow-container [class*="subtable"] {
                padding: 2px 4px !important;
                gap: 2px !important;
            }
        }
        
        /* Tablet: Slightly less compact */
        @media screen and (min-width: 769px) and (max-width: 1024px) {
            .subrow-container {
                padding: 10px 15px !important;
            }
            
            .subrow-container > div {
                gap: 6px !important;
            }
        }
        
        /* =====================================================
           MOBILE FROZEN COLUMN FIX
           On mobile, we constrain BOTH container AND tabulator width so 
           tableholder becomes the scroll container.
           
           KEY INSIGHT: The tabulator element was expanding to fit content,
           which meant tableholder also expanded and had nothing to scroll.
           By setting min-width:0 and max-width:100% on tabulator, we force
           it to stay within container bounds.
           ===================================================== */
        
        @media screen and (max-width: 1024px) {
            /* Constrain container to viewport width on mobile/tablet */
            .table-container {
                width: 100% !important;
                max-width: 100vw !important;
                overflow-x: hidden !important;
            }
            
            /* CRITICAL: Constrain tabulator to container width */
            /* min-width:0 prevents flexbox from expanding it */
            /* max-width:100% keeps it within container bounds */
            .table-container .tabulator {
                width: 100% !important;
                min-width: 0 !important;
                max-width: 100% !important;
            }
            
            /* Ensure tableholder is the scroll container */
            .table-container .tabulator .tabulator-tableholder {
                overflow-x: auto !important;
                -webkit-overflow-scrolling: touch !important;
            }
            
            /* Frozen cells in data rows need proper background */
            .tabulator-row .tabulator-cell.tabulator-frozen {
                background: inherit !important;
                position: sticky !important;
                left: 0 !important;
                z-index: 10 !important;
            }
            
            /* Ensure frozen cells on even rows have correct background */
            .tabulator-row.tabulator-row-even .tabulator-cell.tabulator-frozen {
                background: #fafafa !important;
            }
            
            /* Ensure frozen cells on odd rows have correct background */
            .tabulator-row.tabulator-row-odd .tabulator-cell.tabulator-frozen {
                background: #ffffff !important;
            }
            
            /* Ensure frozen cells on hover have correct background */
            .tabulator-row:hover .tabulator-cell.tabulator-frozen {
                background: #fff7ed !important;
            }
            
            /* Frozen header needs highest z-index */
            .tabulator-header .tabulator-col.tabulator-frozen {
                position: sticky !important;
                left: 0 !important;
                z-index: 101 !important;
            }
        }
        
        /* Expandable row styling */
        .subrow-container {
            background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%) !important;
            border-top: 2px solid #f97316 !important;
        }
    `;
    document.head.appendChild(style);
    console.log('Basketball full styles injected with matchups scrollbar fix');
}
