/**
 * MIMI Agent Computer — E2B-Style Virtual Dev Sandbox (No External APIs)
 *
 * Unified virtual computer that gives the MIMI Agent its own:
 *   ✦ Virtual Filesystem (OPFS-backed, persistent)
 *   ✦ Python Runtime (Pyodide WASM)
 *   ✦ JavaScript Runtime (QuickJS WASM)
 *   ✦ Process Manager (track running executions)
 *   ✦ Terminal (stdout/stderr capture)
 *   ✦ Network Proxy (fetch with CORS handling)
 *
 * Inspired by E2B Firecracker microVMs but runs 100% in-browser.
 * No external APIs. No servers. Everything local.
 *
 * Architecture (E2B mapping):
 *   E2B Sandbox → AgentComputer (this file)
 *   Firecracker VM → Browser WASM sandbox
 *   VM Filesystem → OPFS (Origin Private File System)
 *   Code Execution → Pyodide (Python) + QuickJS (JavaScript)
 *   Networking → fetch() with CORS proxy fallback
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { getMimiFilesystem, type FileEntry } from './workspace/filesystem';
import { getMimiJavaScript, type JSExecutionResult } from './workspace/runtimes/javascript';
import { getMimiNetwork, type FetchResult } from './workspace/networking';
import { executePython, initPyodide, isPyodideReady, isPyodideLoading, type CodeExecutionResult } from './code-executor';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type ProcessStatus = 'running' | 'completed' | 'failed' | 'killed';
export type ProcessType = 'python' | 'javascript' | 'shell' | 'fetch';

export interface ComputerProcess {
    id: string;
    type: ProcessType;
    command: string;
    status: ProcessStatus;
    startTime: number;
    endTime?: number;
    output: string[];
    exitCode?: number;
}

export interface TerminalOutput {
    id: string;
    processId: string;
    type: 'stdout' | 'stderr' | 'system' | 'input';
    content: string;
    timestamp: number;
}

export interface ComputerStatus {
    initialized: boolean;
    filesystem: { ready: boolean; fileCount: number };
    python: { ready: boolean; loading: boolean };
    javascript: { ready: boolean };
    network: { available: boolean };
    processes: { running: number; total: number };
    uptime: number;
}

export interface ExecutionOptions {
    timeout?: number;          // ms, default 30000
    captureOutput?: boolean;   // default true
    workingDir?: string;       // default '/workspace'
    env?: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════════
// AGENT COMPUTER CLASS
// ═══════════════════════════════════════════════════════════════

export class AgentComputer {
    private processes: Map<string, ComputerProcess> = new Map();
    private terminalHistory: TerminalOutput[] = [];
    private bootTime: number = 0;
    private _initialized = false;
    private listeners: Set<(event: ComputerEvent) => void> = new Set();

    // ── Lifecycle ──────────────────────────────────────────────

    /**
     * Boot the virtual computer.
     * Initializes filesystem, runtimes, and process manager.
     */
    async boot(onProgress?: (msg: string) => void): Promise<{ success: boolean; message: string }> {
        if (this._initialized) return { success: true, message: 'Already booted' };

        this.bootTime = Date.now();
        this.emit({ type: 'boot', message: 'Booting MIMI Computer...' });

        try {
            // 1. Filesystem (OPFS)
            onProgress?.('Initializing virtual filesystem...');
            this.emit({ type: 'boot', message: 'Mounting OPFS filesystem...' });
            const fs = getMimiFilesystem();
            const fsResult = await fs.initialize();
            if (!fsResult.success) throw new Error(`Filesystem: ${fsResult.message}`);

            // 1b. Create 3-file scratchpad (Manus-style planning system)
            try {
                const scratchpadFiles: Array<{ path: string; header: string }> = [
                    { path: '/workspace/todo.md', header: '# MIMI Task Plan\n\n> No tasks yet. Use `update_plan` to create a plan.\n' },
                    { path: '/workspace/notes.md', header: '# Agent Notes\n\n> Observations and findings will appear here.\n' },
                    { path: '/workspace/context.md', header: '# Agent Context\n\n> Key decisions and constraints are stored here.\n' },
                ];
                for (const { path, header } of scratchpadFiles) {
                    const exists = await fs.exists(path);
                    if (!exists) await fs.writeFile(path, header);
                }
            } catch { /* non-critical */ }
            onProgress?.('Scratchpad initialized (todo, notes, context)');
            this.emit({ type: 'boot', message: 'Scratchpad ready: todo.md, notes.md, context.md' });

            // 2. Python Runtime (Pyodide) — lazy load, don't block boot
            onProgress?.('Python runtime available (lazy-loaded)');
            this.emit({ type: 'boot', message: 'Python runtime registered (lazy-load)' });

            // 3. JavaScript Runtime (QuickJS) — also lazy
            onProgress?.('JavaScript runtime available (lazy-loaded)');
            this.emit({ type: 'boot', message: 'JavaScript runtime registered (lazy-load)' });

            this._initialized = true;
            const bootTime = Date.now() - this.bootTime;
            const msg = `MIMI Computer booted in ${bootTime}ms`;
            onProgress?.(msg);
            this.emit({ type: 'boot', message: msg });
            this.addSystemOutput(msg);

            return { success: true, message: msg };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.emit({ type: 'error', message: errorMsg });
            return { success: false, message: errorMsg };
        }
    }

    get isReady(): boolean { return this._initialized; }

    /**
     * Get current computer status
     */
    async getStatus(): Promise<ComputerStatus> {
        const fs = getMimiFilesystem();
        let fileCount = 0;
        try {
            const entries = await fs.listDirectory('/workspace');
            fileCount = entries.length;
        } catch { /* workspace may not exist yet */ }

        const runningProcesses = Array.from(this.processes.values()).filter(p => p.status === 'running');

        return {
            initialized: this._initialized,
            filesystem: { ready: this._initialized, fileCount },
            python: { ready: isPyodideReady(), loading: isPyodideLoading() },
            javascript: { ready: false }, // lazy-loaded
            network: { available: typeof fetch !== 'undefined' },
            processes: { running: runningProcesses.length, total: this.processes.size },
            uptime: this.bootTime > 0 ? Date.now() - this.bootTime : 0,
        };
    }

    // ── Code Execution ────────────────────────────────────────

    /**
     * Execute Python code in the Pyodide WASM sandbox
     */
    async executePython(code: string, options: ExecutionOptions = {}): Promise<CodeExecutionResult> {
        const processId = this.createProcess('python', code);

        try {
            // Ensure Pyodide is loaded
            if (!isPyodideReady()) {
                this.addTerminalOutput(processId, 'system', '⏳ Loading Python runtime (first use)...');
                this.emit({ type: 'runtime_loading', message: 'Loading Pyodide...' });
                await initPyodide((msg) => {
                    this.addTerminalOutput(processId, 'system', msg);
                });
            }

            this.addTerminalOutput(processId, 'input', `$ python3 -c "${code.slice(0, 80)}${code.length > 80 ? '...' : ''}"`);
            this.emit({ type: 'execution_start', processId, language: 'python' });

            const timeoutMs = options.timeout || 30000;
            const result = await Promise.race([
                executePython(code),
                new Promise<CodeExecutionResult>((_, reject) =>
                    setTimeout(() => reject(new Error(`Execution timeout (${timeoutMs}ms)`)), timeoutMs)
                ),
            ]);

            // Capture output
            if (result.output) {
                this.addTerminalOutput(processId, 'stdout', result.output);
            }
            if (result.error) {
                this.addTerminalOutput(processId, 'stderr', result.error);
            }

            this.completeProcess(processId, result.success ? 0 : 1, result.output);
            this.emit({ type: 'execution_complete', processId, result });

            return result;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.addTerminalOutput(processId, 'stderr', errorMsg);
            this.completeProcess(processId, 1, errorMsg);
            this.emit({ type: 'execution_error', processId, error: errorMsg });

            return {
                success: false,
                output: '',
                error: errorMsg,
                executionTime: Date.now() - (this.processes.get(processId)?.startTime || Date.now()),
            };
        }
    }

    /**
     * Execute JavaScript code in the QuickJS WASM sandbox
     */
    async executeJavaScript(code: string, options: ExecutionOptions = {}): Promise<JSExecutionResult> {
        const processId = this.createProcess('javascript', code);

        try {
            const jsRuntime = getMimiJavaScript();
            // Try to initialize (no-ops if already initialized)
            this.addTerminalOutput(processId, 'system', '⏳ Loading JavaScript runtime...');
            this.emit({ type: 'runtime_loading', message: 'Loading QuickJS...' });
            await jsRuntime.initialize();

            this.addTerminalOutput(processId, 'input', `$ node -e "${code.slice(0, 80)}${code.length > 80 ? '...' : ''}"`);
            this.emit({ type: 'execution_start', processId, language: 'javascript' });

            const result = await jsRuntime.execute(code);

            if (result.output) {
                this.addTerminalOutput(processId, 'stdout', result.output);
            }
            if (result.error) {
                this.addTerminalOutput(processId, 'stderr', result.error);
            }

            this.completeProcess(processId, result.success ? 0 : 1, result.output);
            this.emit({ type: 'execution_complete', processId, result });

            return result;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.addTerminalOutput(processId, 'stderr', errorMsg);
            this.completeProcess(processId, 1, errorMsg);
            this.emit({ type: 'execution_error', processId, error: errorMsg });

            return {
                success: false,
                output: '',
                error: errorMsg,
                executionTime: Date.now() - (this.processes.get(processId)?.startTime || Date.now()),
            };
        }
    }

    /**
     * Execute shell-like commands (maps to Python/JS)
     * Supports: python, node, cat, ls, mkdir, echo, etc.
     */
    async executeShell(command: string, options: ExecutionOptions = {}): Promise<{ output: string; exitCode: number }> {
        const processId = this.createProcess('shell', command);
        this.addTerminalOutput(processId, 'input', `$ ${command}`);

        const parts = command.trim().split(/\s+/);
        const cmd = parts[0];
        const args = parts.slice(1);

        try {
            let output = '';
            let exitCode = 0;

            switch (cmd) {
                case 'python':
                case 'python3': {
                    if (args[0] === '-c') {
                        const code = args.slice(1).join(' ').replace(/^['"]|['"]$/g, '');
                        const result = await this.executePython(code, options);
                        output = result.output || result.error || '';
                        exitCode = result.success ? 0 : 1;
                    } else if (args[0]) {
                        // Execute file
                        const fs = getMimiFilesystem();
                        const filePath = args[0].startsWith('/') ? args[0] : `/workspace/${args[0]}`;
                        const code = await fs.readFile(filePath);
                        const result = await this.executePython(code, options);
                        output = result.output || result.error || '';
                        exitCode = result.success ? 0 : 1;
                    }
                    break;
                }

                case 'node': {
                    if (args[0] === '-e') {
                        const code = args.slice(1).join(' ').replace(/^['"]|['"]$/g, '');
                        const result = await this.executeJavaScript(code, options);
                        output = result.output || result.error || '';
                        exitCode = result.success ? 0 : 1;
                    } else if (args[0]) {
                        const fs = getMimiFilesystem();
                        const filePath = args[0].startsWith('/') ? args[0] : `/workspace/${args[0]}`;
                        const code = await fs.readFile(filePath);
                        const result = await this.executeJavaScript(code, options);
                        output = result.output || result.error || '';
                        exitCode = result.success ? 0 : 1;
                    }
                    break;
                }

                case 'ls': {
                    const dir = args[0] || options.workingDir || '/workspace';
                    const fs = getMimiFilesystem();
                    const entries = await fs.listDirectory(dir);
                    output = entries.map(e => `${e.isDirectory ? 'd' : '-'}  ${e.name}${e.size ? `  (${formatBytes(e.size)})` : ''}`).join('\n');
                    break;
                }

                case 'cat': {
                    if (!args[0]) { output = 'cat: missing file operand'; exitCode = 1; break; }
                    const fs = getMimiFilesystem();
                    const filePath = args[0].startsWith('/') ? args[0] : `/workspace/${args[0]}`;
                    output = await fs.readFile(filePath);
                    break;
                }

                case 'mkdir': {
                    if (!args[0]) { output = 'mkdir: missing operand'; exitCode = 1; break; }
                    const fs = getMimiFilesystem();
                    const dirPath = args[0].startsWith('/') ? args[0] : `/workspace/${args[0]}`;
                    await fs.createDirectory(dirPath);
                    output = `Created directory: ${dirPath}`;
                    break;
                }

                case 'touch': {
                    if (!args[0]) { output = 'touch: missing file operand'; exitCode = 1; break; }
                    const fs = getMimiFilesystem();
                    const filePath = args[0].startsWith('/') ? args[0] : `/workspace/${args[0]}`;
                    await fs.writeFile(filePath, '');
                    output = `Created file: ${filePath}`;
                    break;
                }

                case 'rm': {
                    if (!args[0]) { output = 'rm: missing operand'; exitCode = 1; break; }
                    const fs = getMimiFilesystem();
                    const filePath = args[0].startsWith('/') ? args[0] : `/workspace/${args[0]}`;
                    await fs.deleteFile(filePath);
                    output = `Removed: ${filePath}`;
                    break;
                }

                case 'echo': {
                    output = args.join(' ').replace(/^['"]|['"]$/g, '');
                    break;
                }

                case 'pwd': {
                    output = options.workingDir || '/workspace';
                    break;
                }

                case 'whoami': {
                    output = 'mimi-agent';
                    break;
                }

                case 'date': {
                    output = new Date().toISOString();
                    break;
                }

                case 'uptime': {
                    const uptime = this.bootTime > 0 ? Math.round((Date.now() - this.bootTime) / 1000) : 0;
                    output = `up ${uptime}s`;
                    break;
                }

                case 'clear': {
                    this.terminalHistory = [];
                    output = '';
                    break;
                }

                case 'curl':
                case 'wget': {
                    const url = args.find(a => a.startsWith('http'));
                    if (!url) { output = `${cmd}: missing URL`; exitCode = 1; break; }
                    const net = getMimiNetwork();
                    const response = await net.fetch(url);
                    output = response.ok
                        ? (typeof response.data === 'string' ? response.data.slice(0, 2000) : JSON.stringify(response.data).slice(0, 2000))
                        : `Error: ${response.statusText}`;
                    exitCode = response.ok ? 0 : 1;
                    break;
                }

                case 'pip':
                case 'pip3': {
                    if (args[0] === 'install' && args[1]) {
                        const { installPackage } = await import('./code-executor');
                        const result = await installPackage(args[1], (msg) => {
                            this.addTerminalOutput(processId, 'stdout', msg);
                        });
                        output = result.message;
                        exitCode = result.success ? 0 : 1;
                    } else {
                        output = 'Usage: pip install <package>';
                    }
                    break;
                }

                case 'cp': {
                    if (!args[0] || !args[1]) { output = 'cp: missing operand'; exitCode = 1; break; }
                    const fs = getMimiFilesystem();
                    const srcP = args[0].startsWith('/') ? args[0] : `/workspace/${args[0]}`;
                    const dstP = args[1].startsWith('/') ? args[1] : `/workspace/${args[1]}`;
                    await fs.copyFile(srcP, dstP);
                    output = `Copied: ${srcP} → ${dstP}`;
                    break;
                }

                case 'mv': {
                    if (!args[0] || !args[1]) { output = 'mv: missing operand'; exitCode = 1; break; }
                    const fs = getMimiFilesystem();
                    const srcPath = args[0].startsWith('/') ? args[0] : `/workspace/${args[0]}`;
                    const dstPath = args[1].startsWith('/') ? args[1] : `/workspace/${args[1]}`;
                    await fs.rename(srcPath, dstPath);
                    output = `Moved: ${srcPath} → ${dstPath}`;
                    break;
                }

                case 'head': {
                    if (!args[0]) { output = 'head: missing file operand'; exitCode = 1; break; }
                    const fs = getMimiFilesystem();
                    const filePath = args[0].startsWith('/') ? args[0] : `/workspace/${args[0]}`;
                    const content = await fs.readFile(filePath);
                    const lines = content.split('\n');
                    const count = args[1] ? parseInt(args[1].replace('-n', '').replace('=', ''), 10) || 10 : 10;
                    output = lines.slice(0, count).join('\n');
                    break;
                }

                case 'tail': {
                    if (!args[0]) { output = 'tail: missing file operand'; exitCode = 1; break; }
                    const fs = getMimiFilesystem();
                    const filePath = args[0].startsWith('/') ? args[0] : `/workspace/${args[0]}`;
                    const content = await fs.readFile(filePath);
                    const lines = content.split('\n');
                    const count = args[1] ? parseInt(args[1].replace('-n', '').replace('=', ''), 10) || 10 : 10;
                    output = lines.slice(-count).join('\n');
                    break;
                }

                case 'wc': {
                    if (!args[0]) { output = 'wc: missing file operand'; exitCode = 1; break; }
                    const fs = getMimiFilesystem();
                    const filePath = args[0].startsWith('/') ? args[0] : `/workspace/${args[0]}`;
                    const content = await fs.readFile(filePath);
                    const lines = content.split('\n').length;
                    const words = content.split(/\s+/).filter(Boolean).length;
                    const chars = content.length;
                    output = `  ${lines}  ${words}  ${chars} ${args[0]}`;
                    break;
                }

                case 'grep': {
                    const pattern = args[0];
                    const file = args[1];
                    if (!pattern) { output = 'grep: missing pattern'; exitCode = 1; break; }
                    if (!file) { output = 'grep: missing file'; exitCode = 1; break; }
                    const fs = getMimiFilesystem();
                    const filePath = file.startsWith('/') ? file : `/workspace/${file}`;
                    const content = await fs.readFile(filePath);
                    const matching = content.split('\n').filter(line =>
                        line.toLowerCase().includes(pattern.toLowerCase())
                    );
                    output = matching.length > 0 ? matching.join('\n') : `No matches for "${pattern}"`;
                    exitCode = matching.length > 0 ? 0 : 1;
                    break;
                }

                case 'find': {
                    const dir = args[0] || '/workspace';
                    const fs = getMimiFilesystem();
                    const entries = await fs.listDirectory(dir);
                    const nameFilter = args.find(a => a.startsWith('-name'));
                    const filterValue = nameFilter ? args[args.indexOf(nameFilter) + 1]?.replace(/["']/g, '') : null;
                    output = entries
                        .filter(e => !filterValue || e.name.includes(filterValue))
                        .map(e => `${dir}/${e.name}`)
                        .join('\n');
                    break;
                }

                case 'help': {
                    output = [
                        'MIMI Agent Computer — Available Commands:',
                        '',
                        '  python3 -c "code"    Execute Python code',
                        '  python3 script.py    Execute Python file',
                        '  node -e "code"       Execute JavaScript code',
                        '  node script.js       Execute JavaScript file',
                        '  pip install <pkg>    Install Python package',
                        '  ls [dir]             List directory contents',
                        '  cat <file>           Display file contents',
                        '  head <file>          Show first 10 lines',
                        '  tail <file>          Show last 10 lines',
                        '  grep <pat> <file>    Search in file',
                        '  wc <file>            Count lines/words/chars',
                        '  find <dir>           Find files',
                        '  mkdir <dir>          Create directory',
                        '  touch <file>         Create empty file',
                        '  cp <src> <dst>       Copy file',
                        '  mv <src> <dst>       Move/rename file',
                        '  rm <file>            Remove file',
                        '  echo <text>          Print text',
                        '  pwd                  Print working directory',
                        '  curl <url>           Fetch URL content',
                        '  clear                Clear terminal',
                        '  uptime               Show system uptime',
                        '  help                 Show this help',
                    ].join('\n');
                    break;
                }

                default: {
                    // Unknown command — try as Python expression
                    try {
                        const result = await this.executePython(`print(${command})`, options);
                        output = result.output || result.error || '';
                        exitCode = result.success ? 0 : 127;
                    } catch {
                        output = `mimi-shell: command not found: ${cmd}`;
                        exitCode = 127;
                    }
                }
            }

            if (output) {
                this.addTerminalOutput(processId, exitCode === 0 ? 'stdout' : 'stderr', output);
            }
            this.completeProcess(processId, exitCode, output);

            return { output, exitCode };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.addTerminalOutput(processId, 'stderr', errorMsg);
            this.completeProcess(processId, 1, errorMsg);
            return { output: errorMsg, exitCode: 1 };
        }
    }

    // ── Filesystem Operations (convenience wrappers) ─────────

    async readFile(path: string): Promise<string> {
        const fs = getMimiFilesystem();
        return fs.readFile(path.startsWith('/') ? path : `/workspace/${path}`);
    }

    async writeFile(path: string, content: string): Promise<void> {
        const fs = getMimiFilesystem();
        const fullPath = path.startsWith('/') ? path : `/workspace/${path}`;
        await fs.writeFile(fullPath, content);
        this.emit({ type: 'file_changed', path: fullPath, action: 'write' });
    }

    async listFiles(dir: string = '/workspace'): Promise<FileEntry[]> {
        const fs = getMimiFilesystem();
        return fs.listDirectory(dir);
    }

    async deleteFile(path: string): Promise<void> {
        const fs = getMimiFilesystem();
        const fullPath = path.startsWith('/') ? path : `/workspace/${path}`;
        await fs.deleteFile(fullPath);
        this.emit({ type: 'file_changed', path: fullPath, action: 'delete' });
    }

    async fileExists(path: string): Promise<boolean> {
        const fs = getMimiFilesystem();
        return fs.exists(path.startsWith('/') ? path : `/workspace/${path}`);
    }

    // ── Network Operations ───────────────────────────────────

    async fetchUrl(url: string, options?: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'; headers?: Record<string, string>; body?: string }): Promise<FetchResult> {
        const processId = this.createProcess('fetch', url);
        this.addTerminalOutput(processId, 'input', `$ curl ${url}`);
        this.emit({ type: 'network_request', url });

        try {
            const net = getMimiNetwork();
            const result = await net.fetch(url, options);
            const output = result.ok
                ? `HTTP ${result.status} — ${typeof result.data === 'string' ? result.data.length : 0} bytes`
                : `Error: ${result.statusText}`;
            this.addTerminalOutput(processId, result.ok ? 'stdout' : 'stderr', output);
            this.completeProcess(processId, result.ok ? 0 : 1, output);
            this.emit({ type: 'network_response', url, status: result.status });
            return result;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.addTerminalOutput(processId, 'stderr', errorMsg);
            this.completeProcess(processId, 1, errorMsg);
            return { ok: false, status: 0, statusText: errorMsg, headers: {}, data: null, responseTime: 0 };
        }
    }

    // ── Process Management ───────────────────────────────────

    private createProcess(type: ProcessType, command: string): string {
        const id = `proc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const process: ComputerProcess = {
            id, type, command: command.slice(0, 200),
            status: 'running', startTime: Date.now(), output: [],
        };
        this.processes.set(id, process);
        this.emit({ type: 'process_start', processId: id, processType: type });
        return id;
    }

    private completeProcess(id: string, exitCode: number, output: string): void {
        const process = this.processes.get(id);
        if (process) {
            process.status = exitCode === 0 ? 'completed' : 'failed';
            process.endTime = Date.now();
            process.exitCode = exitCode;
            if (output) process.output.push(output);
            this.emit({ type: 'process_end', processId: id, exitCode });
        }
    }

    killProcess(id: string): void {
        const process = this.processes.get(id);
        if (process && process.status === 'running') {
            process.status = 'killed';
            process.endTime = Date.now();
            process.exitCode = 137;
            this.addTerminalOutput(id, 'system', `Process ${id} killed`);
            this.emit({ type: 'process_end', processId: id, exitCode: 137 });
        }
    }

    getProcesses(): ComputerProcess[] {
        return Array.from(this.processes.values());
    }

    getRunningProcesses(): ComputerProcess[] {
        return Array.from(this.processes.values()).filter(p => p.status === 'running');
    }

    // ── Terminal ──────────────────────────────────────────────

    private addTerminalOutput(processId: string, type: TerminalOutput['type'], content: string): void {
        const output: TerminalOutput = {
            id: `out-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            processId, type, content, timestamp: Date.now(),
        };
        this.terminalHistory.push(output);
        // Keep history manageable
        if (this.terminalHistory.length > 500) {
            this.terminalHistory = this.terminalHistory.slice(-300);
        }
        this.emit({ type: 'terminal_output', output });
    }

    private addSystemOutput(content: string): void {
        this.addTerminalOutput('system', 'system', content);
    }

    getTerminalHistory(): TerminalOutput[] {
        return [...this.terminalHistory];
    }

    clearTerminal(): void {
        this.terminalHistory = [];
        this.emit({ type: 'terminal_cleared' });
    }

    // ── Event System ─────────────────────────────────────────

    on(listener: (event: ComputerEvent) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private emit(event: ComputerEvent): void {
        console.log(`[AgentComputer] ${event.type}:`, event);
        for (const listener of this.listeners) {
            try { listener(event); } catch (e) { console.error('[AgentComputer] Listener error:', e); }
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// EVENT TYPES
// ═══════════════════════════════════════════════════════════════

export type ComputerEvent =
    | { type: 'boot'; message: string }
    | { type: 'error'; message: string }
    | { type: 'runtime_loading'; message: string }
    | { type: 'execution_start'; processId: string; language: string }
    | { type: 'execution_complete'; processId: string; result: CodeExecutionResult | JSExecutionResult }
    | { type: 'execution_error'; processId: string; error: string }
    | { type: 'process_start'; processId: string; processType: ProcessType }
    | { type: 'process_end'; processId: string; exitCode: number }
    | { type: 'terminal_output'; output: TerminalOutput }
    | { type: 'terminal_cleared' }
    | { type: 'file_changed'; path: string; action: 'write' | 'delete' }
    | { type: 'network_request'; url: string }
    | { type: 'network_response'; url: string; status?: number };

// ═══════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════

let computerInstance: AgentComputer | null = null;

/**
 * Get the singleton AgentComputer instance
 */
export function getAgentComputer(): AgentComputer {
    if (!computerInstance) {
        computerInstance = new AgentComputer();
    }
    return computerInstance;
}

/**
 * Reset the singleton (for testing)
 */
export function resetAgentComputer(): void {
    computerInstance = null;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default AgentComputer;
