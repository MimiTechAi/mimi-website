/**
 * MIMI Tech AI - useWorkspace Hook
 * 
 * React hook for workspace operations.
 * Provides easy access to filesystem and workspace state.
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 * https://mimitechai.com
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getMimiFilesystem,
    initializeMimiWorkspace,
    type FileEntry
} from '@/lib/mimi/workspace';

interface WorkspaceState {
    initialized: boolean;
    loading: boolean;
    error: string | null;
    currentFile: FileEntry | null;
    currentContent: string;
    isDirty: boolean;
}

interface UseWorkspaceReturn extends WorkspaceState {
    // File operations
    openFile: (path: string) => Promise<void>;
    saveFile: (path?: string, content?: string) => Promise<void>;
    createFile: (path: string, content?: string) => Promise<void>;
    deleteFile: (path: string) => Promise<void>;

    // Content operations
    setContent: (content: string) => void;

    // Directory operations
    listDirectory: (path: string) => Promise<FileEntry[]>;
    createDirectory: (path: string) => Promise<void>;

    // Utility
    refresh: () => Promise<void>;
    getStorageInfo: () => Promise<{ used: number; quota: number; percent: number }>;
}

/**
 * useWorkspace - React hook for MIMI Workspace
 */
export function useWorkspace(): UseWorkspaceReturn {
    const [state, setState] = useState<WorkspaceState>({
        initialized: false,
        loading: true,
        error: null,
        currentFile: null,
        currentContent: '',
        isDirty: false
    });

    const fs = getMimiFilesystem();

    // Initialize workspace
    useEffect(() => {
        const init = async () => {
            setState(s => ({ ...s, loading: true }));

            try {
                const result = await initializeMimiWorkspace();

                if (result.success) {
                    setState(s => ({
                        ...s,
                        initialized: true,
                        loading: false,
                        error: null
                    }));
                    console.log('[useWorkspace] ✅ Workspace ready');
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                setState(s => ({
                    ...s,
                    loading: false,
                    error: error instanceof Error ? error.message : 'Initialization failed'
                }));
                console.error('[useWorkspace] ❌ Init failed:', error);
            }
        };

        init();
    }, []);

    // Open file
    const openFile = useCallback(async (path: string) => {
        setState(s => ({ ...s, loading: true }));

        try {
            const content = await fs.readFile(path);
            const info = await fs.getInfo(path);

            setState(s => ({
                ...s,
                loading: false,
                currentFile: info,
                currentContent: content,
                isDirty: false,
                error: null
            }));

            console.log(`[useWorkspace] Opened: ${path}`);
        } catch (error) {
            setState(s => ({
                ...s,
                loading: false,
                error: `Failed to open ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`
            }));
        }
    }, [fs]);

    // Save file
    const saveFile = useCallback(async (path?: string, content?: string) => {
        const targetPath = path || state.currentFile?.path;
        const targetContent = content ?? state.currentContent;

        if (!targetPath) {
            throw new Error('No file to save');
        }

        setState(s => ({ ...s, loading: true }));

        try {
            await fs.writeFile(targetPath, targetContent);

            setState(s => ({
                ...s,
                loading: false,
                isDirty: false,
                error: null
            }));

            console.log(`[useWorkspace] Saved: ${targetPath}`);
        } catch (error) {
            setState(s => ({
                ...s,
                loading: false,
                error: `Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`
            }));
            throw error;
        }
    }, [fs, state.currentFile?.path, state.currentContent]);

    // Create file
    const createFile = useCallback(async (path: string, content: string = '') => {
        await fs.writeFile(path, content);
        console.log(`[useWorkspace] Created: ${path}`);
    }, [fs]);

    // Delete file
    const deleteFile = useCallback(async (path: string) => {
        await fs.deleteFile(path);

        // Clear current file if it was deleted
        if (state.currentFile?.path === path) {
            setState(s => ({
                ...s,
                currentFile: null,
                currentContent: '',
                isDirty: false
            }));
        }

        console.log(`[useWorkspace] Deleted: ${path}`);
    }, [fs, state.currentFile?.path]);

    // Set content (marks as dirty)
    const setContent = useCallback((content: string) => {
        setState(s => ({
            ...s,
            currentContent: content,
            isDirty: s.currentContent !== content
        }));
    }, []);

    // List directory
    const listDirectory = useCallback(async (path: string): Promise<FileEntry[]> => {
        return await fs.listDirectory(path);
    }, [fs]);

    // Create directory
    const createDirectory = useCallback(async (path: string) => {
        await fs.createDirectory(path);
        console.log(`[useWorkspace] Created directory: ${path}`);
    }, [fs]);

    // Refresh current file
    const refresh = useCallback(async () => {
        if (state.currentFile) {
            await openFile(state.currentFile.path);
        }
    }, [state.currentFile, openFile]);

    // Get storage info
    const getStorageInfo = useCallback(async () => {
        return await fs.getStorageUsage();
    }, [fs]);

    return {
        ...state,
        openFile,
        saveFile,
        createFile,
        deleteFile,
        setContent,
        listDirectory,
        createDirectory,
        refresh,
        getStorageInfo
    };
}

export default useWorkspace;
