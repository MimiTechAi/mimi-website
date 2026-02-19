"use client";

/**
 * MiMi Tech AI — Unified Local Database
 *
 * 100% local-first architecture using Dexie.js v4 + IndexedDB.
 * Replaces all server-side API stubs with client-side persistence.
 * Data stays on the user's device — no cloud, no external DB.
 *
 * Tables:
 * - chatMessages:   Team chat messages per channel
 * - wikiArticles:   Internal wiki with version history
 * - events:         Company events with registration
 * - courses:        Training courses with progress tracking
 * - timeProjects:   Time-tracking project definitions
 * - timeEntries:    Individual time entries
 * - approvals:      Approval requests for time entries
 * - internalUsers:  Internal user profiles
 * - announcements:  Company announcements
 * - newsletterSubs: Newsletter subscriptions
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import Dexie, { type Table } from 'dexie';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface ChatMessage {
    id?: number;
    user: string;
    content: string;
    time: string;
    type: 'text' | 'file';
    fileName?: string;
    fileSize?: string;
    avatar?: string;
    isOnline?: boolean;
    channelId: string;
    createdAt: Date;
}

export interface ArticleVersion {
    id: number;
    content: string;
    author: string;
    timestamp: string;
    comment: string;
}

export interface RelatedArticle {
    id: number;
    title: string;
}

export interface WikiArticle {
    id?: number;
    title: string;
    content: string;
    category: string;
    author: string;
    lastUpdated: string;
    permissions: {
        canEdit: boolean;
        canDelete: boolean;
        canShare: boolean;
    };
    versions: ArticleVersion[];
    relatedArticles: RelatedArticle[];
}

export interface CompanyEvent {
    id?: number;
    title: string;
    date: string;
    time: string;
    location: string;
    description: string;
    attendees: number;
    maxAttendees: number;
    registered: boolean;
}

export interface Course {
    id?: number;
    title: string;
    description: string;
    duration: string;
    progress: number;
    completed: boolean;
    category: string;
    rating?: number;
    enrolled?: number;
    instructor?: string;
    thumbnail?: string;
}

export interface TimeProject {
    id?: string;
    name: string;
    description: string;
    createdAt: Date;
}

export interface TimeEntry {
    id?: number;
    projectId: string;
    duration: number;
    date: string;
    description: string;
    createdAt: Date;
}

export interface Approval {
    id?: number;
    projectId: string;
    duration: number;
    description: string;
    date: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: Date;
}

export interface InternalUser {
    id?: number;
    name: string;
    email: string;
    role: string;
    isOnline: boolean;
    lastSeen: string;
    avatar?: string;
}

export interface Announcement {
    id?: number;
    title: string;
    content: string;
    color: string;
    createdAt: Date;
}

export interface NewsletterSub {
    id?: number;
    email: string;
    subscribedAt: Date;
}

// ═══════════════════════════════════════════════════════════
// MIMI AGENT TYPES (Phase 1 — replaces raw IndexedDB + OPFS)
// ═══════════════════════════════════════════════════════════

/** Agent Memory — replaces raw IndexedDB 'mimi-agent-memory' */
export interface AgentMemoryEntry {
    id: string;
    type: 'task_summary' | 'user_preference' | 'tool_cache' | 'context_snapshot' | 'learned_fact';
    importance: 'critical' | 'useful' | 'ambient';
    content: string;
    metadata: Record<string, unknown>;
    createdAt: number;
    accessedAt: number;
    accessCount: number;
    expiresAt?: number;
}

/** PDF Document — replaces raw IndexedDB 'MimiDocuments' */
export interface MimiDocument {
    id: string;
    name: string;
    pageCount: number;
    chunks: Array<{
        text: string;
        pageNumber: number;
        chunkIndex: number;
    }>;
    tables?: Array<{
        pageNumber: number;
        rows: string[][];
        headers?: string[];
    }>;
    extractedAt: Date;
}

/** Vector Entry — replaces raw IndexedDB 'MimiVectors' */
export interface MimiVectorEntry {
    id?: number;
    text: string;
    embedding: number[];
    documentId: string;
    pageNumber: number;
    chunkIndex: number;
}

/** Conversation — replaces OPFS '.mimi-chat-history' */
export interface MimiConversation {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
}

/** Conversation Message — linked to MimiConversation */
export interface MimiConversationMessage {
    id?: number;
    conversationId: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    artifacts?: Array<{
        id: string;
        type: string;
        language?: string;
        title?: string;
        content: string;
    }>;
}

// ═══════════════════════════════════════════════════════════
// DATABASE CLASS
// ═══════════════════════════════════════════════════════════

class MimiLocalDB extends Dexie {
    // Portal tables
    chatMessages!: Table<ChatMessage, number>;
    wikiArticles!: Table<WikiArticle, number>;
    events!: Table<CompanyEvent, number>;
    courses!: Table<Course, number>;
    timeProjects!: Table<TimeProject, string>;
    timeEntries!: Table<TimeEntry, number>;
    approvals!: Table<Approval, number>;
    internalUsers!: Table<InternalUser, number>;
    announcements!: Table<Announcement, number>;
    newsletterSubs!: Table<NewsletterSub, number>;

    // MIMI Agent tables
    agentMemories!: Table<AgentMemoryEntry, string>;
    mimiDocuments!: Table<MimiDocument, string>;
    mimiVectors!: Table<MimiVectorEntry, number>;
    mimiConversations!: Table<MimiConversation, string>;
    mimiMessages!: Table<MimiConversationMessage, number>;

    constructor() {
        super('MimiPortalDB');

        // v1: Portal tables
        this.version(1).stores({
            chatMessages: '++id, channelId, user, createdAt',
            wikiArticles: '++id, category, author, lastUpdated',
            events: '++id, date',
            courses: '++id, category, completed',
            timeProjects: 'id, name',
            timeEntries: '++id, projectId, date, createdAt',
            approvals: '++id, projectId, status',
            internalUsers: '++id, &email, name',
            announcements: '++id, createdAt',
            newsletterSubs: '++id, &email',
        });

        // v2: MIMI Agent tables (unifies 3 raw IndexedDBs + 1 OPFS)
        this.version(2).stores({
            chatMessages: '++id, channelId, user, createdAt',
            wikiArticles: '++id, category, author, lastUpdated',
            events: '++id, date',
            courses: '++id, category, completed',
            timeProjects: 'id, name',
            timeEntries: '++id, projectId, date, createdAt',
            approvals: '++id, projectId, status',
            internalUsers: '++id, &email, name',
            announcements: '++id, createdAt',
            newsletterSubs: '++id, &email',
            // ▼ NEW: MIMI Agent unified storage ▼
            agentMemories: 'id, type, importance, createdAt, accessedAt',
            mimiDocuments: 'id, name, extractedAt',
            mimiVectors: '++id, documentId, chunkIndex',
            mimiConversations: 'id, title, updatedAt',
            mimiMessages: '++id, conversationId, role, timestamp',
        });
    }
}

// ═══════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════

export const db = new MimiLocalDB();
