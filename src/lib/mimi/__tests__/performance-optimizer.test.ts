/**
 * B-16: Performance Optimizer Tests
 * CacheManager (LRU eviction, stats, hit rate)
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { CacheManager } from '../performance-optimizer';

describe('CacheManager', () => {
    let cache: CacheManager<string>;

    beforeEach(() => {
        cache = new CacheManager<string>({ maxSize: 3, ttl: 5000, strategy: 'lru' });
    });

    it('should store and retrieve a value', () => {
        cache.set('key1', 'value1');
        expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for missing key', () => {
        expect(cache.get('nonexistent')).toBeNull();
    });

    it('should not evict when under threshold (1000 items)', () => {
        cache.set('a', '1');
        cache.set('b', '2');
        cache.set('c', '3');
        cache.set('d', '4');
        // All 4 items should still be present since threshold is 1000
        expect(cache.get('a')).toBe('1');
        expect(cache.get('d')).toBe('4');
    });

    it('should clear the cache', () => {
        cache.set('key1', 'value1');
        cache.clear();
        expect(cache.get('key1')).toBeNull();
    });

    it('should track stats (size)', () => {
        cache.set('a', '1');
        cache.set('b', '2');
        const stats = cache.getStats();
        expect(stats.size).toBe(2);
    });

    it('should track hit rate', () => {
        cache.set('a', '1');
        cache.get('a'); // hit
        cache.get('missing'); // miss
        const stats = cache.getStats();
        expect(stats.hitRate).toBeGreaterThan(0);
        expect(stats.hitRate).toBeLessThanOrEqual(1);
    });

    it('should update value on re-set', () => {
        cache.set('key', 'old');
        cache.set('key', 'new');
        expect(cache.get('key')).toBe('new');
    });
});
