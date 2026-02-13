/**
 * Deep Research Engine Tests - Q2 2026
 *
 * Tests for multi-source scraping, consensus detection, and research reporting.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
    DeepResearchEngine,
    ConsensusDetector,
    BraveSearchScraper,
    WikipediaScraper,
    ArxivScraper,
    DuckDuckGoScraper,
    getDeepResearchEngine,
    type ResearchSource,
    type ConsensusGroup
} from '../deep-research';

describe('DeepResearchEngine', () => {
    let engine: DeepResearchEngine;

    beforeEach(() => {
        engine = new DeepResearchEngine();
    });

    describe('Multi-Source Scraping', () => {
        it('should scrape from multiple sources in parallel', async () => {
            const report = await engine.research('artificial intelligence', []);

            expect(report.sources.length).toBeGreaterThan(0);
            expect(report.sources.length).toBeLessThanOrEqual(50);
            expect(report.totalSources).toBe(report.sources.length);
        }, 10000); // 10s timeout for actual scraping

        it('should include diverse source types', async () => {
            const report = await engine.research('machine learning', []);

            const sourceTypes = new Set(report.sources.map(s => s.sourceType));
            expect(sourceTypes.size).toBeGreaterThan(1); // At least 2 different types
        });

        it('should filter sources by credibility threshold', async () => {
            const report = await engine.research('test query', []);

            const allHighCredibility = report.sources.every(s => s.credibility >= 0.5);
            expect(allHighCredibility).toBe(true);
        });

        it('should sort sources by credibility (highest first)', async () => {
            const report = await engine.research('quantum computing', []);

            for (let i = 1; i < report.sources.length; i++) {
                expect(report.sources[i - 1].credibility).toBeGreaterThanOrEqual(
                    report.sources[i].credibility
                );
            }
        });
    });

    describe('Consensus Detection', () => {
        it('should categorize claims as consensus (70%+ agreement)', async () => {
            const report = await engine.research('climate change', []);

            const consensusGroups = report.consensusGroups.filter(g => g.category === 'consensus');
            consensusGroups.forEach(group => {
                expect(group.agreement).toBeGreaterThanOrEqual(0.7);
            });
        });

        it('should categorize claims as disputed (30-70% agreement)', async () => {
            const report = await engine.research('controversial topic', []);

            const disputedGroups = report.consensusGroups.filter(g => g.category === 'disputed');
            disputedGroups.forEach(group => {
                expect(group.agreement).toBeGreaterThanOrEqual(0.3);
                expect(group.agreement).toBeLessThan(0.7);
            });
        });

        it('should categorize claims as uncertain (<30% agreement)', async () => {
            const report = await engine.research('niche research topic', []);

            const uncertainGroups = report.consensusGroups.filter(g => g.category === 'uncertain');
            uncertainGroups.forEach(group => {
                expect(group.agreement).toBeLessThan(0.3);
            });
        });

        it('should calculate overall consensus score', async () => {
            const report = await engine.research('well-researched topic', []);

            expect(report.consensusScore).toBeGreaterThanOrEqual(0);
            expect(report.consensusScore).toBeLessThanOrEqual(1);
        });
    });

    describe('Research Report Generation', () => {
        it('should generate summary with consensus/disputed/uncertain sections', async () => {
            const report = await engine.research('neural networks', []);

            expect(report.summary).toContain('Research Summary');
            expect(report.summary).toContain(report.query);

            // Summary should mention categories if they exist
            if (report.consensusGroups.some(g => g.category === 'consensus')) {
                expect(report.summary).toContain('Consensus');
            }
        });

        it('should include timestamp and source count', async () => {
            const beforeTime = Date.now();
            const report = await engine.research('test', []);
            const afterTime = Date.now();

            expect(report.timestamp).toBeGreaterThanOrEqual(beforeTime);
            expect(report.timestamp).toBeLessThanOrEqual(afterTime);
            expect(report.totalSources).toBeGreaterThan(0);
        });

        it('should complete research in reasonable time', async () => {
            const startTime = Date.now();
            await engine.research('quick test', []);
            const duration = Date.now() - startTime;

            expect(duration).toBeLessThan(30000); // <30s
        }, 35000);
    });
});

describe('Individual Scrapers', () => {
    describe('BraveSearchScraper', () => {
        it('should scrape search results', async () => {
            const scraper = new BraveSearchScraper();
            const results = await scraper.scrape('test query', 5);

            expect(results.length).toBeGreaterThan(0);
            expect(results.length).toBeLessThanOrEqual(5);
            expect(results[0].sourceType).toBe('search');
        });

        it('should return high-credibility results', async () => {
            const scraper = new BraveSearchScraper();
            const results = await scraper.scrape('test', 3);

            results.forEach(result => {
                expect(result.credibility).toBeGreaterThanOrEqual(0.7);
                expect(result.credibility).toBeLessThanOrEqual(1.0);
            });
        });
    });

    describe('WikipediaScraper', () => {
        it('should scrape Wikipedia articles', async () => {
            const scraper = new WikipediaScraper();
            const results = await scraper.scrape('physics', 3);

            expect(results.length).toBeGreaterThan(0);
            expect(results[0].sourceType).toBe('wiki');
            expect(results[0].credibility).toBe(0.85); // Wikipedia high credibility
        });
    });

    describe('ArxivScraper', () => {
        it('should scrape academic papers', async () => {
            const scraper = new ArxivScraper();
            const results = await scraper.scrape('machine learning', 5);

            expect(results.length).toBeGreaterThan(0);
            expect(results[0].sourceType).toBe('arxiv');
            expect(results[0].credibility).toBe(0.9); // Academic high credibility
        });
    });

    describe('DuckDuckGoScraper', () => {
        it('should scrape search results as fallback', async () => {
            const scraper = new DuckDuckGoScraper();
            const results = await scraper.scrape('fallback test', 10);

            expect(results.length).toBeGreaterThan(0);
            expect(results[0].sourceType).toBe('search');
        });
    });
});

describe('ConsensusDetector', () => {
    let detector: ConsensusDetector;
    let mockSources: ResearchSource[];

    beforeEach(() => {
        detector = new ConsensusDetector();
        mockSources = [
            {
                id: '1',
                url: 'https://example.com/1',
                title: 'Source 1',
                snippet: 'AI is transforming industries',
                content: 'Artificial intelligence is rapidly transforming various industries including healthcare and finance.',
                timestamp: Date.now(),
                credibility: 0.9,
                sourceType: 'wiki'
            },
            {
                id: '2',
                url: 'https://example.com/2',
                title: 'Source 2',
                snippet: 'AI transforming healthcare',
                content: 'AI is transforming healthcare with diagnostic tools.',
                timestamp: Date.now(),
                credibility: 0.8,
                sourceType: 'arxiv'
            },
            {
                id: '3',
                url: 'https://example.com/3',
                title: 'Source 3',
                snippet: 'Different topic',
                content: 'This is about something completely different.',
                timestamp: Date.now(),
                credibility: 0.7,
                sourceType: 'search'
            }
        ];
    });

    it('should extract claims from sources', async () => {
        const groups = await detector.detectConsensus(mockSources);

        expect(groups.length).toBeGreaterThan(0);
        groups.forEach(group => {
            expect(group.claims.length).toBeGreaterThan(0);
        });
    });

    it('should group similar claims together', async () => {
        const groups = await detector.detectConsensus(mockSources);

        // Sources 1 and 2 mention "AI transforming" - should be grouped
        const aiGroup = groups.find(g =>
            g.claims.some(c => c.claim.toLowerCase().includes('transform'))
        );

        expect(aiGroup).toBeDefined();
        if (aiGroup) {
            expect(aiGroup.claims.length).toBeGreaterThan(1);
        }
    });

    it('should calculate agreement percentage correctly', async () => {
        const groups = await detector.detectConsensus(mockSources);

        groups.forEach(group => {
            expect(group.agreement).toBeGreaterThanOrEqual(0);
            expect(group.agreement).toBeLessThanOrEqual(1);
        });
    });

    it('should assign correct category based on agreement', async () => {
        const groups = await detector.detectConsensus(mockSources);

        groups.forEach(group => {
            if (group.agreement >= 0.7) {
                expect(group.category).toBe('consensus');
            } else if (group.agreement >= 0.3) {
                expect(group.category).toBe('disputed');
            } else {
                expect(group.category).toBe('uncertain');
            }
        });
    });
});

describe('Singleton', () => {
    it('should return same instance', () => {
        const engine1 = getDeepResearchEngine();
        const engine2 = getDeepResearchEngine();

        expect(engine1).toBe(engine2);
    });
});
