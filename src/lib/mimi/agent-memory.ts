"use client";

/**
 * MIMI Agent — Persistent Memory Service
 * 
 * Implements cross-session agent memory using IndexedDB.
 * Stores:
 * - Task summaries (what the agent accomplished)
 * - User preferences (learned interaction patterns)
 * - Tool results cache (avoid re-executing identical operations)
 * - Context snapshots (resume interrupted workflows)
 * 
 * Uses a tiered importance system: critical > useful > ambient
 * Auto-prunes entries older than 30 days or when storage exceeds 5MB.
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 */

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface MemoryEntry {
    id: string;
    type: 'task_summary' | 'user_preference' | 'tool_cache' | 'context_snapshot' | 'learned_fact';
    importance: 'critical' | 'useful' | 'ambient';
    content: string;
    metadata: Record<string, unknown>;
    createdAt: number;
    accessedAt: number;
    accessCount: number;
    expiresAt?: number; // Auto-expire timestamp
}

export interface ContextWindow {
    systemContext: string;    // Always included
    recentHistory: string;   // Last N messages
    relevantMemory: string;  // Retrieved from memory
    toolResults: string;     // Accumulated tool outputs
    totalTokenEstimate: number;
}

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

const DB_NAME = 'mimi-agent-memory';
const DB_VERSION = 1;
const STORE_NAME = 'memories';
const MAX_ENTRIES = 500;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_CONTEXT_TOKENS = 2048; // Token budget for memory injection
const CHARS_PER_TOKEN = 4; // Rough estimate

// ═══════════════════════════════════════════════════════════
// AGENT MEMORY SERVICE
// ═══════════════════════════════════════════════════════════

export class AgentMemoryService {
    private db: IDBDatabase | null = null;
    private cache: Map<string, MemoryEntry> = new Map();
    private initialized = false;

    /**
     * Initialize IndexedDB connection
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;
        if (typeof window === 'undefined' || !window.indexedDB) {
            console.warn('[AgentMemory] IndexedDB not available');
            this.initialized = true;
            return;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('type', 'type', { unique: false });
                    store.createIndex('importance', 'importance', { unique: false });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                    store.createIndex('accessedAt', 'accessedAt', { unique: false });
                }
            };

            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                this.initialized = true;
                this.loadCache().then(resolve);
            };

            request.onerror = () => {
                console.error('[AgentMemory] Failed to open IndexedDB');
                this.initialized = true;
                resolve(); // Don't block — memory is non-critical
            };
        });
    }

    /**
     * Store a memory entry
     */
    async store(entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'accessedAt' | 'accessCount'>): Promise<string> {
        const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const fullEntry: MemoryEntry = {
            ...entry,
            id,
            createdAt: Date.now(),
            accessedAt: Date.now(),
            accessCount: 0,
        };

        this.cache.set(id, fullEntry);
        await this.persist(fullEntry);
        await this.pruneIfNeeded();

        console.log(`[AgentMemory] Stored: ${entry.type} (${entry.importance}) — ${entry.content.slice(0, 60)}...`);
        return id;
    }

    /**
     * Store a task summary after completion
     */
    async storeTaskSummary(title: string, steps: string[], result: string, duration: number): Promise<string> {
        return this.store({
            type: 'task_summary',
            importance: 'useful',
            content: `Task: ${title}\nSteps: ${steps.join(' → ')}\nResult: ${result}\nDuration: ${Math.round(duration / 1000)}s`,
            metadata: { title, stepCount: steps.length, duration, completedAt: Date.now() },
        });
    }

    /**
     * Store a learned user preference
     */
    async storePreference(key: string, value: string): Promise<string> {
        // Check for existing preference with same key
        for (const [id, entry] of this.cache) {
            if (entry.type === 'user_preference' && (entry.metadata as any).key === key) {
                // Update existing
                entry.content = `${key}: ${value}`;
                entry.accessedAt = Date.now();
                entry.accessCount++;
                await this.persist(entry);
                return id;
            }
        }

        return this.store({
            type: 'user_preference',
            importance: 'critical',
            content: `${key}: ${value}`,
            metadata: { key, value },
        });
    }

