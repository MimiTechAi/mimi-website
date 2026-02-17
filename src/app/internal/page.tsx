"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Clock,
  Calendar,
  BookOpen,
  FileText,
  Users,
  TrendingUp,
  Award
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import SpotlightCard from "@/components/SpotlightCard";
import { DashboardSkeleton } from "@/components/internal/DashboardSkeleton";
import { DashboardError } from "@/components/internal/DashboardError";

// Dynamische Importe der Icons
const iconComponents = {
  MessageCircle: MessageCircle,
  Clock: Clock,
  Calendar: Calendar,
  BookOpen: BookOpen,
};

export default function InternalDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Mitarbeiter");
  const [error, setError] = useState<string | null>(null);

  const fallbackData = {
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
      { id: 1, title: "Neues KI-Training verfügbar", time: "1 Stunde ago", priority: "high" },
      { id: 2, title: "Team Meeting nächste Woche", time: "2 Stunden ago", priority: "medium" },
      { id: 3, title: "Serverwartung am Wochenende", time: "1 Tag ago", priority: "low" },
    ],
    progress: [
      { name: "Teamaktivität", value: "85%" },
      { name: "Lernfortschritt", value: "72%" },
      { name: "Abgeschlossene Kurse", value: "5/12" },
    ],
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user data via API (client-safe, avoids importing next-auth)
      try {
        const userRes = await fetch('/api/internal/auth');
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.valid || userData.user) {
            setUserName(userData.user?.name || "Mitarbeiter");
          }
        }
      } catch {
        // Silently fall back to default name
      }

      // Fetch dashboard data via API
      try {
        const dashRes = await fetch('/api/internal/dashboard');
        if (dashRes.ok) {
          const dashData = await dashRes.json();
          setDashboardData(dashData.success ? dashData.data : fallbackData);
        } else {
          setDashboardData(fallbackData);
        }
      } catch {
        setDashboardData(fallbackData);
      }
    } catch (err) {
      console.error("Fehler beim Laden der Dashboard-Daten:", err);
      setError("Fehler beim Laden der Dashboard-Daten. Bitte versuchen Sie es später erneut.");
      setDashboardData(fallbackData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error && !dashboardData) {
    return <DashboardError error={error} onRetry={fetchData} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="heading-section text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Willkommen im internen Mitarbeiterbereich von MiMi Tech AI, {userName}
        </p>
      </div>

      {/* Schnellzugriffe */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardData.quickActions.map((action: any) => {
          const IconComponent = iconComponents[action.icon as keyof typeof iconComponents];
          return (
            <Card key={action.name} className="hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{action.name}</CardTitle>
                <div className={`p-2 rounded-full ${action.color} text-white`}>
                  {IconComponent && <IconComponent className="h-4 w-4" aria-hidden="true" />}
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href={action.href} aria-label={`${action.name} öffnen`}>Öffnen</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardData?.stats.map((stat: any) => (
          <SpotlightCard key={stat.name} className="glass-premium border-none group">
            <div className="card-gradient-overlay" />
            <div className="relative z-10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">
                    {stat.name}
                  </p>
                  <p className="text-3xl font-bold text-white font-mono mt-2 group-hover:text-brand-cyan transition-colors">
                    {stat.value}
                  </p>
                </div>
                <div className={`flex items-center text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-400 bg-green-400/10' :
                  stat.change.startsWith('-') ? 'text-red-400 bg-red-400/10' :
                    'text-gray-400 bg-gray-400/10'
                  } px-2.5 py-0.5 rounded-full border border-white/5`}>
                  {stat.change}
                </div>
              </div>
            </div>
          </SpotlightCard>
        ))}
      </div>

      {/* Ankündigungen und Updates */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SpotlightCard className="glass-premium border-none">
          <div className="card-gradient-overlay" />
          <div className="relative z-10 p-6 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Ankündigungen</h2>
            <p className="text-sm text-gray-400">Neuigkeiten und Updates</p>
          </div>
          <div className="relative z-10 p-6 space-y-4">
            {dashboardData?.announcements.map((announcement: any) => (
              <div key={announcement.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                <div className={`w-2 h-2 mt-2 rounded-full ${announcement.priority === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                  announcement.priority === 'medium' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`} />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-white leading-none">{announcement.title}</p>
                  <p className="text-xs text-gray-500">{announcement.time}</p>
                </div>
              </div>
            ))}
          </div>
        </SpotlightCard>

        <SpotlightCard className="glass-premium border-none">
          <div className="card-gradient-overlay" />
          <div className="relative z-10 p-6 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Mein Fortschritt</h2>
            <p className="text-sm text-gray-400">Aktuelle Ziele</p>
          </div>
          <div className="relative z-10 p-6 space-y-4">
            {dashboardData?.progress.map((item: any) => (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{item.name}</span>
                  <span className="text-white font-mono">{item.value}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-cyan/50 rounded-full"
                    style={{ width: item.value.includes('%') ? item.value : '50%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
}