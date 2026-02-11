/**
 * MIMI Tech AI - Terminal Component
 * 
 * xterm.js-based terminal for MIMI Workspace.
 * Connects to WASM-based shell for command execution.
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 * https://mimitechai.com
 */

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Terminal as XTerm } from '@xterm/xterm';
import type { FitAddon } from '@xterm/addon-fit';

interface TerminalProps {
    onCommand?: (command: string) => Promise<string>;
    className?: string;
}

// Command history manager
class CommandHistory {
    private history: string[] = [];
    private position: number = 0;
    private maxSize: number = 100;

    add(command: string) {
        if (command.trim() && this.history[this.history.length - 1] !== command) {
            this.history.push(command);
            if (this.history.length > this.maxSize) {
                this.history.shift();
            }
        }
        this.position = this.history.length;
    }

    previous(): string | null {
        if (this.position > 0) {
            this.position--;
            return this.history[this.position];
        }
        return null;
    }

    next(): string | null {
        if (this.position < this.history.length - 1) {
            this.position++;
            return this.history[this.position];
        }
        this.position = this.history.length;
        return '';
    }

    reset() {
        this.position = this.history.length;
    }
}

// Built-in commands for MIMI
const BUILTIN_COMMANDS: Record<string, (args: string[], ctx: CommandContext) => string | Promise<string>> = {
    help: () => `
MIMI Workspace Terminal

Available commands:
  help          Show this help message
  clear         Clear the terminal
  pwd           Print working directory
  ls [path]     List directory contents
  cd <path>     Change directory
  cat <file>    Display file contents
  echo <text>   Print text
  python        Run Python (via Pyodide)
  node          Run JavaScript (via QuickJS)
  version       Show MIMI version

Keyboard shortcuts:
  ↑/↓           Navigate command history
  Ctrl+C        Cancel current command
  Ctrl+L        Clear screen
`,

    clear: (_, ctx) => {
        ctx.terminal?.clear();
        return '';
    },

    pwd: (_, ctx) => ctx.cwd,

    version: () => `MIMI Workspace v1.0.0-alpha
© 2026 MIMI Tech AI. All rights reserved.
Powered by: Pyodide, QuickJS, xterm.js`,

    echo: (args) => args.join(' '),

    date: () => new Date().toLocaleString(),

    whoami: () => 'mimi-user',

    uname: (args) => {
        if (args.includes('-a')) {
            return 'MIMIWorkspace 1.0.0 WebAssembly browser';
        }
        return 'MIMIWorkspace';
    }
};

interface CommandContext {
    cwd: string;
    terminal?: XTerm;
    fs?: any;
}

/**
 * MIMI Tech AI - Terminal
 */
