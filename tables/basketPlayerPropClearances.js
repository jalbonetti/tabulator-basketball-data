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
        
        /* Base overflow for tableholder */
        .tabulator .tabulator-tableholder {
            overflow-y: auto !important;
            overflow-x: auto !important;
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
                gap: 6px !important;
            }
            
            /* Target individual info boxes - reduce padding */
            .subrow-container > div > div {
                padding: 8px !important;
                min-width: unset !important;
            }
            
            /* Smaller headers in subtables */
            .subrow-container h4 {
                font-size: 11px !important;
                margin: 0 0 4px 0 !important;
            }
            
            /* Smaller content text in subtables */
            .subrow-container div > div > div {
                font-size: 10px !important;
                margin-bottom: 2px !important;
            }
            
            /* Scrollable wrapper adjustments */
            .subtable-scroll-wrapper {
                gap: 8px !important;
                max-height: 350px !important;
            }
        }
        
        /* Tablet: Moderately reduced spacing */
        @media screen and (min-width: 769px) and (max-width: 1024px) {
            .subrow-container {
                padding: 10px 15px !important;
            }
            
            .subrow-container > div {
                gap: 10px !important;
            }
            
            .subrow-container > div > div {
                padding: 10px !important;
            }
            
            .subrow-container h4 {
                font-size: 12px !important;
            }
            
            .subrow-container div > div > div {
                font-size: 11px !important;
            }
            
            .subtable-scroll-wrapper {
                gap: 10px !important;
            }
        }
        
        /* Ensure flex-nowrap is always respected */
        .subrow-container > div[style*="flex"] {
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
        }
        
        /* =====================================================
           MOBILE FROZEN COLUMN FIX
           The scroll must happen at tableholder level for position:sticky to work.
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
        
        /* Header styles */
        .tabulator-header {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            color: white;
            font-weight: 600;
        }
        
        .tabulator-col {
            background: transparent;
            border-right: 1px solid rgba(255,255,255,0.2);
        }
        
        /* Header title - wrap at word boundaries, CENTER-JUSTIFIED */
        .tabulator-col-title {
            white-space: normal !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
            text-align: center !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 4px 2px !important;
        }
        
        /* Column group headers (parent headers like "Prop Info", "Clearance", etc.) */
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
                gap: 6px !important;
            }
            
            /* Target individual info boxes - reduce padding */
            .subrow-container > div > div {
                padding: 8px !important;
                min-width: unset !important;
            }
            
            /* Smaller headers in subtables */
            .subrow-container h4 {
                font-size: 11px !important;
                margin: 0 0 4px 0 !important;
            }
            
            /* Smaller content text in subtables */
            .subrow-container div > div > div {
                font-size: 10px !important;
                margin-bottom: 2px !important;
            }
            
            /* Scrollable wrapper adjustments */
            .subtable-scroll-wrapper {
                gap: 8px !important;
                max-height: 350px !important;
            }
        }
        
        /* Tablet: Moderately reduced spacing */
        @media screen and (min-width: 769px) and (max-width: 1024px) {
            .subrow-container {
                padding: 10px 15px !important;
            }
            
            .subrow-container > div {
                gap: 10px !important;
            }
            
            .subrow-container > div > div {
                padding: 10px !important;
            }
            
            .subrow-container h4 {
                font-size: 12px !important;
            }
            
            .subrow-container div > div > div {
                font-size: 11px !important;
            }
            
            .subtable-scroll-wrapper {
                gap: 10px !important;
            }
        }
        
        /* Ensure flex-nowrap is always respected */
        .subrow-container > div[style*="flex"] {
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
        }
        
        /* =====================================================
           MOBILE FROZEN COLUMN FIX
           The scroll must happen at tableholder level for position:sticky to work.
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
            
            /* Frozen cells in data rows need proper background and positioning */
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
    console.log('Basketball full styles injected with mobile frozen column fix');
}
