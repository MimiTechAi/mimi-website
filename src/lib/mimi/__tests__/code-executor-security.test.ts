/**
 * MIMI Agent — Code Executor Security Tests (B-01)
 * TDD Phase 1: RED → GREEN
 *
 * Tests calculate() against injection attacks.
 * The function delegates to Pyodide, so any alpha-char bypass
 * could execute arbitrary Python in the browser.
 */

import { describe, it, expect } from '@jest/globals'

// We test the sanitizer logic directly (calculate calls executePython which needs Pyodide).
// So we import the validator function separately.
import { isExpressionSafe } from '../code-executor'

describe('B-01: calculate() Injection Prevention', () => {
    describe('should REJECT dangerous expressions', () => {
        it('rejects __import__ injection', () => {
            expect(isExpressionSafe("__import__('os').system('ls')")).toBe(false)
        })

        it('rejects exec()', () => {
            expect(isExpressionSafe("exec('print(1)')")).toBe(false)
        })

        it('rejects eval()', () => {
            expect(isExpressionSafe("eval('2+2')")).toBe(false)
        })

        it('rejects open()', () => {
            expect(isExpressionSafe("open('/etc/passwd')")).toBe(false)
        })

        it('rejects import statement', () => {
            expect(isExpressionSafe("import os; os.system('ls')")).toBe(false)
        })

        it('rejects system()', () => {
            expect(isExpressionSafe("system('rm -rf /')")).toBe(false)
        })

        it('rejects compile()', () => {
            expect(isExpressionSafe("compile('print(1)', '', 'exec')")).toBe(false)
        })

        it('rejects getattr()', () => {
            expect(isExpressionSafe("getattr(object, '__class__')")).toBe(false)
        })

        it('rejects dunder access (__)', () => {
            expect(isExpressionSafe("''.__class__.__mro__")).toBe(false)
        })

        it('rejects expressions over 200 chars', () => {
            const longExpr = '1 + '.repeat(60) + '1'
            expect(isExpressionSafe(longExpr)).toBe(false)
        })

        it('rejects empty expression', () => {
            expect(isExpressionSafe('')).toBe(false)
        })

        it('rejects whitespace-only expression', () => {
            expect(isExpressionSafe('   ')).toBe(false)
        })
    })

    describe('should ALLOW safe math expressions', () => {
        it('allows basic arithmetic', () => {
            expect(isExpressionSafe('2 + 3 * 4')).toBe(true)
        })

        it('allows parentheses', () => {
            expect(isExpressionSafe('(2 + 3) * 4')).toBe(true)
        })

        it('allows decimals', () => {
            expect(isExpressionSafe('3.14 * 2.0')).toBe(true)
        })

        it('allows power operator', () => {
            expect(isExpressionSafe('2 ** 10')).toBe(true)
        })

        it('allows modulo', () => {
            expect(isExpressionSafe('17 % 5')).toBe(true)
        })

        it('allows negative numbers', () => {
            expect(isExpressionSafe('-5 + 3')).toBe(true)
        })

        it('allows math.sqrt', () => {
            expect(isExpressionSafe('math.sqrt(16)')).toBe(true)
        })

        it('allows math.sin', () => {
            expect(isExpressionSafe('math.sin(3.14)')).toBe(true)
        })

        it('allows math.cos', () => {
            expect(isExpressionSafe('math.cos(0)')).toBe(true)
        })

        it('allows math.tan', () => {
            expect(isExpressionSafe('math.tan(1)')).toBe(true)
        })

        it('allows math.log', () => {
            expect(isExpressionSafe('math.log(100)')).toBe(true)
        })

        it('allows math.exp', () => {
            expect(isExpressionSafe('math.exp(1)')).toBe(true)
        })

        it('allows math.pi', () => {
            expect(isExpressionSafe('2 * math.pi')).toBe(true)
        })

        it('allows math.e', () => {
            expect(isExpressionSafe('math.e ** 2')).toBe(true)
        })

        it('allows abs()', () => {
            expect(isExpressionSafe('abs(-5)')).toBe(true)
        })

        it('allows round()', () => {
            expect(isExpressionSafe('round(3.14159, 2)')).toBe(true)
        })

        it('allows math.ceil', () => {
            expect(isExpressionSafe('math.ceil(4.1)')).toBe(true)
        })

        it('allows math.floor', () => {
            expect(isExpressionSafe('math.floor(4.9)')).toBe(true)
        })

        it('allows np.pi', () => {
            expect(isExpressionSafe('np.pi * 2')).toBe(true)
        })

        it('allows np.sqrt', () => {
            expect(isExpressionSafe('np.sqrt(25)')).toBe(true)
        })

        it('allows complex safe expression', () => {
            expect(isExpressionSafe('math.sqrt(abs(-16)) + round(math.pi, 2)')).toBe(true)
        })
    })
})
