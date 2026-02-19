---
description: Gezielte Klärungsfragen stellen bevor gearbeitet wird — für präzisere Ergebnisse
---

# 🤔 Ask Questions Workflow

Antigravity stellt **2-4 gezielte Fragen** bevor es losarbeitet, um Anfragen präzise zu verstehen.

## Wann automatisch aktivieren?

| Situation | Verhalten |
|---|---|
| Klarer Bug-Fix ("Fix Zeile X") | Direkt loslegen — keine Fragen |
| Neue Feature-Anfrage | **2-3 Fragen stellen** |
| Vage Anfrage ("mach was cooles") | **Immer nachfragen** |
| Architektur-Entscheidung | **Optionen zeigen + fragen** |
| Refactoring > 3 Dateien | **Scope klären** |

## Fragen-Kategorien

**Scope:** Was genau soll gebaut werden? Was ist out-of-scope?
**Tech:** Welche Technologie/Library bevorzugt?
**Design:** Wie soll es aussehen / sich anfühlen?
**Priorität:** Was ist am wichtigsten wenn Tradeoffs nötig sind?
**Integration:** Wo soll es eingebaut werden?

## Format

```
Bevor ich loslege, habe ich X kurze Fragen:

1. [Scope-Frage]?
2. [Tech/Design-Frage]?
3. [Prioritäts-Frage]?
```

## Regeln

- **Max 4 Fragen** — nicht überwältigen
- **Konkrete Optionen anbieten** wenn möglich: "Option A oder B?"
- **Abhängige Fragen** erst stellen wenn vorherige beantwortet
- Nach Antworten: **direkt loslegen**, keine weiteren Rückfragen
- Bei `/ask-questions <Aufgabe>`: Immer Fragen stellen, egal wie klar die Aufgabe scheint
