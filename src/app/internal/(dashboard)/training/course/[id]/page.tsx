"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, CheckCircle, Lock, FileText, ChevronLeft, Download, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import SpotlightCard from "@/components/SpotlightCard";
import { useParams } from "next/navigation";

export default function CourseDetailPage() {
    const params = useParams();
    const courseId = params.id;
    const [activeLesson, setActiveLesson] = useState(1);

    // Mock data - in a real app, fetch based on courseId
    const course = {
        id: courseId,
        title: "Einführung in KI und Machine Learning",
        description: "Lernen Sie die Grundlagen der künstlichen Intelligenz und wie sie die moderne Industrie transformiert.",
        progress: 35,
        modules: [
            {
                id: 1,
                title: "Modul 1: Grundlagen",
                lessons: [
                    { id: 1, title: "Was ist KI?", duration: "10:00", completed: true, type: "video" },
                    { id: 2, title: "Geschichte der KI", duration: "15:00", completed: true, type: "video" },
                    { id: 3, title: "Quiz: Grundlagen", duration: "5:00", completed: false, type: "quiz" }
                ]
            },
            {
                id: 2,
                title: "Modul 2: Machine Learning",
                lessons: [
                    { id: 4, title: "Supervised Learning", duration: "20:00", completed: false, type: "video" },
                    { id: 5, title: "Unsupervised Learning", duration: "20:00", completed: false, type: "video" },
                    { id: 6, title: "Praxisübung", duration: "45:00", completed: false, type: "exercise" }
                ]
            }
        ]
    };

    return (
        <div className="space-y-6 relative">
            {/* Dynamic Background */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[20%] right-[30%] w-[600px] h-[600px] bg-brand-cyan/10 rounded-full blur-[120px] opacity-20" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 mb-8"
            >
                <Button asChild variant="ghost" className="text-gray-400 hover:text-white hover:bg-white/10">
                    <Link href="/internal/training">
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Zurück zur Übersicht
                    </Link>
                </Button>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <SpotlightCard className="glass-premium border-none overflow-hidden p-0">
                            {/* Video Player Placeholder */}
                            <div className="aspect-video bg-black relative group cursor-pointer">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-20 h-20 rounded-full bg-brand-cyan/20 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-300 border border-brand-cyan/50">
                                        <Play className="h-8 w-8 text-brand-cyan ml-1" />
                                    </div>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                    <h2 className="text-white font-medium text-lg">Lektion {activeLesson}: Supervised Learning</h2>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h1 className="text-2xl font-bold text-white mb-2">{course.title}</h1>
                                        <p className="text-gray-400">{course.description}</p>
                                    </div>
                                    <Button className="bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/30 border border-brand-cyan/30 btn-shimmer">
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Als erledigt markieren
                                    </Button>
                                </div>

                                <div className="flex gap-4 mt-6 pt-6 border-t border-white/10">
                                    <Button variant="ghost" className="flex-1 text-gray-300 hover:text-white hover:bg-white/5">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Materialien
                                    </Button>
                                    <Button variant="ghost" className="flex-1 text-gray-300 hover:text-white hover:bg-white/5">
                                        <Download className="h-4 w-4 mr-2" />
                                        Downloads
                                    </Button>
                                    <Button variant="ghost" className="flex-1 text-gray-300 hover:text-white hover:bg-white/5">
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Diskussion
                                    </Button>
                                </div>
                            </div>
                        </SpotlightCard>
                    </motion.div>
                </div>

                {/* Sidebar / Curriculum */}
                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <SpotlightCard className="glass-premium border-none overflow-hidden h-full">
                            <div className="p-6 border-b border-white/10">
                                <h3 className="font-semibold text-white mb-2">Kursinhalt</h3>
                                <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                                    <span>{course.progress}% Abgeschlossen</span>
                                    <span>3/6 Lektionen</span>
                                </div>
                                <Progress value={course.progress} className="h-2 bg-white/10" />
                            </div>

                            <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                                {course.modules.map((module) => (
                                    <div key={module.id} className="space-y-2">
                                        <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider px-2">{module.title}</h4>
                                        <div className="space-y-1">
                                            {module.lessons.map((lesson) => (
                                                <button
                                                    key={lesson.id}
                                                    onClick={() => setActiveLesson(lesson.id)}
                                                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 ${activeLesson === lesson.id
                                                            ? "bg-brand-cyan/10 border border-brand-cyan/20 text-white"
                                                            : "hover:bg-white/5 text-gray-300 border border-transparent"
                                                        }`}
                                                >
                                                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border ${lesson.completed
                                                            ? "bg-green-500/20 border-green-500/50 text-green-400"
                                                            : activeLesson === lesson.id
                                                                ? "border-brand-cyan text-brand-cyan"
                                                                : "border-gray-600 text-gray-600"
                                                        }`}>
                                                        {lesson.completed ? <CheckCircle size={12} /> : <Play size={10} fill="currentColor" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{lesson.title}</p>
                                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                                            <span className="capitalize">{lesson.type}</span> • {lesson.duration}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SpotlightCard>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
