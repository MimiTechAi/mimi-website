---
description: SOTA 2026 Dev-Firm Workflow - Nutze Antigravity wie ein Google DeepMind Team mit mehreren parallelen Agenten
---

# 🏢 Dev-Firm Workflow — Antigravity als Entwicklungsfirma

Starte mit `/dev-firm <Aufgabe>`. Antigravity übernimmt **alle Rollen automatisch**.

## 🧑‍💼 Chef-Agent (Orchestrator) — Läuft automatisch

Der Chef-Agent steuert den gesamten Ablauf. Du musst nur die Aufgabe nennen.

### Automatischer Ablauf:

```
User: /dev-firm Implementiere Feature X

  ┌─────────────────────────────────────────────────┐
  │  🧑‍💼 CHEF-AGENT (Orchestrator)                  │
  │                                                 │
  │  1. Aufgabe analysieren                         │
  │  2. In Subtasks zerlegen (task.md)              │
  │  3. Abhängigkeiten erkennen                     │
  │  4. Agents delegieren (parallel wo möglich)     │
  │  5. Fortschritt überwachen (task_boundary)      │
  │  6. Abnahme-Test durchführen                    │
  │  7. Ergebnis-Report erstellen (walkthrough.md)  │
  │  8. Nur bei Bedarf User fragen                  │
  └───┬────────┬────────┬────────┬──────────────────┘
      │        │        │        │
      ▼        ▼        ▼        ▼
   🧠 Plan  👷 Code  👷 Code  🔍 QA
```

---

## Phase 1: Chef analysiert & plant (AUTO)

Der Chef-Agent macht **ohne Rückfrage**:

1. Codebase scannen:
   - `grep_search` + `find_by_name` für relevante Dateien
   - `view_file_outline` für Architektur-Verständnis
   - Knowledge Items prüfen für existierendes Wissen
// turbo
2. Task-Zerlegung in `task.md`:
   - Hauptaufgabe in 3-7 Subtasks zerlegen
   - Abhängigkeiten markieren (was muss zuerst)
   - Geschätzten Aufwand pro Subtask notieren

3. Implementation Plan erstellen (`implementation_plan.md`):
   - Betroffene Dateien identifizieren
   - Änderungen pro Komponente beschreiben
   - Test-Strategie definieren

4. **Chef entscheidet**: Plan dem User zeigen oder direkt starten?
   - Kleine Änderungen (< 3 Dateien) → Direkt starten, ShouldAutoProceed=true
   - Große Änderungen (> 3 Dateien, Architektur) → User fragen

---

## Phase 2: Chef delegiert an Engineers (PARALLEL)

// turbo-all

5. **Unabhängige Tasks parallel starten:**
   - Alle Datei-Edits die keine Abhängigkeiten haben → gleichzeitig
   - Terminal-Commands im Hintergrund parallel
   - Browser-Subagent wenn UI-Arbeit nötig

6. **Abhängige Tasks sequentiell:**
   - Erst Types/Interfaces, dann Implementation
   - Erst Backend, dann Frontend das darauf aufbaut

7. Nach JEDER Datei: `task.md` updaten (`[/]` → `[x]`)

---

## Phase 3: Chef startet QA-Abnahme (AUTO)

// turbo-all

8. Build-Check:
```bash
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
```

9. Tests:
```bash
npx jest --no-coverage --forceExit 2>&1
```

10. Lint:
```bash
npx next lint 2>&1 | tail -20
```

11. Bei UI-Änderungen: Browser-Subagent Screenshots

12. **Chef-Entscheidung bei Fehlern:**
    - Build-Fehler → Sofort fixen, zurück zu Phase 2
    - Test-Fehler → Analysieren, fixen, Tests nochmal
    - Lint-Warnings → Fixen wenn einfach, sonst akzeptieren

---

## Phase 4: Chef erstellt Abnahme-Report (AUTO)

13. `walkthrough.md` erstellen:
    - Alle Änderungen mit `render_diffs()`
    - Test-Ergebnisse
    - Screenshots bei UI-Änderungen
    - Zusammenfassung: Was wurde erreicht

14. `notify_user` mit finalem Report:
    - ✅ Was funktioniert
    - ⚠️ Was der User noch prüfen sollte
    - 🚀 Nächste Schritte (deploy?)

---

## Chef's Entscheidungsregeln

| Situation | Chef-Entscheidung |
|---|---|
| Klare Aufgabe, < 3 Dateien | Direkt implementieren, AutoProceed |
| Architektur-Entscheidung nötig | User fragen, Plan zeigen |
| Build bricht | Sofort fixen, nicht User nerven |
| Tests failen | Analysieren + fixen, erst bei 3. Fehlschlag User informieren |
| Unklare Anforderung | Sofort nachfragen, NICHT raten |
| Feature fertig | Walkthrough + Report, User informieren |

---

## Tipps für den User

- **Je präziser deine Aufgabe, desto autonomer arbeitet der Chef**
- Gute Prompts: „Implementiere X mit Y Technologie für Z Anwendungsfall"
- Schlechte Prompts: „Mach was cooles"
- Du kannst jederzeit `/full-review` nachschieben für Extra-QA
- Du kannst jederzeit `/deploy` für Release nutzen
