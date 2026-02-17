/**
 * sanitize — TDD Tests
 * V2-11: browserContent XSS defense
 * V2-12: SVG XSS defense
 */

import { sanitizeHtml, sanitizeSvg } from '../sanitize';

describe('sanitizeHtml', () => {
    test('strips <script> tags', () => {
        const result = sanitizeHtml('<div>ok</div><script>alert(1)</script>');
        expect(result).not.toContain('<script');
        expect(result).toContain('<div>ok</div>');
    });

    test('strips inline event handlers', () => {
        const result = sanitizeHtml('<img src="x" onerror="alert(1)">');
        expect(result).not.toContain('onerror');
    });

    test('strips javascript: in href', () => {
        const result = sanitizeHtml('<a href="javascript:alert(1)">x</a>');
        expect(result).not.toContain('javascript:');
    });

    test('strips javascript: in src', () => {
        const result = sanitizeHtml('<img src="javascript:alert(1)">');
        expect(result).not.toContain('javascript:');
    });

    test('strips data:text/html in src', () => {
        const result = sanitizeHtml('<iframe src="data:text/html,<script>alert(1)</script>">');
        expect(result).not.toContain('data:text/html');
    });

    test('strips dangerous elements (iframe, object, embed, form)', () => {
        const result = sanitizeHtml('<iframe src="x"></iframe><object data="x"></object>');
        expect(result).not.toContain('<iframe');
        expect(result).not.toContain('<object');
    });

    test('strips CSS expression()', () => {
        const result = sanitizeHtml('<div style="width: expression(alert(1))">x</div>');
        expect(result).not.toContain('expression');
    });

    test('preserves safe HTML', () => {
        const result = sanitizeHtml('<h1>Title</h1><p>Text <strong>bold</strong></p>');
        expect(result).toBe('<h1>Title</h1><p>Text <strong>bold</strong></p>');
    });
});

describe('sanitizeSvg', () => {
    test('strips <script> from SVG', () => {
        const result = sanitizeSvg('<svg><script>alert(1)</script><rect/></svg>');
        expect(result).not.toContain('<script');
        expect(result).toContain('<rect/>');
    });

    test('strips inline event handlers from SVG', () => {
        const result = sanitizeSvg('<svg><rect onload="alert(1)"/></svg>');
        expect(result).not.toContain('onload');
    });

    test('strips javascript: in xlink:href', () => {
        const result = sanitizeSvg('<svg><a xlink:href="javascript:alert(1)">x</a></svg>');
        expect(result).not.toContain('javascript:');
    });

    test('strips javascript: in href', () => {
        const result = sanitizeSvg('<svg><a href="javascript:alert(1)">x</a></svg>');
        expect(result).not.toContain('javascript:');
    });

    test('preserves safe SVG', () => {
        const input = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>';
        expect(sanitizeSvg(input)).toBe(input);
    });
});
