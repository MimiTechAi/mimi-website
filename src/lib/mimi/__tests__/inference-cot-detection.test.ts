/**
 * MIMI Agent - Chain-of-Thought Tag Detection Tests
 * 2026 Standards
 *
 * Testet die chunk-resiliente Erkennung von <thinking>-Tags
 */

import { describe, it, expect } from '@jest/globals'

/**
 * Simuliert die CoT Tag Detection Logik aus inference-engine.ts
 *
 * WICHTIG: Dies ist eine vereinfachte Test-Version der tatsächlichen Logik.
 * Die echte Implementierung ist komplexer (AsyncGenerator mit Streaming).
 */
class CoTDetector {
  private isInThinking = false
  private thinkingBuffer = ''
  private pendingBuffer = ''  // Buffer für unvollständige Tags

  /**
   * Verarbeitet Text-Chunks und filtert <thinking>-Tags
   */
  processChunk(token: string): string {
    // Merge pending buffer mit neuem Token
    let buffer = this.pendingBuffer + token
    this.pendingBuffer = ''

    let result = ''

    while (buffer.length > 0) {
      if (this.isInThinking) {
        // Wir sind im Thinking-Block - suche nach </thinking>
        const closeIdx = buffer.indexOf('</thinking>')
        if (closeIdx !== -1) {
          // Closing Tag gefunden
          this.thinkingBuffer += buffer.substring(0, closeIdx)
          buffer = buffer.substring(closeIdx + 11)
          this.isInThinking = false
          // Entferne ALLE führenden Whitespace nach </thinking>
          buffer = buffer.replace(/^\s+/, '')
        } else {
          // Prüfe auf partial closing tag am Ende
          const partialClose = buffer.match(/<\/?t?h?i?n?k?i?n?g?$/)
          if (partialClose && buffer.endsWith(partialClose[0])) {
            this.thinkingBuffer += buffer.substring(0, buffer.length - partialClose[0].length)
            this.pendingBuffer = partialClose[0]
          } else {
            this.thinkingBuffer += buffer
          }
          buffer = ''
        }
      } else {
        // Wir sind außerhalb - suche nach <thinking>
        const openIdx = buffer.indexOf('<thinking>')
        if (openIdx !== -1) {
          // Opening Tag gefunden
          result += buffer.substring(0, openIdx)
          buffer = buffer.substring(openIdx + 10)
          this.isInThinking = true
        } else {
          // Prüfe auf partial opening tag am Ende
          const partialOpen = buffer.match(/<t?h?i?n?k?i?n?g?$/)
          if (partialOpen && buffer.endsWith(partialOpen[0])) {
            result += buffer.substring(0, buffer.length - partialOpen[0].length)
            this.pendingBuffer = partialOpen[0]
          } else {
            result += buffer
          }
          buffer = ''
        }
      }
    }

    return result
  }

  /**
   * Verarbeitet mehrere Chunks nacheinander
   */
  processChunks(chunks: string[]): string {
    let output = ''
    for (const chunk of chunks) {
      output += this.processChunk(chunk)
    }
    return output
  }

  /**
   * Gibt den gesammelten Thinking-Buffer zurück
   */
  getThinkingBuffer(): string {
    return this.thinkingBuffer
  }

  /**
   * Reset für neue Tests
   */
  reset() {
    this.isInThinking = false
    this.thinkingBuffer = ''
    this.pendingBuffer = ''
  }
}

