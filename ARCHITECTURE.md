# MiMi Tech AI — Architecture Documentation

> **Version:** 2.0 | **Updated:** 2026-02-10 | **Maintainer:** Engineering Team

---

## 1. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 16.1.6 |
| React | React | 19.x |
| Bundler | Turbopack | Built-in |
| Styling | Tailwind CSS | 3.x |
| Components | shadcn/ui (Radix) | 64 components |
| Animation | Framer Motion | 12.x |
| AI Engine | @huggingface/transformers | WebGPU |
| Auth | NextAuth.js | 4.x |
| Testing | Jest + Playwright | Unit + E2E |
| Language | TypeScript | 5.x |
| Font | Geist Sans/Mono | Variable |

---

## 2. Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (metadata, fonts, analytics)
│   ├── page.tsx                  # Homepage
│   ├── about/                    # Über uns
│   ├── contact/                  # Kontaktformular
│   ├── ki-beratung/              # KI-Beratung Seiten
│   │   ├── unternehmen/
│   │   └── selbstaendige/
│   ├── digitale-zwillinge/       # Digital Twin Seiten
│   │   ├── bau/
│   │   ├── urban/
│   │   ├── unternehmen/
│   │   └── technologie/
│   ├── ki-erklaert/              # KI Erklärt
│   ├── mimi/                     # MIMI Agent Page
│   ├── internal/                 # Interner Bereich (Auth-geschützt)
│   │   ├── (auth)/               # Login, Register, Forgot PW
│   │   ├── (dashboard)/          # Dashboard Layout
│   │   │   ├── chat/
│   │   │   ├── events/
│   │   │   ├── time-tracking/
│   │   │   ├── training/
│   │   │   └── wiki/
│   │   └── layout.tsx            # Auth Guard + SessionProvider
│   ├── api/                      # API Routes
│   │   ├── auth/                 # NextAuth
│   │   ├── contact/              # Contact Form
│   │   ├── newsletter/           # Newsletter
│   │   └── internal/             # Protected APIs
│   ├── impressum/
│   ├── datenschutz/
│   └── globals.css               # Design System v2
│
├── components/
│   ├── ui/                       # shadcn/ui Primitives (64 components)
│   ├── mimi/                     # MIMI Chat Components
│   │   ├── MimiChat.tsx          # Main chat orchestrator
│   │   ├── ErrorBoundary.tsx
│   │   └── components/           # MessageBubble, ArtifactCard, WelcomeScreen
│   ├── internal/                 # Dashboard Components
│   │   ├── DashboardSkeleton.tsx # Loading skeleton
│   │   ├── DashboardError.tsx    # Error state
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── Navigation.tsx            # Mega-Menu Navigation
│   ├── Footer.tsx                # Public Footer
│   ├── OptimizedImage.tsx        # Image optimization wrapper
│   ├── SpotlightCard.tsx         # Glassmorphism card
│   └── ...
│
├── hooks/
│   ├── useMimiEngine.ts          # Re-export (backward compat)
│   ├── mimi/                     # Refactored engine hooks
│   │   ├── index.ts              # Barrel export
│   │   ├── types.ts              # Shared types
│   │   ├── useMimiEngine.ts      # Orchestrator
│   │   ├── useMimiVoice.ts       # Voice I/O
│   │   ├── useMimiVision.ts      # Image analysis
│   │   └── useMimiDocuments.ts   # PDF processing
│   └── use-mobile.ts             # Responsive breakpoint
│
├── lib/
│   ├── mimi/                     # MIMI Engine Core
│   │   ├── inference-engine.ts   # LLM inference (WebGPU)
│   │   ├── agent-orchestrator.ts # Agentic loop
│   │   ├── tool-definitions.ts   # Tool registry
│   │   ├── code-executor.ts      # Pyodide Python
│   │   ├── pdf-processor.ts      # PDF extraction
│   │   ├── vector-store.ts       # Embedding search
│   │   ├── vision-engine.ts      # Image analysis
│   │   ├── voice-input.ts        # Speech API
│   │   ├── piper-tts.ts          # Text-to-speech
│   │   ├── memory-manager.ts     # RAM monitoring
│   │   ├── hardware-check.ts     # WebGPU detection
│   │   ├── file-generator.ts     # Download generation
│   │   ├── browser-compat.ts     # Browser compatibility
│   │   ├── inference-worker.ts   # Web Worker
│   │   ├── skills/               # 16 agentic skills
│   │   └── workspace/            # 10 workspace utils
│   ├── cache.ts                  # Client-side caching
│   └── utils.ts                  # cn() helper
│
├── styles/
│   ├── mobile-first.css          # Touch targets, safe areas
│   ├── core-web-vitals.css       # LCP, FID, CLS optimizations
│   ├── accessibility.css         # WCAG AAA helpers
│   └── caching.css               # Cache-friendly styles
│
└── tests/
    └── e2e/
        ├── homepage.spec.ts
        ├── navigation.spec.ts    # NEW: Mega-menu tests
        ├── ki-und-digitale-zwillinge.spec.ts
        ├── responsive-layout.spec.ts
        └── services.spec.ts
