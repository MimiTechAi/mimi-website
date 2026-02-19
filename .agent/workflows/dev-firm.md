---
description: SOTA 2026 Dev-Firm Workflow - Nutze Antigravity wie ein Google DeepMind Team mit mehreren parallelen Agenten
---

# 🏢 Dev-Firm Workflow — Antigravity als Entwicklungsfirma

Starte mit `/dev-firm <Aufgabe>`. Antigravity übernimmt **alle Rollen automatisch**.

## 🧑‍💼 Chef-Agent (Orchestrator)

```
User: /dev-firm Implementiere Feature X

  ┌──────────────────────────────────────────┐
  │  🧑‍💼 CHEF-AGENT                          │
  │  1. Aufgabe analysieren                  │
  │  2. Subtasks in task.md zerlegen         │
  │  3. Abhängigkeiten erkennen              │
  │  4. Parallel-Agents delegieren           │
  │  5. QA-Abnahme durchführen               │
  │  6. walkthrough.md erstellen             │
  │  7. Nur bei Bedarf User fragen           │
  └────┬───────┬───────┬───────┬─────────────┘
       ▼       ▼       ▼       ▼
    🧠 Plan  👷 Code  👷 Code  🔍 QA
```

---

## Phase 1: Analyse & Plan (AUTO)

// turbo
1. **Codebase scannen** (parallel):
   - `grep_search` + `find_by_name` für relevante Dateien
   - `view_file_outline` für Architektur
   - Knowledge Items prüfen

2. **task.md erstellen** — 3-7 Subtasks mit Abhängigkeiten

3. **implementation_plan.md erstellen** — Dateien, Änderungen, Tests

4. **Entscheidung:**
   - < 3 Dateien → Direkt starten (`ShouldAutoProceed=true`)
   - ≥ 3 Dateien oder Architektur → `notify_user` mit Plan

---

## Phase 2: Implementation (PARALLEL)

// turbo-all

5. **Unabhängige Tasks gleichzeitig:**
   - Alle nicht-abhängigen Datei-Edits → parallel
   - Terminal-Tests → parallel im Hintergrund
   - Browser-Subagent wenn UI-Änderungen nötig

6. **Abhängige Tasks sequentiell:**
   - Erst Types/Interfaces → dann Implementation
   - Erst Engine-Layer → dann Context/Hooks → dann UI

7. Nach jeder Datei: `task.md` updaten `[/]` → `[x]`

---

## Phase 3: QA-Abnahme (AUTO)

// turbo-all

8. **TypeScript:**
```bash
npx tsc --noEmit 2>&1 | grep "error TS" | head -20
```

9. **Tests:**
```bash
npx jest --no-coverage --forceExit 2>&1 | tail -20
```

10. **Lint:**
```bash
npx next lint 2>&1 | tail -10
```

11. **Browser** (bei UI-Änderungen): `browser_subagent` → `http://localhost:3000/mimi` → Screenshots

12. **Fehler-Entscheidungsbaum:**
    - Build-Fehler → Sofort fixen → zurück zu Phase 2
    - Test-Fehler → Analysieren, max 3 Fix-Iterationen → bei Persistenz: `notify_user`
    - Lint-Warnings → Fixen wenn < 5 min, sonst akzeptieren

---

## Phase 4: Abnahme-Report (AUTO)

13. **walkthrough.md** erstellen:
    - `render_diffs()` für alle geänderten Dateien
    - Test-Ergebnisse + Screenshots
    - Zusammenfassung: Was wurde erreicht

14. **`notify_user`:**
    - ✅ Fertige Features
    - ⚠️ Was der User prüfen sollte
    - 🚀 Nächste Schritte (`/deploy`?)

---

## Chef's Entscheidungsregeln

| Situation | Entscheidung |
|---|---|
| Klare Aufgabe < 3 Dateien | Direkt implementieren, AutoProceed |
| Architektur-Entscheidung | User fragen, Plan zeigen |
| Build bricht | Sofort fixen, User nicht stören |
| Tests failen | Fixen, erst beim 3. Fehlschlag eskalieren |
| Unklare Anforderung | Sofort nachfragen — NICHT raten |
| Feature fertig | Walkthrough + Report → User |
| Unerwartete Komplexität | Zurück zu PLANNING, Plan updaten |

---

## Tipps für den User

- **Präzise Aufgabe = mehr Autonomie**: „Implementiere X mit Y für Z"
- `/full-review` jederzeit für Extra-QA nachschieben
- `/deploy` für Release nach dev-firm
- `/quick-fix` für kleine isolierte Bugs
