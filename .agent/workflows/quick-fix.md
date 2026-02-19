---
description: Schneller Bug-Fix mit automatischer Verifikation — für kleine Fixes die sofort erledigt werden müssen
---

# ⚡ Quick-Fix Workflow

Für klar definierte Bug-Fixes. Ziel: Fix < 5 Minuten, sofort verifiziert.

// turbo-all

## Schritte

1. **Ursache finden:**
```bash
# Grep nach dem Fehler-Pattern
grep -r "<fehler-pattern>" src/ --include="*.ts" --include="*.tsx" -l
```

2. **Betroffene Stelle analysieren** mit `view_file` / `view_code_item`

3. **Fix implementieren** mit `replace_file_content` oder `multi_replace_file_content`

4. **TypeScript prüfen:**
```bash
npx tsc --noEmit 2>&1 | grep "error TS" | head -10
```

5. **Betroffene Tests laufen lassen:**
```bash
npx jest --testPathPattern="<dateiname>" --no-coverage --forceExit 2>&1 | tail -15
```

6. **Bei Erfolg:** `notify_user` mit:
   - Was war das Problem (Root Cause)
   - Was wurde geändert (1-2 Sätze)
   - Ob Deploy nötig ist

7. **Bei Fehlern:** Fix iterieren → zurück zu Schritt 3
   - Max 3 Iterationen, dann Strategie neu bewerten

## Wann NOT zu nutzen

- Bug betrifft > 5 Dateien → `/dev-firm` nutzen
- Ursache unklar → erst `/ask-questions` dann `/dev-firm`
- Architektur-Change nötig → `/dev-firm` mit neuem Plan
