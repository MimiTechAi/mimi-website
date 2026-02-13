# MIMI Agent — Implementation Plan for Open Items
## Stand: 13. Februar 2026

---

## ✅ Abgeschlossene Items

### 🔴 PRIORITY 1 — Critical (Kernfunktionalität)

#### ✅ 1.1 SQLite Binary Persistence (database.ts)
- `openDatabase()` nutzt jetzt `fs.readFileBuffer(path)` → `new SQL.Database(new Uint8Array(buffer))`
- `saveDatabase()` nutzt jetzt `fs.writeFile(path, data.buffer)` → ArrayBuffer direkt in OPFS
- **Status: DONE** ✅

#### ✅ 1.2 Tool Execution Loop — Self-Loop Guard
- Deduplizierungs-Check: `hash(tool + params)` jeder Iteration wird gespeichert
- Wenn gleicher Hash 2x auftritt → sofortiger Abbruch mit Warning an User
- **Status: DONE** ✅

#### ✅ 1.3 Plan Status nie auf 'complete' gesetzt
- Nach der while-Loop: Prüfe ob alle Steps `done` oder `failed` → `activePlan.status = 'complete'`
- Emit `AgentEvents.planComplete(...)` für UI-Update
- `agentMemory.storeTaskSummary()` wird jetzt korrekt ausgelöst
- **Status: DONE** ✅

### 🟠 PRIORITY 2 — High (UX-Verbesserungen)

#### ✅ 2.1 Monaco Editor Integration (Editor Tab)
- Dynamic import via `next/dynamic` (SSR-safe)
- `@monaco-editor/react` mit `vs-dark` Theme, Language Mapping (15+ Sprachen)
- Read-only Mode, keine Minimap, angepasste Scrollbar
- **Status: DONE** ✅

#### ✅ 2.2 Streaming Tool Results in Chat
- Nach `executeToolCall()`: Yield formatierte Zusammenfassung
- Success: `✅ **tool_name** (1.2s): result...`
- Error: `❌ **tool_name** fehlgeschlagen: errMsg`
- **Status: DONE** ✅

#### ✅ 2.3 AgentThinkingBar zeigt leeren Content
- In `singleGeneration()`: `AgentEvents.thinkingContent(outputBuffer)` wird jetzt emitted
- ThinkingBar zeigt CoT-Inhalt live an
- **Status: DONE** ✅

### 🟡 PRIORITY 3 — Medium (Robustheit & Tests)

#### ✅ 3.1 Missing Unit Tests (2 neue Test-Dateien)
- `agent-events.test.ts` — 22 Tests: EventBus emit, subscribe, batching, snapshot, singleton, error isolation, AgentEvents helpers
- `task-planner.test.ts` — 27 Tests: shouldPlan heuristic, createPlan, updateStepStatus, canRetry, getNextStep, getProgress, addNotes, addDeliverable
- **Ergebnis: 243/244 Tests pass** (1 pre-existing failure in agent-orchestrator)
- **Status: DONE** ✅

---

## 🔲 Verbleibende Items

### 🟡 PRIORITY 3 — Medium

#### 3.2 File Tab: Drag & Drop + File Icons
- File-Extension → Icon Mapping
- HTML5 Drag & Drop API
- Kontextmenü

#### 3.3 SandboxPanel als eigene Komponente
- Extrahiere 271 Zeilen zu `SandboxPanel.tsx`
- page.tsx wird leichter wartbar

### 🟢 PRIORITY 4 — Nice to Have

#### 4.1 Sandbox Minimize/Maximize (noop buttons)
#### 4.2 Browser Tab: Render HTML Artifacts  
#### 4.3 Context Window Overflow Protection

---

## 📊 Zusammenfassung

| Kategorie | Geplant | Erledigt | Verbleibend |
|-----------|---------|----------|-------------|
| Critical  | 3       | 3        | 0           |
| High      | 3       | 3        | 0           |
| Medium    | 3       | 1        | 2           |
| Nice-have | 3       | 0        | 3           |
| **Total** | **12**  | **7**    | **5**       |

**Build: ✅ PASS (exit code 0)**
**Tests: ✅ 243/244 pass**
