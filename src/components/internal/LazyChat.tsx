"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Loader2 } from 'lucide-react';

export default function LazyChat() {
  const [ChatComponent, setChatComponent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChat = async () => {
      try {
        // Dynamischer Import der Chat-Komponente für Code-Splitting
        const { default: ChatPage } = await import('@/app/internal/(dashboard)/chat/page');
        setChatComponent(() => ChatPage);
      } catch (error) {
        console.error('Fehler beim Laden der Chat-Komponente:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChat();
  }, []);

  if (loading) {
    return (
      <Card className="flex flex-col h-[calc(100vh-200px)]">
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-muted-foreground">Chat wird geladen...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!ChatComponent) {
    return (
      <Card className="flex flex-col h-[calc(100vh-200px)]">
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Chat nicht verfügbar</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Die Chat-Komponente konnte nicht geladen werden.
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

  return <ChatComponent />;
}