/**
 * MIMI Agent - Memory Manager Tests
 * 2026 Expert Audit — Priority 0 Test Coverage
 *
 * Tests memory tracking, model registration,
 * threshold detection, and auto-unloading.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// We need to test the MemoryManager class directly
// Since it uses a singleton, we'll import the getter and type
import { getMemoryManager, type MemoryManager } from '../memory-manager';

describe('Memory Manager', () => {
    let mm: MemoryManager;

    beforeEach(() => {
        mm = getMemoryManager();
        // Clean up all models between tests
        const status = mm.getStatus();
        for (const modelId of status.activeModels) {
            mm.unregisterModel(modelId);
        }
    });

    describe('Model Registration', () => {
        it('should register a model and track it', () => {
            mm.registerModel('llm-phi35');
            const status = mm.getStatus();
            expect(status.activeModels).toContain('llm-phi35');
        });

        it('should unregister a model', () => {
            mm.registerModel('vision');
            mm.unregisterModel('vision');
            const status = mm.getStatus();
            expect(status.activeModels).not.toContain('vision');
        });

        it('should handle duplicate registration gracefully', () => {
            mm.registerModel('llm-phi35');
            mm.registerModel('llm-phi35');
            const status = mm.getStatus();
            // Set should deduplicate — only one entry
            expect(status.activeModels.filter(m => m === 'llm-phi35').length).toBe(1);
        });

        it('should handle unregistering non-existent model gracefully', () => {
            // Should not throw
            expect(() => mm.unregisterModel('non-existent-model')).not.toThrow();
        });
    });

    describe('Memory Estimation', () => {
        it('should start at 0MB with no models', () => {
            const usage = mm.getEstimatedUsage();
            expect(usage).toBe(0);
        });

        it('should estimate LLM Phi-3.5 at ~2200MB', () => {
            mm.registerModel('llm-phi35');
            const usage = mm.getEstimatedUsage();
            expect(usage).toBeGreaterThanOrEqual(2000);
            expect(usage).toBeLessThanOrEqual(2500);
        });

        it('should estimate Vision at ~500MB', () => {
            mm.registerModel('vision');
            const usage = mm.getEstimatedUsage();
            expect(usage).toBeGreaterThanOrEqual(400);
            expect(usage).toBeLessThanOrEqual(600);
        });

        it('should estimate pyodide at ~200MB', () => {
            mm.registerModel('pyodide');
            const usage = mm.getEstimatedUsage();
            expect(usage).toBeGreaterThanOrEqual(100);
            expect(usage).toBeLessThanOrEqual(300);
        });

        it('should stack LLM + Vision + Pyodide', () => {
            mm.registerModel('llm-phi35');
            mm.registerModel('vision');
            mm.registerModel('pyodide');
            const usage = mm.getEstimatedUsage();
            // Phi-3.5(2200) + Vision(500) + Pyodide(200) = ~2900
            expect(usage).toBeGreaterThanOrEqual(2700);
        });

        it('should use only one LLM size (exclusive selection)', () => {
            mm.registerModel('llm-phi35');
            mm.registerModel('llm-phi4');
            const usage = mm.getEstimatedUsage();
            // Should pick the first matching one (phi35-vision > phi4 > phi35)
            // Both registered but if-else chain picks only one
            expect(usage).toBeLessThanOrEqual(3500);
        });
    });

    describe('Threshold Detection', () => {
        it('should not warn with low usage', () => {
            mm.registerModel('pyodide'); // ~200MB
            const status = mm.getStatus();
            expect(status.isWarning).toBe(false);
            expect(status.isCritical).toBe(false);
        });

        it('should warn when usage exceeds warning threshold', () => {
            mm.registerModel('llm-phi35'); // ~2200MB
            mm.registerModel('vision');    // ~500MB
            const status = mm.getStatus();
            // 2700MB > WARNING(2500MB)
            expect(status.isWarning).toBe(true);
        });

        it('should be critical when usage exceeds critical threshold', () => {
            // Use vision-LLM which is never auto-unloaded by unloadNonEssential
            // (unloadNonEssential only removes 'vision' and 'tts', not LLMs)
            mm.registerModel('llm-phi35-vision'); // 4200MB > CRITICAL(3000)
            const usage = mm.getEstimatedUsage();
            expect(usage).toBeGreaterThanOrEqual(3000);
            const status = mm.getStatus();
            expect(status.isCritical).toBe(true);
        });
    });

    describe('canLoadModel', () => {
        it('should allow loading vision when plenty of memory', () => {
            mm.registerModel('llm-qwen'); // ~350MB 
            expect(mm.canLoadModel('vision')).toBe(true);
        });

        it('should return activeModels as array', () => {
            mm.registerModel('llm-phi35');
            mm.registerModel('vision');
            const status = mm.getStatus();
            expect(Array.isArray(status.activeModels)).toBe(true);
            expect(status.activeModels.length).toBe(2);
        });
    });

    describe('Status Interface', () => {
        it('should return correct MemoryStatus shape', () => {
            const status = mm.getStatus();
            expect(status).toHaveProperty('estimatedUsageMB');
            expect(status).toHaveProperty('isWarning');
            expect(status).toHaveProperty('isCritical');
            expect(status).toHaveProperty('activeModels');
            expect(typeof status.estimatedUsageMB).toBe('number');
            expect(typeof status.isWarning).toBe('boolean');
            expect(typeof status.isCritical).toBe('boolean');
            expect(Array.isArray(status.activeModels)).toBe(true);
        });
    });
});
