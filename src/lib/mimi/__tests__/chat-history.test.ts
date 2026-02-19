/**
 * MIMI Agent - Chat History Service Tests
 * 2026 Audit — Fix 1 & Fix 2 Verification
 *
 * Tests the flushPendingSaves() data-saving behavior
 * and beforeunload registration.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock Dexie database
const mockCount = jest.fn().mockResolvedValue(0 as never);
const mockPut = jest.fn().mockResolvedValue(undefined as never);
const mockDelete = jest.fn().mockResolvedValue(undefined as never);
const mockBulkAdd = jest.fn().mockResolvedValue(undefined as never);
const mockGet = jest.fn().mockResolvedValue(undefined as never);
const mockEquals = jest.fn(() => ({ delete: mockDelete, sortBy: jest.fn().mockResolvedValue([] as never), count: jest.fn().mockResolvedValue(0 as never), filter: jest.fn(() => ({ first: jest.fn().mockResolvedValue(undefined as never) })) }));
const mockWhere = jest.fn(() => ({ equals: mockEquals }));

jest.mock('@/lib/local-db', () => ({
    db: {
        mimiConversations: {
            count: mockCount,
            put: mockPut,
            get: mockGet,
            delete: mockDelete,
            orderBy: jest.fn(() => ({ reverse: jest.fn(() => ({ toArray: jest.fn().mockResolvedValue([] as never) })) })),
            update: jest.fn().mockResolvedValue(undefined as never),
        },
        mimiMessages: {
            where: mockWhere,
            bulkAdd: mockBulkAdd,
        },
        transaction: jest.fn(async (_mode: string, ..._tables: any[]) => { }),
    },
}));

// ─────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────

describe('ChatHistoryService', () => {
    let getChatHistory: () => any;

    beforeEach(async () => {
        jest.useFakeTimers();
        jest.resetModules();
        mockPut.mockClear();
        mockGet.mockClear();
        mockDelete.mockClear();
        mockBulkAdd.mockClear();
        mockCount.mockClear();

        // Fresh import to get a new singleton
        const mod = await import('../chat-history');
        getChatHistory = mod.getChatHistory;
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('flushPendingSaves()', () => {
        it('should actually save pending data when flushing', async () => {
            const service = getChatHistory();
            await service.init();

            const messages = [
                { id: '1', role: 'user' as const, content: 'Hello', timestamp: new Date().toISOString() },
            ];

            // Queue a debounced save
            service.saveConversationDebounced('conv_test_1', messages);

            // Flush without waiting for the 2s timer
            await service.flushPendingSaves();

            // Verify saveConversation was called (put is called inside saveConversation)
            expect(mockPut).toHaveBeenCalled();
        });

        it('should flush multiple pending saves', async () => {
            const service = getChatHistory();
            await service.init();

            const msgs1 = [{ id: '1', role: 'user' as const, content: 'A', timestamp: new Date().toISOString() }];
            const msgs2 = [{ id: '2', role: 'user' as const, content: 'B', timestamp: new Date().toISOString() }];

            service.saveConversationDebounced('conv_1', msgs1);
            service.saveConversationDebounced('conv_2', msgs2);

            await service.flushPendingSaves();

            // Both conversations should be saved (put called for each)
            expect(mockPut).toHaveBeenCalledTimes(2);
        });

        it('should NOT double-save after flush + timer expiry', async () => {
            const service = getChatHistory();
            await service.init();

            const messages = [{ id: '1', role: 'user' as const, content: 'test', timestamp: new Date().toISOString() }];

            service.saveConversationDebounced('conv_x', messages);
            await service.flushPendingSaves();

            const putCountAfterFlush = mockPut.mock.calls.length;

            // Run all pending timers — the debounce timer should have been cleared by flush
            jest.runAllTimers();

            // No additional puts should have happened
            expect(mockPut).toHaveBeenCalledTimes(putCountAfterFlush);
        });

        it('should be a no-op when no saves are pending', async () => {
            const service = getChatHistory();
            await service.init();
            mockPut.mockClear();

            await service.flushPendingSaves();

            expect(mockPut).not.toHaveBeenCalled();
        });
    });

    describe('saveConversationDebounced()', () => {
        it('should debounce rapid saves', async () => {
            const service = getChatHistory();
            await service.init();

            const messages = [{ id: '1', role: 'user' as const, content: 'test', timestamp: new Date().toISOString() }];

            // Call 3 times rapidly
            service.saveConversationDebounced('conv_rapid', messages);
            service.saveConversationDebounced('conv_rapid', messages);
            service.saveConversationDebounced('conv_rapid', messages);

            // Flush and verify only one save
            await service.flushPendingSaves();
            // put is called once inside saveConversation for the conversation metadata
            expect(mockPut).toHaveBeenCalledTimes(1);
        });
    });
});
