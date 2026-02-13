# Development Guide

> **Version:** 2.0 | **Updated:** 2026-02-13

---

## Prerequisites

- **Node.js** 18+ (20.x recommended)
- **npm** 9+
- **Browser** with WebGPU support (Chrome 130+, Edge 130+)
- At least **4 GB free RAM** for AI model inference during development

## Setup

```bash
git clone <repo-url>
cd mimi-website
npm install
```

Create a `.env.local` file:

```bash
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
# Optional:
# RESEND_API_KEY=re_xxxxx
# GOOGLE_ANALYTICS_ID=G-XXXXXXX
```

Start the development server:

```bash
npm run dev
```

This runs Next.js with Turbopack at `http://localhost:3000`.

---

## Project Conventions

### File Organization

- **Pages** go in `src/app/` following the Next.js App Router convention
- **Components** go in `src/components/`, organized by domain:
  - `ui/` -- shadcn/ui primitives
  - `mimi/` -- MIMI agent components
  - `internal/` -- Dashboard components
- **Hooks** go in `src/hooks/`, grouped by feature (`mimi/`)
- **Library code** goes in `src/lib/`, with MIMI engine code in `lib/mimi/`
- **Styles** go in `src/styles/` for global CSS, component styles use Tailwind classes

### TypeScript

- Strict mode enabled (`"strict": true` in tsconfig)
- Path alias: `@/*` maps to `./src/*`
- Use `interface` for object shapes, `type` for unions and intersections
- Export types alongside their implementations

### Styling

- **Tailwind CSS** for all component styling
- **CSS custom properties** defined in `src/app/globals.css` (single source of truth)
- **shadcn/ui** for UI primitives (configured via `components.json`)
- Brand colors use `brand-*` Tailwind classes mapped to CSS variables
- Dark-mode only (the app has a dark theme by default)

### Design Tokens

The design system uses a layered token architecture:

```
globals.css (CSS Custom Properties)
  -> tailwind.config.js (maps vars to Tailwind classes)
    -> Components (use Tailwind classes)
```

Key token families:
- `--mimi-cyan-*` -- Primary brand color (cyan)
- `--nvidia-green*` -- Secondary brand color
- `--bg-void`, `--bg-surface`, `--bg-elevated` -- Background hierarchy
- `--space-{1..24}` -- 8px-based spacing scale

### Naming Conventions

- **Files:** `kebab-case.ts` for utilities, `PascalCase.tsx` for components
- **Components:** PascalCase (`MimiChat`, `AgentStatusBadge`)
- **Hooks:** `camelCase` with `use` prefix (`useMimiEngine`)
- **CSS variables:** `--kebab-case` (`--mimi-cyan-primary`)
- **Tailwind classes:** Use `cn()` utility from `src/lib/utils.ts` for conditional classes

---

## Testing

### Unit Tests (Jest)

```bash
npm test              # Run all unit tests
npm run test:watch    # Watch mode
```

Tests are colocated with their source in `__tests__/` directories. The project uses:
- **Jest** as the test runner
- **React Testing Library** for component tests
- **jsdom** environment

Example test location: `src/components/mimi/__tests__/ChatHeader.test.tsx`

### E2E Tests (Playwright)

```bash
npm run test:e2e          # Run all E2E tests
npm run test:e2e:headed   # Run with visible browser
npm run test:e2e:ui       # Playwright UI mode
npm run test:e2e:debug    # Debug mode
```

E2E specs are in `tests/e2e/`:
- `homepage.spec.ts` -- Homepage rendering and navigation
- `navigation.spec.ts` -- Mega-menu and routing
- `ki-und-digitale-zwillinge.spec.ts` -- Service pages
- `responsive-layout.spec.ts` -- Responsive breakpoints
- `services.spec.ts` -- Service page content

**Browser matrix:** Chromium, Firefox, WebKit (desktop), Mobile Chrome (Pixel 5), Mobile Safari (iPhone 12).

### Accessibility Testing

```bash
npm run pa11y       # Run pa11y against localhost:3000
```

The project targets WCAG AAA compliance. Accessibility styles are in `src/styles/accessibility.css`.

### Performance Testing

```bash
npm run lighthouse  # Generate Lighthouse report (JSON)
```

**Performance budget:**

| Metric | Target |
|--------|--------|
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |
| First load JS | < 250KB |

---

## MIMI Engine Development

### Architecture Overview

```
useMimiEngine (React hook)
  |
  +-- MimiInferenceEngine (singleton, Web Worker)
  |     +-- WebGPU backend (Phi-3.5 / Llama 3.2 / Qwen 2.5)
  |     +-- AgentOrchestrator (task routing)
  |     +-- Tool dispatcher (tool-definitions.ts)
  |
  +-- useMimiVoice (Web Speech API + Piper TTS)
  +-- useMimiVision (Vision Transformer, ONNX)
  +-- useMimiDocuments (PDF.js + VectorStore)
```

### Adding a New Tool

1. Add the tool definition to `TOOL_DEFINITIONS` in `src/lib/mimi/tool-definitions.ts`:

```typescript
{
    name: 'my_new_tool',
    description: 'Description for the LLM',
    parameters: [
        { name: 'param1', type: 'string', description: '...', required: true }
    ],
    handler: 'myNewTool'
}
```

2. Add a `case` to the `executeToolCall` switch statement in the same file.

3. If the tool needs external context (e.g., runtime access), add it to the `context` parameter type and wire it in `useMimiEngine.ts`.

### Adding a New Agent

1. Add a `SpecialistAgent` entry to `SPECIALIST_AGENTS` in `src/lib/mimi/agent-orchestrator.ts`.

2. Add keyword patterns to the `classifyTask` method for routing.

3. Optionally add delegation patterns to `getDelegationSuggestions`.

### Adding a New Skill

1. Create a `.skill.md` file in `src/lib/mimi/skills/builtin/`.

2. The file should follow the frontmatter format used by existing skills.

3. The skill will be auto-discovered by the `SkillRegistry` on initialization.

---

## Storybook

```bash
npm run storybook        # Dev server on port 6006
npm run build-storybook  # Static build
```

Stories are colocated with components (e.g., `button.stories.tsx`, `CapabilityChips.stories.tsx`).

The project uses Storybook 10 with `@storybook/nextjs-vite` and includes:
- `@storybook/addon-a11y` -- Accessibility checks
- `@storybook/addon-docs` -- Auto-generated docs
- `@storybook/addon-vitest` -- Vitest integration

---

## Common Issues

### WebGPU not available in development

Chrome requires HTTPS or `localhost` for WebGPU. Make sure you access the dev server via `http://localhost:3000`, not an IP address.

### SharedArrayBuffer errors

The `next.config.ts` sets COOP/COEP headers. If you see `SharedArrayBuffer is not defined`, verify the headers are being served:

```bash
curl -I http://localhost:3000 | grep -i cross-origin
```

Expected output:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

### Model loading fails

The model fallback cascade tries progressively smaller models. Check the browser console for `[MIMI]` log entries to see which model was selected and whether any failed.

Common causes:
- Insufficient GPU memory (need 4+ GB)
- WebGPU adapter not available (try Chrome Canary)
- Network issue during model download (models are cached after first load)

### Pyodide not loading

Pyodide loads asynchronously in the background after the AI model. The `isPythonReady` state in `useMimiEngine` indicates when it is available. Python code execution will return an error if Pyodide is not yet loaded.
