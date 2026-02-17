/**
 * sanitize.ts — HTML & SVG sanitization utilities
 *
 * Defense-in-depth against XSS in browser preview, SVG renders,
 * and any other dangerouslySetInnerHTML usage.
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

/** Strip dangerous HTML tags/attributes to prevent XSS in browser preview panel */
export function sanitizeHtml(html: string): string {
    let safe = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    safe = safe.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    safe = safe.replace(/href\s*=\s*["']?\s*javascript:/gi, 'href="');
    safe = safe.replace(/src\s*=\s*["']?\s*javascript:/gi, 'src="');
    safe = safe.replace(/src\s*=\s*["']?\s*data:text\/html/gi, 'src="');
    safe = safe.replace(/<\s*\/?\s*(iframe|object|embed|form|base|meta|link)\b[^>]*>/gi, '');
    safe = safe.replace(/style\s*=\s*["'][^"']*expression\s*\([^"']*["']/gi, '');
    return safe;
}

/** Strip dangerous elements from SVG content */
export function sanitizeSvg(svg: string): string {
    let safe = svg.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    safe = safe.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    safe = safe.replace(/xlink:href\s*=\s*["']?\s*javascript:/gi, 'xlink:href="');
    safe = safe.replace(/href\s*=\s*["']?\s*javascript:/gi, 'href="');
    safe = safe.replace(/<\s*\/?\s*(foreignObject|set|animate[^>]*attributeName\s*=\s*["']href)\b[^>]*>/gi, '');
    return safe;
}
