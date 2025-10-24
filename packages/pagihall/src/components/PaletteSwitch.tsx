"use client";
import { useEffect, useState } from "react";

type Mode = "tuscan" | "neutral";

/** Small palette toggle that persists to localStorage and flips a class on <body>. */
export default function PaletteSwitch({ className = "" }: { className?: string }) {
  const [mode, setMode] = useState<Mode>("tuscan");

  useEffect(() => {
    const saved = (localStorage.getItem("palette.mode") as Mode) || "tuscan";
    setMode(saved);
    apply(saved);
  }, []);

  function apply(m: Mode) {
    const b = document.body;
    b.classList.remove("theme-tuscan", "theme-neutral");
    b.classList.add(m === "tuscan" ? "theme-tuscan" : "theme-neutral");
  }

  function toggle() {
    const next = mode === "tuscan" ? "neutral" : "tuscan";
    setMode(next);
    localStorage.setItem("palette.mode", next);
    apply(next);
  }

  const label = mode === "tuscan" ? "Tuscan" : "Neutral";

  return (
    <button
      onClick={toggle}
      className={`text-xs border border-[var(--line)] rounded-[12px] px-3 py-1 hover:bg-[var(--panel)] ${className}`}
      title="Toggle palette"
      aria-label="Toggle palette"
    >
      Theme: {label}
    </button>
  );
}
