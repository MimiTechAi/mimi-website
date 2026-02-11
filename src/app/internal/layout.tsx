"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/internal/Sidebar";
import { Header } from "@/components/internal/Header";
import { Footer } from "@/components/internal/Footer";
import { Toaster } from "@/components/ui/sonner";
import { usePathname, useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { SessionProvider, signIn, useSession } from "next-auth/react";

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <InternalLayoutContent>
        {children}
      </InternalLayoutContent>
    </SessionProvider>
  );
}

function InternalLayoutContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const loading = status === "loading";

  // Überprüfen Sie die Authentifizierung
  useEffect(() => {
    // In einer echten Implementierung würden Sie hier die Authentifizierung prüfen
    // Zum Beispiel durch Überprüfung eines Tokens im localStorage oder durch einen API-Aufruf
    const checkAuth = async () => {
      // Wenn die Session noch geladen wird, warten wir
      if (loading) return;

      const publicRoutes = ['/internal/login', '/internal/register'];

      // Wenn keine Session besteht und wir nicht auf einer öffentlichen Seite sind, 
      // leiten wir zur Login-Seite weiter
      if (!session && !publicRoutes.includes(pathname)) {
        router.push('/internal/login');
      }
    };

    checkAuth();
  }, [session, pathname, router, loading]);

  // Wenn die Session noch geladen wird, zeigen wir nichts an
  if (loading && !['/internal/login', '/internal/register'].includes(pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" role="status" aria-label="Authentifierung wird überprüft">
        <div className="text-center">
          <Spinner className="h-8 w-8 mx-auto" />
          <p className="mt-4 text-gray-500">Überprüfe Authentifizierung...</p>
        </div>
      </div>
    );
  }

  // Wenn keine Session besteht und wir nicht auf einer öffentlichen Seite sind, 
  // zeigen wir eine Zugriffsverweigerungsnachricht an
  if (!session && !['/internal/login', '/internal/register'].includes(pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" role="status" aria-label="Nicht authentifiziert">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" aria-hidden="true"></div>
          <p className="mt-4 text-gray-500">Zugriff verweigert. Sie werden zur Anmeldeseite weitergeleitet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - nur anzeigen, wenn authentifiziert und nicht auf Login/Registrierungsseite */}
      {session && !['/internal/login', '/internal/register'].includes(pathname) && (
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header - nur anzeigen, wenn authentifiziert und nicht auf Login/Registrierungsseite */}
        {session && !['/internal/login', '/internal/register'].includes(pathname) && (
          <Header setSidebarOpen={setSidebarOpen} />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6" role="main">
          {children}
        </main>

        {/* Footer - nur anzeigen, wenn authentifiziert und nicht auf Login/Registrierungsseite */}
        {session && !['/internal/login', '/internal/register'].includes(pathname) && (
          <Footer />
        )}
      </div>

      {/* Toaster for notifications */}
      <Toaster />
    </div>
  );
}