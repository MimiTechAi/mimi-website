/**
 * MIMI Engine Hooks — Barrel Export
 *
 * Usage:
 *   import { useMimiEngine } from "@/hooks/mimi";           // Full orchestrator
 *   import { useMimiVoice } from "@/hooks/mimi/useMimiVoice"; // Individual sub-hook
 */

export { useMimiEngine } from "./useMimiEngine";
export type { AppState, UseMimiEngineReturn } from "./types";
