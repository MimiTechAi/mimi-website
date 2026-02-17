"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Clock, Award, Play, Search, Star, Users, Download, GraduationCap } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import SpotlightCard from "@/components/SpotlightCard";

interface Course {
  id: number;
  title: string;
  description: string;
  duration: string;
  progress: number;
  completed: boolean;
  category: string;
  rating?: number;
  enrolled?: number;
  instructor?: string;
  thumbnail?: string;
}

export default function TrainingPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>(["Alle"]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Alle");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    completedCourses: 5,
    totalHours: 120,
    certificates: 3
  });

  // API-Aufruf zum Laden der Kurse
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);

        // Fetch training data via API (client-safe)
        const res = await fetch('/api/internal/training');
        const data = res.ok ? await res.json() : null;
        if (data && data.courses) {
          setCourses(data.courses);
          setFilteredCourses(data.courses);
          setCategories(data.categories || ["Alle"]);
          setStats({
            completedCourses: data.completedCourses || 5,
            totalHours: data.totalHours || 120,
            certificates: data.certificates || 3
          });
        } else {
          // Fallback zu hardcoded Daten bei Fehler
          const fallbackCourses: Course[] = [
            {
              id: 1,
              title: "Einführung in KI und Machine Learning",
              description: "Grundlagen der künstlichen Intelligenz und Machine Learning Algorithmen",
              duration: "4 Stunden",
              progress: 100,
              completed: true,
              category: "KI-Grundlagen",
              rating: 4.8,
              enrolled: 124
            },
            {
              id: 2,
              title: "NVIDIA NeMo Framework",
              description: "Praxisorientierte Einführung in das NVIDIA NeMo Framework für Sprach-KI",
              duration: "6 Stunden",
              progress: 75,
              completed: false,
              category: "NVIDIA",
              rating: 4.6,
              enrolled: 89
            },
            {
              id: 3,
              title: "Digitale Zwillinge in der Industrie",
              description: "Anwendung von Digitalen Zwillingen in der industriellen Fertigung",
              duration: "3 Stunden",
              progress: 0,
              completed: false,
              category: "Digitale Zwillinge",
              rating: 4.9,
              enrolled: 156
            },
            {
              id: 4,
              title: "Next.js für interne Anwendungen",
              description: "Entwicklung von internen Tools mit Next.js und React",
              duration: "5 Stunden",
              progress: 0,
              completed: false,
              category: "Entwicklung",
              rating: 4.7,
              enrolled: 78
            }
          ];
          setCourses(fallbackCourses);
          setFilteredCourses(fallbackCourses);
        }
      } catch (error) {
        console.error("Fehler beim Laden der Kurse:", error);
        // Fallback zu hardcoded Daten bei Netzwerkfehler
        const fallbackCourses: Course[] = [
          {
            id: 1,
            title: "Einführung in KI und Machine Learning",
            description: "Grundlagen der künstlichen Intelligenz und Machine Learning Algorithmen",
            duration: "4 Stunden",
            progress: 100,
            completed: true,
            category: "KI-Grundlagen",
            rating: 4.8,
            enrolled: 124
          },
          {
            id: 2,
            title: "NVIDIA NeMo Framework",
            description: "Praxisorientierte Einführung in das NVIDIA NeMo Framework für Sprach-KI",
            duration: "6 Stunden",
            progress: 75,
            completed: false,
            category: "NVIDIA",
            rating: 4.6,
            enrolled: 89
          },
          {
            id: 3,
            title: "Digitale Zwillinge in der Industrie",
            description: "Anwendung von Digitalen Zwillingen in der industriellen Fertigung",
            duration: "3 Stunden",
            progress: 0,
            completed: false,
            category: "Digitale Zwillinge",
            rating: 4.9,
            enrolled: 156
          },
          {
            id: 4,
            title: "Next.js für interne Anwendungen",
            description: "Entwicklung von internen Tools mit Next.js und React",
            duration: "5 Stunden",
            progress: 0,
            completed: false,
            category: "Entwicklung",
            rating: 4.7,
            enrolled: 78
          }
        ];
        setCourses(fallbackCourses);
        setFilteredCourses(fallbackCourses);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Filterfunktion für Kurse
  useEffect(() => {
    let result = courses;

    // Filter nach Suchbegriff
    if (searchTerm) {
      result = result.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter nach Kategorie
    if (selectedCategory !== "Alle") {
      result = result.filter(course => course.category === selectedCategory);
    }

    setFilteredCourses(result);
  }, [searchTerm, selectedCategory, courses]);

  const handleRatingSubmit = async (courseId: number, rating: number) => {
    try {
      const response = await fetch('/api/internal/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, userId: 1, progress: 100, rating })
      });

      const data = await response.json();
      if (data.success) {
        // Aktualisiere den Kurs mit der neuen Bewertung
        setCourses(prevCourses =>
          prevCourses.map(course =>
            course.id === courseId ? { ...course, rating } : course
          )
        );
      }
    } catch (error) {
      console.error("Fehler beim Senden der Bewertung:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-cyan border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-400">Kurse werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Dynamic Background */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[15%] left-[30%] w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[120px] opacity-30" />
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-nvidia-green/10 rounded-full blur-[100px] opacity-30" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
          <GraduationCap size={32} />
        </div>
        <div>
          <h1 className="heading-section text-white">Schulungen & Kurse</h1>
          <p className="text-gray-400">
            Erweitern Sie Ihr Wissen mit unseren internen Schulungsangeboten
          </p>
        </div>
      </motion.div>

      {/* Such- und Filterbereich */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm p-4"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Kurse suchen..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-brand-cyan/50 focus:ring-brand-cyan/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/10 text-white">
                {categories.map((category) => (
                  <SelectItem key={category} value={category} className="focus:bg-white/10 focus:text-white">
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Kursliste */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {filteredCourses.map((course, index) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + (index * 0.1) }}
          >
            <SpotlightCard className="flex flex-col h-full glass-premium border-none overflow-hidden group">
              <div className="card-gradient-overlay" />
              <div className="relative z-10 p-6 border-b border-white/10 bg-white/5">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white group-hover:text-brand-cyan transition-colors">{course.title}</h3>
                    <p className="text-sm text-gray-400 mt-1 group-hover:text-gray-300 transition-colors">{course.description}</p>
                    {course.instructor && (
                      <p className="text-xs text-gray-500 mt-2">von {course.instructor}</p>
                    )}
                  </div>
                  <span className="bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                    {course.category}
                  </span>
                </div>
              </div>
              <div className="relative z-10 p-6 flex-1 flex flex-col gap-6">
                <div className="flex items-center justify-between text-sm text-gray-300">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-brand-cyan" />
                    <span>{course.duration}</span>
                  </div>
                  {course.rating !== undefined && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium text-white">{course.rating}</span>
                      {course.enrolled !== undefined && (
                        <span className="text-gray-500">({course.enrolled})</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Fortschritt</span>
                    <span className="text-brand-cyan font-mono">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2 bg-white/10" />
                </div>

                <div className="flex gap-3 mt-auto">
                  <Button asChild className={`flex-1 btn-shimmer ${course.completed
                    ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
                    : "bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/30 border border-brand-cyan/30"
                    }`}>
                    <Link href={`/internal/training/course/${course.id}`}>
                      {course.completed ? (
                        <>
                          <Award className="h-4 w-4 mr-2" />
                          Zertifikat
                        </>
                      ) : course.progress > 0 ? (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Fortsetzen
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Starten
                        </>
                      )}
                    </Link>
                  </Button>

                  {course.completed && course.rating !== undefined && (
                    <div className="flex items-center bg-white/5 rounded-md px-2 border border-white/10">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          className="p-1 hover:scale-110 transition-transform"
                          onClick={() => handleRatingSubmit(course.id, star)}
                        >
                          <Star
                            className={`h-4 w-4 ${star <= Math.round(course.rating || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}`}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </SpotlightCard>
          </motion.div>
        ))}
      </div>

      {/* Statistiken */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden"
      >
        <div className="p-6 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Ihr Lernfortschritt</h2>
          <p className="text-sm text-gray-400">Überblick über Ihre abgeschlossenen Kurse</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Abgeschlossene Kurse", value: stats.completedCourses, icon: BookOpen, color: "text-brand-cyan" },
              { label: "Gesamtstunden", value: stats.totalHours, icon: Clock, color: "text-nvidia-green" },
              { label: "Zertifikate", value: stats.certificates, icon: Award, color: "text-yellow-400" }
            ].map((stat, i) => (
              <SpotlightCard key={i} className="text-center p-6 glass-premium border-none group">
                <div className="card-gradient-overlay" />
                <div className="relative z-10">
                  <stat.icon className={`h-8 w-8 mx-auto mb-3 ${stat.color} group-hover:scale-110 transition-transform duration-300`} />
                  <div className="text-3xl font-bold text-white font-mono">{stat.value}</div>
                  <div className="text-sm text-gray-400 mt-1 group-hover:text-gray-300 transition-colors">{stat.label}</div>
                </div>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}