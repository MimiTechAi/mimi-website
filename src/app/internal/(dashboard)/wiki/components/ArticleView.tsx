"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, History, Link as LinkIcon } from "lucide-react";
import { ArticleVersionHistory } from "./ArticleVersionHistory";
import { RelatedArticles } from "./RelatedArticles";
import { useState } from "react";

interface Article {
  id: number;
  title: string;
  content: string;
  category: string;
  lastUpdated: string;
  author: string;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canShare: boolean;
  };
  versions: any[];
  relatedArticles?: any[];
}

interface ArticleViewProps {
  article: Article;
  onEdit: () => void;
}

export function ArticleView({ article, onEdit }: ArticleViewProps) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{article.title}</CardTitle>
              <CardDescription>
                Kategorie: {article.category} • Zuletzt aktualisiert: {new Date(article.lastUpdated).toLocaleDateString('de-DE')} von {article.author}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              {article.permissions.canEdit && (
                <Button onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Bearbeiten
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
                <History className="h-4 w-4 mr-2" />
                {showHistory ? "Verlauf ausblenden" : "Verlauf anzeigen"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p>{article.content}</p>
          </div>
        </CardContent>
      </Card>

      {showHistory && article.versions && article.versions.length > 0 && (
        <ArticleVersionHistory versions={article.versions} />
      )}

      {article.relatedArticles && article.relatedArticles.length > 0 && (
        <RelatedArticles articles={article.relatedArticles} />
      )}
    </div>
  );
}