// shared/config.js - COMPLETE RESPONSIVE CONFIGURATION WITH FIXED DIMENSIONS
export const CONFIG = {
    // Supabase Configuration
    SUPABASE_URL: 'https://hcwolbvmffkmjcxsumwn.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjd29sYnZtZmZrbWpjeHN1bXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNDQzMTIsImV4cCI6MjA1NTkyMDMxMn0.tM4RwXZpZM6ZHuFFMhWcKYLT3E4NA6Ig90CHw7QtJf0',
    
    // Cache Configuration
    CACHE_ENABLED: true,
    CACHE_TTL: 15 * 60 * 1000, // 15 minutes in milliseconds
    CACHE_VERSION: '1.0.0',
    
    // API Configuration
    API_CONFIG: {
        baseURL: "https://hcwolbvmffkmjcxsumwn.supabase.co/rest/v1/",
        headers: {
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjd29sYnZtZmZrbWpjeHN1bXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNDQzMTIsImV4cCI6MjA1NTkyMDMxMn0.tM4RwXZpZM6ZHuFFMhWcKYLT3E4NA6Ig90CHw7QtJf0",
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjd29sYnZtZmZrbWpjeHN1bXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNDQzMTIsImV4cCI6MjA1NTkyMDMxMn0.tM4RwXZpZM6ZHuFFMhWcKYLT3E4NA6Ig90CHw7QtJf0",
            "Content-Type": "application/json",
            "Prefer": "return=representation,count=exact",
            "Accept": "application/json",
            "Accept-Profile": "public",
            "Cache-Control": "public, max-age=900"
        },
        fetchConfig: {
            pageSize: 1000,
            maxRetries: 3,
            retryDelay: 1000,
            timeout: 300000,
            maxRequestsPerSecond: 5,
            enableBatching: true,
            cacheEnabled: true,
            cacheDuration: 15 * 60 * 1000
        }
    },
    
    // Table Names
    TABLES: {
        BATTER_CLEARANCES: 'ModBatterClearances',
        PITCHER_CLEARANCES: 'ModPitcherClearances',
        BATTER_CLEARANCES_ALT: 'ModBatterClearancesAlt',
        PITCHER_CLEARANCES_ALT: 'ModPitcherClearancesAlt',
        MOD_BATTER_STATS: 'ModBatterStats',
        MOD_PITCHER_STATS: 'ModPitcherStats',
        MATCHUPS: 'ModMatchupsData',
        BATTER_ODDS: 'ModBatterOdds',
        PITCHER_ODDS: 'ModPitcherOdds',
        BATTER_PROPS: 'ModBatterProps',
        PITCHER_PROPS: 'ModPitcherProps',
        GAME_PROPS: 'ModGameProps'
    },
    
    // FIXED TABLE DIMENSIONS - Properly sized to prevent overflow
    TABLE_DIMENSIONS: {
        // Desktop dimensions (1200px+ screens) - CORRECTED WIDTHS
        desktop: {
            matchups: { 
                width: 1200, 
                maxWidth: 1200,
                subtableWidth: 1120, // Leaves room for padding
                parkFactorsWidth: 550,
                weatherWidth: 550
            },
            batterClearances: { 
                width: 1400, // Reduced from 1860px
                maxWidth: 1400 
            },
            batterClearancesAlt: { 
                width: 1200, // Reduced from 1360px
                maxWidth: 1200 
            },
            pitcherClearances: { 
                width: 1400, // Reduced from 1860px
                maxWidth: 1400 
            },
            pitcherClearancesAlt: { 
                width: 1200, // Reduced from 1360px
                maxWidth: 1200 
            },
            modBatterStats: { 
                width: 1400, // Reduced from 1720px
                maxWidth: 1400 
            },
            modPitcherStats: { 
                width: 1400, // Reduced from 1720px
                maxWidth: 1400 
            },
            batterProps: { 
                width: 1400, // Reduced from 1720px
                maxWidth: 1400 
            },
            pitcherProps: { 
                width: 1400, // Reduced from 1720px
                maxWidth: 1400 
            },
            gameProps: { 
                width: 1400, // Reduced from 1720px
                maxWidth: 1400 
            }
        },
        // Tablet dimensions (768px - 1199px)
        tablet: {
            scale: 0.85,
            transformOrigin: 'top center',
            containerWidth: '118%' // 100 / 0.85
        },
        // Mobile dimensions (< 768px)
        mobile: {
            scale: 0.75,
            transformOrigin: 'top center',
            containerWidth: '133%' // 100 / 0.75
        }
    },
    
    // Responsive breakpoints
    BREAKPOINTS: {
        mobile: 767,
        tablet: 1199,
        desktop: 1200,
        ultrawide: 1920
    },
    
    // Display Configuration
    DISPLAY: {
        ROWS_PER_PAGE: 50,
        MAX_ROWS_VIRTUAL: 10000,
        DEBOUNCE_DELAY: 300,
        ANIMATION_DURATION: 200,
        TABLE_HEIGHT: '600px',
        HEADER_HEIGHT: 30,
        ROW_HEIGHT: 28,
        MOBILE_SCALE: 0.75,
        TABLET_SCALE: 0.85,
        REMOVE_ALL_SCROLLBARS: true,
        ENABLE_PINCH_ZOOM: true
    },
    
    // Feature Flags
    FEATURES: {
        ENABLE_CACHING: true,
        ENABLE_VIRTUAL_DOM: true,
        ENABLE_PROGRESSIVE_LOADING: true,
        ENABLE_STATE_PRESERVATION: true,
        ENABLE_ODDS_INTEGRATION: true,
        ENABLE_RESPONSIVE_TABLES: true,
        REMOVE_SCROLLBARS: true,
        ENABLE_MOBILE_PINCH_ZOOM: true,
        USE_FIXED_TABLE_CONTAINERS: true,
        ENABLE_BACKGROUND_IMAGES: true
    },
    
    // Team Abbreviations Mapping
    TEAM_ABBREVIATIONS: {
        'Arizona Diamondbacks': 'ARI',
        'Atlanta Braves': 'ATL',
        'Baltimore Orioles': 'BAL',
        'Boston Red Sox': 'BOS',
        'Chicago Cubs': 'CHC',
        'Chicago White Sox': 'CHW',
        'Cincinnati Reds': 'CIN',
        'Cleveland Guardians': 'CLE',
        'Colorado Rockies': 'COL',
        'Detroit Tigers': 'DET',
        'Houston Astros': 'HOU',
        'Kansas City Royals': 'KC',
        'Los Angeles Angels': 'LAA',
        'Los Angeles Dodgers': 'LAD',
        'Miami Marlins': 'MIA',
        'Milwaukee Brewers': 'MIL',
        'Minnesota Twins': 'MIN',
        'New York Mets': 'NYM',
        'New York Yankees': 'NYY',
        'Oakland Athletics': 'OAK',
        'Philadelphia Phillies': 'PHI',
        'Pittsburgh Pirates': 'PIT',
        'San Diego Padres': 'SD',
        'San Francisco Giants': 'SF',
        'Seattle Mariners': 'SEA',
        'St. Louis Cardinals': 'STL',
        'Tampa Bay Rays': 'TB',
        'Texas Rangers': 'TEX',
        'Toronto Blue Jays': 'TOR',
        'Washington Nationals': 'WSH'
    },
    
    // Service Worker Configuration
    SW_CONFIG: {
        enabled: false,
        cacheVersion: 'v1',
        cacheNames: {
            static: 'tabulator-static-v1',
            api: 'tabulator-api-v1',
            runtime: 'tabulator-runtime-v1'
        }
    }
};

