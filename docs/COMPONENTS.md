# Component API Reference

> **Version:** 2.0 | **Updated:** 2026-02-13

This document covers the MIMI-specific components and hooks. For shadcn/ui primitives (64 components in `src/components/ui/`), see the [shadcn/ui docs](https://ui.shadcn.com/).

---

## MIMI Chat Components

### MimiChat

**Path:** `src/components/mimi/MimiChat.tsx`

The main chat orchestrator component. Composes all sub-components (message list, input bar, agent status, artifact cards) into the complete MIMI chat experience.

**Usage:**
```tsx
import { MimiChat } from '@/components/mimi/MimiChat';

export default function MimiPage() {
  return <MimiChat />;
}
```

This component internally uses the `useMimiEngine` hook and manages all chat state.

---

### MessageBubble

**Path:** `src/components/mimi/components/MessageBubble.tsx`

Renders a single chat message with Markdown support, code highlighting, and artifact rendering.

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `role` | `'user' \| 'assistant'` | Message sender |
| `content` | `string` | Message content (supports Markdown) |
| `artifacts` | `Artifact[]` | Attached artifacts (code, documents) |
| `isStreaming` | `boolean` | Whether the message is still being generated |

---

### ArtifactCard

**Path:** `src/components/mimi/components/ArtifactCard.tsx`

Displays a generated artifact (code snippet, document, data table, or plan) with syntax highlighting and download capability.

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `artifact` | `Artifact` | The artifact to display |
| `onDownload` | `(artifact: Artifact) => void` | Download handler |
| `onExecute` | `(code: string, lang: string) => void` | Execute code handler |

**Artifact Types:**
```typescript
interface Artifact {
  type: 'code' | 'document' | 'table' | 'plan';
  language?: string;  // e.g., 'python', 'javascript'
  title: string;
  content: string;
}
```

---

### WelcomeScreen

**Path:** `src/components/mimi/components/WelcomeScreen.tsx`

First-time/empty-state screen with capability showcase and example prompts.

---

### ChatHeader

**Path:** `src/components/mimi/components/ChatHeader.tsx`

Top bar showing the active agent name, model info, memory usage, and controls (clear chat, voice toggle).

---

### AgentStepsPanel

**Path:** `src/components/mimi/components/AgentStepsPanel.tsx`

Real-time execution timeline showing each step of the agentic workflow (thinking, tool calls, results).

---

### AgentThinkingBar

**Path:** `src/components/mimi/components/AgentThinkingBar.tsx`

Animated bar shown during agent reasoning (`<thinking>` phase).

---

### CapabilityChips

**Path:** `src/components/mimi/components/CapabilityChips.tsx`

Displays clickable capability tags (Python, Search, Vision, etc.). Has a Storybook story at `CapabilityChips.stories.tsx`.

---

### OnboardingTour

**Path:** `src/components/mimi/components/OnboardingTour.tsx`

Feature discovery overlay for first-time users.

---

### TaskHistoryPanel

**Path:** `src/components/mimi/components/TaskHistoryPanel.tsx`

Shows history of past tasks and conversations.

---

## MIMI UI Primitives

### AgentStatusBadge

**Path:** `src/components/mimi/ui/AgentStatusBadge.tsx`

Displays the current agent status (idle, thinking, calculating, searching, etc.) with animated indicators.

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `status` | `AgentStatus` | Current agent status |

**AgentStatus values:** `'idle' | 'thinking' | 'calculating' | 'searching' | 'coding' | 'error'`

---

### GlassCard

**Path:** `src/components/mimi/ui/GlassCard.tsx`

Glassmorphism card with blur backdrop, used throughout the MIMI interface.

---

### ThinkingIndicator

**Path:** `src/components/mimi/ui/ThinkingIndicator.tsx`

Animated dots/pulse indicator shown while the AI is generating a response.

---

## Supporting Components

### MarkdownRenderer

**Path:** `src/components/mimi/MarkdownRenderer.tsx`

Renders Markdown with GFM support, math (KaTeX), syntax highlighting, and custom styling. Uses `react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex`, and `rehype-highlight`.

---

### ModelLoading

**Path:** `src/components/mimi/ModelLoading.tsx`

Loading screen shown during AI model initialization. Displays progress bar, model name, and estimated time.

---

### UnsupportedBrowser

**Path:** `src/components/mimi/UnsupportedBrowser.tsx`

Fallback screen for browsers without WebGPU support. Shows requirements and alternative browser links.

---

### SandboxPanel

**Path:** `src/components/mimi/SandboxPanel.tsx`

Preview panel for rendered sandbox output (HTML, charts, code execution results).

---

### ErrorBoundary

**Path:** `src/components/mimi/ErrorBoundary.tsx`

React error boundary wrapping the MIMI chat to catch and display runtime errors gracefully.

---

## Hooks

### useMimiEngine

**Path:** `src/hooks/mimi/useMimiEngine.ts`

The main orchestrator hook. Initializes the AI engine, manages state, and composes sub-hooks.

**Return type:** `UseMimiEngineReturn`

```typescript
const {
  // State
  state,              // 'checking' | 'unsupported' | 'loading' | 'ready' | 'error'
  error,              // Error message string
  deviceProfile,      // WebGPU device info
  loadedModel,        // Currently loaded model ID
  loadingProgress,    // 0-100 loading percentage
  loadingStatus,      // Human-readable loading message
  isGenerating,       // Whether AI is generating a response
  agentStatus,        // Current agent activity status
  isPythonReady,      // Whether Pyodide is loaded
  memoryUsageMB,      // Current RAM usage estimate
  isMemoryWarning,    // RAM warning threshold exceeded

  // Voice
  isRecording,
  isVoiceReady,
  isSpeaking,
  currentLanguage,
  interimText,
  voiceTranscript,
  handleVoiceInput,
  handleSpeak,
  handleLanguageChange,

  // Vision
  uploadedImage,
  isVisionReady,
  handleImageUpload,
  handleUnloadVision,

  // Documents
  uploadedDocuments,
  isUploadingPDF,
  handlePDFUpload,
  handleDeleteDocument,

  // Core
  handleSendMessage,       // (content: string) => AsyncGenerator<string>
  handleExecuteCode,       // (code: string, language: string) => Promise<{output, chartBase64?}>
  handleDownloadArtifact,  // (artifact: Artifact) => void
  handleClearChat,         // () => void
  handleStopGeneration,    // () => Promise<void>
} = useMimiEngine();
```

**Lifecycle:**
1. `checking` -- Probes WebGPU support via `hardware-check.ts`
2. `loading` -- Downloads and initializes the AI model (with fallback cascade)
3. `ready` -- Engine is active, chat is available
4. `error` / `unsupported` -- Terminal states

**Model Fallback Cascade:**
The hook tries models in order: hardware-selected best -> Phi-4 Mini -> Qwen 2.5 1.5B -> Llama 3.2 1B. If one fails, it automatically falls back to the next.

---

### useMimiVoice

**Path:** `src/hooks/mimi/useMimiVoice.ts`

Voice input/output sub-hook. Uses Web Speech API for STT and Piper TTS for speech synthesis.

---

### useMimiVision

**Path:** `src/hooks/mimi/useMimiVision.ts`

Image analysis sub-hook. Handles image upload and Vision Transformer initialization.

---

### useMimiDocuments

**Path:** `src/hooks/mimi/useMimiDocuments.ts`

PDF processing sub-hook. Manages document upload, text extraction (PDF.js), chunking, and vector store indexing.

---

### useChatState

**Path:** `src/components/mimi/hooks/useChatState.ts`

Local chat UI state management (message list, scroll position, input state).

---

## Internal Dashboard Components

### DashboardSkeleton

**Path:** `src/components/internal/DashboardSkeleton.tsx`

Loading skeleton for the internal dashboard.

### Header / Sidebar / Footer

**Path:** `src/components/internal/Header.tsx`, `Sidebar.tsx`, `Footer.tsx`

Layout components for the authenticated internal dashboard area.
