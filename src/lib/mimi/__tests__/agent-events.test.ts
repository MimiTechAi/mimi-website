/**
 * Agent Events — Unit Tests
 * Tests EventBus emit, subscribe, batching, snapshot, and singleton
 * 
 * © 2026 MIMI Tech AI
 */

import { AgentEventBus, getAgentEventBus, AgentEvents, type AgentEvent, type AgentEventType } from '../agent-events';

// Mock requestAnimationFrame / cancelAnimationFrame for Node
beforeAll(() => {
    (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0) as unknown as number;
    (global as any).cancelAnimationFrame = (id: number) => clearTimeout(id);
});

describe('AgentEventBus', () => {
    let bus: AgentEventBus;

    beforeEach(() => {
        bus = new AgentEventBus();
    });

    afterEach(() => {
        bus.reset();
        bus.removeAllListeners();
    });

    // ── Subscribe & Emit ──────────────────────────────────

    test('should subscribe to specific event type and receive events', (done) => {
        bus.on('TOOL_CALL_START', (event: AgentEvent) => {
            expect(event.type).toBe('TOOL_CALL_START');
            expect(event.payload).toEqual({ toolName: 'execute_python', parameters: { code: 'print(1)' } });
            done();
        });

        bus.emitImmediate('TOOL_CALL_START', { toolName: 'execute_python', parameters: { code: 'print(1)' } });
    });

    test('should support global handlers (onAny)', (done) => {
        bus.onAll((event: AgentEvent) => {
            expect(event.type).toBe('STATUS_CHANGE');
            done();
        });

        bus.emitImmediate('STATUS_CHANGE', { status: 'thinking', agent: 'general' });
    });

    test('should unsubscribe via returned cleanup function', () => {
        const handler = jest.fn();
        const unsub = bus.on('TEXT_DELTA', handler);

        bus.emitImmediate('TEXT_DELTA', { text: 'hello' });
        expect(handler).toHaveBeenCalledTimes(1);

        unsub();
        bus.emitImmediate('TEXT_DELTA', { text: 'world' });
        expect(handler).toHaveBeenCalledTimes(1); // Still 1
    });

    // ── Snapshot ──────────────────────────────────────────

    test('should maintain snapshot of emitted events', () => {
        bus.emitImmediate('THINKING_START', {});
        bus.emitImmediate('THINKING_END', {});

        const snapshot = bus.getSnapshot();
        expect(snapshot).toHaveLength(2);
        expect(snapshot[0].type).toBe('THINKING_START');
        expect(snapshot[1].type).toBe('THINKING_END');
    });

    test('getLatestByType returns only matching events', () => {
        bus.emitImmediate('TEXT_DELTA', { text: 'a' });
        bus.emitImmediate('STATUS_CHANGE', { status: 'idle' });
        bus.emitImmediate('TEXT_DELTA', { text: 'b' });

        const latest = bus.getLatestByType('TEXT_DELTA', 5);
        expect(latest).toHaveLength(2);
        expect((latest[0].payload as any).text).toBe('a');
        expect((latest[1].payload as any).text).toBe('b');
    });

    test('snapshot is capped at MAX_SNAPSHOT_SIZE', () => {
        for (let i = 0; i < 550; i++) {
            bus.emitImmediate('TEXT_DELTA', { text: `t${i}` });
        }
        // Default MAX_SNAPSHOT_SIZE is 500
        expect(bus.getSnapshot().length).toBeLessThanOrEqual(500);
    });

    // ── Reset ────────────────────────────────────────────

    test('reset clears snapshot and queue', () => {
        bus.emitImmediate('STATUS_CHANGE', { status: 'thinking' });
        expect(bus.getSnapshot().length).toBe(1);

        bus.reset();
        expect(bus.getSnapshot().length).toBe(0);
    });

    // ── Handler Count ────────────────────────────────────

    test('getHandlerCount returns accurate count', () => {
        expect(bus.getHandlerCount()).toBe(0);

        bus.on('TEXT_DELTA', () => { });
        bus.on('TEXT_DELTA', () => { });
        bus.onAll(() => { });

        expect(bus.getHandlerCount()).toBe(3);
    });

    // ── Error isolation ──────────────────────────────────

    test('handler errors do not crash other handlers', () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        const goodHandler = jest.fn();

        bus.on('TEXT_DELTA', () => { throw new Error('boom'); });
        bus.on('TEXT_DELTA', goodHandler);

        bus.emitImmediate('TEXT_DELTA', { text: 'test' });

        expect(goodHandler).toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalled();
        errorSpy.mockRestore();
    });

    // ── Batched emit ─────────────────────────────────────

    test('emit (batched) queues events and processes async', async () => {
        const handler = jest.fn();
        bus.on('TEXT_DELTA', handler);

        bus.emit('TEXT_DELTA', { text: 'batch1' });
        bus.emit('TEXT_DELTA', { text: 'batch2' });

        // Not dispatched synchronously
        expect(handler).not.toHaveBeenCalled();

        // Wait for rAF processing
        await new Promise(r => setTimeout(r, 50));
        expect(handler).toHaveBeenCalledTimes(2);
    });
});

