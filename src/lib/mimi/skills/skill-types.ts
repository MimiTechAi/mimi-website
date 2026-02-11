/**
 * MIMI Agent - Skill System Types
 * 
 * Type definitions for the extensible agent skills architecture.
 * Supports both built-in skills and user-defined external skills.
 * 
 * Created by Elite Team - SOTA 2026 Implementation
 */

/**
 * SKILL.md YAML Frontmatter Schema
 */
export interface SkillMetadata {
    /** Unique skill identifier (kebab-case) */
    name: string;

    /** Semantic version (semver) */
    version: string;

    /** Human-readable description */
    description: string;

    /** Searchable capabilities/keywords */
    capabilities: string[];

    /** Optional author information */
    author?: string;

    /** Dependencies on other skills or tools */
    requires?: string[];

    /** Priority when multiple skills match (1-10, higher = preferred) */
    priority?: number;

    /** Enabled by default? */
    enabled?: boolean;

    /** Category for organization */
    category?: 'data' | 'code' | 'document' | 'media' | 'web' | 'general';
}

/**
 * Complete skill definition with instructions
 */
export interface AgentSkill {
    /** Metadata from YAML frontmatter */
    metadata: SkillMetadata;

    /** Markdown instructions for LLM */
    instructions: string;

    /** Absolute path to skill source */
    sourcePath: string;

    /** Type of skill */
    type: 'builtin' | 'external';

    /** Load timestamp */
    loadedAt: Date;

    /** Usage statistics (for learning) */
    stats?: SkillUsageStats;
}

/**
 * Skill usage tracking for long-term learning
 */
export interface SkillUsageStats {
    /** Skill identifier */
    skillId: string;

    /** Number of times used */
    timesUsed: number;

    /** Last usage timestamp */
    lastUsed: Date;

    /** Success rate based on user feedback (0-1) */
    averageSuccessRate: number;

    /** User preference score (-1 to 1, adjusted by thumbs up/down) */
    userPreference: number;

    /** Average response time when using this skill */
    averageResponseTime?: number;
}

/**
 * Skill search/matching result
 */
export interface SkillMatch {
    /** Matched skill */
    skill: AgentSkill;

    /** Match confidence score (0-1) */
    confidence: number;

    /** Why this skill matched */
    reason: 'capability' | 'semantic' | 'usage-history' | 'agent-preference';

    /** Matching capabilities */
    matchedCapabilities?: string[];
}

/**
 * Skill injection context
 */
export interface SkillInjectionContext {
    /** User query */
    query: string;

    /** Current agent (if using orchestrator) */
    agentId?: string;

    /** Conversation history length */
    historyLength: number;

    /** Available token budget for skills */
    maxTokens: number;

    /** Previously used skills in conversation */
    recentlyUsedSkills?: string[];
}

/**
 * Skill validation result
 */
export interface SkillValidationResult {
    /** Is skill valid? */
    valid: boolean;

    /** Validation errors */
    errors: string[];

    /** Validation warnings */
    warnings: string[];

    /** Security risks detected */
    securityRisks: string[];
}

/**
 * Skill registry configuration
 */
export interface SkillRegistryConfig {
    /** Enable builtin skills? */
    enableBuiltin: boolean;

    /** Enable external skills? */
    enableExternal: boolean;

    /** Path to external skills directory */
    externalSkillsPath: string;

    /** Maximum skills to inject per query */
    maxSkillsPerQuery: number;

    /** Enable vector-based skill search? */
    enableVectorSearch: boolean;

    /** Enable usage-based learning? */
    enableUsageTracking: boolean;

    /** Cache size (LRU) */
    cacheSize: number;

    /** Security validation level */
    validationLevel: 'strict' | 'moderate' | 'permissive';
}

/**
 * Skill discovery result
 */
export interface SkillDiscoveryResult {
    /** Discovered skills */
    skills: AgentSkill[];

    /** Discovery errors */
    errors: Array<{ path: string; error: string }>;

    /** Discovery duration (ms) */
    duration: number;

    /** Number of builtin skills */
    builtinCount: number;

    /** Number of external skills */
    externalCount: number;
}
