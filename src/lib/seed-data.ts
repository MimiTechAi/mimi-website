"use client";

/**
 * MiMi Tech AI — Smart Seed Data Service
 *
 * Seeds the local IndexedDB with realistic demo data on first visit.
 * Checks if data already exists — only seeds once.
 * After seeding, the user works with real persistent data.
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { db } from './local-db';
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
} from './local-db';

// ═══════════════════════════════════════════════════════════
// SEED CHECK
// ═══════════════════════════════════════════════════════════

/**
 * Seeds the database if it's empty (first visit).
 * Safe to call multiple times — idempotent.
 */
export async function seedIfEmpty(): Promise<void> {
    try {
        const userCount = await db.internalUsers.count();
        if (userCount > 0) {
            console.log('[SeedData] Database already seeded, skipping');
            return;
        }

        console.log('[SeedData] First visit detected — seeding database...');

        await db.transaction(
            'rw',
            [
                db.internalUsers,
                db.chatMessages,
                db.wikiArticles,
                db.events,
                db.courses,
                db.timeProjects,
                db.timeEntries,
                db.approvals,
                db.announcements,
            ],
            async () => {
                await seedUsers();
                await seedChatMessages();
                await seedWikiArticles();
                await seedEvents();
                await seedCourses();
                await seedTimeTracking();
                await seedAnnouncements();
            }
        );

        console.log('[SeedData] ✅ Database seeded successfully');
    } catch (error) {
        console.error('[SeedData] ❌ Seeding failed:', error);
    }
}

// ═══════════════════════════════════════════════════════════
// SEED FUNCTIONS
// ═══════════════════════════════════════════════════════════

async function seedUsers(): Promise<void> {
    const users: InternalUser[] = [
        {
            name: 'Max Mustermann',
            email: 'max.mustermann@mimitechai.com',
            role: 'Senior Developer',
            isOnline: true,
            lastSeen: new Date().toISOString(),
        },
        {
            name: 'Erika Musterfrau',
            email: 'erika.musterfrau@mimitechai.com',
            role: 'Project Lead',
            isOnline: true,
            lastSeen: new Date().toISOString(),
        },
        {
            name: 'Anna Beispiel',
            email: 'anna.beispiel@mimitechai.com',
            role: 'UX Designer',
            isOnline: false,
            lastSeen: new Date(Date.now() - 3600000).toISOString(),
        },
        {
            name: 'Thomas Schmidt',
            email: 'thomas.schmidt@mimitechai.com',
            role: 'AI Engineer',
            isOnline: true,
            lastSeen: new Date().toISOString(),
        },
        {
            name: 'Lisa Weber',
            email: 'lisa.weber@mimitechai.com',
            role: 'DevOps Engineer',
            isOnline: false,
            lastSeen: new Date(Date.now() - 7200000).toISOString(),
        },
    ];

    await db.internalUsers.bulkAdd(users);
}

async function seedChatMessages(): Promise<void> {
    const now = new Date();
    const messages: ChatMessage[] = [
        {
            user: 'Max Mustermann',
            content: 'Hallo zusammen! Hat jemand schon das neue KI-Model getestet?',
            time: '10:30',
            type: 'text',
            isOnline: true,
            channelId: 'general',
            createdAt: new Date(now.getTime() - 3600000 * 3),
        },
        {
            user: 'Erika Musterfrau',
            content: 'Guten Morgen! Ja, ich habe es heute Früh ausprobiert — beeindruckend! 🚀',
            time: '10:32',
            type: 'text',
            isOnline: true,
            channelId: 'general',
            createdAt: new Date(now.getTime() - 3600000 * 2.9),
        },
        {
            user: 'Max Mustermann',
            content: 'Die Inferenzgeschwindigkeit ist viel besser als beim letzten Release. Habt ihr schon die neuen WebGPU-Optimierungen gesehen?',
            time: '10:35',
            type: 'text',
            isOnline: true,
            channelId: 'general',
            createdAt: new Date(now.getTime() - 3600000 * 2.8),
        },
        {
            user: 'Thomas Schmidt',
            content: 'Absolut! Wir sollten auch die Context-Window-Größe evaluieren. Ich hab da ein paar Benchmarks vorbereitet.',
            time: '10:38',
            type: 'text',
            isOnline: true,
            channelId: 'general',
            createdAt: new Date(now.getTime() - 3600000 * 2.7),
        },
        {
            user: 'Lisa Weber',
            content: 'Die GPU-Memory-Nutzung ist jetzt deutlich effizienter. Ich sehe 30% weniger VRAM-Verbrauch in den Logs.',
            time: '10:42',
            type: 'text',
            isOnline: false,
            channelId: 'general',
            createdAt: new Date(now.getTime() - 3600000 * 2.5),
        },
        {
            user: 'Erika Musterfrau',
            content: 'Super! Ich erstelle gleich ein Wiki-Artikel mit den Benchmark-Ergebnissen. @Thomas, kannst du mir die Daten schicken?',
            time: '10:45',
            type: 'text',
            isOnline: true,
            channelId: 'general',
            createdAt: new Date(now.getTime() - 3600000 * 2.3),
        },
    ];

    await db.chatMessages.bulkAdd(messages);
}

