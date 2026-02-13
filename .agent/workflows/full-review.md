---
description: Vollständiger Code-Review mit Build, Tests, Lint und Browser-Verifikation — der QA-Agent Workflow
---

# 🔍 Full Review Workflow — QA Agent

Nutze diesen Workflow wenn du willst, dass Antigravity den gesamten Code wie ein QA-Engineer prüft.

// turbo-all

## Schritt 1: Build-Check

```bash
npx tsc --noEmit 2>&1 | tail -20
```

## Schritt 2: Lint-Check

```bash
npx next lint 2>&1 | tail -30
```

## Schritt 3: Unit Tests

```bash
npx jest --no-coverage --forceExit 2>&1
```

## Schritt 4: Bundle-Analyse

```bash
npx next build 2>&1 | tail -40
```

## Schritt 5: Browser-Verifikation (wenn UI)

- Starte `browser_subagent` 
- Öffne `http://localhost:3000`
- Mache Screenshots von allen wichtigen Seiten
- Prüfe Console auf Fehler

## Schritt 6: Report erstellen

- Erstelle `walkthrough.md` mit allen Ergebnissen
- Screenshots einbetten
- Fehler auflisten mit Severity
- `notify_user` mit Report
