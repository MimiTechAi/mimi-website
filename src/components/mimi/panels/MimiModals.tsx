"use client";

/**
 * MimiModals -- Overlay modals for the MIMI agent.
 *
 * Extracted from page.tsx. Includes:
 * - Confirm Delete Dialog
 * - Settings Modal
 * - Toast Notifications
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { useMimiAgentContext } from "../MimiAgentContext";
import { getChatHistory } from "@/lib/mimi/chat-history";
import { Trash2 } from "lucide-react";

export function MimiModals() {
    const ctx = useMimiAgentContext();

    return (
        <>
            {/* Confirm Delete Dialog */}
            {ctx.confirmDeleteId && (
                <div className="modal-overlay" onClick={() => ctx.setConfirmDeleteId(null)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <h3>Konversation löschen?</h3>
                        <p>Diese Aktion kann nicht rückgängig gemacht werden.</p>
                        <div className="modal-actions">
                            <button className="modal-btn cancel" onClick={() => ctx.setConfirmDeleteId(null)}>Abbrechen</button>
                            <button className="modal-btn danger" onClick={() => ctx.handleDeleteConversation(ctx.confirmDeleteId!)}>Löschen</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {ctx.showSettings && (
                <div className="modal-overlay" onClick={() => ctx.setShowSettings(false)}>
                    <div className="modal-card settings-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Einstellungen</h3>
                            <button className="modal-close" onClick={() => ctx.setShowSettings(false)}>✕</button>
                        </div>
                        <div className="settings-section">
                            <h4>Modell</h4>
                            <div className="settings-row">
                                <span>Aktuelles Modell</span>
                                <span className="settings-value">Phi-3.5 Mini (lokal)</span>
                            </div>
                            <div className="settings-row">
                                <span>Status</span>
                                <span className="settings-value" style={{ color: ctx.isReady ? '#22c55e' : '#f59e0b' }}>{ctx.isReady ? 'Bereit' : 'Laden...'}</span>
                            </div>
                        </div>
                        <div className="settings-section">
                            <h4>Speicher</h4>
                            <div className="settings-row">
                                <span>Konversationen</span>
                                <span className="settings-value">{ctx.conversations.length}</span>
                            </div>
                            <button
                                className="settings-btn"
                                onClick={async () => {
                                    try {
                                        const service = getChatHistory();
                                        for (const conv of ctx.conversations) {
                                            await service.deleteConversation(conv.id);
                                        }
                                        // Reset via new conversation
                                        ctx.handleNewConversation();
                                        ctx.addToast("Alle Konversationen gelöscht");
                                    } catch {
                                        ctx.addToast("Fehler beim Löschen");
                                    }
                                }}
                            >
                                <Trash2 className="w-3.5 h-3.5" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Alle Konversationen löschen
                            </button>
                        </div>
                        <div className="settings-section">
                            <h4>Tastenkürzel</h4>
                            <div className="settings-row"><span>Neues Gespräch</span><kbd>⌘N</kbd></div>
                            <div className="settings-row"><span>Suche fokussieren</span><kbd>⌘K</kbd></div>
                            <div className="settings-row"><span>Schließen / Abbrechen</span><kbd>Esc</kbd></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast notifications */}
            {ctx.toasts.length > 0 && (
                <div className="toast-container">
                    {ctx.toasts.map(t => (
                        <div key={t.id} className="toast-item">{t.msg}</div>
                    ))}
                </div>
            )}
        </>
    );
}
