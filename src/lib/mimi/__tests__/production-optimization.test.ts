/**
 * Production Optimization Tests - Q4 2026
 *
 * Tests for performance optimization and error handling.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
    CacheManager,
    Memoizer,
    PerformanceMonitor,
    type PerformanceMetrics,
    type OptimizationStrategy
} from '../performance-optimizer';
import {
    RetryHandler,
    FallbackExecutor,
    ErrorRecoveryManager,
    GracefulDegradation,
    type RetryConfig,
    type FallbackChain,
    type RecoveryStrategy,
    type ErrorContext
} from '../error-handler';

describe('Production Optimization Architecture', () => {
    describe('Cache Manager', () => {
        let cache: CacheManager<string>;

        beforeEach(() => {
            cache = new CacheManager({ maxSize: 10, ttl: 1, strategy: 'lru' });
        });

        it('should store and retrieve values', () => {
            cache.set('key1', 'value1');
            const result = cache.get('key1');

            expect(result).toBe('value1');
        });

        it('should return null for missing keys', () => {
            const result = cache.get('nonexistent');
            expect(result).toBeNull();
        });

        it('should evict items when cache is full', () => {
            // Fill cache beyond capacity
            for (let i = 0; i < 1001; i++) {
                cache.set(`key${i}`, `value${i}`);
            }

            const stats = cache.getStats();
            expect(stats.size).toBeLessThanOrEqual(1000);
        });

        it('should calculate cache statistics', () => {
            cache.set('key1', 'value1');
            cache.get('key1'); // Hit
            cache.get('key1'); // Hit

            const stats = cache.getStats();
            expect(stats.size).toBe(1);
            expect(stats.hitRate).toBeGreaterThan(0);
        });

        it('should clear all items', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.clear();

            const stats = cache.getStats();
            expect(stats.size).toBe(0);
        });
    });

    describe('Memoizer', () => {
        let memoizer: Memoizer;

        beforeEach(() => {
            memoizer = new Memoizer();
        });

        it('should memoize function results', () => {
            let callCount = 0;
            const fn = (x: number) => {
                callCount++;
                return x * 2;
            };

            const memoized = memoizer.memoize(fn);

            expect(memoized(5)).toBe(10);
            expect(memoized(5)).toBe(10);
            expect(callCount).toBe(1); // Called only once
        });

        it('should use custom key generator', () => {
            const fn = (obj: { id: number }) => obj.id * 2;
            const memoized = memoizer.memoize(fn, (obj) => `id:${obj.id}`);

            expect(memoized({ id: 5 })).toBe(10);
            expect(memoized({ id: 5 })).toBe(10);
        });

        it('should clear memoization cache', () => {
            let callCount = 0;
            const fn = (x: number) => {
                callCount++;
                return x * 2;
            };

            const memoized = memoizer.memoize(fn);

            memoized(5);
            memoizer.clear();
            memoized(5);

            expect(callCount).toBe(2); // Called twice after clear
        });
    });

    describe('Performance Monitor', () => {
        let monitor: PerformanceMonitor;

        beforeEach(() => {
            monitor = new PerformanceMonitor();
        });

        it('should record performance metrics', () => {
            const metrics: Partial<PerformanceMetrics> = {
                bundleSize: 1000,
                memoryUsage: 100,
                responseTime: 50,
                cacheHitRate: 0.8
            };

            monitor.recordMetrics(metrics);
            const avg = monitor.getAverageMetrics();

            expect(avg.bundleSize).toBe(1000);
            expect(avg.memoryUsage).toBeGreaterThanOrEqual(0);
        });

        it('should calculate average metrics', () => {
            monitor.recordMetrics({ responseTime: 100 });
            monitor.recordMetrics({ responseTime: 200 });
            monitor.recordMetrics({ responseTime: 300 });

            const avg = monitor.getAverageMetrics();
            expect(avg.responseTime).toBe(200);
        });

        it('should generate recommendations for high memory usage', () => {
            monitor.recordMetrics({ memoryUsage: 600 }); // > 500 MB

            const recommendations = monitor.getRecommendations();
            const memoryRec = recommendations.find(r => r.name.includes('Memory'));

            expect(memoryRec).toBeDefined();
            expect(memoryRec?.impact).toBe('high');
        });

        it('should generate recommendations for slow response time', () => {
            monitor.recordMetrics({ responseTime: 1500 }); // > 1000 ms

            const recommendations = monitor.getRecommendations();
            const timeRec = recommendations.find(r => r.name.includes('Response'));

            expect(timeRec).toBeDefined();
        });

        it('should clear all metrics', () => {
            monitor.recordMetrics({ responseTime: 100 });
            monitor.clear();

            const avg = monitor.getAverageMetrics();
            expect(avg.responseTime).toBe(0);
        });
    });

    describe('Retry Handler', () => {
        it('should retry failed operations', async () => {
            let attempts = 0;
            const operation = async () => {
                attempts++;
                if (attempts < 3) {
                    throw new Error('Temporary failure');
                }
                return 'success';
            };

            const retryHandler = new RetryHandler({ maxAttempts: 3, baseDelay: 10 });
            const result = await retryHandler.retry(operation, 'test');

            expect(result).toBe('success');
            expect(attempts).toBe(3);
        });

        it('should throw after max attempts', async () => {
            const operation = async () => {
                throw new Error('Permanent failure');
            };

            const retryHandler = new RetryHandler({ maxAttempts: 2, baseDelay: 10 });

            await expect(
                retryHandler.retry(operation, 'test')
            ).rejects.toThrow('failed after 2 attempts');
        });
    });

    describe('Fallback Executor', () => {
        it('should use primary operation when successful', async () => {
            const chain: FallbackChain<string> = {
                primary: async () => 'primary',
                fallbacks: [
                    async () => 'fallback1',
                    async () => 'fallback2'
                ]
            };

            const executor = new FallbackExecutor();
            const result = await executor.executeWithFallback(chain);

            expect(result).toBe('primary');
        });

        it('should use fallback when primary fails', async () => {
            const chain: FallbackChain<string> = {
                primary: async () => {
                    throw new Error('Primary failed');
                },
                fallbacks: [
                    async () => 'fallback1'
                ]
            };

            const executor = new FallbackExecutor();
            const result = await executor.executeWithFallback(chain);

            expect(result).toBe('fallback1');
        });

        it('should use final fallback when all fail', async () => {
            const chain: FallbackChain<string> = {
                primary: async () => {
                    throw new Error('Primary failed');
                },
                fallbacks: [
                    async () => {
                        throw new Error('Fallback failed');
                    }
                ],
                finalFallback: () => 'degraded'
            };

            const executor = new FallbackExecutor();
            const result = await executor.executeWithFallback(chain);

            expect(result).toBe('degraded');
        });
    });

    describe('Error Recovery Manager', () => {
        let recovery: ErrorRecoveryManager;

        beforeEach(() => {
            recovery = new ErrorRecoveryManager();
        });

        it('should apply matching recovery strategy', async () => {
            let strategyExecuted = false;

            const strategy: RecoveryStrategy = {
                name: 'Test Strategy',
                condition: (error: Error) => error.message.includes('test'),
                action: async () => {
                    strategyExecuted = true;
                }
            };

            recovery.registerStrategy(strategy);

            const context: ErrorContext = {
                operation: 'test',
                error: new Error('test error'),
                attempt: 1,
                timestamp: Date.now()
            };

            const result = await recovery.recover(context);

            expect(result).toBe(true);
            expect(strategyExecuted).toBe(true);
        });

        it('should return false when no strategy matches', async () => {
            const context: ErrorContext = {
                operation: 'test',
                error: new Error('unknown error'),
                attempt: 1,
                timestamp: Date.now()
            };

            const result = await recovery.recover(context);
            expect(result).toBe(false);
        });

        it('should clear all strategies', () => {
            const strategy: RecoveryStrategy = {
                name: 'Test',
                condition: () => true,
                action: async () => { }
            };

            recovery.registerStrategy(strategy);
            recovery.clearStrategies();

            // After clearing, no strategy should match
            const context: ErrorContext = {
                operation: 'test',
                error: new Error('error'),
                attempt: 1,
                timestamp: Date.now()
            };

            recovery.recover(context).then((result: boolean) => {
                expect(result).toBe(false);
            });
        });
    });

    describe('Graceful Degradation', () => {
        let degradation: GracefulDegradation;

        beforeEach(() => {
            degradation = new GracefulDegradation();
        });

        it('should enable and disable features', () => {
            degradation.enableFeature('testFeature');
            expect(degradation.isFeatureEnabled('testFeature')).toBe(true);

            degradation.disableFeature('testFeature');
            expect(degradation.isFeatureEnabled('testFeature')).toBe(false);
        });

        it('should execute feature when enabled', async () => {
            degradation.enableFeature('testFeature');

            const result = await degradation.executeFeature(
                'testFeature',
                async () => 'feature',
                () => 'fallback'
            );

            expect(result).toBe('feature');
        });

        it('should use fallback when feature disabled', async () => {
            degradation.disableFeature('testFeature');

            const result = await degradation.executeFeature(
                'testFeature',
                async () => 'feature',
                () => 'fallback'
            );

            expect(result).toBe('fallback');
        });

        it('should disable feature on error and use fallback', async () => {
            degradation.enableFeature('testFeature');

            const result = await degradation.executeFeature(
                'testFeature',
                async () => {
                    throw new Error('Feature error');
                },
                () => 'fallback'
            );

            expect(result).toBe('fallback');
            expect(degradation.isFeatureEnabled('testFeature')).toBe(false);
        });

        it('should reset all features', () => {
            degradation.disableFeature('feature1');
            degradation.disableFeature('feature2');
            degradation.reset();

            // After reset, features should default to enabled
            expect(degradation.isFeatureEnabled('feature1')).toBe(true);
            expect(degradation.isFeatureEnabled('feature2')).toBe(true);
        });
    });

    describe('OptimizationStrategy Type', () => {
        it('should have correct structure', () => {
            const strategy: OptimizationStrategy = {
                name: 'Test Strategy',
                description: 'Test description',
                impact: 'high',
                effort: 'low',
                status: 'pending'
            };

            expect(strategy.name).toBeTruthy();
            expect(['high', 'medium', 'low']).toContain(strategy.impact);
            expect(['high', 'medium', 'low']).toContain(strategy.effort);
            expect(['pending', 'active', 'completed']).toContain(strategy.status);
        });
    });
});