```

---

## 3. Design System

### 3.1 Token Architecture

```
globals.css
├── CSS Custom Properties (Single Source of Truth)
│   ├── Spacing Scale: --space-{1..24} (8px-based)
│   ├── Brand Colors: --mimi-cyan-{primary,glow,dark,hover,light}
│   ├── NVIDIA Green: --nvidia-green
│   ├── Brand Blue: --brand-blue, --brand-blue-light
│   ├── Backgrounds: --bg-void, --bg-surface, --bg-elevated
│   ├── Borders: --border-subtle, --border-default
│   ├── Typography: --font-{sans,mono}
│   └── shadcn tokens: --primary, --secondary, --muted, etc.
│
tailwind.config.js
├── Maps CSS vars → Tailwind classes
│   ├── brand-cyan → var(--mimi-cyan-primary)
│   ├── brand-nvidia-green → var(--nvidia-green)
│   ├── spacing.section → var(--space-20)
│   └── cyan.{50-900} → HSL color scale
```

### 3.2 Legacy Tokens (DEPRECATED — Remove in v3.0)

| Token | Replacement |
|-------|------------|
| `--brand-cyan` | `--mimi-cyan-primary` |
| `--brand-deep-void` | `--bg-void` |
| `--mimi-cyan` | `--mimi-cyan-primary` |

---

## 4. MIMI Engine Architecture

```
Browser
├── useMimiEngine (Orchestrator)
│   ├── useMimiVoice      → Web Speech API
│   ├── useMimiVision      → Vision Transformer
│   └── useMimiDocuments   → PDF.js + Vector Store
│
├── MimiInferenceEngine (Singleton)
│   ├── WebGPU Backend     → Phi-3.5 Mini (3.8B params)
│   ├── AgentOrchestrator  → Tool-calling loop
│   ├── ToolDefinitions    → 15+ tools
│   └── Web Worker         → Off-main-thread inference
│
├── Supporting Modules
│   ├── VectorStore        → ONNX embeddings + cosine similarity
│   ├── CodeExecutor       → Pyodide (Python in browser)
│   ├── MemoryManager      → RAM usage monitoring
│   └── HardwareCheck      → WebGPU capability detection
```

### Key Constraints

- **Minimum 4GB RAM** for model inference
- **WebGPU required** — Chrome 130+, Edge 130+, Firefox 139+ (experimental)
- **No cloud dependency** — 100% on-device processing
- **SharedArrayBuffer** — requires COOP/COEP headers

---

## 5. Navigation Structure (v2.0)

```
Home
Leistungen (Mega-Menu Dropdown)
├── KI-Beratung
│   ├── Übersicht          → /ki-beratung
│   ├── Für Unternehmen    → /ki-beratung/unternehmen
│   └── Für Selbständige   → /ki-beratung/selbstaendige
├── Digitale Zwillinge
│   ├── Übersicht          → /digitale-zwillinge
│   ├── Urban / Smart City → /digitale-zwillinge/urban
│   ├── Bau & Sanierung    → /digitale-zwillinge/bau
│   └── Enterprise         → /digitale-zwillinge/unternehmen
└── Wissen
    └── KI Erklärt         → /ki-erklaert
MIMI ✨                    → /mimi
Über uns                   → /about
Kontakt                    → /contact
[Login]                    → /internal
[Beratung anfragen CTA]   → /contact
```

---

## 6. Testing Strategy

| Type | Tool | Coverage | Command |
|------|------|----------|---------|
| Unit | Jest + RTL | 50% threshold | `npm test` |
| E2E | Playwright | 5 spec files | `npm run test:e2e` |
| A11y | pa11y | Per-page | `npm run pa11y` |

### Browser Matrix (Playwright)

- Chromium (Desktop)
- Firefox (Desktop)
- WebKit (Desktop)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

---

## 7. Security Headers

| Header | Value | Purpose |
|--------|-------|---------|
| `Cross-Origin-Opener-Policy` | `same-origin` | SharedArrayBuffer |
| `Cross-Origin-Embedder-Policy` | `require-corp` | SharedArrayBuffer |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `X-Frame-Options` | `SAMEORIGIN` | Clickjacking |

---

## 8. Performance Budget

| Metric | Target | Current |
|--------|--------|---------|
| LCP | < 2.5s | Monitored |
| FID | < 100ms | Optimized |
| CLS | < 0.1 | Optimized |
| Bundle (first load) | < 250KB | Split via Turbopack |
| Image format | AVIF → WebP → PNG | Auto-negotiated |

---

## 9. Deployment

- **Platform:** Vercel
- **Branch:** `main` → Production
- **Build:** `next build` (Turbopack)
- **Node:** 20.x
- **Region:** Auto (Edge)

---

*© 2026 MiMi Tech AI. Alle Rechte vorbehalten.*
