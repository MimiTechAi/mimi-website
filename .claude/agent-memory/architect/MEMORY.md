# MIMI Architecture Knowledge

## Project Structure
- Next.js app with App Router at `/src/app/mimi/`
- Core agent lib at `/src/lib/mimi/`
- Components at `/src/components/mimi/`
- Hooks at `/src/hooks/mimi/` and `/src/hooks/useSandbox.ts`
- 3-panel Manus-inspired layout: Task List | Chat | Sandbox

## Key Architecture Files
- `inference-engine.ts` - Core LLM inference with WebGPU, CoT, tool calling
- `agent-orchestrator.ts` - Specialist agent routing (swarm pattern)
- `agent-events.ts` - AG-UI inspired event bus (16 typed events)
- `task-planner.ts` - Manus-style task decomposition (task_plan/notes/deliverable)
- `tool-definitions.ts` - Structured tool definitions + dispatch
- `agent-memory.ts` - IndexedDB persistent memory with tiered importance
- `skill-registry.ts` - LRU-cached skill system with markdown skill files

## Architecture Pattern
- Event-driven agent loop: User -> Engine -> Orchestrator -> Tools -> Events -> UI
- Hooks compose: useMimiEngine orchestrates useMimiVoice, useMimiVision, useMimiDocuments
- useAgentEvents bridges event bus to React state
- useSandbox manages workspace panel state

## Known Issues (from analysis)
- page.tsx is 1437 lines (monolith, should be decomposed)
- Duplicate type definitions (TerminalLine in page.tsx vs useSandbox.ts)
- formatContent() helper duplicated in page.tsx vs MarkdownRenderer.tsx
- useSandbox lives outside /hooks/mimi/ (inconsistent organization)