    /**
     * Cache a tool result for deduplication
     */
    async cacheToolResult(toolName: string, params: string, result: string): Promise<string> {
        const cacheKey = `${toolName}:${params}`;
        // Check for existing cache
        for (const [, entry] of this.cache) {
            if (entry.type === 'tool_cache' && (entry.metadata as any).cacheKey === cacheKey) {
                entry.accessedAt = Date.now();
                entry.accessCount++;
                await this.persist(entry);
                return entry.id;
            }
        }

        return this.store({
            type: 'tool_cache',
            importance: 'ambient',
            content: result.slice(0, 1000), // Cap cached results
            metadata: { toolName, cacheKey },
            expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24h cache
        });
    }

    /**
     * Store a learned fact from conversation
     */
    async storeLearnedFact(fact: string, source: string): Promise<string> {
        return this.store({
            type: 'learned_fact',
            importance: 'useful',
            content: fact,
            metadata: { source, learnedAt: Date.now() },
        });
    }

    /**
     * Retrieve relevant memories for a query
     * Uses simple keyword matching (no vector DB needed for local-first)
     */
    async retrieve(query: string, options: {
        types?: MemoryEntry['type'][];
        limit?: number;
        minImportance?: MemoryEntry['importance'];
    } = {}): Promise<MemoryEntry[]> {
        const { types, limit = 10, minImportance } = options;
        const importanceOrder = { critical: 3, useful: 2, ambient: 1 };
        const minLevel = minImportance ? importanceOrder[minImportance] : 0;

        const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        const scored: { entry: MemoryEntry; score: number }[] = [];

        for (const [, entry] of this.cache) {
            // Filter by type
            if (types && !types.includes(entry.type)) continue;
            // Filter by importance
            if (importanceOrder[entry.importance] < minLevel) continue;
            // Filter expired
            if (entry.expiresAt && entry.expiresAt < Date.now()) continue;

            // Score by keyword overlap + recency + access frequency
            const contentLower = entry.content.toLowerCase();
            let score = 0;
            for (const word of queryWords) {
                if (contentLower.includes(word)) score += 2;
            }
            // Recency boost (0-1, decays over 7 days)
            const age = Date.now() - entry.accessedAt;
            score += Math.max(0, 1 - age / (7 * 24 * 60 * 60 * 1000));
            // Frequency boost
            score += Math.min(entry.accessCount * 0.1, 1);
            // Importance boost
            score += importanceOrder[entry.importance];

            if (score > 1) { // Minimum threshold
                scored.push({ entry, score });
            }
        }

        // Sort by score descending, take top N
        scored.sort((a, b) => b.score - a.score);
        const results = scored.slice(0, limit).map(s => s.entry);

        // Update access timestamps
        for (const entry of results) {
            entry.accessedAt = Date.now();
            entry.accessCount++;
            this.persist(entry); // Fire-and-forget
        }

        return results;
    }

    /**
     * Check if a tool result is cached
     */
    async getCachedToolResult(toolName: string, params: string): Promise<string | null> {
        const cacheKey = `${toolName}:${params}`;
        for (const [, entry] of this.cache) {
            if (entry.type === 'tool_cache'
                && (entry.metadata as any).cacheKey === cacheKey
                && (!entry.expiresAt || entry.expiresAt > Date.now())) {
                entry.accessedAt = Date.now();
                entry.accessCount++;
                return entry.content;
            }
        }
        return null;
    }

    /**
     * Build a memory context string for injection into prompts
     */
    async buildMemoryContext(query: string): Promise<string> {
        if (this.cache.size === 0) return '';

        const relevantMemories = await this.retrieve(query, {
            types: ['task_summary', 'user_preference', 'learned_fact'],
            limit: 5,
            minImportance: 'useful',
        });

        if (relevantMemories.length === 0) return '';

        const lines: string[] = ['[AGENT MEMORY — Relevant past knowledge]'];
        let tokenBudget = MAX_CONTEXT_TOKENS;

        for (const mem of relevantMemories) {
            const line = `• [${mem.type}] ${mem.content}`;
            const tokenCost = Math.ceil(line.length / CHARS_PER_TOKEN);
            if (tokenCost > tokenBudget) break;
            tokenBudget -= tokenCost;
            lines.push(line);
        }

        return lines.join('\n');
    }

