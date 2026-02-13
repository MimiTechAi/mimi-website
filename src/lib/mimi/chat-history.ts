/**
 * MIMI Agent - Chat History Service
 * 
 * Persistente Chat-History via OPFS (Origin Private File System).
 * Speichert Conversations als JSON-Dateien in einem dedizierten Verzeichnis.
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 */

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

const HISTORY_DIR = '.mimi-chat-history';
const ACTIVE_CONVERSATION_KEY = 'mimi-active-conversation-id';
const MAX_TITLE_LENGTH = 50;
const MAX_PREVIEW_LENGTH = 80;

// ─── Service ─────────────────────────────────────────────────────

class ChatHistoryService {
    private rootHandle: FileSystemDirectoryHandle | null = null;
    private historyHandle: FileSystemDirectoryHandle | null = null;
    private initialized = false;
    private initPromise: Promise<void> | null = null;
    private saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

    /**
     * Initialize OPFS directory for chat history.
     * Uses its own dedicated directory, independent of MimiFilesystem.
     */
    async init(): Promise<void> {
        if (this.initialized) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = this._doInit();
        await this.initPromise;
    }

    private async _doInit(): Promise<void> {
        try {
            if (typeof navigator === 'undefined' || !navigator.storage) {
                console.warn('[ChatHistory] OPFS not available (SSR or unsupported browser)');
                return;
            }

            this.rootHandle = await navigator.storage.getDirectory();
            this.historyHandle = await this.rootHandle.getDirectoryHandle(
                HISTORY_DIR,
                { create: true }
            );
            this.initialized = true;
            console.log('[ChatHistory] Initialized OPFS storage');
        } catch (err) {
            console.error('[ChatHistory] Failed to initialize:', err);
        }
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

        const conversation: Conversation = {
            id,
            title,
            messages: [],
            createdAt: now,
            updatedAt: now,
        };

        await this.writeConversation(conversation);
        this.setActiveConversationId(id);
        return id;
    }

    /**
     * Save messages to an existing conversation (debounced, 2s).
     */
    saveConversationDebounced(id: string, messages: SerializedMessage[]): void {
        const existing = this.saveTimers.get(id);
        if (existing) clearTimeout(existing);

        this.saveTimers.set(id, setTimeout(async () => {
            this.saveTimers.delete(id);
            await this.saveConversation(id, messages);
        }, 2000));
    }

    /**
     * Save messages immediately.
     */
    async saveConversation(id: string, messages: SerializedMessage[]): Promise<void> {
        await this.init();
        if (!this.historyHandle) return;

        try {
            // Read existing conversation to preserve metadata
            const existing = await this.readConversation(id);
            const conversation: Conversation = existing ?? {
                id,
                title: this.generateTitle(
                    messages.find(m => m.role === 'user')?.content ?? 'Neuer Chat'
                ),
                messages: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            conversation.messages = messages;
            conversation.updatedAt = new Date().toISOString();

            // Update title if it was "Neuer Chat" and we now have a user message
            if (conversation.title === 'Neuer Chat' && messages.length > 0) {
                const firstUserMsg = messages.find(m => m.role === 'user');
                if (firstUserMsg) {
                    conversation.title = this.generateTitle(firstUserMsg.content);
                }
            }

            await this.writeConversation(conversation);
        } catch (err) {
            console.error('[ChatHistory] Save failed:', err);
        }
    }

    /**
     * Load a conversation by ID.
     */
    async loadConversation(id: string): Promise<Conversation | null> {
        await this.init();
        return this.readConversation(id);
    }

    /**
     * List all conversations, sorted by updatedAt (newest first).
     */
    async listConversations(): Promise<ConversationSummary[]> {
        await this.init();
        if (!this.historyHandle) return [];

        const summaries: ConversationSummary[] = [];

        try {
            for await (const [name, handle] of (this.historyHandle as any).entries()) {
                if (handle.kind !== 'file' || !name.endsWith('.json')) continue;

                try {
                    const file: File = await (handle as FileSystemFileHandle).getFile();
                    const text = await file.text();
                    const conv: Conversation = JSON.parse(text);

                    const firstUserMsg = conv.messages.find(m => m.role === 'user');
                    summaries.push({
                        id: conv.id,
                        title: conv.title,
                        messageCount: conv.messages.length,
                        createdAt: conv.createdAt,
                        updatedAt: conv.updatedAt,
                        preview: firstUserMsg
                            ? firstUserMsg.content.slice(0, MAX_PREVIEW_LENGTH)
                            : '',
                    });
                } catch {
                    // Skip corrupted files
                }
            }
        } catch (err) {
            console.error('[ChatHistory] List failed:', err);
        }

        return summaries.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
    }

    /**
     * Rename a conversation.
     */
    async renameConversation(id: string, newTitle: string): Promise<void> {
        await this.init();
        const conv = await this.readConversation(id);
        if (!conv) return;
        conv.title = newTitle.trim().slice(0, MAX_TITLE_LENGTH) || 'Neuer Chat';
        conv.updatedAt = new Date().toISOString();
        await this.writeConversation(conv);
    }

    /**
     * Delete a conversation.
     */
    async deleteConversation(id: string): Promise<void> {
        await this.init();
        if (!this.historyHandle) return;

        try {
            await this.historyHandle.removeEntry(`${id}.json`);

            // If this was the active conversation, clear it
            if (this.getActiveConversationId() === id) {
                this.clearActiveConversationId();
            }
        } catch {
            // File may not exist, that's fine
        }
    }

    /**
     * Flush any pending debounced saves immediately.
     */
    async flushPendingSaves(): Promise<void> {
        for (const [id, timer] of this.saveTimers.entries()) {
            clearTimeout(timer);
            this.saveTimers.delete(id);
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

    private async writeConversation(conv: Conversation): Promise<void> {
        if (!this.historyHandle) return;

        const fileHandle = await this.historyHandle.getFileHandle(
            `${conv.id}.json`,
            { create: true }
        );
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(conv, null, 2));
        await writable.close();
    }

    private async readConversation(id: string): Promise<Conversation | null> {
        if (!this.historyHandle) return null;

        try {
            const fileHandle = await this.historyHandle.getFileHandle(`${id}.json`);
            const file = await fileHandle.getFile();
            const text = await file.text();
            return JSON.parse(text) as Conversation;
        } catch {
            return null; // File doesn't exist
        }
    }

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
