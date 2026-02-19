"use client";

/**
 * MiMi Tech AI — Reactive Local Data Hooks
 *
 * Reactive React hooks using Dexie's `useLiveQuery` for automatic
 * UI updates when IndexedDB data changes. Replaces all fetch() calls
 * and API polling with instant local queries.
 *
 * Each hook returns:
 * - data: The reactive query result
 * - loading: Whether the initial query is still running
 * - actions: Mutation functions (add, update, delete)
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/local-db';
import type {
    ChatMessage,
    WikiArticle,
    CompanyEvent,
    Course,
    TimeProject,
    TimeEntry,
    Approval,
    InternalUser,
    Announcement,
    NewsletterSub,
} from '@/lib/local-db';

// ═══════════════════════════════════════════════════════════
// useChat — Team Chat Messages
// ═══════════════════════════════════════════════════════════

export function useChat(channelId: string = 'general') {
    const messages = useLiveQuery(
        () => db.chatMessages.where('channelId').equals(channelId).sortBy('createdAt'),
        [channelId]
    );

    const actions = {
        send: async (message: Omit<ChatMessage, 'id' | 'createdAt' | 'channelId'>) => {
            await db.chatMessages.add({
                ...message,
                channelId,
                createdAt: new Date(),
            });
        },

        delete: async (id: number) => {
            await db.chatMessages.delete(id);
        },

        clear: async () => {
            await db.chatMessages.where('channelId').equals(channelId).delete();
        },
    };

    return {
        messages: messages ?? [],
        loading: messages === undefined,
        actions,
    };
}

// ═══════════════════════════════════════════════════════════
// useWikiArticles — Internal Wiki
// ═══════════════════════════════════════════════════════════

export function useWikiArticles() {
    const articles = useLiveQuery(
        () => db.wikiArticles.toArray()
    );

    const actions = {
        add: async (article: Omit<WikiArticle, 'id'>) => {
            return await db.wikiArticles.add(article);
        },

        update: async (id: number, changes: Partial<WikiArticle>) => {
            await db.wikiArticles.update(id, changes);
        },

        delete: async (id: number) => {
            await db.wikiArticles.delete(id);
        },

        getByCategory: async (category: string) => {
            return db.wikiArticles.where('category').equals(category).toArray();
        },

        search: async (query: string) => {
            const q = query.toLowerCase();
            return db.wikiArticles.filter(
                (a) =>
                    a.title.toLowerCase().includes(q) ||
                    a.content.toLowerCase().includes(q)
            ).toArray();
        },
    };

    return {
        articles: articles ?? [],
        loading: articles === undefined,
        actions,
    };
}

// ═══════════════════════════════════════════════════════════
// useEvents — Company Events
// ═══════════════════════════════════════════════════════════

export function useEvents() {
    const events = useLiveQuery(
        () => db.events.orderBy('date').toArray()
    );

    const actions = {
        add: async (event: Omit<CompanyEvent, 'id'>) => {
            return await db.events.add(event);
        },

        toggleRegistration: async (id: number) => {
            const event = await db.events.get(id);
            if (!event) return;

            await db.events.update(id, {
                registered: !event.registered,
                attendees: event.registered
                    ? event.attendees - 1
                    : event.attendees + 1,
            });
        },

        update: async (id: number, changes: Partial<CompanyEvent>) => {
            await db.events.update(id, changes);
        },

        delete: async (id: number) => {
            await db.events.delete(id);
        },
    };

    return {
        events: events ?? [],
        loading: events === undefined,
        actions,
    };
}

// ═══════════════════════════════════════════════════════════
// useCourses — Training & Courses
// ═══════════════════════════════════════════════════════════

export function useCourses() {
    const courses = useLiveQuery(
        () => db.courses.toArray()
    );

    const actions = {
        add: async (course: Omit<Course, 'id'>) => {
            return await db.courses.add(course);
        },

        updateProgress: async (id: number, progress: number) => {
            await db.courses.update(id, {
                progress,
                completed: progress >= 100,
            });
        },

        rate: async (id: number, rating: number) => {
            await db.courses.update(id, { rating });
        },

        update: async (id: number, changes: Partial<Course>) => {
            await db.courses.update(id, changes);
        },

        delete: async (id: number) => {
            await db.courses.delete(id);
        },
    };

    return {
        courses: courses ?? [],
        loading: courses === undefined,
        actions,
    };
}

// ═══════════════════════════════════════════════════════════
// useTimeTracking — Projects, Entries & Approvals
// ═══════════════════════════════════════════════════════════

export function useTimeTracking() {
    const projects = useLiveQuery(() => db.timeProjects.toArray());
    const entries = useLiveQuery(() => db.timeEntries.orderBy('createdAt').reverse().toArray());
    const approvals = useLiveQuery(() => db.approvals.orderBy('requestedAt').reverse().toArray());

    const actions = {
        // Projects
        addProject: async (project: Omit<TimeProject, 'createdAt'>) => {
            await db.timeProjects.add({
                ...project,
                createdAt: new Date(),
            });
        },

        deleteProject: async (id: string) => {
            await db.timeProjects.delete(id);
            // Also delete related entries and approvals
            await db.timeEntries.where('projectId').equals(id).delete();
            await db.approvals.where('projectId').equals(id).delete();
        },

        // Entries
        addEntry: async (entry: Omit<TimeEntry, 'id' | 'createdAt'>) => {
            return await db.timeEntries.add({
                ...entry,
                createdAt: new Date(),
            });
        },

        deleteEntry: async (id: number) => {
            await db.timeEntries.delete(id);
        },

        // Approvals
        requestApproval: async (approval: Omit<Approval, 'id' | 'requestedAt' | 'status'>) => {
            return await db.approvals.add({
                ...approval,
                status: 'pending',
                requestedAt: new Date(),
            });
        },

        updateApprovalStatus: async (id: number, status: Approval['status']) => {
            await db.approvals.update(id, { status });
        },

        getProjectEntries: async (projectId: string) => {
            return db.timeEntries.where('projectId').equals(projectId).toArray();
        },

        // Stats
        getWeeklyHours: () => {
            if (!entries) return 0;
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return entries
                .filter((e) => new Date(e.date) >= weekAgo)
                .reduce((sum, e) => sum + e.duration, 0) / 60;
        },

        getMonthlyHours: () => {
            if (!entries) return 0;
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return entries
                .filter((e) => new Date(e.date) >= monthAgo)
                .reduce((sum, e) => sum + e.duration, 0) / 60;
        },
    };

    return {
        projects: projects ?? [],
        entries: entries ?? [],
        approvals: approvals ?? [],
        loading: projects === undefined || entries === undefined || approvals === undefined,
        actions,
    };
}

// ═══════════════════════════════════════════════════════════
// useInternalUsers — Team Members
// ═══════════════════════════════════════════════════════════

export function useInternalUsers() {
    const users = useLiveQuery(() => db.internalUsers.toArray());

    const actions = {
        add: async (user: Omit<InternalUser, 'id'>) => {
            return await db.internalUsers.add(user);
        },

        update: async (id: number, changes: Partial<InternalUser>) => {
            await db.internalUsers.update(id, changes);
        },

        setOnlineStatus: async (id: number, isOnline: boolean) => {
            await db.internalUsers.update(id, {
                isOnline,
                lastSeen: new Date().toISOString(),
            });
        },

        delete: async (id: number) => {
            await db.internalUsers.delete(id);
        },
    };

    return {
        users: users ?? [],
        loading: users === undefined,
        actions,
    };
}

// ═══════════════════════════════════════════════════════════
// useDashboardStats — Aggregated Dashboard Statistics
// ═══════════════════════════════════════════════════════════

export function useDashboardStats() {
    const stats = useLiveQuery(async () => {
        const [
            messageCount,
            articleCount,
            eventCount,
            courseCount,
            completedCourses,
            projectCount,
            entryCount,
            pendingApprovals,
            onlineUsers,
            totalUsers,
        ] = await Promise.all([
            db.chatMessages.count(),
            db.wikiArticles.count(),
            db.events.count(),
            db.courses.count(),
            db.courses.where('completed').equals(1).count(),
            db.timeProjects.count(),
            db.timeEntries.count(),
            db.approvals.where('status').equals('pending').count(),
            db.internalUsers.where('isOnline').equals(1).count(),
            db.internalUsers.count(),
        ]);

        // Calculate weekly hours
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekEntries = await db.timeEntries
            .filter((e) => new Date(e.date) >= weekAgo)
            .toArray();
        const weeklyHours = weekEntries.reduce((sum, e) => sum + e.duration, 0) / 60;

        return {
            messages: messageCount,
            articles: articleCount,
            events: eventCount,
            courses: courseCount,
            completedCourses,
            projects: projectCount,
            timeEntries: entryCount,
            pendingApprovals,
            onlineUsers,
            totalUsers,
            weeklyHours: Math.round(weeklyHours * 10) / 10,
        };
    });

    return {
        stats: stats ?? null,
        loading: stats === undefined,
    };
}

// ═══════════════════════════════════════════════════════════
// useAnnouncements — Company Announcements
// ═══════════════════════════════════════════════════════════

export function useAnnouncements() {
    const announcements = useLiveQuery(
        () => db.announcements.orderBy('createdAt').reverse().toArray()
    );

    const actions = {
        add: async (announcement: Omit<Announcement, 'id' | 'createdAt'>) => {
            return await db.announcements.add({
                ...announcement,
                createdAt: new Date(),
            });
        },

        update: async (id: number, changes: Partial<Announcement>) => {
            await db.announcements.update(id, changes);
        },

        delete: async (id: number) => {
            await db.announcements.delete(id);
        },
    };

    return {
        announcements: announcements ?? [],
        loading: announcements === undefined,
        actions,
    };
}

// ═══════════════════════════════════════════════════════════
// useNewsletter — Newsletter Subscriptions
// ═══════════════════════════════════════════════════════════

export function useNewsletter() {
    const subs = useLiveQuery(() => db.newsletterSubs.toArray());

    const actions = {
        subscribe: async (email: string): Promise<{ success: boolean; message: string }> => {
            try {
                const existing = await db.newsletterSubs.where('email').equals(email).first();
                if (existing) {
                    return { success: false, message: 'Diese E-Mail ist bereits registriert.' };
                }

                await db.newsletterSubs.add({
                    email,
                    subscribedAt: new Date(),
                });

                return { success: true, message: 'Erfolgreich angemeldet! 🎉' };
            } catch {
                return { success: false, message: 'Anmeldung fehlgeschlagen.' };
            }
        },

        unsubscribe: async (email: string) => {
            await db.newsletterSubs.where('email').equals(email).delete();
        },
    };

    return {
        subscribers: subs ?? [],
        count: subs?.length ?? 0,
        loading: subs === undefined,
        actions,
    };
}