export function Terminal({ onCommand, className = '' }: TerminalProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<XTerm | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const [currentLine, setCurrentLine] = useState('');
    const [cwd, setCwd] = useState('/workspace');
    const historyRef = useRef(new CommandHistory());
    const [initialized, setInitialized] = useState(false);

    // Initialize terminal
    useEffect(() => {
        if (!containerRef.current || initialized) return;

        const initTerminal = async () => {
            // Dynamic import to avoid SSR issues
            const { Terminal: XTerminal } = await import('@xterm/xterm');
            const { FitAddon } = await import('@xterm/addon-fit');
            // CSS is imported via globals.css

            const term = new XTerminal({
                cursorBlink: true,
                cursorStyle: 'bar',
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                theme: {
                    background: '#0d1117',
                    foreground: '#c9d1d9',
                    cursor: '#58a6ff',
                    cursorAccent: '#0d1117',
                    selectionBackground: '#264f78',
                    black: '#484f58',
                    red: '#ff7b72',
                    green: '#3fb950',
                    yellow: '#d29922',
                    blue: '#58a6ff',
                    magenta: '#bc8cff',
                    cyan: '#39c5cf',
                    white: '#b1bac4',
                    brightBlack: '#6e7681',
                    brightRed: '#ffa198',
                    brightGreen: '#56d364',
                    brightYellow: '#e3b341',
                    brightBlue: '#79c0ff',
                    brightMagenta: '#d2a8ff',
                    brightCyan: '#56d4dd',
                    brightWhite: '#f0f6fc',
                },
                allowProposedApi: true,
            });

            const fitAddon = new FitAddon();
            term.loadAddon(fitAddon);

            term.open(containerRef.current!);
            fitAddon.fit();

            terminalRef.current = term;
            fitAddonRef.current = fitAddon;

            // Welcome message
            term.writeln('\x1b[1;36m╔════════════════════════════════════════╗\x1b[0m');
            term.writeln('\x1b[1;36m║     MIMI Tech AI - Workspace Shell     ║\x1b[0m');
            term.writeln('\x1b[1;36m╚════════════════════════════════════════╝\x1b[0m');
            term.writeln('');
            term.writeln('Type \x1b[33mhelp\x1b[0m for available commands.');
            term.writeln('');

            writePrompt(term, cwd);
            setInitialized(true);

            console.log('[MIMI Terminal] ✅ Initialized');
        };

        initTerminal();

        // Cleanup
        return () => {
            terminalRef.current?.dispose();
        };
    }, [containerRef, initialized, cwd]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            fitAddonRef.current?.fit();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Handle key input
    useEffect(() => {
        if (!terminalRef.current || !initialized) return;

        const term = terminalRef.current;
        let line = '';

        const handleData = async (data: string) => {
            const code = data.charCodeAt(0);

            // Enter
            if (code === 13) {
                term.writeln('');

                if (line.trim()) {
                    historyRef.current.add(line);
                    await executeCommand(line, term);
                }

                line = '';
                setCurrentLine('');
                writePrompt(term, cwd);
                return;
            }

            // Backspace
            if (code === 127) {
                if (line.length > 0) {
                    line = line.slice(0, -1);
                    setCurrentLine(line);
                    term.write('\b \b');
                }
                return;
            }

            // Ctrl+C
            if (code === 3) {
                term.writeln('^C');
                line = '';
                setCurrentLine('');
                writePrompt(term, cwd);
                return;
            }

            // Ctrl+L (clear)
            if (code === 12) {
                term.clear();
                writePrompt(term, cwd);
                return;
            }

            // Arrow keys (escape sequences)
            if (data.startsWith('\x1b[')) {
                // Up arrow
                if (data === '\x1b[A') {
                    const prev = historyRef.current.previous();
                    if (prev !== null) {
                        // Clear current line
                        term.write('\r' + getPrompt(cwd) + ' '.repeat(line.length) + '\r' + getPrompt(cwd));
                        line = prev;
                        setCurrentLine(line);
                        term.write(line);
                    }
                    return;
                }

                // Down arrow
                if (data === '\x1b[B') {
                    const next = historyRef.current.next();
                    if (next !== null) {
                        term.write('\r' + getPrompt(cwd) + ' '.repeat(line.length) + '\r' + getPrompt(cwd));
                        line = next;
                        setCurrentLine(line);
                        term.write(line);
                    }
                    return;
                }
                return;
            }

            // Tab completion (placeholder)
            if (code === 9) {
                // TODO: Implement tab completion
                return;
            }

            // Regular character
            if (code >= 32) {
                line += data;
                setCurrentLine(line);
                term.write(data);
            }
        };

        const disposable = term.onData(handleData);

        return () => {
            disposable.dispose();
        };
    }, [initialized, cwd]);

    // Execute command
    const executeCommand = useCallback(async (cmdLine: string, term: XTerm) => {
        const parts = cmdLine.trim().split(/\s+/);
        const cmd = parts[0];
        const args = parts.slice(1);

        // Check built-in commands
        if (cmd in BUILTIN_COMMANDS) {
            try {
                const ctx: CommandContext = {
                    cwd,
                    terminal: term
                };
                const result = await BUILTIN_COMMANDS[cmd](args, ctx);
                if (result) {
                    term.writeln(result);
                }
            } catch (error) {
                term.writeln(`\x1b[31mError: ${error instanceof Error ? error.message : 'Unknown error'}\x1b[0m`);
            }
            return;
        }

        // cd command
        if (cmd === 'cd') {
            const newPath = args[0] || '/workspace';
            setCwd(newPath.startsWith('/') ? newPath : `${cwd}/${newPath}`.replace(/\/+/g, '/'));
            return;
        }

        // External command handler
        if (onCommand) {
            try {
                const result = await onCommand(cmdLine);
                if (result) {
                    term.writeln(result);
                }
            } catch (error) {
                term.writeln(`\x1b[31mError: ${error instanceof Error ? error.message : 'Unknown error'}\x1b[0m`);
            }
            return;
        }

        // Unknown command
        term.writeln(`\x1b[31mCommand not found: ${cmd}\x1b[0m`);
        term.writeln(`Type \x1b[33mhelp\x1b[0m for available commands.`);
    }, [cwd, onCommand]);

    return (
        <div className={`flex flex-col h-full bg-[#0d1117] ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Terminal</span>
                    <span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded">
                        {cwd}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => terminalRef.current?.clear()}
                        className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                        title="Clear (Ctrl+L)"
                    >
                        🗑️ Clear
                    </button>
                </div>
            </div>

            {/* Terminal */}
            <div
                ref={containerRef}
                className="flex-1 overflow-hidden"
            />

            {/* Status */}
            <div className="px-3 py-1 bg-gray-800 border-t border-gray-700 text-xs text-gray-500 flex justify-between">
                <span>MIMI Shell</span>
                <span>Powered by MIMI Tech AI</span>
            </div>
        </div>
    );
}

// Helper functions
function getPrompt(cwd: string): string {
    const shortCwd = cwd === '/workspace' ? '~' : cwd.replace('/workspace', '~');
    return `\x1b[1;32mmimi\x1b[0m:\x1b[1;34m${shortCwd}\x1b[0m$ `;
}

function writePrompt(term: XTerm, cwd: string) {
    term.write(getPrompt(cwd));
}

export default Terminal;