// Export helper functions
export function getTeamAbbreviation(fullName) {
    return CONFIG.TEAM_ABBREVIATIONS[fullName] || fullName;
}

export function getSupabaseConfig() {
    return {
        url: CONFIG.SUPABASE_URL,
        anonKey: CONFIG.SUPABASE_ANON_KEY
    };
}

// Get responsive table dimensions based on screen size
export function getTableDimensions(tableName) {
    const width = window.innerWidth;
    
    if (width <= CONFIG.BREAKPOINTS.mobile) {
        // Mobile - return desktop dimensions but they'll be scaled
        return {
            ...CONFIG.TABLE_DIMENSIONS.desktop[tableName],
            scale: CONFIG.TABLE_DIMENSIONS.mobile.scale,
            needsScaling: true
        };
    } else if (width <= CONFIG.BREAKPOINTS.tablet) {
        // Tablet
        return {
            ...CONFIG.TABLE_DIMENSIONS.desktop[tableName],
            scale: CONFIG.TABLE_DIMENSIONS.tablet.scale,
            needsScaling: true
        };
    } else {
        // Desktop
        return {
            ...CONFIG.TABLE_DIMENSIONS.desktop[tableName],
            scale: 1,
            needsScaling: false
        };
    }
}

// Check if device is mobile
export function isMobile() {
    return window.innerWidth <= CONFIG.BREAKPOINTS.mobile;
}

// Check if device is tablet
export function isTablet() {
    return window.innerWidth > CONFIG.BREAKPOINTS.mobile && 
           window.innerWidth <= CONFIG.BREAKPOINTS.tablet;
}

// Get appropriate scale for current device
export function getDeviceScale() {
    if (isMobile()) {
        return CONFIG.TABLE_DIMENSIONS.mobile.scale;
    } else if (isTablet()) {
        return CONFIG.TABLE_DIMENSIONS.tablet.scale;
    }
    return 1;
}

// Export CONFIG as default for backwards compatibility
export default CONFIG;

// Export additional items for direct access
export const API_CONFIG = CONFIG.API_CONFIG;
export const TEAM_NAME_MAP = CONFIG.TEAM_ABBREVIATIONS;
export const SW_CONFIG = CONFIG.SW_CONFIG;
