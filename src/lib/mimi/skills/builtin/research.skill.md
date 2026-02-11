---
name: research
description: Web-Recherche, Faktencheck und Wissensaggregation
version: "1.0"
author: MIMI Tech AI
agents: ["research-agent"]
triggers:
  - recherche
  - research
  - faktencheck
  - vergleich
  - benchmark
  - studie
  - trend
---

# Research Skill

## Anwendung
Nutze diesen Skill für strukturierte Recherche und Faktencheck.

## Workflow

### 1. Fragestellung definieren
- Hauptfrage isolieren
- Unterfragen ableiten
- Suchanfragen formulieren

### 2. Informationen sammeln
- Web-Suche durchführen (wenn verfügbar)
- Dokumente durchsuchen (über RAG)
- Fakten aus Konversationshistorie nutzen

### 3. Analyse
```python
# Vergleichsanalyse Template
import pandas as pd

comparison = pd.DataFrame({
    'Kriterium': ['Preis', 'Leistung', 'Support'],
    'Option A': ['€100', 'Hoch', '24/7'],
    'Option B': ['€80', 'Mittel', 'Werktags'],
})
print(comparison.to_markdown(index=False))
```

### 4. Ergebnis formatieren
- Strukturierte Zusammenfassung
- Quellenangaben
- Zuverlässigkeitsbewertung (⭐⭐⭐⭐⭐)
- Empfehlung mit Begründung

## Ausgabeformat
```markdown
## 🔍 Recherche-Ergebnis: [Thema]

### Zusammenfassung
[Kernaussage in 2-3 Sätzen]

### Ergebnisse
| Aspekt | Ergebnis | Quelle |
|--------|----------|--------|
| ...    | ...      | ...    |

### Bewertung
Zuverlässigkeit: ⭐⭐⭐⭐☆
Vollständigkeit: ⭐⭐⭐☆☆

### Empfehlung
[Konkrete Handlungsempfehlung]
```
