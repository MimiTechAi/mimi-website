/**
 * MIMI Agent - Chat History Service
 * 
 * Persistente Chat-History via Dexie.js (IndexedDB).
 * 🔥 Unified via MimiPortalDB — replaces OPFS file-per-conversation approach.
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { db } from '@/lib/local-db';
import type { MimiConversation, MimiConversationMessage } from '@/lib/local-db';

// ─── Types ───────────────────────────────────────────────────────

export interface SerializedMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string; // ISO string for JSON serialization
    artifacts?: Array<{
        id: string;
        type: string;
        language?: string;
        title?: string;
        content: string;
    }>;
}

export interface Conversation {
    id: string;
    title: string;
    messages: SerializedMessage[];
    createdAt: string;
    updatedAt: string;
}

export interface ConversationSummary {
    id: string;
    title: string;
    messageCount: number;
    createdAt: string;
    updatedAt: string;
    preview: string; // First user message (truncated)
}

// ─── Constants ───────────────────────────────────────────────────

const ACTIVE_CONVERSATION_KEY = 'mimi-active-conversation-id';
const MAX_TITLE_LENGTH = 50;
const MAX_PREVIEW_LENGTH = 80;

// ─── Service ─────────────────────────────────────────────────────

class ChatHistoryService {
    private initialized = false;
    private initPromise: Promise<void> | null = null;
    private saveTimers = new Map<string, ReturnType<typeof setTimeout>>();
    private pendingSaveData = new Map<string, SerializedMessage[]>();

    /**
     * Initialize — Dexie handles connection automatically.
     */
    async init(): Promise<void> {
        if (this.initialized) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = this._doInit();
        await this.initPromise;
    }

    private async _doInit(): Promise<void> {
        try {
            if (typeof window === 'undefined') {
                return;
            }

            // Dexie auto-opens — just verify the tables exist
            await db.mimiConversations.count();
            this.initialized = true;
            this.registerBeforeUnload();
            console.log('[ChatHistory] ✅ Initialized via Dexie');
        } catch (err) {
            console.error('[ChatHistory] Failed to initialize:', err);
        }
    }

    /**
     * Register beforeunload handler to flush pending saves on tab close.
     */
    private registerBeforeUnload(): void {
        if (typeof window === 'undefined') return;
        window.addEventListener('beforeunload', () => {
            // IndexedDB writes are allowed during unload events
            void this.flushPendingSaves();
        });
    }

    // ─── CRUD Operations ─────────────────────────────────────────

    /**
     * Create a new conversation from the first user message.
     */
    async createConversation(firstMessage: string): Promise<string> {
        await this.init();
        const id = this.generateId();
        const title = this.generateTitle(firstMessage);
        const now = new Date().toISOString();

        const conversation: MimiConversation = {
            id,
            title,
            createdAt: now,
            updatedAt: now,
        };

        await db.mimiConversations.put(conversation);
        this.setActiveConversationId(id);
        return id;
    }

    /**
     * Save messages to an existing conversation (debounced, 2s).
     */
    saveConversationDebounced(id: string, messages: SerializedMessage[]): void {
        const existing = this.saveTimers.get(id);
        if (existing) clearTimeout(existing);

        // Store the payload so flushPendingSaves() can save it
        this.pendingSaveData.set(id, messages);

        this.saveTimers.set(id, setTimeout(async () => {
            this.saveTimers.delete(id);
            this.pendingSaveData.delete(id);
            await this.saveConversation(id, messages);
        }, 2000));
    }

    /**
     * Save messages immediately.
     */
    async saveConversation(id: string, messages: SerializedMessage[]): Promise<void> {
        await this.init();

        try {
            // Read existing conversation to preserve metadata
            const existing = await db.mimiConversations.get(id);
            const conversation: MimiConversation = existing ?? {
                id,
                title: this.generateTitle(
                    messages.find(m => m.role === 'user')?.content ?? 'Neuer Chat'
                ),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            // Update title if it was "Neuer Chat" and we now have a user message
            if (conversation.title === 'Neuer Chat' && messages.length > 0) {
                const firstUserMsg = messages.find(m => m.role === 'user');
                if (firstUserMsg) {
                    conversation.title = this.generateTitle(firstUserMsg.content);
                }
            }

            conversation.updatedAt = new Date().toISOString();
            await db.mimiConversations.put(conversation);

            // Replace all messages for this conversation
            await db.mimiMessages
                .where('conversationId')
                .equals(id)
                .delete();

            if (messages.length > 0) {
                await db.mimiMessages.bulkAdd(
                    messages.map(msg => ({
                        conversationId: id,
                        role: msg.role,
                        content: msg.content,
                        timestamp: msg.timestamp,
                        artifacts: msg.artifacts,
                    }))
                );
            }
        } catch (err) {
            console.error('[ChatHistory] Save failed:', err);
        }
    }

    /**
     * Load a conversation by ID.
     */
    async loadConversation(id: string): Promise<Conversation | null> {
        await this.init();

        const conv = await db.mimiConversations.get(id);
        if (!conv) return null;

        const dbMessages = await db.mimiMessages
            .where('conversationId')
            .equals(id)
            .sortBy('timestamp');

        const messages: SerializedMessage[] = dbMessages.map((msg, idx) => ({
            id: msg.id?.toString() ?? `msg_${idx}`,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            artifacts: msg.artifacts,
        }));

        return {
            id: conv.id,
            title: conv.title,
            messages,
            createdAt: conv.createdAt,
            updatedAt: conv.updatedAt,
        };
    }

    /**
     * List all conversations, sorted by updatedAt (newest first).
     */
    async listConversations(): Promise<ConversationSummary[]> {
        await this.init();

        const conversations = await db.mimiConversations
            .orderBy('updatedAt')
            .reverse()
            .toArray();

        const summaries: ConversationSummary[] = [];

        for (const conv of conversations) {
            const messageCount = await db.mimiMessages
                .where('conversationId')
                .equals(conv.id)
                .count();

            // Get first user message for preview
            const firstUserMsg = await db.mimiMessages
                .where('conversationId')
                .equals(conv.id)
                .filter(m => m.role === 'user')
                .first();

            summaries.push({
                id: conv.id,
                title: conv.title,
                messageCount,
                createdAt: conv.createdAt,
                updatedAt: conv.updatedAt,
                preview: firstUserMsg
                    ? firstUserMsg.content.slice(0, MAX_PREVIEW_LENGTH)
                    : '',
            });
        }

        return summaries;
    }

    /**
     * Rename a conversation.
     */
    async renameConversation(id: string, newTitle: string): Promise<void> {
        await this.init();
        await db.mimiConversations.update(id, {
            title: newTitle.trim().slice(0, MAX_TITLE_LENGTH) || 'Neuer Chat',
            updatedAt: new Date().toISOString(),
        });
    }

    /**
     * Delete a conversation.
     */
    async deleteConversation(id: string): Promise<void> {
        await this.init();

        // Delete conversation and all its messages
        await db.transaction('rw', db.mimiConversations, db.mimiMessages, async () => {
            await db.mimiMessages.where('conversationId').equals(id).delete();
            await db.mimiConversations.delete(id);
        });

        // If this was the active conversation, clear it
        if (this.getActiveConversationId() === id) {
            this.clearActiveConversationId();
        }
    }

    /**
     * Flush any pending debounced saves immediately.
     * Saves all pending data before clearing timers.
     */
    async flushPendingSaves(): Promise<void> {
        // Cancel all pending timers
        for (const [, timer] of this.saveTimers.entries()) {
            clearTimeout(timer);
        }
        this.saveTimers.clear();

        // Save all pending data
        const saves = Array.from(this.pendingSaveData.entries());
        this.pendingSaveData.clear();

        if (saves.length > 0) {
            console.log(`[ChatHistory] 💾 Flushing ${saves.length} pending save(s)...`);
            await Promise.all(
                saves.map(([id, msgs]) => this.saveConversation(id, msgs))
            );
        }
    }

    // ─── Active Conversation Tracking ────────────────────────────

    getActiveConversationId(): string | null {
        if (typeof localStorage === 'undefined') return null;
        return localStorage.getItem(ACTIVE_CONVERSATION_KEY);
    }

    setActiveConversationId(id: string): void {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(ACTIVE_CONVERSATION_KEY, id);
    }

    clearActiveConversationId(): void {
        if (typeof localStorage === 'undefined') return;
        localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
    }

    // ─── Private Helpers ─────────────────────────────────────────

    private generateId(): string {
        return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }

    private generateTitle(content: string): string {
        const cleaned = content
            .replace(/```[\s\S]*?```/g, '') // Remove code blocks
            .replace(/[#*_~`]/g, '')          // Remove markdown
            .replace(/\n+/g, ' ')             // Newlines to spaces
            .trim();

        if (!cleaned) return 'Neuer Chat';
        return cleaned.length > MAX_TITLE_LENGTH
            ? cleaned.slice(0, MAX_TITLE_LENGTH) + '…'
            : cleaned;
    }
}

// ─── Singleton ───────────────────────────────────────────────────

let instance: ChatHistoryService | null = null;

export function getChatHistory(): ChatHistoryService {
    if (!instance) {
        instance = new ChatHistoryService();
    }
    return instance;
}

export type { ChatHistoryService };
