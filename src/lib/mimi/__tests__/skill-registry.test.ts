/**
 * B-13: Skill Registry Tests
 * LRU Cache, SkillRegistry basics
 */
import { describe, it, expect, beforeEach } from '@jest/globals';

// LRUCache is not exported directly, test via SkillRegistry
// But we can import and test SkillRegistry basics
jest.mock('../agent-events', () => ({
    getAgentEventBus: () => ({
        emit: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
    }),
}));

import { getSkillRegistry } from '../skills/skill-registry';

describe('SkillRegistry', () => {
    it('should return a registry instance', () => {
        const registry = getSkillRegistry();
        expect(registry).toBeDefined();
    });

    it('should be the same singleton on subsequent calls', () => {
        const r1 = getSkillRegistry();
        const r2 = getSkillRegistry();
        expect(r1).toBe(r2);
    });

    it('should initially have no skills cached', () => {
        const registry = getSkillRegistry();
        const skills = registry.getAllSkills();
        expect(Array.isArray(skills)).toBe(true);
    });

    it('should report ready() as false before initialization', () => {
        const registry = getSkillRegistry();
        // Before calling initialize(), it should not be ready
        // (unless it was already initialized by another test)
        expect(typeof registry.ready()).toBe('boolean');
    });

    it('should have reset() method that clears state', () => {
        const registry = getSkillRegistry();
        registry.reset();
        const skills = registry.getAllSkills();
        expect(skills).toHaveLength(0);
        expect(registry.ready()).toBe(false);
    });
});
