"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Save, History } from "lucide-react";
import { ArticleVersionHistory } from "./ArticleVersionHistory";
import { RelatedArticles } from "./RelatedArticles";
import { useState } from "react";

interface ArticleEditorProps {
  article?: {
    id?: number;
    title: string;
    content: string;
    category: string;
    versions?: any[];
    relatedArticles?: any[];
  };
  onSave: (article: any) => void;
  onCancel: () => void;
}

export function ArticleEditor({ article, onSave, onCancel }: ArticleEditorProps) {
  const [title, setTitle] = useState(article?.title || "");
  const [content, setContent] = useState(article?.content || "");
  const [category, setCategory] = useState(article?.category || "");
  const [versionComment, setVersionComment] = useState("");

  const handleSave = () => {
    onSave({
      id: article?.id,
      title,
      content,
      category,
      versionComment
    });
  };

  const categories = [
    "Unternehmensrichtlinien",
    "Entwicklungsprozesse",
    "IT-Ressourcen",
    "Schulungsmaterialien",
    "Produktdokumentation",
    "FAQ"
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {article?.id ? "Artikel bearbeiten" : "Neuen Artikel erstellen"}
          </CardTitle>
          <CardDescription>
            Füllen Sie die folgenden Felder aus, um einen Wiki-Artikel zu erstellen oder zu bearbeiten
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Geben Sie einen aussagekräftigen Titel ein"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategorie</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Kategorie auswählen" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Inhalt</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Schreiben Sie den Artikelinhalt hier..."
              className="min-h-[300px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="versionComment">Versionskommentar (optional)</Label>
            <Input
              id="versionComment"
              value={versionComment}
              onChange={(e) => setVersionComment(e.target.value)}
              placeholder="Beschreiben Sie die Änderungen in dieser Version"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onCancel}>
              Abbrechen
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Speichern
            </Button>
          </div>
        </CardContent>
      </Card>

      {article?.versions && article.versions.length > 0 && (
        <ArticleVersionHistory versions={article.versions} />
      )}

      {article?.relatedArticles && article.relatedArticles.length > 0 && (
        <RelatedArticles articles={article.relatedArticles} />
      )}
    </div>
  );
}