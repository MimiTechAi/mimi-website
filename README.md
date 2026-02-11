# MIMI Intelligent Workspace

**MIMI** is a Sovereign AI Agent that works locally in your browser. It features a "Virtual Computer" capability, allowing it to write code, analyze data, and persist state without external dependencies.

## 🚀 Key Features

*   **Zero-Dependency AI**: Runs entirely in the browser using WebGPU (Phi 3.5 / Llama 3.2).
*   **Virtual Computer**:
    *   **Python Sandbox**: Full Pyodide runtime with `numpy`, `pandas`, `matplotlib`, `scikit-learn`.
    *   **SQLite Database**: Local SQL engine via WASM with persistence.
    *   **File System**: OPFS (Origin Private File System) for storing code and data.
*   **Agentic Workflow**: MIMI can plan, execute code, visualize data, and self-correct.

## 🛠️ Getting Started

### Prerequisites

*   Node.js 18+
*   Browser with WebGPU support (Chrome 113+, Edge, or other modern browsers).

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```
Runs the app at `http://localhost:3000`.

## 📦 Deployment

The app is optimized for static export or Vercel.

**Build for Production:**
```bash
npm run build
```

**Note on Pyodide/WASM:**
The app relies on `SharedArrayBuffer` for the AI model and Python runtime. Ensure your hosting provider serves the following headers:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

(The `next.config.ts` handles this for `npm start`, but static hosts like Netlify/GitHub Pages need explicit configuration).

## 🧠 Brain & Skills

*   **Skills**: Located in `src/lib/mimi/skills/builtin/`.
*   **Agents**: Configured in `inference-engine.ts`.
*   **Orchestraion**: `agent-orchestrator.ts` manages task delegation.

---

© 2026 MIMI Tech AI