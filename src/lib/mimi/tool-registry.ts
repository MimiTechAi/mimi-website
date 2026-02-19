/**
 * MIMI Agent -- Typed Tool Registry V1.0
 *
 * Replaces the string-based handler references in tool-definitions.ts
 * with a fully typed dispatch map. Each tool handler is registered with
 * its parameter and result types, enabling compile-time safety.
 *
 * Architecture:
 * - ToolHandler<P, R>: Generic typed handler interface
 * - ToolRegistry: Singleton registry with typed register/execute
 * - Built-in tools pre-registered on init
 * - External tool context injection for runtime-provided handlers
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import type { ToolCall, ToolResult, ToolDefinition } from './tool-definitions';
import { TOOL_DEFINITIONS, validateToolCall, executeWebSearch } from './tool-definitions';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export type ToolHandler = (
    parameters: Record<string, unknown>,
    context: ToolExecutionContext
) => Promise<ToolResult>;

export interface ToolExecutionContext {
    executePython?: (code: string) => Promise<string>;
    executeJavaScript?: (code: string) => Promise<string>;
    executeSql?: (query: string) => Promise<string>;
    searchDocuments?: (query: string, limit?: number) => Promise<any[]>;
    analyzeImage?: (question: string) => Promise<any>;
    createFile?: (type: string, content: string, filename?: string) => Promise<any>;
    readFile?: (path: string) => Promise<string>;
    writeFile?: (path: string, content: string) => Promise<void>;
    listFiles?: (path?: string) => Promise<string[]>;
}

interface RegisteredTool {
    definition: ToolDefinition;
    handler: ToolHandler;
}

// ═══════════════════════════════════════════════════════════
// BUILT-IN HANDLERS
// ═══════════════════════════════════════════════════════════

const handleWebSearch: ToolHandler = async (params) => {
    return executeWebSearch(
        params.query as string,
        (params.limit as number) || 5
    );
};

const handleCalculate: ToolHandler = async (params) => {
    const expression = params.expression as string;
    try {
        const sanitized = expression.replace(/[^0-9+\-*/().,%^ ]/g, '');
        if (sanitized.length === 0) {
            return { success: false, output: 'Invalid expression' };
        }
        const jsExpr = sanitized.replace(/\^/g, '**');
        // eslint-disable-next-line no-new-func
        const result = new Function(`"use strict"; return (${jsExpr})`)();
        if (typeof result !== 'number' || !isFinite(result)) {
            return { success: false, output: `Result is not computable: ${result}` };
        }
        return { success: true, output: `${expression} = ${result}`, data: result };
    } catch (e: unknown) {
        return { success: false, output: `Calculation error: ${e instanceof Error ? e.message : String(e)}` };
    }
};

const handleExecutePython: ToolHandler = async (params, ctx) => {
    if (!ctx.executePython) {
        return { success: false, output: 'Python runtime not available' };
    }
    try {
        const result = await ctx.executePython(params.code as string);
        return { success: true, output: result };
    } catch (e: unknown) {
        return { success: false, output: `Python error: ${e}` };
    }
};

const handleSearchDocuments: ToolHandler = async (params, ctx) => {
    if (!ctx.searchDocuments) {
        return { success: false, output: 'Document search not available' };
    }
    try {
        const results = await ctx.searchDocuments(
            params.query as string,
            (params.limit as number) || 3
        );
        return {
            success: true,
            output: results.length > 0
                ? results.map((r: any) =>
                    `${r.documentName || 'Document'} (p. ${r.chunk?.pageNumber || '?'}): ${r.chunk?.text?.slice(0, 300)}...`
                ).join('\n\n')
                : 'No results found.',
            data: results
        };
    } catch (e: unknown) {
        return { success: false, output: `Search failed: ${e}` };
    }
};

const handleAnalyzeImage: ToolHandler = async (params, ctx) => {
    if (!ctx.analyzeImage) {
        return { success: false, output: 'Vision engine not available' };
    }
    try {
        const result = await ctx.analyzeImage(params.question as string);
        return {
            success: true,
            output: typeof result === 'string' ? result : JSON.stringify(result),
            data: result
        };
    } catch (e: unknown) {
        return { success: false, output: `Image analysis failed: ${e}` };
    }
};

const handleCreateFile: ToolHandler = async (params, ctx) => {
    if (!ctx.createFile) {
        return { success: false, output: 'File creation not available' };
    }
    try {
        await ctx.createFile(
            params.type as string,
            params.content as string,
            params.filename as string | undefined
        );
        return {
            success: true,
            output: `File "${params.filename || 'download'}.${params.type}" created!`
        };
    } catch (e: unknown) {
        return { success: false, output: `File creation failed: ${e}` };
    }
};

