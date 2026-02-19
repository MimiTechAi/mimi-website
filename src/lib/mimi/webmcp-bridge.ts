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
 * Polyfill: @mcp-b/global v1.5.0 (npm) — auto-injected below
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

// ═══════════════════════════════════════════════════════════
// POLYFILL: Inject navigator.modelContext for ALL browsers
// Uses @mcp-b/global — auto-detects native Chromium API if available.
// Must run BEFORE any navigator.modelContext access.
// ═══════════════════════════════════════════════════════════
import { initializeWebModelContext, cleanupWebModelContext } from "@mcp-b/global";

// Initialize polyfill on module load (client-side only)
if (typeof window !== "undefined") {
    try {
        initializeWebModelContext();
    } catch {
        // Already initialized (HMR) or SSR — safe to ignore
    }
}

import {
    TOOL_DEFINITIONS,
    executeToolCall,
    type ToolParameter,
    type ToolDefinition,
    type ToolExecutionContext,
    type ToolResult,
} from "./tool-definitions";

// ═══════════════════════════════════════════════════════════
// JSON Schema CONVERSION
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
 * Convert MIMI ToolParameter[] to a JSON Schema object for WebMCP inputSchema.
 */
export function toJSONSchema(params: ToolParameter[]): Record<string, unknown> {
    const properties: Record<string, Record<string, unknown>> = {};
    const required: string[] = [];

    for (const param of params) {
        const prop: Record<string, unknown> = {
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
 * Uses @mcp-b/global polyfill for cross-browser compatibility.
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
                "[WebMCP] ℹ️ navigator.modelContext not available after polyfill init. " +
                "This may happen during SSR or in unsupported environments."
            );
            return { registered: 0, skipped: true, tools: [] };
        }

        const registered: string[] = [];

        for (const def of TOOL_DEFINITIONS) {
            try {
                // Build WebMCP-compatible descriptor using the polyfill's expected shape
                const descriptor = {
                    name: def.name,
                    description: def.description,
                    inputSchema: toJSONSchema(def.parameters),
                    // The polyfill accepts both 'handler' and 'execute' — use 'execute'
                    execute: async (params: Record<string, unknown>) => {
                        console.log(
                            `[WebMCP] 🔧 External agent invoked: ${def.name}`,
                            params
                        );

                        const result: ToolResult = await executeToolCall(
                            { tool: def.name, parameters: params as Record<string, any> },
                            this.toolContext ?? undefined
                        );

                        return {
                            content: [
                                {
                                    type: "text" as const,
                                    text: result.output,
                                },
                            ],
                        };
                    },
                };

                // Use type assertion since the polyfill's ToolDescriptor generic types
                // are complex — our descriptor is structurally compatible
                navigator.modelContext!.registerTool(descriptor as any);
                registered.push(def.name);
            } catch (err) {
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
     * Full cleanup including polyfill teardown (for HMR/testing).
     */
    destroy(): void {
        this.unregisterAll();
        try {
            cleanupWebModelContext();
        } catch {
            // Not initialized — safe to ignore
        }
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
}

// ═══════════════════════════════════════════════════════════
// SINGLETON & CONVENIENCE
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
 * Initialize and register all tools in one call.
 * Meant to be called once during app initialization.
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
