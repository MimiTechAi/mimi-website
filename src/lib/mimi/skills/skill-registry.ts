/**
 * MIMI Agent - Skill Registry (Core Brain)
 * 
 * Central registry for agent skills with:
 * - Lazy loading & LRU cache
 * - Capability-based indexing
 * - Smart skill matching
 * - Vector-based skill search
 * - Security validation
 * 
 * Team: Nina + Elena (Core Infrastructure)
 *       Marcus + Yuki (Orchestrator + Vector Integration)
 */

import { parseSkillMD, validateSkillSecurity } from './skill-parser';
import type {
    AgentSkill,
    SkillMetadata,
    SkillMatch,
    SkillInjectionContext,
    SkillRegistryConfig,
    SkillDiscoveryResult,
    SkillUsageStats
} from './skill-types';

/**
 * Default configuration
 */
const DEFAULT_CONFIG: SkillRegistryConfig = {
    enableBuiltin: true,
    enableExternal: true,
    externalSkillsPath: '.agent/skills',
    maxSkillsPerQuery: 3,
    enableVectorSearch: true,
    enableUsageTracking: true,
    cacheSize: 50,
    validationLevel: 'moderate'
};

/**
 * LRU Cache for skills
 */
class LRUCache<K, V> {
    private cache = new Map<K, V>();
    private maxSize: number;

    constructor(maxSize: number) {
        this.maxSize = maxSize;
    }

    get(key: K): V | undefined {
        const value = this.cache.get(key);
        if (value !== undefined) {
            // Move to end (most recently used)
            if (this.cache.delete(key)) {
                this.cache.set(key, value);
            }
        }
        return value;
    }

    set(key: K, value: V): void {
        // Remove if exists (to update position)
        this.cache.delete(key);

        // Evict oldest if at capacity
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }

        this.cache.set(key, value);
    }

    has(key: K): boolean {
        return this.cache.has(key);
    }

    clear(): void {
        this.cache.clear();
    }

    get size(): number {
        return this.cache.size;
    }
}

/**
 * Skill Registry - Central brain for skill management
 */
export class SkillRegistry {
    private config: SkillRegistryConfig;
    private skillCache: LRUCache<string, AgentSkill>;
    private capabilityIndex: Map<string, Set<string>>; // capability -> skill IDs
    private usageStats: Map<string, SkillUsageStats>;
    private isInitialized = false;
    private builtinSkillsPath: string;
    private skillContentCache: Map<string, string> = new Map(); // NEW: Cache raw .skill.md content
    private loadedSkills: AgentSkill[] = []; // Track all loaded skills for getAllSkills()

    constructor(config: Partial<SkillRegistryConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.skillCache = new LRUCache(this.config.cacheSize);
        this.capabilityIndex = new Map();
        this.usageStats = new Map();

        // Determine builtin skills path (relative to this file)
        this.builtinSkillsPath = './builtin';

        // Preload builtin skill content (async but non-blocking)
        this.preloadBuiltinSkills().catch(err => {
            console.error('[SkillRegistry] Failed to preload skills:', err);
        });
    }

    /**
     * Preload builtin skills using direct imports (Next.js/Webpack compatible)
     * This runs at module load time and works with Next.js bundler
     */
    private async preloadBuiltinSkills(): Promise<void> {
        if (typeof window === 'undefined') return; // SSR guard

        try {
            // Dynamic import to avoid SSR issues - use direct imports from builtin/index.ts
            const { BUILTIN_SKILLS_CONTENT } = await import('./builtin');

            for (const [skillName, content] of Object.entries(BUILTIN_SKILLS_CONTENT)) {
                this.skillContentCache.set(skillName, content);
            }

            console.log(`[SkillRegistry] Preloaded ${this.skillContentCache.size} builtin skills`);
        } catch (error) {
            console.warn('[SkillRegistry] Failed to preload skills:', error);
        }
    }

