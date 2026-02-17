"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Play, Square, Plus, FileText, CheckCircle, AlertCircle, Calendar as CalendarIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import SpotlightCard from "@/components/SpotlightCard";

interface TimeEntry {
  id: number;
  project: string;
  duration: number;
  date: string;
  description: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
}

interface Approval {
  id: number;
  projectId: string;
  duration: number;
  description: string;
  date: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
}

export default function TimeTrackingPage() {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [project, setProject] = useState("");
  const [description, setDescription] = useState("");
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  // Timer für die Zeiterfassung
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isTracking) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking]);

  // API-Aufrufe beim Laden der Komponente
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch time-tracking data via API (client-safe, avoids importing next-auth)
      const [projectsRes, entriesRes, approvalsRes] = await Promise.all([
        fetch('/api/internal/time-tracking?action=projects'),
        fetch('/api/internal/time-tracking'),
        fetch('/api/internal/time-tracking?action=approvals'),
      ]);

      if (projectsRes.ok) {
        const data = await projectsRes.json();
        if (data.success && data.projects) setProjects(data.projects);
      }
      if (entriesRes.ok) {
        const data = await entriesRes.json();
        if (data.success && data.timeEntries) setTimeEntries(data.timeEntries);
      }
      if (approvalsRes.ok) {
        const data = await approvalsRes.json();
        if (data.success && data.approvals) setApprovals(data.approvals);
      }
    } catch (error) {
      console.error("Fehler beim Laden der Zeiterfassungsdaten:", error);
    }
  };

  const startTracking = () => {
    setIsTracking(true);
    setStartTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setElapsedTime(0);
  };

  const stopTracking = async () => {
    setIsTracking(false);
    setStartTime(null);

    // Berechne die Dauer in Minuten
    const duration = Math.floor(elapsedTime / 60);

    if (duration > 0 && project && description) {
      try {
        const response = await fetch('/api/internal/time-tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: project, duration, description, date: new Date().toISOString().split('T')[0] })
        });

        const data = await response.json();
        if (data.success) {
          toast.success("Zeiteintrag gespeichert");
          fetchData(); // Aktualisiere die Liste
        } else {
          toast.error(data.message || "Fehler beim Speichern des Zeiteintrags");
        }
      } catch (error) {
        console.error("Fehler beim Speichern des Zeiteintrags:", error);
        toast.error("Fehler beim Speichern des Zeiteintrags");
      }
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const createProject = async () => {
    if (newProjectName && newProjectDescription) {
      try {
        const response = await fetch('/api/internal/time-tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'createProject',
            projectName: newProjectName,
            projectDescription: newProjectDescription
          })
        });

        const data = await response.json();
        if (data.success) {
          toast.success("Projekt erstellt");
          setNewProjectName("");
          setNewProjectDescription("");
          setShowProjectForm(false);
          fetchData(); // Aktualisiere die Projektliste
        } else {
          toast.error(data.message || "Fehler beim Erstellen des Projekts");
        }
      } catch (error) {
        console.error("Fehler beim Erstellen des Projekts:", error);
        toast.error("Fehler beim Erstellen des Projekts");
      }
    }
  };

  const requestApproval = async (entryId: number) => {
    const entry = timeEntries.find(e => e.id === entryId);
    if (entry) {
      try {
        const response = await fetch('/api/internal/time-tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'requestApproval',
            projectId: entry.project,
            duration: entry.duration,
            description: entry.description,
            date: entry.date
          })
        });

        const data = await response.json();
        if (data.success) {
          toast.success("Genehmigung angefordert");
          fetchData(); // Aktualisiere die Genehmigungsliste
        } else {
          toast.error(data.message || "Fehler beim Anfordern der Genehmigung");
        }
      } catch (error) {
        console.error("Fehler beim Anfordern der Genehmigung:", error);
        toast.error("Fehler beim Anfordern der Genehmigung");
      }
    }
  };

  const generateReport = async () => {
    try {
      const mockReportData = {
        "KI-Beratung": 150,
        "Digitale Zwillinge": 255,
        "Webentwicklung": 120
      };

      setReportData(mockReportData);
      toast.success("Bericht generiert");
    } catch (error) {
      console.error("Fehler beim Generieren des Berichts:", error);
      toast.error("Fehler beim Generieren des Berichts");
    }
  };

  const exportReport = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Projekt,Dauer (Minuten),Datum,Beschreibung\n"
      + timeEntries.map(entry =>
        `${entry.project},${entry.duration},${entry.date},"${entry.description}"`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "zeiterfassung_bericht.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Bericht exportiert");
  };

  const weeklyHours = timeEntries
    .filter(entry => {
      const entryDate = new Date(entry.date);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return entryDate >= oneWeekAgo;
    })
    .reduce((sum, entry) => sum + entry.duration, 0);

  const monthlyHours = timeEntries
    .filter(entry => {
      const entryDate = new Date(entry.date);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return entryDate >= oneMonthAgo;
    })
    .reduce((sum, entry) => sum + entry.duration, 0);

  return (
    <div className="space-y-8 relative">
      {/* Dynamic Background */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[20%] right-[20%] w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[120px] opacity-40" />
        <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] bg-brand-cyan/10 rounded-full blur-[100px] opacity-40" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
          <Clock size={32} />
        </div>
        <div>
          <h1 className="heading-section text-white">Zeiterfassung</h1>
          <p className="text-gray-400">
            Erfassen Sie Ihre Arbeitszeiten und Projekte
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Tracking Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <SpotlightCard className="glass-premium border-none overflow-hidden">
              <div className="card-gradient-overlay" />
              <div className="relative z-10 p-6 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white">Zeiterfassung</h2>
                <p className="text-sm text-gray-400">Starten und stoppen Sie die Zeitmessung</p>
              </div>
              <div className="relative z-10 p-6 space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="project" className="text-gray-300">Projekt</Label>
                    <div className="flex gap-2">
                      <Select value={project} onValueChange={setProject}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-brand-cyan/20">
                          <SelectValue placeholder="Projekt auswählen" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-white/10 text-white">
                          {projects.map((proj) => (
                            <SelectItem key={proj.id} value={proj.id} className="focus:bg-white/10 focus:text-white">
                              {proj.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowProjectForm(!showProjectForm)}
                        className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-brand-cyan transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-end">
                    {isTracking ? (
                      <Button onClick={stopTracking} variant="destructive" className="w-full md:w-auto bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 btn-shimmer shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                        <Square className="h-4 w-4 mr-2" />
                        Stop ({formatTime(elapsedTime)})
                      </Button>
                    ) : (
                      <Button
                        onClick={startTracking}
                        disabled={!project || !description}
                        className="w-full md:w-auto bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/30 border border-brand-cyan/30 disabled:opacity-50 disabled:cursor-not-allowed btn-shimmer shadow-[0_0_15px_rgba(0,255,255,0.2)]"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start
                      </Button>
                    )}
                  </div>
                </div>

                {showProjectForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-4"
                  >
                    <h3 className="font-medium text-white">Neues Projekt erstellen</h3>
                    <div className="space-y-2">
                      <Label htmlFor="newProjectName" className="text-gray-300">Projektname</Label>
                      <Input
                        id="newProjectName"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="Name des neuen Projekts"
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-brand-cyan/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newProjectDescription" className="text-gray-300">Beschreibung</Label>
                      <Input
                        id="newProjectDescription"
                        value={newProjectDescription}
                        onChange={(e) => setNewProjectDescription(e.target.value)}
                        placeholder="Beschreibung des Projekts"
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-brand-cyan/50"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={createProject} className="bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/30 border border-brand-cyan/30 btn-shimmer">Erstellen</Button>
                      <Button variant="ghost" onClick={() => setShowProjectForm(false)} className="text-gray-400 hover:text-white">Abbrechen</Button>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-300">Beschreibung</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Was arbeiten Sie gerade?"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-brand-cyan/50"
                  />
                </div>
                {startTime && (
                  <div className="flex items-center space-x-2 text-sm text-brand-cyan animate-pulse">
                    <Clock className="h-4 w-4" />
                    <span>Gestartet um {startTime}</span>
                  </div>
                )}
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Time Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <SpotlightCard className="glass-premium border-none overflow-hidden">
              <div className="card-gradient-overlay" />
              <div className="relative z-10 p-6 border-b border-white/10 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-white">Zeitübersicht</h2>
                  <p className="text-sm text-gray-400">Ihre erfassten Arbeitszeiten</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={generateReport} className="bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10">
                    <FileText className="h-4 w-4 mr-2" />
                    Bericht
                  </Button>
                  {reportData && (
                    <Button size="sm" onClick={exportReport} className="bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/30 border border-brand-cyan/30 btn-shimmer">
                      Export
                    </Button>
                  )}
                </div>
              </div>
              <div className="relative z-10 p-6 space-y-4">
                {timeEntries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors group">
                    <div>
                      <p className="font-medium text-white group-hover:text-brand-cyan transition-colors">{projects.find(p => p.id === entry.project)?.name || entry.project}</p>
                      <p className="text-sm text-gray-400">{entry.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{entry.date}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-brand-cyan">{Math.floor(entry.duration / 60)}h {entry.duration % 60}m</span>
                      <Button variant="ghost" size="sm" onClick={() => requestApproval(entry.id)} className="text-xs text-gray-400 hover:text-white hover:bg-white/10">
                        Genehmigen
                      </Button>
                    </div>
                  </div>
                ))}

                {reportData && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <h3 className="font-medium text-white mb-3">Berichtsübersicht</h3>
                    <div className="space-y-2">
                      {Object.entries(reportData).map(([project, duration]) => (
                        <div key={project} className="flex justify-between text-sm">
                          <span className="text-gray-300">{project}</span>
                          <span className="text-white font-mono">{Math.floor(Number(duration) / 60)}h {Number(duration) % 60}m</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </SpotlightCard>
          </motion.div>
        </div>

        <div className="space-y-6">
          {/* Stats Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <SpotlightCard className="glass-premium border-none overflow-hidden">
              <div className="card-gradient-overlay" />
              <div className="relative z-10 p-6 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">Statistiken</h2>
                <p className="text-sm text-gray-400">Ihre Arbeitszeitstatistiken</p>
              </div>
              <div className="relative z-10 p-6 space-y-6">
                <div className="text-center p-4 rounded-lg bg-white/5 border border-white/5 hover:border-brand-cyan/20 transition-colors">
                  <div className="text-3xl font-bold text-white font-mono">{Math.floor(weeklyHours / 60)}h {weeklyHours % 60}m</div>
                  <div className="text-sm text-gray-400 mt-1">Diese Woche</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-white/5 border border-white/5 hover:border-brand-cyan/20 transition-colors">
                  <div className="text-3xl font-bold text-white font-mono">{Math.floor(monthlyHours / 60)}h {monthlyHours % 60}m</div>
                  <div className="text-sm text-gray-400 mt-1">Dieser Monat</div>
                </div>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Approvals Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <SpotlightCard className="glass-premium border-none overflow-hidden">
              <div className="card-gradient-overlay" />
              <div className="relative z-10 p-6 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">Genehmigungen</h2>
                <p className="text-sm text-gray-400">Ausstehende Anfragen</p>
              </div>
              <div className="relative z-10 p-6 space-y-4">
                {approvals.length > 0 ? (
                  approvals.slice(0, 3).map((approval) => (
                    <div key={approval.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                      <div>
                        <p className="font-medium text-white text-sm">{projects.find(p => p.id === approval.projectId)?.name || approval.projectId}</p>
                        <p className="text-xs text-gray-400 font-mono mt-1">{Math.floor(approval.duration / 60)}h {approval.duration % 60}m</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {approval.status === "pending" && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                        {approval.status === "approved" && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {approval.status === "rejected" && <AlertCircle className="h-4 w-4 text-red-500" />}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">Keine ausstehenden Genehmigungen</p>
                )}
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Vacation Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-xl bg-gradient-to-br from-nvidia-green/20 to-brand-blue/20 border border-white/10 backdrop-blur-sm overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Urlaubsplanung</h2>
                  <p className="text-sm text-gray-300">Verfügbare Tage</p>
                </div>
                <CalendarIcon className="h-6 w-6 text-white/80" />
              </div>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-bold text-white">12</span>
                <span className="text-sm text-gray-300">Tage</span>
              </div>
              <Button className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20">
                Urlaub beantragen
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}