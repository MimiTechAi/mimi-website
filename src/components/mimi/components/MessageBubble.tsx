"use client";

/**
 * MIMI Agent - Message Bubble Component
 * Renders individual chat messages with action buttons, editing, and artifact display.
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Bot,
    Copy,
    Check,
    Trash2,
    VolumeX,
    Volume2,
    Edit3,
    RotateCcw,
    User
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Artifact } from "@/lib/mimi/inference-engine";
import { MarkdownRenderer } from "../MarkdownRenderer";
import { ArtifactCard } from "./ArtifactCard";
import { detectDisclaimer, detectUncertainty } from "@/hooks/useDisclaimerDetection";

export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    artifacts?: Artifact[];
    isThinking?: boolean;
}

export interface MessageBubbleProps {
    message: Message;
    copiedId: string | null;
    onCopy: (content: string, id: string) => void;
    onExecuteCode?: (artifact: Artifact) => void;
    onDownload?: (artifact: Artifact) => void;
    onSpeak?: (text: string) => void;
    isSpeaking?: boolean;
    executingCode: string | null;
    codeOutput: Record<string, string>;
    chartOutput: Record<string, string>;
    onDelete?: (messageId: string) => void;
    onEdit?: (messageId: string, newContent: string) => void;
    onRegenerate?: () => void;
    isLastAssistantMessage?: boolean;
}

// Message Content with Markdown Rendering
function MessageContent({ content }: { content: string }) {
    // Clean up raw tool metadata, JSON, and code blocks from display
    let cleanContent = content
        // Remove fenced code blocks (displayed in ArtifactCards instead)
        .replace(/```[\s\S]*?```/g, '')
        // Remove inline JSON tool calls: {"tool": "...", ...}
        .replace(/\{"tool"\s*:[\s\S]*?\}/g, '')
        // Remove tool start lines: 🔧 *Tool: ...* 
        .replace(/^🔧\s*\*Tool:.*$/gm, '')
        // Remove tool result lines: ✅ **toolname** (...) or ❌ **toolname** (...)
        .replace(/^[✅❌]\s*\*\*\w+\*\*.*$/gm, '')
        // Remove [TOOL_RESULTS] blocks
        .replace(/\[TOOL_RESULTS\][\s\S]*?(?=\n\n|\n[A-Z]|$)/g, '')
        // Remove separator lines
        .replace(/^---$/gm, '')
        // Remove [HINT: ...] system injections that leaked
        .replace(/\[HINT:.*?\]/g, '')
        // Collapse excessive newlines
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    return (
        <MarkdownRenderer
            content={cleanContent || content}
            className="text-white/90"
        />
    );
}

export function MessageBubble({
    message,
    copiedId,
    onCopy,
    onExecuteCode,
    onDownload,
    onSpeak,
    isSpeaking,
    executingCode,
    codeOutput,
    chartOutput,
    onDelete,
    onEdit,
    onRegenerate,
    isLastAssistantMessage = false
}: MessageBubbleProps) {
    const isUser = message.role === "user";
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);

    // Handle edit submit
    const handleEditSubmit = () => {
        if (editContent.trim() && onEdit) {
            onEdit(message.id, editContent.trim());
            setIsEditing(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
        >
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-cyan to-brand-purple flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                </div>
            )}

            <div className={cn("max-w-[85%] space-y-2")}>
                {/* Edit Mode for User Messages */}
                {isEditing && isUser ? (
                    <div className="space-y-2">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full min-h-[80px] p-3 rounded-xl bg-white/10 border border-brand-cyan/50 text-white resize-none focus:outline-none focus:ring-2 focus:ring-brand-cyan/50"
                            autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditContent(message.content);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 text-sm"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={handleEditSubmit}
                                className="px-3 py-1.5 rounded-lg bg-brand-cyan/20 hover:bg-brand-cyan/30 text-brand-cyan text-sm"
                            >
                                Senden
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Main Message */}
                        <div
                            className={cn(
                                "group relative rounded-2xl px-4 py-3",
                                isUser
                                    ? "bg-brand-cyan/20 text-white"
                                    : "bg-white/5 text-white/90 border border-white/10"
                            )}
                        >
                            <MessageContent content={message.content} />

                            {/* Action Buttons */}
                            <div className="absolute -right-2 -top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {isUser ? (
                                    <>
                                        {/* Edit Button (User) */}
                                        {onEdit && (
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="bg-black/50 rounded-full p-1.5 hover:bg-black/70"
                                                title="Bearbeiten"
                                            >
                                                <Edit3 className="w-3 h-3 text-white/50" />
                                            </button>
                                        )}
                                        {/* Delete Button */}
                                        {onDelete && (
                                            <button
                                                onClick={() => onDelete(message.id)}
                                                className="bg-black/50 rounded-full p-1.5 hover:bg-red-500/50"
                                                title="Löschen"
                                            >
                                                <Trash2 className="w-3 h-3 text-white/50" />
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {/* Copy Button */}
                                        <button
                                            onClick={() => onCopy(message.content, message.id)}
                                            className="bg-black/50 rounded-full p-1.5 hover:bg-black/70"
                                            title="Kopieren"
                                        >
                                            {copiedId === message.id ? (
                                                <Check className="w-3 h-3 text-green-500" />
                                            ) : (
                                                <Copy className="w-3 h-3 text-white/50" />
                                            )}
                                        </button>

                                        {/* Regenerate Button (only for last assistant message) */}
                                        {isLastAssistantMessage && onRegenerate && (
                                            <button
                                                onClick={onRegenerate}
                                                className="bg-black/50 rounded-full p-1.5 hover:bg-brand-cyan/30"
                                                title="Neu generieren"
                                            >
                                                <RotateCcw className="w-3 h-3 text-white/50" />
                                            </button>
                                        )}

                                        {/* Speak Button */}
                                        {onSpeak && (
                                            <button
                                                onClick={() => onSpeak(message.content)}
                                                className="bg-black/50 rounded-full p-1.5 hover:bg-black/70"
                                                title="Vorlesen"
                                            >
                                                {isSpeaking ? (
                                                    <VolumeX className="w-3 h-3 text-brand-cyan" />
                                                ) : (
                                                    <Volume2 className="w-3 h-3 text-white/50" />
                                                )}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Artifacts */}
                        {message.artifacts && message.artifacts.length > 0 && (
                            <div className="space-y-2">
                                {message.artifacts.map((artifact, i) => (
                                    <ArtifactCard
                                        key={i}
                                        artifact={artifact}
                                        onExecute={onExecuteCode}
                                        onDownload={onDownload}
                                        isExecuting={executingCode !== null}
                                        output={codeOutput[artifact.content]}
                                        chartBase64={chartOutput[artifact.content]}
                                    />
                                ))}
                            </div>
                        )}

                        {/* ── P0: Disclaimer + Konfidenz-Indikator ─────────────────────────── */}
                        {!isUser && (() => {
                            const disclaimer = detectDisclaimer(message.content);
                            const isUncertain = detectUncertainty(message.content);
                            if (!disclaimer.showDisclaimer && !isUncertain) return null;
                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                                    {/* Disclaimer Banner */}
                                    {disclaimer.showDisclaimer && (
                                        <div
                                            role="note"
                                            aria-label={disclaimer.label}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: '8px',
                                                padding: '8px 12px',
                                                borderRadius: '10px',
                                                background: 'rgba(245,158,11,0.08)',
                                                border: '1px solid rgba(245,158,11,0.25)',
                                                fontSize: '11px',
                                                lineHeight: '1.5',
                                                color: 'rgba(253,230,138,0.85)',
                                            }}
                                        >
                                            <span style={{ fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>⚠️</span>
                                            <span>
                                                <strong style={{ fontWeight: 600 }}>{disclaimer.label}:</strong>{' '}
                                                {disclaimer.detail}
                                            </span>
                                        </div>
                                    )}
                                    {/* Konfidenz-Badge */}
                                    {isUncertain && (
                                        <div
                                            role="note"
                                            aria-label="Bitte verifizieren"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '5px',
                                                padding: '4px 10px',
                                                borderRadius: '999px',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.12)',
                                                fontSize: '11px',
                                                color: 'rgba(255,255,255,0.45)',
                                                alignSelf: 'flex-start',
                                            }}
                                        >
                                            <span>🤔</span>
                                            <span>Bitte verifizieren — MIMI ist sich nicht vollständig sicher</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </>
                )}
            </div>

            {isUser && (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                </div>
            )}
        </motion.div>
    );
}
