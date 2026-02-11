import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// API-Route für das Dashboard zum Abrufen aller relevanten Statistiken
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

    // In einer echten Anwendung würden diese Daten aus verschiedenen Quellen abgerufen:
    // - Nachrichten aus der Chat-Datenbank
    // - Zeiteinträge aus der Zeiterfassungsdatenbank
    // - Veranstaltungen aus der Events-Datenbank
    // - Kursfortschritte aus der Trainingsdatenbank

    // Beispielantwort mit dynamischen Daten (nur für Demonstrationszwecke)
    const dashboardData = {
      stats: [
        { name: "Nachrichten", value: "24", change: "+12%" },
        { name: "Stunden diese Woche", value: "32", change: "+8%" },
        { name: "Bevorstehende Events", value: "3", change: "0%" },
        { name: "Abgeschlossene Kurse", value: "5", change: "+2" },
      ],
      quickActions: [
        { name: "Neue Nachricht", href: "/internal/chat", icon: "MessageCircle", color: "bg-blue-500" },
        { name: "Zeit erfassen", href: "/internal/time-tracking", icon: "Clock", color: "bg-green-500" },
        { name: "Events ansehen", href: "/internal/events", icon: "Calendar", color: "bg-nvidia-green" },
        { name: "Kurse", href: "/internal/training", icon: "BookOpen", color: "bg-yellow-500" },
      ],
      announcements: [
        {
          id: 1,
          title: "Neues KI-Training verfügbar",
          time: "1 Stunde ago",
          priority: "high"
        },
        {
          id: 2,
          title: "Team Meeting nächste Woche",
          time: "2 Stunden ago",
          priority: "medium"
        },
        {
          id: 3,
          title: "Serverwartung am Wochenende",
          time: "1 Tag ago",
          priority: "low"
        }
      ],
      progress: [
        { name: "Teamaktivität", value: "85%" },
        { name: "Lernfortschritt", value: "72%" },
        { name: "Abgeschlossene Kurse", value: "5/12" },
      ]
    };

    return NextResponse.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Fehler beim Abrufen der Dashboard-Daten"
    }, { status: 500 });
  }
}