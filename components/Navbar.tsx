"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import clsx from "clsx";

const navLinks = [
  { label: "Services", href: "/services" },
  { label: "Tools", href: "/tools" },
  { label: "Resources", href: "/resources" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <header
      className={clsx(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white shadow-sm border-b border-purple-100"
          : "bg-white border-b border-transparent"
      )}
    >
      <nav className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-2xl bg-purple-600 flex items-center justify-center">
              <span className="text-white font-semibold text-sm tracking-tight">CC</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-[#26215C] text-sm">CC Associates</span>
              <span className="text-[10px] text-[#7F77DD] -mt-0.5 tracking-wide">
                Tax &amp; Advisory
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "text-purple-600 bg-purple-50 font-semibold"
                    : "text-[#7F77DD] hover:text-[#26215C] hover:bg-purple-50"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA + Mobile toggle */}
          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className="hidden md:inline-flex items-center px-4 py-2 bg-purple-600 text-white
                         font-medium text-sm rounded-xl hover:bg-purple-800
                         transition-all duration-200 shadow-sm"
            >
              Book Consultation
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg text-[#7F77DD] hover:text-[#26215C]
                         hover:bg-purple-50 transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {isOpen && (
          <div className="md:hidden border-t border-purple-100 py-3 pb-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "block px-4 py-3 text-sm font-medium rounded-xl mx-1 transition-colors",
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "text-purple-600 bg-purple-50 font-semibold"
                    : "text-[#7F77DD] hover:text-[#26215C] hover:bg-purple-50"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="px-1 mt-3">
              <Link
                href="/contact"
                className="block text-center py-3 bg-purple-600 text-white font-medium
                           text-sm rounded-xl hover:bg-purple-800 transition-all duration-200"
              >
                Book Consultation
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
