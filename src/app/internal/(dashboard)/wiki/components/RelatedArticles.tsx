"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link as LinkIcon } from "lucide-react";
import Link from "next/link";

interface RelatedArticle {
  id: number;
  title: string;
}

interface RelatedArticlesProps {
  articles: RelatedArticle[];
}

export function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (!articles || articles.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <LinkIcon className="h-5 w-5 mr-2" />
          Verwandte Artikel
        </CardTitle>
        <CardDescription>
          Möglicherweise relevante Artikel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {articles.map((article) => (
            <Link 
              key={article.id}
              href={`/internal/wiki/article/${article.id}`}
              className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h4 className="font-medium text-blue-600 hover:underline">
                {article.title}
              </h4>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}