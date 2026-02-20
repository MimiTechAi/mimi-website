"use client";

/**
 * ResultArtifactView — GenSpark Sparkpage-Style Agent Result Pages
 *
 * Renders agent markdown output as rich, interactive, shareable pages
 * with sortable tables, syntax-highlighted code, link cards, and collapsible lists.
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { memo, useState, useCallback, useMemo, useEffect } from "react";
import { useMimiAgentContext } from "../MimiAgentContext";
import useAgentComputer from "@/hooks/mimi/useAgentComputer";
import type { AgentComputerState, AgentComputerActions } from "@/hooks/mimi/useAgentComputer";
import {
    Copy, Download, Share2, FileText, Clock, Bot,
    ChevronDown, ChevronRight, Check, ArrowUpDown,
    FileCode2, ExternalLink, Layers
} from "lucide-react";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface ResultArtifact {
    id: string;
    title: string;
    markdown: string;
    timestamp: number;
    model?: string;
    iterations?: number;
    slug: string;
}

// ═══════════════════════════════════════════════════════════
// MARKDOWN → RICH SECTIONS PARSER
// ═══════════════════════════════════════════════════════════

type SectionType = 'heading' | 'paragraph' | 'code' | 'table' | 'list' | 'link-card' | 'blockquote' | 'hr';

interface ContentSection {
    type: SectionType;
    content: string;
    language?: string;    // for code blocks
    level?: number;       // for headings (1-6)
    rows?: string[][];    // for tables
    headers?: string[];   // for table headers
    items?: string[];     // for lists
    ordered?: boolean;    // for ordered lists
    url?: string;         // for link cards
    linkText?: string;    // for link cards
}

function parseMarkdownToSections(markdown: string): ContentSection[] {
    const sections: ContentSection[] = [];
    const lines = markdown.split('\n');
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // --- Horizontal Rule ---
        if (/^(-{3,}|_{3,}|\*{3,})\s*$/.test(line)) {
            sections.push({ type: 'hr', content: '' });
            i++;
            continue;
        }

        // --- Code Block ---
        const codeMatch = line.match(/^```(\w*)/);
        if (codeMatch) {
            const lang = codeMatch[1] || 'text';
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            i++; // skip closing ```
            sections.push({ type: 'code', content: codeLines.join('\n'), language: lang });
            continue;
        }

        // --- Table ---
        if (line.includes('|') && i + 1 < lines.length && /^\|?\s*[-:]+/.test(lines[i + 1])) {
            const headerLine = line.replace(/^\||\|$/g, '').trim();
            const headers = headerLine.split('|').map(h => h.trim());
            i += 2; // skip header + separator
            const rows: string[][] = [];
            while (i < lines.length && lines[i].includes('|')) {
                const row = lines[i].replace(/^\||\|$/g, '').trim();
                rows.push(row.split('|').map(c => c.trim()));
                i++;
            }
            sections.push({ type: 'table', content: '', headers, rows });
            continue;
        }

        // --- Heading ---
        const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
        if (headingMatch) {
            sections.push({ type: 'heading', content: headingMatch[2], level: headingMatch[1].length });
            i++;
            continue;
        }

        // --- Blockquote ---
        if (line.startsWith('>')) {
            const quoteLines: string[] = [];
            while (i < lines.length && lines[i].startsWith('>')) {
                quoteLines.push(lines[i].replace(/^>\s?/, ''));
                i++;
            }
            sections.push({ type: 'blockquote', content: quoteLines.join('\n') });
            continue;
        }

        // --- List ---
        if (/^\s*[-*+]\s/.test(line) || /^\s*\d+\.\s/.test(line)) {
            const ordered = /^\s*\d+\./.test(line);
            const items: string[] = [];
            while (i < lines.length && (/^\s*[-*+]\s/.test(lines[i]) || /^\s*\d+\.\s/.test(lines[i]))) {
                items.push(lines[i].replace(/^\s*[-*+]\s|^\s*\d+\.\s/, ''));
                i++;
            }
            sections.push({ type: 'list', content: '', items, ordered });
            continue;
        }

        // --- Link Card (standalone URL or markdown link on its own line) ---
        const linkMatch = line.match(/^\[([^\]]+)\]\((https?:\/\/[^\)]+)\)\s*$/);
        if (linkMatch) {
            sections.push({ type: 'link-card', content: '', linkText: linkMatch[1], url: linkMatch[2] });
            i++;
            continue;
        }

        // --- Paragraph ---
        if (line.trim() !== '') {
            const paraLines: string[] = [];
            while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('#') &&
                !lines[i].startsWith('```') && !lines[i].startsWith('>') &&
                !/^\s*[-*+]\s/.test(lines[i]) && !/^\s*\d+\.\s/.test(lines[i]) &&
                !/^(-{3,}|_{3,}|\*{3,})\s*$/.test(lines[i])) {
                paraLines.push(lines[i]);
                i++;
            }
            sections.push({ type: 'paragraph', content: paraLines.join(' ') });
            continue;
        }

        i++;
    }

    return sections;
}

// ═══════════════════════════════════════════════════════════
// INLINE MARKDOWN RENDERER (bold, italic, code, links)
// ═══════════════════════════════════════════════════════════

function renderInlineMarkdown(text: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    // Simple regex-based inline parsing
    const pattern = /(\*\*(.+?)\*\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))|(\*(.+?)\*)/g;
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }
        if (match[1]) parts.push(<strong key={match.index}>{match[2]}</strong>);
        else if (match[3]) parts.push(<code key={match.index} className="rav-inline-code">{match[4]}</code>);
        else if (match[5]) parts.push(<a key={match.index} href={match[7]} target="_blank" rel="noopener noreferrer" className="rav-link">{match[6]}</a>);
        else if (match[8]) parts.push(<em key={match.index}>{match[9]}</em>);
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts;
}

// ═══════════════════════════════════════════════════════════
// SECTION RENDERERS
// ═══════════════════════════════════════════════════════════

function SortableTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
    const [sortCol, setSortCol] = useState<number | null>(null);
    const [sortAsc, setSortAsc] = useState(true);
    const [filter, setFilter] = useState('');

    const sortedRows = useMemo(() => {
        let filtered = rows;
        if (filter) {
            const lf = filter.toLowerCase();
            filtered = rows.filter(r => r.some(c => c.toLowerCase().includes(lf)));
        }
        if (sortCol !== null) {
            return [...filtered].sort((a, b) => {
                const va = a[sortCol] || '';
                const vb = b[sortCol] || '';
                const numA = parseFloat(va), numB = parseFloat(vb);
                if (!isNaN(numA) && !isNaN(numB)) return sortAsc ? numA - numB : numB - numA;
                return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
            });
        }
        return filtered;
    }, [rows, sortCol, sortAsc, filter]);

    return (
        <div className="rav-table-container">
            {rows.length > 5 && (
                <input
                    className="rav-table-filter"
                    placeholder="Filter…"
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                />
            )}
            <table className="rav-table">
                <thead>
                    <tr>
                        {headers.map((h, i) => (
                            <th key={i} onClick={() => { setSortCol(i); setSortAsc(sortCol === i ? !sortAsc : true); }}>
                                <span>{h}</span>
                                {sortCol === i && <ArrowUpDown className="w-3 h-3" style={{ opacity: 0.5, marginLeft: 4 }} />}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedRows.map((row, ri) => (
                        <tr key={ri}>
                            {row.map((cell, ci) => <td key={ci}>{renderInlineMarkdown(cell)}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function CodeBlock({ content, language }: { content: string; language: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }, [content]);

    return (
        <div className="rav-code-block">
            <div className="rav-code-header">
                <span className="rav-code-lang">{language}</span>
                <button className="rav-code-copy" onClick={handleCopy} title="Code kopieren">
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
            </div>
            <pre className="rav-code-pre"><code>{content}</code></pre>
        </div>
    );
}

function CollapsibleList({ items, ordered }: { items: string[]; ordered?: boolean }) {
    const [open, setOpen] = useState(true);

    return (
        <div className="rav-list-section">
            <button className="rav-list-toggle" onClick={() => setOpen(!open)}>
                {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <span>{items.length} Einträge</span>
            </button>
            {open && (
                ordered ? (
                    <ol className="rav-list">
                        {items.map((item, i) => <li key={i}>{renderInlineMarkdown(item)}</li>)}
                    </ol>
                ) : (
                    <ul className="rav-list">
                        {items.map((item, i) => <li key={i}>{renderInlineMarkdown(item)}</li>)}
                    </ul>
                )
            )}
        </div>
    );
}

function LinkCard({ url, linkText }: { url: string; linkText: string }) {
    const domain = useMemo(() => { try { return new URL(url).hostname; } catch { return url; } }, [url]);
    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="rav-link-card">
            <ExternalLink className="w-4 h-4" style={{ color: '#00d4ff', flexShrink: 0 }} />
            <div>
                <span className="rav-link-card-title">{linkText}</span>
                <span className="rav-link-card-domain">{domain}</span>
            </div>
        </a>
    );
}

// ═══════════════════════════════════════════════════════════
// CONTENT RENDERER — Renders parsed sections
// ═══════════════════════════════════════════════════════════

function RenderSection({ section, index }: { section: ContentSection; index: number }) {
    switch (section.type) {
        case 'heading': {
            const level = Math.min(section.level || 1, 6);
            const cls = `rav-h${level}`;
            const children = renderInlineMarkdown(section.content);
            if (level === 1) return <h1 key={index} className={cls}>{children}</h1>;
            if (level === 2) return <h2 key={index} className={cls}>{children}</h2>;
            if (level === 3) return <h3 key={index} className={cls}>{children}</h3>;
            if (level === 4) return <h4 key={index} className={cls}>{children}</h4>;
            if (level === 5) return <h5 key={index} className={cls}>{children}</h5>;
            return <h6 key={index} className={cls}>{children}</h6>;
        }
        case 'paragraph':
            return <p key={index} className="rav-paragraph">{renderInlineMarkdown(section.content)}</p>;
        case 'code':
            return <CodeBlock key={index} content={section.content} language={section.language || 'text'} />;
        case 'table':
            return <SortableTable key={index} headers={section.headers || []} rows={section.rows || []} />;
        case 'list':
            return <CollapsibleList key={index} items={section.items || []} ordered={section.ordered} />;
        case 'link-card':
            return <LinkCard key={index} url={section.url || '#'} linkText={section.linkText || section.url || ''} />;
        case 'blockquote':
            return <blockquote key={index} className="rav-blockquote">{renderInlineMarkdown(section.content)}</blockquote>;
        case 'hr':
            return <hr key={index} className="rav-hr" />;
        default:
            return null;
    }
}

// ═══════════════════════════════════════════════════════════
// SELF-CONTAINED HTML GENERATOR (for download/share)
// ═══════════════════════════════════════════════════════════

function generateStandaloneHTML(title: string, markdown: string, timestamp: number, model?: string): string {
    return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — MIMI Agent</title>
<style>
  :root { --bg: #0a0a0f; --fg: #e2e8f0; --muted: #64748b; --accent: #00d4ff; --card: #111119; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; background: var(--bg); color: var(--fg); line-height: 1.75; padding: 3rem 1.5rem; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; background: linear-gradient(135deg, #fff, var(--accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  h2 { font-size: 1.4rem; font-weight: 600; margin: 2rem 0 0.75rem; color: var(--fg); }
  h3 { font-size: 1.1rem; font-weight: 600; margin: 1.5rem 0 0.5rem; }
  p { margin-bottom: 1rem; color: #cbd5e1; }
  a { color: var(--accent); text-decoration: none; }
  code { background: rgba(0,212,255,0.08); padding: 2px 5px; border-radius: 3px; font-size: 0.875em; font-family: 'JetBrains Mono', monospace; }
  pre { background: var(--card); border: 1px solid #1e293b; border-radius: 8px; padding: 1rem; overflow-x: auto; margin: 1rem 0; }
  table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
  th, td { padding: 0.5rem 0.75rem; border: 1px solid #1e293b; text-align: left; font-size: 0.875rem; }
  th { background: var(--card); color: var(--accent); font-weight: 600; }
  blockquote { border-left: 3px solid var(--accent); padding-left: 1rem; color: var(--muted); margin: 1rem 0; font-style: italic; }
  hr { border: none; border-top: 1px solid #1e293b; margin: 2rem 0; }
  ul, ol { padding-left: 1.5rem; margin-bottom: 1rem; }
  li { margin-bottom: 0.25rem; }
  .meta { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #1e293b; font-size: 0.75rem; color: var(--muted); }
</style>
</head>
<body>
<h1>${title}</h1>
<div style="margin-bottom: 2rem;">
${markdown.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}
</div>
<div class="meta">
  <p>Generated ${new Date(timestamp).toLocaleString('de-DE')} · Model: ${model || 'MIMI Agent'} · MIMI Tech AI</p>
</div>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export const ResultArtifactView = memo(function ResultArtifactView() {
    const ctx = useMimiAgentContext();
    const [computer, actions] = useAgentComputer();
    const [storedArtifacts, setStoredArtifacts] = useState<ResultArtifact[]>([]);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [copiedMd, setCopiedMd] = useState(false);

    // Build artifacts from agent's code artifacts + stored OPFS artifacts
    const artifacts = useMemo<ResultArtifact[]>(() => {
        // Convert codeArtifacts to ResultArtifacts
        const fromCode: ResultArtifact[] = ctx.codeArtifacts.map((art, i) => ({
            id: `code-${i}`,
            title: art.filename.replace(/\.\w+$/, '').replace(/[-_]/g, ' '),
            markdown: art.content,
            timestamp: Date.now(),
            model: 'MIMI Agent',
            slug: art.filename.replace(/\.\w+$/, ''),
        }));
        // Combine with stored artifacts
        return [...storedArtifacts, ...fromCode];
    }, [ctx.codeArtifacts, storedArtifacts]);

    // Load stored artifacts from OPFS
    useEffect(() => {
        if (!computer.isReady) return;
        (async () => {
            try {
                const entries = await actions.listFiles();
                const artifactFiles = entries.filter(e =>
                    e.name.startsWith('artifacts/') && e.name.endsWith('.md') && !e.isDirectory
                );
                const loaded: ResultArtifact[] = [];
                for (const f of artifactFiles) {
                    try {
                        const content = await actions.readFile(f.name);
                        const baseName = f.name.replace('artifacts/', '').replace('.md', '');
                        const tsMatch = baseName.match(/^(\d+)-/);
                        loaded.push({
                            id: `opfs-${f.name}`,
                            title: baseName.replace(/^\d+-/, '').replace(/[-_]/g, ' '),
                            markdown: content,
                            timestamp: tsMatch ? parseInt(tsMatch[1]) : Date.now(),
                            model: 'MIMI Agent',
                            slug: baseName,
                        });
                    } catch { /* skip unreadable */ }
                }
                if (loaded.length > 0) setStoredArtifacts(loaded);
            } catch { /* non-critical */ }
        })();
    }, [computer.isReady, actions]);

    const current = artifacts[selectedIdx] || null;
    const sections = useMemo(() => current ? parseMarkdownToSections(current.markdown) : [], [current]);

    // ── Toolbar actions ──
    const copyMarkdown = useCallback(() => {
        if (!current) return;
        navigator.clipboard.writeText(current.markdown);
        setCopiedMd(true);
        setTimeout(() => setCopiedMd(false), 1500);
        ctx.addToast('📋 Markdown kopiert');
    }, [current, ctx]);

    const downloadHTML = useCallback(() => {
        if (!current) return;
        const html = generateStandaloneHTML(current.title, current.markdown, current.timestamp, current.model);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${current.slug}.html`; a.click();
        URL.revokeObjectURL(url);
        ctx.addToast('⬇️ HTML heruntergeladen');
    }, [current, ctx]);

    const downloadPDF = useCallback(async () => {
        if (!current) return;
        try {
            const { generatePDF, downloadFile } = await import('@/lib/mimi/file-generator');
            const blob = await generatePDF(current.markdown, `${current.slug}.pdf`, { title: current.title });
            downloadFile(blob, `${current.slug}.pdf`);
            ctx.addToast('⬇️ PDF heruntergeladen');
        } catch { ctx.addToast('❌ PDF-Export fehlgeschlagen'); }
    }, [current, ctx]);

    const shareArtifact = useCallback(() => {
        if (!current) return;
        const html = generateStandaloneHTML(current.title, current.markdown, current.timestamp, current.model);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${current.slug}-share.html`; a.click();
        URL.revokeObjectURL(url);
        ctx.addToast('📤 Shareable HTML erzeugt');
    }, [current, ctx]);

    // ── Save to OPFS ──
    const saveToOPFS = useCallback(async () => {
        if (!current) return;
        try {
            const slug = current.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40);
            const filename = `artifacts/${Date.now()}-${slug}.md`;
            await actions.writeFile(filename, current.markdown);
            ctx.addToast('💾 Artifact gespeichert');
        } catch { ctx.addToast('❌ Speichern fehlgeschlagen'); }
    }, [current, actions, ctx]);

    // ── Empty state ──
    if (artifacts.length === 0) {
        return (
            <div className="rav-empty">
                <FileText className="w-8 h-8" style={{ opacity: 0.2 }} />
                <span>Noch keine Artifacts vorhanden</span>
                <p style={{ fontSize: '0.65rem', opacity: 0.4, marginTop: 4 }}>
                    Agent-Ergebnisse erscheinen hier als interaktive Seiten
                </p>
            </div>
        );
    }

    return (
        <div className="rav-container">
            {/* ── Artifact List Sidebar ── */}
            {artifacts.length > 1 && (
                <div className="rav-sidebar">
                    {artifacts.map((art, i) => (
                        <button
                            key={art.id}
                            className={`rav-sidebar-item${i === selectedIdx ? ' active' : ''}`}
                            onClick={() => setSelectedIdx(i)}
                        >
                            <Layers className="w-3.5 h-3.5" style={{ flexShrink: 0 }} />
                            <span>{art.title}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* ── Main Content ── */}
            {current && (
                <div className="rav-main">
                    {/* ── Toolbar ── */}
                    <div className="rav-toolbar">
                        <button className="rav-toolbar-btn" onClick={copyMarkdown} title="Als Markdown kopieren">
                            {copiedMd ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedMd ? 'Kopiert' : 'Markdown'}</span>
                        </button>
                        <button className="rav-toolbar-btn" onClick={downloadHTML} title="Als HTML herunterladen">
                            <Download className="w-3.5 h-3.5" />
                            <span>HTML</span>
                        </button>
                        <button className="rav-toolbar-btn" onClick={downloadPDF} title="Als PDF herunterladen">
                            <FileText className="w-3.5 h-3.5" />
                            <span>PDF</span>
                        </button>
                        <button className="rav-toolbar-btn" onClick={shareArtifact} title="Teilen">
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Teilen</span>
                        </button>
                        <button className="rav-toolbar-btn" onClick={saveToOPFS} title="In Workspace speichern">
                            <FileCode2 className="w-3.5 h-3.5" />
                            <span>Speichern</span>
                        </button>
                    </div>

                    {/* ── Title ── */}
                    <h1 className="rav-title">{current.title}</h1>

                    {/* ── Rich Content ── */}
                    <div className="rav-content">
                        {sections.map((section, i) => (
                            <RenderSection key={i} section={section} index={i} />
                        ))}
                    </div>

                    {/* ── Metadata Footer ── */}
                    <div className="rav-metadata">
                        <div className="rav-meta-item">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(current.timestamp).toLocaleString('de-DE')}</span>
                        </div>
                        {current.model && (
                            <div className="rav-meta-item">
                                <Bot className="w-3 h-3" />
                                <span>{current.model}</span>
                            </div>
                        )}
                        {current.iterations && (
                            <div className="rav-meta-item">
                                <Layers className="w-3 h-3" />
                                <span>{current.iterations} Iterationen</span>
                            </div>
                        )}
                        <div className="rav-meta-item">
                            <span style={{ opacity: 0.3 }}>MIMI Tech AI</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});
