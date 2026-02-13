"use client";

/**
 * MIMI Agent — Task History Panel (Left Sidebar)
 * 
 * Manus AI-style task list with search, project cards,
 * and glassmorphic dark design.
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Plus,
    Trash2,
    MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationSummary } from "@/lib/mimi/chat-history";

interface TaskHistoryPanelProps {
    conversations: ConversationSummary[];
    activeConversationId: string | null;
    onLoadConversation: (id: string) => void;
    onNewConversation: () => void;
    onDeleteConversation?: (id: string) => void;
    className?: string;
}

// Color cycle for task dots
const DOT_COLORS = ["green", "cyan", "purple", "blue", "amber"] as const;

export function TaskHistoryPanel({
    conversations,
    activeConversationId,
    onLoadConversation,
    onNewConversation,
    onDeleteConversation,
    className,
}: TaskHistoryPanelProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredConversations = conversations.filter((conv) =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={cn("mimi-panel mimi-left-panel", className)}>
            {/* Header with logo & search */}
            <div className="mimi-left-header">
                <div className="mimi-left-logo">
                    <div className="mimi-left-logo-icon">M</div>
                    <div>
                        <div className="text-[13px] font-bold text-white/90">MIMI Agent</div>
                        <div className="text-[10px] text-white/30">Sovereign Intelligence</div>
                    </div>
                </div>

                {/* Search bar */}
                <div className="mimi-search-bar">
                    <Search className="mimi-search-icon w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* New conversation button */}
            <div className="px-3 pt-3 pb-1">
                <button
                    onClick={onNewConversation}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/15 text-cyan-400 text-xs font-medium hover:from-cyan-500/15 hover:to-blue-500/15 transition-all"
                >
                    <Plus className="w-3.5 h-3.5" />
                    New Task
                </button>
            </div>

            {/* Task list */}
            <div className="mimi-task-list">
                <AnimatePresence mode="popLayout">
                    {filteredConversations.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-12 text-center"
                        >
                            <MessageSquare className="w-8 h-8 text-white/10 mb-3" />
                            <p className="text-xs text-white/25">
                                {searchQuery
                                    ? "Keine Ergebnisse"
                                    : "Starten Sie eine neue Aufgabe"}
                            </p>
                        </motion.div>
                    ) : (
                        filteredConversations.map((conv, idx) => (
                            <motion.div
                                key={conv.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ delay: idx * 0.03 }}
                                className={cn(
                                    "mimi-task-card group",
                                    conv.id === activeConversationId && "active"
                                )}
                                onClick={() => onLoadConversation(conv.id)}
                            >
                                <div
                                    className={cn(
                                        "mimi-task-dot",
                                        DOT_COLORS[idx % DOT_COLORS.length]
                                    )}
                                />
                                <div className="mimi-task-info">
                                    <div className="mimi-task-title">{conv.title}</div>
                                    <div className="mimi-task-meta">
                                        {formatDate(conv.updatedAt)} • {conv.messageCount} messages
                                    </div>
                                </div>
                                {/* Delete on hover */}
                                {onDeleteConversation && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteConversation(conv.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-all"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                )}
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function formatDate(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffH < 24) return `${diffH}h ago`;
    if (diffD < 7) return `${diffD}d ago`;

    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
        return `Today, ${date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        })}`;
    }

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}

export default TaskHistoryPanel;
