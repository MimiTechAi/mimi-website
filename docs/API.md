# API Reference

> **Version:** 2.0 | **Updated:** 2026-02-13

---

## 1. Next.js API Routes

All API routes are located in `src/app/api/`. They use Next.js App Router route handlers.

### POST /api/contact

Sends a contact form submission via Resend email API.

**Request Body:**
```json
{
  "name": "Max Mustermann",
  "email": "max@example.com",
  "company": "Firma GmbH",
  "phone": "+49 123 456789",
  "service": "KI-Beratung",
  "message": "Ich interessiere mich fuer..."
}
```

**Required fields:** `name`, `email`, `message`, `service`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Vielen Dank fuer Ihre Nachricht! Wir melden uns in Kuerze bei Ihnen."
}
```

**Error Responses:**
- `400` -- Missing required fields or invalid email format
- `500` -- Resend API key not configured or email sending failed

**Environment Variables:**
- `RESEND_API_KEY` (required for email delivery)
- `CONTACT_TO_EMAIL` (default: `info@mimitechai.com`)
- `CONTACT_FROM_EMAIL` (default: `MiMi Tech AI <onboarding@resend.dev>`)

---

### POST /api/newsletter

Handles newsletter signup.

---

### GET/POST /api/auth/[...nextauth]

NextAuth.js authentication endpoints. Configured in `src/lib/auth.ts`.

---

### Internal API Routes (Auth Required)

All routes under `/api/internal/` require authentication.

| Route | Method | Description |
|-------|--------|-------------|
| `/api/internal/auth` | GET/POST | Auth status and session management |
| `/api/internal/auth/login` | POST | Credential-based login |
| `/api/internal/dashboard` | GET | Dashboard data aggregation |
| `/api/internal/chat` | POST | Internal team chat |
| `/api/internal/events` | GET/POST | Event management |
| `/api/internal/time-tracking` | GET/POST | Time tracking entries |
| `/api/internal/training` | GET/POST | Training courses and progress |
| `/api/internal/training/certificates` | GET/POST | Training certificates |
| `/api/internal/users` | GET/POST | User management |
| `/api/internal/wiki` | GET/POST | Wiki article management |

---

## 2. MIMI Agent Tool Definitions

MIMI's agentic capabilities are defined in `src/lib/mimi/tool-definitions.ts`. These tools are available to the on-device LLM during inference. The LLM invokes them by outputting JSON blocks in its response.

### Tool Call Format

The LLM emits tool calls as fenced JSON blocks:

```json
{"tool": "tool_name", "parameters": {"key": "value"}}
```

The parser (`parseToolCalls`) supports:
- Standard fenced code blocks (` ```json ... ``` `)
- Inline JSON objects with a `"tool"` key
- Malformed JSON with common LLM errors (trailing commas, single quotes, unquoted keys)

---

### execute_python

Executes Python code via the Pyodide WASM runtime. Supports NumPy, Pandas, Matplotlib, SciPy, scikit-learn.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | string | Yes | Python source code to execute |

**Example:**
```json
{"tool": "execute_python", "parameters": {"code": "import numpy as np\nprint(np.mean([1,2,3,4,5]))"}}
```

---

### execute_javascript

Executes JavaScript code in a QuickJS sandbox. Supports ES2020+ syntax.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | string | Yes | JavaScript source code to execute |

---

### execute_sql

Executes SQL queries against the local SQLite WASM database.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | SQL query (CREATE, INSERT, SELECT, UPDATE, DELETE) |

---

### search_documents

Searches uploaded PDF documents using vector embeddings (ONNX) and cosine similarity.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search query |
| `limit` | number | No | Max results (default: 3) |

---

### analyze_image

Analyzes an uploaded image using a Vision Transformer model.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `question` | string | Yes | Question about the image |

---

### create_file

Creates a downloadable file in the browser.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | Yes | File type: `pdf`, `csv`, `json`, `txt`, `html`, `md` |
| `content` | string | Yes | File content |
| `filename` | string | No | Filename without extension |

Note: `pdf` type is redirected to `html` with a styled wrapper since the Blob API cannot create binary PDFs.

---

### web_search

Searches the internet via DuckDuckGo HTML API with CORS proxy fallback.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search query |
| `limit` | number | No | Max results (default: 5) |

**Proxy Strategy:**
1. Direct request to DuckDuckGo Lite
2. Direct request to DuckDuckGo HTML
3. CORS proxy via `allorigins.win`
4. CORS proxy via `corsproxy.io`

---

### calculate

Evaluates a mathematical expression safely (no `eval`). Supports `+`, `-`, `*`, `/`, `^`, `()`.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `expression` | string | Yes | Math expression (e.g., `2^10 + 5 * 3`) |

---

### read_file

Reads a file from the workspace filesystem (OPFS).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | File path (e.g., `src/main.py`) |

---

### write_file

Creates or overwrites a file in the workspace filesystem.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | File path |
| `content` | string | Yes | File content |

---

### list_files

Lists files and directories in the workspace.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | No | Directory path (default: `/`) |

---

## 3. Agent Orchestrator

The `AgentOrchestrator` (singleton at `src/lib/mimi/agent-orchestrator.ts`) routes user messages to the most appropriate specialist agent based on keyword matching and dynamic priority scoring.

### Specialist Agents

| Agent ID | Name | Capabilities |
|----------|------|-------------|
| `data-analyst` | Data Analyst | pandas, matplotlib, statistics, charts, csv, excel |
| `code-expert` | Code Expert | python, javascript, debug, refactor, explain-code |
| `document-expert` | Document Expert | rag, search, summarize, extract, pdf |
| `creative-writer` | Creative Writer | write, translate, summarize, email, report |
| `research-agent` | Research Agent | research, web-search, fact-check, compare, trends |
| `business-analyst` | Business Analyst | business, kpi, roi, finance, strategy, budget |
| `security-agent` | Security Agent | security, audit, vulnerability, privacy, gdpr |
| `translation-agent` | Translation Agent | translate, localize, i18n, multilingual |
| `design-agent` | Design Agent | design, ui, ux, color, layout, css |
| `general` | General Assistant | chat, general, help, explain |

### Task Classification

```typescript
const orchestrator = getOrchestrator();
const classification = await orchestrator.classifyTask("Erstelle ein Balkendiagramm");
// {
//   primaryAgent: 'data-analyst',
//   confidence: 0.8,
//   requiredCapabilities: ['charts'],
//   fallbackAgent: 'general',
//   skills: [...]
// }
```

### Dynamic Priority Scoring

Agents earn or lose priority based on success rates:
- Call `orchestrator.recordAgentOutcome(agentId, true/false)` after each interaction
- Success rate maps to a -2 to +2 dynamic boost added to the base priority

---

## 4. Skill System

Skills are Markdown-based knowledge documents in `src/lib/mimi/skills/builtin/`. They are loaded by the `SkillRegistry` and injected into agent prompts when relevant.

### Built-in Skills

| Skill File | Domain |
|------------|--------|
| `business-analysis.skill.md` | KPI, ROI, SWOT analysis |
| `code-generation.skill.md` | Code writing best practices |
| `data-analysis.skill.md` | Data processing and visualization |
| `document-creation.skill.md` | Report and document generation |
| `python_analysis.skill.md` | Python data analysis patterns |
| `research.skill.md` | Web research methodology |
| `security-audit.skill.md` | Security review procedures |
| `sql_database.skill.md` | SQL query patterns |
| `translation.skill.md` | Translation workflows |
| `ui-design.skill.md` | UI/UX design guidance |
| `web-search.skill.md` | Web search strategies |

Skills are matched to tasks via the `SkillRegistry.findRelevantSkills()` method, which scores skills based on keyword overlap with the user query and the active agent ID.
