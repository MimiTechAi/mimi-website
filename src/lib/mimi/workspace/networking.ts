/**
 * MIMI Tech AI - Network Layer
 * 
 * Fetch API wrapper with CORS proxy support for browser.
 * Enables HTTP requests from MIMI Workspace.
 * 
 * Features:
 * - GET, POST, PUT, DELETE requests
 * - Automatic CORS proxy for cross-origin
 * - Response caching
 * - Timeout handling
 * - Error recovery
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 * https://mimitechai.com
 */

export interface FetchOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    body?: string | object;
    timeout?: number;
    useProxy?: boolean;
    cache?: boolean;
}

export interface FetchResult {
    ok: boolean;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: unknown;
    responseTime: number;
}

// CORS proxies for cross-origin requests
const CORS_PROXIES = [
    'https://cors.isomorphic-git.org',
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url='
];

// Simple in-memory cache
const responseCache = new Map<string, { data: FetchResult; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * MIMI Tech AI - Network Module
 */
export class MimiNetwork {
    private defaultProxy: string = CORS_PROXIES[0];
    private defaultTimeout: number = 30000;

    /**
     * Make an HTTP request
     */
    async fetch(url: string, options: FetchOptions = {}): Promise<FetchResult> {
        const {
            method = 'GET',
            headers = {},
            body,
            timeout = this.defaultTimeout,
            useProxy = this.needsProxy(url),
            cache = method === 'GET'
        } = options;

        // Check cache for GET requests
        const cacheKey = `${method}:${url}`;
        if (cache && method === 'GET') {
            const cached = responseCache.get(cacheKey);
            if (cached && cached.expiry > Date.now()) {
                console.log(`[MIMI Network] Cache hit: ${url}`);
                return cached.data;
            }
        }

        const startTime = performance.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            // Build request URL (with proxy if needed)
            const requestUrl = useProxy ? `${this.defaultProxy}${url}` : url;

            // Build request options
            const fetchOptions: RequestInit = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                },
                signal: controller.signal
            };

            // Add body for non-GET requests
            if (body && method !== 'GET') {
                fetchOptions.body = typeof body === 'string'
                    ? body
                    : JSON.stringify(body);
            }

            const response = await fetch(requestUrl, fetchOptions);
            clearTimeout(timeoutId);

            const endTime = performance.now();

            // Parse response
            let data: unknown;
            const contentType = response.headers.get('content-type') || '';

            if (contentType.includes('application/json')) {
                data = await response.json();
            } else if (contentType.includes('text/')) {
                data = await response.text();
            } else {
                // Return as blob URL for binary data
                const blob = await response.blob();
                data = URL.createObjectURL(blob);
            }

            // Build result
            const result: FetchResult = {
                ok: response.ok,
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                data,
                responseTime: endTime - startTime
            };

            // Cache successful GET responses
            if (cache && method === 'GET' && response.ok) {
                responseCache.set(cacheKey, {
                    data: result,
                    expiry: Date.now() + CACHE_TTL
                });
            }

            console.log(`[MIMI Network] ${method} ${url} → ${response.status} (${Math.round(result.responseTime)}ms)`);
            return result;

        } catch (error) {
            clearTimeout(timeoutId);
            const endTime = performance.now();

            if (error instanceof Error && error.name === 'AbortError') {
                return {
                    ok: false,
                    status: 408,
                    statusText: 'Request Timeout',
                    headers: {},
                    data: { error: `Request timed out after ${timeout}ms` },
                    responseTime: endTime - startTime
                };
            }

            // Try with different proxy if original failed
            if (useProxy && !url.includes(this.defaultProxy)) {
                console.warn('[MIMI Network] Retrying with alternate proxy...');
                return this.fetchWithAlternateProxy(url, options);
            }

            return {
                ok: false,
                status: 0,
                statusText: 'Network Error',
                headers: {},
                data: { error: error instanceof Error ? error.message : 'Unknown error' },
                responseTime: endTime - startTime
            };
        }
    }

    /**
     * GET request shorthand
     */
    async get(url: string, options: Omit<FetchOptions, 'method'> = {}): Promise<FetchResult> {
        return this.fetch(url, { ...options, method: 'GET' });
    }

    /**
     * POST request shorthand
     */
    async post(url: string, body: unknown, options: Omit<FetchOptions, 'method' | 'body'> = {}): Promise<FetchResult> {
        return this.fetch(url, { ...options, method: 'POST', body: body as object });
    }

    /**
     * PUT request shorthand
     */
    async put(url: string, body: unknown, options: Omit<FetchOptions, 'method' | 'body'> = {}): Promise<FetchResult> {
        return this.fetch(url, { ...options, method: 'PUT', body: body as object });
    }

    /**
     * DELETE request shorthand
     */
    async delete(url: string, options: Omit<FetchOptions, 'method'> = {}): Promise<FetchResult> {
        return this.fetch(url, { ...options, method: 'DELETE' });
    }

    /**
     * Clear the response cache
     */
    clearCache(): void {
        responseCache.clear();
        console.log('[MIMI Network] Cache cleared');
    }

    /**
     * Set the default CORS proxy
     */
    setProxy(proxyUrl: string): void {
        this.defaultProxy = proxyUrl;
    }

    /**
     * Set default timeout
     */
    setTimeout(ms: number): void {
        this.defaultTimeout = ms;
    }

    // ─────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────

    private needsProxy(url: string): boolean {
        try {
            const urlObj = new URL(url);
            // Same origin doesn't need proxy
            if (typeof window !== 'undefined' && urlObj.origin === window.location.origin) {
                return false;
            }
            // Localhost doesn't need proxy
            if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
                return false;
            }
            return true;
        } catch {
            return true;
        }
    }

    private async fetchWithAlternateProxy(url: string, options: FetchOptions): Promise<FetchResult> {
        for (let i = 1; i < CORS_PROXIES.length; i++) {
            try {
                const proxyUrl = CORS_PROXIES[i] + url;
                const response = await fetch(proxyUrl, {
                    method: options.method || 'GET',
                    headers: options.headers,
                    body: options.body ? JSON.stringify(options.body) : undefined
                });

                if (response.ok) {
                    const data = await response.json().catch(() => response.text());
                    return {
                        ok: true,
                        status: response.status,
                        statusText: response.statusText,
                        headers: Object.fromEntries(response.headers.entries()),
                        data,
                        responseTime: 0
                    };
                }
            } catch {
                continue;
            }
        }

        return {
            ok: false,
            status: 0,
            statusText: 'All proxies failed',
            headers: {},
            data: { error: 'Could not reach the requested URL through any proxy' },
            responseTime: 0
        };
    }
}

// ─────────────────────────────────────────────────────────────
// Singleton instance
// ─────────────────────────────────────────────────────────────

let networkInstance: MimiNetwork | null = null;

/**
 * Get the singleton network instance
 */
export function getMimiNetwork(): MimiNetwork {
    if (!networkInstance) {
        networkInstance = new MimiNetwork();
    }
    return networkInstance;
}

export default MimiNetwork;
