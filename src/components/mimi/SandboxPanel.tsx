/**
 * MIMI Tech AI - Intelligent Sandbox Panel
 * 
 * Auto-opening panel that appears next to chat when MIMI
 * needs to execute code, create files, or perform tasks.
 * 
 * Inspired by Manus/Genspark approach - agent works in sandbox
 * while user watches in real-time.
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 * https://mimitechai.com
 */

'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    X,
    ChevronRight,
    ChevronDown,
    FileCode,
    Folder,
    FolderOpen,
    Terminal as TerminalIcon,
    Eye,
    Maximize2,
    Minimize2,
    RefreshCw,
    Copy,
    Check,
    Play,
    Loader2,
    Package,
    Database,
    ListChecks,
    Monitor,
    Tablet,
    Smartphone,
    RotateCcw,
    Globe,
    Sparkles
} from 'lucide-react';
import type { SandboxState, SandboxActions, SandboxFile, TerminalLine } from '@/hooks/useSandbox';
import type { PackageInfo } from '@/lib/mimi/workspace/services/package-manager';
import { getMimiSQLite, type QueryResult } from '@/lib/mimi/workspace/services/database';
import AgentStepsPanel from './components/AgentStepsPanel';
import type { UITaskPlan } from '@/hooks/mimi/useAgentEvents';

interface SandboxPanelProps {
    state: SandboxState;
    actions: SandboxActions;
    className?: string;
    // Agent plan integration
    agentPlan?: UITaskPlan | null;
    agentElapsedTime?: number;
    agentStatus?: string;
    activeAgent?: string | null;
    // File activity from agent events
    recentFiles?: { path: string; action: 'create' | 'update' | 'delete'; timestamp: number }[];
}

type TabType = 'steps' | 'files' | 'terminal' | 'preview' | 'packages' | 'database';

/**
 * MIMI Tech AI - Sandbox Panel
 */
