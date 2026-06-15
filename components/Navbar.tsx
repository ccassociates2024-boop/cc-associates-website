"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Sun, Moon, Search, ArrowRight } from "lucide-react";
import clsx from "clsx";

const NAV_LINKS = [
  { label: "Services",  href: "/services" },
  { label: "Tools",     href: "/tools" },
  { label: "Resources", href: "/resources" },
  { label: "Contact",   href: "/contact" },
];

const SPOTLIGHT_ITEMS = [
  { type: "page", icon: "🏠", label: "Home",        desc: "Main page",                  href: "/" },
  { type: "page", icon: "⚖️", label: "Services",    desc: "Tax & finance services",     href: "/services" },
  { type: "page", icon: "🛠", label: "Free Tools",   desc: "15 browser-based tools",     href: "/tools" },
  { type: "page", icon: "📬", label: "Contact",      desc: "Book a consultation",        href: "/contact" },
  { type: "page", icon: "📚", label: "Resources",    desc: "Tax guides & articles",      href: "/resources" },
  { type: "tool", icon: "🧾", label: "GST Invoice Generator", desc: "Generate GST invoices",    href: "/tools/gst-invoice" },
  { type: "tool", icon: "🔢", label: "TDS Calculator",         desc: "Section-wise TDS rates",  href: "/tools/tds-calculator" },
  { type: "tool", icon: "📊", label: "Income Tax Estimator",   desc: "Old vs New regime",        href: "/tools/itr-estimator" },
  { type: "tool", icon: "🏦", label: "Bank Statement → Excel", desc: "PDF extraction tool",     href: "/tools/bank-statement" },
  { type: "tool", icon: "💰", label: "Capital Gains Calc",     desc: "STCG / LTCG calculator",  href: "/tools/capital-gains" },
  { type: "tool", icon: "📝", label: "Notice Reply Generator", desc: "143(1), 148A & more",     href: "/tools/notice-reply" },
  { type: "tool", icon: "📑", label: "PDF Merge",              desc: "Merge multiple PDFs",      href: "/tools/pdf-merge" },
  { type: "tool", icon: "📉", label: "Advance Tax Calc",       desc: "Quarterly advance tax",   href: "/tools/advance-tax" },
];

function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("cc-theme", next ? "dark" : "light"); } catch {}
    setDark(next);
  }, []);

  return { dark, toggle };
}

