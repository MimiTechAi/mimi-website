"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Plus, Folder, MoreVertical, Edit2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import SpotlightCard from "@/components/SpotlightCard";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CategoriesPage() {
    const [categories, setCategories] = useState([
        { id: 1, name: "Unternehmensrichtlinien", count: 12, description: "Offizielle Richtlinien und Policies" },
        { id: 2, name: "Entwicklungsprozesse", count: 8, description: "Guides für Softwareentwicklung und Deployment" },
        { id: 3, name: "IT-Ressourcen", count: 15, description: "Hardware, Software und Zugangsberechtigungen" },
        { id: 4, name: "Schulungsmaterialien", count: 22, description: "Interne Weiterbildung und Tutorials" },
    ]);

    const [newCategory, setNewCategory] = useState("");

    const handleAddCategory = () => {
        if (!newCategory) return;

        const newId = Math.max(...categories.map(c => c.id)) + 1;
        setCategories([...categories, {
            id: newId,
            name: newCategory,
            count: 0,
            description: "Neue Kategorie"
        }]);
        setNewCategory("");
        toast.success("Kategorie erstellt");
    };

    const handleDelete = (id: number) => {
        setCategories(categories.filter(c => c.id !== id));
        toast.success("Kategorie gelöscht");
    };

    return (
        <div className="space-y-6 relative max-w-5xl mx-auto">
            {/* Dynamic Background */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] opacity-20" />
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
                    <h1 className="text-2xl font-bold text-white">Kategorien verwalten</h1>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    {categories.map((category, index) => (
                        <motion.div
                            key={category.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <SpotlightCard className="glass-premium border-none p-4 flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 group-hover:border-brand-cyan/30 transition-colors">
                                        <Folder className="h-6 w-6 text-brand-cyan" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white group-hover:text-brand-cyan transition-colors">{category.name}</h3>
                                        <p className="text-sm text-gray-400">{category.description}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-gray-500 bg-white/5 px-2 py-1 rounded border border-white/5">
                                        {category.count} Artikel
                                    </span>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-gray-900 border-white/10 text-white">
                                            <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer">
                                                <Edit2 className="h-4 w-4 mr-2" />
                                                Bearbeiten
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="focus:bg-red-500/20 focus:text-red-400 text-red-400 cursor-pointer"
                                                onClick={() => handleDelete(category.id)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Löschen
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </SpotlightCard>
                        </motion.div>
                    ))}
                </div>

                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <SpotlightCard className="glass-premium border-none p-6 space-y-4 sticky top-6">
                            <h3 className="font-semibold text-white border-b border-white/10 pb-4">Neue Kategorie</h3>

                            <div className="space-y-2">
                                <Input
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    placeholder="Kategoriename"
                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-brand-cyan/50"
                                />
                            </div>

                            <Button
                                onClick={handleAddCategory}
                                disabled={!newCategory}
                                className="w-full bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/30 border border-brand-cyan/30 btn-shimmer"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Hinzufügen
                            </Button>
                        </SpotlightCard>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
