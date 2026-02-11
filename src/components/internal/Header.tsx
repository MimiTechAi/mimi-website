"use client";

import { Bell, Menu, Search, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { signOut } from "next-auth/react";

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

export function Header({ setSidebarOpen }: HeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Verwende NextAuth für das Logout
      await signOut({ redirect: false });
      // Weiterleitung zur Login-Seite
      window.location.href = '/internal/login';
    } catch (error) {
      console.error("Fehler beim Logout:", error);
      setIsLoggingOut(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // In einer echten Implementierung würden Sie hier die Suchanfrage durchführen
      // Zum Beispiel: API-Aufruf zur Suche in internen Inhalten
      await new Promise(resolve => setTimeout(resolve, 300));
      // Hier könnte die Weiterleitung zu den Suchergebnissen erfolgen
    } catch (error) {
      console.error("Fehler bei der Suche:", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <header className="bg-gray-900/95 backdrop-blur-xl border-b border-white/10 shadow-lg z-10" role="banner">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-2 text-gray-300 hover:text-white hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
            onClick={() => setSidebarOpen(true)}
            aria-label="Hauptmenü öffnen"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-brand-cyan to-nvidia-green bg-clip-text text-transparent">
            MiMi Tech AI - Intern
          </h1>
        </div>

        <form onSubmit={handleSearch} className="flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <Input
              type="search"
              placeholder="In internen Inhalten suchen..."
              className="pl-10 w-full rounded-lg bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:border-brand-cyan/50 focus-visible:ring-brand-cyan/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Inhalt durchsuchen"
            />
          </div>
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="ml-2 text-gray-300 hover:text-white hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
            disabled={isSearching}
            aria-label="Suchen"
          >
            {isSearching ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </Button>
        </form>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-gray-300 hover:text-white hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
            aria-label="Benachrichtigungen"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-gray-900" aria-label="Ungelesene Benachrichtigungen"></span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-300 hover:text-white hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
            aria-label="Benutzerprofil"
          >
            <User className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-300 hover:text-white hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
            onClick={handleLogout}
            disabled={isLoggingOut}
            aria-label="Abmelden"
          >
            {isLoggingOut ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <LogOut className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}