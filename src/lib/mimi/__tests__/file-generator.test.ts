/**
 * B-18: File Generator Tests
 * CSV, JSON, Markdown, Text generation
 * 
 * Approach: Check Blob type and size. For content verification,
 * use Blob constructor internals via the Node.js Buffer polyfill.
 */
import { describe, it, expect } from '@jest/globals';
import { generateCSV, generateJSON, generateMarkdown, generateText } from '../file-generator';

// ───────────────────────────────────────────────────────────
// generateCSV
// ───────────────────────────────────────────────────────────
describe('generateCSV', () => {
    it('should generate CSV with correct MIME type', () => {
        const data = [{ name: 'Alice', age: 30 }];
        const blob = generateCSV(data, 'test.csv');
        expect(blob.type).toBe('text/csv');
        expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle empty data array', () => {
        const blob = generateCSV([], 'empty.csv');
        expect(blob.type).toBe('text/csv');
        expect(blob.size).toBe(0);
    });

    it('should produce larger blob with more rows', () => {
        const oneRow = generateCSV([{ a: 1 }], 'test.csv');
        const twoRows = generateCSV([{ a: 1 }, { a: 2 }], 'test.csv');
        expect(twoRows.size).toBeGreaterThan(oneRow.size);
    });
});

// ───────────────────────────────────────────────────────────
// generateJSON
// ───────────────────────────────────────────────────────────
describe('generateJSON', () => {
    it('should generate JSON with correct MIME type', () => {
        const blob = generateJSON({ key: 'value' }, 'test.json');
        expect(blob.type).toBe('application/json');
        expect(blob.size).toBeGreaterThan(0);
    });

    it('should produce larger output with pretty=true (default)', () => {
        const data = { key: 'value', nested: { a: 1 } };
        const pretty = generateJSON(data, 'test.json');
        const minified = generateJSON(data, 'test.json', false);
        expect(pretty.size).toBeGreaterThan(minified.size);
    });
});

// ───────────────────────────────────────────────────────────
// generateMarkdown
// ───────────────────────────────────────────────────────────
describe('generateMarkdown', () => {
    it('should generate markdown with correct MIME type', () => {
        const blob = generateMarkdown('Hello World', 'test.md');
        expect(blob.type).toBe('text/markdown');
        expect(blob.size).toBeGreaterThan(0);
    });

    it('should produce larger output with title option', () => {
        const plain = generateMarkdown('Content', 'test.md');
        const withTitle = generateMarkdown('Content', 'test.md', { title: 'My Title' });
        expect(withTitle.size).toBeGreaterThan(plain.size);
    });

    it('should produce larger output with author option', () => {
        const plain = generateMarkdown('Content', 'test.md');
        const withAuthor = generateMarkdown('Content', 'test.md', { author: 'MIMI' });
        expect(withAuthor.size).toBeGreaterThan(plain.size);
    });
});

// ───────────────────────────────────────────────────────────
// generateText
// ───────────────────────────────────────────────────────────
describe('generateText', () => {
    it('should generate plain text with correct MIME type', () => {
        const blob = generateText('Hello', 'test.txt');
        expect(blob.type).toBe('text/plain');
        expect(blob.size).toBeGreaterThan(0);
    });

    it('should have size matching content length', () => {
        const content = 'Test content with some words';
        const blob = generateText(content, 'test.txt');
        expect(blob.size).toBe(content.length);
    });
});
