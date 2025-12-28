// shared/config.js - Basketball Props Configuration
export const CONFIG = {
    // Supabase Configuration (same database as baseball)
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
        }
    },
    
    // Responsive Breakpoints
    BREAKPOINTS: {
        mobile: 768,
        tablet: 1024,
        desktop: 1280
    },
    
    // Table Dimensions
    TABLE_DIMENSIONS: {
        mobile: {
            scale: 0.85,
            minFontSize: 11
        },
        tablet: {
            scale: 0.92,
            minFontSize: 12
        },
        desktop: {
            playerPropClearances: {
                minWidth: 1400,
                maxWidth: 1800
            }
        }
    },
    
    // NBA Team Abbreviations
    TEAM_ABBREVIATIONS: {
        'Atlanta Hawks': 'ATL',
        'Boston Celtics': 'BOS',
        'Brooklyn Nets': 'BKN',
        'Charlotte Hornets': 'CHA',
        'Chicago Bulls': 'CHI',
        'Cleveland Cavaliers': 'CLE',
        'Dallas Mavericks': 'DAL',
        'Denver Nuggets': 'DEN',
        'Detroit Pistons': 'DET',
        'Golden State Warriors': 'GSW',
        'Houston Rockets': 'HOU',
        'Indiana Pacers': 'IND',
        'Los Angeles Clippers': 'LAC',
        'Los Angeles Lakers': 'LAL',
        'Memphis Grizzlies': 'MEM',
        'Miami Heat': 'MIA',
        'Milwaukee Bucks': 'MIL',
        'Minnesota Timberwolves': 'MIN',
        'New Orleans Pelicans': 'NOP',
        'New York Knicks': 'NYK',
        'Oklahoma City Thunder': 'OKC',
        'Orlando Magic': 'ORL',
        'Philadelphia 76ers': 'PHI',
        'Phoenix Suns': 'PHX',
        'Portland Trail Blazers': 'POR',
        'Sacramento Kings': 'SAC',
        'San Antonio Spurs': 'SAS',
        'Toronto Raptors': 'TOR',
        'Utah Jazz': 'UTA',
        'Washington Wizards': 'WAS'
    },
    
    // Service Worker Configuration
    SW_CONFIG: {
        enabled: false,
        cacheVersion: 'v1',
        cacheNames: {
            static: 'basketball-static-v1',
            api: 'basketball-api-v1',
            runtime: 'basketball-runtime-v1'
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
        return {
            ...CONFIG.TABLE_DIMENSIONS.desktop[tableName],
            scale: CONFIG.TABLE_DIMENSIONS.mobile.scale,
            needsScaling: true
        };
    } else if (width <= CONFIG.BREAKPOINTS.tablet) {
        return {
            ...CONFIG.TABLE_DIMENSIONS.desktop[tableName],
            scale: CONFIG.TABLE_DIMENSIONS.tablet.scale,
            needsScaling: true
        };
    } else {
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
