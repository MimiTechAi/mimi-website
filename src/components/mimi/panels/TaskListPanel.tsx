"use client";

/**
 * TaskListPanel -- Left panel of the Manus 3-panel layout.
 *
 * Displays conversation history grouped by date, search, and navigation.
 * Consumes MimiAgentContext -- no props needed.
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { memo } from "react";
import { useMimiAgentContext } from "../MimiAgentContext";
import {
    MessageSquare, Brain, FolderOpen, Settings, Search, Trash2, X
} from "lucide-react";

export const TaskListPanel = memo(function TaskListPanel() {
    const ctx = useMimiAgentContext();

    return (
        <div className="mimi-panel panel-left">
            {/* Icon Rail Navigation */}
            <div className="sidebar-icon-rail" role="navigation" aria-label="Hauptnavigation">
                <div className="icon-rail-item active" title="Chat">
                    <MessageSquare className="w-4 h-4" />
                </div>
                <div className="icon-rail-item disabled" title="Kommt bald" style={{ opacity: 0.35, cursor: 'default' }} aria-disabled="true">
                    <Brain className="w-4 h-4" />
                </div>
                <div className="icon-rail-item disabled" title="Kommt bald" style={{ opacity: 0.35, cursor: 'default' }} aria-disabled="true">
                    <FolderOpen className="w-4 h-4" />
                </div>
                <div style={{ marginTop: 'auto' }} />
                <div className="icon-rail-item" title="Einstellungen" onClick={() => ctx.setShowSettings(true)}>
                    <Settings className="w-4 h-4" />
                </div>
            </div>

            <div className="logo-row">
                <div className="logo-avatar">M</div>
                <div className="search-box">
                    <span className="icon"><Search className="w-3.5 h-3.5" /></span>
                    <input
                        type="text"
                        placeholder="Suchen"
                        value={ctx.searchQuery}
                        onChange={e => ctx.setSearchQuery(e.target.value)}
                    />
                    {ctx.searchQuery && (
                        <button className="search-clear" onClick={() => ctx.setSearchQuery("")} title="Suche löschen"><X className="w-3 h-3" /></button>
                    )}
                </div>
            </div>

            <div className="tasks-list">
                {ctx.groupedConversations.length > 0 ? (
                    ctx.groupedConversations.map(group => (
                        <div key={group.label}>
                            <div className="group-label">{group.label}</div>
                            {group.items.map((conv, i) => (
                                <div
                                    key={conv.id}
                                    className={`task-item ${conv.id === ctx.activeConversationId ? "active" : ""}`}
                                    onClick={() => { if (ctx.editingConvId !== conv.id) ctx.setActiveConversationId(conv.id); }}
                                    onDoubleClick={(e) => { e.stopPropagation(); ctx.setEditingConvId(conv.id); ctx.setEditingTitle(conv.title); }}
                                >
                                    <div className={`task-dot ${i % 4 === 0 ? "dot-cyan" : i % 4 === 1 ? "dot-purple" : i % 4 === 2 ? "dot-blue" : "dot-amber"}`} />
                                    <div className="task-info">
                                        {ctx.editingConvId === conv.id ? (
                                            <input
                                                className="rename-input"
                                                value={ctx.editingTitle}
                                                onChange={e => ctx.setEditingTitle(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') ctx.handleRenameConversation(conv.id, ctx.editingTitle);
                                                    if (e.key === 'Escape') ctx.setEditingConvId(null);
                                                }}
                                                onBlur={() => ctx.handleRenameConversation(conv.id, ctx.editingTitle)}
                                                autoFocus
                                                onClick={e => e.stopPropagation()}
                                            />
                                        ) : (
                                            <h4>{conv.title}</h4>
                                        )}
                                        <p>{new Date(conv.updatedAt).toLocaleDateString("de-DE", { month: "short", day: "numeric" })}</p>
                                    </div>
                                    <button
                                        className="task-delete-btn"
                                        title="Löschen"
                                        onClick={e => { e.stopPropagation(); ctx.setConfirmDeleteId(conv.id); }}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ))
                ) : (
                    <div className="tasks-empty">
                        <div className="tasks-empty-icon"><MessageSquare className="w-6 h-6" style={{ opacity: 0.4 }} /></div>
                        <p>{ctx.searchQuery ? "Keine Ergebnisse" : "Starten Sie Ihre erste Konversation"}</p>
                    </div>
                )}
            </div>

            <div className="sidebar-bottom">
                <button className="new-thread-btn" onClick={ctx.handleNewConversation}>+ Neues Gespräch</button>
            </div>
        </div>
    );
});
