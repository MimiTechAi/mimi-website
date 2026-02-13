/**
 * MIMI Engine Hooks -- Barrel Export
 *
 * All MIMI hooks consolidated under a single namespace.
 *
 * Usage:
 *   import { useMimiEngine, useAgentEvents, useSandbox, useChatState } from "@/hooks/mimi";
 */

export { useMimiEngine } from "./useMimiEngine";
export { useAgentEvents } from "./useAgentEvents";
export { useSandbox } from "./useSandbox";
export { useChatState } from "./useChatState";

export type { AppState, UseMimiEngineReturn } from "./types";
export type { AgentEventsState, UITaskPlan, UITaskStep, UIToolExecution, UIFileActivity } from "./useAgentEvents";
export type { SandboxState, SandboxActions, SandboxFile, TerminalLine } from "./useSandbox";
export type { Message } from "./useChatState";
