import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// API-Route zum Abrufen der Benutzerliste mit Online-Status
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

    // In einer echten Anwendung würden diese Daten aus der Datenbank abgerufen
    // und der Online-Status würde durch Heartbeat-Mechanismen aktualisiert werden
    
    // Beispielantwort mit Benutzerdaten (nur für Demonstrationszwecke)
    const users = [
      {
        id: 1,
        name: "Max Mustermann",
        email: "max.mustermann@mimitechai.com",
        avatar: "/avatars/max.jpg",
        isOnline: true,
        lastSeen: new Date().toISOString()
      },
      {
        id: 2,
        name: "Erika Musterfrau",
        email: "erika.musterfrau@mimitechai.com",
        avatar: "/avatars/erika.jpg",
        isOnline: true,
        lastSeen: new Date().toISOString()
      },
      {
        id: 3,
        name: "Anna Beispiel",
        email: "anna.beispiel@mimitechai.com",
        avatar: "/avatars/anna.jpg",
        isOnline: false,
        lastSeen: new Date(Date.now() - 3600000).toISOString() // 1 Stunde ago
      },
      {
        id: 4,
        name: "Tom Test",
        email: "tom.test@mimitechai.com",
        avatar: "/avatars/tom.jpg",
        isOnline: true,
        lastSeen: new Date().toISOString()
      }
    ];

    return NextResponse.json({
      success: true,
      users: users
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Fehler beim Abrufen der Benutzer"
    }, { status: 500 });
  }
}