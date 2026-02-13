/**
 * MIMI Tech AI - Sandbox Hook
 *
 * State management for the intelligent sandbox panel.
 * Opens automatically when MIMI needs to execute code or create files.
 *
 * Consolidated into /hooks/mimi/ namespace for architectural consistency.
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 * https://mimitechai.com
 */

'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { getMimiFilesystem, type FileEntry } from '@/lib/mimi/workspace';
import { getPackageManager, type PackageInfo } from '@/lib/mimi/workspace/services/package-manager';

export interface SandboxFile {
    path: string;
    name: string;
    content: string;
    language: string;
    isNew?: boolean;
}

export interface TerminalLine {
    id: string;
    text: string;
    type: 'input' | 'output' | 'error' | 'info';
    timestamp: Date;
}

export interface SandboxState {
    isOpen: boolean;
    isMinimized: boolean;
    files: SandboxFile[];
    activeFile: string | null;
    terminalLines: TerminalLine[];
    previewUrl: string | null;
    isLoading: boolean;
    agentActivity: string | null;
    packages: PackageInfo[];
}

export interface SandboxActions {
    open: () => void;
    close: () => void;
    toggle: () => void;
    minimize: () => void;
    addFile: (file: SandboxFile) => void;
    updateFile: (path: string, content: string) => void;
    removeFile: (path: string) => void;
    setActiveFile: (path: string | null) => void;
    addTerminalLine: (text: string, type: TerminalLine['type']) => void;
    clearTerminal: () => void;
    setPreviewUrl: (url: string | null) => void;
    setAgentActivity: (activity: string | null) => void;
    syncWithFilesystem: () => Promise<void>;
    installPackage: (name: string) => Promise<void>;
}

const LANGUAGE_MAP: Record<string, string> = {
    '.py': 'python',
    '.js': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescriptreact',
    '.jsx': 'javascriptreact',
    '.html': 'html',
    '.css': 'css',
    '.json': 'json',
    '.md': 'markdown',
    '.sql': 'sql',
    '.sh': 'shell',
    '.yml': 'yaml',
    '.yaml': 'yaml',
};

function getLanguage(filename: string): string {
    const ext = filename.slice(filename.lastIndexOf('.'));
    return LANGUAGE_MAP[ext] || 'plaintext';
}

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Hook for managing the MIMI Sandbox state
 */
