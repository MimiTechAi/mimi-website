---
description: Schneller Bug-Fix mit automatischer Verifikation — für kleine Fixes die sofort erledigt werden müssen
---

# ⚡ Quick-Fix Workflow

Für kleine, klar definierte Bug-Fixes oder Änderungen.

// turbo-all

## Schritte

1. Finde die betroffene(n) Datei(en) mit `grep_search`

2. Analysiere den Bug mit `view_file` / `view_code_item`

3. Fix implementieren mit `replace_file_content`

4. TypeScript prüfen:
```bash
npx tsc --noEmit 2>&1 | grep "error TS" | head -20
```

5. Tests laufen lassen:
```bash
npx jest --testPathPattern="<betroffene-datei>" --no-coverage --forceExit
```

6. Bei Erfolg: `notify_user` mit kurzer Zusammenfassung

7. Bei Fehlern: Fix iterieren, zurück zu Schritt 3
