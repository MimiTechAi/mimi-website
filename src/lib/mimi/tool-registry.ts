/**
 * MIMI Agent -- Typed Tool Registry V2.0
 *
 * Unified tool dispatch with AgentComputer integration.
 * All code execution, file operations, and shell commands
 * route through the AgentComputer engine for unified
 * terminal history, process tracking, and event streaming.
 *
 * V2 Changes:
 * - AgentComputer as unified execution backend
 * - New tools: browse_url, execute_shell, update_plan, delete_file, move_file
 * - HTML-to-text extraction for browse_url
 * - Manus-style todo.md scratchpad via update_plan
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import type { ToolCall, ToolResult, ToolDefinition } from './tool-definitions';
import { TOOL_DEFINITIONS, validateToolCall, executeWebSearch } from './tool-definitions';
import { getAgentComputer } from './agent-computer';
import { getMimiNetwork } from './workspace/networking';
import { getMimiFilesystem } from './workspace/filesystem';

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
    deleteFile?: (path: string) => Promise<void>;
    moveFile?: (source: string, destination: string) => Promise<void>;
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

// ── Code Execution (routed through AgentComputer) ────────

const handleExecutePython: ToolHandler = async (params, ctx) => {
    // Try AgentComputer first (unified engine with terminal + process tracking)
    try {
        const computer = getAgentComputer();
        if (computer.isReady) {
            const result = await computer.executePython(params.code as string);
            return {
                success: result.success,
                output: result.output || result.error || 'No output',
                data: result
            };
        }
    } catch { /* fall through to context */ }

    // Fallback to injected context
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

const handleExecuteJavaScript: ToolHandler = async (params, ctx) => {
    // Try AgentComputer first
    try {
        const computer = getAgentComputer();
        if (computer.isReady) {
            const result = await computer.executeJavaScript(params.code as string);
            return {
                success: result.success,
                output: result.output || result.error || 'No output',
                data: result
            };
        }
    } catch { /* fall through */ }

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

// ── Shell Execution (AgentComputer only) ─────────────────

const handleExecuteShell: ToolHandler = async (params) => {
    try {
        const computer = getAgentComputer();
        if (!computer.isReady) {
            // Auto-boot if not ready
            await computer.boot();
        }
        const result = await computer.executeShell(params.command as string);
        return {
            success: result.exitCode === 0,
            output: result.output || '(no output)',
            data: { exitCode: result.exitCode }
        };
    } catch (e: unknown) {
        return { success: false, output: `Shell error: ${e instanceof Error ? e.message : String(e)}` };
    }
};

// ── Browse URL (fetch + HTML-to-text) ────────────────────

const handleBrowseUrl: ToolHandler = async (params) => {
    const url = params.url as string;
    const extract = (params.extract as string) || 'text';

    try {
        const net = getMimiNetwork();
        const result = await net.fetch(url, { cache: true });

        if (!result.ok) {
            return { success: false, output: `Failed to fetch ${url}: HTTP ${result.status} ${result.statusText}` };
        }

        const rawHtml = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);

        // Extract content based on mode
        let output = '';

        if (extract === 'links' || extract === 'all') {
            const links = extractLinks(rawHtml, url);
            output += `## Links found on ${url}\n\n`;
            for (const link of links.slice(0, 30)) {
                output += `- [${link.text}](${link.href})\n`;
            }
        }

        if (extract === 'text' || extract === 'all') {
            const text = htmlToText(rawHtml);
            if (extract === 'all') output += '\n---\n\n## Page Content\n\n';
            // Truncate to ~4000 chars to fit in context window
            output += text.slice(0, 4000);
            if (text.length > 4000) {
                output += `\n\n... (${text.length - 4000} more characters truncated)`;
            }
        }

        return {
            success: true,
            output: output || 'Page loaded but no extractable content found.',
            data: { url, status: result.status, contentLength: rawHtml.length, responseTime: result.responseTime }
        };
    } catch (e: unknown) {
        return { success: false, output: `Browse error: ${e instanceof Error ? e.message : String(e)}` };
    }
};

// ── Update Plan (3-file scratchpad: todo, notes, context) ────

const SCRATCHPAD_PATHS: Record<string, string> = {
    todo: '/workspace/todo.md',
    notes: '/workspace/notes.md',
    context: '/workspace/context.md',
};

