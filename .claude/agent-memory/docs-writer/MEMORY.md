# MIMI Project Documentation Memory

## Project Overview
- **MIMI** is a sovereign AI agent running 100% in-browser via WebGPU
- Next.js 16 App Router, React 19, TypeScript 5, Tailwind 3, shadcn/ui
- German-language AI consulting company website (MiMi Tech AI) with embedded AI agent

## Key Architecture
- `src/lib/mimi/` -- Core engine (inference, orchestrator, tools, skills, workspace)
- `src/hooks/mimi/` -- React hooks (useMimiEngine orchestrates sub-hooks)
- `src/components/mimi/` -- Chat UI components
- `src/app/mimi/` -- MIMI agent pages (chat, dashboard, workspace, settings)
- `src/app/internal/` -- Auth-protected employee dashboard
- 10 specialist agents, 11 tools, 12 skills (.skill.md files)

## Documentation Structure (Created 2026-02-13)
- `README.md` -- Project overview, quick start, structure, env vars
- `ARCHITECTURE.md` -- System design, design tokens, testing, navigation
- `docs/COMPONENTS.md` -- Component API reference with props/types
- `docs/API.md` -- API routes + MIMI tool definitions + agent orchestrator
- `docs/DEVELOPMENT.md` -- Dev setup, conventions, testing, adding tools/agents
- `docs/DEPLOYMENT.md` -- Vercel, Docker, Nginx, Caddy, static export
- `docs/USER_GUIDE.md` -- End-user guide for MIMI capabilities
- `docs/CONTRIBUTING.md` -- Contribution guidelines, branch strategy, PR process

## Important Notes
- SharedArrayBuffer requires COOP/COEP headers (configured in next.config.ts)
- Model fallback cascade: hardware-best -> Phi-4 Mini -> Qwen 2.5 1.5B -> Llama 3.2 1B
- Pyodide loads asynchronously after AI model
- PDF type in create_file is redirected to HTML (Blob API limitation)
- Contact form uses Resend API with fallback to onboarding@resend.dev
