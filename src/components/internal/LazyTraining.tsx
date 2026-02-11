"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Loader2 } from 'lucide-react';

export default function LazyTraining() {
  const [TrainingComponent, setTrainingComponent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTraining = async () => {
      try {
        // Dynamischer Import der Schulungs-Komponente für Code-Splitting
        const { default: TrainingPage } = await import('@/app/internal/(dashboard)/training/page');
        setTrainingComponent(() => TrainingPage);
      } catch (error) {
        console.error('Fehler beim Laden der Schulungs-Komponente:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTraining();
  }, []);

  if (loading) {
    return (
      <Card className="flex flex-col h-[calc(100vh-200px)]">
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-muted-foreground">Schulungen werden geladen...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!TrainingComponent) {
    return (
      <Card className="flex flex-col h-[calc(100vh-200px)]">
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Schulungen nicht verfügbar</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Die Schulungs-Komponente konnte nicht geladen werden.
            </p>
            <Button 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Erneut versuchen
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <TrainingComponent />;
}