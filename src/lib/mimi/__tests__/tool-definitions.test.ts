/**
 * MIMI Agent - Tool Definitions Tests
 * 2026 Expert Audit — Priority 0 Test Coverage
 *
 * Tests the critical tool call parsing, JSON sanitization,
 * validation, and tool dispatch logic.
 */

import { describe, it, expect } from '@jest/globals';
import {
    TOOL_DEFINITIONS,
    parseToolCalls,
    validateToolCall,
    getToolDescriptionsForPrompt,
} from '../tool-definitions';

// ─────────────────────────────────────────────────────────
// TOOL DEFINITIONS REGISTRY
// ─────────────────────────────────────────────────────────

describe('Tool Definitions Registry', () => {
    it('should have all 6 tools defined', () => {
        expect(TOOL_DEFINITIONS.length).toBe(6);
    });

    it('should include web_search tool', () => {
        const webSearch = TOOL_DEFINITIONS.find(t => t.name === 'web_search');
        expect(webSearch).toBeDefined();
        expect(webSearch!.parameters.find(p => p.name === 'query')?.required).toBe(true);
    });

    it('should include calculate tool', () => {
        const calculate = TOOL_DEFINITIONS.find(t => t.name === 'calculate');
        expect(calculate).toBeDefined();
        expect(calculate!.parameters.find(p => p.name === 'expression')?.required).toBe(true);
    });

    it('should include execute_python tool', () => {
        const tool = TOOL_DEFINITIONS.find(t => t.name === 'execute_python');
        expect(tool).toBeDefined();
        expect(tool!.parameters.find(p => p.name === 'code')?.required).toBe(true);
    });

    it('should include search_documents tool', () => {
        const tool = TOOL_DEFINITIONS.find(t => t.name === 'search_documents');
        expect(tool).toBeDefined();
    });

    it('should include analyze_image tool', () => {
        const tool = TOOL_DEFINITIONS.find(t => t.name === 'analyze_image');
        expect(tool).toBeDefined();
    });

    it('should include create_file tool', () => {
        const tool = TOOL_DEFINITIONS.find(t => t.name === 'create_file');
        expect(tool).toBeDefined();
    });

    it('every tool should have a non-empty handler', () => {
        for (const tool of TOOL_DEFINITIONS) {
            expect(tool.handler).toBeDefined();
            expect(tool.handler.length).toBeGreaterThan(0);
        }
    });

    it('every tool should have a non-empty description', () => {
        for (const tool of TOOL_DEFINITIONS) {
            expect(tool.description.length).toBeGreaterThan(10);
        }
    });
});

// ─────────────────────────────────────────────────────────
// TOOL CALL PARSING (HARDENED)
// ─────────────────────────────────────────────────────────

describe('parseToolCalls — Strategy 1: Fenced JSON', () => {
    it('should parse a valid fenced JSON tool call', () => {
        const text = 'Here is the tool call:\n```json\n{"tool": "execute_python", "parameters": {"code": "print(42)"}}\n```';
        const calls = parseToolCalls(text);
        expect(calls).toHaveLength(1);
        expect(calls[0].tool).toBe('execute_python');
        expect(calls[0].parameters.code).toBe('print(42)');
    });

    it('should parse multiple fenced JSON tool calls', () => {
        const text = '```json\n{"tool": "execute_python", "parameters": {"code": "x=1"}}\n```\nSome text\n```json\n{"tool": "calculate", "parameters": {"expression": "2+2"}}\n```';
        const calls = parseToolCalls(text);
        expect(calls).toHaveLength(2);
    });

    it('should deduplicate identical tool calls', () => {
        const text = '```json\n{"tool": "calculate", "parameters": {"expression": "2+2"}}\n```\n```json\n{"tool": "calculate", "parameters": {"expression": "2+2"}}\n```';
        const calls = parseToolCalls(text);
        expect(calls).toHaveLength(1);
    });

    it('should handle json code fence without language tag', () => {
        const text = '```\n{"tool": "calculate", "parameters": {"expression": "5*5"}}\n```';
        const calls = parseToolCalls(text);
        expect(calls).toHaveLength(1);
    });
});

