import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { compare } from "bcryptjs";

// SECURITY: Demo-only user lookup. Replace with real database query before production.
async function getUserByEmail(email: string) {
  if (process.env.NODE_ENV === "production" && !process.env.DEMO_AUTH_ENABLED) {
    console.error("[AUTH] Demo credentials disabled in production.");
    return null;
  }

  return {
    id: "1",
    name: "Demo User",
    email: email,
    password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S",
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

    // Return success with user info (session management handled by NextAuth)
    // NOTE: Use NextAuth's signIn() on the client side for proper session creation.
    // This endpoint validates credentials only; it does NOT issue tokens.
    return NextResponse.json({
      success: true,
      message: "Anmeldung erfolgreich",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: "employee"
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Serverfehler bei der Anmeldung"
    }, { status: 500 });
  }
}