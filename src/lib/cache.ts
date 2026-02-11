import { cache } from 'react';
import { getCurrentUser } from '@/lib/session';

// Caching für Benutzerdaten
export const getCachedUser = cache(async () => {
  return await getCurrentUser();
});

// Caching für Dashboard-Daten
export const getCachedDashboardData = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  
  try {
    const response = await fetch('/api/internal/dashboard');
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Fehler beim Laden der Dashboard-Daten:', error);
    return null;
  }
});

// Caching für Chat-Nachrichten
export const getCachedChatMessages = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  
  try {
    const response = await fetch('/api/internal/chat');
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.success ? data.messages : null;
  } catch (error) {
    console.error('Fehler beim Laden der Chat-Nachrichten:', error);
    return null;
  }
});

// Caching für Benutzerliste
export const getCachedUsers = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  
  try {
    const response = await fetch('/api/internal/users');
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.success ? data.users : null;
  } catch (error) {
    console.error('Fehler beim Laden der Benutzerliste:', error);
    return null;
  }
});

// Caching für Veranstaltungen
export const getCachedEvents = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  
  try {
    const response = await fetch('/api/internal/events');
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.success ? data.events : null;
  } catch (error) {
    console.error('Fehler beim Laden der Veranstaltungen:', error);
    return null;
  }
});

// Caching für Schulungen/Kurse
export const getCachedTrainings = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  
  try {
    const response = await fetch('/api/internal/training');
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.success ? data : null;
  } catch (error) {
    console.error('Fehler beim Laden der Schulungen:', error);
    return null;
  }
});

// Caching für Wiki-Artikel
export const getCachedWikiArticles = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  
  try {
    const response = await fetch('/api/internal/wiki');
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.success ? data.articles : null;
  } catch (error) {
    console.error('Fehler beim Laden der Wiki-Artikel:', error);
    return null;
  }
});

// Caching für Zeiterfassungsdaten
export const getCachedTimeTrackingData = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  
  try {
    // Abrufen der Projekte
    const projectsResponse = await fetch('/api/internal/time-tracking?action=projects');
    if (!projectsResponse.ok) return null;
    const projectsData = await projectsResponse.json();
    
    // Abrufen der Zeiteinträge
    const entriesResponse = await fetch('/api/internal/time-tracking');
    if (!entriesResponse.ok) return null;
    const entriesData = await entriesResponse.json();
    
    // Abrufen der Genehmigungen
    const approvalsResponse = await fetch('/api/internal/time-tracking?action=approvals');
    if (!approvalsResponse.ok) return null;
    const approvalsData = await approvalsResponse.json();
    
    return {
      projects: projectsData.success ? projectsData.projects : null,
      timeEntries: entriesData.success ? entriesData.timeEntries : null,
      approvals: approvalsData.success ? approvalsData.approvals : null
    };
  } catch (error) {
    console.error('Fehler beim Laden der Zeiterfassungsdaten:', error);
    return null;
  }
});