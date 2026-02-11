---
name: translation
description: Professionelle Übersetzungen, Lokalisierung und i18n-Dateien
version: "1.0"
author: MIMI Tech AI
agents: ["translation-agent"]
triggers:
  - übersetze
  - translate
  - übersetzung
  - lokalisierung
  - i18n
  - mehrsprachig
---

# Translation Skill

## Unterstützte Sprachen
| Code | Sprache | Flag |
|------|---------|------|
| de-DE | Deutsch | 🇩🇪 |
| en-US | English | 🇺🇸 |
| fr-FR | Français | 🇫🇷 |
| es-ES | Español | 🇪🇸 |
| it-IT | Italiano | 🇮🇹 |
| pt-BR | Português | 🇧🇷 |

## Workflow

### 1. Sprache erkennen
- Automatische Quellsprach-Erkennung
- Zielsprache(n) identifizieren

### 2. Übersetzen
- Kontext-basierte Übersetzung
- Fachterminologie beibehalten
- Kulturelle Anpassung

### 3. Qualitätssicherung
- Grammatik- und Rechtschreibprüfung
- Konsistenz in Fachbegriffen
- Natürlicher Sprachfluss

## Ausgabeformate

### Tabelle (Multi-Sprach)
```markdown
| 🇩🇪 Deutsch | 🇺🇸 English | 🇫🇷 Français |
|-------------|-------------|-------------|
| Benutzer    | User        | Utilisateur |
| Einstellungen | Settings | Paramètres |
```

### i18n JSON
```json
{
  "common": {
    "save": {
      "de": "Speichern",
      "en": "Save",
      "fr": "Enregistrer"
    }
  }
}
```

### i18n Key-Value
```typescript
// de.ts
export default {
  'nav.home': 'Startseite',
  'nav.about': 'Über uns',
  'nav.contact': 'Kontakt',
} as const;
```

## Besonderheiten
- Formale vs. informelle Anrede beachten (Sie/Du)
- Zahlen- und Datumsformate anpassen
- Maßeinheiten konvertieren wenn nötig
