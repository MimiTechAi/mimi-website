"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";

interface ArticleVersion {
  id: number;
  content: string;
  author: string;
  timestamp: string;
  comment: string;
}

interface ArticleVersionHistoryProps {
  versions: ArticleVersion[];
  onRestore?: (versionId: number) => void;
}

export function ArticleVersionHistory({ versions, onRestore }: ArticleVersionHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <History className="h-5 w-5 mr-2" />
          Versionshistorie
        </CardTitle>
        <CardDescription>
          Alle Änderungen an diesem Artikel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {versions.map((version) => (
            <div key={version.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">Version {version.id}</h4>
                  <p className="text-sm text-muted-foreground">
                    von {version.author} am {new Date(version.timestamp).toLocaleString('de-DE')}
                  </p>
                  {version.comment && (
                    <p className="text-sm mt-1 italic">
                      "{version.comment}"
                    </p>
                  )}
                </div>
                {onRestore && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onRestore(version.id)}
                  >
                    Wiederherstellen
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}