// ── Singleton ────────────────────────────────────────────

describe('getAgentEventBus (singleton)', () => {
    test('returns the same instance', () => {
        const a = getAgentEventBus();
        const b = getAgentEventBus();
        expect(a).toBe(b);
    });
});

// ── AgentEvents helper ──────────────────────────────────

describe('AgentEvents helper', () => {
    beforeEach(() => {
        getAgentEventBus().reset();
        getAgentEventBus().removeAllListeners();
    });

    test('planStart emits PLAN_START with correct payload', () => {
        const handler = jest.fn();
        getAgentEventBus().on('PLAN_START', handler);

        AgentEvents.planStart('plan-1', 'Test Plan', 'Test goal', 3);

        expect(handler).toHaveBeenCalledWith(expect.objectContaining({
            type: 'PLAN_START',
            planId: 'plan-1',
            payload: { planId: 'plan-1', title: 'Test Plan', goal: 'Test goal', stepCount: 3 }
        }));
    });

    test('toolCallStart emits with stepId', () => {
        const handler = jest.fn();
        getAgentEventBus().on('TOOL_CALL_START', handler);

        AgentEvents.toolCallStart('execute_python', { code: 'x=1' }, 'step-42');

        expect(handler).toHaveBeenCalledWith(expect.objectContaining({
            type: 'TOOL_CALL_START',
            stepId: 'step-42',
            payload: { toolName: 'execute_python', parameters: { code: 'x=1' } }
        }));
    });

    test('toolCallEnd emits duration and status', () => {
        const handler = jest.fn();
        getAgentEventBus().on('TOOL_CALL_END', handler);

        AgentEvents.toolCallEnd('web_search', true, 'Found 3 results', 420, 'step-1');

        expect(handler).toHaveBeenCalledWith(expect.objectContaining({
            type: 'TOOL_CALL_END',
            payload: { toolName: 'web_search', success: true, output: 'Found 3 results', duration: 420 }
        }));
    });

    test('thinkingContent emits THINKING_CONTENT', async () => {
        const handler = jest.fn();
        getAgentEventBus().on('THINKING_CONTENT', handler);

        AgentEvents.thinkingContent('Let me analyze this...');

        await new Promise(r => setTimeout(r, 50)); // batched
        expect(handler).toHaveBeenCalledWith(expect.objectContaining({
            type: 'THINKING_CONTENT',
            payload: { text: 'Let me analyze this...' }
        }));
    });

    test('planComplete emits with stats', () => {
        const handler = jest.fn();
        getAgentEventBus().on('PLAN_COMPLETE', handler);

        AgentEvents.planComplete('plan-1', 5000, 4, 1);

        expect(handler).toHaveBeenCalledWith(expect.objectContaining({
            type: 'PLAN_COMPLETE',
            payload: { planId: 'plan-1', totalDuration: 5000, stepsCompleted: 4, stepsFailed: 1 }
        }));
    });

    test('fileWrite emits FILE_WRITE', async () => {
        const handler = jest.fn();
        getAgentEventBus().on('FILE_WRITE', handler);

        AgentEvents.fileWrite('/workspace/output.csv', 'create', 1024);

        await new Promise(r => setTimeout(r, 50)); // batched
        expect(handler).toHaveBeenCalledWith(expect.objectContaining({
            type: 'FILE_WRITE',
            payload: { path: '/workspace/output.csv', action: 'create', size: 1024 }
        }));
    });

    test('artifactCreate emits ARTIFACT_CREATE', () => {
        const handler = jest.fn();
        getAgentEventBus().on('ARTIFACT_CREATE', handler);

        AgentEvents.artifactCreate('chart.py', 'python', 'import matplotlib', 'code');

        expect(handler).toHaveBeenCalledWith(expect.objectContaining({
            type: 'ARTIFACT_CREATE',
            payload: { title: 'chart.py', language: 'python', content: 'import matplotlib', type: 'code' }
        }));
    });
});
