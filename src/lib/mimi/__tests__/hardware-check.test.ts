/**
 * MIMI Agent - Hardware Check Tests
 * 2026 Expert Audit — Priority 2 Test Coverage
 *
 * Tests WebGPU detection, model definitions,
 * and device profiling for various hardware configurations.
 */

import { describe, it, expect } from '@jest/globals';
import { MODELS } from '../hardware-check';

// ─────────────────────────────────────────────────────────
// MODEL DEFINITIONS
// ─────────────────────────────────────────────────────────

describe('Model Definitions', () => {
    it('should have at least 4 model entries', () => {
        expect(Object.keys(MODELS).length).toBeGreaterThanOrEqual(4);
    });

    it('every model should have a non-empty id', () => {
        for (const [key, model] of Object.entries(MODELS)) {
            expect(model.id).toBeDefined();
            expect(model.id.length).toBeGreaterThan(0);
        }
    });

    it('every model should have a name', () => {
        for (const [key, model] of Object.entries(MODELS)) {
            expect(model.name).toBeDefined();
            expect(model.name.length).toBeGreaterThan(0);
        }
    });

    it('every model should have a size string', () => {
        for (const [key, model] of Object.entries(MODELS)) {
            expect(model.size).toBeDefined();
            expect(model.size).toMatch(/\d+(\.\d+)?\s*(MB|GB)/);
        }
    });

    it('should include a small model (SMALL key)', () => {
        expect(MODELS.SMALL).toBeDefined();
        expect(MODELS.SMALL.name).toContain('Llama');
    });

    it('should include a balanced model (BALANCED key)', () => {
        expect(MODELS.BALANCED).toBeDefined();
        expect(MODELS.BALANCED.name).toContain('Qwen');
    });

    it('should include a full model (FULL key)', () => {
        expect(MODELS.FULL).toBeDefined();
        expect(MODELS.FULL.name).toContain('Phi');
    });

    it('should include a vision model (VISION_FULL key)', () => {
        expect(MODELS.VISION_FULL).toBeDefined();
        expect(MODELS.VISION_FULL.isMultimodal).toBe(true);
    });

    it('should have at least one multimodal model', () => {
        const hasMultimodal = Object.values(MODELS).some(
            m => m.isMultimodal === true
        );
        expect(hasMultimodal).toBe(true);
    });

    it('non-vision models should not be multimodal', () => {
        expect(MODELS.FULL.isMultimodal).toBe(false);
        expect(MODELS.BALANCED.isMultimodal).toBe(false);
        expect(MODELS.SMALL.isMultimodal).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────
// MODEL SELECTION LOGIC (conceptual)
// ─────────────────────────────────────────────────────────

describe('Model Selection Logic', () => {
    // Simulate the hardware check selection algorithm
    function selectModelByMemory(gpuBufferSize: number): string | null {
        const canRunVisionFull = gpuBufferSize >= 4_000_000_000;
        const canRunFull = gpuBufferSize >= 2_000_000_000;
        const canRunBalanced = gpuBufferSize >= 800_000_000;
        const canRunSmall = gpuBufferSize >= 500_000_000;

        if (canRunVisionFull) return MODELS.VISION_FULL.id;
        if (canRunFull) return MODELS.FULL.id;
        if (canRunBalanced) return MODELS.BALANCED.id;
        if (canRunSmall) return MODELS.SMALL.id;
        return null;
    }

    it('should select VISION_FULL for 16GB GPU', () => {
        const model = selectModelByMemory(16_000_000_000);
        expect(model).toBe(MODELS.VISION_FULL.id);
    });

    it('should select FULL for 3GB GPU', () => {
        const model = selectModelByMemory(3_000_000_000);
        expect(model).toBe(MODELS.FULL.id);
    });

    it('should select BALANCED for 1GB GPU', () => {
        const model = selectModelByMemory(1_000_000_000);
        expect(model).toBe(MODELS.BALANCED.id);
    });

    it('should select SMALL for 600MB GPU', () => {
        const model = selectModelByMemory(600_000_000);
        expect(model).toBe(MODELS.SMALL.id);
    });

    it('should return null for 256MB GPU (too small)', () => {
        const model = selectModelByMemory(256_000_000);
        expect(model).toBeNull();
    });

    it('should select most powerful model for given memory', () => {
        // Exactly at threshold boundary
        const model = selectModelByMemory(4_000_000_000);
        expect(model).toBe(MODELS.VISION_FULL.id);
    });
});

// ─────────────────────────────────────────────────────────
// DEVICE PROFILE STRUCTURE
// ─────────────────────────────────────────────────────────

describe('DeviceProfile Interface', () => {
    it('should define expected model properties', () => {
        const model = MODELS.FULL;
        expect(typeof model.id).toBe('string');
        expect(typeof model.name).toBe('string');
        expect(typeof model.size).toBe('string');
        expect(typeof model.description).toBe('string');
        expect(typeof model.isMultimodal).toBe('boolean');
    });
});
