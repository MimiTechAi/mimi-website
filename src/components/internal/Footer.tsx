"use client";

export function Footer() {
  return (
    <footer className="bg-white border-t py-4">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} MiMi Tech AI. Alle Rechte vorbehalten.
          </div>
          <div className="flex space-x-6 mt-2 md:mt-0">
            <a href="/internal/impressum" className="text-sm text-muted-foreground hover:text-blue-600 transition-colors">
              Impressum
            </a>
            <a href="/internal/datenschutz" className="text-sm text-muted-foreground hover:text-blue-600 transition-colors">
              Datenschutz
            </a>
            <a href="/internal/help" className="text-sm text-muted-foreground hover:text-blue-600 transition-colors">
              Hilfe
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}