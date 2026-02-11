import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hash } from "bcryptjs";

function validateEmail(email: string): boolean {
  const mimitechaiEmailRegex = /^[^\s@]+@mimitechai\.com$/;
  return mimitechaiEmailRegex.test(email);
}

// API-Route für die Registrierung
export async function POST(request: Request) {
  try {
    // Serverseitige Authentifizierungsprüfung
    const session = await getServerSession(authOptions);
    // Für die Registrierung prüfen wir nicht die Authentifizierung, da der Benutzer noch kein Konto hat
    
    const body = await request.json();
    const { name, email, password } = body;

    // Validierung der E-Mail-Adresse
    if (!validateEmail(email)) {
      return NextResponse.json({
        success: false,
        message: "Bitte verwenden Sie Ihre Firmen-E-Mail-Adresse (@mimitechai.com)"
      }, { status: 400 });
    }

    // Strenge Passwortvalidierung wie auf der Login-Seite
    if (!password || password.length < 8) {
      return NextResponse.json({
        success: false,
        message: "Das Passwort muss mindestens 8 Zeichen lang sein"
      }, { status: 400 });
    }

    // Überprüfung der Passwortkomplexität
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
    
    const passwordStrength = (hasUpperCase ? 1 : 0) + (hasNumbers ? 1 : 0) + (hasSpecialChar ? 1 : 0);
    
    if (passwordStrength < 3) {
      return NextResponse.json({
        success: false,
        message: "Das Passwort muss Großbuchstaben, Zahlen und Sonderzeichen enthalten"
      }, { status: 400 });
    }

    // Hier würde die Registrierungslogik implementiert werden
    // In einer echten Anwendung würden Sie:
    // 1. Prüfen, ob der Benutzer bereits existiert
    // 2. Das Passwort hashen
    // 3. Den Benutzer in der Datenbank speichern
    // 4. Ein Bestätigungs-E-Mail senden

    // Beispielantwort (nur für Demonstrationszwecke)
    if (email && password && name) {
      // In einer echten Anwendung würden Sie hier das Passwort hashen
      const hashedPassword = await hash(password, 12);
      
      // In einer echten Anwendung würden Sie hier den Benutzer in der Datenbank speichern
      // await db.users.create({
      //   name,
      //   email,
      //   password: hashedPassword
      // });
      
      return NextResponse.json({
        success: true,
        message: "Registrierung erfolgreich",
        user: {
          id: 1,
          name: name,
          email: email,
          role: "employee"
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Ungültige Registrierungsdaten"
      }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Serverfehler bei der Registrierung"
    }, { status: 500 });
  }
}

// API-Route für die E-Mail-Validierung
export async function GET(request: Request) {
  try {
    // Serverseitige Authentifizierungsprüfung
    const session = await getServerSession(authOptions);
    // Für die E-Mail-Validierung prüfen wir nicht die Authentifizierung
    
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({
        valid: false,
        message: "E-Mail-Adresse erforderlich"
      });
    }

    const isValid = validateEmail(email);
    
    return NextResponse.json({
      valid: isValid,
      message: isValid 
        ? "Gültige Firmen-E-Mail-Adresse" 
        : "Bitte verwenden Sie Ihre Firmen-E-Mail-Adresse (@mimitechai.com)"
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Fehler bei der E-Mail-Validierung"
    }, { status: 500 });
  }
}