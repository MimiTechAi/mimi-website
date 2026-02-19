"use client";

/**
 * MIMI Agent — WebMCP Bridge
 *
 * Bridges MIMI's internal tool system to the W3C WebMCP standard
 * (navigator.modelContext API). This enables external AI agents
 * (Chrome Gemini, Copilot, etc.) to discover and invoke MIMI's
 * tools via the browser-native WebMCP protocol.
 *
 * Architecture:
 * 1. Convert MIMI ToolParameter[] → JSON Schema inputSchema
 * 2. Register each tool via navigator.modelContext.registerTool()
 * 3. Route incoming WebMCP calls → executeToolCall()
 * 4. Progressive enhancement: native → polyfill → graceful skip
 *
 * W3C Draft: https://nicov.github.io/nicov-webmcp/ (Feb 12, 2026)
 * Chrome 146+: chrome://flags → "Experimental Web Platform Features"
 * Polyfill: @mcp-b/global (npm)
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import {
    TOOL_DEFINITIONS,
    executeToolCall,
    type ToolParameter,
    type ToolDefinition,
    type ToolExecutionContext,
    type ToolResult,
} from "./tool-definitions";

// ═══════════════════════════════════════════════════════════
// WebMCP TYPE DECLARATIONS
// ═══════════════════════════════════════════════════════════

/**
 * JSON Schema for WebMCP inputSchema — subset used by registerTool.
 * Follows JSON Schema Draft 2020-12 as specified in the W3C WebMCP draft.
 */
interface JSONSchemaProperty {
    type: string;
    description?: string;
    enum?: string[];
}

interface JSONSchemaObject {
    type: "object";
    properties: Record<string, JSONSchemaProperty>;
    required: string[];
}

/**
 * WebMCP tool descriptor — the shape expected by registerTool().
 */
