// shared/config.js - Basketball Props Configuration

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
            maxHeight: '400px',
            rowHeight: 32,
            headerHeight: 40,
            fontSize: 10
        },
        tablet: {
            maxHeight: '500px',
            rowHeight: 36,
            headerHeight: 45,
            fontSize: 11
        },
        desktop: {
            maxHeight: '600px',
            rowHeight: 40,
            headerHeight: 50,
            fontSize: 12
        }
    }
};

// Team name mapping for display
export const TEAM_NAME_MAP = {
    'ATL': 'Hawks',
    'BOS': 'Celtics',
    'BKN': 'Nets',
    'CHA': 'Hornets',
    'CHI': 'Bulls',
    'CLE': 'Cavaliers',
    'DAL': 'Mavericks',
    'DEN': 'Nuggets',
    'DET': 'Pistons',
    'GSW': 'Warriors',
    'HOU': 'Rockets',
    'IND': 'Pacers',
    'LAC': 'Clippers',
    'LAL': 'Lakers',
    'MEM': 'Grizzlies',
    'MIA': 'Heat',
    'MIL': 'Bucks',
    'MIN': 'Timberwolves',
    'NOP': 'Pelicans',
    'NYK': 'Knicks',
    'OKC': 'Thunder',
    'ORL': 'Magic',
    'PHI': '76ers',
    'PHX': 'Suns',
    'POR': 'Trail Blazers',
    'SAC': 'Kings',
    'SAS': 'Spurs',
    'TOR': 'Raptors',
    'UTA': 'Jazz',
    'WAS': 'Wizards'
};

// =====================================================
// DEVICE DETECTION FUNCTIONS
// =====================================================

/**
 * Check if current device is mobile (width <= 768px)
 * @returns {boolean}
 */
export function isMobile() {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= CONFIG.BREAKPOINTS.mobile;
}

/**
 * Check if current device is tablet (769px - 1024px)
 * @returns {boolean}
 */
export function isTablet() {
    if (typeof window === 'undefined') return false;
    return window.innerWidth > CONFIG.BREAKPOINTS.mobile && 
           window.innerWidth <= CONFIG.BREAKPOINTS.tablet;
}

/**
 * Check if current device is desktop (> 1024px)
 * @returns {boolean}
 */
export function isDesktop() {
    if (typeof window === 'undefined') return true;
    return window.innerWidth > CONFIG.BREAKPOINTS.tablet;
}

/**
 * Get device type string
 * @returns {'mobile'|'tablet'|'desktop'}
 */
export function getDeviceType() {
    if (isMobile()) return 'mobile';
    if (isTablet()) return 'tablet';
    return 'desktop';
}

/**
 * Get scale factor for responsive sizing
 * @returns {number} Scale factor between 0.7 and 1.0
 */
export function getDeviceScale() {
    if (typeof window === 'undefined') return 1;
    
    const width = window.innerWidth;
    
    if (width <= 480) return 0.7;
    if (width <= 768) return 0.8;
    if (width <= 1024) return 0.9;
    return 1;
}

/**
 * Get table dimensions based on current device
 * @returns {object} Table dimension configuration
 */
export function getTableDimensions() {
    const deviceType = getDeviceType();
    return CONFIG.TABLE_DIMENSIONS[deviceType];
}

/**
 * Calculate responsive font size
 * @param {number} baseSize - Base font size in pixels
 * @returns {number} Scaled font size
 */
export function getResponsiveFontSize(baseSize = 12) {
    const scale = getDeviceScale();
    return Math.round(baseSize * scale);
}

// Export API config helper
export const API_CONFIG = CONFIG.API_CONFIG;

// Default export
export default CONFIG;
