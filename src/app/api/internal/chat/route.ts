import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// In-Memory-Speicher für Chat-Nachrichten (replace with database in production)
const MAX_MESSAGES = 500;
const MAX_CONNECTED_CLIENTS = 100;
let messages: any[] = [
  { 
    id: 1, 
    user: "Max Mustermann", 
    content: "Hallo zusammen!", 
    time: "10:30",
    avatar: "/avatars/max.jpg",
    isOnline: true,
    type: "text"
  },
  { 
    id: 2, 
    user: "Erika Musterfrau", 
    content: "Guten Morgen! Wie geht's?", 
    time: "10:32",
    avatar: "/avatars/erika.jpg",
    isOnline: true,
    type: "text"
  },
  { 
    id: 3, 
    user: "Max Mustermann", 
    content: "Mir geht's gut, danke! Habt ihr schon die neuen KI-Modelle ausprobiert?", 
    time: "10:35",
    avatar: "/avatars/max.jpg",
    isOnline: true,
    type: "text"
  },
];

// In-Memory-Speicher für verbundene Clients (in einer echten Anwendung würde dies WebSocket-Verbindungen sein)
let connectedClients: any[] = [];

// API-Route zum Abrufen von Nachrichten
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

    // In einer echten Anwendung würden Sie:
    // 1. Die Nachrichten aus der Datenbank abrufen
    // 2. Die Nachrichten nach Zeitstempel sortieren
    // 3. Die Benutzerinformationen zu den Nachrichten hinzufügen

    return NextResponse.json({
      success: true,
      messages: messages
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Fehler beim Abrufen der Nachrichten"
    }, { status: 500 });
  }
}

// API-Route zum Senden von Nachrichten
export async function POST(request: Request) {
  try {
    // Serverseitige Authentifizierungsprüfung
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({
        success: false,
        message: "Nicht authentifiziert"
      }, { status: 401 });
    }

    const body = await request.json();
    const { content, userId, userName, type, fileName, fileSize } = body;

    // In einer echten Anwendung würden Sie:
    // 1. Die Nachricht in der Datenbank speichern
    // 2. Die Nachricht an alle verbundenen Clients senden (bei Echtzeit-Chat)

    if ((content || (type === "file" && fileName)) && userId) {
      const newMessage = {
        id: messages.length + 1,
        user: userName || "Unbekannter Benutzer",
        content: content,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: `/avatars/user-${userId}.jpg`,
        isOnline: true,
        type: type || "text",
        fileName: fileName,
        fileSize: fileSize
      };

      // Nachricht zur Liste hinzufügen (enforce size limit to prevent memory exhaustion)
      messages.push(newMessage);
      if (messages.length > MAX_MESSAGES) {
        messages = messages.slice(-MAX_MESSAGES);
      }

      // In einer echten Anwendung würden Sie hier die Nachricht an alle verbundenen Clients senden
      // Für dieses Beispiel simulieren wir es mit einem einfachen Mechanismus
      notifyClients(newMessage);

      return NextResponse.json({
        success: true,
        message: "Nachricht erfolgreich gesendet",
        newMessage: newMessage
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Ungültige Nachrichtendaten"
      }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Fehler beim Senden der Nachricht"
    }, { status: 500 });
  }
}

// Funktion zum Benachrichtigen verbundener Clients
function notifyClients(message: any) {
  // In einer echten Anwendung würden Sie hier WebSocket-Nachrichten senden
  // Für dieses Beispiel aktualisieren wir einfach den In-Memory-Speicher
  connectedClients.forEach(client => {
    // In einer echten Implementierung würde dies eine WebSocket-Nachricht senden
    // client.send(JSON.stringify(message));
  });
}

// API-Route zum Verbinden von Clients (für Echtzeit-Benachrichtigungen)
export async function PUT(request: Request) {
  try {
    // Serverseitige Authentifizierungsprüfung
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({
        success: false,
        message: "Nicht authentifiziert"
      }, { status: 401 });
    }

    const body = await request.json();
    const { clientId } = body;

    if (clientId) {
      // Enforce client limit to prevent memory exhaustion
      if (connectedClients.length >= MAX_CONNECTED_CLIENTS) {
        return NextResponse.json({
          success: false,
          message: "Maximale Anzahl verbundener Clients erreicht"
        }, { status: 429 });
      }
      // Client zur Liste der verbundenen Clients hinzufügen
      connectedClients.push({ id: clientId });
      
      return NextResponse.json({
        success: true,
        message: "Client erfolgreich verbunden"
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Ungültige Client-Daten"
      }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Fehler beim Verbinden des Clients"
    }, { status: 500 });
  }
}

// API-Route zum Trennen von Clients
export async function DELETE(request: Request) {
  try {
    // Serverseitige Authentifizierungsprüfung
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({
        success: false,
        message: "Nicht authentifiziert"
      }, { status: 401 });
    }

    const body = await request.json();
    const { clientId } = body;

    if (clientId) {
      // Client aus der Liste der verbundenen Clients entfernen
      connectedClients = connectedClients.filter(client => client.id !== clientId);
      
      return NextResponse.json({
        success: true,
        message: "Client erfolgreich getrennt"
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Ungültige Client-Daten"
      }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Fehler beim Trennen des Clients"
    }, { status: 500 });
  }
}