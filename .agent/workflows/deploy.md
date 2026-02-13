---
description: Git commit, push und Deployment-Verifikation — der Release-Workflow
---

# 🚀 Deploy Workflow

Commit, push und verify.

## Schritt 1: Status prüfen

// turbo
```bash
git status
```

## Schritt 2: Staged Changes prüfen

// turbo
```bash
git diff --stat
```

## Schritt 3: Commit erstellen

```bash
git add -A && git commit -m "<TYPE>: <beschreibung>"
```

Commit-Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `perf`, `test`

## Schritt 4: Push

```bash
git push origin main
```

## Schritt 5: Deployment-Status prüfen

- Falls Vercel: Warte 60s, dann prüfe Deployment-URL
- Falls Cloud Run: Nutze `mcp_cloudrun_get_service`

## Schritt 6: Post-Deploy Smoke Test

- `browser_subagent` → Öffne Production-URL
- Screenshot machen
- `notify_user` mit Ergebnis
