import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// API-Route zum Abrufen von Zertifikaten für einen Benutzer
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

    // In einer echten Anwendung würden diese Daten aus der Datenbank abgerufen werden
    
    // Beispielantwort mit Zertifikatsdaten (nur für Demonstrationszwecke)
    const certificates = [
      {
        id: "cert-1-123",
        courseTitle: "Einführung in KI und Machine Learning",
        issuedDate: "2025-10-15",
        instructor: "Dr. Max Mustermann",
        courseHours: 4,
        certificateUrl: "/certificates/cert-1-123.pdf"
      },
      {
        id: "cert-5-123",
        courseTitle: "Fortgeschrittene React Patterns",
        issuedDate: "2025-09-22",
        instructor: "Erika Musterfrau",
        courseHours: 3,
        certificateUrl: "/certificates/cert-5-123.pdf"
      },
      {
        id: "cert-7-123",
        courseTitle: "NVIDIA AI Enterprise",
        issuedDate: "2025-08-30",
        instructor: "Anna Beispiel",
        courseHours: 5,
        certificateUrl: "/certificates/cert-7-123.pdf"
      }
    ];

    return NextResponse.json({
      success: true,
      certificates: certificates,
      totalCertificates: certificates.length
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Fehler beim Abrufen der Zertifikate"
    }, { status: 500 });
  }
}

// API-Route zum Herunterladen eines Zertifikats
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
    const { certificateId } = body;

    // In einer echten Anwendung würden Sie hier das Zertifikat generieren oder aus dem Speicher abrufen
    
    // Beispielantwort (nur für Demonstrationszwecke)
    if (certificateId) {
      return NextResponse.json({
        success: true,
        message: "Zertifikat bereit zum Download",
        downloadUrl: `/certificates/${certificateId}.pdf`
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Ungültige Zertifikatsdaten"
      }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Fehler beim Herunterladen des Zertifikats"
    }, { status: 500 });
  }
}