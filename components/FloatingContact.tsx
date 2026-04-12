"use client";

import { useState, useEffect } from "react";
import { Phone, X } from "lucide-react";

const WA_URL =
  "https://wa.me/917507354141?text=Hello%20CC%20Associates%2C%20I%20need%20tax%20and%20advisory%20consultation.";
const CALL_URL = "tel:+917507354141";

export default function FloatingContact() {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`fixed bottom-6 right-5 z-[9999] flex flex-col items-end gap-3 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"
      }`}
    >
      {/* Expanded options */}
      <div
        className={`flex flex-col items-end gap-2 transition-all duration-300 ${
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        {/* WhatsApp — only place green is used */}
        <a
          href={WA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white
                     text-sm font-medium px-4 py-2.5 rounded-full shadow-lg transition-colors whitespace-nowrap"
          onClick={() => setOpen(false)}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white flex-shrink-0" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.561 4.14 1.535 5.875L.057 23.985l6.293-1.648A11.935 11.935 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.877 9.877 0 01-5.031-1.376l-.361-.214-3.735.979 1-3.639-.235-.374A9.872 9.872 0 012.106 12C2.106 6.53 6.53 2.106 12 2.106c5.471 0 9.894 4.424 9.894 9.894 0 5.471-4.423 9.894-9.894 9.894z" />
          </svg>
          WhatsApp
        </a>

        {/* Call */}
        <a
          href={CALL_URL}
          className="flex items-center gap-2.5 bg-purple-600 hover:bg-purple-800 text-white
                     text-sm font-medium px-4 py-2.5 rounded-full shadow-lg transition-colors whitespace-nowrap"
          onClick={() => setOpen(false)}
        >
          <Phone size={14} className="flex-shrink-0" />
          +91 75073 54141
        </a>
      </div>

      {/* Main toggle button */}
      <div className="relative">
        {/* Pulsing availability dot */}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 z-10">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500" />
          </span>
        )}

        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close contact options" : "Contact CC Associates"}
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center
                      transition-all duration-300 focus:outline-none focus:ring-2
                      focus:ring-offset-2 focus:ring-purple-600 ${
                        open
                          ? "bg-purple-900 rotate-90"
                          : "bg-purple-600 hover:bg-purple-800 hover:scale-105"
                      }`}
        >
          {open ? (
            <X size={22} className="text-white" />
          ) : (
            <span className="flex flex-col items-center justify-center gap-0.5">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25D366]" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.561 4.14 1.535 5.875L.057 23.985l6.293-1.648A11.935 11.935 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.877 9.877 0 01-5.031-1.376l-.361-.214-3.735.979 1-3.639-.235-.374A9.872 9.872 0 012.106 12C2.106 6.53 6.53 2.106 12 2.106c5.471 0 9.894 4.424 9.894 9.894 0 5.471-4.423 9.894-9.894 9.894z" />
              </svg>
              <Phone size={11} className="text-white/80" />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