    /**
     * Get memory stats
     */
    getStats(): { total: number; byType: Record<string, number>; byImportance: Record<string, number> } {
        const byType: Record<string, number> = {};
        const byImportance: Record<string, number> = {};

        for (const [, entry] of this.cache) {
            byType[entry.type] = (byType[entry.type] || 0) + 1;
            byImportance[entry.importance] = (byImportance[entry.importance] || 0) + 1;
        }

        return { total: this.cache.size, byType, byImportance };
    }

    /**
     * Clear all memories
     */
    async clear(): Promise<void> {
        this.cache.clear();
        if (this.db) {
            const tx = this.db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).clear();
        }
    }

    // ─── INTERNAL ─────────────────────────────────

    private async loadCache(): Promise<void> {
        if (!this.db) return;

        return new Promise((resolve) => {
            const tx = this.db!.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const entries = request.result as MemoryEntry[];
                for (const entry of entries) {
                    // Skip expired
                    if (entry.expiresAt && entry.expiresAt < Date.now()) continue;
                    // Skip very old
                    if (Date.now() - entry.createdAt > MAX_AGE_MS) continue;
                    this.cache.set(entry.id, entry);
                }
                console.log(`[AgentMemory] Loaded ${this.cache.size} memories from IndexedDB`);
                resolve();
            };

            request.onerror = () => {
                console.error('[AgentMemory] Failed to load cache');
                resolve();
            };
        });
    }

    private async persist(entry: MemoryEntry): Promise<void> {
        if (!this.db) return;

        return new Promise((resolve) => {
            try {
                const tx = this.db!.transaction(STORE_NAME, 'readwrite');
                tx.objectStore(STORE_NAME).put(entry);
                tx.oncomplete = () => resolve();
                tx.onerror = () => resolve();
            } catch {
                resolve();
            }
        });
    }

    private async pruneIfNeeded(): Promise<void> {
        if (this.cache.size <= MAX_ENTRIES) return;

        // Remove expired and old entries first
        const now = Date.now();
        const toDelete: string[] = [];
        for (const [id, entry] of this.cache) {
            if ((entry.expiresAt && entry.expiresAt < now) || (now - entry.createdAt > MAX_AGE_MS)) {
                toDelete.push(id);
            }
        }
        for (const id of toDelete) {
            this.cache.delete(id);
            if (this.db) {
                try {
                    const tx = this.db.transaction(STORE_NAME, 'readwrite');
                    tx.objectStore(STORE_NAME).delete(id);
                } catch { /* ignore */ }
            }
        }

        // If still over limit, remove lowest-importance oldest entries
        if (this.cache.size > MAX_ENTRIES) {
            const sorted = [...this.cache.entries()]
                .sort(([, a], [, b]) => {
                    const impA = { critical: 3, useful: 2, ambient: 1 }[a.importance];
                    const impB = { critical: 3, useful: 2, ambient: 1 }[b.importance];
                    return impA - impB || a.accessedAt - b.accessedAt;
                });

            const excess = this.cache.size - MAX_ENTRIES;
            for (let i = 0; i < excess; i++) {
                const [id] = sorted[i];
                this.cache.delete(id);
                if (this.db) {
                    try {
                        const tx = this.db.transaction(STORE_NAME, 'readwrite');
                        tx.objectStore(STORE_NAME).delete(id);
                    } catch { /* ignore */ }
                }
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════
// CONTEXT WINDOWING — Intelligent context management
// ═══════════════════════════════════════════════════════════

/**
 * Manages the context window for efficient prompt construction.
 * Ensures the most relevant information fits within the model's context limit.
 * 
 * Strategy:
 * 1. System prompt always included (fixed budget)
 * 2. Recent messages: last 4 turns (sliding window)
 * 3. Relevant memory: retrieved by keyword match
 * 4. Tool results: most recent, capped
 */
export class ContextWindowManager {
    private maxTokens: number;
    private readonly systemBudget = 0.3; // 30% for system prompt
    private readonly historyBudget = 0.4; // 40% for recent history
    private readonly memoryBudget = 0.15; // 15% for memory
    private readonly toolBudget = 0.15; // 15% for tool results

    constructor(maxTokens = 4096) {
        this.maxTokens = maxTokens;
    }

    /**
     * Build an optimized context window
     */
    buildWindow(params: {
        systemPrompt: string;
        messages: { role: string; content: string }[];
        memoryContext?: string;
        toolResults?: string;
    }): ContextWindow {
        const { systemPrompt, messages, memoryContext = '', toolResults = '' } = params;

        // Calculate budgets in characters
        const systemMax = Math.floor(this.maxTokens * this.systemBudget * CHARS_PER_TOKEN);
        const historyMax = Math.floor(this.maxTokens * this.historyBudget * CHARS_PER_TOKEN);
        const memoryMax = Math.floor(this.maxTokens * this.memoryBudget * CHARS_PER_TOKEN);
        const toolMax = Math.floor(this.maxTokens * this.toolBudget * CHARS_PER_TOKEN);

        // 1. System context — truncate if necessary
        const systemContext = systemPrompt.length > systemMax
            ? systemPrompt.slice(0, systemMax) + '\n[...truncated]'
            : systemPrompt;

        // 2. Recent history — take last N messages that fit
        let historyChars = 0;
        const recentMessages: string[] = [];
        for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i];
            const msgText = `${msg.role}: ${msg.content}`;
            if (historyChars + msgText.length > historyMax) break;
            historyChars += msgText.length;
            recentMessages.unshift(msgText);
        }

        // 3. Memory context — cap to budget
        const relevantMemory = memoryContext.length > memoryMax
            ? memoryContext.slice(0, memoryMax) + '\n[...more memories available]'
            : memoryContext;

        // 4. Tool results — keep most recent, cap to budget
        const toolContext = toolResults.length > toolMax
            ? toolResults.slice(-toolMax)
            : toolResults;

        const totalEstimate = Math.ceil(
            (systemContext.length + historyChars + relevantMemory.length + toolContext.length) / CHARS_PER_TOKEN
        );

        return {
            systemContext,
            recentHistory: recentMessages.join('\n'),
            relevantMemory,
            toolResults: toolContext,
            totalTokenEstimate: totalEstimate,
        };
    }

    /**
     * Update max tokens based on model capabilities
     */
    setMaxTokens(tokens: number): void {
        this.maxTokens = tokens;
    }
}

// ═══════════════════════════════════════════════════════════
// RESULT PIPING — Multi-step chaining
// ═══════════════════════════════════════════════════════════

/**
 * Manages result piping between sequential tool calls.
 * Output of step N is automatically available as input to step N+1.
 */
export class ResultPipeline {
    private results: Map<string, string> = new Map();
    private orderedResults: { stepId: string; toolName: string; output: string; timestamp: number }[] = [];

    /**
     * Add a tool result to the pipeline
     */
    addResult(stepId: string, toolName: string, output: string): void {
        this.results.set(stepId, output);
        this.orderedResults.push({
            stepId,
            toolName,
            output: output.slice(0, 2000), // Cap individual results
            timestamp: Date.now(),
        });
    }

    /**
     * Get the most recent result (for piping to next step)
     */
    getLastResult(): string | null {
        if (this.orderedResults.length === 0) return null;
        return this.orderedResults[this.orderedResults.length - 1].output;
    }

    /**
     * Get result from a specific step
     */
    getResult(stepId: string): string | null {
        return this.results.get(stepId) || null;
    }

    /**
     * Build a chaining context that includes accumulated results
     * Format: [PREVIOUS RESULTS] for injection into prompts
     */
    buildChainingContext(maxResults = 3): string {
        if (this.orderedResults.length === 0) return '';

        const recent = this.orderedResults.slice(-maxResults);
        const lines = ['[PREVIOUS STEP RESULTS — Use these to continue the task]'];

        for (const r of recent) {
            lines.push(`• ${r.toolName}: ${r.output.slice(0, 500)}`);
        }

        return lines.join('\n');
    }

    /**
     * Clear the pipeline
     */
    clear(): void {
        this.results.clear();
        this.orderedResults = [];
    }
}

// ═══════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════

let _agentMemory: AgentMemoryService | null = null;
let _contextManager: ContextWindowManager | null = null;

export function getAgentMemory(): AgentMemoryService {
    if (!_agentMemory) {
        _agentMemory = new AgentMemoryService();
    }
    return _agentMemory;
}

export function getContextWindowManager(maxTokens?: number): ContextWindowManager {
    if (!_contextManager) {
        _contextManager = new ContextWindowManager(maxTokens);
    }
    return _contextManager;
}
