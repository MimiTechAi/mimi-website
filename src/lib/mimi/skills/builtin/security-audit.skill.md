---
name: security-audit
description: Code-Sicherheitsaudit, DSGVO-Compliance und Schwachstellenanalyse
version: "1.0"
author: MIMI Tech AI
agents: ["security-agent"]
triggers:
  - sicherheit
  - security
  - schwachstelle
  - vulnerability
  - dsgvo
  - gdpr
  - audit
  - penetration
---

# Security Audit Skill

## Anwendung
Nutze diesen Skill für Sicherheitsanalysen, Code-Audits und Datenschutzprüfungen.

## Prüfbereiche

### OWASP Top 10 Checks
1. **Injection** (SQL, NoSQL, OS Command)
2. **Broken Authentication**
3. **Sensitive Data Exposure**
4. **XML External Entities (XXE)**
5. **Broken Access Control**
6. **Security Misconfiguration**
7. **Cross-Site Scripting (XSS)**
8. **Insecure Deserialization**
9. **Using Components with Known Vulnerabilities**
10. **Insufficient Logging & Monitoring**

### DSGVO/GDPR Checkliste
- [ ] Datenschutzerklärung vorhanden
- [ ] Cookie-Consent implementiert
- [ ] Recht auf Löschung umgesetzt
- [ ] Datenminimierung beachtet
- [ ] Verschlüsselung sensibler Daten
- [ ] Auftragsverarbeitung dokumentiert

### Code-Audit Template
```python
# Security-Analyse Script
vulnerabilities = []

def check_sql_injection(code):
    patterns = ['f"SELECT', "f'SELECT", '.format(', '%s' % ']
    for p in patterns:
        if p in code:
            vulnerabilities.append({
                'type': 'SQL Injection',
                'severity': '🔴 Kritisch',
                'pattern': p,
                'fix': 'Parametrisierte Queries verwenden'
            })
```

## Ausgabeformat
```markdown
## 🔒 Sicherheitsanalyse

### Zusammenfassung
| Severity | Anzahl |
|----------|--------|
| 🔴 Kritisch | X |
| 🟠 Hoch | X |
| 🟡 Mittel | X |
| 🟢 Niedrig | X |

### Befunde
#### 🔴 [Befund-Titel]
- **Beschreibung**: ...
- **Betroffene Stelle**: `datei.ts:Zeile X`
- **Empfohlener Fix**: ...
```
