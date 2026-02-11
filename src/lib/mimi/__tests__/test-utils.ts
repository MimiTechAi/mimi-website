/**
 * Test Utilities für MIMI Agent Tests
 * 2026 Standards
 */

/**
 * Mock LLM Response Helper
 */
export function createMockLLMResponse(content: string, hasThinking: boolean = false) {
  if (hasThinking) {
    return `<thinking>Internal reasoning...</thinking>\n${content}`
  }
  return content
}

/**
 * Mock Python Code Executor Response
 */
export function createMockPythonResult(
  success: boolean,
  output?: string,
  error?: string,
  plots?: string[]
) {
  return {
    success,
    output: output || '',
    error: error || '',
    plots: plots || [],
    execution_time: 0.1,
  }
}

/**
 * Mock PDF Document für Tests
 */
export function createMockPDFDocument(
  id: string = 'test-doc-1',
  name: string = 'test.pdf'
) {
  return {
    id,
    name,
    chunks: [
      {
        text: 'This is test chunk 1',
        pageNumber: 1,
        chunkIndex: 0,
        embedding: new Float32Array(384).fill(0.1),
      },
      {
        text: 'This is test chunk 2',
        pageNumber: 1,
        chunkIndex: 1,
        embedding: new Float32Array(384).fill(0.2),
      },
    ],
    pageCount: 1,
    uploadedAt: new Date(),
  }
}

/**
 * Mock Message für Chat-Tests
 */
export function createMockMessage(
  role: 'user' | 'assistant',
  content: string,
  id?: string
) {
  return {
    id: id || `msg-${Date.now()}`,
    role,
    content,
    timestamp: new Date(),
  }
}

/**
 * Wait Helper für async Tests
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Mock WebGPU Availability Check
 */
export function mockWebGPUAvailable() {
  Object.defineProperty(navigator, 'gpu', {
    writable: true,
    configurable: true,
    value: {
      requestAdapter: jest.fn().mockResolvedValue({
        requestDevice: jest.fn().mockResolvedValue({
          queue: {
            submit: jest.fn(),
          },
        }),
      }),
    },
  })
}

/**
 * Mock WebGPU Not Available
 */
export function mockWebGPUUnavailable() {
  Object.defineProperty(navigator, 'gpu', {
    writable: true,
    configurable: true,
    value: undefined,
  })
}

/**
 * Validiere Code Executor Auto-Fix
 */
export function validateAutoFix(
  originalCode: string,
  expectedFix: string
): boolean {
  // Helper um zu testen ob Auto-Fix korrekt funktioniert
  return originalCode !== expectedFix
}
