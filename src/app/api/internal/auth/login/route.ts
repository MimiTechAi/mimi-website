import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { compare } from "bcryptjs";

// Beispiel-Datenbankabfrage (in einer echten Anwendung würde dies eine echte Datenbankabfrage sein)
async function getUserByEmail(email: string) {
  // In einer echten Anwendung würden Sie hier die Datenbank abfragen
  // Beispiel für ein gehashtes Passwort: "password123" -> "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S"
  return {
    id: "1",
    name: "Max Mustermann",
    email: email,
    password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S", // password123
  };
}

function validateEmail(email: string): boolean {
  const mimitechaiEmailRegex = /^[^\s@]+@mimitechai\.com$/;
  return mimitechaiEmailRegex.test(email);
}

// API-Route für das Login
export async function POST(request: Request) {
  try {
    // Serverseitige Authentifizierungsprüfung
    const session = await getServerSession(authOptions);
    // Für das Login prüfen wir nicht die Authentifizierung, da der Benutzer noch nicht eingeloggt ist
    
    const body = await request.json();
    const { email, password, rememberMe } = body;

    // Validierung der E-Mail-Adresse
    if (!validateEmail(email)) {
      return NextResponse.json({
        success: false,
        message: "Bitte verwenden Sie Ihre Firmen-E-Mail-Adresse (@mimitechai.com)"
      }, { status: 400 });
    }

    // Validierung des Passworts
    if (!password || password.length < 8) {
      return NextResponse.json({
        success: false,
        message: "Das Passwort muss mindestens 8 Zeichen lang sein"
      }, { status: 400 });
    }

    // Benutzer abrufen und Passwort überprüfen
    const user = await getUserByEmail(email);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "Ungültige Anmeldedaten"
      }, { status: 401 });
    }

    const isPasswordValid = await compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        message: "Ungültige Anmeldedaten"
      }, { status: 401 });
    }

    // Beispielantwort (nur für Demonstrationszwecke)
    if (email && password) {
      // In einer echten Anwendung würden Sie hier ein echtes JWT generieren
      const token = "demo-jwt-token";
      
      return NextResponse.json({
        success: true,
        message: "Anmeldung erfolgreich",
        token: token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: "employee"
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Ungültige Anmeldedaten"
      }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Serverfehler bei der Anmeldung"
    }, { status: 500 });
  }
}