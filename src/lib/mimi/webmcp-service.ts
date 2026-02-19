/**
 * MIMI WebMCP Service
 * 
 * WebMCP (Web Model Context Protocol) — W3C Draft Feb 2026
 * Exposes MIMI's tools to AI agents via navigator.modelContext
 * 
 * Status: Chrome 146 Canary (experimental flag)
 * Spec: https://webmachinelearning.github.io/webmcp/
 * 
 * This is an OPT-IN feature — users must explicitly enable it.
 * The browser acts as secure intermediary (permission-first design).
 */

export interface WebMCPTool {
    name: string;
    description: string;
    parameters: Record<string, {
        type: string;
        description: string;
        required?: boolean;
    }>;
    handler: (params: Record<string, unknown>) => Promise<unknown>;
}

export interface WebMCPStatus {
    supported: boolean;
    enabled: boolean;
    toolCount: number;
    reason?: string;
}

/**
 * Check if WebMCP is available in this browser
 * Currently: Chrome 146+ Canary with experimental flag enabled
 */
export function isWebMCPSupported(): boolean {
    return typeof navigator !== 'undefined' &&
        'modelContext' in navigator &&
        typeof (navigator as any).modelContext?.registerTool === 'function';
}

/**
 * MIMI's WebMCP Tool Definitions
 * These are exposed to AI agents via the browser's modelContext API
 */
const MIMI_TOOLS: WebMCPTool[] = [
    {
        name: 'mimi_chat',
        description: 'Send a message to MIMI, a local AI agent running on-device via WebGPU. Returns the AI response.',
        parameters: {
            message: {
                type: 'string',
                description: 'The message to send to MIMI',
                required: true
            },
            temperature: {
                type: 'number',
                description: 'Response creativity (0.0-1.0, default: 0.7)'
            }
        },
        handler: async (params) => {
            // Dispatch to MIMI's chat interface via CustomEvent
            const event = new CustomEvent('mimi:webmcp:chat', {
                detail: { message: params.message, temperature: params.temperature ?? 0.7 }
            });
            window.dispatchEvent(event);

            // Wait for response via Promise
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('MIMI response timeout')), 60000);
                window.addEventListener('mimi:webmcp:response', (e: Event) => {
                    clearTimeout(timeout);
                    resolve((e as CustomEvent).detail.response);
                }, { once: true });
            });
        }
    },
    {
        name: 'mimi_search_documents',
        description: 'Search through documents uploaded to MIMI. Returns relevant text chunks.',
        parameters: {
            query: {
                type: 'string',
                description: 'Search query',
                required: true
            },
            limit: {
                type: 'number',
                description: 'Max results (default: 5)'
            }
        },
        handler: async (params) => {
            const { searchDocuments } = await import('./pdf-processor');
            const results = await searchDocuments(params.query as string, params.limit as number ?? 5);
            return results.map(r => ({ text: r.chunk.text, score: r.score, source: r.documentName, page: r.chunk.pageNumber }));
        }
    },
    {
        name: 'mimi_get_status',
        description: 'Get MIMI agent status: loaded model, GPU info, readiness.',
        parameters: {},
        handler: async () => {
            const { getMimiEngine } = await import('./inference-engine');
            const engine = getMimiEngine();
            return {
                ready: engine.ready,
                model: engine.model ?? 'none',
                webgpu: 'gpu' in navigator,
                timestamp: new Date().toISOString()
            };
        }
    }
];

/**
 * Register MIMI's tools with the browser's WebMCP API
 * Only call this when user explicitly opts in
 */
export async function enableWebMCP(): Promise<WebMCPStatus> {
    if (!isWebMCPSupported()) {
        return {
            supported: false,
            enabled: false,
            toolCount: 0,
            reason: 'WebMCP nicht verfügbar. Benötigt Chrome 146+ Canary mit #web-mcp Flag.'
        };
    }

    try {
        const modelContext = (navigator as any).modelContext;
        let registeredCount = 0;

        for (const tool of MIMI_TOOLS) {
            await modelContext.registerTool({
                name: tool.name,
                description: tool.description,
                parameters: {
                    type: 'object',
                    properties: Object.fromEntries(
                        Object.entries(tool.parameters).map(([key, val]) => [
                            key,
                            { type: val.type, description: val.description }
                        ])
                    ),
                    required: Object.entries(tool.parameters)
                        .filter(([, v]) => v.required)
                        .map(([k]) => k)
                },
                handler: tool.handler
            });
            registeredCount++;
        }

        console.log(`[MIMI WebMCP] ✅ ${registeredCount} Tools registriert via navigator.modelContext`);
        return {
            supported: true,
            enabled: true,
            toolCount: registeredCount
        };

    } catch (error) {
        console.error('[MIMI WebMCP] Registration failed:', error);
        return {
            supported: true,
            enabled: false,
            toolCount: 0,
            reason: `Registrierung fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Disable WebMCP (unregister all tools)
 */
export async function disableWebMCP(): Promise<void> {
    if (!isWebMCPSupported()) return;

    try {
        const modelContext = (navigator as any).modelContext;
        if (typeof modelContext.unregisterAll === 'function') {
            await modelContext.unregisterAll();
        }
        console.log('[MIMI WebMCP] 🔌 Alle Tools deregistriert');
    } catch (error) {
        console.warn('[MIMI WebMCP] Deregistrierung fehlgeschlagen:', error);
    }
}

/**
 * Get current WebMCP status
 */
export function getWebMCPStatus(): WebMCPStatus {
    const supported = isWebMCPSupported();
    return {
        supported,
        enabled: false, // Will be updated after enableWebMCP()
        toolCount: MIMI_TOOLS.length,
        reason: supported
            ? 'WebMCP verfügbar — aktiviere es in den Einstellungen'
            : 'Benötigt Chrome 146+ Canary mit #web-mcp Flag aktiviert'
    };
}