async function seedWikiArticles(): Promise<void> {
    const articles: WikiArticle[] = [
        {
            title: 'Remote Work Policy',
            content: 'Unsere Richtlinien für Remote-Arbeit umfassen flexible Arbeitszeiten, Home-Office Equipment-Zuschüsse und regelmäßige Team-Sync-Meetings...',
            category: 'Unternehmensrichtlinien',
            author: 'Max Mustermann',
            lastUpdated: '2025-10-25',
            permissions: { canEdit: true, canDelete: true, canShare: true },
            versions: [
                {
                    id: 1,
                    content: 'Unsere Richtlinien für Remote-Arbeit...',
                    author: 'Max Mustermann',
                    timestamp: '2025-10-25T10:30:00Z',
                    comment: 'Initiale Version',
                },
            ],
            relatedArticles: [
                { id: 2, title: 'Code Review Guidelines' },
                { id: 3, title: 'VPN Setup Anleitung' },
            ],
        },
        {
            title: 'Code Review Guidelines',
            content: 'Best Practices für Code Reviews: 1. Max. 400 Zeilen pro Review, 2. Konstruktives Feedback, 3. Automatisierte Checks vor Review...',
            category: 'Entwicklungsprozesse',
            author: 'Erika Musterfrau',
            lastUpdated: '2025-10-20',
            permissions: { canEdit: true, canDelete: false, canShare: true },
            versions: [
                {
                    id: 1,
                    content: 'Richtlinien für Code-Reviews...',
                    author: 'Erika Musterfrau',
                    timestamp: '2025-10-20T09:15:00Z',
                    comment: 'Initiale Version',
                },
            ],
            relatedArticles: [],
        },
        {
            title: 'VPN Setup Anleitung',
            content: 'Schritt-für-Schritt Anleitung zur VPN-Konfiguration für den sicheren Zugriff auf interne Ressourcen...',
            category: 'IT-Ressourcen',
            author: 'IT Abteilung',
            lastUpdated: '2025-10-18',
            permissions: { canEdit: false, canDelete: false, canShare: true },
            versions: [
                {
                    id: 1,
                    content: 'Anleitung zur VPN-Konfiguration...',
                    author: 'IT Abteilung',
                    timestamp: '2025-10-18T14:20:00Z',
                    comment: 'Initiale Version',
                },
            ],
            relatedArticles: [],
        },
        {
            title: 'Next.js Best Practices',
            content: 'Best Practices für die Entwicklung mit Next.js: Server Components, Route Handlers, Middleware, und Performance-Optimierung...',
            category: 'Schulungsmaterialien',
            author: 'Entwicklungsteam',
            lastUpdated: '2025-10-15',
            permissions: { canEdit: true, canDelete: true, canShare: true },
            versions: [
                {
                    id: 1,
                    content: 'Best Practices für Next.js Entwicklung...',
                    author: 'Entwicklungsteam',
                    timestamp: '2025-10-15T11:45:00Z',
                    comment: 'Initiale Version',
                },
            ],
            relatedArticles: [{ id: 1, title: 'Remote Work Policy' }],
        },
        {
            title: 'WebGPU Integration Guide',
            content: 'Leitfaden zur Integration von WebGPU für lokale KI-Inferenz. Behandelt Shader-Kompilierung, Memory-Management und Performance-Tuning...',
            category: 'Entwicklungsprozesse',
            author: 'Thomas Schmidt',
            lastUpdated: '2025-11-01',
            permissions: { canEdit: true, canDelete: false, canShare: true },
            versions: [
                {
                    id: 1,
                    content: 'WebGPU Integration Guide...',
                    author: 'Thomas Schmidt',
                    timestamp: '2025-11-01T09:00:00Z',
                    comment: 'Initiale Version',
                },
            ],
            relatedArticles: [{ id: 4, title: 'Next.js Best Practices' }],
        },
    ];

    await db.wikiArticles.bulkAdd(articles);
}

