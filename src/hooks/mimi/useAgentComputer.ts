/**
 * useAgentComputer — React hook for MIMI Agent's Virtual Computer
 *
 * Provides real-time access to the AgentComputer service:
 *   - Boot/status monitoring
 *   - Terminal output streaming
 *   - Process tracking
 *   - File system operations
 *   - Code execution triggers
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    getAgentComputer,
    type ComputerStatus,
    type ComputerProcess,
    type TerminalOutput,
    type ComputerEvent,
    type ExecutionOptions,
} from '@/lib/mimi/agent-computer';
import type { CodeExecutionResult } from '@/lib/mimi/code-executor';
import type { JSExecutionResult } from '@/lib/mimi/workspace/runtimes/javascript';
import type { FileEntry } from '@/lib/mimi/workspace/filesystem';

export interface AgentComputerState {
    /** Whether the computer is booted and ready */
    isReady: boolean;
    /** Whether the computer is currently booting */
    isBooting: boolean;
    /** Current computer status */
    status: ComputerStatus | null;
    /** Terminal output history */
    terminalHistory: TerminalOutput[];
    /** All processes */
    processes: ComputerProcess[];
    /** Currently running processes */
    runningProcesses: ComputerProcess[];
    /** Latest event */
    lastEvent: ComputerEvent | null;
    /** Boot error message */
    bootError: string | null;
}

export interface AgentComputerActions {
    /** Boot the virtual computer */
    boot: () => Promise<void>;
    /** Execute Python code */
    executePython: (code: string, options?: ExecutionOptions) => Promise<CodeExecutionResult>;
    /** Execute JavaScript code */
    executeJavaScript: (code: string, options?: ExecutionOptions) => Promise<JSExecutionResult>;
    /** Execute shell command */
    executeShell: (command: string) => Promise<{ output: string; exitCode: number }>;
    /** File operations */
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<void>;
    listFiles: (dir?: string) => Promise<FileEntry[]>;
    deleteFile: (path: string) => Promise<void>;
    /** Fetch URL */
    fetchUrl: (url: string) => Promise<unknown>;
    /** Kill a running process */
    killProcess: (id: string) => void;
    /** Clear terminal */
    clearTerminal: () => void;
    /** Refresh status */
    refreshStatus: () => Promise<void>;
}

/**
 * React hook for the MIMI Agent Computer
 *
 * Usage:
 * ```tsx
 * const [computer, actions] = useAgentComputer();
 *
 * // Boot on mount
 * useEffect(() => { actions.boot(); }, []);
 *
 * // Execute Python
 * const result = await actions.executePython('print("Hello from MIMI!")');
 * ```
 */
export function useAgentComputer(): [AgentComputerState, AgentComputerActions] {
    const [isReady, setIsReady] = useState(false);
    const [isBooting, setIsBooting] = useState(false);
    const [status, setStatus] = useState<ComputerStatus | null>(null);
    const [terminalHistory, setTerminalHistory] = useState<TerminalOutput[]>([]);
    const [processes, setProcesses] = useState<ComputerProcess[]>([]);
    const [lastEvent, setLastEvent] = useState<ComputerEvent | null>(null);
    const [bootError, setBootError] = useState<string | null>(null);

    const computerRef = useRef(getAgentComputer());

    // Subscribe to computer events
    useEffect(() => {
        const computer = computerRef.current;

        const unsubscribe = computer.on((event) => {
            setLastEvent(event);

            switch (event.type) {
                case 'terminal_output':
                    setTerminalHistory(prev => [...prev.slice(-200), event.output]);
                    break;
                case 'terminal_cleared':
                    setTerminalHistory([]);
                    break;
                case 'process_start':
                case 'process_end':
                    setProcesses(computer.getProcesses());
                    break;
                case 'boot':
                    // Status will be refreshed after boot
                    break;
            }
        });

        // Sync initial state
        if (computer.isReady) {
            setIsReady(true);
            setTerminalHistory(computer.getTerminalHistory());
            setProcesses(computer.getProcesses());
        }

        return unsubscribe;
    }, []);

    const boot = useCallback(async () => {
        if (isReady || isBooting) return;
        setIsBooting(true);
        setBootError(null);

        try {
            const computer = computerRef.current;
            const result = await computer.boot((msg) => {
                console.log('[useAgentComputer] Boot:', msg);
            });

            if (result.success) {
                setIsReady(true);
                const newStatus = await computer.getStatus();
                setStatus(newStatus);
            } else {
                setBootError(result.message);
            }
        } catch (error) {
            setBootError(error instanceof Error ? error.message : String(error));
        } finally {
            setIsBooting(false);
        }
    }, [isReady, isBooting]);

    const executePython = useCallback(async (code: string, options?: ExecutionOptions) => {
        const computer = computerRef.current;
        if (!computer.isReady) await computer.boot();
        return computer.executePython(code, options);
    }, []);

    const executeJavaScript = useCallback(async (code: string, options?: ExecutionOptions) => {
        const computer = computerRef.current;
        if (!computer.isReady) await computer.boot();
        return computer.executeJavaScript(code, options);
    }, []);

    const executeShell = useCallback(async (command: string) => {
        const computer = computerRef.current;
        if (!computer.isReady) await computer.boot();
        return computer.executeShell(command);
    }, []);

    const readFile = useCallback(async (path: string) => {
        return computerRef.current.readFile(path);
    }, []);

    const writeFile = useCallback(async (path: string, content: string) => {
        return computerRef.current.writeFile(path, content);
    }, []);

    const listFiles = useCallback(async (dir?: string) => {
        return computerRef.current.listFiles(dir);
    }, []);

    const deleteFile = useCallback(async (path: string) => {
        return computerRef.current.deleteFile(path);
    }, []);

    const fetchUrl = useCallback(async (url: string) => {
        return computerRef.current.fetchUrl(url);
    }, []);

    const killProcess = useCallback((id: string) => {
        computerRef.current.killProcess(id);
    }, []);

    const clearTerminal = useCallback(() => {
        computerRef.current.clearTerminal();
    }, []);

    const refreshStatus = useCallback(async () => {
        const newStatus = await computerRef.current.getStatus();
        setStatus(newStatus);
    }, []);

    const runningProcesses = useMemo(
        () => processes.filter(p => p.status === 'running'),
        [processes]
    );

    const state: AgentComputerState = useMemo(() => ({
        isReady, isBooting, status, terminalHistory,
        processes, runningProcesses, lastEvent, bootError,
    }), [isReady, isBooting, status, terminalHistory, processes, runningProcesses, lastEvent, bootError]);

    const actions: AgentComputerActions = useMemo(() => ({
        boot, executePython, executeJavaScript, executeShell,
        readFile, writeFile, listFiles, deleteFile,
        fetchUrl, killProcess, clearTerminal, refreshStatus,
    }), [boot, executePython, executeJavaScript, executeShell,
        readFile, writeFile, listFiles, deleteFile,
        fetchUrl, killProcess, clearTerminal, refreshStatus]);

    return [state, actions];
}

export default useAgentComputer;
