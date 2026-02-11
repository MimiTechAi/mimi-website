/**
 * Jest Setup File
 * Wird vor jedem Test ausgeführt
 */

// React 19 + @testing-library/react v16 Kompatibilität
// @ts-expect-error React 19 requires this global
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// TextEncoder/TextDecoder Polyfill für jsdom
if (typeof globalThis.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}

import '@testing-library/jest-dom'

// Mock Next.js Router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => props,
}))

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() { }
  disconnect() { }
  observe() { }
  takeRecords() {
    return []
  }
  unobserve() { }
} as any

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() { }
  disconnect() { }
  observe() { }
  unobserve() { }
} as any

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock WebGPU (für LLM-Tests)
Object.defineProperty(navigator, 'gpu', {
  writable: true,
  value: {
    requestAdapter: jest.fn().mockResolvedValue({
      requestDevice: jest.fn().mockResolvedValue({}),
    }),
  },
})

// Mock IndexedDB
const indexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
  databases: jest.fn().mockResolvedValue([]),
}
Object.defineProperty(window, 'indexedDB', {
  writable: true,
  value: indexedDB,
})

// Mock lucide-react (ESM → kann nicht von Jest transformiert werden)
jest.mock('lucide-react', () => {
  const React = require('react');
  const createIcon = (name: string) =>
    React.forwardRef((props: any, ref: any) =>
      React.createElement('svg', { ...props, ref, 'data-testid': `icon-${name}` })
    );

  return new Proxy({}, {
    get: (_, prop: string) => {
      if (prop === '__esModule') return true;
      return createIcon(prop);
    }
  });
});

// Mock framer-motion (vermeidet Animation-Probleme in Tests)
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: new Proxy({}, {
      get: (_, tag: string) =>
        React.forwardRef(({ children, ...props }: any, ref: any) =>
          React.createElement(tag, { ...props, ref }, children)
        )
    }),
    AnimatePresence: ({ children }: any) => children,
    useAnimation: () => ({}),
    useInView: () => true,
  };
});

// Erhöhe Test-Timeout für LLM-Tests
jest.setTimeout(30000)

console.log('✅ Jest Setup loaded - 2026 standards')
