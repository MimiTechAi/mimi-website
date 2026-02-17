/**
 * formatContent — TDD Tests
 * Finding F1: XSS Defense-in-Depth
 *
 * Tests that formatContent properly escapes dangerous content
 * and prevents XSS via crafted markdown.
 */

import { formatContent } from '../formatContent';

describe('formatContent', () => {
    // ═══ F1: XSS Defense-in-Depth ═══

    test('escapes raw HTML script tags', () => {
        const result = formatContent('<script>alert(1)</script>');
        expect(result).not.toContain('<script');
        expect(result).toContain('&lt;script&gt;');
    });

    test('escapes raw HTML img onerror', () => {
        const result = formatContent('<img src=x onerror=alert(1)>');
        expect(result).not.toContain('<img');
        expect(result).toContain('&lt;img');
    });

    test('blocks javascript: URIs in markdown links', () => {
        const result = formatContent('[click](javascript:alert(1))');
        expect(result).not.toContain('href="javascript:');
    });

    test('blocks javascript: URIs with mixed case', () => {
        const result = formatContent('[click](JavaScript:alert(1))');
        expect(result).not.toContain('href="javascript:');
        expect(result).not.toContain('href="JavaScript:');
    });

    test('allows https:// links in markdown', () => {
        const result = formatContent('[ok](https://example.com)');
        expect(result).toContain('href="https://example.com"');
        expect(result).toContain('>ok</a>');
    });

    test('allows http:// links in markdown', () => {
        const result = formatContent('[site](http://example.com)');
        expect(result).toContain('href="http://example.com"');
    });

    test('blocks data: URIs in markdown links', () => {
        const result = formatContent('[click](data:text/html,<script>alert(1)</script>)');
        expect(result).not.toContain('href="data:');
    });

    // ═══ Markdown rendering correctness ═══

    test('renders code blocks with language label', () => {
        const result = formatContent('```python\nprint("hello")\n```');
        expect(result).toContain('class="code-block"');
        expect(result).toContain('class="code-lang"');
        expect(result).toContain('python');
    });

    test('renders inline code', () => {
        const result = formatContent('use `npm install` here');
        expect(result).toContain('<code>npm install</code>');
    });

    test('renders bold text', () => {
        const result = formatContent('this is **bold** text');
        expect(result).toContain('<strong>bold</strong>');
    });

    test('renders italic text', () => {
        const result = formatContent('this is *italic* text');
        expect(result).toContain('<em>italic</em>');
    });

    test('renders headers', () => {
        const result = formatContent('# Title');
        expect(result).toContain('<h2>Title</h2>');
    });

    test('renders unordered lists', () => {
        const result = formatContent('- item one\n- item two');
        expect(result).toContain('<ul>');
        expect(result).toContain('<li>item one</li>');
        expect(result).toContain('<li>item two</li>');
    });

    test('adds target="_blank" and rel="noopener" to links', () => {
        const result = formatContent('[link](https://example.com)');
        expect(result).toContain('target="_blank"');
        expect(result).toContain('rel="noopener"');
    });
});
