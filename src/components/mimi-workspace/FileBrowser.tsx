/**
 * MIMI Tech AI - File Browser Component
 * 
 * Visual file tree for workspace navigation.
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 * https://mimitechai.com
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getMimiFilesystem, type FileEntry } from '@/lib/mimi/workspace';

interface FileBrowserProps {
    basePath?: string;
    onFileSelect?: (file: FileEntry) => void;
    onFileCreate?: (path: string) => void;
    onFileDelete?: (path: string) => void;
    className?: string;
}

interface TreeNode extends FileEntry {
    children?: TreeNode[];
    expanded?: boolean;
}

/**
 * MIMI Tech AI - File Browser
 */
export function FileBrowser({
    basePath = '/workspace',
    onFileSelect,
    onFileCreate,
    onFileDelete,
    className = ''
}: FileBrowserProps) {
    const [tree, setTree] = useState<TreeNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        node: TreeNode;
    } | null>(null);

    const fs = getMimiFilesystem();

    // Load file tree
    const loadTree = useCallback(async (path: string): Promise<TreeNode[]> => {
        try {
            const entries = await fs.listDirectory(path);
            return entries.map(entry => ({
                ...entry,
                expanded: false,
                children: entry.isDirectory ? undefined : undefined
            }));
        } catch {
            return [];
        }
    }, [fs]);

    // Initial load
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                // Ensure filesystem is initialized
                await fs.initialize();
                const nodes = await loadTree(basePath);
                setTree(nodes);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load files');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [basePath, fs, loadTree]);

    // Toggle directory expansion
    const toggleExpand = async (node: TreeNode) => {
        if (!node.isDirectory) return;

        if (!node.expanded && !node.children) {
            // Load children for the first time
            const children = await loadTree(node.path);
            node.children = children;
        }

        node.expanded = !node.expanded;
        setTree([...tree]); // Trigger re-render
    };

    // Handle file selection
    const handleSelect = (node: TreeNode) => {
        setSelectedPath(node.path);
        if (!node.isDirectory && onFileSelect) {
            onFileSelect(node);
        }
    };

    // Handle right-click context menu
    const handleContextMenu = (e: React.MouseEvent, node: TreeNode) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, node });
    };

    // Close context menu
    const closeContextMenu = () => setContextMenu(null);

    // Create new file
    const createNewFile = async (parentPath: string) => {
        const name = prompt('File name:');
        if (!name) return;

        const filePath = `${parentPath}/${name}`;
        await fs.writeFile(filePath, '');

        // Refresh tree
        const nodes = await loadTree(basePath);
        setTree(nodes);

        onFileCreate?.(filePath);
        closeContextMenu();
    };

    // Create new folder
    const createNewFolder = async (parentPath: string) => {
        const name = prompt('Folder name:');
        if (!name) return;

        const folderPath = `${parentPath}/${name}`;
        await fs.createDirectory(folderPath);

        // Refresh tree
        const nodes = await loadTree(basePath);
        setTree(nodes);

        closeContextMenu();
    };

    // Delete file/folder
    const handleDelete = async (node: TreeNode) => {
        const confirmed = confirm(`Delete "${node.name}"?`);
        if (!confirmed) return;

        if (node.isDirectory) {
            await fs.deleteDirectory(node.path);
        } else {
            await fs.deleteFile(node.path);
        }

        // Refresh tree
        const nodes = await loadTree(basePath);
        setTree(nodes);

        onFileDelete?.(node.path);
        closeContextMenu();
    };

    // Render tree node
    const renderNode = (node: TreeNode, depth: number = 0) => {
        const isSelected = selectedPath === node.path;
        const paddingLeft = depth * 16 + 8;

        return (
            <div key={node.path}>
                <div
                    className={`flex items-center py-1 px-2 cursor-pointer hover:bg-gray-700 rounded ${isSelected ? 'bg-blue-900/50 text-blue-300' : ''
                        }`}
                    style={{ paddingLeft }}
                    onClick={() => {
                        if (node.isDirectory) {
                            toggleExpand(node);
                        } else {
                            handleSelect(node);
                        }
                    }}
                    onContextMenu={(e) => handleContextMenu(e, node)}
                >
                    {/* Icon */}
                    <span className="mr-2 text-sm">
                        {node.isDirectory ? (
                            node.expanded ? '📂' : '📁'
                        ) : (
                            getFileIcon(node.name)
                        )}
                    </span>

                    {/* Name */}
                    <span className="truncate text-sm">{node.name}</span>

                    {/* Size for files */}
                    {!node.isDirectory && node.size !== undefined && (
                        <span className="ml-auto text-xs text-gray-500">
                            {formatSize(node.size)}
                        </span>
                    )}
                </div>

                {/* Children */}
                {node.isDirectory && node.expanded && node.children && (
                    <div>
                        {node.children.map(child => renderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    // Loading state
    if (loading) {
        return (
            <div className={`p-4 text-gray-400 ${className}`}>
                <div className="animate-pulse">Loading workspace...</div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={`p-4 text-red-400 ${className}`}>
                <div>❌ {error}</div>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-2 text-sm text-blue-400 hover:underline"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div
            className={`bg-gray-900 text-gray-200 overflow-auto ${className}`}
            onClick={closeContextMenu}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-2 border-b border-gray-700">
                <span className="text-sm font-semibold text-gray-400">
                    MIMI WORKSPACE
                </span>
                <button
                    onClick={() => createNewFile(basePath)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                    title="New File"
                >
                    + New
                </button>
            </div>

            {/* File Tree */}
            <div className="p-1">
                {tree.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                        No files yet. Create one!
                    </div>
                ) : (
                    tree.map(node => renderNode(node))
                )}
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed bg-gray-800 border border-gray-600 rounded shadow-lg py-1 z-50"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    {contextMenu.node.isDirectory && (
                        <>
                            <button
                                className="w-full px-4 py-1 text-left text-sm hover:bg-gray-700"
                                onClick={() => createNewFile(contextMenu.node.path)}
                            >
                                📄 New File
                            </button>
                            <button
                                className="w-full px-4 py-1 text-left text-sm hover:bg-gray-700"
                                onClick={() => createNewFolder(contextMenu.node.path)}
                            >
                                📁 New Folder
                            </button>
                            <div className="border-t border-gray-600 my-1" />
                        </>
                    )}
                    <button
                        className="w-full px-4 py-1 text-left text-sm text-red-400 hover:bg-gray-700"
                        onClick={() => handleDelete(contextMenu.node)}
                    >
                        🗑️ Delete
                    </button>
                </div>
            )}

            {/* Footer */}
            <div className="p-2 border-t border-gray-700 text-xs text-gray-500 text-center">
                Powered by MIMI Tech AI
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function getFileIcon(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();

    const icons: Record<string, string> = {
        // Code
        ts: '📘',
        tsx: '⚛️',
        js: '📒',
        jsx: '⚛️',
        py: '🐍',

        // Data
        json: '📦',
        yaml: '📋',
        yml: '📋',

        // Documents
        md: '📝',
        txt: '📄',

        // Config
        env: '⚙️',
        config: '⚙️',

        // Images
        png: '🖼️',
        jpg: '🖼️',
        jpeg: '🖼️',
        gif: '🖼️',
        svg: '🎨',

        // Web
        html: '🌐',
        css: '🎨',

        // Other
        zip: '📦',
        sql: '🗃️',
    };

    return icons[ext || ''] || '📄';
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default FileBrowser;
