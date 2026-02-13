/**
 * Advanced Error Handler - Q4 2026 Implementation
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Fallback chains for critical operations
 * - Error recovery strategies
 * - Graceful degradation
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { getAgentEventBus } from './agent-events';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface RetryConfig {
    maxAttempts: number;
    baseDelay: number; // milliseconds
    maxDelay: number; // milliseconds
    exponentialBackoff: boolean;
    jitter: boolean;
}

export interface ErrorContext {
    operation: string;
    error: Error;
    attempt: number;
    timestamp: number;
    metadata?: Record<string, any>;
}

export interface FallbackChain<T> {
    primary: () => Promise<T>;
    fallbacks: Array<() => Promise<T>>;
    finalFallback?: () => T;
}

export interface RecoveryStrategy {
    name: string;
    condition: (error: Error) => boolean;
    action: (error: ErrorContext) => Promise<void> | void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RETRY HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export class RetryHandler {
    private config: RetryConfig;
    private eventBus = getAgentEventBus();

    constructor(config: Partial<RetryConfig> = {}) {
        this.config = {
            maxAttempts: config.maxAttempts || 3,
            baseDelay: config.baseDelay || 1000, // 1 second
            maxDelay: config.maxDelay || 30000, // 30 seconds
            exponentialBackoff: config.exponentialBackoff ?? true,
            jitter: config.jitter ?? true
        };
    }

    /**
     * Retry an operation with exponential backoff
     */
    async retry<T>(
        operation: () => Promise<T>,
        operationName: string = 'operation'
    ): Promise<T> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                const context: ErrorContext = {
                    operation: operationName,
                    error: lastError,
                    attempt,
                    timestamp: Date.now()
                };

                // Emit retry event
                this.eventBus.emit('STATUS_CHANGE', {
                    status: 'retrying',
                    metadata: { attempt, maxAttempts: this.config.maxAttempts }
                });

                console.warn(
                    `[RetryHandler] ${operationName} failed (attempt ${attempt}/${this.config.maxAttempts}):`,
                    lastError.message
                );

                // Don't delay after last attempt
                if (attempt < this.config.maxAttempts) {
                    const delay = this.calculateDelay(attempt);
                    await this.sleep(delay);
                }
            }
        }

        // All attempts failed
        throw new Error(
            `${operationName} failed after ${this.config.maxAttempts} attempts: ${lastError?.message}`
        );
    }

    /**
     * Calculate delay for next retry
     */
    private calculateDelay(attempt: number): number {
        let delay: number;

        if (this.config.exponentialBackoff) {
            // Exponential: baseDelay * 2^(attempt-1)
            delay = this.config.baseDelay * Math.pow(2, attempt - 1);
        } else {
            // Linear: baseDelay * attempt
            delay = this.config.baseDelay * attempt;
        }

        // Cap at max delay
        delay = Math.min(delay, this.config.maxDelay);

        // Add jitter to prevent thundering herd
        if (this.config.jitter) {
            delay = delay * (0.5 + Math.random() * 0.5); // 50-100% of calculated delay
        }

        return delay;
    }

    /**
     * Sleep for specified milliseconds
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FALLBACK EXECUTOR
// ═══════════════════════════════════════════════════════════════════════════════

export class FallbackExecutor {
    private eventBus = getAgentEventBus();

    /**
     * Execute operation with fallback chain
     */
    async executeWithFallback<T>(chain: FallbackChain<T>): Promise<T> {
        // Try primary
        try {
            return await chain.primary();
        } catch (primaryError) {
            console.warn('[FallbackExecutor] Primary operation failed:', primaryError);

            this.eventBus.emit('STATUS_CHANGE', {
                status: 'fallback',
                metadata: { reason: 'primary_failed' }
            });

            // Try fallbacks in order
            for (let i = 0; i < chain.fallbacks.length; i++) {
                try {
                    console.log(`[FallbackExecutor] Trying fallback ${i + 1}/${chain.fallbacks.length}`);
                    return await chain.fallbacks[i]();
                } catch (fallbackError) {
                    console.warn(`[FallbackExecutor] Fallback ${i + 1} failed:`, fallbackError);

                    // Continue to next fallback
                    if (i < chain.fallbacks.length - 1) {
                        continue;
                    }
                }
            }

            // All fallbacks failed, use final fallback if available
            if (chain.finalFallback) {
                console.log('[FallbackExecutor] Using final fallback (degraded mode)');
                return chain.finalFallback();
            }

            // No fallback available
            throw new Error('All fallbacks exhausted');
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR RECOVERY MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

export class ErrorRecoveryManager {
    private strategies: RecoveryStrategy[] = [];
    private eventBus = getAgentEventBus();

    /**
     * Register recovery strategy
     */
    registerStrategy(strategy: RecoveryStrategy): void {
        this.strategies.push(strategy);
    }

    /**
     * Attempt to recover from error
     */
    async recover(context: ErrorContext): Promise<boolean> {
        // Find matching strategy
        const strategy = this.strategies.find(s => s.condition(context.error));

        if (!strategy) {
            console.warn('[ErrorRecovery] No recovery strategy found for error:', context.error.message);
            return false;
        }

        try {
            console.log(`[ErrorRecovery] Applying strategy: ${strategy.name}`);

            this.eventBus.emit('STATUS_CHANGE', {
                status: 'recovering',
                metadata: { strategy: strategy.name }
            });

            await strategy.action(context);
            return true;
        } catch (recoveryError) {
            console.error('[ErrorRecovery] Recovery strategy failed:', recoveryError);
            return false;
        }
    }

    /**
     * Clear all strategies
     */
    clearStrategies(): void {
        this.strategies = [];
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRACEFUL DEGRADATION
// ═══════════════════════════════════════════════════════════════════════════════

export class GracefulDegradation {
    private featureFlags: Map<string, boolean> = new Map();

    /**
     * Enable a feature
     */
    enableFeature(name: string): void {
        this.featureFlags.set(name, true);
    }

    /**
     * Disable a feature (graceful degradation)
     */
    disableFeature(name: string): void {
        this.featureFlags.set(name, false);
        console.log(`[GracefulDegradation] Feature disabled: ${name}`);
    }

    /**
     * Check if feature is enabled
     */
    isFeatureEnabled(name: string): boolean {
        return this.featureFlags.get(name) ?? true; // Default: enabled
    }

    /**
     * Execute feature with fallback
     */
    async executeFeature<T>(
        featureName: string,
        featureImpl: () => Promise<T>,
        fallbackImpl: () => T
    ): Promise<T> {
        if (this.isFeatureEnabled(featureName)) {
            try {
                return await featureImpl();
            } catch (error) {
                console.warn(`[GracefulDegradation] Feature ${featureName} failed, disabling:`, error);
                this.disableFeature(featureName);
                return fallbackImpl();
            }
        } else {
            return fallbackImpl();
        }
    }

    /**
     * Reset all features
     */
    reset(): void {
        this.featureFlags.clear();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR HANDLER (Main Orchestrator)
// ═══════════════════════════════════════════════════════════════════════════════

export class ErrorHandler {
    retry: RetryHandler;
    fallback: FallbackExecutor;
    recovery: ErrorRecoveryManager;
    degradation: GracefulDegradation;

    constructor() {
        this.retry = new RetryHandler();
        this.fallback = new FallbackExecutor();
        this.recovery = new ErrorRecoveryManager();
        this.degradation = new GracefulDegradation();

        this.registerDefaultStrategies();
    }

    /**
     * Register default recovery strategies
     */
    private registerDefaultStrategies(): void {
        // Network error recovery
        this.recovery.registerStrategy({
            name: 'Network Error Recovery',
            condition: (error) => error.message.toLowerCase().includes('network'),
            action: async (context) => {
                console.log('[Recovery] Waiting for network to recover...');
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        });

        // Memory error recovery
        this.recovery.registerStrategy({
            name: 'Memory Error Recovery',
            condition: (error) => error.message.toLowerCase().includes('memory'),
            action: async () => {
                console.log('[Recovery] Attempting to free memory...');
                if (typeof global !== 'undefined' && global.gc) {
                    global.gc();
                }
            }
        });

        // Timeout error recovery
        this.recovery.registerStrategy({
            name: 'Timeout Error Recovery',
            condition: (error) => error.message.toLowerCase().includes('timeout'),
            action: async (context) => {
                console.log('[Recovery] Increasing timeout for next attempt...');
                context.metadata = context.metadata || {};
                context.metadata.timeout = (context.metadata.timeout || 5000) * 2;
            }
        });
    }

    /**
     * Cleanup resources
     */
    cleanup(): void {
        this.recovery.clearStrategies();
        this.degradation.reset();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════════════════════

let handlerInstance: ErrorHandler | null = null;

export function getErrorHandler(): ErrorHandler {
    if (!handlerInstance) {
        handlerInstance = new ErrorHandler();
    }
    return handlerInstance;
}
