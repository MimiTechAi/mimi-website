/**
 * MIMI Agent - Tool Registry Tests
 * 2026 Audit — Fix 3 Verification
 *
 * Tests that registry handlers delegate to context correctly
 * and return "not available" when no context is set.
 */

import { describe, it, expect } from '@jest/globals';
import { ToolRegistry } from '../tool-registry';

// ─────────────────────────────────────────────────────────
// REGISTRY INITIALIZATION
// ─────────────────────────────────────────────────────────

describe('ToolRegistry', () => {
    it('should register all 11 built-in tools', () => {
        const registry = new ToolRegistry();
        expect(registry.getToolNames().length).toBe(11);
    });

    it('should include all tool names', () => {
        const registry = new ToolRegistry();
        const expected = [
            'execute_python', 'web_search', 'calculate',
            'search_documents', 'analyze_image', 'create_file',
            'execute_javascript', 'execute_sql',
            'read_file', 'write_file', 'list_files',
        ];
        for (const name of expected) {
            expect(registry.has(name)).toBe(true);
        }
    });

    it('should return false for unknown tools', () => {
        const registry = new ToolRegistry();
        expect(registry.has('nonexistent_tool')).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────
// STUB HANDLERS (No Context)
// ─────────────────────────────────────────────────────────

describe('ToolRegistry — Stubs without context', () => {
    it('execute_javascript returns not available without context', async () => {
        const registry = new ToolRegistry();
        const result = await registry.execute({ tool: 'execute_javascript', parameters: { code: 'console.log(1)' } });
        expect(result.success).toBe(false);
        expect(result.output).toContain('not available');
    });

    it('execute_sql returns not available without context', async () => {
        const registry = new ToolRegistry();
        const result = await registry.execute({ tool: 'execute_sql', parameters: { query: 'SELECT 1' } });
        expect(result.success).toBe(false);
        expect(result.output).toContain('not available');
    });

    it('read_file returns not available without context', async () => {
        const registry = new ToolRegistry();
        const result = await registry.execute({ tool: 'read_file', parameters: { path: '/test.txt' } });
        expect(result.success).toBe(false);
        expect(result.output).toContain('not available');
    });

    it('write_file returns not available without context', async () => {
        const registry = new ToolRegistry();
        const result = await registry.execute({ tool: 'write_file', parameters: { path: '/test.txt', content: 'hello' } });
        expect(result.success).toBe(false);
        expect(result.output).toContain('not available');
    });

    it('list_files returns not available without context', async () => {
        const registry = new ToolRegistry();
        const result = await registry.execute({ tool: 'list_files', parameters: {} });
        expect(result.success).toBe(false);
        expect(result.output).toContain('not available');
    });
});

// ─────────────────────────────────────────────────────────
// CONTEXT-WIRED HANDLERS
// ─────────────────────────────────────────────────────────

describe('ToolRegistry — Context-wired handlers', () => {
    it('execute_javascript delegates to context', async () => {
        const registry = new ToolRegistry();
        registry.setContext({
            executeJavaScript: async (code: string) => `Executed: ${code}`,
        });
        const result = await registry.execute({ tool: 'execute_javascript', parameters: { code: '1+1' } });
        expect(result.success).toBe(true);
        expect(result.output).toBe('Executed: 1+1');
    });

    it('execute_sql delegates to context', async () => {
        const registry = new ToolRegistry();
        registry.setContext({
            executeSql: async (query: string) => `Result of: ${query}`,
        });
        const result = await registry.execute({ tool: 'execute_sql', parameters: { query: 'SELECT 1' } });
        expect(result.success).toBe(true);
        expect(result.output).toBe('Result of: SELECT 1');
    });

    it('read_file delegates to context', async () => {
        const registry = new ToolRegistry();
        registry.setContext({
            readFile: async (path: string) => `Content of ${path}`,
        });
        const result = await registry.execute({ tool: 'read_file', parameters: { path: '/hello.txt' } });
        expect(result.success).toBe(true);
        expect(result.output).toBe('Content of /hello.txt');
    });

    it('write_file delegates to context', async () => {
        const registry = new ToolRegistry();
        registry.setContext({
            writeFile: async () => { },
        });
        const result = await registry.execute({ tool: 'write_file', parameters: { path: '/out.txt', content: 'data' } });
        expect(result.success).toBe(true);
        expect(result.output).toContain('/out.txt');
    });

    it('list_files delegates to context', async () => {
        const registry = new ToolRegistry();
        registry.setContext({
            listFiles: async () => ['file1.txt', 'file2.txt'],
        });
        const result = await registry.execute({ tool: 'list_files', parameters: {} });
        expect(result.success).toBe(true);
        expect(result.output).toContain('file1.txt');
        expect(result.output).toContain('file2.txt');
    });

    it('context handler errors are caught gracefully', async () => {
        const registry = new ToolRegistry();
        registry.setContext({
            executeJavaScript: async () => { throw new Error('boom'); },
        });
        const result = await registry.execute({ tool: 'execute_javascript', parameters: { code: 'x' } });
        expect(result.success).toBe(false);
        expect(result.output).toContain('boom');
    });
});

// ─────────────────────────────────────────────────────────
// BUILT-IN HANDLERS (No context needed)
// ─────────────────────────────────────────────────────────

describe('ToolRegistry — Built-in handlers', () => {
    it('calculate works without context', async () => {
        const registry = new ToolRegistry();
        const result = await registry.execute({ tool: 'calculate', parameters: { expression: '2 + 3' } });
        expect(result.success).toBe(true);
        expect(result.output).toContain('5');
    });

    it('calculate rejects invalid expressions', async () => {
        const registry = new ToolRegistry();
        const result = await registry.execute({ tool: 'calculate', parameters: { expression: 'abc' } });
        expect(result.success).toBe(false);
    });

    it('rejects unknown tool names', async () => {
        const registry = new ToolRegistry();
        const result = await registry.execute({ tool: 'hack_planet', parameters: {} });
        expect(result.success).toBe(false);
        expect(result.output).toContain('Unknown tool');
    });

    it('rejects missing required parameters', async () => {
        const registry = new ToolRegistry();
        const result = await registry.execute({ tool: 'execute_python', parameters: {} });
        expect(result.success).toBe(false);
        expect(result.output).toContain('Invalid tool call');
    });
});
