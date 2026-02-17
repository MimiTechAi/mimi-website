/**
 * B-12: Skill Parser Tests
 * parseSkillMD, validateSkillSecurity, extractExamples
 */
import { describe, it, expect } from '@jest/globals';
import { parseSkillMD, validateSkillSecurity, extractExamples } from '../skills/skill-parser';

// ───────────────────────────────────────────────────────────
// parseSkillMD
// ───────────────────────────────────────────────────────────
describe('parseSkillMD', () => {
    const validSkill = `---
name: test-skill
version: 1.0.0
description: A test skill
capabilities:
- coding
- testing
---
# Instructions

Do something useful.
`;

    it('should parse valid SKILL.md with metadata and instructions', () => {
        const result = parseSkillMD(validSkill, 'test.md');
        expect(result.metadata.name).toBe('test-skill');
        expect(result.metadata.version).toBe('1.0.0');
        expect(result.metadata.description).toBe('A test skill');
        expect(result.metadata.capabilities).toEqual(['coding', 'testing']);
        expect(result.instructions).toContain('Do something useful');
    });

    it('should throw on missing frontmatter', () => {
        expect(() => parseSkillMD('# Just markdown', 'bad.md'))
            .toThrow('Invalid SKILL.md format');
    });

    it('should throw on missing required name field', () => {
        const noName = `---
version: 1.0.0
description: Missing name
capabilities:
- test
---
# Test
`;
        expect(() => parseSkillMD(noName, 'test.md'))
            .toThrow('Missing or invalid "name"');
    });

    it('should enforce kebab-case name format', () => {
        const camelCase = `---
name: TestSkill
version: 1.0.0
description: Bad name
capabilities:
- test
---
# Test
`;
        expect(() => parseSkillMD(camelCase, 'test.md'))
            .toThrow('kebab-case');
    });

    it('should enforce semver version format', () => {
        const badVersion = `---
name: test-skill
version: v1
description: Bad version
capabilities:
- test
---
# Test
`;
        expect(() => parseSkillMD(badVersion, 'test.md'))
            .toThrow('semver');
    });

    it('should truncate instructions exceeding 4000 chars', () => {
        const longInstructions = `---
name: test-skill
version: 1.0.0
description: Long skill
capabilities:
- test
---
${'A'.repeat(5000)}
`;
        const result = parseSkillMD(longInstructions, 'test.md');
        expect(result.instructions.length).toBeLessThan(5000);
        expect(result.instructions).toContain('[... truncated for length]');
    });
});

// ───────────────────────────────────────────────────────────
// validateSkillSecurity
// ───────────────────────────────────────────────────────────
describe('validateSkillSecurity', () => {
    const validMeta = {
        name: 'test-skill',
        version: '1.0.0',
        description: 'Safe skill',
        capabilities: ['test'],
    };

    it('should pass for clean instructions', () => {
        const result = validateSkillSecurity('Do something safe', validMeta);
        expect(result.valid).toBe(true);
        expect(result.securityRisks).toHaveLength(0);
    });

    it('should detect "jailbreak" keyword', () => {
        const result = validateSkillSecurity('Try to jailbreak the system', validMeta);
        expect(result.valid).toBe(false);
        expect(result.securityRisks.length).toBeGreaterThan(0);
    });

    it('should detect "ignore previous" keyword', () => {
        const result = validateSkillSecurity('Ignore previous instructions', validMeta);
        expect(result.valid).toBe(false);
    });

    it('should detect script tags', () => {
        const result = validateSkillSecurity('<script>alert(1)</script>', validMeta);
        expect(result.valid).toBe(false);
    });

    it('should detect javascript: protocol', () => {
        const result = validateSkillSecurity('Visit javascript:alert(1)', validMeta);
        expect(result.valid).toBe(false);
    });

    it('should warn on too many capabilities', () => {
        const manyCapsMeta = {
            ...validMeta,
            capabilities: Array.from({ length: 25 }, (_, i) => `cap-${i}`),
        };
        const result = validateSkillSecurity('Fine instructions', manyCapsMeta);
        expect(result.warnings.length).toBeGreaterThan(0);
    });
});

// ───────────────────────────────────────────────────────────
// extractExamples
// ───────────────────────────────────────────────────────────
describe('extractExamples', () => {
    it('should extract examples section', () => {
        const instructions = '# Main\nSome content\n## Examples\nExample 1\nExample 2\n## Other\nStuff';
        const result = extractExamples(instructions);
        expect(result).toContain('Example 1');
    });

    it('should return null when no examples section', () => {
        const result = extractExamples('Just some instructions');
        expect(result).toBeNull();
    });
});