interface WebMCPToolDescriptor {
    name: string;
    description: string;
    inputSchema: JSONSchemaObject;
    handler: (params: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Augment the Navigator interface with the modelContext API.
 * This is a partial declaration matching the W3C draft.
 */
declare global {
    interface Navigator {
        modelContext?: {
            registerTool: (tool: WebMCPToolDescriptor) => void;
            registerTools: (tools: WebMCPToolDescriptor[]) => void;
            unregisterTool: (name: string) => void;
            tools?: WebMCPToolDescriptor[];
        };
    }
}

// ═══════════════════════════════════════════════════════════
// CONVERSION: MIMI ToolParameter[] → JSON Schema
// ═══════════════════════════════════════════════════════════

/**
 * Maps MIMI's internal type strings to JSON Schema type strings.
 */
const TYPE_MAP: Record<string, string> = {
    string: "string",
    number: "number",
    boolean: "boolean",
    array: "array",
    object: "object",
};

/**
 * Convert a MIMI ToolDefinition's parameters to JSON Schema inputSchema.
 *
 * Example:
 *   MIMI: [{ name: 'query', type: 'string', required: true, description: '...' }]
 *   →
 *   JSON Schema: { type: 'object', properties: { query: { type: 'string', description: '...' } }, required: ['query'] }
 */
export function toJSONSchema(params: ToolParameter[]): JSONSchemaObject {
    const properties: Record<string, JSONSchemaProperty> = {};
    const required: string[] = [];

    for (const param of params) {
        const prop: JSONSchemaProperty = {
            type: TYPE_MAP[param.type] || "string",
            description: param.description,
        };

        if (param.enum) {
            prop.enum = param.enum;
        }

        properties[param.name] = prop;

        if (param.required) {
            required.push(param.name);
        }
    }

    return { type: "object", properties, required };
}

// ═══════════════════════════════════════════════════════════
// WEBMCP BRIDGE CLASS
// ═══════════════════════════════════════════════════════════

/**
 * Bridge between MIMI's tool system and the W3C WebMCP API.
 * Implements progressive enhancement:
 *   1. Native navigator.modelContext (Chrome 146+ with flag)
 *   2. @mcp-b/global polyfill (npm package)
 *   3. Graceful skip (no-op if neither available)
 */
export class WebMCPBridge {
    private registered = false;
    private registeredTools: string[] = [];
    private toolContext: ToolExecutionContext | null = null;

    /**
     * Check if WebMCP is available (native or polyfill).
     */
    isAvailable(): boolean {
        return (
            typeof navigator !== "undefined" &&
            navigator.modelContext != null &&
            typeof navigator.modelContext.registerTool === "function"
        );
    }

    /**
     * Set the tool execution context (for tools that need external dependencies).
     * Must be called before registerAll() so handlers can access the context.
     */
    setContext(ctx: ToolExecutionContext): void {
        this.toolContext = ctx;
    }

    /**
     * Register all MIMI tools as WebMCP tools.
     * Safe to call multiple times — skips if already registered.
     */
    registerAll(): { registered: number; skipped: boolean; tools: string[] } {
        if (this.registered) {
            return {
                registered: this.registeredTools.length,
                skipped: true,
                tools: this.registeredTools,
            };
        }

        if (!this.isAvailable()) {
            console.log(
                "[WebMCP] ℹ️ navigator.modelContext not available. " +
                "Enable via chrome://flags → 'Experimental Web Platform Features' " +
                "or install @mcp-b/global polyfill."
            );
            return { registered: 0, skipped: true, tools: [] };
        }

        const registered: string[] = [];

        for (const def of TOOL_DEFINITIONS) {
            try {
                const descriptor = this.createDescriptor(def);
                navigator.modelContext!.registerTool(descriptor);
                registered.push(def.name);
            } catch (err) {
                // Tool might already be registered or name conflict
                console.warn(
                    `[WebMCP] ⚠️ Failed to register tool '${def.name}':`,
                    err
                );
            }
        }

        this.registeredTools = registered;
        this.registered = true;

        console.log(
            `[WebMCP] ✅ Registered ${registered.length}/${TOOL_DEFINITIONS.length} tools: ` +
            registered.join(", ")
        );

        return { registered: registered.length, skipped: false, tools: registered };
    }

    /**
     * Unregister all previously registered tools.
     */
    unregisterAll(): void {
        if (!this.isAvailable() || !this.registered) return;

        for (const name of this.registeredTools) {
            try {
                navigator.modelContext!.unregisterTool(name);
            } catch {
                // Already unregistered or not found
            }
        }

        this.registeredTools = [];
        this.registered = false;
        console.log("[WebMCP] 🔄 All tools unregistered.");
    }

    /**
     * Get a summary of registered tools for debugging.
     */
    getStatus(): {
        available: boolean;
        registered: boolean;
        toolCount: number;
        tools: string[];
    } {
        return {
            available: this.isAvailable(),
            registered: this.registered,
            toolCount: this.registeredTools.length,
            tools: [...this.registeredTools],
        };
    }

    // ─── INTERNAL ─────────────────────────────────

    /**
     * Create a WebMCP tool descriptor from a MIMI ToolDefinition.
     * Wires the handler to route through MIMI's executeToolCall().
     */
    private createDescriptor(def: ToolDefinition): WebMCPToolDescriptor {
        return {
            name: def.name,
            description: def.description,
            inputSchema: toJSONSchema(def.parameters),
            handler: async (params: Record<string, unknown>): Promise<unknown> => {
                console.log(
                    `[WebMCP] 🔧 Tool invoked by external agent: ${def.name}`,
                    params
                );

                const result: ToolResult = await executeToolCall(
                    { tool: def.name, parameters: params as Record<string, any> },
                    this.toolContext ?? undefined
                );

                // WebMCP expects the handler's return value to be sent back
                // to the calling agent. Return structured result.
                return {
                    success: result.success,
                    output: result.output,
                    ...(result.data !== undefined ? { data: result.data } : {}),
                };
            },
        };
    }
}

// ═══════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════

let _bridge: WebMCPBridge | null = null;

/**
 * Get the singleton WebMCP bridge instance.
 */
export function getWebMCPBridge(): WebMCPBridge {
    if (!_bridge) {
        _bridge = new WebMCPBridge();
    }
    return _bridge;
}

/**
 * Convenience: Initialize and register all tools in one call.
 * Meant to be called once during app initialization (e.g., in MimiAgentContext).
 *
 * @param context - Optional tool execution context for tools that need external deps
 * @returns Registration summary
 */
export function initWebMCP(
    context?: ToolExecutionContext
): { registered: number; skipped: boolean; tools: string[] } {
    const bridge = getWebMCPBridge();
    if (context) {
        bridge.setContext(context);
    }
    return bridge.registerAll();
}
