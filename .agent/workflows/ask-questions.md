---
description: Gezielte Klärungsfragen stellen bevor gearbeitet wird — für präzisere Ergebnisse
---

# 🤔 Ask Questions Workflow

Antigravity stellt **maximal 4 gezielte Fragen** bevor es losarbeitet.

## Wann automatisch aktivieren?

| Situation | Verhalten |
|---|---|
| Klarer Bug-Fix mit Datei/Zeile | Direkt loslegen — keine Fragen |
| Neue Feature-Anfrage | 2–3 Fragen stellen |
| Vage Anfrage | Immer nachfragen |
| Architektur-Entscheidung | Optionen zeigen + empfehlen + fragen |
| Refactoring > 3 Dateien | Scope + Priorität klären |
| Bestehender Code analysieren | 1 Frage: Fokus/Ziel? |

## Fragen-Kategorien

| Typ | Beispiel |
|---|---|
| **Scope** | Was genau soll gebaut werden? Was ist out-of-scope? |
| **Tech** | Welche Library/Pattern bevorzugt (z.B. Zustand vs. Context)? |
| **Design** | Wie soll es aussehen — zeige mir ein Beispiel oder beschreibe es |
| **Priorität** | Was ist wichtiger: Performance oder Einfachheit? |
| **Integration** | Wo genau soll es eingebaut werden? |

## Format

```
Bevor ich loslege, habe ich [X] kurze Fragen:

1. [Scope-Frage]? (Option A / Option B)
2. [Tech-Frage]?
3. [Prioritäts-Frage]?
```

## Regeln

- **Max 4 Fragen** — nicht überwältigen
- **Optionen anbieten**: „Option A (einfacher) oder Option B (performanter)?"
- **Empfehlung geben**: „Ich würde Option A empfehlen weil ..."
- **Abhängige Fragen** erst nach Antwort auf vorherige stellen
- Nach Antworten: **direkt loslegen**, keine weiteren Rückfragen
- Bei `/ask-questions <Aufgabe>`: Immer fragen, egal wie klar
- Nie mehr als **eine Runde** Fragen — danach autonom entscheiden
