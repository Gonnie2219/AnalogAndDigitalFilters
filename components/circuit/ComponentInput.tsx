"use client";
import { useState, useEffect, useRef } from "react";
import { formatEngineering, parseEngineering } from "@/lib/utils/formatLatex";

interface ComponentInputProps {
  label: string;
  unit: string;
  value: number;
  onChange: (v: number) => void;
}

function formatDisplay(value: number, unit: string): string {
  return `${formatEngineering(value)}${unit}`;
}

export default function ComponentInput({ label, unit, value, onChange }: ComponentInputProps) {
  const [text, setText] = useState(() => formatDisplay(value, unit));
  const focused = useRef(false);

  // Sync from parent only when not actively editing
  useEffect(() => {
    if (!focused.current) {
      setText(formatDisplay(value, unit));
    }
  }, [value, unit]);

  const commit = () => {
    // Strip unit suffix if present (e.g., "10kΩ" → "10k")
    const cleaned = text.replace(/[ΩFH]$/u, "").trim();
    const v = parseEngineering(cleaned);
    if (v !== null && v > 0) {
      onChange(v);
    } else {
      setText(formatDisplay(value, unit));
    }
  };

  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[10px] font-medium text-[var(--text-secondary)]">{label}</label>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => { focused.current = true; }}
        onBlur={() => { focused.current = false; commit(); }}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); }}
        className="w-full px-1.5 py-1 text-xs rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
      />
    </div>
  );
}
