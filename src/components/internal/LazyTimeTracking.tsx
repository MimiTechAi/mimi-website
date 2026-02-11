"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Loader2 } from 'lucide-react';

export default function LazyTimeTracking() {
  const [TimeTrackingComponent, setTimeTrackingComponent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTimeTracking = async () => {
      try {
        // Dynamischer Import der Zeiterfassungs-Komponente für Code-Splitting
        const { default: TimeTrackingPage } = await import('@/app/internal/(dashboard)/time-tracking/page');
        setTimeTrackingComponent(() => TimeTrackingPage);
      } catch (error) {
        console.error('Fehler beim Laden der Zeiterfassungs-Komponente:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTimeTracking();
  }, []);

  if (loading) {
    return (
      <Card className="flex flex-col h-[calc(100vh-200px)]">
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-muted-foreground">Zeiterfassung wird geladen...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!TimeTrackingComponent) {
    return (
      <Card className="flex flex-col h-[calc(100vh-200px)]">
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Zeiterfassung nicht verfügbar</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Die Zeiterfassungs-Komponente konnte nicht geladen werden.
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

  return <TimeTrackingComponent />;
}