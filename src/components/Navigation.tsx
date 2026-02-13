"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, LogIn, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { trackCTA } from "@/components/GoogleAnalytics";
import OptimizedImage from "@/components/OptimizedImage";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ── Navigation Data Structure ────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  highlight?: boolean;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

interface NavDropdownItem {
  label: string;
  children: NavGroup[];
}

type NavEntry = NavItem | NavDropdownItem;

function isDropdown(entry: NavEntry): entry is NavDropdownItem {
  return "children" in entry;
}

const navStructure: NavEntry[] = [
  { href: "/", label: "Home" },
  {
    label: "Leistungen",
    children: [
      {
        group: "KI-Beratung",
        items: [
          { href: "/ki-beratung", label: "Übersicht" },
          { href: "/ki-beratung/unternehmen", label: "Für Unternehmen" },
          { href: "/ki-beratung/selbstaendige", label: "Für Selbständige" },
        ],
      },
      {
        group: "Digitale Zwillinge",
        items: [
          { href: "/digitale-zwillinge", label: "Übersicht" },
          { href: "/digitale-zwillinge/urban", label: "Urban / Smart City" },
          { href: "/digitale-zwillinge/bau", label: "Bau & Sanierung" },
          { href: "/digitale-zwillinge/unternehmen", label: "Enterprise" },
        ],
      },
      {
        group: "Wissen",
        items: [
          { href: "/ki-erklaert", label: "KI Erklärt" },
        ],
      },
    ],
  },
  { href: "/mimi", label: "MIMI", highlight: true },
  { href: "/about", label: "Über uns" },
  { href: "/contact", label: "Kontakt" },
];

// ── Navigation Link ──────────────────────────────────────────────────────────

const NavigationLink = ({ href, children, highlight }: { href: string; children: React.ReactNode; highlight?: boolean }) => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <Link
      href={href}
      aria-current={isActive(href) ? "page" : undefined}
      className={`px-4 py-3 rounded-md text-sm font-medium transition-all duration-300 relative group nav-touch-target ${isActive(href)
          ? "text-brand-cyan font-semibold"
          : highlight
            ? "text-brand-cyan/90 hover:text-brand-cyan"
            : "text-white/70 hover:text-white"
        }`}
    >
      <span className="flex items-center gap-1.5">
        {highlight && <Sparkles size={14} className="text-brand-cyan animate-pulse" />}
        {children}
      </span>
      {isActive(href) && (
        <motion.span
          layoutId="nav-underline"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-cyan rounded-full shadow-[0_0_8px_var(--brand-cyan)]"
          aria-hidden="true"
        />
      )}
      <span className="absolute inset-0 rounded-md bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
    </Link>
  );
};

// ── Desktop Dropdown ─────────────────────────────────────────────────────────

