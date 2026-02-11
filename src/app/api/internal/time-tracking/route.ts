import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// In-Memory-Speicher für Projekte
let projects: any[] = [
  { id: "proj-1", name: "KI-Beratung", description: "Beratungsprojekte im Bereich KI" },
  { id: "proj-2", name: "Digitale Zwillinge", description: "Entwicklung von Digitalen Zwillingen" },
  { id: "proj-3", name: "Webentwicklung", description: "Entwicklung interner Webanwendungen" }
];

// In-Memory-Speicher für Zeiteinträge
let timeEntries: any[] = [
  { id: 1, project: "proj-1", duration: 120, date: "2025-10-25", description: "KI-Modellierung" },
  { id: 2, project: "proj-2", duration: 240, date: "2025-10-26", description: "Datenintegration" },
  { id: 3, project: "proj-1", duration: 180, date: "2025-10-27", description: "Kundenpräsentation" }
];

// In-Memory-Speicher für Genehmigungen
let approvals: any[] = [
  { id: 1, projectId: "proj-1", duration: 120, description: "KI-Modellierung", date: "2025-10-25", status: "approved", requestedAt: "2025-10-25T09:00:00Z" }
];

// API-Route zum Abrufen von Zeiteinträgen
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

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    switch (action) {
      case 'projects':
        // Abrufen aller Projekte
        return NextResponse.json({
          success: true,
          projects: projects
        });
        
      case 'approvals':
        // Abrufen von Genehmigungen
        return NextResponse.json({
          success: true,
          approvals: approvals
        });
        
      default:
        // Abrufen von Zeiteinträgen
        return NextResponse.json({
          success: true,
          timeEntries: timeEntries
        });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Fehler beim Abrufen der Daten"
    }, { status: 500 });
  }
}

// API-Route zum Erstellen von Zeiteinträgen, Projekten und Genehmigungen
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
    const { action, projectId, duration, description, date } = body;
    
    switch (action) {
      case 'createProject':
        // Erstellen eines neuen Projekts
        if (body.projectName && body.projectDescription) {
          const newProject = {
            id: `proj-${projects.length + 1}`,
            name: body.projectName,
            description: body.projectDescription
          };
          projects.push(newProject);
          
          return NextResponse.json({
            success: true,
            message: "Projekt erstellt",
            project: newProject
          });
        } else {
          return NextResponse.json({
            success: false,
            message: "Ungültige Projektinformationen"
          }, { status: 400 });
        }
        
      case 'requestApproval':
        // Anfordern einer Genehmigung
        if (projectId && duration && description && date) {
          const newApproval = {
            id: approvals.length + 1,
            projectId,
            duration,
            description,
            date,
            status: "pending",
            requestedAt: new Date().toISOString()
          };
          approvals.push(newApproval);
          
          return NextResponse.json({
            success: true,
            message: "Genehmigung angefordert",
            approval: newApproval
          });
        } else {
          return NextResponse.json({
            success: false,
            message: "Ungültige Genehmigungsdaten"
          }, { status: 400 });
        }
        
      default:
        // Erstellen eines neuen Zeiteintrags
        if (projectId && duration && description && date) {
          const newEntry = {
            id: timeEntries.length + 1,
            project: projectId,
            duration,
            date,
            description
          };
          timeEntries.push(newEntry);
          
          return NextResponse.json({
            success: true,
            message: "Zeiteintrag gespeichert",
            entry: newEntry
          });
        } else {
          return NextResponse.json({
            success: false,
            message: "Ungültige Zeiteintragsdaten"
          }, { status: 400 });
        }
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Fehler beim Speichern der Daten"
    }, { status: 500 });
  }
}