async function seedEvents(): Promise<void> {
    const events: CompanyEvent[] = [
        {
            title: 'KI-Workshop: Neueste Entwicklungen',
            date: '2026-03-15',
            time: '14:00 - 17:00',
            location: 'Konferenzraum A',
            description: 'Praxisorientierter Workshop zu den neuesten KI-Modellen und deren Anwendung in der Beratung.',
            attendees: 15,
            maxAttendees: 20,
            registered: true,
        },
        {
            title: 'Team Building: Escape Room',
            date: '2026-03-22',
            time: '16:00 - 19:00',
            location: 'City Escape Hamburg',
            description: 'Gemeinsames Team Building in einem Escape Room mit anschließendem Dinner.',
            attendees: 8,
            maxAttendees: 12,
            registered: false,
        },
        {
            title: 'Tech Talk: Local-First Architecture',
            date: '2026-04-05',
            time: '13:00 - 14:30',
            location: 'Online (Teams)',
            description: 'Deep-Dive in lokale Datenpersistenz mit IndexedDB, OPFS und Dexie.js — ohne Cloud.',
            attendees: 22,
            maxAttendees: 50,
            registered: false,
        },
        {
            title: 'Hackathon: MIMI Agent Plugins',
            date: '2026-04-18',
            time: '09:00 - 18:00',
            location: 'MiMi Tech AI HQ',
            description: 'Ganztägiger Hackathon zur Entwicklung neuer Agent-Plugins und Tool-Integrationen.',
            attendees: 12,
            maxAttendees: 25,
            registered: false,
        },
    ];

    await db.events.bulkAdd(events);
}

async function seedCourses(): Promise<void> {
    const courses: Course[] = [
        {
            title: 'Einführung in KI und Machine Learning',
            description: 'Grundlagen der künstlichen Intelligenz und Machine Learning Algorithmen',
            duration: '4 Stunden',
            progress: 100,
            completed: true,
            category: 'KI-Grundlagen',
            rating: 4.8,
            enrolled: 124,
            instructor: 'Prof. Dr. Schmidt',
        },
        {
            title: 'NVIDIA NeMo Framework',
            description: 'Praxisorientierte Einführung in das NVIDIA NeMo Framework für Sprach-KI',
            duration: '6 Stunden',
            progress: 75,
            completed: false,
            category: 'NVIDIA',
            rating: 4.6,
            enrolled: 89,
            instructor: 'Dr. Lisa Weber',
        },
        {
            title: 'Digitale Zwillinge in der Industrie',
            description: 'Anwendung von Digitalen Zwillingen in der industriellen Fertigung',
            duration: '3 Stunden',
            progress: 0,
            completed: false,
            category: 'Digitale Zwillinge',
            rating: 4.9,
            enrolled: 156,
            instructor: 'Max Mustermann',
        },
        {
            title: 'Next.js für interne Anwendungen',
            description: 'Entwicklung von internen Tools mit Next.js und React',
            duration: '5 Stunden',
            progress: 0,
            completed: false,
            category: 'Entwicklung',
            rating: 4.7,
            enrolled: 78,
            instructor: 'Thomas Schmidt',
        },
        {
            title: 'WebGPU & Browser-KI',
            description: 'Lokale KI-Inferenz im Browser mit WebGPU, WebLLM und IndexedDB-Caching',
            duration: '4 Stunden',
            progress: 30,
            completed: false,
            category: 'KI-Grundlagen',
            rating: 4.9,
            enrolled: 45,
            instructor: 'Thomas Schmidt',
        },
        {
            title: 'Datenschutz & DSGVO im KI-Kontext',
            description: 'Rechtliche Anforderungen an KI-Systeme unter der DSGVO und dem EU AI Act',
            duration: '2 Stunden',
            progress: 100,
            completed: true,
            category: 'Compliance',
            rating: 4.5,
            enrolled: 200,
            instructor: 'Dr. Karin Meier',
        },
    ];

    await db.courses.bulkAdd(courses);
}

