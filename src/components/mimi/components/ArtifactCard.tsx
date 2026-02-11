"use client";

/**
 * MIMI Agent - Artifact Card Component
 * Displays code artifacts with copy, run, download, and expand/collapse.
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Code,
    Copy,
    Check,
    Loader2,
    FileDown,
    Play,
    Sparkles,
    Square
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Artifact } from "@/lib/mimi/inference-engine";

export interface ArtifactCardProps {
    artifact: Artifact;
    onExecute?: (artifact: Artifact) => void;
    onDownload?: (artifact: Artifact) => void;
    isExecuting: boolean;
    output?: string;
    chartBase64?: string;
}

export function ArtifactCard({ artifact, onExecute, onDownload, isExecuting, output, chartBase64 }: ArtifactCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const isPython = artifact.language === 'python';
    const isExecutable = isPython && onExecute;

    // Copy to Clipboard
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(artifact.content);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-white/10 bg-black/40 overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-white/5 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-brand-cyan" />
                    <span className="text-sm font-medium text-white">{artifact.title}</span>
                </div>
                <div className="flex gap-1">
                    {/* Copy Button */}
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCopy}
                        className="h-7 px-2 text-xs text-white/50 hover:text-white hover:bg-white/10"
                    >
                        {isCopied ? (
                            <Check className="w-3 h-3 text-green-400" />
                        ) : (
                            <Copy className="w-3 h-3" />
                        )}
                    </Button>
                    {isExecutable && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onExecute?.(artifact)}
                            disabled={isExecuting}
                            className="h-7 px-2 text-xs text-green-400 hover:text-green-300 hover:bg-green-500/10"
                        >
                            {isExecuting ? (
                                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                                <Play className="w-3 h-3 mr-1" />
                            )}
                            Run
                        </Button>
                    )}
                    {onDownload && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDownload(artifact)}
                            className="h-7 px-2 text-xs text-white/50 hover:text-white hover:bg-white/10"
                        >
                            <FileDown className="w-3 h-3" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Code */}
            <div className="relative">
                <pre className={cn(
                    "p-3 text-sm text-white/80 font-mono overflow-x-auto",
                    !isExpanded && "max-h-40"
                )}>
                    <code>{artifact.content}</code>
                </pre>

                {artifact.content.split('\n').length > 8 && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="absolute bottom-2 right-2 text-xs text-brand-cyan hover:text-brand-cyan/80"
                    >
                        {isExpanded ? "Weniger" : "Mehr..."}
                    </button>
                )}
            </div>

            {/* Chart Output (Matplotlib) */}
            {chartBase64 && (
                <div className="border-t border-white/10 bg-white/5 p-3">
                    <div className="flex items-center gap-2 text-xs text-purple-400 mb-2">
                        <Sparkles className="w-3 h-3" />
                        Chart:
                    </div>
                    <img
                        src={`data:image/png;base64,${chartBase64}`}
                        alt="Generated Chart"
                        className="max-w-full rounded-lg border border-white/10"
                    />
                </div>
            )}

            {/* Text Output */}
            {output && (
                <div className="border-t border-white/10 bg-green-500/5 p-3">
                    <div className="flex items-center gap-2 text-xs text-green-400 mb-1">
                        <Square className="w-3 h-3" />
                        Output:
                    </div>
                    <pre className="text-sm text-white/70 font-mono whitespace-pre-wrap">
                        {output}
                    </pre>
                </div>
            )}
        </motion.div>
    );
}
