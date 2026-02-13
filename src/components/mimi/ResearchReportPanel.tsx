"use client";

/**
 * Research Report Panel - Q2 2026 Implementation
 *
 * Displays deep research results with consensus/disputed/uncertain sections.
 * Shows multi-source analysis and credibility indicators.
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ResearchReport, ConsensusGroup, ResearchSource } from '@/lib/mimi/deep-research';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ResearchReportPanelProps {
    report: ResearchReport | null;
    isLoading?: boolean;
    className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function ResearchReportPanel({
    report,
    isLoading = false,
    className = ''
}: ResearchReportPanelProps) {
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
    const [showSources, setShowSources] = useState(false);

    if (isLoading) {
        return (
            <div className={`research-report-panel ${className}`}>
                <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-white/60">Durchsuche 30-50 Quellen...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!report) {
        return null;
    }

    const consensusGroups = report.consensusGroups.filter(g => g.category === 'consensus');
    const disputedGroups = report.consensusGroups.filter(g => g.category === 'disputed');
    const uncertainGroups = report.consensusGroups.filter(g => g.category === 'uncertain');

    return (
        <div className={`research-report-panel ${className}`}>
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold text-white/90">
                        Deep Research Report
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowSources(!showSources)}
                            className="px-3 py-1.5 text-xs font-medium text-cyan-400 bg-cyan-400/10 rounded-lg hover:bg-cyan-400/20 transition-colors"
                        >
                            {showSources ? 'Verberge' : 'Zeige'} {report.totalSources} Quellen
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-white/50">
                    <span>{report.totalSources} Quellen analysiert</span>
                    <span>•</span>
                    <span>{Math.round(report.consensusScore * 100)}% Konsens</span>
                    <span>•</span>
                    <span>{new Date(report.timestamp).toLocaleTimeString('de-DE')}</span>
                </div>

                {/* Consensus Score Bar */}
                <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-cyan-400 to-green-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${report.consensusScore * 100}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                    />
                </div>
            </div>

            {/* Sources Panel (Expandable) */}
            <AnimatePresence>
                {showSources && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 overflow-hidden"
                    >
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                            <h3 className="text-sm font-semibold text-white/80 mb-3">
                                Verwendete Quellen
                            </h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {report.sources.map((source) => (
                                    <SourceCard key={source.id} source={source} />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Consensus Groups */}
            {consensusGroups.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-2 w-2 rounded-full bg-green-400" />
                        <h3 className="text-sm font-semibold text-white/80">
                            ✅ Konsens ({consensusGroups.length} Themen)
                        </h3>
                    </div>
                    <div className="space-y-2">
                        {consensusGroups.map((group, idx) => (
                            <ConsensusCard
                                key={idx}
                                group={group}
                                isExpanded={expandedGroup === `consensus-${idx}`}
                                onToggle={() => setExpandedGroup(
                                    expandedGroup === `consensus-${idx}` ? null : `consensus-${idx}`
                                )}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Disputed Groups */}
            {disputedGroups.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-2 w-2 rounded-full bg-yellow-400" />
                        <h3 className="text-sm font-semibold text-white/80">
                            ⚠️ Umstritten ({disputedGroups.length} Themen)
                        </h3>
                    </div>
                    <div className="space-y-2">
                        {disputedGroups.map((group, idx) => (
                            <ConsensusCard
                                key={idx}
                                group={group}
                                isExpanded={expandedGroup === `disputed-${idx}`}
                                onToggle={() => setExpandedGroup(
                                    expandedGroup === `disputed-${idx}` ? null : `disputed-${idx}`
                                )}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Uncertain Groups */}
            {uncertainGroups.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-2 w-2 rounded-full bg-gray-400" />
                        <h3 className="text-sm font-semibold text-white/80">
                            ❓ Unsicher ({uncertainGroups.length} Themen)
                        </h3>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-xs text-white/60">
                            {uncertainGroups.length} Themen benötigen weitere Recherche (begrenzte Quellen).
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function SourceCard({ source }: { source: ResearchSource }) {
    const typeColors = {
        'search': 'bg-blue-400/20 text-blue-400',
        'wiki': 'bg-purple-400/20 text-purple-400',
        'arxiv': 'bg-green-400/20 text-green-400',
        'scholar': 'bg-cyan-400/20 text-cyan-400',
        'news': 'bg-yellow-400/20 text-yellow-400'
    };

    return (
        <div className="flex items-start gap-3 p-2 bg-white/5 rounded hover:bg-white/10 transition-colors">
            <div className="flex-shrink-0 mt-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium uppercase ${typeColors[source.sourceType]}`}>
                        {source.sourceType}
                    </span>
                    <div className="flex items-center gap-1">
                        <div className="h-1 w-1 rounded-full bg-yellow-400" />
                        <span className="text-[10px] text-white/40">
                            {Math.round(source.credibility * 100)}% credible
                        </span>
                    </div>
                </div>
                <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-white/80 hover:text-cyan-400 transition-colors line-clamp-1"
                >
                    {source.title}
                </a>
                <p className="text-[11px] text-white/50 line-clamp-2 mt-1">
                    {source.snippet}
                </p>
            </div>
        </div>
    );
}

function ConsensusCard({
    group,
    isExpanded,
    onToggle
}: {
    group: ConsensusGroup;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const categoryColors = {
        'consensus': 'border-green-400/30 bg-green-400/5',
        'disputed': 'border-yellow-400/30 bg-yellow-400/5',
        'uncertain': 'border-gray-400/30 bg-gray-400/5'
    };

    return (
        <div className={`border rounded-lg ${categoryColors[group.category]}`}>
            <button
                onClick={onToggle}
                className="w-full p-3 text-left hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-white/90">
                                {group.topic}
                            </h4>
                            <span className="text-xs text-white/50">
                                ({group.claims.length} Behauptungen)
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-cyan-400"
                                    style={{ width: `${group.agreement * 100}%` }}
                                />
                            </div>
                            <span className="text-xs text-white/60">
                                {Math.round(group.agreement * 100)}%
                            </span>
                        </div>
                    </div>
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-3"
                    >
                        <svg className="h-4 w-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </motion.div>
                </div>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-3 pb-3 space-y-2">
                            {group.claims.map((claim, idx) => (
                                <div key={idx} className="p-2 bg-white/5 rounded text-xs">
                                    <p className="text-white/80 mb-1">{claim.claim}</p>
                                    <div className="flex items-center gap-2 text-white/50">
                                        <span>{claim.sources.length} Quellen</span>
                                        <span>•</span>
                                        <span>{Math.round(claim.confidence * 100)}% Vertrauen</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default ResearchReportPanel;
