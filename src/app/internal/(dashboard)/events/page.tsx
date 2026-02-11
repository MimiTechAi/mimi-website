"use client";

import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, CalendarDays } from "lucide-react";
import { useState, useEffect } from "react";
import { getCachedEvents } from "@/lib/cache";
import { motion } from "framer-motion";
import SpotlightCard from "@/components/SpotlightCard";

export default function EventsPage() {
  const [events, setEvents] = useState([
    {
      id: 1,
      title: "KI-Workshop: Neueste Entwicklungen",
      date: "2025-11-15",
      time: "14:00 - 17:00",
      location: "Konferenzraum A",
      description: "Praxisorientierter Workshop zu den neuesten KI-Modellen und deren Anwendung in der Beratung.",
      attendees: 15,
      maxAttendees: 20,
      registered: true
    },
    {
      id: 2,
      title: "Team Building: Escape Room",
      date: "2025-11-22",
      time: "16:00 - 19:00",
      location: "City Escape Hamburg",
      description: "Gemeinsames Team Building in einem Escape Room mit anschließendem Dinner.",
      attendees: 8,
      maxAttendees: 12,
      registered: false
    },
    {
      id: 3,
      title: "Weihnachtsfeier 2025",
      date: "2025-12-18",
      time: "19:00 - 23:00",
      location: "Restaurant Alsterblick",
      description: "Jährliche Weihnachtsfeier mit Dinner und Unterhaltungsprogramm.",
      attendees: 0,
      maxAttendees: 50,
      registered: false
    }
  ]);

  // Lade Veranstaltungsdaten beim Mounten der Komponente
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const cachedEvents = await getCachedEvents();
        if (cachedEvents) {
          setEvents(cachedEvents);
        }
      } catch (error) {
        console.error("Fehler beim Laden der Veranstaltungen:", error);
      }
    };

    fetchEvents();
  }, []);

  const toggleRegistration = (id: number) => {
    setEvents(events.map(event =>
      event.id === id
        ? { ...event, registered: !event.registered, attendees: event.registered ? event.attendees - 1 : event.attendees + 1 }
        : event
    ));
  };

  return (
    <div className="space-y-8 relative">
      {/* Dynamic Background */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] bg-nvidia-green/20 rounded-full blur-[100px] opacity-40" />
        <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] bg-brand-cyan/20 rounded-full blur-[100px] opacity-40" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="p-3 rounded-xl bg-nvidia-green/10 border border-nvidia-green/20 text-nvidia-green">
          <CalendarDays size={32} />
        </div>
        <div>
          <h1 className="heading-section text-white">Firmen-Events</h1>
          <p className="text-gray-400">
            Bleiben Sie über bevorstehende Veranstaltungen informiert
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <SpotlightCard className="flex flex-col h-full glass-premium border-none overflow-hidden group">
              <div className="card-gradient-overlay" />
              <div className="relative z-10 p-6 border-b border-white/10 bg-white/5 group-hover:bg-white/10 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-xl font-semibold text-white group-hover:text-brand-cyan transition-colors">{event.title}</h3>
                  {event.registered && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                      Angemeldet
                    </span>
                  )}
                </div>
                <p className="mt-2 text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors">{event.description}</p>
              </div>

              <div className="relative z-10 p-6 flex-1 flex flex-col justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-gray-300 group-hover:text-white transition-colors">
                    <Calendar className="h-4 w-4 text-brand-cyan" />
                    <span className="text-sm">{new Date(event.date).toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-300 group-hover:text-white transition-colors">
                    <Clock className="h-4 w-4 text-brand-cyan" />
                    <span className="text-sm">{event.time}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-300 group-hover:text-white transition-colors">
                    <MapPin className="h-4 w-4 text-brand-cyan" />
                    <span className="text-sm">{event.location}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-300 group-hover:text-white transition-colors">
                    <Users className="h-4 w-4 text-brand-cyan" />
                    <span className="text-sm">{event.attendees} / {event.maxAttendees} Teilnehmer</span>
                  </div>
                </div>

                <Button
                  onClick={() => toggleRegistration(event.id)}
                  className={`w-full transition-all duration-300 btn-shimmer ${event.registered
                    ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30 hover:shadow-[0_0_15px_rgba(0,255,255,0.2)]"
                    }`}
                >
                  {event.registered ? "Abmelden" : "Jetzt Anmelden"}
                </Button>
              </div>
            </SpotlightCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}