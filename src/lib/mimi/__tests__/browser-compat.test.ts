/**
 * B-17: Browser Compatibility Tests
 * Feature detection, German error messages, mobile detection
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { checkBrowserCompatibility, getBrowserInfo, isMobile, getRecommendedBrowserMessage } from '../browser-compat';

// ───────────────────────────────────────────────────────────
// checkBrowserCompatibility
// ───────────────────────────────────────────────────────────
describe('checkBrowserCompatibility', () => {
    it('should return a compatibility report', () => {
        const report = checkBrowserCompatibility();
        expect(report).toHaveProperty('compatible');
        expect(report).toHaveProperty('capabilities');
        expect(report).toHaveProperty('warnings');
        expect(report).toHaveProperty('blockers');
    });

    it('should detect WebGPU capability as a boolean', () => {
        const report = checkBrowserCompatibility();
        expect(typeof report.capabilities.webgpu).toBe('boolean');
    });

    it('should have German error messages', () => {
        const report = checkBrowserCompatibility();
        // At least one message should be in German
        const allMessages = [...report.blockers, ...report.warnings];
        const hasGerman = allMessages.some(m =>
            m.includes('nicht verfügbar') || m.includes('nicht möglich') || m.includes('deaktiviert')
        );
        expect(hasGerman).toBe(true);
    });

    it('should report capabilities as booleans', () => {
        const report = checkBrowserCompatibility();
        const caps = report.capabilities;
        expect(typeof caps.webgpu).toBe('boolean');
        expect(typeof caps.webworker).toBe('boolean');
        expect(typeof caps.indexeddb).toBe('boolean');
    });
});

// ───────────────────────────────────────────────────────────
// getBrowserInfo
// ───────────────────────────────────────────────────────────
describe('getBrowserInfo', () => {
    it('should return browser name and version', () => {
        const info = getBrowserInfo();
        expect(info).toHaveProperty('name');
        expect(info).toHaveProperty('version');
        expect(typeof info.name).toBe('string');
        expect(typeof info.version).toBe('string');
    });
});

// ───────────────────────────────────────────────────────────
// isMobile
// ───────────────────────────────────────────────────────────
describe('isMobile', () => {
    it('should return a boolean', () => {
        expect(typeof isMobile()).toBe('boolean');
    });

    it('should return false in JSDOM (desktop UA)', () => {
        // JSDOM default UA is not mobile
        expect(isMobile()).toBe(false);
    });
});

// ───────────────────────────────────────────────────────────
// getRecommendedBrowserMessage
// ───────────────────────────────────────────────────────────
describe('getRecommendedBrowserMessage', () => {
    it('should return a recommendation string', () => {
        const msg = getRecommendedBrowserMessage();
        expect(typeof msg).toBe('string');
        expect(msg.length).toBeGreaterThan(0);
    });

    it('should mention Chrome or Edge', () => {
        const msg = getRecommendedBrowserMessage();
        expect(msg).toMatch(/Chrome|Edge/);
    });
});
