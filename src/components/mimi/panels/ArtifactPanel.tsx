"use client";

/**
 * ArtifactPanel — Claude-style artifact viewer for the MIMI Agent.
 *
 * Renders detected artifacts (code, HTML, markdown, mermaid, SVG, JSON)
 * in the right-side VirtualSandbox panel with live preview and editing.
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import React, { memo, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy } from "lucide-react";
import type { DetectedArtifact } from "@/hooks/mimi/useArtifactDetection";
import { sanitizeSvg } from "../utils/sanitize";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface ArtifactPanelProps {
    artifact: DetectedArtifact | null;
    onClose: () => void;
}

// ═══════════════════════════════════════════════════════════
// ARTIFACT RENDERERS
// ═══════════════════════════════════════════════════════════

function HtmlPreview({ content }: { content: string }) {
    const srcDoc = useMemo(() => {
        // Wrap in a full HTML document if it's just a snippet
        if (!content.includes('<html') && !content.includes('<!DOCTYPE')) {
            return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui, -apple-system, sans-serif; padding: 16px; background: #0f172a; color: #e2e8f0; }
</style>
</head>
<body>${content}</body>
</html>`;
        }
        return content;
    }, [content]);

    return (
        <iframe
            srcDoc={srcDoc}
            className="w-full h-full border-0 rounded-lg bg-[#0f172a]"
            sandbox="allow-modals"
            title="HTML-Vorschau"
        />
    );
}

function CodeView({ content, language }: { content: string; language: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [content]);

    return (
        <div className="relative h-full">
            <button
                onClick={handleCopy}
                className="absolute top-3 right-3 z-10 px-3 py-1.5 text-[10px] font-medium bg-white/10 hover:bg-white/20 text-cyan-200 rounded-md border border-white/10 transition-all"
            >
                {copied ? '✓ Kopiert' : <><Copy className="w-3 h-3" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />Kopieren</>}
            </button>
            <pre className="h-full overflow-auto p-4 text-sm font-mono leading-relaxed text-cyan-50 bg-[#0d1117] rounded-lg">
                <code className={`language-${language}`}>
                    {content}
                </code>
            </pre>
        </div>
    );
}

function JsonView({ content }: { content: string }) {
    const formatted = useMemo(() => {
        try {
            return JSON.stringify(JSON.parse(content), null, 2);
        } catch {
            return content;
        }
    }, [content]);

    return <CodeView content={formatted} language="json" />;
}

function SvgView({ content }: { content: string }) {
    return (
        <div
            className="h-full flex items-center justify-center p-4 bg-[#0d1117] rounded-lg"
            dangerouslySetInnerHTML={{ __html: sanitizeSvg(content) }}
        />
    );
}

function MarkdownView({ content }: { content: string }) {
    // Simple markdown rendering (bold, italic, headers, lists, code)
    const html = useMemo(() => {
        let md = content
            .replace(/^### (.+)$/gm, '<h3 class="art-h3">$1</h3>')
            .replace(/^## (.+)$/gm, '<h2 class="art-h2">$1</h2>')
            .replace(/^# (.+)$/gm, '<h1 class="art-h1">$1</h1>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code class="art-inline-code">$1</code>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/\n/g, '<br/>');
        return md;
    }, [content]);

    return (
        <div
            className="h-full overflow-auto p-6 text-sm text-cyan-50 leading-relaxed bg-[#0d1117] rounded-lg [&_.art-h1]:text-xl [&_.art-h1]:font-bold [&_.art-h1]:text-cyan-200 [&_.art-h1]:mb-3 [&_.art-h2]:text-lg [&_.art-h2]:font-semibold [&_.art-h2]:text-cyan-300 [&_.art-h2]:mb-2 [&_.art-h3]:text-base [&_.art-h3]:font-medium [&_.art-h3]:text-cyan-400 [&_.art-inline-code]:bg-cyan-500/10 [&_.art-inline-code]:px-1.5 [&_.art-inline-code]:py-0.5 [&_.art-inline-code]:rounded [&_.art-inline-code]:text-cyan-300 [&_.art-inline-code]:text-xs [&_.art-inline-code]:font-mono"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

// ═══════════════════════════════════════════════════════════
// TYPE ICONS & LABELS
// ═══════════════════════════════════════════════════════════

const TYPE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
    code: { icon: '💻', label: 'Code', color: 'from-blue-500 to-indigo-600' },
    html: { icon: '🌐', label: 'HTML', color: 'from-orange-500 to-red-500' },
    markdown: { icon: '📝', label: 'Markdown', color: 'from-green-500 to-emerald-600' },
    mermaid: { icon: '📊', label: 'Diagram', color: 'from-purple-500 to-violet-600' },
    svg: { icon: '🎨', label: 'SVG', color: 'from-pink-500 to-rose-600' },
    json: { icon: '📋', label: 'JSON', color: 'from-amber-500 to-yellow-600' },
    chart: { icon: '📈', label: 'Chart', color: 'from-teal-500 to-cyan-600' },
    table: { icon: '📊', label: 'Tabelle', color: 'from-sky-500 to-blue-600' },
};

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export const ArtifactPanel = memo(function ArtifactPanel({ artifact, onClose }: ArtifactPanelProps) {
    if (!artifact) return null;

    const config = TYPE_CONFIG[artifact.type] || TYPE_CONFIG.code;

    const handleDownload = () => {
        const ext = artifact.type === 'html' ? 'html'
            : artifact.type === 'svg' ? 'svg'
                : artifact.type === 'json' ? 'json'
                    : artifact.type === 'markdown' ? 'md'
                        : artifact.language || 'txt';

        const blob = new Blob([artifact.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mimi-artifact.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 z-30 flex flex-col bg-[#0a0e1a]/95 backdrop-blur-xl border-l border-white/5"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <span className="text-base">{config.icon}</span>
                        <div>
                            <h3 className="text-sm font-semibold text-cyan-100">{artifact.title}</h3>
                            <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white rounded-full bg-gradient-to-r ${config.color}`}>
                                {config.label}
                                {artifact.language && artifact.type === 'code' ? ` · ${artifact.language}` : ''}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleDownload}
                            className="p-1.5 text-xs text-cyan-200/50 hover:text-cyan-200 hover:bg-white/10 rounded transition-all"
                            title="Download"
                        >
                            ⤓
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-xs text-cyan-200/50 hover:text-cyan-200 hover:bg-white/10 rounded transition-all"
                            title="Schließen"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-3 overflow-hidden">
                    {artifact.type === 'html' && <HtmlPreview content={artifact.content} />}
                    {artifact.type === 'svg' && <SvgView content={artifact.content} />}
                    {artifact.type === 'json' && <JsonView content={artifact.content} />}
                    {artifact.type === 'markdown' && <MarkdownView content={artifact.content} />}
                    {(artifact.type === 'code' || artifact.type === 'mermaid' || artifact.type === 'table' || artifact.type === 'chart') && (
                        <CodeView content={artifact.content} language={artifact.language} />
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
});

// ═══════════════════════════════════════════════════════════
// ARTIFACT CHIP (inline in messages)
// ═══════════════════════════════════════════════════════════

export const ArtifactChip = memo(function ArtifactChip({
    artifact,
    onClick,
}: {
    artifact: DetectedArtifact;
    onClick: (artifact: DetectedArtifact) => void;
}) {
    const config = TYPE_CONFIG[artifact.type] || TYPE_CONFIG.code;

    return (
        <button
            onClick={() => onClick(artifact)}
            className="group inline-flex items-center gap-1.5 px-3 py-1.5 my-1 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 hover:from-cyan-500/15 hover:to-blue-500/15 border border-cyan-500/20 hover:border-cyan-400/40 rounded-lg transition-all cursor-pointer"
        >
            <span className="text-sm">{config.icon}</span>
            <span className="text-xs font-medium text-cyan-200 group-hover:text-cyan-100">
                {artifact.title}
            </span>
            <span className="text-[9px] text-cyan-300/50 group-hover:text-cyan-300/80 font-mono">
                →
            </span>
        </button>
    );
});
