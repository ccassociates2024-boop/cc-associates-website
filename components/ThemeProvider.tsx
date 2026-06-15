"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/* ── Counter animation helper ─────────────────────────────────────────────
   Reads data-counter="3000" and animates from 0 to that value when the
   element first enters the viewport. Supports a suffix (e.g. "+", "k").   */
function animateCounter(el: Element) {
  const raw    = el.getAttribute("data-counter") ?? "0";
  const suffix = el.getAttribute("data-counter-suffix") ?? "";
  const target = parseInt(raw.replace(/\D/g, ""), 10);
  if (!target) return;

  const duration = 1600; // ms
  const start    = performance.now();

  const step = (now: number) => {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const value  = Math.floor(eased * target);
    el.textContent = value.toLocaleString("en-IN") + suffix;
    if (progress < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  /* ── Scroll reveal (data-reveal) ──────────────────────────────────────── */
  useEffect(() => {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    const timer = setTimeout(() => {
      document
        .querySelectorAll("[data-reveal]:not(.revealed)")
        .forEach((el) => revealObserver.observe(el));
    }, 50);

    return () => {
      clearTimeout(timer);
      revealObserver.disconnect();
    };
  }, [pathname]);

  /* ── Counter animation (data-counter) ───────────────────────────────── */
  useEffect(() => {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    const timer = setTimeout(() => {
      document
        .querySelectorAll("[data-counter]:not([data-counter-done])")
        .forEach((el) => {
          el.setAttribute("data-counter-done", "");
          counterObserver.observe(el);
        });
    }, 80);

    return () => {
      clearTimeout(timer);
      counterObserver.disconnect();
    };
  }, [pathname]);

  /* ── Scroll progress bar ─────────────────────────────────────────────── */
  useEffect(() => {
    const bar = document.getElementById("ap-progress-bar");
    if (!bar) return;

    const onScroll = () => {
      const scrollTop  = window.scrollY;
      const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
      const pct        = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width  = `${Math.min(pct, 100)}%`;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return <>{children}</>;
}