export default function Navbar() {
  const [open, setOpen]           = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const [spotlight, setSpotlight] = useState(false);
  const [query, setQuery]         = useState("");
  const [selected, setSelected]   = useState(0);
  const searchRef                 = useRef<HTMLInputElement>(null);
  const pathname                  = usePathname();
  const router                    = useRouter();
  const { dark, toggle }          = useTheme();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSpotlight(true); }
      if (e.key === "Escape") setSpotlight(false);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  useEffect(() => {
    if (spotlight) { setQuery(""); setSelected(0); setTimeout(() => searchRef.current?.focus(), 50); }
  }, [spotlight]);

  const filtered = SPOTLIGHT_ITEMS.filter(
    (item) =>
      !query ||
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.desc.toLowerCase().includes(query.toLowerCase())
  );

  const handleSpotlightKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && filtered[selected]) { router.push(filtered[selected].href); setSpotlight(false); }
  };

  return (
    <>
      <header className={clsx(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "ap-nav shadow-sm" : "ap-nav"
      )}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[60px]">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:shadow-[0_0_16px_rgba(201,168,76,0.35)]"
                   style={{ background: "linear-gradient(135deg, #0A1628 0%, #1F3088 60%, #2A40A0 100%)", boxShadow: "0 2px 8px rgba(10,22,40,0.35), inset 0 1px 0 rgba(255,255,255,0.08)", border: "1px solid rgba(201,168,76,0.20)" }}>
                <span className="text-white font-black text-sm tracking-tight">CC</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-medium text-xs tracking-wide" style={{ color: "var(--ap-text-muted)" }}>CC</span>
                <span className="font-black text-sm -mt-0.5 tracking-tight" style={{ color: "var(--ap-text)" }}>
                  Associates<span style={{ color: "#C9A84C" }}>.</span>
                </span>
              </div>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-0.5">
              {NAV_LINKS.map((link) => {
                const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link key={link.href} href={link.href}
                    className={clsx(
                      "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150",
                      active ? "font-semibold" : "hover:opacity-80"
                    )}
                    style={active
                      ? { color: "#C9A84C", background: "rgba(201,168,76,0.10)" }
                      : { color: "var(--ap-text-muted)" }
                    }
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSpotlight(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all duration-150 hover:opacity-80"
                style={{ background: "var(--ap-glass)", border: "1px solid var(--ap-border)", color: "var(--ap-text-muted)", backdropFilter: "blur(8px)" }}
                title="Search (⌘K)"
              >
                <Search size={13} />
                <span>Search</span>
                <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: "var(--ap-border)", color: "var(--ap-text-muted)" }}>⌘K</kbd>
              </button>

              <button
                onClick={toggle}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:opacity-80"
                style={{ background: "var(--ap-glass)", border: "1px solid var(--ap-border)" }}
                aria-label="Toggle dark mode"
              >
                {dark
                  ? <Sun size={16} style={{ color: "#C9A84C" }} />
                  : <Moon size={16} style={{ color: "var(--ap-text-muted)" }} />
                }
              </button>

              <Link href="/contact" className="hidden md:inline-flex btn-gold text-xs px-4 py-2 gap-1.5">
                Book Consultation
              </Link>

              <button
                onClick={() => setOpen(!open)}
                className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{ background: "var(--ap-glass)", border: "1px solid var(--ap-border)" }}
                aria-label="Toggle menu"
              >
                {open ? <X size={18} style={{ color: "var(--ap-text)" }} /> : <Menu size={18} style={{ color: "var(--ap-text)" }} />}
              </button>
            </div>
          </div>

          {/* Mobile Drawer */}
          {open && (
            <div className="md:hidden py-3 pb-5 animate-slide-down" style={{ borderTop: "1px solid var(--ap-border)" }}>
              {NAV_LINKS.map((link) => {
                const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link key={link.href} href={link.href}
                    className="block px-4 py-3 text-sm font-medium rounded-xl mx-1 mb-0.5 transition-all"
                    style={active
                      ? { color: "#C9A84C", background: "rgba(201,168,76,0.10)" }
                      : { color: "var(--ap-text-muted)" }
                    }
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="flex gap-2 px-1 mt-3">
                <button
                  onClick={() => { setOpen(false); setSpotlight(true); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: "var(--ap-glass)", border: "1px solid var(--ap-border)", color: "var(--ap-text-muted)" }}
                >
                  <Search size={14} /> Search
                </button>
                <Link href="/contact" className="flex-1 btn-gold text-xs justify-center py-2.5">
                  Book Consultation
                </Link>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Spotlight Modal */}
      {spotlight && (
        <div className="spotlight-overlay" onClick={() => setSpotlight(false)}>
          <div className="spotlight-box mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--ap-border)" }}>
              <Search size={18} style={{ color: "var(--ap-text-muted)", flexShrink: 0 }} />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search pages, tools..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
                onKeyDown={handleSpotlightKey}
                className="flex-1 bg-transparent text-sm font-medium outline-none"
                style={{ color: "var(--ap-text)" }}
              />
              <kbd className="px-2 py-1 rounded-lg text-xs font-mono" style={{ background: "var(--ap-border)", color: "var(--ap-text-muted)" }}>ESC</kbd>
            </div>

            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {filtered.length === 0 ? (
                <div className="py-10 text-center text-sm" style={{ color: "var(--ap-text-muted)" }}>No results for &quot;{query}&quot;</div>
              ) : (
                <>
                  {["page", "tool"].map((type) => {
                    const items = filtered.filter((f) => f.type === type);
                    if (!items.length) return null;
                    return (
                      <div key={type}>
                        <div className="px-5 py-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--ap-text-muted)" }}>
                          {type === "page" ? "Pages" : "Tools"}
                        </div>
                        {items.map((item) => {
                          const idx = filtered.indexOf(item);
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setSpotlight(false)}
                              className="flex items-center gap-3 px-5 py-3 transition-all duration-100"
                              style={{
                                background: idx === selected ? "rgba(201,168,76,0.10)" : "transparent",
                                borderLeft: idx === selected ? "2px solid #C9A84C" : "2px solid transparent",
                              }}
                              onMouseEnter={() => setSelected(idx)}
                            >
                              <span className="text-xl w-7 text-center flex-shrink-0">{item.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold truncate" style={{ color: "var(--ap-text)" }}>{item.label}</div>
                                <div className="text-xs truncate" style={{ color: "var(--ap-text-muted)" }}>{item.desc}</div>
                              </div>
                              <ArrowRight size={14} style={{ color: "var(--ap-text-muted)", flexShrink: 0 }} />
                            </Link>
                          );
                        })}
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid var(--ap-border)" }}>
              <span className="text-[10px]" style={{ color: "var(--ap-text-muted)" }}>↑↓ navigate · ↵ open · ESC close</span>
              <span className="text-[10px]" style={{ color: "var(--ap-text-muted)" }}>{filtered.length} results</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
