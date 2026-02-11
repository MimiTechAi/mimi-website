/**
 * MIMI Tech AI - Code Editor Component
 * 
 * Monaco Editor integration for MIMI Workspace.
 * VS Code-quality editing experience with AI features.
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 * https://mimitechai.com
 */

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
// eslint-disable-next-line @typescript-eslint/no-namespace
namespace MonacoEditor {
    export type IStandaloneCodeEditor = any;
    export type IStandaloneThemeData = any;
}

// Dynamic import to avoid SSR issues
const Editor = dynamic(
    () => import('@monaco-editor/react').then(mod => mod.default),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-full bg-gray-900">
                <div className="text-gray-400 animate-pulse">
                    Loading Editor...
                </div>
            </div>
        )
    }
);

interface CodeEditorProps {
    value: string;
    language?: string;
    onChange?: (value: string) => void;
    onSave?: () => void;
    readOnly?: boolean;
    filename?: string;
    className?: string;
}

// Language detection based on file extension
const LANGUAGE_MAP: Record<string, string> = {
    // JavaScript/TypeScript
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',

    // Python
    py: 'python',
    pyw: 'python',

    // Web
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    less: 'less',

    // Data
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',

    // Documents
    md: 'markdown',
    mdx: 'markdown',
    txt: 'plaintext',

    // Config
    env: 'plaintext',
    gitignore: 'plaintext',

    // Shell
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',

    // SQL
    sql: 'sql',

    // Other
    dockerfile: 'dockerfile',
};

// MIMI Dark Theme
const MIMI_THEME: MonacoEditor.IStandaloneThemeData = {
    base: 'vs-dark',
    inherit: true,
    rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' },
    ],
    colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#c9d1d9',
        'editor.lineHighlightBackground': '#161b22',
        'editor.selectionBackground': '#264f78',
        'editorCursor.foreground': '#58a6ff',
        'editorLineNumber.foreground': '#6e7681',
        'editorLineNumber.activeForeground': '#c9d1d9',
    }
};

/**
 * MIMI Tech AI - Code Editor
 */
export function CodeEditor({
    value,
    language,
    onChange,
    onSave,
    readOnly = false,
    filename,
    className = ''
}: CodeEditorProps) {
    const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
    const [mounted, setMounted] = useState(false);

    // Detect language from filename
    const detectedLanguage = useCallback(() => {
        if (language) return language;
        if (!filename) return 'plaintext';

        const ext = filename.split('.').pop()?.toLowerCase() || '';
        return LANGUAGE_MAP[ext] || 'plaintext';
    }, [language, filename]);

    // Handle editor mount
    const handleEditorDidMount = (
        editor: MonacoEditor.IStandaloneCodeEditor,
        monaco: any
    ) => {
        editorRef.current = editor;
        setMounted(true);

        // Register MIMI theme
        monaco.editor.defineTheme('mimi-dark', MIMI_THEME);
        monaco.editor.setTheme('mimi-dark');

        // Add keyboard shortcuts
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            onSave?.();
        });

        // Format on save (Shift+Alt+F)
        editor.addCommand(
            monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF,
            () => {
                editor.getAction('editor.action.formatDocument')?.run();
            }
        );

        console.log('[MIMI CodeEditor] ✅ Editor mounted');
    };

    // Auto-save timer
    useEffect(() => {
        if (!mounted || !onSave) return;

        const timer = setInterval(() => {
            // Check if content is dirty (changed)
            // This will be handled by parent component
        }, 2000);

        return () => clearInterval(timer);
    }, [mounted, onSave]);

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">
                        {filename || 'Untitled'}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded">
                        {detectedLanguage()}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onSave?.()}
                        className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded transition-colors"
                        title="Save (Cmd+S)"
                    >
                        💾 Save
                    </button>
                    <button
                        onClick={() => {
                            editorRef.current?.getAction('editor.action.formatDocument')?.run();
                        }}
                        className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                        title="Format (Shift+Alt+F)"
                    >
                        ✨ Format
                    </button>
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1">
                <Editor
                    height="100%"
                    language={detectedLanguage()}
                    value={value}
                    onChange={(val) => onChange?.(val || '')}
                    onMount={handleEditorDidMount}
                    theme="vs-dark"
                    options={{
                        // General
                        fontSize: 14,
                        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                        fontLigatures: true,

                        // Behavior
                        automaticLayout: true,
                        readOnly,
                        wordWrap: 'on',

                        // Visual
                        minimap: { enabled: true, scale: 2 },
                        scrollBeyondLastLine: false,
                        lineNumbers: 'on',
                        renderLineHighlight: 'line',
                        scrollbar: {
                            verticalScrollbarSize: 10,
                            horizontalScrollbarSize: 10,
                        },

                        // Features
                        suggestOnTriggerCharacters: true,
                        tabCompletion: 'on',
                        formatOnPaste: true,
                        formatOnType: true,

                        // Cursor
                        cursorBlinking: 'smooth',
                        cursorSmoothCaretAnimation: 'on',

                        // Bracket matching
                        bracketPairColorization: { enabled: true },
                        matchBrackets: 'always',

                        // Padding
                        padding: { top: 10, bottom: 10 },
                    }}
                />
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between px-3 py-1 bg-gray-800 border-t border-gray-700 text-xs text-gray-500">
                <div className="flex items-center gap-3">
                    <span>
                        {editorRef.current
                            ? `Ln ${editorRef.current.getPosition()?.lineNumber || 1}, Col ${editorRef.current.getPosition()?.column || 1}`
                            : 'Ln 1, Col 1'
                        }
                    </span>
                    <span>{detectedLanguage()}</span>
                </div>
                <div>
                    Powered by MIMI Tech AI
                </div>
            </div>
        </div>
    );
}

export default CodeEditor;
