/**
 * MIMI Agent — Web Search API Route
 *
 * Server-side proxy for DuckDuckGo search to bypass CORS restrictions.
 * The browser cannot directly fetch DuckDuckGo (CORS 403), so this
 * API route does the fetch server-side where CORS doesn't apply.
 *
 * POST /api/mimi/search
 * Body: { query: string, limit?: number }
 * Returns: { results: Array<{ title, url, snippet }> }
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { NextRequest, NextResponse } from 'next/server';

interface SearchResult {
    title: string;
    url: string;
    snippet: string;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { query, limit = 5 } = body;

        if (!query || typeof query !== 'string') {
            return NextResponse.json(
                { error: 'Missing or invalid query parameter' },
                { status: 400 }
            );
        }

        const results = await searchDuckDuckGo(query, limit);

        return NextResponse.json({ results });
    } catch (error) {
        console.error('[API/search] Error:', error);
        return NextResponse.json(
            { error: 'Search failed', details: String(error) },
            { status: 500 }
        );
    }
}

/**
 * Fetch DuckDuckGo HTML search results server-side (no CORS).
 */
async function searchDuckDuckGo(query: string, limit: number): Promise<SearchResult[]> {
    const encoded = encodeURIComponent(query);

    // Try DuckDuckGo HTML version first, then Lite
    const urls = [
        `https://html.duckduckgo.com/html/?q=${encoded}`,
        `https://lite.duckduckgo.com/lite/?q=${encoded}`,
    ];

    for (const url of urls) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml',
                    'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
                },
            });

            clearTimeout(timeout);

            if (response.ok) {
                const html = await response.text();
                const results = parseResults(html, limit);
                if (results.length > 0) {
                    return results;
                }
            }
        } catch {
            continue;
        }
    }

    return [];
}

/**
 * Parse DuckDuckGo HTML results.
 */
function parseResults(html: string, limit: number): SearchResult[] {
    const results: SearchResult[] = [];

    // Strategy A: DDG HTML version — result links in <a class="result__a"> tags
    const htmlPattern = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    let match;
    while ((match = htmlPattern.exec(html)) !== null && results.length < limit) {
        const url = cleanUrl(match[1]);
        const title = stripHtml(match[2]);
        const snippet = stripHtml(match[3]);
        if (title && url) {
            results.push({ title, url, snippet });
        }
    }

    // Strategy B: DDG Lite version
    if (results.length === 0) {
        const litePattern = /<a[^>]*href="([^"]*)"[^>]*class="[^"]*result-link[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
        while ((match = litePattern.exec(html)) !== null && results.length < limit) {
            const url = cleanUrl(match[1]);
            const title = stripHtml(match[2]);
            if (title && url) {
                results.push({ title, url, snippet: '' });
            }
        }
    }

    // Strategy C: Generic link extraction
    if (results.length === 0) {
        const genericPattern = /<a[^>]*href="(https?:\/\/(?!duckduckgo)[^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
        const seen = new Set<string>();
        while ((match = genericPattern.exec(html)) !== null && results.length < limit) {
            const url = cleanUrl(match[1]);
            const title = stripHtml(match[2]);
            if (title && url && title.length > 5 && !seen.has(url)) {
                seen.add(url);
                results.push({ title, url, snippet: '' });
            }
        }
    }

    return results;
}

function cleanUrl(url: string): string {
    if (url.includes('uddg=')) {
        try {
            return decodeURIComponent(url.split('uddg=')[1].split('&')[0]);
        } catch {
            return url;
        }
    }
    if (url.startsWith('//')) return 'https:' + url;
    return url;
}

function stripHtml(html: string): string {
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
