/**
 * MIMI Tech AI - JavaScript Runtime
 * 
 * QuickJS-WASM based JavaScript execution engine.
 * Runs JS code 100% locally in the browser sandbox.
 * 
 * Features:
 * - Native ES2023 JavaScript support
 * - Secure sandboxed execution
 * - Console output capture
 * - Module support
 * - Automatic error handling
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 * https://mimitechai.com
 */

import type { QuickJSWASMModule, QuickJSContext } from 'quickjs-emscripten';

export interface JSExecutionResult {
    success: boolean;
    output: string;
    error?: string;
    executionTime: number;
}

interface ConsoleCapture {
    logs: string[];
}

/**
 * MIMI Tech AI - JavaScript Runtime
 * Powered by QuickJS-WASM
 */
export class MimiJavaScript {
    private QuickJS: QuickJSWASMModule | null = null;
    private context: QuickJSContext | null = null;
    private initialized = false;
    private consoleCapture: ConsoleCapture = { logs: [] };

    /**
     * Initialize the JavaScript runtime
     */
    async initialize(): Promise<{ success: boolean; message: string }> {
        if (this.initialized) {
            return { success: true, message: 'Already initialized' };
        }

        try {
            // Dynamic import to avoid SSR issues
            const { getQuickJS } = await import('quickjs-emscripten');

            this.QuickJS = await getQuickJS();
            this.context = this.QuickJS.newContext();

            // Setup console object in the context
            this.setupConsole();

            // Add useful globals
            this.setupGlobals();

            this.initialized = true;
            console.log('[MIMI JavaScript] ✅ Runtime initialized');

            return {
                success: true,
                message: 'QuickJS-WASM runtime initialized'
            };
        } catch (error) {
            console.error('[MIMI JavaScript] ❌ Initialization failed:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Execute JavaScript code
     */
    async execute(code: string): Promise<JSExecutionResult> {
        if (!this.initialized || !this.context) {
            await this.initialize();
        }

        if (!this.context) {
            return {
                success: false,
                output: '',
                error: 'Runtime not initialized',
                executionTime: 0
            };
        }

        // Clear previous console output
        this.consoleCapture.logs = [];

        const startTime = performance.now();

        try {
            const result = this.context.evalCode(code);
            const endTime = performance.now();

            if (result.error) {
                const errorValue = this.context.dump(result.error);
                result.error.dispose();

                return {
                    success: false,
                    output: this.consoleCapture.logs.join('\n'),
                    error: String(errorValue),
                    executionTime: endTime - startTime
                };
            }

            const value = this.context.dump(result.value);
            result.value.dispose();

            // Format output: console logs + return value
            let output = this.consoleCapture.logs.join('\n');
            if (value !== undefined && value !== null) {
                if (output) output += '\n';
                output += `→ ${this.formatValue(value)}`;
            }

            return {
                success: true,
                output,
                executionTime: endTime - startTime
            };

        } catch (error) {
            const endTime = performance.now();
            return {
                success: false,
                output: this.consoleCapture.logs.join('\n'),
                error: error instanceof Error ? error.message : 'Execution error',
                executionTime: endTime - startTime
            };
        }
    }

    /**
     * Execute file from workspace
     */
    async executeFile(code: string, filename: string): Promise<JSExecutionResult> {
        // Add source mapping comment
        const wrappedCode = `// Source: ${filename}\n${code}`;
        return this.execute(wrappedCode);
    }

    /**
     * Reset the runtime context
     */
    reset(): void {
        if (this.context) {
            this.context.dispose();
            this.context = null;
        }

        if (this.QuickJS) {
            this.context = this.QuickJS.newContext();
            this.setupConsole();
            this.setupGlobals();
        }

        this.consoleCapture.logs = [];
        console.log('[MIMI JavaScript] Runtime reset');
    }

    /**
     * Dispose of the runtime
     */
    dispose(): void {
        if (this.context) {
            this.context.dispose();
            this.context = null;
        }
        this.QuickJS = null;
        this.initialized = false;
        console.log('[MIMI JavaScript] Runtime disposed');
    }

    // ─────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────

    private setupConsole(): void {
        if (!this.context) return;

        // Create console object
        const consoleHandle = this.context.newObject();

        // console.log
        const logFn = this.context.newFunction('log', (...args) => {
            const values = args.map(arg => {
                const val = this.context!.dump(arg);
                return this.formatValue(val);
            });
            this.consoleCapture.logs.push(values.join(' '));
        });
        this.context.setProp(consoleHandle, 'log', logFn);
        logFn.dispose();

        // console.error
        const errorFn = this.context.newFunction('error', (...args) => {
            const values = args.map(arg => {
                const val = this.context!.dump(arg);
                return `❌ ${this.formatValue(val)}`;
            });
            this.consoleCapture.logs.push(values.join(' '));
        });
        this.context.setProp(consoleHandle, 'error', errorFn);
        errorFn.dispose();

        // console.warn
        const warnFn = this.context.newFunction('warn', (...args) => {
            const values = args.map(arg => {
                const val = this.context!.dump(arg);
                return `⚠️ ${this.formatValue(val)}`;
            });
            this.consoleCapture.logs.push(values.join(' '));
        });
        this.context.setProp(consoleHandle, 'warn', warnFn);
        warnFn.dispose();

        // Set global console
        this.context.setProp(this.context.global, 'console', consoleHandle);
        consoleHandle.dispose();
    }

    private setupGlobals(): void {
        if (!this.context) return;

        // Add MIMI info
        const mimiHandle = this.context.newObject();
        this.context.setProp(
            mimiHandle,
            'version',
            this.context.newString('1.0.0-alpha')
        );
        this.context.setProp(
            mimiHandle,
            'runtime',
            this.context.newString('QuickJS-WASM')
        );
        this.context.setProp(this.context.global, 'MIMI', mimiHandle);
        mimiHandle.dispose();

        // Add print function (alias for console.log)
        const printFn = this.context.newFunction('print', (...args) => {
            const values = args.map(arg => {
                const val = this.context!.dump(arg);
                return this.formatValue(val);
            });
            this.consoleCapture.logs.push(values.join(' '));
        });
        this.context.setProp(this.context.global, 'print', printFn);
        printFn.dispose();
    }

    private formatValue(value: unknown): string {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (typeof value === 'string') return value;
        if (typeof value === 'number') return String(value);
        if (typeof value === 'boolean') return String(value);
        if (typeof value === 'function') return '[Function]';
        if (Array.isArray(value)) {
            return `[${value.map(v => this.formatValue(v)).join(', ')}]`;
        }
        if (typeof value === 'object') {
            try {
                return JSON.stringify(value, null, 2);
            } catch {
                return '[Object]';
            }
        }
        return String(value);
    }
}

// ─────────────────────────────────────────────────────────────
// Singleton instance
// ─────────────────────────────────────────────────────────────

let jsRuntimeInstance: MimiJavaScript | null = null;

/**
 * Get the singleton JavaScript runtime instance
 */
export function getMimiJavaScript(): MimiJavaScript {
    if (!jsRuntimeInstance) {
        jsRuntimeInstance = new MimiJavaScript();
    }
    return jsRuntimeInstance;
}

/**
 * Reset the JavaScript runtime instance
 */
export function resetJavaScriptRuntime(): void {
    if (jsRuntimeInstance) {
        jsRuntimeInstance.dispose();
        jsRuntimeInstance = null;
    }
}

export default MimiJavaScript;
