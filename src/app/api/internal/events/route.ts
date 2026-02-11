import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Beispiel für eine Events-API-Route zum Abrufen von Veranstaltungen
export async function GET(request: Request) {
  try {
    // Serverseitige Authentifizierungsprüfung
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({
        success: false,
        message: "Nicht authentifiziert"
      }, { status: 401 });
    }

    // Hier würde die Logik zum Abrufen von Veranstaltungen implementiert werden
    // In einer echten Anwendung würden Sie:
    // 1. Die Veranstaltungen aus der Datenbank abrufen
    // 2. Die Veranstaltungen nach Datum sortieren
    // 3. Die Teilnehmerzahlen aktualisieren

    // Beispielantwort (nur für Demonstrationszwecke)
    const events = [
      {
        id: 1,
        title: "KI-Workshop: Neueste Entwicklungen",
        date: "2025-11-15",
        time: "14:00 - 17:00",
        location: "Konferenzraum A",
        description: "Praxisorientierter Workshop zu den neuesten KI-Modellen und deren Anwendung in der Beratung.",
        attendees: 15,
        maxAttendees: 20,
        registered: true
      },
      {
        id: 2,
        title: "Team Building: Escape Room",
        date: "2025-11-22",
        time: "16:00 - 19:00",
        location: "City Escape Hamburg",
        description: "Gemeinsames Team Building in einem Escape Room mit anschließendem Dinner.",
        attendees: 8,
        maxAttendees: 12,
        registered: false
      },
      {
        id: 3,
        title: "Weihnachtsfeier 2025",
        date: "2025-12-18",
        time: "19:00 - 23:00",
        location: "Restaurant Alsterblick",
        description: "Jährliche Weihnachtsfeier mit Dinner und Unterhaltungsprogramm.",
        attendees: 0,
        maxAttendees: 50,
        registered: false
      }
    ];

    return NextResponse.json({
      success: true,
      events: events
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Fehler beim Abrufen der Veranstaltungen"
    }, { status: 500 });
  }
}