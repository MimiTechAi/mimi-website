"use client";

/**
 * Advanced Vision Panel - Q3 2026 Implementation
 *
 * UI for multi-image comparison, video analysis, OCR, and chart parsing.
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
    ImageComparison,
    VideoAnalysis,
    OCRResult,
    ChartData
} from '@/lib/mimi/advanced-vision';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface AdvancedVisionPanelProps {
    mode: 'compare' | 'video' | 'ocr' | 'chart';
    imageComparison?: ImageComparison | null;
    videoAnalysis?: VideoAnalysis | null;
    ocrResult?: OCRResult | null;
    chartData?: ChartData | null;
    isProcessing?: boolean;
    className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function AdvancedVisionPanel({
    mode,
    imageComparison,
    videoAnalysis,
    ocrResult,
    chartData,
    isProcessing = false,
    className = ''
}: AdvancedVisionPanelProps) {
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    if (isProcessing) {
        return (
            <div className={`advanced-vision-panel ${className}`}>
                <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-white/60">
                            {mode === 'compare' && 'Vergleiche Bilder...'}
                            {mode === 'video' && 'Analysiere Video...'}
                            {mode === 'ocr' && 'Extrahiere Text...'}
                            {mode === 'chart' && 'Parse Diagramm...'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`advanced-vision-panel ${className}`}>
            {mode === 'compare' && imageComparison && (
                <ImageComparisonView comparison={imageComparison} />
            )}

            {mode === 'video' && videoAnalysis && (
                <VideoAnalysisView analysis={videoAnalysis} expanded={expandedSection} onToggle={setExpandedSection} />
            )}

            {mode === 'ocr' && ocrResult && (
                <OCRResultView result={ocrResult} />
            )}

            {mode === 'chart' && chartData && (
                <ChartDataView data={chartData} />
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function ImageComparisonView({ comparison }: { comparison: ImageComparison }) {
    const changeTypeColors = {
        'added': 'text-green-400',
        'removed': 'text-red-400',
        'modified': 'text-yellow-400',
        'none': 'text-gray-400'
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/90">Bildvergleich</h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-white/50">Ähnlichkeit:</span>
                    <span className="text-sm font-medium text-cyan-400">
                        {Math.round(comparison.similarity * 100)}%
                    </span>
                </div>
            </div>

            {/* Similarity Bar */}
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400 to-green-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${comparison.similarity * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
            </div>

            {/* Change Type */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-white/50">Änderungstyp:</span>
                <span className={`text-sm font-medium ${changeTypeColors[comparison.changeType]}`}>
                    {comparison.changeType.toUpperCase()}
                </span>
                <span className="text-xs text-white/40">
                    ({Math.round(comparison.confidence * 100)}% Konfidenz)
                </span>
            </div>

            {/* Differences */}
            {comparison.differences.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-white/70 mb-2">
                        Unterschiede ({comparison.differences.length})
                    </h4>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                        {comparison.differences.map((diff, idx) => (
                            <div
                                key={idx}
                                className="px-2 py-1 bg-white/5 rounded text-xs text-white/70"
                            >
                                {diff}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function VideoAnalysisView({
    analysis,
    expanded,
    onToggle
}: {
    analysis: VideoAnalysis;
    expanded: string | null;
    onToggle: (section: string | null) => void;
}) {
    return (
        <div className="space-y-4">
            {/* Header */}
            <div>
                <h3 className="text-sm font-semibold text-white/90 mb-2">Videoanalyse</h3>
                <div className="flex items-center gap-4 text-xs text-white/50">
                    <span>{analysis.totalFrames} Frames</span>
                    <span>•</span>
                    <span>{analysis.duration.toFixed(1)}s Dauer</span>
                    <span>•</span>
                    <span>{analysis.keyFrames.length} Key Frames</span>
                    <span>•</span>
                    <span>{analysis.scenes.length} Szenen</span>
                </div>
            </div>

            {/* Summary */}
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/70">{analysis.summary}</p>
            </div>

            {/* Key Frames */}
            <div>
                <button
                    onClick={() => onToggle(expanded === 'frames' ? null : 'frames')}
                    className="w-full flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                    <span className="text-sm font-medium text-white/80">
                        Key Frames ({analysis.keyFrames.length})
                    </span>
                    <motion.div
                        animate={{ rotate: expanded === 'frames' ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <svg className="h-4 w-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </motion.div>
                </button>

                <AnimatePresence>
                    {expanded === 'frames' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 space-y-2"
                        >
                            {analysis.keyFrames.map((frame, idx) => (
                                <div
                                    key={idx}
                                    className="p-2 bg-white/5 rounded text-xs"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-white/70">Frame {frame.frameNumber}</span>
                                        <span className="text-white/50">{(frame.timestamp / 1000).toFixed(2)}s</span>
                                    </div>
                                    {frame.sceneChange && (
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-cyan-400/20 text-cyan-400 rounded text-[10px]">
                                            Scene Change
                                        </span>
                                    )}
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Scenes */}
            <div>
                <button
                    onClick={() => onToggle(expanded === 'scenes' ? null : 'scenes')}
                    className="w-full flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                    <span className="text-sm font-medium text-white/80">
                        Szenen ({analysis.scenes.length})
                    </span>
                    <motion.div
                        animate={{ rotate: expanded === 'scenes' ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <svg className="h-4 w-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </motion.div>
                </button>

                <AnimatePresence>
                    {expanded === 'scenes' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 space-y-2"
                        >
                            {analysis.scenes.map((scene, idx) => (
                                <div
                                    key={idx}
                                    className="p-3 bg-white/5 rounded"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-white/80">{scene.description}</span>
                                        <span className="text-xs text-white/50">{scene.duration.toFixed(1)}s</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {scene.objects.map((obj, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-0.5 bg-white/10 rounded text-[10px] text-white/60"
                                            >
                                                {obj}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function OCRResultView({ result }: { result: OCRResult }) {
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/90">OCR Ergebnis</h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-white/50">Konfidenz:</span>
                    <span className="text-sm font-medium text-cyan-400">
                        {Math.round(result.confidence * 100)}%
                    </span>
                </div>
            </div>

            {/* Extracted Text */}
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-sm text-white/80 font-mono whitespace-pre-wrap">
                    {result.text}
                </p>
            </div>

            {/* Text Blocks */}
            {result.blocks.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-white/70 mb-2">
                        Textblöcke ({result.blocks.length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {result.blocks.map((block, idx) => (
                            <div
                                key={idx}
                                className="p-2 bg-white/5 rounded"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-white/70 font-mono">{block.text}</span>
                                    <span className="text-[10px] text-white/40">
                                        {Math.round(block.confidence * 100)}%
                                    </span>
                                </div>
                                <div className="text-[10px] text-white/40">
                                    Position: ({block.x}, {block.y}) • Size: {block.width}x{block.height}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Language */}
            <div className="flex items-center gap-2 text-xs">
                <span className="text-white/50">Sprache:</span>
                <span className="px-2 py-1 bg-cyan-400/20 text-cyan-400 rounded">
                    {result.language.toUpperCase()}
                </span>
            </div>
        </div>
    );
}

function ChartDataView({ data }: { data: ChartData }) {
    const typeColors = {
        'bar': 'bg-blue-400/20 text-blue-400',
        'line': 'bg-green-400/20 text-green-400',
        'pie': 'bg-purple-400/20 text-purple-400',
        'scatter': 'bg-yellow-400/20 text-yellow-400',
        'table': 'bg-gray-400/20 text-gray-400',
        'flowchart': 'bg-cyan-400/20 text-cyan-400',
        'diagram': 'bg-pink-400/20 text-pink-400'
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-white/90">
                        {data.title || 'Diagrammanalyse'}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-xs ${typeColors[data.type]}`}>
                        {data.type.toUpperCase()}
                    </span>
                </div>

                {data.xAxis && data.yAxis && (
                    <div className="flex items-center gap-4 text-xs text-white/50">
                        <span>X: {data.xAxis}</span>
                        <span>•</span>
                        <span>Y: {data.yAxis}</span>
                    </div>
                )}
            </div>

            {/* Data Points */}
            {data.data.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-white/70 mb-2">
                        Datenpunkte ({data.data.length})
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        {data.data.map((point, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between px-2 py-1 bg-white/5 rounded text-xs"
                            >
                                <span className="text-white/70">
                                    {point.label || `Point ${idx + 1}`}
                                </span>
                                <span className="text-white/60">
                                    ({point.x}, {point.y})
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Labels */}
            {data.labels.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-white/70 mb-2">Labels</h4>
                    <div className="flex flex-wrap gap-1">
                        {data.labels.map((label, idx) => (
                            <span
                                key={idx}
                                className="px-2 py-1 bg-white/10 rounded text-xs text-white/60"
                            >
                                {label}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Insights */}
            {data.insights.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-white/70 mb-2">Erkenntnisse</h4>
                    <div className="space-y-2">
                        {data.insights.map((insight, idx) => (
                            <div
                                key={idx}
                                className="p-2 bg-white/5 rounded text-xs text-white/70"
                            >
                                {insight}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default AdvancedVisionPanel;
