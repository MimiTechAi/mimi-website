import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({
  // Pfad zum Next.js App-Verzeichnis
  dir: './',
})

const config: Config = {
  // Test-Umgebung: jsdom für React-Komponenten
  testEnvironment: 'jest-environment-jsdom',

  // Fix ESM/CJS interop (symbol-tree, agent-base, etc.)
  testEnvironmentOptions: {
    customExportConditions: [''],
  },

  // Stellt sicher dass nur LOKALE node_modules verwendet werden
  roots: ['<rootDir>/src'],
  moduleDirectories: ['node_modules', '<rootDir>/node_modules'],

  // Setup-Dateien die vor jedem Test ausgeführt werden
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Module Name Mapper für @/ Aliase
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Test-Dateien Pattern
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],

  // Coverage Settings
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],

  // Coverage Thresholds (50% für Start)
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // Let next/jest handle ALL transformations via SWC (not ts-jest)
  // This avoids ESM/CJS conflicts with packages like http-proxy-agent, agent-base

  // ESM-Module die transformiert werden MÜSSEN für Jest
  transformIgnorePatterns: [
    'node_modules/(?!(@mlc-ai|pyodide|transformers|lucide-react|@testing-library|agent-base|http-proxy-agent)/)',
  ],

  // Test Timeout (wichtig für LLM-Tests)
  testTimeout: 30000,
}

// Next.js Jest Config Creator — applies SWC transform automatically
export default createJestConfig(config)
