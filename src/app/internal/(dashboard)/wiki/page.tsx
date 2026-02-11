"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Folder, Plus, Edit, Eye, History, Link as LinkIcon, Book } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getCachedWikiArticles } from "@/lib/cache";
import { motion } from "framer-motion";
import SpotlightCard from "@/components/SpotlightCard";

interface Article {
  id: number;
  title: string;
  category: string;
  lastUpdated: string;
  author: string;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canShare: boolean;
  };
  versions: ArticleVersion[];
  relatedArticles?: RelatedArticle[];
}

interface ArticleVersion {
  id: number;
  content: string;
  author: string;
  timestamp: string;
  comment: string;
}

interface RelatedArticle {
  id: number;
  title: string;
}

interface Category {
  id: number;
  name: string;
  count: number;
  icon: any;
}

export default function WikiPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([
    {
      id: 1,
      name: "Unternehmensrichtlinien",
      count: 12,
      icon: FileText
    },
    {
      id: 2,
      name: "Entwicklungsprozesse",
      count: 8,
      icon: Folder
    },
    {
      id: 3,
      name: "IT-Ressourcen",
      count: 15,
      icon: FileText
    },
    {
      id: 4,
      name: "Schulungsmaterialien",
      count: 22,
      icon: Folder
    }
  ]);

  const recentArticles: Article[] = [
    {
      id: 1,
      title: "Remote Work Policy",
      category: "Unternehmensrichtlinien",
      lastUpdated: "2025-10-25",
      author: "Max Mustermann",
      permissions: {
        canEdit: true,
        canDelete: true,
        canShare: true
      },
      versions: [
        {
          id: 1,
          content: "Unsere Richtlinien für Remote-Arbeit...",
          author: "Max Mustermann",
          timestamp: "2025-10-25T10:30:00Z",
          comment: "Initiale Version"
        }
      ],
      relatedArticles: [
        { id: 2, title: "Code Review Guidelines" },
        { id: 3, title: "VPN Setup Anleitung" }
      ]
    },
    {
      id: 2,
      title: "Code Review Guidelines",
      category: "Entwicklungsprozesse",
      lastUpdated: "2025-10-20",
      author: "Erika Musterfrau",
      permissions: {
        canEdit: true,
        canDelete: false,
        canShare: true
      },
      versions: [
        {
          id: 1,
          content: "Richtlinien für Code-Reviews...",
          author: "Erika Musterfrau",
          timestamp: "2025-10-20T09:15:00Z",
          comment: "Initiale Version"
        }
      ]
    },
    {
      id: 3,
      title: "VPN Setup Anleitung",
      category: "IT-Ressourcen",
      lastUpdated: "2025-10-18",
      author: "IT Abteilung",
      permissions: {
        canEdit: false,
        canDelete: false,
        canShare: true
      },
      versions: [
        {
          id: 1,
          content: "Anleitung zur VPN-Konfiguration...",
          author: "IT Abteilung",
          timestamp: "2025-10-18T14:20:00Z",
          comment: "Initiale Version"
        }
      ]
    },
    {
      id: 4,
      title: "Next.js Best Practices",
      category: "Schulungsmaterialien",
      lastUpdated: "2025-10-15",
      author: "Entwicklungsteam",
      permissions: {
        canEdit: true,
        canDelete: true,
        canShare: true
      },
      versions: [
        {
          id: 1,
          content: "Best Practices für Next.js Entwicklung...",
          author: "Entwicklungsteam",
          timestamp: "2025-10-15T11:45:00Z",
          comment: "Initiale Version"
        }
      ],
      relatedArticles: [
        { id: 1, title: "Remote Work Policy" }
      ]
    }
  ];

  // Simulierte API-Anfrage zum Abrufen von Artikeln
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        // Abrufen der gecachten Wiki-Artikel
        const cachedArticles = await getCachedWikiArticles();
        if (cachedArticles) {
          setArticles(cachedArticles);
        } else {
          // Fallback zu hardcoded Daten
          setArticles(recentArticles);
        }
      } catch (error) {
        console.error("Fehler beim Laden der Wiki-Artikel:", error);
        // Fallback zu hardcoded Daten
        setArticles(recentArticles);
      }
    };

    fetchArticles();
  }, []);

  return (
    <div className="space-y-8 relative">
      {/* Dynamic Background */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] opacity-30" />
        <div className="absolute bottom-[10%] right-[20%] w-[400px] h-[400px] bg-brand-cyan/10 rounded-full blur-[100px] opacity-30" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <Book size={32} />
        </div>
        <div>
          <h1 className="heading-section text-white">Internes Wiki</h1>
          <p className="text-gray-400">
            Zugriff auf alle wichtigen Unternehmensinformationen und Ressourcen
          </p>
        </div>
      </motion.div>

      {/* Suchleiste */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-premium rounded-xl p-6"
      >
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Wiki durchsuchen..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-brand-cyan/50 focus:ring-brand-cyan/20"
            />
          </div>
          <Button className="bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/30 border border-brand-cyan/30">
            <Search className="h-4 w-4 mr-2" />
            Suchen
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Kategorien */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden"
          >
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">Kategorien</h2>
              <p className="text-sm text-gray-400">Durchsuchen Sie die verschiedenen Wissenskategorien</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <SpotlightCard key={category.id} className="group p-4 glass-premium border-none cursor-pointer">
                      <div className="card-gradient-overlay" />
                      <div className="relative z-10 flex items-center space-x-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-brand-cyan/10 transition-colors border border-blue-500/20 group-hover:border-brand-cyan/30">
                          <Icon className="h-5 w-5 text-blue-400 group-hover:text-brand-cyan transition-colors" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white group-hover:text-brand-cyan transition-colors">{category.name}</h3>
                          <p className="text-sm text-gray-400 group-hover:text-gray-300">{category.count} Artikel</p>
                        </div>
                      </div>
                    </SpotlightCard>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Kürzlich aktualisierte Artikel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden"
          >
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">Kürzlich aktualisiert</h2>
              <p className="text-sm text-gray-400">Die neuesten Änderungen in unserem Wiki</p>
            </div>
            <div className="p-6 space-y-4">
              {recentArticles.map((article) => (
                <SpotlightCard key={article.id} className="flex items-center justify-between p-4 glass-premium border-none group">
                  <div className="card-gradient-overlay" />
                  <div className="relative z-10 flex-1">
                    <h3 className="font-medium text-white group-hover:text-brand-cyan transition-colors">{article.title}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-400 mt-1">
                      <span className="bg-white/5 px-2 py-0.5 rounded text-xs border border-white/10">{article.category}</span>
                      <span>•</span>
                      <span>{new Date(article.lastUpdated).toLocaleDateString('de-DE')}</span>
                    </div>
                    {article.relatedArticles && article.relatedArticles.length > 0 && (
                      <div className="mt-2 flex items-center text-xs text-blue-400">
                        <LinkIcon className="h-3 w-3 mr-1" />
                        <span>Verwandt:</span>
                        {article.relatedArticles.map((related, index) => (
                          <span key={related.id} className="ml-1 hover:text-brand-cyan cursor-pointer transition-colors">
                            {related.title}{index < article.relatedArticles!.length - 1 ? ',' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative z-10 flex space-x-1">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {article.permissions.canEdit && (
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10">
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10">
                      <History className="h-4 w-4" />
                    </Button>
                  </div>
                </SpotlightCard>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          {/* Schnellaktionen */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden"
          >
            <div className="p-6 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Schnellaktionen</h2>
            </div>
            <div className="p-6 space-y-3">
              <Button asChild variant="outline" className="w-full justify-start bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-brand-cyan">
                <Link href="/internal/wiki/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Neuen Artikel erstellen
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-brand-cyan">
                <Link href="/internal/wiki/categories">
                  <Folder className="h-4 w-4 mr-2" />
                  Kategorien verwalten
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Statistiken */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden"
          >
            <div className="p-6 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Wiki-Statistiken</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400">Gesamtartikel</span>
                <span className="font-mono font-bold text-white">57</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400">Kategorien</span>
                <span className="font-mono font-bold text-white">12</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400">Autoren</span>
                <span className="font-mono font-bold text-white">24</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}