describe('Inference Engine - CoT Tag Detection', () => {
  let detector: CoTDetector

  beforeEach(() => {
    detector = new CoTDetector()
  })

  describe('Basic Tag Detection', () => {
    it('should hide complete <thinking> block in single chunk', () => {
      const input = 'Hello <thinking>internal reasoning</thinking> world!'
      const output = detector.processChunk(input)

      expect(output).toBe('Hello world!')
      expect(detector.getThinkingBuffer()).toBe('internal reasoning')
    })

    it('should output text before <thinking> tag', () => {
      const input = 'User asked about math <thinking>let me calculate</thinking> here is the answer'
      const output = detector.processChunk(input)

      expect(output).toBe('User asked about math here is the answer')
    })

    it('should output text after </thinking> tag', () => {
      const input = '<thinking>reasoning</thinking> The answer is 42'
      const output = detector.processChunk(input)

      expect(output).toBe('The answer is 42')
    })

    it('should handle text without thinking tags', () => {
      const input = 'This is a normal response without any CoT'
      const output = detector.processChunk(input)

      expect(output).toBe(input)
    })
  })

  describe('Chunk-Resilient Tag Detection', () => {
    it('should handle opening tag split across chunks: "<thin" + "king>"', () => {
      const chunks = [
        'Hello <thin',
        'king>internal reasoning</thinking> world!'
      ]

      const output = detector.processChunks(chunks)

      expect(output).toBe('Hello world!')
      expect(detector.getThinkingBuffer()).toBe('internal reasoning')
    })

    it('should handle opening tag split: "<" + "thinking>"', () => {
      const chunks = [
        'Text <',
        'thinking>hidden</thinking> visible'
      ]

      const output = detector.processChunks(chunks)

      expect(output).toBe('Text visible')
      expect(detector.getThinkingBuffer()).toBe('hidden')
    })

    it('should handle closing tag split: "</thin" + "king>"', () => {
      const chunks = [
        '<thinking>reason',
        'ing</thin',
        'king> output'
      ]

      const output = detector.processChunks(chunks)

      expect(output).toBe('output')
      expect(detector.getThinkingBuffer()).toBe('reasoning')
    })

    it('should handle multiple partial fragments: "<t" + "h" + "inking>"', () => {
      const chunks = [
        'Start <t',
        'h',
        'inking>hidden</thinking> end'
      ]

      const output = detector.processChunks(chunks)

      expect(output).toBe('Start end')
      expect(detector.getThinkingBuffer()).toBe('hidden')
    })

    it('should handle content split across chunks inside thinking', () => {
      const chunks = [
        '<thinking>part1',
        ' part2',
        ' part3</thinking> visible'
      ]

      const output = detector.processChunks(chunks)

      expect(output).toBe('visible')
      expect(detector.getThinkingBuffer()).toBe('part1 part2 part3')
    })
  })

  describe('Multiple Thinking Blocks', () => {
    it('should handle multiple thinking blocks in sequence', () => {
      const input = '<thinking>first</thinking> text <thinking>second</thinking> more text'
      const output = detector.processChunk(input)

      expect(output).toBe('text more text')
      expect(detector.getThinkingBuffer()).toBe('firstsecond')
    })

    it('should handle multiple thinking blocks across chunks', () => {
      const chunks = [
        '<thinking>first</thinking> A',
        ' <thinking>second</thinking> B'
      ]

      const output = detector.processChunks(chunks)

      expect(output).toBe('A B')
      expect(detector.getThinkingBuffer()).toBe('firstsecond')
    })
  })

  describe('Nested and Complex Scenarios', () => {
    it('should handle thinking block at the start', () => {
      const input = '<thinking>reasoning first</thinking>Then the answer'
      const output = detector.processChunk(input)

      expect(output).toBe('Then the answer')
      expect(detector.getThinkingBuffer()).toBe('reasoning first')
    })

    it('should handle thinking block at the end', () => {
      const chunks = [
        'Here is the answer',
        ' <thinking>post-reasoning</thinking>'
      ]

      const output = detector.processChunks(chunks)

      expect(output).toBe('Here is the answer ')
      expect(detector.getThinkingBuffer()).toBe('post-reasoning')
    })

    it('should handle whitespace normalization after </thinking>', () => {
      const input = '<thinking>hidden</thinking>\n\n  Visible text'
      const output = detector.processChunk(input)

      // Should remove leading whitespace after thinking
      expect(output).toBe('Visible text')
    })

    it('should preserve newlines outside thinking blocks', () => {
      const input = 'Line 1\n<thinking>hidden</thinking>Line 2\nLine 3'
      const output = detector.processChunk(input)

      expect(output).toBe('Line 1\nLine 2\nLine 3')
    })
  })

  describe('Edge Cases', () => {
    it('should handle incomplete opening tag at end of stream', () => {
      const chunks = ['Text <thin']

      const output = detector.processChunks(chunks)

      // Should buffer the partial tag
      expect(output).toBe('Text ')
    })

    it('should handle false positive: "thinking" in normal text', () => {
      const input = 'I am thinking about the problem'
      const output = detector.processChunk(input)

      // Should NOT filter normal text containing "thinking"
      expect(output).toBe(input)
    })

    it('should handle empty thinking block', () => {
      const input = 'Text <thinking></thinking> more text'
      const output = detector.processChunk(input)

      expect(output).toBe('Text more text')
      expect(detector.getThinkingBuffer()).toBe('')
    })

    it('should handle very long thinking block across many chunks', () => {
      const chunks = [
        '<thinking>',
        'chunk1 ',
        'chunk2 ',
        'chunk3 ',
        'chunk4 ',
        'chunk5',
        '</thinking> output'
      ]

      const output = detector.processChunks(chunks)

      expect(output).toBe('output')
      expect(detector.getThinkingBuffer()).toBe('chunk1 chunk2 chunk3 chunk4 chunk5')
    })

    it('should handle tag-like text that is not actually a tag', () => {
      const input = 'The formula is <T where T>5'
      const output = detector.processChunk(input)

      // Should not treat this as a thinking tag
      expect(output).toBe(input)
    })
  })

  describe('Real-World LLM Output Patterns', () => {
    it('should handle typical Qwen-2.5-3B output with CoT', () => {
      const chunks = [
        '<thinking>The user is asking about',
        ' Python. I should provide a code example',
        ' with proper syntax.</thinking>\n\n',
        'Here is a Python example:\n```python\n',
        'print("Hello, World!")\n```'
      ]

      const output = detector.processChunks(chunks)

      expect(output).toContain('Here is a Python example')
      expect(output).toContain('print("Hello, World!")')
      expect(output).not.toContain('<thinking>')
      expect(output).not.toContain('user is asking')
    })

    it('should handle Sonnet-style reasoning pattern', () => {
      const input = `Let me help you. <thinking>
First, I need to understand what the user wants.
They asked about X, so I should explain Y.
I'll structure my response in 3 parts.
</thinking>

Here's my answer:
1. First point
2. Second point
3. Third point`

      const output = detector.processChunk(input)

      expect(output).toContain('Here\'s my answer')
      expect(output).toContain('1. First point')
      expect(output).not.toContain('need to understand')
      expect(output).not.toContain('<thinking>')
    })

    it('should handle interleaved thinking and output', () => {
      const chunks = [
        'Part A',
        ' <thinking>analyze A</thinking> Part B',
        ' <thinking>analyze B</thinking> Part C'
      ]

      const output = detector.processChunks(chunks)

      expect(output).toBe('Part A Part B Part C')
      expect(detector.getThinkingBuffer()).toBe('analyze Aanalyze B')
    })
  })
})
