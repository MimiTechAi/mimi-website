# Interner Mitarbeiterbereich

## Struktur

### Hauptbereiche
- `/internal` - Hauptseite und Layout
- `/internal/(auth)` - Authentifizierung (Login/Registrierung)
- `/internal/(dashboard)` - Hauptdashboard und Funktionsbereiche

### Funktionsbereiche
1. **Chat** - Echtzeit-Kommunikation
2. **Zeiterfassung** - Arbeitszeiterfassung und Projektmanagement
3. **Events** - Firmen-Events und Ankündigungen
4. **Training** - Schulungsmaterialien und Kursverwaltung
5. **Wiki** - Internes Wissensmanagement

### Technische Umsetzung
- **Frontend**: Next.js 15.3.5 mit React 19
- **Backend**: Supabase Integration
- **Authentifizierung**: NextAuth.js
- **Echtzeit**: WebSockets für Chat
- **UI**: Radix UI und Tailwind CSS