export function SandboxPanel({
    state, actions, className = '',
    agentPlan, agentElapsedTime = 0, agentStatus = 'idle', activeAgent,
    recentFiles = []
}: SandboxPanelProps) {
    const [activeTab, setActiveTab] = useState<TabType>(agentPlan ? 'steps' : 'files');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/workspace']));
    const [copied, setCopied] = useState<string | null>(null);
    const terminalEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll terminal
    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [state.terminalLines]);

    // Auto-switch to steps tab when agent starts planning
    useEffect(() => {
        if (agentPlan && activeTab !== 'steps') {
            setActiveTab('steps');
        }
    }, [agentPlan, activeTab]);

    // Auto-switch to terminal when there's activity (only if not in steps)
    useEffect(() => {
        if (state.terminalLines.length > 0 && activeTab !== 'terminal' && activeTab !== 'steps') {
            setActiveTab('terminal');
        }
    }, [state.terminalLines.length, activeTab]);

    // Don't render if not open
    if (!state.isOpen) {
        return null;
    }

    // Group files by folder
    const fileTree = buildFileTree(state.files);

    const handleCopy = async (content: string, id: string) => {
        await navigator.clipboard.writeText(content);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const toggleFolder = (path: string) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    };

    // Minimized state
    if (state.isMinimized) {
        return (
            <div
                className={`fixed bottom-4 right-4 z-50 cursor-pointer ${className}`}
                onClick={actions.minimize}
            >
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/90 backdrop-blur-xl border border-cyan-500/30 rounded-full shadow-lg shadow-cyan-500/20">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                    <span className="text-sm text-white font-medium">MIMI Sandbox</span>
                    {state.agentActivity && (
                        <span className="text-xs text-cyan-400">{state.agentActivity}</span>
                    )}
                    <Maximize2 className="w-4 h-4 text-gray-400" />
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col h-full bg-slate-900/95 backdrop-blur-xl border-l border-cyan-500/20 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                        <span className="text-sm font-semibold text-white">MIMI Sandbox</span>
                    </div>
                    {state.agentActivity && (
                        <span className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full">
                            {state.agentActivity}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => actions.syncWithFilesystem()}
                        className="p-1.5 hover:bg-slate-700 rounded-md transition-colors"
                        title="Sync Files"
                    >
                        <RefreshCw className={`w-4 h-4 text-gray-400 ${state.isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={actions.minimize}
                        className="p-1.5 hover:bg-slate-700 rounded-md transition-colors"
                        title="Minimize"
                    >
                        <Minimize2 className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                        onClick={actions.close}
                        className="p-1.5 hover:bg-slate-700 rounded-md transition-colors"
                        title="Close"
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-700/50 overflow-x-auto">
                <TabButton
                    active={activeTab === 'steps'}
                    onClick={() => setActiveTab('steps')}
                    icon={<ListChecks className="w-4 h-4" />}
                    label="Steps"
                    badge={agentPlan ? agentPlan.steps.filter(s => s.status === 'done').length || undefined : undefined}
                />
                <TabButton
                    active={activeTab === 'files'}
                    onClick={() => setActiveTab('files')}
                    icon={<FileCode className="w-4 h-4" />}
                    label="Code"
                    badge={state.files.length || undefined}
                />
                <TabButton
                    active={activeTab === 'terminal'}
                    onClick={() => setActiveTab('terminal')}
                    icon={<TerminalIcon className="w-4 h-4" />}
                    label="Terminal"
                    badge={state.terminalLines.length > 0 ? '•' : undefined}
                />
                <TabButton
                    active={activeTab === 'preview'}
                    onClick={() => setActiveTab('preview')}
                    icon={<Eye className="w-4 h-4" />}
                    label="Preview"
                />
                <TabButton
                    active={activeTab === 'packages'}
                    onClick={() => setActiveTab('packages')}
                    icon={<Package className="w-4 h-4" />}
                    label="Packages"
                    badge={state.packages?.filter(p => p.installed).length}
                />
                <TabButton
                    active={activeTab === 'database'}
                    onClick={() => setActiveTab('database')}
                    icon={<Database className="w-4 h-4" />}
                    label="Database"
                />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'steps' && (
                    <AgentStepsPanel
                        plan={agentPlan || null}
                        elapsedTime={agentElapsedTime}
                        agentStatus={agentStatus}
                        activeAgent={activeAgent}
                    />
                )}
                {activeTab === 'files' && (
                    <FilesTab
                        files={state.files}
                        fileTree={fileTree}
                        activeFile={state.activeFile}
                        expandedFolders={expandedFolders}
                        onSelectFile={actions.setActiveFile}
                        onToggleFolder={toggleFolder}
                        onCopy={handleCopy}
                        copied={copied}
                    />
                )}
                {activeTab === 'terminal' && (
                    <TerminalTab
                        lines={state.terminalLines}
                        endRef={terminalEndRef}
                        onClear={actions.clearTerminal}
                    />
                )}
                {activeTab === 'preview' && (
                    <PreviewTab url={state.previewUrl} files={state.files} />
                )}
                {activeTab === 'packages' && (
                    <PackagesTab
                        packages={state.packages || []}
                        onInstall={actions.installPackage}
                        isLoading={state.isLoading}
                    />
                )}
                {activeTab === 'database' && (
                    <DatabaseTab />
                )}
            </div>

            {/* Footer */}
            <div className="px-3 py-1.5 border-t border-slate-700/50 bg-slate-800/30 text-xs text-gray-500 flex justify-between">
                <span>Powered by MIMI Tech AI</span>
                <span>{state.files.length} files</span>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function TabButton({
    active,
    onClick,
    icon,
    label,
    badge,
    disabled = false
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    badge?: string | number;
    disabled?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                flex items-center gap-2 px-4 py-2 text-sm transition-colors
                ${active
                    ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-800/30'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800/20'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
        >
            {icon}
            {label}
            {badge && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-full">
                    {badge}
                </span>
            )}
        </button>
    );
}

interface FileTreeNode {
    name: string;
    path: string;
    isFolder: boolean;
    children: FileTreeNode[];
    file?: SandboxFile;
}

function buildFileTree(files: SandboxFile[]): FileTreeNode[] {
    const root: FileTreeNode[] = [];

    for (const file of files) {
        const parts = file.path.split('/').filter(Boolean);
        let current = root;

        for (let i = 0; i < parts.length - 1; i++) {
            const folderName = parts[i];
            const folderPath = '/' + parts.slice(0, i + 1).join('/');

            let folder = current.find(n => n.name === folderName && n.isFolder);
            if (!folder) {
                folder = { name: folderName, path: folderPath, isFolder: true, children: [] };
                current.push(folder);
            }
            current = folder.children;
        }

        current.push({
            name: file.name,
            path: file.path,
            isFolder: false,
            children: [],
            file,
        });
    }

    return root;
}

function FilesTab({
    files,
    fileTree,
    activeFile,
    expandedFolders,
    onSelectFile,
    onToggleFolder,
    onCopy,
    copied,
}: {
    files: SandboxFile[];
    fileTree: FileTreeNode[];
    activeFile: string | null;
    expandedFolders: Set<string>;
    onSelectFile: (path: string | null) => void;
    onToggleFolder: (path: string) => void;
    onCopy: (content: string, id: string) => void;
    copied: string | null;
}) {
    const activeFileData = files.find(f => f.path === activeFile);

    return (
        <div className="flex h-full">
            {/* File Tree */}
            <div className="w-48 border-r border-slate-700/50 overflow-y-auto">
                <div className="p-2">
                    {fileTree.length === 0 ? (
                        <div className="text-center text-gray-500 text-xs py-4">
                            No files yet
                        </div>
                    ) : (
                        <FileTreeView
                            nodes={fileTree}
                            expandedFolders={expandedFolders}
                            activeFile={activeFile}
                            onSelectFile={onSelectFile}
                            onToggleFolder={onToggleFolder}
                            depth={0}
                        />
                    )}
                </div>
            </div>

            {/* File Content */}
            <div className="flex-1 overflow-hidden">
                {activeFileData ? (
                    <div className="h-full flex flex-col">
                        <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50 border-b border-slate-700/50">
                            <div className="flex items-center gap-2">
                                <FileCode className="w-4 h-4 text-cyan-400" />
                                <span className="text-sm text-white">{activeFileData.name}</span>
                                {activeFileData.isNew && (
                                    <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">NEW</span>
                                )}
                            </div>
                            <button
                                onClick={() => onCopy(activeFileData.content, activeFileData.path)}
                                className="p-1 hover:bg-slate-700 rounded transition-colors"
                            >
                                {copied === activeFileData.path ? (
                                    <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                    <Copy className="w-4 h-4 text-gray-400" />
                                )}
                            </button>
                        </div>
                        <pre className="flex-1 overflow-auto p-3 text-sm font-mono text-gray-300 bg-slate-900/50">
                            <code>{activeFileData.content}</code>
                        </pre>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                        Select a file to view
                    </div>
                )}
            </div>
        </div>
    );
}

function FileTreeView({
    nodes,
    expandedFolders,
    activeFile,
    onSelectFile,
    onToggleFolder,
    depth,
}: {
    nodes: FileTreeNode[];
    expandedFolders: Set<string>;
    activeFile: string | null;
    onSelectFile: (path: string | null) => void;
    onToggleFolder: (path: string) => void;
    depth: number;
}) {
    return (
        <>
            {nodes.map(node => (
                <div key={node.path}>
                    <button
                        onClick={() => node.isFolder ? onToggleFolder(node.path) : onSelectFile(node.path)}
                        className={`
                            w-full flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors
                            ${activeFile === node.path
                                ? 'bg-cyan-500/20 text-cyan-400'
                                : 'hover:bg-slate-700/50 text-gray-400'
                            }
                        `}
                        style={{ paddingLeft: `${8 + depth * 12}px` }}
                    >
                        {node.isFolder ? (
                            <>
                                {expandedFolders.has(node.path)
                                    ? <ChevronDown className="w-3 h-3" />
                                    : <ChevronRight className="w-3 h-3" />
                                }
                                {expandedFolders.has(node.path)
                                    ? <FolderOpen className="w-3.5 h-3.5 text-yellow-400" />
                                    : <Folder className="w-3.5 h-3.5 text-yellow-400" />
                                }
                            </>
                        ) : (
                            <>
                                <span className="w-3" />
                                <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                            </>
                        )}
                        <span className="truncate">{node.name}</span>
                        {node.file?.isNew && (
                            <span className="ml-auto w-1.5 h-1.5 bg-green-400 rounded-full" />
                        )}
                    </button>
                    {node.isFolder && expandedFolders.has(node.path) && node.children.length > 0 && (
                        <FileTreeView
                            nodes={node.children}
                            expandedFolders={expandedFolders}
                            activeFile={activeFile}
                            onSelectFile={onSelectFile}
                            onToggleFolder={onToggleFolder}
                            depth={depth + 1}
                        />
                    )}
                </div>
            ))}
        </>
    );
}

function TerminalTab({
    lines,
    endRef,
    onClear,
}: {
    lines: TerminalLine[];
    endRef: React.RefObject<HTMLDivElement | null>;
    onClear: () => void;
}) {
    return (
        <div className="h-full flex flex-col bg-slate-950">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/50 border-b border-slate-700/50">
                <span className="text-xs text-gray-400">Agent Activity</span>
                <button
                    onClick={onClear}
                    className="text-xs text-gray-500 hover:text-white"
                >
                    Clear
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 font-mono text-xs">
                {lines.length === 0 ? (
                    <div className="text-gray-600">Waiting for agent activity...</div>
                ) : (
                    lines.map(line => (
                        <div
                            key={line.id}
                            className={`
                                py-0.5
                                ${line.type === 'input' ? 'text-cyan-400' : ''}
                                ${line.type === 'output' ? 'text-gray-300' : ''}
                                ${line.type === 'error' ? 'text-red-400' : ''}
                                ${line.type === 'info' ? 'text-yellow-400' : ''}
                            `}
                        >
                            {line.type === 'input' && <span className="text-green-400">$ </span>}
                            {line.text}
                        </div>
                    ))
                )}
                <div ref={endRef as React.RefObject<HTMLDivElement>} />
            </div>
        </div>
    );
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';
const DEVICE_WIDTHS: Record<DeviceMode, string> = { desktop: '100%', tablet: '768px', mobile: '375px' };

function PreviewTab({ url, files }: { url: string | null; files: SandboxFile[] }) {
    const [device, setDevice] = useState<DeviceMode>('desktop');
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Build blob URL from HTML files in workspace
    const htmlFile = useMemo(() => {
        return files.find(f =>
            f.name.endsWith('.html') || f.language === 'html'
        );
    }, [files]);

    useEffect(() => {
        // Priority: explicit URL > HTML file from workspace
        if (url) {
            setBlobUrl(null);
            return;
        }
        if (htmlFile) {
            let html = htmlFile.content;
            // Inline CSS files into the HTML
            const cssFiles = files.filter(f => f.name.endsWith('.css') || f.language === 'css');
            for (const css of cssFiles) {
                html = html.replace(
                    new RegExp(`<link[^>]*href=["']${css.name.replace('.', '\\.')}["'][^>]*>`, 'gi'),
                    `<style>/* ${css.name} */\n${css.content}</style>`
                );
                // If no link tag found, inject before </head>
                if (!html.includes(css.content)) {
                    html = html.replace('</head>', `<style>/* ${css.name} */\n${css.content}</style>\n</head>`);
                }
            }
            // Inline JS files
            const jsFiles = files.filter(f => f.name.endsWith('.js') || f.language === 'javascript');
            for (const js of jsFiles) {
                html = html.replace(
                    new RegExp(`<script[^>]*src=["']${js.name.replace('.', '\\.')}["'][^>]*>\\s*</script>`, 'gi'),
                    `<script>/* ${js.name} */\n${js.content}</script>`
                );
            }
            const blob = new Blob([html], { type: 'text/html' });
            const newUrl = URL.createObjectURL(blob);
            setBlobUrl(prev => {
                if (prev) URL.revokeObjectURL(prev);
                return newUrl;
            });
        } else {
            setBlobUrl(prev => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
        }
        return () => {
            // Cleanup handled by state setter
        };
    }, [url, htmlFile, files]);

    const handleRefresh = useCallback(() => {
        if (iframeRef.current) {
            const src = iframeRef.current.src;
            iframeRef.current.src = '';
            setTimeout(() => {
                if (iframeRef.current) iframeRef.current.src = src;
            }, 50);
        }
    }, []);

    const previewSrc = url || blobUrl;

    // No preview available
    if (!previewSrc && !url?.startsWith('data:image/')) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-700/40 flex items-center justify-center">
                    <Globe className="w-8 h-8 text-gray-600" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-medium text-gray-400">No preview available</p>
                    <p className="text-xs mt-1 text-gray-600">Create an HTML file to see a live preview</p>
                </div>
            </div>
        );
    }

    // Image preview
    if (url?.startsWith('data:image/')) {
        return (
            <div className="h-full bg-slate-900 flex items-center justify-center p-4">
                <img src={url} alt="Preview" className="max-w-full max-h-full object-contain rounded border border-slate-700 shadow-lg" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-950">
            {/* Device toolbar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/60 border-b border-slate-700/40">
                <div className="flex items-center gap-1">
                    {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([mode, Icon]) => (
                        <button
                            key={mode}
                            onClick={() => setDevice(mode)}
                            className={`p-1.5 rounded transition-colors ${device === mode
                                    ? 'bg-cyan-500/20 text-cyan-400'
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-slate-700/40'
                                }`}
                            title={mode}
                        >
                            <Icon className="w-3.5 h-3.5" />
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-mono">{DEVICE_WIDTHS[device]}</span>
                    <button onClick={handleRefresh} className="p-1.5 text-gray-500 hover:text-gray-300 rounded hover:bg-slate-700/40 transition-colors" title="Refresh">
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
            {/* Iframe */}
            <div className="flex-1 flex items-start justify-center overflow-auto bg-slate-950/80 p-2">
                <div style={{ width: DEVICE_WIDTHS[device], maxWidth: '100%', height: '100%' }} className="transition-all duration-300 ease-out">
                    <iframe
                        ref={iframeRef}
                        src={previewSrc || undefined}
                        className="w-full h-full border border-slate-700/30 rounded-lg bg-white shadow-2xl"
                        title="Preview"
                        sandbox="allow-scripts allow-same-origin allow-modals allow-popups"
                    />
                </div>
            </div>
        </div>
    );
}

