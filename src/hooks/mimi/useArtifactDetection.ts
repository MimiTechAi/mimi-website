"use client";

/**
 * useArtifactDetection – Detects renderable artifacts from assistant messages.
 * 
 * Parses code blocks, HTML, Markdown, Charts, and Mermaid diagrams 
 * from the assistant's response and provides them for the ArtifactPanel.
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { useMemo, useCallback, useState } from 'react';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export type ArtifactType = 'code' | 'html' | 'markdown' | 'mermaid' | 'chart' | 'svg' | 'json' | 'table';

export interface DetectedArtifact {
    id: string;
    type: ArtifactType;
    language: string;
    title: string;
    content: string;
    startIndex: number;
    endIndex: number;
}

// ═══════════════════════════════════════════════════════════
// DETECTION LOGIC  
// ═══════════════════════════════════════════════════════════

const CODE_BLOCK_RE = /```(\w*)\n([\s\S]*?)```/g;

const HTML_INDICATORS = [
    '<!DOCTYPE', '<html', '<body', '<div', '<section', '<main',
    '<style>', '<script', '<canvas', '<form',
];

const MERMAID_INDICATORS = [
    'graph ', 'flowchart ', 'sequenceDiagram', 'classDiagram',
    'stateDiagram', 'erDiagram', 'gantt', 'pie ', 'journey',
];

function inferArtifactType(language: string, content: string): ArtifactType {
    const lang = language.toLowerCase().trim();

    // Exact language matches
    if (lang === 'html' || lang === 'htm') return 'html';
    if (lang === 'mermaid') return 'mermaid';
    if (lang === 'svg') return 'svg';
    if (lang === 'json') return 'json';
    if (lang === 'markdown' || lang === 'md') return 'markdown';
    if (lang === 'csv') return 'table';

    // Content-based detection for unlabeled blocks
    if (!lang || lang === 'text' || lang === 'plaintext') {
        const trimmed = content.trim();
        if (HTML_INDICATORS.some(tag => trimmed.includes(tag))) return 'html';
        if (MERMAID_INDICATORS.some(kw => trimmed.startsWith(kw))) return 'mermaid';
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
        if (trimmed.startsWith('<svg')) return 'svg';
    }

    return 'code';
}

function generateTitle(type: ArtifactType, language: string, content: string): string {
    switch (type) {
        case 'html': return 'HTML Preview';
        case 'mermaid': return 'Diagram';
        case 'svg': return 'SVG Grafik';
        case 'json': return 'JSON Daten';
        case 'markdown': return 'Dokument';
        case 'table': return 'Tabelle';
        case 'chart': return 'Chart';
        case 'code': {
            const langName = language || 'Code';
            // Try to extract a function/class name from first line
            const firstLine = content.trim().split('\n')[0] || '';
            const funcMatch = firstLine.match(/(?:function|def|class|const|let|var)\s+(\w+)/);
            if (funcMatch) return `${langName}: ${funcMatch[1]}`;
            return `${langName.charAt(0).toUpperCase() + langName.slice(1)} Code`;
        }
        default: return 'Artifact';
    }
}

/**
 * Detect artifacts in a text string (typically an assistant message).
 */
export function detectArtifacts(text: string): DetectedArtifact[] {
    if (!text) return [];
    const artifacts: DetectedArtifact[] = [];

    // Reset lastIndex for global regex
    CODE_BLOCK_RE.lastIndex = 0;

    let match: RegExpExecArray | null;
    let index = 0;

    while ((match = CODE_BLOCK_RE.exec(text)) !== null) {
        const language = match[1] || '';
        const content = match[2] || '';

        // Skip tiny code blocks (under 3 lines or 50 chars)
        if (content.trim().length < 50 && content.trim().split('\n').length < 3) {
            continue;
        }

        const type = inferArtifactType(language, content);
        const title = generateTitle(type, language, content);

        artifacts.push({
            id: `artifact-${index++}`,
            type,
            language: language || (type === 'html' ? 'html' : type === 'json' ? 'json' : 'text'),
            title,
            content: content.trim(),
            startIndex: match.index,
            endIndex: match.index + match[0].length,
        });
    }

    return artifacts;
}

// ═══════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════

interface UseArtifactDetectionReturn {
    artifacts: DetectedArtifact[];
    activeArtifact: DetectedArtifact | null;
    setActiveArtifact: (artifact: DetectedArtifact | null) => void;
    hasArtifacts: boolean;
    openArtifact: (artifact: DetectedArtifact) => void;
    closeArtifact: () => void;
}

export function useArtifactDetection(messageContent: string): UseArtifactDetectionReturn {
    const [activeArtifact, setActiveArtifact] = useState<DetectedArtifact | null>(null);

    const artifacts = useMemo(() => detectArtifacts(messageContent), [messageContent]);

    const openArtifact = useCallback((artifact: DetectedArtifact) => {
        setActiveArtifact(artifact);
    }, []);

    const closeArtifact = useCallback(() => {
        setActiveArtifact(null);
    }, []);

    return {
        artifacts,
        activeArtifact,
        setActiveArtifact,
        hasArtifacts: artifacts.length > 0,
        openArtifact,
        closeArtifact,
    };
}