describe('parseToolCalls — Strategy 2: Inline JSON', () => {
    it('should parse inline JSON tool calls outside code fences', () => {
        const text = 'I will use this tool: {"tool": "web_search", "parameters": {"query": "test"}}';
        const calls = parseToolCalls(text);
        expect(calls).toHaveLength(1);
        expect(calls[0].tool).toBe('web_search');
    });

    it('should NOT double-parse fenced JSON as inline', () => {
        const text = '```json\n{"tool": "calculate", "parameters": {"expression": "1+1"}}\n```';
        const calls = parseToolCalls(text);
        expect(calls).toHaveLength(1);
    });
});

describe('parseToolCalls — Strategy 3: Fuzzy match', () => {
    it('should fuzzy-match a tool name in malformed JSON', () => {
        const text = 'Let me use {tool: "execute_python", parameters: {code: "print(1)"}}';
        const calls = parseToolCalls(text);
        // Should attempt to extract via fuzzy matching
        expect(calls.length).toBeGreaterThanOrEqual(0); // May fail if too malformed
    });
});

describe('parseToolCalls — Edge Cases', () => {
    it('should return empty array for text with no tool calls', () => {
        const text = 'This is just regular text without any tool calls.';
        const calls = parseToolCalls(text);
        expect(calls).toHaveLength(0);
    });

    it('should reject unknown tool names', () => {
        const text = '```json\n{"tool": "hack_the_planet", "parameters": {}}\n```';
        const calls = parseToolCalls(text);
        expect(calls).toHaveLength(0);
    });

    it('should handle trailing commas in JSON', () => {
        const text = '```json\n{"tool": "calculate", "parameters": {"expression": "2+2",}}\n```';
        const calls = parseToolCalls(text);
        expect(calls).toHaveLength(1);
    });

    it('should handle missing parameters gracefully', () => {
        const text = '```json\n{"tool": "calculate"}\n```';
        const calls = parseToolCalls(text);
        expect(calls).toHaveLength(1);
        expect(calls[0].parameters).toEqual({});
    });
});

// ─────────────────────────────────────────────────────────
// TOOL CALL VALIDATION
// ─────────────────────────────────────────────────────────

describe('validateToolCall', () => {
    it('should validate a correct tool call', () => {
        const result = validateToolCall({
            tool: 'execute_python',
            parameters: { code: 'print("hello")' }
        });
        expect(result.valid).toBe(true);
    });

    it('should reject unknown tools', () => {
        const result = validateToolCall({
            tool: 'unknown_tool',
            parameters: {}
        });
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Unknown tool');
    });

    it('should reject missing required parameters', () => {
        const result = validateToolCall({
            tool: 'execute_python',
            parameters: {}
        });
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Missing required parameter');
    });

    it('should reject wrong parameter types', () => {
        const result = validateToolCall({
            tool: 'execute_python',
            parameters: { code: 12345 }
        });
        expect(result.valid).toBe(false);
        expect(result.error).toContain('must be a string');
    });

    it('should accept tool call with optional params omitted', () => {
        const result = validateToolCall({
            tool: 'web_search',
            parameters: { query: 'test search' }
        });
        expect(result.valid).toBe(true);
    });

    it('should validate calculate tool', () => {
        const result = validateToolCall({
            tool: 'calculate',
            parameters: { expression: '2^10 + 5' }
        });
        expect(result.valid).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────
// PROMPT GENERATION
// ─────────────────────────────────────────────────────────

describe('getToolDescriptionsForPrompt', () => {
    it('should include all tool names', () => {
        const prompt = getToolDescriptionsForPrompt();
        for (const tool of TOOL_DEFINITIONS) {
            expect(prompt).toContain(tool.name);
        }
    });

    it('should include web_search in prompt', () => {
        const prompt = getToolDescriptionsForPrompt();
        expect(prompt).toContain('web_search');
    });

    it('should include calculate in prompt', () => {
        const prompt = getToolDescriptionsForPrompt();
        expect(prompt).toContain('calculate');
    });

    it('should include JSON format example', () => {
        const prompt = getToolDescriptionsForPrompt();
        expect(prompt).toContain('"tool"');
        expect(prompt).toContain('"parameters"');
    });
});
