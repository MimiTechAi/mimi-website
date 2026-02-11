/**
 * MIMI Agent - Code Executor Auto-Fix Tests
 * 2026 Standards
 *
 * Testet die kritische Auto-Fix-Funktionalität für LLM-generierten Code
 */

import { describe, it, expect } from '@jest/globals'
import { autoFixCode } from '../code-executor'

describe('Code Executor - Auto-Fix Engine', () => {
  describe('np.pi Typo Corrections', () => {
    it('should fix np0.pi → np.pi', () => {
      const buggyCode = 'x = 2 * np0.pi'
      const fixed = autoFixCode(buggyCode)
      expect(fixed).toBe('x = 2 * np.pi')
    })

    it('should fix np0.sin → np.sin', () => {
      const buggyCode = 'y = np0.sin(x)'
      const fixed = autoFixCode(buggyCode)
      expect(fixed).toBe('y = np.sin(x)')
    })

    it('should fix np0.cos → np.cos', () => {
      const buggyCode = 'y = np0.cos(x)'
      const fixed = autoFixCode(buggyCode)
      expect(fixed).toBe('y = np.cos(x)')
    })

    it('should fix np0.linspace → np.linspace', () => {
      const buggyCode = 'x = np0.linspace(0, 10, 100)'
      const fixed = autoFixCode(buggyCode)
      expect(fixed).toBe('x = np.linspace(0, 10, 100)')
    })

    it('should fix standalone np0 → np.pi', () => {
      const buggyCode = 'x = 2 * np0'
      const fixed = autoFixCode(buggyCode)
      expect(fixed).toBe('x = 2 * np.pi')
    })

    it('should fix numpy0 → np.pi', () => {
      const buggyCode = 'x = numpy0'
      const fixed = autoFixCode(buggyCode)
      expect(fixed).toBe('x = np.pi')
    })

    it('should fix np.0 → np.pi', () => {
      const buggyCode = 'x = np.0'
      const fixed = autoFixCode(buggyCode)
      expect(fixed).toBe('x = np.pi')
    })

    it('should fix 0.pi → np.pi (missing np)', () => {
      const buggyCode = 'x = 2 * 0.pi'
      const fixed = autoFixCode(buggyCode)
      expect(fixed).toBe('x = 2 * np.pi')
    })

    it('should fix -2np.pi → -2*np.pi (missing operator)', () => {
      const buggyCode = 'x = -2np.pi'
      const fixed = autoFixCode(buggyCode)
      expect(fixed).toBe('x = -2*np.pi')
    })

    it('should fix 2np.pi → 2*np.pi (missing operator)', () => {
      const buggyCode = 'x = 2np.pi'
      const fixed = autoFixCode(buggyCode)
      expect(fixed).toBe('x = 2*np.pi')
    })
  })

  describe('plt (Matplotlib) Typo Corrections', () => {
    it('should fix plt0 → plt.show()', () => {
      const buggyCode = 'plt.plot(x, y)\nplt0'
      const fixed = autoFixCode(buggyCode)
      expect(fixed).toContain('plt.show()')
      expect(fixed).not.toContain('plt0')
    })

    it('should fix plt.0 → plt.show()', () => {
      const buggyCode = 'plt.plot(x, y)\nplt.0'
      const fixed = autoFixCode(buggyCode)
      expect(fixed).toContain('plt.show()')
      expect(fixed).not.toContain('plt.0')
    })

    it('should fix plten → plt.show()', () => {
      const buggyCode = 'plt.plot(x, y)\nplten'
      const fixed = autoFixCode(buggyCode)
      expect(fixed).toContain('plt.show()')
      expect(fixed).not.toContain('plten')
    })

    it('should fix plt egy.ylabel → plt.ylabel (garbage between plt and method)', () => {
      const buggyCode = 'plt egy.ylabel("Y")'
      const fixed = autoFixCode(buggyCode)
      expect(fixed).toBe('plt.ylabel("Y")')
    })

    it('should remove pltumi garbage', () => {
      const buggyCode = 'plt.plot(x, y)\npltumi'
      const fixed = autoFixCode(buggyCode)
      expect(fixed).not.toContain('pltumi')
    })

    it('should fix double plt.show()() → plt.show()', () => {
      const buggyCode = 'plt.show()()'
      const fixed = autoFixCode(buggyCode)
      expect(fixed).toBe('plt.show()')
    })
  })

  describe('Jupyter Magic Removal', () => {
    it('should remove %matplotlib inline', () => {
      const buggyCode = '%matplotlib inline\nimport numpy as np'
      const fixed = autoFixCode(buggyCode)
      expect(fixed).not.toContain('%matplotlib')
      expect(fixed).toContain('import numpy as np')
    })

    it('should remove standalone %matplotlib', () => {
      const buggyCode = '%matplotlib\nimport numpy as np'
      const fixed = autoFixCode(buggyCode)
      expect(fixed).not.toContain('%matplotlib')
      expect(fixed).toContain('import numpy as np')
    })
  })

  describe('Newline Restoration', () => {
    it('should separate import statements on one line', () => {
      const buggyCode = 'import numpy as np import matplotlib.pyplot as plt'
      const fixed = autoFixCode(buggyCode)
      expect(fixed).toContain('import numpy as np\nimport matplotlib.pyplot as plt')
    })

    it('should separate statements after plt.show()', () => {
      const buggyCode = 'plt.show()x = 5'
      const fixed = autoFixCode(buggyCode)
      expect(fixed).toContain('plt.show()\nx = 5')
    })

    it('should separate variable assignments', () => {
      const buggyCode = 'x = 5  y = 10'
      const fixed = autoFixCode(buggyCode)
      expect(fixed).toContain('x = 5\ny = 10')
    })
  })

  describe('Garbage Line Removal', () => {
    it('should remove Output: lines (UI artifacts)', () => {
      const buggyCode = 'x = 5\nOutput: Result is 5\ny = 10'
      const fixed = autoFixCode(buggyCode)
      expect(fixed).not.toContain('Output:')
      expect(fixed).toContain('x = 5')
      expect(fixed).toContain('y = 10')
    })

    it('should remove standalone garbage words', () => {
      const garbageWords = ['pltumi', 'pltum', 'pltu', 'plt0', 'np0', 'egy']
      garbageWords.forEach((garbage) => {
        const buggyCode = `x = 5\n${garbage}\ny = 10`
        const fixed = autoFixCode(buggyCode)
        expect(fixed).not.toContain(garbage)
      })
    })

    it('should reduce multiple newlines to maximum 2', () => {
      const buggyCode = 'import numpy as np\n\n\n\n\nx = 5'
      const fixed = autoFixCode(buggyCode)
      // Multiple newlines get reduced to maximum 2 (1 blank line)
      expect(fixed).toBe('import numpy as np\n\nx = 5')
    })
  })

  describe('Complex Real-World Examples', () => {
    it('should fix typical Qwen-0.5B generated code', () => {
      const buggyCode = `import numpy as np import matplotlib.pyplot as plt x = np0.linspace(-2np.pi, 2np.pi, 100) y = np0.sin(x) plt.plot(x, y) plt egy.ylabel("sin(x)") plt0`

      const fixed = autoFixCode(buggyCode)

      // Validate all fixes applied
      expect(fixed).toContain('import numpy as np')
      expect(fixed).toContain('import matplotlib.pyplot as plt')
      expect(fixed).toContain('np.linspace(-2*np.pi, 2*np.pi, 100)')
      expect(fixed).toContain('np.sin(x)')
      expect(fixed).toContain('plt.ylabel("sin(x)")')
      expect(fixed).toContain('plt.show()')
      expect(fixed).not.toContain('np0')
      expect(fixed).not.toContain('plt0')
      expect(fixed).not.toContain('egy')
    })

    it('should handle Jupyter magic + typos', () => {
      const buggyCode = `%matplotlib inline
import numpy as np
x = 2 * np0.pi
print(x)`

      const fixed = autoFixCode(buggyCode)

      expect(fixed).not.toContain('%matplotlib')
      expect(fixed).toContain('2 * np.pi')
      expect(fixed).toContain('import numpy as np')
    })

    it('should preserve correct code unchanged', () => {
      const correctCode = `import numpy as np
import matplotlib.pyplot as plt

x = np.linspace(-2*np.pi, 2*np.pi, 100)
y = np.sin(x)

plt.plot(x, y)
plt.xlabel("x")
plt.ylabel("sin(x)")
plt.show()`

      const fixed = autoFixCode(correctCode)

      // Should be identical (only whitespace normalization)
      expect(fixed.split('\n').filter(l => l.trim())).toEqual(
        correctCode.split('\n').filter(l => l.trim())
      )
    })
  })
})
