// styles/tableStyles.js - COMPLETE FIXED VERSION - TEXT SIZE ISSUES RESOLVED
import { CONFIG, isMobile, isTablet, getDeviceScale } from '../shared/config.js';
import { TAB_STYLES } from '../components/tabManager.js';

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
    // Only inject critical table-specific settings for Webflow
    var style = document.createElement('style');
    style.setAttribute('data-source', 'github-tables-minimal');
    style.textContent = `
        /* GitHub table-specific settings only */
        
        ${TAB_STYLES}
        
        /* CRITICAL FIX: Force tab visibility */
        .tabs-container {
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            margin-bottom: 20px !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        .tab-buttons {
            display: flex !important;
            justify-content: center !important;
            flex-wrap: wrap !important;
            gap: 5px !important;
            padding: 10px !important;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            border-radius: 8px !important;
            visibility: visible !important;
        }
        
        .tab-button {
            padding: 8px 12px !important;
            border: none !important;
            border-radius: 4px !important;
            background: rgba(255, 255, 255, 0.2) !important;
            color: white !important;
            cursor: pointer !important;
            font-size: 12px !important;
            font-weight: 500 !important;
            transition: all 0.2s ease !important;
            white-space: nowrap !important;
            display: block !important;
            visibility: visible !important;
        }
        
        .tab-button:hover {
            background: rgba(255, 255, 255, 0.3) !important;
            transform: translateY(-1px) !important;
        }
        
        .tab-button.active {
            background: white !important;
            color: #667eea !important;
            font-weight: bold !important;
        }
        
        /* Ensure table-wrapper is visible */
        .table-wrapper {
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        /* CRITICAL FIX 1: Restore alternating row colors using nth-child */
        .tabulator-row:nth-child(even):not(.tabulator-row-moving):not(.tabulator-group) {
            background-color: #f9f9f9 !important;
        }
        
        .tabulator-row:nth-child(odd):not(.tabulator-row-moving):not(.tabulator-group) {
            background-color: white !important;
        }
        
        /* Keep expanded rows/subtables with transparent background */
        .subrow-container {
            background-color: transparent !important;
            padding: 10px 20px !important;
            margin: 0 !important;
        }
        
        /* CRITICAL FIX 2: Force vertical scrollbar to always be visible */
        .tabulator .tabulator-tableHolder {
            overflow-y: scroll !important;  /* Changed from auto to scroll */
            overflow-x: hidden !important;
            max-width: 100% !important;
            -ms-overflow-style: auto !important;
            scrollbar-width: auto !important;  /* Changed from thin to auto */
        }

        /* Allow subtables to expand naturally without manual scrolling */
        .subrow-container .tabulator .tabulator-tableHolder {
            overflow-y: visible !important;
            max-height: none !important;
            height: auto !important;
        }

        /* Ensure scrollbar is always visible and prominent */
        .tabulator .tabulator-tableHolder::-webkit-scrollbar {
            width: 14px !important;  /* Wider for better visibility */
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        .tabulator .tabulator-tableHolder::-webkit-scrollbar-track {
            background: #f1f1f1 !important;
            border-radius: 6px !important;
        }
        
        .tabulator .tabulator-tableHolder::-webkit-scrollbar-thumb {
            background: #c1c1c1 !important;
            border-radius: 6px !important;
            border: 2px solid #f1f1f1 !important;
        }
        
        .tabulator .tabulator-tableHolder::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8 !important;
        }
        
        /* CRITICAL FIX 6: Prevent text size reduction in subtables - ISSUE #6 FIXED */
        .subrow-container,
        .subrow-container * {
            font-size: inherit !important;
            line-height: inherit !important;
        }
        
        /* Ensure subtables maintain proper text size */
        .subrow-container .tabulator,
        .subrow-container .tabulator *,
        .subrow-container .tabulator-table,
        .subrow-container .tabulator-table *,
        .subrow-container .tabulator-header,
        .subrow-container .tabulator-header *,
        .subrow-container .tabulator-row,
        .subrow-container .tabulator-row *,
        .subrow-container .tabulator-cell,
        .subrow-container .tabulator-cell * {
            font-size: inherit !important;
            line-height: inherit !important;
        }
        
        /* Prevent any CSS from shrinking subtable content */
        .subrow-container .tabulator-tableholder {
            font-size: inherit !important;
        }
        
        /* CRITICAL FIX 5: Consistent scaling for all subtables (matchups specific) */
        #matchups-table .subrow-container {
            max-width: 1120px !important;
            margin: 0 auto !important;
        }
        
        #matchups-table .subrow-container h4 {
            font-size: 14px !important;
            font-weight: bold !important;
            margin: 0 0 10px 0 !important;
            text-align: center !important;
            color: #333 !important;
        }
        
        /* Ensure all matchups subtables have consistent scaling */
        #matchups-table .subrow-container .tabulator {
            font-size: inherit !important;
        }
        
        #matchups-table .subrow-container .tabulator-header {
            font-size: inherit !important;
            font-weight: bold !important;
        }
        
        #matchups-table .subrow-container .tabulator-row {
            font-size: inherit !important;
        }
        
        #matchups-table .subrow-container .tabulator-cell {
            font-size: inherit !important;
            padding: 4px 8px !important;
        }
        
        /* Matchups table specific fixes */
        #matchups-table .tabulator-row {
            max-width: 100% !important;
        }
        
        /* GLOBAL FIX: Ensure NO table anywhere has reduced text size in subtables */
        .tabulator .subrow-container,
        .tabulator .subrow-container *,
        .table-container .subrow-container,
        .table-container .subrow-container * {
            font-size: inherit !important;
            line-height: inherit !important;
        }
        
        /* Custom multiselect dropdown overflow fix */
        .custom-multiselect-dropdown {
            position: fixed !important;
            z-index: 999999 !important;
            max-height: 300px !important;
            overflow-y: auto !important;
        }
        
        /* Best odds column styling for Props tables */
        .best-odds-column {
            background-color: #fff3cd !important;
            font-weight: bold !important;
        }
        
        .tabulator-row:nth-child(even) .best-odds-column {
            background-color: #ffeaa7 !important;
        }
        
        /* State management visual indicators */
        .tabulator-row.row-expanded {
            position: relative;
            z-index: 2;
        }
        
        /* IMPROVED Responsive scaling - INCLUDING SUBTABLES */
        @media screen and (max-width: ${CONFIG.BREAKPOINTS.mobile}px) {
            .table-container,
            .subrow-container {
                transform: scale(${CONFIG.TABLE_DIMENSIONS.mobile.scale});
                transform-origin: top left;
                width: ${CONFIG.TABLE_DIMENSIONS.mobile.containerWidth};
            }
            
            /* Ensure subrow containers scale properly */
            .tabulator-row > .subrow-container {
                transform: scale(1);
                width: 100%;
                margin-left: 0;
                margin-right: 0;
            }
            
            /* Mobile text size fix */
            .subrow-container,
            .subrow-container * {
                font-size: 12px !important;
            }
        }
        
        @media screen and (min-width: ${CONFIG.BREAKPOINTS.mobile + 1}px) and (max-width: ${CONFIG.BREAKPOINTS.tablet}px) {
            .table-container,
            .subrow-container {
                transform: scale(${CONFIG.TABLE_DIMENSIONS.tablet.scale});
                transform-origin: top left;
                width: ${CONFIG.TABLE_DIMENSIONS.tablet.containerWidth};
            }
            
            /* Ensure subrow containers scale properly */
            .tabulator-row > .subrow-container {
                transform: scale(1);
                width: 100%;
                margin-left: 0;
                margin-right: 0;
            }
            
            /* Tablet text size fix */
            .subrow-container,
            .subrow-container * {
                font-size: 13px !important;
            }
        }
        
        @media screen and (min-width: ${CONFIG.BREAKPOINTS.tablet + 1}px) {
            /* Desktop text size - same as main table */
            .subrow-container,
            .subrow-container * {
                font-size: 14px !important;
            }
        }
    `;
    document.head.appendChild(style);
    console.log('Minimal table styles with FIXED TEXT SIZING and all issues resolved');
}