function PackagesTab({
    packages,
    onInstall,
    isLoading
}: {
    packages: PackageInfo[];
    onInstall: (name: string) => Promise<void>;
    isLoading: boolean;
}) {
    const [input, setInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onInstall(input.trim());
            setInput('');
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-900">
            {/* Install Input */}
            <div className="p-3 border-b border-slate-700/50 bg-slate-800/50">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                        <Package className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Install python package (e.g. pandas)..."
                            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/50 rounded-md text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 hover:bg-slate-900/80"
                            disabled={isLoading}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="px-4 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-md text-sm hover:bg-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Install'}
                    </button>
                </form>
            </div>

            {/* Package List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {packages.map(pkg => (
                    <div
                        key={pkg.name}
                        className="flex items-center justify-between p-3 bg-slate-800/30 border border-slate-700/30 rounded-lg hover:border-slate-600/50 transition-colors"
                    >
                        <div className="flex items-start gap-3">
                            <div className={`mt-1 w-2 h-2 rounded-full ${pkg.installed ? 'bg-green-400' : 'bg-gray-600'}`} />
                            <div>
                                <div className="font-medium text-sm text-white">{pkg.name}</div>
                                <div className="text-xs text-gray-500">{pkg.description || 'Python package'}</div>
                            </div>
                        </div>
                        {pkg.installed ? (
                            <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded-full border border-green-500/20 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Installed
                            </span>
                        ) : (
                            <button
                                onClick={() => onInstall(pkg.name)}
                                disabled={isLoading}
                                className="text-xs text-gray-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-600 transition-colors"
                            >
                                Install
                            </button>
                        )}
                    </div>
                ))}

                {packages.length === 0 && (
                    <div className="text-center text-gray-500 text-sm py-8">
                        No packages list available.
                    </div>
                )}
            </div>
        </div>
    );
}

function DatabaseTab() {
    const [query, setQuery] = useState('SELECT * FROM sqlite_master;');
    const [result, setResult] = useState<QueryResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [executing, setExecuting] = useState(false);

    const handleExecute = async () => {
        if (!query.trim()) return;

        setExecuting(true);
        setError(null);
        setResult(null);

        try {
            const db = getMimiSQLite();
            // Ensure DB is initialized (auto-creates if needed)
            await db.createDatabase();

            const res = db.execute(query);
            if (res.error) {
                setError(res.error);
            } else {
                setResult(res);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setExecuting(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-900">
            {/* Query Editor */}
            <div className="p-3 border-b border-slate-700/50 bg-slate-800/50 flex flex-col gap-2">
                <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full h-24 p-3 bg-slate-900 border border-slate-700/50 rounded-md text-sm font-mono text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 resize-none"
                    placeholder="Enter SQL query..."
                />
                <div className="flex justify-end">
                    <button
                        onClick={handleExecute}
                        disabled={executing || !query.trim()}
                        className="flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded text-sm hover:bg-cyan-500/20 disabled:opacity-50 transition-colors"
                    >
                        {executing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        Execute
                    </button>
                </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-auto p-3">
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm font-mono">
                        Error: {error}
                    </div>
                )}

                {result && (
                    <div className="space-y-2">
                        <div className="text-xs text-gray-500 flex justify-between">
                            <span>{result.values.length} rows</span>
                            <span>{result.executionTime.toFixed(2)}ms</span>
                        </div>

                        <div className="overflow-x-auto border border-slate-700/50 rounded-lg">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-400 uppercase bg-slate-800/50">
                                    <tr>
                                        {result.columns.map((col, i) => (
                                            <th key={i} className="px-4 py-2 border-b border-slate-700/50 whitespace-nowrap">
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.values.map((row, i) => (
                                        <tr key={i} className="bg-slate-900 hover:bg-slate-800/30">
                                            {row.map((cell, j) => (
                                                <td key={j} className="px-4 py-2 border-b border-slate-800/50 text-gray-300 whitespace-nowrap font-mono text-xs">
                                                    {cell === null ? <span className="text-gray-600">NULL</span> : String(cell)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    {result.values.length === 0 && (
                                        <tr>
                                            <td colSpan={result.columns.length || 1} className="px-4 py-8 text-center text-gray-500">
                                                No results
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {!result && !error && (
                    <div className="text-center text-gray-600 text-sm py-8">
                        Execute a query to see results
                    </div>
                )}
            </div>
        </div>
    );
}

export default SandboxPanel;
