# MIMI Intelligent Workspace

**MIMI** is a sovereign AI agent that runs entirely in your browser. No cloud, no API keys, no data leaving your device. It features a complete "Virtual Computer" with Python execution, SQL databases, file management, and multi-agent intelligence -- all powered by on-device WebGPU inference.

## Key Features

- **100% On-Device AI** -- Runs Phi-3.5 / Llama 3.2 via WebGPU, zero cloud dependency
- **Python Sandbox** -- Full Pyodide runtime with NumPy, Pandas, Matplotlib, scikit-learn
- **SQLite Database** -- Local SQL engine via WASM with persistence
- **File System** -- Origin Private File System (OPFS) for code and data storage
- **Multi-Agent Architecture** -- 10 specialist agents (Data Analyst, Code Expert, Security Agent, etc.)
- **Agentic Skills** -- 12 built-in skill definitions for structured task execution
- **RAG Pipeline** -- Upload PDFs, search with vector embeddings (ONNX)
- **Vision** -- Image analysis via Vision Transformer
- **Voice I/O** -- Speech-to-text and text-to-speech via Web Speech API + Piper TTS
- **Web Search** -- DuckDuckGo integration with CORS proxy fallback
- **File Generation** -- Export to PDF, CSV, JSON, TXT, HTML, Markdown

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.x |
| Language | TypeScript | 5.x |
| React | React | 19.x |
| Bundler | Turbopack | Built-in |
| Styling | Tailwind CSS | 3.x |
| Components | shadcn/ui (Radix primitives) | 64 components |
| Animation | Framer Motion | 12.x |
| AI Inference | @huggingface/transformers | WebGPU |
| Auth | NextAuth.js | 4.x |
| Unit Testing | Jest + React Testing Library | -- |
| E2E Testing | Playwright | -- |
| Fonts | Geist Sans / Geist Mono | Variable |

## Quick Start

```bash
# 1. Clone the repository
git clone <repo-url> && cd mimi-website

# 2. Install dependencies
npm install

# 3. Set up environment variables (see below)
cp .env.example .env.local

# 4. Start development server (Turbopack)
npm run dev

# 5. Open http://localhost:3000
```

**Requirements:**
- Node.js 18+
- Browser with WebGPU support (Chrome 130+, Edge 130+)
- Minimum 4 GB RAM for model inference

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXTAUTH_SECRET` | Yes | Secret for NextAuth session encryption |
| `NEXTAUTH_URL` | Yes | Base URL (e.g., `http://localhost:3000`) |
| `RESEND_API_KEY` | No | Resend API key for contact form emails |
| `CONTACT_TO_EMAIL` | No | Recipient for contact form (default: `info@mimitechai.com`) |
| `CONTACT_FROM_EMAIL` | No | Sender address for contact emails |
| `GOOGLE_ANALYTICS_ID` | No | Google Analytics measurement ID |

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Homepage
│   ├── mimi/                     # MIMI Agent (chat, dashboard, workspace, settings)
│   ├── ki-beratung/              # AI Consulting pages
│   ├── digitale-zwillinge/       # Digital Twin pages
│   ├── ki-erklaert/              # AI Explained
│   ├── internal/                 # Auth-protected dashboard
│   │   ├── (auth)/               # Login, Register, Forgot Password
│   │   └── (dashboard)/          # Chat, Events, Wiki, Training, Time Tracking
│   ├── api/                      # API Routes
│   │   ├── auth/                 # NextAuth endpoints
│   │   ├── contact/              # Contact form (Resend)
│   │   ├── newsletter/           # Newsletter signup
│   │   └── internal/             # Protected internal APIs
│   └── about/, contact/, impressum/, datenschutz/
│
├── components/
│   ├── ui/                       # shadcn/ui primitives (64 components)
│   ├── mimi/                     # MIMI Agent UI
│   │   ├── MimiChat.tsx          # Main chat orchestrator
│   │   ├── components/           # MessageBubble, ArtifactCard, WelcomeScreen, etc.
│   │   ├── ui/                   # AgentStatusBadge, GlassCard, ThinkingIndicator
│   │   └── hooks/                # useChatState
│   └── internal/                 # Dashboard layout components
│
├── hooks/
│   └── mimi/                     # Engine hooks
│       ├── useMimiEngine.ts      # Main orchestrator hook
│       ├── useMimiVoice.ts       # Voice I/O
│       ├── useMimiVision.ts      # Image analysis
│       └── useMimiDocuments.ts   # PDF processing
│
├── lib/
│   └── mimi/                     # MIMI Engine Core
│       ├── inference-engine.ts   # LLM inference (WebGPU, singleton)
│       ├── agent-orchestrator.ts # Multi-agent routing + delegation
│       ├── tool-definitions.ts   # Tool registry + dispatcher
│       ├── code-executor.ts      # Pyodide Python runtime
│       ├── pdf-processor.ts      # PDF extraction + chunking
│       ├── vector-store.ts       # ONNX embedding search
│       ├── vision-engine.ts      # Vision Transformer
│       ├── voice-input.ts        # Web Speech API
│       ├── piper-tts.ts          # Text-to-speech
│       ├── memory-manager.ts     # RAM monitoring
│       ├── hardware-check.ts     # WebGPU detection + model selection
│       ├── task-planner.ts       # Task decomposition
│       ├── agent-events.ts       # Event bus
│       ├── agent-memory.ts       # Context window management
│       ├── skills/               # 12 agentic skill definitions (.skill.md)
│       └── workspace/            # Virtual Computer subsystem
│           ├── filesystem.ts     # OPFS file operations
│           ├── networking.ts     # Sandboxed network access
│           ├── runtimes/         # JavaScript (QuickJS) runtime
│           ├── services/         # Database (SQLite), package manager
│           └── vcs/              # Git (isomorphic-git) integration
│
├── styles/
│   ├── mobile-first.css          # Touch targets, safe areas
│   ├── core-web-vitals.css       # LCP, FID, CLS optimizations
│   ├── accessibility.css         # WCAG AAA helpers
│   └── caching.css               # Cache-friendly styles
│
└── tests/e2e/                    # Playwright E2E tests
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm test` | Run Jest unit tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:all` | Run unit + E2E tests |
| `npm run lint` | ESLint check |
| `npm run storybook` | Start Storybook on port 6006 |
| `npm run pa11y` | Accessibility audit (requires running server) |
| `npm run lighthouse` | Performance audit (requires running server) |

## Deployment

The app deploys to **Vercel** from the `main` branch.

**Build command:** `next build` (Turbopack)
**Node version:** 20.x
**Region:** Auto (Edge)

### Required Headers for WebGPU / SharedArrayBuffer

The AI model and Python runtime require `SharedArrayBuffer`, which needs these security headers:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

These are configured in `next.config.ts` for `npm start`. Static hosts (Netlify, GitHub Pages) need explicit configuration.

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, tech stack, directory structure |
| [docs/COMPONENTS.md](./docs/COMPONENTS.md) | Component API reference |
| [docs/API.md](./docs/API.md) | API routes and MIMI tool definitions |
| [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) | Dev workflow, conventions, testing |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Production deployment guide |
| [docs/USER_GUIDE.md](./docs/USER_GUIDE.md) | End-user guide for MIMI |
| [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) | Contribution guidelines |

## License

(c) 2026 MIMI Tech AI. All rights reserved.
