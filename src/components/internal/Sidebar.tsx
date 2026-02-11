"use client";

import {
  Home,
  MessageCircle,
  Clock,
  Calendar,
  BookOpen,
  FileText,
  Settings,
  X,
  Menu,
  User
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const [userName, setUserName] = useState("Mitarbeiter");
  const [userEmail, setUserEmail] = useState("mitarbeiter@mimitechai.com");

  // Benutzerdaten laden
  useEffect(() => {
    const storedUserName = localStorage.getItem('userName') || "Mitarbeiter";
    const storedUserEmail = localStorage.getItem('userEmail') || "mitarbeiter@mimitechai.com";
    setUserName(storedUserName);
    setUserEmail(storedUserEmail);
  }, []);

  const navigation = [
    { name: "Dashboard", href: "/internal", icon: Home },
    { name: "Chat", href: "/internal/chat", icon: MessageCircle },
    { name: "Zeiterfassung", href: "/internal/time-tracking", icon: Clock },
    { name: "Events", href: "/internal/events", icon: Calendar },
    { name: "Schulungen", href: "/internal/training", icon: BookOpen },
    { name: "Wiki", href: "/internal/wiki", icon: FileText },
  ];

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900/95 backdrop-blur-xl border-r border-white/10 shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        role="navigation"
        aria-label="Hauptnavigation"
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-brand-cyan to-nvidia-green w-8 h-8 rounded-lg flex items-center justify-center shadow-lg" aria-hidden="true">
                <span className="text-white font-bold text-xs">MT</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-brand-cyan to-nvidia-green bg-clip-text text-transparent">
                MiMi Tech AI
              </span>
            </div>
            <button
              className="lg:hidden text-gray-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/50 rounded transition-colors"
              onClick={() => setSidebarOpen(false)}
              aria-label="Seitenleiste schließen"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1" role="menubar">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${isActive
                      ? "bg-gradient-to-r from-brand-cyan/20 to-nvidia-green/20 text-white border border-brand-cyan/30 shadow-lg shadow-brand-cyan/10"
                      : "text-gray-300 hover:text-white hover:bg-white/5 focus-visible:bg-white/5 focus-visible:outline-none"
                    }`}
                  role="menuitem"
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className={`h-5 w-5 mr-3 transition-colors ${isActive ? 'text-brand-cyan' : 'text-gray-400 group-hover:text-white'}`} aria-hidden="true" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User profile */}
          <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-sm">
            <Link
              href="/internal/profile"
              className="flex items-center p-3 text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors focus-visible:bg-white/5 focus-visible:outline-none mb-2"
              aria-label="Benutzerprofil"
            >
              <div className="bg-gradient-to-br from-brand-cyan/20 to-nvidia-green/20 border border-brand-cyan/30 rounded-xl w-8 h-8 mr-3 flex items-center justify-center" aria-hidden="true">
                <User className="h-4 w-4 text-brand-cyan" />
              </div>
              <div>
                <p className="font-medium text-white">{userName}</p>
                <p className="text-xs text-gray-400">{userEmail}</p>
              </div>
            </Link>
            <Link
              href="/internal/settings"
              className="flex items-center p-3 text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors focus-visible:bg-white/5 focus-visible:outline-none"
              aria-label="Einstellungen"
            >
              <Settings className="h-5 w-5 mr-3 text-gray-400" aria-hidden="true" />
              Einstellungen
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}