const handleExecuteJavaScript: ToolHandler = async (params, ctx) => {
    if (!ctx.executeJavaScript) {
        return { success: false, output: 'JavaScript sandbox not available' };
    }
    try {
        const result = await ctx.executeJavaScript(params.code as string);
        return { success: true, output: result };
    } catch (e: unknown) {
        return { success: false, output: `JavaScript error: ${e instanceof Error ? e.message : String(e)}` };
    }
};

const handleExecuteSql: ToolHandler = async (params, ctx) => {
    if (!ctx.executeSql) {
        return { success: false, output: 'SQL engine not available' };
    }
    try {
        const result = await ctx.executeSql(params.query as string);
        return { success: true, output: result };
    } catch (e: unknown) {
        return { success: false, output: `SQL error: ${e instanceof Error ? e.message : String(e)}` };
    }
};

const handleReadFile: ToolHandler = async (params, ctx) => {
    if (!ctx.readFile) {
        return { success: false, output: 'File read not available' };
    }
    try {
        const content = await ctx.readFile(params.path as string);
        return { success: true, output: content };
    } catch (e: unknown) {
        return { success: false, output: `File read error: ${e instanceof Error ? e.message : String(e)}` };
    }
};

const handleWriteFile: ToolHandler = async (params, ctx) => {
    if (!ctx.writeFile) {
        return { success: false, output: 'File write not available' };
    }
    try {
        await ctx.writeFile(params.path as string, params.content as string);
        return { success: true, output: `File "${params.path}" written successfully.` };
    } catch (e: unknown) {
        return { success: false, output: `File write error: ${e instanceof Error ? e.message : String(e)}` };
    }
};

const handleListFiles: ToolHandler = async (params, ctx) => {
    if (!ctx.listFiles) {
        return { success: false, output: 'File listing not available' };
    }
    try {
        const files = await ctx.listFiles(params.path as string | undefined);
        return {
            success: true,
            output: files.length > 0
                ? `📁 Files:\n${files.map(f => `  - ${f}`).join('\n')}`
                : 'Directory is empty.'
        };
    } catch (e: unknown) {
        return { success: false, output: `File listing error: ${e instanceof Error ? e.message : String(e)}` };
    }
};

// ═══════════════════════════════════════════════════════════
// REGISTRY
// ═══════════════════════════════════════════════════════════

export class ToolRegistry {
    private tools = new Map<string, RegisteredTool>();
    private context: ToolExecutionContext = {};

    constructor() {
        this.registerBuiltins();
    }

    private registerBuiltins(): void {
        const handlerMap: Record<string, ToolHandler> = {
            'executePython': handleExecutePython,
            'searchDocuments': handleSearchDocuments,
            'analyzeImage': handleAnalyzeImage,
            'createFile': handleCreateFile,
            'webSearch': handleWebSearch,
            'calculate': handleCalculate,
            'executeJavaScript': handleExecuteJavaScript,
            'executeSql': handleExecuteSql,
            'readFile': handleReadFile,
            'writeFile': handleWriteFile,
            'listFiles': handleListFiles,
        };

        for (const def of TOOL_DEFINITIONS) {
            const handler = handlerMap[def.handler as keyof typeof handlerMap];
            if (handler !== undefined) {
                this.tools.set(def.name, { definition: def, handler });
            }
        }
    }

    /**
     * Register a custom tool handler at runtime.
     */
    register(name: string, definition: ToolDefinition, handler: ToolHandler): void {
        this.tools.set(name, { definition, handler });
    }

    /**
     * Inject runtime context (Python executor, document search, etc.)
     */
    setContext(ctx: ToolExecutionContext): void {
        this.context = { ...this.context, ...ctx };
    }

    /**
     * Execute a parsed tool call through the typed registry.
     */
    async execute(call: ToolCall): Promise<ToolResult> {
        const validation = validateToolCall(call);
        if (!validation.valid) {
            return { success: false, output: `Invalid tool call: ${validation.error}` };
        }

        const registered = this.tools.get(call.tool);
        if (!registered) {
            return { success: false, output: `Unknown tool: ${call.tool}` };
        }

        return registered.handler(call.parameters, this.context);
    }

    /**
     * Get all registered tool names.
     */
    getToolNames(): string[] {
        return Array.from(this.tools.keys());
    }

    /**
     * Check if a tool is registered.
     */
    has(name: string): boolean {
        return this.tools.has(name);
    }

    /**
     * Get a tool's definition.
     */
    getDefinition(name: string): ToolDefinition | undefined {
        return this.tools.get(name)?.definition;
    }
}

// ── Singleton ───────────────────────────────────────────────

let _registry: ToolRegistry | null = null;

export function getToolRegistry(): ToolRegistry {
    if (!_registry) {
        _registry = new ToolRegistry();
    }
    return _registry;
}
