/**
 * MIMI Agent — Tool Definitions Security Tests (B-03)
 * TDD Phase 1: Prototype Pollution Guard
 */

import { describe, it, expect } from '@jest/globals'
import { parseToolCalls, stripDangerousKeys } from '../tool-definitions'

describe('B-03: Prototype Pollution Guard', () => {
    describe('stripDangerousKeys()', () => {
        it('should strip __proto__ from JSON-parsed object', () => {
            // Simulate JSON.parse which can have __proto__ as an own key
            const input = JSON.parse('{"__proto__": {"isAdmin": true}, "name": "test"}')
            const result = stripDangerousKeys(input)
            expect(Object.keys(result)).not.toContain('__proto__')
            expect(result.name).toBe('test')
        })

        it('should strip constructor key from JSON-parsed object', () => {
            const input = JSON.parse('{"constructor": {"prototype": {}}, "name": "test"}')
            const result = stripDangerousKeys(input)
            expect(Object.keys(result)).not.toContain('constructor')
            expect(result.name).toBe('test')
        })

        it('should strip prototype key', () => {
            const input = JSON.parse('{"prototype": {"isAdmin": true}, "name": "test"}')
            const result = stripDangerousKeys(input)
            expect(Object.keys(result)).not.toContain('prototype')
        })

        it('should strip nested dangerous keys', () => {
            const input = JSON.parse('{"name":"test","data":{"__proto__":{"isAdmin":true},"value":42,"nested":{"constructor":{}}}}')
            const result = stripDangerousKeys(input)
            expect(Object.keys(result.data)).not.toContain('__proto__')
            expect(result.data.value).toBe(42)
            expect(Object.keys(result.data.nested)).not.toContain('constructor')
        })

        it('should handle arrays', () => {
            const input = JSON.parse('[{"__proto__":{"x":1},"name":"a"},{"name":"b"}]')
            const result = stripDangerousKeys(input)
            expect(Object.keys(result[0])).not.toContain('__proto__')
            expect(result[0].name).toBe('a')
            expect(result[1].name).toBe('b')
        })

        it('should pass through primitives unchanged', () => {
            expect(stripDangerousKeys('hello')).toBe('hello')
            expect(stripDangerousKeys(42)).toBe(42)
            expect(stripDangerousKeys(null)).toBeNull()
            expect(stripDangerousKeys(true)).toBe(true)
        })
    })

    describe('parseToolCalls() rejects polluted JSON', () => {
        it('should strip __proto__ from parsed tool parameters', () => {
            const text = '```json\n{"tool":"calculate","parameters":{"expression":"2+3","__proto__":{"isAdmin":true}}}\n```'
            const calls = parseToolCalls(text)
            expect(calls.length).toBe(1)
            expect(Object.keys(calls[0].parameters)).not.toContain('__proto__')
            expect(calls[0].parameters.expression).toBe('2+3')
        })

        it('should strip constructor from tool call root', () => {
            const text = '```json\n{"tool":"calculate","parameters":{"expression":"1+1"},"constructor":{"x":1}}\n```'
            const calls = parseToolCalls(text)
            expect(calls.length).toBe(1)
            expect(calls[0].parameters.expression).toBe('1+1')
        })
    })
})
