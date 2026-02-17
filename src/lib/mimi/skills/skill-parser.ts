/**
 * MIMI Agent - SKILL.md Parser
 * 
 * Parses YAML frontmatter + Markdown content from SKILL.md files.
 * Validates schema, extracts metadata, sanitizes content.
 * 
 * Team: Priya + Alex (Parser + Validation)
 */

import type { SkillMetadata, SkillValidationResult } from './skill-types';

/**
 * YAML Frontmatter Pattern
 * Matches: ---\n[yaml]\n---\n[markdown]
 */
const FRONTMATTER_PATTERN = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;

/**
 * Security Risk Keywords (Carlos Silva's recommendations)
 */
const SECURITY_RISK_KEYWORDS = [
    'ignore previous',
    'ignore all previous',
    'disregard previous',
    'system override',
    'sudo',
    'admin mode',
    'god mode',
    'jailbreak',
    'prompt injection'
];

/**
 * Parse SKILL.md file content
 */
export function parseSkillMD(content: string, sourcePath: string): {
    metadata: SkillMetadata;
    instructions: string;
} {
    // Extract frontmatter and content
    const match = content.match(FRONTMATTER_PATTERN);

    if (!match) {
        throw new Error(`Invalid SKILL.md format: ${sourcePath}\nMust have YAML frontmatter between --- markers`);
    }

    const [, yamlContent, markdownContent] = match;

    // Parse YAML (simple implementation - assumes valid YAML)
    const metadata = parseYAML(yamlContent);

    // Validate metadata
    validateMetadata(metadata, sourcePath);

    // Sanitize instructions
    const instructions = sanitizeInstructions(markdownContent.trim());

    return {
        metadata,
        instructions
    };
}

/**
 * Simple YAML parser for frontmatter
 * Handles basic key-value pairs and arrays
 * 
 * NOTE: For production, consider using a library like 'yaml' or 'gray-matter'
 * This implementation handles the common cases for SKILL.md
 */
function parseYAML(yamlContent: string): SkillMetadata {
    const lines = yamlContent.split('\n');
    const result: Partial<SkillMetadata> & Record<string, unknown> = {};
    let currentKey: string | null = null;
    let currentArray: string[] = [];

    for (const line of lines) {
        const trimmed = line.trim();

        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith('#')) continue;

        // Array item
        if (trimmed.startsWith('- ')) {
            if (currentKey && Array.isArray(currentArray)) {
                const value = trimmed.substring(2).trim();
                // Remove quotes if present
                currentArray.push(value.replace(/^["']|["']$/g, ''));
            }
            continue;
        }

        // Key-value pair
        const colonIndex = trimmed.indexOf(':');
        if (colonIndex > 0) {
            // Flush previous array
            if (currentKey && currentArray.length > 0) {
                result[currentKey] = currentArray;
                currentArray = [];
            }

            const key = trimmed.substring(0, colonIndex).trim();
            let value = trimmed.substring(colonIndex + 1).trim();

            // Remove quotes
            value = value.replace(/^["']|["']$/g, '');

            // Check if value is an array
            if (value === '' || value === '[]') {
                currentKey = key;
                currentArray = [];
                result[key] = currentArray;
            } else {
                // Parse value type
                if (value === 'true') result[key] = true;
                else if (value === 'false') result[key] = false;
                else if (/^\d+$/.test(value)) result[key] = parseInt(value, 10);
                else if (/^\d+\.\d+$/.test(value)) result[key] = parseFloat(value);
                else result[key] = value;

                currentKey = null;
            }
        }
    }

    // Flush final array
    if (currentKey && currentArray.length > 0) {
        result[currentKey] = currentArray;
    }

    return result as SkillMetadata;
}

/**
 * Validate skill metadata
 */
function validateMetadata(metadata: SkillMetadata, sourcePath: string): void {
    const errors: string[] = [];

    // Required fields
    if (!metadata.name || typeof metadata.name !== 'string') {
        errors.push('Missing or invalid "name" field');
    }

    if (!metadata.version || typeof metadata.version !== 'string') {
        errors.push('Missing or invalid "version" field');
    }

    if (!metadata.description || typeof metadata.description !== 'string') {
        errors.push('Missing or invalid "description" field');
    }

    if (!metadata.capabilities || !Array.isArray(metadata.capabilities) || metadata.capabilities.length === 0) {
        errors.push('Missing or invalid "capabilities" field (must be non-empty array)');
    }

    // Optional field validation
    if (metadata.priority !== undefined && (typeof metadata.priority !== 'number' || metadata.priority < 1 || metadata.priority > 10)) {
        errors.push('Invalid "priority" field (must be number 1-10)');
    }

    if (metadata.requires !== undefined && !Array.isArray(metadata.requires)) {
        errors.push('Invalid "requires" field (must be array)');
    }

    // Name format (kebab-case)
    if (metadata.name && !/^[a-z0-9-]+$/.test(metadata.name)) {
        errors.push('Invalid "name" format (must be kebab-case: lowercase letters, numbers, hyphens)');
    }

    // Semver validation (basic)
    if (metadata.version && !/^\d+\.\d+\.\d+/.test(metadata.version)) {
        errors.push('Invalid "version" format (must be semver: X.Y.Z)');
    }

    if (errors.length > 0) {
        throw new Error(`Skill validation failed: ${sourcePath}\n${errors.join('\n')}`);
    }
}

/**
 * Sanitize instructions for security
 */
function sanitizeInstructions(instructions: string): string {
    // Length limit (Carlos Silva's recommendation)
    const MAX_LENGTH = 4000;
    if (instructions.length > MAX_LENGTH) {
        console.warn(`[SkillParser] Instructions exceed ${MAX_LENGTH} chars, truncating...`);
        instructions = instructions.substring(0, MAX_LENGTH) + '\n\n[... truncated for length]';
    }

    return instructions;
}

/**
 * Validate skill for security risks
 * Returns validation result with detected risks
 */
export function validateSkillSecurity(
    instructions: string,
    metadata: SkillMetadata
): SkillValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const securityRisks: string[] = [];

    // Check for security risk keywords
    const lowerInstructions = instructions.toLowerCase();
    for (const keyword of SECURITY_RISK_KEYWORDS) {
        if (lowerInstructions.includes(keyword.toLowerCase())) {
            securityRisks.push(`Detected suspicious keyword: "${keyword}"`);
        }
    }

    // Check for excessive length
    if (instructions.length > 4000) {
        warnings.push('Instructions exceed recommended length (4000 chars)');
    }

    // Check for script tags or HTML
    if (/<script|<iframe|javascript:/i.test(instructions)) {
        securityRisks.push('Detected potential HTML/JavaScript injection');
    }

    // Capability validation
    if (metadata.capabilities.length > 20) {
        warnings.push('Too many capabilities (>20) - may reduce matching accuracy');
    }

    return {
        valid: securityRisks.length === 0 && errors.length === 0,
        errors,
        warnings,
        securityRisks
    };
}

/**
 * Extract examples from instructions (if present)
 * Looks for ## Examples section
 */
export function extractExamples(instructions: string): string | null {
    const examplesMatch = instructions.match(/##\s*Examples?\s*\n([\s\S]*?)(?=\n##|\n$)/i);
    return examplesMatch ? examplesMatch[1].trim() : null;
}
