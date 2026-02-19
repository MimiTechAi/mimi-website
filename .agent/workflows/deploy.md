---
description: Git commit, push und Deployment-Verifikation — der Release-Workflow
---

# 🚀 Deploy Workflow

Commit, push und verify. Nutze semantic commit messages.

## Schritt 1: Status + Diff prüfen

// turbo
```bash
git status && git diff --stat
```

## Schritt 2: Alle Änderungen stagen + committen

```bash
git add -A && git commit -m "<TYPE>(<scope>): <kurze beschreibung>

<optionaler body: was wurde warum geändert>"
```

**Commit-Types:** `feat` | `fix` | `perf` | `refactor` | `docs` | `chore` | `test`

> Beispiele:
> - `fix(chat): replace rAF with queueMicrotask in AgentEventBus`
> - `feat(engine): add shader warmup before first generation`
> - `perf(css): remove content-visibility:auto from chat-messages`

## Schritt 3: Push

// turbo
```bash
git push origin main
```

Falls kein upstream gesetzt:
```bash
git push --set-upstream origin main
```

## Schritt 4: Deployment-Status prüfen

- **Vercel:** Warte 60–90s → prüfe `https://mimitechai.com` oder Vercel Dashboard
- **Cloud Run:** `mcp_cloudrun_get_service` → prüfe `status.url`

## Schritt 5: Post-Deploy Smoke Test

// turbo
```bash
curl -s -o /dev/null -w "%{http_code}" https://mimitechai.com
```

- Erwarteter Code: `200`
- Danach `browser_subagent` → Screenshot der Prod-URL → `notify_user`
