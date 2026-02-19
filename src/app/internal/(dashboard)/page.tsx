"use client";

import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Clock,
  Calendar,
  BookOpen,
  Users,
  TrendingUp,
  Award,
  ArrowRight,
  Bell
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useDashboardStats, useAnnouncements, useCourses } from "@/hooks/use-local-data";

export default function DashboardPage() {
  const { stats, loading: statsLoading } = useDashboardStats();
  const { announcements } = useAnnouncements();
  const { courses } = useCourses();

  const quickActions = [
    { name: "Neue Nachricht", href: "/internal/chat", icon: MessageCircle, color: "text-brand-cyan", bg: "bg-brand-cyan/10", border: "border-brand-cyan/20" },
    { name: "Zeit erfassen", href: "/internal/time-tracking", icon: Clock, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
    { name: "Events ansehen", href: "/internal/events", icon: Calendar, color: "text-nvidia-green", bg: "bg-nvidia-green/10", border: "border-nvidia-green/20" },
    { name: "Kurse", href: "/internal/training", icon: BookOpen, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  ];

  // Live stats from IndexedDB
  const completedCount = courses.filter(c => c.completed).length;
  const totalCourses = courses.length;
  const learningProgress = totalCourses > 0 ? Math.round((completedCount / totalCourses) * 100) : 0;

  const liveStats = [
    { name: "Nachrichten", value: stats?.messages?.toString() ?? "–", change: `${stats?.onlineUsers ?? 0} online`, icon: MessageCircle },
    { name: "Stunden diese Woche", value: stats?.weeklyHours?.toString() ?? "–", change: `${stats?.projects ?? 0} Projekte`, icon: Clock },
    { name: "Bevorstehende Events", value: stats?.events?.toString() ?? "–", change: "anstehend", icon: Calendar },
    { name: "Abgeschlossene Kurse", value: `${completedCount}`, change: `von ${totalCourses}`, icon: Award },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Format time ago
  const timeAgo = (date: Date) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `vor ${minutes} Min.`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `vor ${hours} Std.`;
    const days = Math.floor(hours / 24);
    return `vor ${days} Tag${days > 1 ? 'en' : ''}`;
  };

  return (
    <div className="space-y-8 relative">
      {/* Dynamic Background */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-nvidia-green/20 rounded-full blur-[100px] opacity-50" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-brand-cyan/20 rounded-full blur-[100px] opacity-50" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-end"
      >
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
            Dashboard
          </h1>
          <p className="text-gray-400 text-lg">
            Willkommen im internen Mitarbeiterbereich von <span className="text-brand-cyan">MiMi Tech AI</span>
          </p>
        </div>
        <div className="hidden md:block">
          <p className="text-sm text-gray-500 text-right">
            {new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </motion.div>

      {/* Schnellzugriffe */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {quickActions.map((action) => (
          <motion.div key={action.name} variants={itemVariants}>
            <Link href={action.href} className="block h-full">
              <div className={`h-full p-6 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 group relative overflow-hidden`}>
                <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity`}>
                  <action.icon size={64} />
                </div>
                <div className="flex flex-col h-full justify-between relative z-10">
                  <div className={`p-3 rounded-lg w-fit mb-4 ${action.bg} ${action.border} border`}>
                    <action.icon className={`h-6 w-6 ${action.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{action.name}</h3>
                    <div className="flex items-center text-sm text-gray-400 group-hover:text-brand-cyan transition-colors">
                      Öffnen <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Statistiken — Live from IndexedDB */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {liveStats.map((stat) => (
          <motion.div key={stat.name} variants={itemVariants}>
            <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex justify-between items-start mb-4">
                <p className="text-sm font-medium text-gray-400">{stat.name}</p>
                <stat.icon size={16} className="text-gray-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-white">
                  {statsLoading ? '–' : stat.value}
                </h3>
                <span className="text-xs font-medium px-1.5 py-0.5 rounded text-gray-400 bg-gray-500/10">
                  {stat.change}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Ankündigungen und Updates */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden"
        >
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-white">Firmenankündigungen</h3>
              <p className="text-sm text-gray-400">Neueste Updates und Mitteilungen</p>
            </div>
            <Bell className="text-brand-cyan" size={20} />
          </div>
          <div className="p-6 space-y-6">
            {announcements.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-start space-x-4 group">
                <div className={`mt-1.5 h-2.5 w-2.5 rounded-full ${item.color || 'bg-brand-cyan'} shadow-[0_0_8px_currentColor]`} />
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-brand-cyan transition-colors">{item.title}</p>
                  <p className="text-xs text-gray-500">{timeAgo(item.createdAt)}</p>
                </div>
              </div>
            ))}
            {announcements.length === 0 && (
              <p className="text-sm text-gray-500">Keine Ankündigungen vorhanden.</p>
            )}
          </div>
          <div className="p-4 bg-white/5 border-t border-white/10">
            <Button variant="ghost" className="w-full text-sm text-gray-400 hover:text-white hover:bg-white/5">
              Alle Anzeigen
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden"
        >
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">Ihr Fortschritt</h3>
            <p className="text-sm text-gray-400">Überblick über Ihre Aktivitäten</p>
          </div>
          <div className="p-6 space-y-6">
            {[
              { label: "Online im Team", value: stats ? Math.round((stats.onlineUsers / Math.max(stats.totalUsers, 1)) * 100) : 0, icon: Users, color: "bg-brand-cyan" },
              { label: "Lernfortschritt", value: learningProgress, icon: TrendingUp, color: "bg-nvidia-green" },
              { label: "Abgeschlossene Kurse", value: totalCourses > 0 ? Math.round((completedCount / totalCourses) * 100) : 0, displayValue: `${completedCount}/${totalCourses}`, icon: Award, color: "bg-green-500" }
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-gray-300">
                    <item.icon size={16} />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <span className="text-sm font-medium text-white">{item.displayValue || `${item.value}%`}</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                    className={`h-full ${item.color} shadow-[0_0_10px_currentColor]`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}