async function seedTimeTracking(): Promise<void> {
    const projects: TimeProject[] = [
        {
            id: 'proj_ki_beratung',
            name: 'KI-Beratung',
            description: 'Beratungsprojekte im Bereich künstliche Intelligenz',
            createdAt: new Date(Date.now() - 30 * 24 * 3600000),
        },
        {
            id: 'proj_digitale_zwillinge',
            name: 'Digitale Zwillinge',
            description: 'Entwicklung von Digital Twin Lösungen',
            createdAt: new Date(Date.now() - 25 * 24 * 3600000),
        },
        {
            id: 'proj_webentwicklung',
            name: 'Webentwicklung',
            description: 'Interne und externe Webentwicklungsprojekte',
            createdAt: new Date(Date.now() - 20 * 24 * 3600000),
        },
    ];

    await db.timeProjects.bulkAdd(projects);

    const today = new Date();
    const entries: TimeEntry[] = [
        {
            projectId: 'proj_ki_beratung',
            duration: 120,
            date: new Date(today.getTime() - 1 * 24 * 3600000).toISOString().split('T')[0],
            description: 'Kundenberatung: Implementierung lokaler KI-Modelle',
            createdAt: new Date(today.getTime() - 1 * 24 * 3600000),
        },
        {
            projectId: 'proj_digitale_zwillinge',
            duration: 255,
            date: new Date(today.getTime() - 2 * 24 * 3600000).toISOString().split('T')[0],
            description: 'Prototyp-Entwicklung für Fertigungsoptimierung',
            createdAt: new Date(today.getTime() - 2 * 24 * 3600000),
        },
        {
            projectId: 'proj_webentwicklung',
            duration: 90,
            date: new Date(today.getTime() - 3 * 24 * 3600000).toISOString().split('T')[0],
            description: 'Dashboard-Redesign mit Glassmorphism-UI',
            createdAt: new Date(today.getTime() - 3 * 24 * 3600000),
        },
        {
            projectId: 'proj_ki_beratung',
            duration: 180,
            date: today.toISOString().split('T')[0],
            description: 'WebGPU-Optimierung für MIMI Agent Engine',
            createdAt: today,
        },
    ];

    await db.timeEntries.bulkAdd(entries);

    const approvals: Approval[] = [
        {
            projectId: 'proj_ki_beratung',
            duration: 120,
            description: 'Kundenberatung: Implementierung lokaler KI-Modelle',
            date: new Date(today.getTime() - 1 * 24 * 3600000).toISOString().split('T')[0],
            status: 'approved',
            requestedAt: new Date(today.getTime() - 1 * 24 * 3600000),
        },
        {
            projectId: 'proj_digitale_zwillinge',
            duration: 255,
            description: 'Prototyp-Entwicklung für Fertigungsoptimierung',
            date: new Date(today.getTime() - 2 * 24 * 3600000).toISOString().split('T')[0],
            status: 'pending',
            requestedAt: new Date(today.getTime() - 12 * 3600000),
        },
    ];

    await db.approvals.bulkAdd(approvals);
}

async function seedAnnouncements(): Promise<void> {
    const now = new Date();
    const announcements: Announcement[] = [
        {
            title: 'MIMI Agent v2.0 Release',
            content: 'Die neue Version des MIMI Agents mit Qwen3-Support und verbesserter WebGPU-Performance ist live!',
            color: 'bg-brand-cyan',
            createdAt: new Date(now.getTime() - 3600000),
        },
        {
            title: 'Team Meeting nächste Woche',
            content: 'Quartalsbesprechung am Montag um 10:00 Uhr im Konferenzraum A',
            color: 'bg-green-500',
            createdAt: new Date(now.getTime() - 7200000),
        },
        {
            title: 'Neues KI-Training verfügbar',
            content: 'Der Kurs "WebGPU & Browser-KI" ist jetzt im Schulungsportal verfügbar.',
            color: 'bg-blue-500',
            createdAt: new Date(now.getTime() - 86400000),
        },
    ];

    await db.announcements.bulkAdd(announcements);
}
