/**
 * B-11: Error Handler Tests
 * RetryHandler, FallbackExecutor, ErrorRecoveryManager
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock the event bus
jest.mock('../agent-events', () => ({
    getAgentEventBus: () => ({
        emit: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
    }),
}));

import { RetryHandler, FallbackExecutor, ErrorRecoveryManager } from '../error-handler';

// ───────────────────────────────────────────────────────────
// RetryHandler
// ───────────────────────────────────────────────────────────
describe('RetryHandler', () => {
    let handler: RetryHandler;

    beforeEach(() => {
        handler = new RetryHandler({
            maxAttempts: 3,
            baseDelay: 10, // Short delays for tests
            maxDelay: 100,
            exponentialBackoff: true,
            jitter: false,
        });
    });

    it('should succeed on first attempt when operation succeeds', async () => {
        const op = jest.fn<() => Promise<string>>().mockResolvedValue('ok');
        const result = await handler.retry(op, 'test');
        expect(result).toBe('ok');
        expect(op).toHaveBeenCalledTimes(1);
    });

    it('should retry up to maxAttempts', async () => {
        const op = jest.fn<() => Promise<string>>()
            .mockRejectedValueOnce(new Error('fail1'))
            .mockRejectedValueOnce(new Error('fail2'))
            .mockResolvedValue('ok');
        const result = await handler.retry(op, 'test');
        expect(result).toBe('ok');
        expect(op).toHaveBeenCalledTimes(3);
    });

    it('should throw after maxAttempts exceeded', async () => {
        const op = jest.fn<() => Promise<string>>().mockRejectedValue(new Error('always fails'));
        await expect(handler.retry(op, 'test-op')).rejects.toThrow(
            'test-op failed after 3 attempts'
        );
        expect(op).toHaveBeenCalledTimes(3);
    });

    it('should use linear backoff when exponentialBackoff is false', async () => {
        const linearHandler = new RetryHandler({
            maxAttempts: 2,
            baseDelay: 5,
            maxDelay: 1000,
            exponentialBackoff: false,
            jitter: false,
        });
        const op = jest.fn<() => Promise<string>>().mockRejectedValue(new Error('fail'));
        await expect(linearHandler.retry(op)).rejects.toThrow();
        expect(op).toHaveBeenCalledTimes(2);
    });
});

// ───────────────────────────────────────────────────────────
// FallbackExecutor
// ───────────────────────────────────────────────────────────
describe('FallbackExecutor', () => {
    let executor: FallbackExecutor;

    beforeEach(() => {
        executor = new FallbackExecutor();
    });

    it('should return primary result when primary succeeds', async () => {
        const result = await executor.executeWithFallback({
            primary: () => Promise.resolve('primary'),
            fallbacks: [() => Promise.resolve('fallback')],
        });
        expect(result).toBe('primary');
    });

    it('should try fallbacks when primary fails', async () => {
        const result = await executor.executeWithFallback({
            primary: () => Promise.reject(new Error('primary fail')),
            fallbacks: [() => Promise.resolve('fallback-1')],
        });
        expect(result).toBe('fallback-1');
    });

    it('should try multiple fallbacks in order', async () => {
        const result = await executor.executeWithFallback({
            primary: () => Promise.reject(new Error('fail')),
            fallbacks: [
                () => Promise.reject(new Error('fb1 fail')),
                () => Promise.resolve('fallback-2-wins'),
            ],
        });
        expect(result).toBe('fallback-2-wins');
    });

    it('should use finalFallback when all else fails', async () => {
        const result = await executor.executeWithFallback({
            primary: () => Promise.reject(new Error('fail')),
            fallbacks: [() => Promise.reject(new Error('fb fail'))],
            finalFallback: () => 'degraded',
        });
        expect(result).toBe('degraded');
    });

    it('should throw when all fallbacks exhausted and no finalFallback', async () => {
        await expect(
            executor.executeWithFallback({
                primary: () => Promise.reject(new Error('fail')),
                fallbacks: [() => Promise.reject(new Error('fb fail'))],
            })
        ).rejects.toThrow('All fallbacks exhausted');
    });
});

// ───────────────────────────────────────────────────────────
// ErrorRecoveryManager
// ───────────────────────────────────────────────────────────
describe('ErrorRecoveryManager', () => {
    let manager: ErrorRecoveryManager;

    beforeEach(() => {
        manager = new ErrorRecoveryManager();
    });

    it('should return false when no strategy matches', async () => {
        const result = await manager.recover({
            operation: 'test',
            error: new Error('unknown'),
            attempt: 1,
            timestamp: Date.now(),
        });
        expect(result).toBe(false);
    });

    it('should match and apply recovery strategy', async () => {
        const action = jest.fn<() => void>();
        manager.registerStrategy({
            name: 'network-retry',
            condition: (e: Error) => e.message.includes('network'),
            action,
        });

        const result = await manager.recover({
            operation: 'fetch',
            error: new Error('network timeout'),
            attempt: 1,
            timestamp: Date.now(),
        });
        expect(result).toBe(true);
        expect(action).toHaveBeenCalledTimes(1);
    });

    it('should return false when recovery action throws', async () => {
        manager.registerStrategy({
            name: 'broken',
            condition: () => true,
            action: () => { throw new Error('recovery failed'); },
        });

        const result = await manager.recover({
            operation: 'test',
            error: new Error('anything'),
            attempt: 1,
            timestamp: Date.now(),
        });
        expect(result).toBe(false);
    });

    it('should clear all strategies', async () => {
        manager.registerStrategy({
            name: 'test',
            condition: () => true,
            action: jest.fn(),
        });
        manager.clearStrategies();
        // After clearing, no strategy should match
        const result = await manager.recover({
            operation: 'test',
            error: new Error('anything'),
            attempt: 1,
            timestamp: Date.now(),
        });
        expect(result).toBe(false);
    });
});
