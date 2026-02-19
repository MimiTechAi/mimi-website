---
description: Vollständiger Code-Review mit Build, Tests, Lint und Browser-Verifikation — der QA-Agent Workflow
---

# 🔍 Full Review Workflow — QA Agent

Vollständiger QA-Durchlauf: Build → Lint → Tests → Browser → Report.

// turbo-all

## Schritt 1: TypeScript Check

```bash
npx tsc --noEmit 2>&1 | grep "error TS" | head -20
```

Ziel: **0 neue Fehler** (bekannte pre-existing Fehler dokumentieren).

## Schritt 2: Lint-Check

```bash
npx next lint 2>&1 | tail -30
```

## Schritt 3: Unit Tests

```bash
npx jest --no-coverage --forceExit 2>&1 | tail -30
```

Bei Test-Fehlern: analysieren, sofort fixen, Tests wiederholen.

## Schritt 4: Dev-Server prüfen

```bash
lsof -i :3000 | head -3
```

Falls nicht läuft: `npm run dev` starten (im Hintergrund).

## Schritt 5: Browser-Verifikation

- `browser_subagent` → `http://localhost:3000/mimi`
- Prüfen: Seite lädt, keine Console-Errors, Chat erreichbar
- Screenshots von: Startseite + Chat-Interface
- Console auf Fehler prüfen (F12 → Console)

## Schritt 6: Report erstellen

Erstelle `walkthrough.md` mit:
- `render_diffs()` für alle geänderten Dateien
- Screenshots eingebettet
- Fehler mit Severity (critical / warning / info)
- ✅ Was funktioniert | ⚠️ Was zu prüfen ist

`notify_user` mit Report und PathsToReview.
