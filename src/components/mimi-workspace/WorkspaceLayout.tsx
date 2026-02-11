/**
 * MIMI Tech AI - Workspace Layout Component
 * 
 * Main layout for MIMI Workspace with resizable panels.
 * Combines File Browser, Code Editor, and Terminal.
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 * https://mimitechai.com
 */

'use client';

import React, { useState, useCallback } from 'react';
import { FileBrowser } from './FileBrowser';
import { CodeEditor } from './CodeEditor';
import { Terminal } from './Terminal';
import { useWorkspace } from '@/hooks/useWorkspace';
import type { FileEntry } from '@/lib/mimi/workspace';

interface WorkspaceLayoutProps {
    className?: string;
}

type Panel = 'files' | 'editor' | 'terminal' | 'chat';

/**
 * MIMI Tech AI - Workspace Layout
 */
export function WorkspaceLayout({ className = '' }: WorkspaceLayoutProps) {
    const workspace = useWorkspace();
    const [activePanel, setActivePanel] = useState<Panel>('editor');
    const [showTerminal, setShowTerminal] = useState(true);
    const [showFiles, setShowFiles] = useState(true);
    const [sidebarWidth, setSidebarWidth] = useState(250);
    const [terminalHeight, setTerminalHeight] = useState(200);

    // Handle file selection
    const handleFileSelect = useCallback(async (file: FileEntry) => {
        if (!file.isDirectory) {
            await workspace.openFile(file.path);
        }
    }, [workspace]);

    // Handle content changes
    const handleContentChange = useCallback((content: string) => {
        workspace.setContent(content);
    }, [workspace]);

    // Handle save
    const handleSave = useCallback(async () => {
        try {
            await workspace.saveFile();
        } catch (error) {
            console.error('[Workspace] Save failed:', error);
        }
    }, [workspace]);

    // Handle terminal command
    const handleTerminalCommand = useCallback(async (command: string): Promise<string> => {
        const parts = command.trim().split(/\s+/);
        const cmd = parts[0];
        const args = parts.slice(1);

        // ls command
        if (cmd === 'ls') {
            const path = args[0] || '/workspace';
            try {
                const entries = await workspace.listDirectory(path);
                return entries.map(e => {
                    if (e.isDirectory) {
                        return `\x1b[1;34m${e.name}/\x1b[0m`;
                    }
                    return e.name;
                }).join('  ');
            } catch {
                return `\x1b[31mls: cannot access '${path}': No such directory\x1b[0m`;
            }
        }

        // cat command
        if (cmd === 'cat') {
            if (!args[0]) {
                return '\x1b[31mcat: missing file operand\x1b[0m';
            }
            try {
                const { getMimiFilesystem } = await import('@/lib/mimi/workspace');
                const fs = getMimiFilesystem();
                const content = await fs.readFile(args[0]);
                return content;
            } catch {
                return `\x1b[31mcat: ${args[0]}: No such file\x1b[0m`;
            }
        }

        // python command (placeholder)
        if (cmd === 'python') {
            return '\x1b[33mPython support coming in Phase 2...\x1b[0m';
        }

        // node command (placeholder)
        if (cmd === 'node') {
            return '\x1b[33mNode.js support coming in Phase 2...\x1b[0m';
        }

        return '';
    }, [workspace]);

    // Loading state
    if (workspace.loading && !workspace.initialized) {
        return (
            <div className={`flex items-center justify-center h-full bg-gray-900 ${className}`}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Initializing MIMI Workspace...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (workspace.error) {
        return (
            <div className={`flex items-center justify-center h-full bg-gray-900 ${className}`}>
                <div className="text-center p-8 bg-gray-800 rounded-lg max-w-md">
                    <div className="text-red-500 text-4xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-white mb-2">Initialization Error</h2>
                    <p className="text-gray-400 mb-4">{workspace.error}</p>
                    <p className="text-sm text-gray-500 mb-4">
                        OPFS requires a modern browser (Chrome 86+, Edge 86+, Firefox 111+)
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex h-full bg-gray-900 ${className}`}>
            {/* Sidebar Toggle */}
            <button
                onClick={() => setShowFiles(!showFiles)}
                className="absolute top-2 left-2 z-10 p-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                title={showFiles ? 'Hide Files' : 'Show Files'}
            >
                📁
            </button>

            {/* File Browser Sidebar */}
            {showFiles && (
                <div
                    style={{ width: sidebarWidth }}
                    className="flex-shrink-0 border-r border-gray-700"
                >
                    <FileBrowser
                        basePath="/workspace"
                        onFileSelect={handleFileSelect}
                        className="h-full"
                    />
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Editor Area */}
                <div className="flex-1 min-h-0">
                    {workspace.currentFile ? (
                        <CodeEditor
                            value={workspace.currentContent}
                            filename={workspace.currentFile.name}
                            onChange={handleContentChange}
                            onSave={handleSave}
                            className="h-full"
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <div className="text-6xl mb-4">📝</div>
                                <h2 className="text-xl mb-2">No File Open</h2>
                                <p className="text-sm">Select a file from the sidebar to edit</p>
                                <p className="text-sm mt-4 text-gray-600">
                                    or use the terminal below to create one
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Dirty indicator */}
                {workspace.isDirty && (
                    <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-yellow-600/20 text-yellow-400 text-xs rounded">
                        Unsaved Changes
                    </div>
                )}

                {/* Terminal Toggle */}
                <button
                    onClick={() => setShowTerminal(!showTerminal)}
                    className="w-full py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm border-t border-gray-700 transition-colors"
                >
                    {showTerminal ? '▼ Hide Terminal' : '▲ Show Terminal'}
                </button>

                {/* Terminal */}
                {showTerminal && (
                    <div style={{ height: terminalHeight }} className="flex-shrink-0 border-t border-gray-700">
                        <Terminal
                            onCommand={handleTerminalCommand}
                            className="h-full"
                        />
                    </div>
                )}
            </div>

            {/* Status Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gray-800 border-t border-gray-700 flex items-center justify-between px-3 text-xs text-gray-500 z-10">
                <div className="flex items-center gap-4">
                    <span>MIMI Workspace v1.0.0-alpha</span>
                    {workspace.currentFile && (
                        <span>{workspace.currentFile.path}</span>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-green-400">● Ready</span>
                    <span>© 2026 MIMI Tech AI</span>
                </div>
            </div>
        </div>
    );
}

export default WorkspaceLayout;
