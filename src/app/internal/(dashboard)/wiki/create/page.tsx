"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Save, Eye, FileText } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import SpotlightCard from "@/components/SpotlightCard";
import { toast } from "sonner";

export default function CreateArticlePage() {
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("");
    const [content, setContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!title || !category || !content) {
            toast.error("Bitte füllen Sie alle Pflichtfelder aus.");
            return;
        }

        setIsSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSaving(false);
        toast.success("Artikel erfolgreich gespeichert!");
    };

    return (
        <div className="space-y-6 relative max-w-5xl mx-auto">
            {/* Dynamic Background */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute bottom-[20%] left-[10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] opacity-20" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-8"
            >
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" className="text-gray-400 hover:text-white hover:bg-white/10">
                        <Link href="/internal/wiki">
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Zurück zum Wiki
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold text-white">Neuen Artikel erstellen</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10">
                        <Eye className="h-4 w-4 mr-2" />
                        Vorschau
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/30 border border-brand-cyan/30 btn-shimmer"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? "Speichert..." : "Veröffentlichen"}
                    </Button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <SpotlightCard className="glass-premium border-none p-6 space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-gray-300">Titel *</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Geben Sie einen aussagekräftigen Titel ein"
                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-brand-cyan/50 text-lg"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="content" className="text-gray-300">Inhalt *</Label>
                                <div className="min-h-[400px] rounded-lg border border-white/10 bg-white/5 p-4 focus-within:border-brand-cyan/50 transition-colors">
                                    <textarea
                                        id="content"
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="Schreiben Sie hier Ihren Artikel..."
                                        className="w-full h-full min-h-[380px] bg-transparent border-none focus:ring-0 text-white placeholder:text-gray-600 resize-none"
                                    />
                                </div>
                                <p className="text-xs text-gray-500">Markdown wird unterstützt.</p>
                            </div>
                        </SpotlightCard>
                    </motion.div>
                </div>

                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <SpotlightCard className="glass-premium border-none p-6 space-y-6">
                            <h3 className="font-semibold text-white border-b border-white/10 pb-4">Einstellungen</h3>

                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-gray-300">Kategorie *</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue placeholder="Kategorie wählen" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-900 border-white/10 text-white">
                                        <SelectItem value="guidelines">Unternehmensrichtlinien</SelectItem>
                                        <SelectItem value="development">Entwicklungsprozesse</SelectItem>
                                        <SelectItem value="it">IT-Ressourcen</SelectItem>
                                        <SelectItem value="training">Schulungsmaterialien</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tags" className="text-gray-300">Tags</Label>
                                <Input
                                    id="tags"
                                    placeholder="z.B. remote, policy, hr"
                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-brand-cyan/50"
                                />
                                <p className="text-xs text-gray-500">Mit Komma trennen</p>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                                    <span>Sichtbarkeit</span>
                                    <span className="text-green-400">Öffentlich</span>
                                </div>
                                <div className="flex items-center justify-between text-sm text-gray-400">
                                    <span>Version</span>
                                    <span>1.0 (Draft)</span>
                                </div>
                            </div>
                        </SpotlightCard>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
