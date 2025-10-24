"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatToHtml } from "@/src/lib/formatter";

// Debounce to avoid reformatting every tiny token chunk
function useDebounced<T>(value: T, delay = 140) {
  const t = useRef<number>(); 
  const v = useRef(value);
  const [, force] = useState(0);
  
  useEffect(() => { 
    v.current = value; 
    window.clearTimeout(t.current);
    t.current = window.setTimeout(() => force(x => x + 1), delay);
    return () => window.clearTimeout(t.current);
  }, [value, delay]);
  
  return v.current;
}

export default function Formatted({ raw }: { raw: string }) {
  const debounced = useDebounced(raw);
  const html = useMemo(() => formatToHtml(debounced ?? ""), [debounced]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current; 
    if (!el) return;

    // Add copy buttons once per pre>code (idempotent)
    const blocks = el.querySelectorAll("pre > code");
    blocks.forEach(code => {
      const pre = code.parentElement!;
      if (pre.parentElement?.classList.contains("codewrap")) return; // already wrapped

      const wrap = document.createElement("div");
      wrap.className = "codewrap";
      pre.replaceWith(wrap);
      wrap.appendChild(pre);

      const btn = document.createElement("button");
      btn.className = "copybtn";
      btn.type = "button";
      btn.textContent = "Copy";
      btn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(code.textContent || "");
          btn.classList.add("copied");
          btn.textContent = "Copied";
          setTimeout(() => { 
            btn.classList.remove("copied"); 
            btn.textContent = "Copy"; 
          }, 1200);
        } catch { /* ignore */ }
      });
      wrap.appendChild(btn);
    });
  }, [html]); // re-run after html changes

  return (
    <div
      ref={ref}
      className="cuidado-prose"
      // ok here — our formatter escapes content and only injects safe tags
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