    /**
     * Initialize registry - discover and index skills
     */
    async initialize(): Promise<SkillDiscoveryResult> {
        const startTime = Date.now();
        const discoveredSkills: AgentSkill[] = [];
        const errors: Array<{ path: string; error: string }> = [];

        let builtinCount = 0;
        let externalCount = 0;

        // Discover builtin skills
        if (this.config.enableBuiltin) {
            try {
                const builtin = await this.discoverBuiltinSkills();
                discoveredSkills.push(...builtin);
                builtinCount = builtin.length;
            } catch (error) {
                errors.push({
                    path: this.builtinSkillsPath,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }

        // Discover external skills
        if (this.config.enableExternal) {
            try {
                const external = await this.discoverExternalSkills();
                discoveredSkills.push(...external);
                externalCount = external.length;
            } catch (error) {
                errors.push({
                    path: this.config.externalSkillsPath,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }

        // Build capability index
        this.buildCapabilityIndex(discoveredSkills);

        // Cache all discovered skills
        for (const skill of discoveredSkills) {
            this.skillCache.set(skill.metadata.name, skill);
        }

        this.isInitialized = true;

        const duration = Date.now() - startTime;

        console.log(`[SkillRegistry] Initialized in ${duration}ms: ${builtinCount} builtin, ${externalCount} external`);

        return {
            skills: discoveredSkills,
            errors,
            duration,
            builtinCount,
            externalCount
        };
    }

    /**
     * Discover builtin skills from src/lib/mimi/skills/builtin/
     */
    private async discoverBuiltinSkills(): Promise<AgentSkill[]> {
        const skills: AgentSkill[] = [];

        // Iterate through preloaded skills
        for (const [skillName, content] of this.skillContentCache.entries()) {
            try {
                const skillPath = `${this.builtinSkillsPath}/${skillName}.skill.md`;
                const { metadata, instructions } = parseSkillMD(content, skillPath);

                // Validate security
                const validation = validateSkillSecurity(instructions, metadata);
                if (!validation.valid && this.config.validationLevel === 'strict') {
                    console.warn(`[SkillRegistry] Skipping builtin skill ${skillName}: ${validation.securityRisks.join(', ')}`);
                    continue;
                }

                if (validation.warnings.length > 0 && this.config.validationLevel !== 'permissive') {
                    console.warn(`[SkillRegistry] Warnings for skill ${skillName}:`, validation.warnings);
                }

                skills.push({
                    metadata,
                    instructions,
                    sourcePath: skillPath,
                    type: 'builtin',
                    loadedAt: new Date()
                });

                // Note: skills are tracked via the returned array, which gets
                // assigned to this.loadedSkills in initialize() — no duplicate push needed

                // Skill loaded successfully (logged once at initialize summary)
            } catch (error) {
                console.error(`[SkillRegistry] ❌ Failed to load builtin skill ${skillName}:`, error);
            }
        }

        return skills;
    }

    /**
     * Discover external skills from .agent/skills/
     */
    private async discoverExternalSkills(): Promise<AgentSkill[]> {
        // Browser can't read filesystem directly
        // External skills need to be loaded via API or preloaded
        // For now, return empty array
        // TODO: Implement API endpoint to list external skills

        // External skills require API endpoint (not yet implemented)
        // No log to avoid console noise
        return [];
    }

    /**
     * Build capability index for fast lookup
     */
    private buildCapabilityIndex(skills: AgentSkill[]): void {
        this.capabilityIndex.clear();

        for (const skill of skills) {
            for (const capability of skill.metadata.capabilities) {
                const normalized = capability.toLowerCase();
                if (!this.capabilityIndex.has(normalized)) {
                    this.capabilityIndex.set(normalized, new Set());
                }
                this.capabilityIndex.get(normalized)!.add(skill.metadata.name);
            }
        }
    }

    /**
     * Get skill by ID
     */
    getSkill(skillId: string): AgentSkill | undefined {
        return this.skillCache.get(skillId);
    }

    /**
     * Find relevant skills for query
     */
    async findRelevantSkills(context: SkillInjectionContext): Promise<SkillMatch[]> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const matches: SkillMatch[] = [];

        // Strategy 1: Capability-based matching
        const capabilityMatches = this.matchByCapabilities(context.query);
        matches.push(...capabilityMatches);

        // Strategy 2: Vector-based matching (if enabled and vector store available)
        if (this.config.enableVectorSearch) {
            try {
                const { getVectorStore } = await import('../vector-store');
                const vectorStore = getVectorStore();

                if (vectorStore.ready) {
                    const vectorMatches = await this.matchByVectorSearch(context.query);
                    matches.push(...vectorMatches);
                }
            } catch (error) {
                // Vector store not available
            }
        }

        // Strategy 3: Usage history (if enabled)
        if (this.config.enableUsageTracking && context.recentlyUsedSkills) {
            const historyMatches = this.matchByHistory(context);
            matches.push(...historyMatches);
        }

        // Strategy 4: Agent preference (if agent ID provided)
        if (context.agentId) {
            const agentMatches = this.matchByAgentPreference(context.agentId);
            matches.push(...agentMatches);
        }

        // Deduplicate and sort by confidence
        const uniqueMatches = this.deduplicateMatches(matches);
        uniqueMatches.sort((a, b) => b.confidence - a.confidence);

        // Limit to maxSkillsPerQuery
        return uniqueMatches.slice(0, this.config.maxSkillsPerQuery);
    }

    /**
     * Match skills by capabilities (keyword matching)
     */
    private matchByCapabilities(query: string): SkillMatch[] {
        const matches: SkillMatch[] = [];
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\s+/);

        // Check each capability in index
        for (const [capability, skillIds] of this.capabilityIndex.entries()) {
            // Simple word matching
            const matchedWords = queryWords.filter(word =>
                capability.includes(word) || word.includes(capability)
            );

            if (matchedWords.length > 0) {
                const confidence = matchedWords.length / queryWords.length;

                for (const skillId of skillIds) {
                    const skill = this.skillCache.get(skillId);
                    if (skill && skill.metadata.enabled !== false) {
                        matches.push({
                            skill,
                            confidence,
                            reason: 'capability',
                            matchedCapabilities: [capability]
                        });
                    }
                }
            }
        }

        return matches;
    }

    /**
     * Match skills by vector search (Dr. Yuki Tanaka's RAG approach)
     */
    private async matchByVectorSearch(query: string): Promise<SkillMatch[]> {
        // This will be implemented when vector store integration is complete
        // For now, return empty array
        return [];
    }

    /**
     * Match by usage history
     */
    private matchByHistory(context: SkillInjectionContext): SkillMatch[] {
        const matches: SkillMatch[] = [];

        if (!context.recentlyUsedSkills || context.recentlyUsedSkills.length === 0) {
            return matches;
        }

        // Boost recently used skills
        for (const skillId of context.recentlyUsedSkills) {
            const skill = this.skillCache.get(skillId);
            const stats = this.usageStats.get(skillId);

            if (skill && stats && skill.metadata.enabled !== false) {
                // Higher confidence for frequently successful skills
                const confidence = 0.5 + (stats.averageSuccessRate * 0.3) + (stats.userPreference * 0.2);

                matches.push({
                    skill,
                    confidence: Math.min(confidence, 1.0),
                    reason: 'usage-history'
                });
            }
        }

        return matches;
    }

    /**
     * Match by agent preference (Marcus Rodriguez's specialization approach)
     */
    private matchByAgentPreference(agentId: string): SkillMatch[] {
        const matches: SkillMatch[] = [];

        // Agent-to-skill mapping
        const agentPreferences: Record<string, string[]> = {
            'data-analyst': ['python_analysis', 'data-analysis', 'statistics', 'visualization'],
            'code-expert': ['python_analysis', 'code-generation', 'debugging', 'refactoring'],
            'document-expert': ['document-creation', 'writing'],
            'creative-writer': ['document-creation', 'writing'],
            'research-agent': ['research', 'web-search', 'fact-check'],
            'business-analyst': ['business_analysis', 'python_analysis'],
            'security-agent': ['security_audit'],
            'translation-agent': ['translation'],
            'design-agent': ['ui_design'],
            'general': [] // No specific preferences
        };

        const preferredSkills = agentPreferences[agentId] || [];

        for (const skillId of preferredSkills) {
            const skill = this.skillCache.get(skillId);
            if (skill && skill.metadata.enabled !== false) {
                matches.push({
                    skill,
                    confidence: 0.7, // High confidence for agent-preferred skills
                    reason: 'agent-preference'
                });
            }
        }

        return matches;
    }

    /**
     * Deduplicate matches (same skill from different strategies)
     */
    private deduplicateMatches(matches: SkillMatch[]): SkillMatch[] {
        const bestMatches = new Map<string, SkillMatch>();

        for (const match of matches) {
            const skillId = match.skill.metadata.name;
            const existing = bestMatches.get(skillId);

            if (!existing || match.confidence > existing.confidence) {
                bestMatches.set(skillId, match);
            }
        }

        return Array.from(bestMatches.values());
    }

    /**
     * Inject skills into system prompt
     */
    injectSkillsToPrompt(skills: AgentSkill[]): string {
        if (skills.length === 0) return '';

        let prompt = '\n\n## 🛠️ AVAILABLE SKILLS\n\n';
        prompt += 'You have access to the following specialized skills. Use them when relevant:\n\n';

        for (const skill of skills) {
            prompt += `### ${skill.metadata.name}\n`;
            prompt += `**Description:** ${skill.metadata.description}\n`;
            prompt += `**Capabilities:** ${skill.metadata.capabilities.join(', ')}\n\n`;

            // Inject instructions
            prompt += skill.instructions + '\n\n';
            prompt += '---\n\n';
        }

        return prompt;
    }

    /**
     * Record skill usage for learning
     */
    recordUsage(skillId: string, success: boolean, responseTime?: number): void {
        if (!this.config.enableUsageTracking) return;

        let stats = this.usageStats.get(skillId);

        if (!stats) {
            stats = {
                skillId,
                timesUsed: 0,
                lastUsed: new Date(),
                averageSuccessRate: 0,
                userPreference: 0
            };
            this.usageStats.set(skillId, stats);
        }

        // Update stats
        stats.timesUsed++;
        stats.lastUsed = new Date();

        // Update success rate (exponential moving average)
        const alpha = 0.2; // Weight for new observation
        stats.averageSuccessRate = alpha * (success ? 1 : 0) + (1 - alpha) * stats.averageSuccessRate;

        if (responseTime !== undefined) {
            if (stats.averageResponseTime === undefined) {
                stats.averageResponseTime = responseTime;
            } else {
                stats.averageResponseTime = alpha * responseTime + (1 - alpha) * stats.averageResponseTime;
            }
        }
    }

    /**
     * Update user preference for skill (thumbs up/down)
     */
    updateUserPreference(skillId: string, delta: number): void {
        const stats = this.usageStats.get(skillId);
        if (stats) {
            stats.userPreference = Math.max(-1, Math.min(1, stats.userPreference + delta));
        }
    }

    /**
     * Get all cached skills
     */
    getAllSkills(): AgentSkill[] {
        // Return copy to prevent external mutations
        return [...this.loadedSkills];
    }

    /**
     * Clear cache and reset
     */
    reset(): void {
        this.skillCache.clear();
        this.capabilityIndex.clear();
        this.usageStats.clear();
        this.loadedSkills = []; // Clear loaded skills tracking
        this.isInitialized = false;
    }

    /**
     * Check if initialized
     */
    ready(): boolean {
        return this.isInitialized;
    }
}

// Singleton instance
let registryInstance: SkillRegistry | null = null;

/**
 * Get global skill registry instance
 */
export function getSkillRegistry(): SkillRegistry {
    if (!registryInstance) {
        registryInstance = new SkillRegistry();
    }
    return registryInstance;
}
