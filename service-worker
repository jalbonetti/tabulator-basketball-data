// service-worker.js - Advanced caching for Basketball Tabulator tables
const CACHE_VERSION = 'v1';
const CACHE_NAMES = {
    static: `basketball-static-${CACHE_VERSION}`,
    api: `basketball-api-${CACHE_VERSION}`,
    runtime: `basketball-runtime-${CACHE_VERSION}`
};

// API endpoints with their cache durations (15 minutes)
const API_CACHE_CONFIG = {
    'BasketPlayerPropClearances': 15 * 60 * 1000,
    // Add more basketball endpoints here as you create them
    // 'BasketTeamStats': 15 * 60 * 1000,
    // 'BasketMatchups': 15 * 60 * 1000,
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAMES.static)
            .then((cache) => {
                console.log('Service Worker: Caching static files');
                return cache.addAll([
                    '/',
                    '/main.js',
                    '/styles/tableStyles.js',
                    '/shared/config.js',
                    '/shared/utils.js',
                    '/components/customMultiSelect.js',
                    '/components/minMaxFilter.js',
                    '/tables/baseTable.js',
                    '/tables/basketPlayerPropClearances.js'
                ]);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!Object.values(CACHE_NAMES).includes(cacheName)) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - implement caching strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Check if this is a Supabase API request
    if (url.origin === 'https://hcwolbvmffkmjcxsumwn.supabase.co') {
        event.respondWith(handleAPIRequest(request));
    }
    // Check if this is a static asset
    else if (request.destination === 'script' || 
             request.destination === 'style' ||
             request.destination === 'document') {
        event.respondWith(handleStaticRequest(request));
    }
    // Default - network first
    else {
        event.respondWith(fetch(request));
    }
});

// Handle API requests with stale-while-revalidate strategy
async function handleAPIRequest(request) {
    const cache = await caches.open(CACHE_NAMES.api);
    const url = new URL(request.url);
    
    // Determine cache duration based on endpoint
    let cacheDuration = 15 * 60 * 1000; // Default 15 minutes
    for (const [endpoint, duration] of Object.entries(API_CACHE_CONFIG)) {
        if (url.pathname.includes(endpoint)) {
            cacheDuration = duration;
            break;
        }
    }
    
    // Try to get from cache first
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        const cachedTime = cachedResponse.headers.get('sw-cached-time');
        const age = Date.now() - parseInt(cachedTime || '0');
        
        // If cache is still fresh, return it
        if (age < cacheDuration) {
            console.log('Service Worker: Returning cached API response');
            
            // Revalidate in background if cache is getting stale (> 50% of duration)
            if (age > cacheDuration * 0.5) {
                fetchAndCache(request, cache);
            }
            
            return cachedResponse;
        }
    }
    
    // Cache miss or stale - fetch from network
    return fetchAndCache(request, cache);
}

// Fetch from network and cache the response
async function fetchAndCache(request, cache) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Clone the response and add cache timestamp
            const responseToCache = networkResponse.clone();
            const headers = new Headers(responseToCache.headers);
            headers.set('sw-cached-time', Date.now().toString());
            
            const modifiedResponse = new Response(await responseToCache.blob(), {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: headers
            });
            
            cache.put(request, modifiedResponse);
            console.log('Service Worker: Cached API response');
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Service Worker: Network request failed', error);
        
        // Return cached response if available (even if stale)
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            console.log('Service Worker: Returning stale cache due to network error');
            return cachedResponse;
        }
        
        throw error;
    }
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
    const cache = await caches.open(CACHE_NAMES.static);
    
    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        // Revalidate in background
        fetchAndCacheStatic(request, cache);
        return cachedResponse;
    }
    
    // Not in cache - fetch from network
    return fetchAndCacheStatic(request, cache);
}

// Fetch and cache static assets
async function fetchAndCacheStatic(request, cache) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Service Worker: Static fetch failed', error);
        
        // Return cached version if available
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            }).then(() => {
                console.log('Service Worker: All caches cleared');
                event.ports[0].postMessage({ success: true });
            })
        );
    }
    
    if (event.data && event.data.type === 'CLEAR_API_CACHE') {
        event.waitUntil(
            caches.delete(CACHE_NAMES.api).then(() => {
                console.log('Service Worker: API cache cleared');
                event.ports[0].postMessage({ success: true });
            })
        );
    }
});

// Background sync for offline changes (future use)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        console.log('Service Worker: Background sync triggered');
        // Handle any pending data sync here
    }
});

console.log('Service Worker: Script loaded');