function injectFullStyles() {
    var style = document.createElement('style');
    style.setAttribute('data-source', 'github-tables-full');
    style.setAttribute('data-table-styles', 'github');
    style.textContent = `
        /* ===================================
           COMPLETE RESPONSIVE TABLE STYLES - ALL ISSUES FIXED
           ================================== */
        
        ${TAB_STYLES}
        
        /* CRITICAL GLOBAL FONT SIZE FIX - ISSUE #6 RESOLVED */
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
            font-size: 14px !important;
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
            font-size: 14px !important;
            line-height: 1.4 !important;
            background-color: white;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            overflow: hidden;
        }
        
        /* Header styling */
        .tabulator-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-weight: bold;
            border-bottom: 2px solid #5a67d8;
            font-size: 14px !important;
        }
        
        .tabulator-col {
            background: transparent;
            border-right: 1px solid rgba(255, 255, 255, 0.2);
            padding: 12px 8px;
            font-size: 14px !important;
        }
        
        .tabulator-col:last-child {
            border-right: none;
        }
        
        .tabulator-col-title {
            color: white;
            font-weight: 600;
            font-size: 14px !important;
        }
        
        /* Row styling with alternating colors */
        .tabulator-row {
            border-bottom: 1px solid #f0f0f0;
            transition: all 0.2s ease;
            font-size: 14px !important;
        }
        
        .tabulator-row:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        .tabulator-row:nth-child(odd) {
            background-color: white;
        }
        
        .tabulator-row:hover {
            background-color: #e3f2fd !important;
            cursor: pointer;
        }
        
        .tabulator-row.tabulator-selected {
            background-color: #fff3e0 !important;
        }
        
        /* Cell styling */
        .tabulator-cell {
            padding: 8px 12px;
            border-right: 1px solid #f0f0f0;
            font-size: 14px !important;
            line-height: 1.4 !important;
        }
        
        .tabulator-cell:last-child {
            border-right: none;
        }

        /* CRITICAL: Subrow/subtable container styling - ISSUE #6 FIXED */
        .subrow-container .tabulator .tabulator-tableHolder {
            overflow-y: visible !important;
            max-height: none !important;
            height: auto !important;
        }

        .subrow-container {
            padding: 15px 20px !important;
            background: #f8f9fa !important;
            margin: 10px 0 !important;
            border-radius: 6px !important;
            display: block !important;
            width: 100% !important;
            position: relative !important;
            z-index: 1 !important;
            /* CRITICAL: Maintain font size */
            font-size: 14px !important;
            line-height: 1.4 !important;
        }
        
        /* ENSURE ALL SUBTABLE CONTENT MAINTAINS PROPER FONT SIZE */
        .subrow-container .tabulator,
        .subrow-container .tabulator-table,
        .subrow-container .tabulator-header,
        .subrow-container .tabulator-row,
        .subrow-container .tabulator-cell {
            font-size: 14px !important;
            line-height: 1.4 !important;
        }
        
        .subrow-container .tabulator-header {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            font-size: 14px !important;
            font-weight: bold !important;
        }
        
        .subrow-container .tabulator-col-title {
            color: white !important;
            font-size: 14px !important;
            font-weight: 600 !important;
        }
        
        .subrow-container .tabulator-row:nth-child(even) {
            background-color: #f9f9f9 !important;
        }
        
        .subrow-container .tabulator-row:nth-child(odd) {
            background-color: white !important;
        }
        
        .subrow-container .tabulator-cell {
            font-size: 14px !important;
            padding: 6px 8px !important;
        }
        
        .subrow-container h4 {
            font-size: 14px !important;
            font-weight: bold !important;
            margin: 0 0 10px 0 !important;
            color: #333 !important;
            text-align: center !important;
        }
        
        /* MATCHUPS TABLE SPECIFIC FIXES - Issues #1-#7 */
        #matchups-table .subrow-container {
            max-width: 1120px !important;
            margin: 0 auto 15px auto !important;
        }
        
        /* Weather and Park Factors containers side by side */
        #matchups-table .subrow-container > div:first-child {
            display: flex !important;
            justify-content: center !important;
            gap: 20px !important;
            margin-bottom: 15px !important;
        }
        
        /* Consistent spacing for all subtables */
        #matchups-table .subrow-container > div {
            margin-bottom: 15px !important;
        }
        
        /* Scrollbar styling - ENHANCED VISIBILITY */
        .tabulator .tabulator-tableHolder {
            overflow-y: scroll !important;
            overflow-x: hidden !important;
            max-width: 100% !important;
            -ms-overflow-style: auto !important;
            scrollbar-width: auto !important;
        }
        
        .tabulator .tabulator-tableHolder::-webkit-scrollbar {
            width: 16px !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        .tabulator .tabulator-tableHolder::-webkit-scrollbar-track {
            background: #f8f9fa !important;
            border-radius: 8px !important;
            border: 1px solid #e0e0e0 !important;
        }
        
        .tabulator .tabulator-tableHolder::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            border-radius: 8px !important;
            border: 2px solid #f8f9fa !important;
        }
        
        .tabulator .tabulator-tableHolder::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%) !important;
        }
        
        /* Row expander styling */
        .row-expander {
            font-family: monospace;
            font-weight: bold;
            color: #007bff;
            cursor: pointer;
            user-select: none;
            transition: color 0.2s ease;
        }
        
        .row-expander:hover {
            color: #0056b3;
        }
        
        .tabulator-row.row-expanded {
            background-color: #fff3e0 !important;
        }
        
        .tabulator-row.row-expanded .row-expander {
            color: #dc3545;
        }
        
        /* Filter dropdown styling */
        .custom-multiselect {
            position: relative;
            width: 100%;
            min-width: 120px;
        }
        
        .custom-multiselect-button {
            width: 100%;
            padding: 4px 8px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            text-align: left;
        }
        
        .custom-multiselect-dropdown {
            position: fixed !important;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            z-index: 999999 !important;
            max-height: 300px !important;
            overflow-y: auto !important;
            min-width: 150px;
        }
        
        .custom-multiselect-option {
            padding: 8px 12px;
            cursor: pointer;
            font-size: 12px;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .custom-multiselect-option:hover {
            background-color: #f5f5f5;
        }
        
        .custom-multiselect-option.selected {
            background-color: #e3f2fd;
            color: #1976d2;
        }
        
        /* Loading indicator */
        .tabulator-loader {
            background: rgba(255, 255, 255, 0.9);
        }
        
        .tabulator-loader-msg {
            font-size: 16px;
            font-weight: bold;
            color: #667eea;
        }
        
        /* Responsive Design */
        @media screen and (max-width: ${CONFIG.BREAKPOINTS.mobile}px) {
            .table-container {
                transform: scale(${CONFIG.TABLE_DIMENSIONS.mobile.scale});
                transform-origin: top left;
                width: ${CONFIG.TABLE_DIMENSIONS.mobile.containerWidth};
                margin: 0;
            }
            
            .tabulator,
            .tabulator *,
            .subrow-container,
            .subrow-container * {
                font-size: 12px !important;
            }
            
            .tabulator-cell {
                padding: 6px 8px !important;
            }
            
            .subrow-container {
                padding: 10px 15px !important;
            }
            
            .subrow-container h4 {
                font-size: 12px !important;
            }
        }
        
        @media screen and (min-width: ${CONFIG.BREAKPOINTS.mobile + 1}px) and (max-width: ${CONFIG.BREAKPOINTS.tablet}px) {
            .table-container {
                transform: scale(${CONFIG.TABLE_DIMENSIONS.tablet.scale});
                transform-origin: top left;
                width: ${CONFIG.TABLE_DIMENSIONS.tablet.containerWidth};
                margin: 0 auto;
            }
            
            .tabulator,
            .tabulator *,
            .subrow-container,
            .subrow-container * {
                font-size: 13px !important;
            }
            
            .tabulator-cell {
                padding: 7px 10px !important;
            }
            
            .subrow-container {
                padding: 12px 18px !important;
            }
            
            .subrow-container h4 {
                font-size: 13px !important;
            }
        }
        
        @media screen and (min-width: ${CONFIG.BREAKPOINTS.tablet + 1}px) {
            .table-container {
                transform: scale(1);
                width: 100%;
                max-width: none;
                margin: 0 auto;
            }
            
            .tabulator,
            .tabulator *,
            .subrow-container,
            .subrow-container * {
                font-size: 14px !important;
            }
        }
        
        /* Animations and transitions */
        .tabulator-row {
            transition: all 0.3s ease;
        }
        
        .subrow-container {
            animation: slideDown 0.3s ease-out;
        }
        
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        /* Print styles */
        @media print {
            .tabulator {
                border: 1px solid #333 !important;
            }
            
            .tabulator-header {
                background: #f0f0f0 !important;
                color: #333 !important;
            }
            
            .tabulator-row:nth-child(even) {
                background: #f9f9f9 !important;
            }
            
            .subrow-container {
                background: #f5f5f5 !important;
                border: 1px solid #ccc !important;
            }
        }
        
        /* Accessibility enhancements */
        .tabulator-row:focus-within {
            outline: 2px solid #4285f4;
            outline-offset: -2px;
        }
        
        .row-expander:focus {
            outline: 2px solid #4285f4;
            outline-offset: 2px;
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
            .tabulator {
                border: 2px solid #000;
            }
            
            .tabulator-header {
                background: #000 !important;
                color: #fff !important;
            }
            
            .tabulator-row:nth-child(even) {
                background: #f0f0f0 !important;
            }
            
            .tabulator-row:nth-child(odd) {
                background: #fff !important;
            }
        }
        
        /* Motion reduction for accessibility */
        @media (prefers-reduced-motion: reduce) {
            .tabulator-row,
            .subrow-container {
                transition: none !important;
                animation: none !important;
            }
        }
    `;
    document.head.appendChild(style);
    console.log('Full table styles with ALL ISSUES FIXED injected');
}

// Export additional style utilities if needed
export function applyResponsiveScaling() {
    const containers = document.querySelectorAll('.table-container');
    containers.forEach(container => {
        const scale = getDeviceScale();
        if (scale !== 1) {
            container.style.transform = `scale(${scale})`;
            container.style.transformOrigin = 'top left';
        } else {
            container.style.transform = 'none';
        }
    });
}

// Utility to fix text sizes if they get messed up
export function enforceTextSizing() {
    const style = document.createElement('style');
    style.setAttribute('data-source', 'text-size-fix');
    style.textContent = `
        /* EMERGENCY TEXT SIZE FIX */
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
            font-size: 14px !important;
            line-height: 1.4 !important;
        }
        
        @media screen and (max-width: 768px) {
            .tabulator,
            .tabulator *,
            .subrow-container,
            .subrow-container * {
                font-size: 12px !important;
            }
        }
        
        @media screen and (min-width: 769px) and (max-width: 1024px) {
            .tabulator,
            .tabulator *,
            .subrow-container,
            .subrow-container * {
                font-size: 13px !important;
            }
        }
    `;
    document.head.appendChild(style);
    console.log('Emergency text size fix applied');
}
