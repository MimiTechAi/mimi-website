---
name: business-analysis
description: KPI-Berechnung, ROI-Analyse, Geschäftsstrategien und Finanzmodelle
version: "1.0"
author: MIMI Tech AI
agents: ["business-analyst"]
triggers:
  - kpi
  - roi
  - business
  - umsatz
  - budget
  - kosten
  - strategie
  - swot
---

# Business Analysis Skill

## Anwendung
Nutze diesen Skill für geschäftliche Analysen, Finanzberechnungen und strategische Bewertungen.

## Templates

### KPI-Dashboard
```python
import pandas as pd

kpis = {
    'Umsatz': {'Aktuell': 150000, 'Ziel': 200000, 'Einheit': '€'},
    'Marge': {'Aktuell': 35, 'Ziel': 40, 'Einheit': '%'},
    'Kundenanzahl': {'Aktuell': 1250, 'Ziel': 1500, 'Einheit': ''},
    'Churn Rate': {'Aktuell': 5.2, 'Ziel': 3.0, 'Einheit': '%'},
}

df = pd.DataFrame(kpis).T
df['Erreichung'] = (df['Aktuell'] / df['Ziel'] * 100).round(1)
df['Status'] = df['Erreichung'].apply(
    lambda x: '🟢' if x >= 90 else ('🟡' if x >= 70 else '🔴')
)
print(df.to_markdown())
```

### ROI-Berechnung
```python
def calculate_roi(investment, returns, period_months):
    roi = ((returns - investment) / investment) * 100
    monthly_roi = roi / period_months
    payback = investment / (returns / period_months)
    return {
        'ROI': f'{roi:.1f}%',
        'Monatlicher ROI': f'{monthly_roi:.1f}%',
        'Payback-Periode': f'{payback:.1f} Monate'
    }
```

### SWOT-Analyse Format
```markdown
## SWOT-Analyse

| | Positiv | Negativ |
|---|---------|---------|
| **Intern** | 💪 Stärken | ⚠️ Schwächen |
| **Extern** | 🚀 Chancen | 🔴 Risiken |
```

## Ausgabeformat
- Immer mit konkreten Zahlen
- Visualisierungen via matplotlib wenn möglich
- Handlungsempfehlungen mit Priorität