export function useSandbox(): [SandboxState, SandboxActions] {
    const [state, setState] = useState<SandboxState>({
        isOpen: false,
        isMinimized: false,
        files: [],
        activeFile: null,
        terminalLines: [],
        previewUrl: null,
        isLoading: false,
        agentActivity: null,
        packages: [],
    });

    const filesystemRef = useRef<ReturnType<typeof getMimiFilesystem> | null>(null);
    const packageManagerRef = useRef<ReturnType<typeof getPackageManager> | null>(null);

    // Initialize services
    useEffect(() => {
        const initServices = async () => {
            try {
                const fs = getMimiFilesystem();
                await fs.initialize();
                filesystemRef.current = fs;

                const pm = getPackageManager();
                packageManagerRef.current = pm;
                setState(prev => ({ ...prev, packages: pm.getAllPackages() }));
            } catch (error) {
                console.error('[Sandbox] Init failed:', error);
            }
        };
        initServices();
    }, []);

    const open = useCallback(() => {
        setState(prev => ({ ...prev, isOpen: true, isMinimized: false }));
    }, []);

    const close = useCallback(() => {
        setState(prev => ({ ...prev, isOpen: false }));
    }, []);

    const toggle = useCallback(() => {
        setState(prev => ({ ...prev, isOpen: !prev.isOpen, isMinimized: false }));
    }, []);

    const minimize = useCallback(() => {
        setState(prev => ({ ...prev, isMinimized: !prev.isMinimized }));
    }, []);

    const addFile = useCallback(async (file: SandboxFile) => {
        setState(prev => {
            const exists = prev.files.some(f => f.path === file.path);
            if (exists) {
                return {
                    ...prev,
                    files: prev.files.map(f => f.path === file.path ? { ...file, isNew: false } : f),
                    activeFile: file.path,
                    isOpen: true,
                };
            }
            return {
                ...prev,
                files: [...prev.files, { ...file, isNew: true }],
                activeFile: file.path,
                isOpen: true,
            };
        });

        if (filesystemRef.current) {
            try {
                await filesystemRef.current.writeFile(file.path, file.content);
            } catch (error) {
                console.error('[Sandbox] Failed to save file:', error);
            }
        }
    }, []);

    const updateFile = useCallback(async (path: string, content: string) => {
        setState(prev => ({
            ...prev,
            files: prev.files.map(f => f.path === path ? { ...f, content } : f),
        }));

        if (filesystemRef.current) {
            try {
                await filesystemRef.current.writeFile(path, content);
            } catch (error) {
                console.error('[Sandbox] Failed to update file:', error);
            }
        }
    }, []);

    const removeFile = useCallback(async (path: string) => {
        setState(prev => ({
            ...prev,
            files: prev.files.filter(f => f.path !== path),
            activeFile: prev.activeFile === path ? null : prev.activeFile,
        }));

        if (filesystemRef.current) {
            try {
                await filesystemRef.current.deleteFile(path);
            } catch (error) {
                console.error('[Sandbox] Failed to delete file:', error);
            }
        }
    }, []);

    const setActiveFile = useCallback((path: string | null) => {
        setState(prev => ({ ...prev, activeFile: path }));
    }, []);

    const addTerminalLine = useCallback((text: string, type: TerminalLine['type']) => {
        const line: TerminalLine = {
            id: generateId(),
            text,
            type,
            timestamp: new Date(),
        };
        setState(prev => ({
            ...prev,
            terminalLines: [...prev.terminalLines.slice(-100), line],
            isOpen: true,
        }));
    }, []);

    const clearTerminal = useCallback(() => {
        setState(prev => ({ ...prev, terminalLines: [] }));
    }, []);

    const setPreviewUrl = useCallback((url: string | null) => {
        setState(prev => ({ ...prev, previewUrl: url, isOpen: url !== null }));
    }, []);

    const setAgentActivity = useCallback((activity: string | null) => {
        setState(prev => ({
            ...prev,
            agentActivity: activity,
            isOpen: activity !== null ? true : prev.isOpen,
        }));
    }, []);

    const syncWithFilesystem = useCallback(async () => {
        if (!filesystemRef.current) return;

        setState(prev => ({ ...prev, isLoading: true }));

        try {
            const entries = await filesystemRef.current.listDirectory('/workspace');
            const files: SandboxFile[] = [];

            for (const entry of entries) {
                if (!entry.isDirectory) {
                    try {
                        const content = await filesystemRef.current.readFile(entry.path);
                        files.push({
                            path: entry.path,
                            name: entry.name,
                            content,
                            language: getLanguage(entry.name),
                        });
                    } catch {
                        // Skip files that can't be read
                    }
                }
            }

            setState(prev => ({
                ...prev,
                files,
                isLoading: false,
            }));
        } catch (error) {
            console.error('[Sandbox] Sync failed:', error);
            setState(prev => ({ ...prev, isLoading: false }));
        }
    }, []);

    const installPackageAction = useCallback(async (name: string) => {
        if (!packageManagerRef.current) return;

        addTerminalLine(`Installing ${name}...`, 'info');
        setState(prev => ({ ...prev, isLoading: true }));

        try {
            const success = await packageManagerRef.current.install(name, (msg) => {
                addTerminalLine(msg, 'info');
            });

            if (success) {
                addTerminalLine(`Successfully installed ${name}`, 'output');
                setState(prev => ({
                    ...prev,
                    packages: packageManagerRef.current!.getAllPackages(),
                    isLoading: false
                }));
            } else {
                addTerminalLine(`Failed to install ${name}`, 'error');
                setState(prev => ({ ...prev, isLoading: false }));
            }
        } catch (error) {
            addTerminalLine(`Error installing ${name}: ${error}`, 'error');
            setState(prev => ({ ...prev, isLoading: false }));
        }
    }, [addTerminalLine]);

    const actions: SandboxActions = useMemo(() => ({
        open,
        close,
        toggle,
        minimize,
        addFile,
        updateFile,
        removeFile,
        setActiveFile,
        addTerminalLine,
        clearTerminal,
        setPreviewUrl,
        setAgentActivity,
        syncWithFilesystem,
        installPackage: installPackageAction,
    }), [
        open, close, toggle, minimize,
        addFile, updateFile, removeFile, setActiveFile,
        addTerminalLine, clearTerminal, setPreviewUrl,
        setAgentActivity, syncWithFilesystem, installPackageAction,
    ]);

    return [state, actions];
}

export type { FileEntry };
export default useSandbox;