const DesktopDropdown = ({ entry }: { entry: NavDropdownItem }) => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const allHrefs = entry.children.flatMap(g => g.items.map(i => i.href));
  const isChildActive = allHrefs.some(href => pathname.startsWith(href));

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 150);
  };

  const menuId = `dropdown-menu-${entry.label.toLowerCase().replace(/\s+/g, '-')}`;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "ArrowDown" && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={`px-4 py-3 rounded-md text-sm font-medium transition-all duration-300 relative group nav-touch-target flex items-center gap-1 ${isChildActive
            ? "text-brand-cyan font-semibold"
            : "text-white/70 hover:text-white"
          }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls={menuId}
        onKeyDown={handleKeyDown}
      >
        {entry.label}
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
        {isChildActive && (
          <motion.span
            layoutId="nav-underline"
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-cyan rounded-full shadow-[0_0_8px_var(--brand-cyan)]"
            aria-hidden="true"
          />
        )}
        <span className="absolute inset-0 rounded-md bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[520px] rounded-xl glass-premium p-5 shadow-2xl shadow-black/40"
            id={menuId}
            role="menu"
            aria-label={`${entry.label} Untermenü`}
          >
            {/* Arrow */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-white/5 backdrop-blur-xl border-t border-l border-white/10" />

            <div className="grid grid-cols-3 gap-5 relative z-10">
              {entry.children.map((group) => (
                <div key={group.group}>
                  <p className="text-xs font-semibold text-brand-cyan/70 uppercase tracking-wider mb-3">
                    {group.group}
                  </p>
                  <div className="flex flex-col gap-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        className={`text-sm px-3 py-2 rounded-lg transition-all duration-200 block ${pathname.startsWith(item.href)
                            ? "text-brand-cyan bg-brand-cyan/10 font-medium"
                            : "text-white/70 hover:text-white hover:bg-white/5"
                          }`}
                        onClick={() => setIsOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Main Navigation ──────────────────────────────────────────────────────────

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      id="navigation"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? "bg-black/20 backdrop-blur-xl border-b border-white/10 shadow-lg"
          : "bg-transparent border-b border-transparent"
        }`}
      aria-label="Hauptnavigation"
      style={{ viewTransitionName: "nav-bar" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`flex justify-between items-center transition-all duration-300 ${isScrolled ? "h-16" : "h-24"
            }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center group" aria-label="MiMi Tech AI - Zur Startseite" tabIndex={0}>
            <OptimizedImage
              src="/images/D0EE8562-8054-48B5-AE81-6DAD6143E07C.png"
              alt="MiMi Tech AI Logo"
              width={isScrolled ? 64 : 96}
              height={isScrolled ? 64 : 96}
              className="rounded-xl"
              quality={85}
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
              showLoader={false}
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navStructure.map((entry, i) =>
              isDropdown(entry) ? (
                <DesktopDropdown key={entry.label} entry={entry} />
              ) : (
                <NavigationLink key={entry.href} href={entry.href} highlight={entry.highlight}>
                  {entry.label}
                </NavigationLink>
              )
            )}

            {/* Login Button */}
            <Link
              href="/internal"
              className="ml-2 px-3 py-2 rounded-md text-sm text-white/50 hover:text-white/80 transition-all duration-300 flex items-center gap-1.5 hover:bg-white/5"
              aria-label="Login zum internen Bereich"
            >
              <LogIn size={14} />
              <span className="hidden lg:inline">Login</span>
            </Link>

            {/* CTA Button */}
            <motion.div
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <Button
                asChild
                size="sm"
                className="ml-2 bg-gradient-to-r from-brand-cyan to-brand-blue hover:from-brand-cyan/80 hover:to-brand-blue/80 text-black font-medium border-0 shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)] transition-all duration-300"
                onClick={() => trackCTA("Beratung anfragen", "Navigation Desktop")}
              >
                <Link href="/contact">Beratung anfragen</Link>
              </Button>
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <button
                data-testid="mobile-menu-button"
                className="md:hidden p-2 text-white hover:text-brand-cyan transition-colors rounded-lg hover:bg-white/5"
                aria-label={isMenuOpen ? "Menü schließen" : "Menü öffnen"}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </SheetTrigger>

            <SheetContent
              id="mobile-menu"
              side="right"
              className="bg-black/60 backdrop-blur-xl border-white/10 text-white"
            >
              <SheetHeader>
                <SheetTitle>Menü</SheetTitle>
              </SheetHeader>

              <div className="px-4 pb-6 flex flex-col gap-1">
                {navStructure.map((entry) =>
                  isDropdown(entry) ? (
                    /* Accordion for "Leistungen" */
                    <Accordion key={entry.label} type="single" collapsible className="w-full">
                      <AccordionItem value={entry.label} className="border-b-0">
                        <AccordionTrigger className="py-3 px-4 rounded-lg text-white/80 hover:text-white hover:bg-white/5 text-base font-medium hover:no-underline">
                          {entry.label}
                        </AccordionTrigger>
                        <AccordionContent className="pb-2">
                          <div className="flex flex-col gap-1 pl-2">
                            {entry.children.map((group) => (
                              <div key={group.group} className="mb-2">
                                <p className="text-xs font-semibold text-brand-cyan/60 uppercase tracking-wider px-4 py-1">
                                  {group.group}
                                </p>
                                {group.items.map((item) => (
                                  <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`text-sm py-2.5 px-4 block rounded-lg transition-all duration-200 ${isActive(item.href)
                                        ? "text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/20 font-medium"
                                        : "text-white/70 hover:text-white hover:bg-white/5"
                                      }`}
                                    onClick={() => setIsMenuOpen(false)}
                                    aria-current={isActive(item.href) ? "page" : undefined}
                                  >
                                    {item.label}
                                  </Link>
                                ))}
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  ) : (
                    <Link
                      key={entry.href}
                      href={entry.href}
                      className={`font-medium transition-all duration-200 py-3 px-4 block rounded-lg text-base ${isActive(entry.href)
                          ? "text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/20"
                          : "text-white/80 hover:text-white hover:bg-white/5"
                        }`}
                      onClick={() => setIsMenuOpen(false)}
                      aria-current={isActive(entry.href) ? "page" : undefined}
                      tabIndex={0}
                    >
                      <span className="flex items-center gap-1.5">
                        {entry.highlight && <Sparkles size={14} className="text-brand-cyan" />}
                        {entry.label}
                      </span>
                    </Link>
                  )
                )}

                {/* Mobile Login */}
                <Link
                  href="/internal"
                  className="font-medium transition-all duration-200 py-3 px-4 block rounded-lg text-white/60 hover:text-white hover:bg-white/5 flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LogIn size={16} />
                  Login
                </Link>

                {/* Mobile CTA */}
                <div className="mt-3 pt-3 border-t border-white/10">
                  <motion.div
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97, y: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  >
                    <Button
                      asChild
                      size="lg"
                      className="w-full bg-gradient-to-r from-brand-cyan to-brand-blue hover:from-brand-cyan/80 hover:to-brand-blue/80 text-black font-medium border-0 shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                      onClick={() => trackCTA("Beratung anfragen", "Navigation Mobile")}
                    >
                      <Link href="/contact" onClick={() => setIsMenuOpen(false)} tabIndex={0}>
                        Beratung anfragen
                      </Link>
                    </Button>
                  </motion.div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}