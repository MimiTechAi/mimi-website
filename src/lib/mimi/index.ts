/**
 * MIMI Agent - Lib Index
 * Exportiert alle Module für die MIMI PWA
 */

// Core
export * from './hardware-check';
export * from './inference-engine';
export * from './pdf-processor';
export * from './vector-store';

// Agent Features
export * from './voice-input';
export * from './code-executor';
// file-generator: dynamically imported to avoid jspdf bundling issues
// Use: const { generateAndDownload } = await import('@/lib/mimi/file-generator');

// Phase 4 - Premium Features
// piper-tts: dynamically imported to avoid onnxruntime-web bundling issues
// Use: const { getPiperTTS } = await import('@/lib/mimi/piper-tts');
export * from './vision-engine';
export * from './memory-manager';
export {
    TOOL_DEFINITIONS,
    getToolDescriptionsForPrompt,
    parseToolCalls,
    validateToolCall,
    executeToolCall,
    executeWebSearch,
    type ToolDefinition,
    type ToolParameter,
    type ToolResult
} from './tool-definitions';
export * from './agent-orchestrator';
export * from './browser-compat';

// Phase 5 - Skills System (SOTA 2026)
export * from './skills';