const handleUpdatePlan: ToolHandler = async (params) => {
    const target = (params.target as string) || 'todo';
    const operation = (params.operation as string) || 'replace';
    const filePath = SCRATCHPAD_PATHS[target] || SCRATCHPAD_PATHS.todo;

    try {
        const fs = getMimiFilesystem();

        // ── Target: todo (structured task list) ──
        if (target === 'todo') {
            const tasks = params.tasks as Array<{ label: string; status?: string; done?: boolean }> | undefined;
            const title = (params.title as string) || 'MIMI Task Plan';

            if (tasks && tasks.length > 0) {
                let md = `# ${title}\n\n`;
                md += `> Updated: ${new Date().toLocaleString('de-DE')}\n\n`;

                for (const task of tasks) {
                    const status = task.status || (task.done ? 'done' : 'pending');
                    const icon = status === 'done' ? '✅' : status === 'in_progress' ? '🔄' : '⬜';
                    const checkbox = status === 'done' ? '[x]' : status === 'in_progress' ? '[/]' : '[ ]';
                    md += `- ${checkbox} ${icon} ${task.label}\n`;
                }

                if (operation === 'append') {
                    try {
                        const existing = await fs.readFile(filePath);
                        await fs.writeFile(filePath, existing + '\n' + md);
                    } catch { await fs.writeFile(filePath, md); }
                } else {
                    await fs.writeFile(filePath, md);
                }

                const done = tasks.filter(t => t.status === 'done' || t.done).length;
                const total = tasks.length;
                return {
                    success: true,
                    output: `📋 Plan updated (${target}): ${done}/${total} tasks complete.\n\n${md}`,
                    data: { path: filePath, done, total }
                };
            } else {
                // Fallback: raw content for todo
                const content = (params.content as string) || '';
                if (operation === 'append') {
                    try {
                        const existing = await fs.readFile(filePath);
                        await fs.writeFile(filePath, existing + '\n' + content);
                    } catch { await fs.writeFile(filePath, content); }
                } else {
                    await fs.writeFile(filePath, content);
                }
                return { success: true, output: `📋 ${target}.md updated.`, data: { path: filePath } };
            }
        }

        // ── Target: notes or context (raw markdown) ──
        const content = (params.content as string) || '';
        if (!content) {
            return { success: false, output: `No content provided for ${target}.md` };
        }

        const timestamp = `\n\n> [${new Date().toLocaleTimeString('de-DE')}] `;

        if (operation === 'append') {
            try {
                const existing = await fs.readFile(filePath);
                await fs.writeFile(filePath, existing + timestamp + content);
            } catch {
                // File doesn't exist → create with header
                const header = target === 'notes' ? '# Agent Notes\n' : '# Agent Context\n';
                await fs.writeFile(filePath, header + timestamp + content);
            }
        } else {
            const header = target === 'notes' ? '# Agent Notes\n\n' : '# Agent Context\n\n';
            await fs.writeFile(filePath, header + content);
        }

        const emoji = target === 'notes' ? '📝' : '🧠';
        return {
            success: true,
            output: `${emoji} ${target}.md ${operation === 'append' ? 'updated' : 'replaced'}.`,
            data: { path: filePath }
        };
    } catch (e: unknown) {
        return { success: false, output: `Scratchpad update failed: ${e instanceof Error ? e.message : String(e)}` };
    }
};

// ── Document & Image Handlers ────────────────────────────

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

// ── File Operations (AgentComputer-backed) ───────────────

const handleReadFile: ToolHandler = async (params, ctx) => {
    // Try AgentComputer filesystem first
    try {
        const computer = getAgentComputer();
        if (computer.isReady) {
            const content = await computer.readFile(params.path as string);
            return { success: true, output: content };
        }
    } catch { /* fall through */ }

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
    // Try AgentComputer filesystem first
    try {
        const computer = getAgentComputer();
        if (computer.isReady) {
            await computer.writeFile(params.path as string, params.content as string);
            return { success: true, output: `File "${params.path}" written successfully.` };
        }
    } catch { /* fall through */ }

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
    // Try AgentComputer filesystem first
    try {
        const computer = getAgentComputer();
        if (computer.isReady) {
            const entries = await computer.listFiles(params.path as string | undefined);
            const fileNames = entries.map(e =>
                `${e.isDirectory ? '📁' : '📄'} ${e.name}${e.size ? ` (${e.size}B)` : ''}`
            );
            return {
                success: true,
                output: fileNames.length > 0
                    ? `📁 Files:\n${fileNames.map(f => `  - ${f}`).join('\n')}`
                    : 'Directory is empty.'
            };
        }
    } catch { /* fall through */ }

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

const handleDeleteFile: ToolHandler = async (params, ctx) => {
    const path = params.path as string;
    // Try AgentComputer first
    try {
        const computer = getAgentComputer();
        if (computer.isReady) {
            const fs = getMimiFilesystem();
            await fs.deleteFile(path);
            return { success: true, output: `🗑️ Deleted: ${path}` };
        }
    } catch { /* fall through */ }

    if (ctx.deleteFile) {
        try {
            await ctx.deleteFile(path);
            return { success: true, output: `🗑️ Deleted: ${path}` };
        } catch (e: unknown) {
            return { success: false, output: `Delete error: ${e instanceof Error ? e.message : String(e)}` };
        }
    }
    // Direct filesystem fallback
    try {
        const fs = getMimiFilesystem();
        await fs.deleteFile(path);
        return { success: true, output: `🗑️ Deleted: ${path}` };
    } catch (e: unknown) {
        return { success: false, output: `Delete error: ${e instanceof Error ? e.message : String(e)}` };
    }
};

const handleMoveFile: ToolHandler = async (params, ctx) => {
    const source = params.source as string;
    const destination = params.destination as string;

    // Try context first
    if (ctx.moveFile) {
        try {
            await ctx.moveFile(source, destination);
            return { success: true, output: `📦 Moved: ${source} → ${destination}` };
        } catch (e: unknown) {
            return { success: false, output: `Move error: ${e instanceof Error ? e.message : String(e)}` };
        }
    }

    // Direct filesystem (rename)
    try {
        const fs = getMimiFilesystem();
        await fs.rename(source, destination);
        return { success: true, output: `📦 Moved: ${source} → ${destination}` };
    } catch (e: unknown) {
        return { success: false, output: `Move error: ${e instanceof Error ? e.message : String(e)}` };
    }
};

// ═══════════════════════════════════════════════════════════
// HTML-TO-TEXT UTILITIES (for browse_url)
// ═══════════════════════════════════════════════════════════

function htmlToText(html: string): string {
    let text = html;

    // Remove script and style blocks entirely
    text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');

    // Convert headings to markdown
    text = text.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, content) => {
        return '\n' + '#'.repeat(Number(level)) + ' ' + stripTags(content).trim() + '\n';
    });

    // Convert paragraphs & divs to double newlines
    text = text.replace(/<\/(p|div|article|section|main|header|footer)>/gi, '\n\n');
    text = text.replace(/<br\s*\/?>/gi, '\n');

    // Convert links to markdown
    text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, content) => {
        const linkText = stripTags(content).trim();
        return linkText ? `[${linkText}](${href})` : '';
    });

    // Convert lists
    text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, content) => {
        return '• ' + stripTags(content).trim() + '\n';
    });

    // Remove all remaining tags
    text = stripTags(text);

    // Decode HTML entities
    text = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');

    // Collapse whitespace
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.trim();

    return text;
}

function stripTags(html: string): string {
    return html.replace(/<[^>]*>/g, '');
}

interface ExtractedLink {
    text: string;
    href: string;
}

function extractLinks(html: string, baseUrl: string): ExtractedLink[] {
    const links: ExtractedLink[] = [];
    const seen = new Set<string>();
    const pattern = /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;

    while ((match = pattern.exec(html)) !== null) {
        let href = match[1];
        const text = stripTags(match[2]).trim();

        // Skip anchors, javascript, mailto
        if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) {
            continue;
        }

        // Resolve relative URLs
        try {
            href = new URL(href, baseUrl).href;
        } catch {
            continue;
        }

        if (!seen.has(href) && text.length > 0) {
            seen.add(href);
            links.push({ text: text.slice(0, 100), href });
        }
    }

    return links;
}

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
            // V4 — Manus AI Parity
            'browseUrl': handleBrowseUrl,
            'executeShell': handleExecuteShell,
            'updatePlan': handleUpdatePlan,
            'deleteFile': handleDeleteFile,
            'moveFile': handleMoveFile,
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
