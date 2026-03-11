"use client";
import { TransferFunction } from "@/lib/filters/types";
import { FilterSection } from "@/lib/circuit/types";
import { factorize } from "@/lib/circuit/factorize";
import CircuitCascade from "@/components/circuit/CircuitCascade";
import { useState, useEffect } from "react";

interface CircuitTabProps {
  tf: TransferFunction | null;
}

export default function CircuitTab({ tf }: CircuitTabProps) {
  const [sections, setSections] = useState<FilterSection[]>([]);

  // Recompute sections whenever the transfer function changes
  useEffect(() => {
    if (!tf) {
      setSections([]);
      return;
    }
    try {
      setSections(factorize(tf));
    } catch (e) {
      console.error("Factorize error:", e);
      setSections([]);
    }
  }, [tf]);

  const handleUpdateSection = (index: number, updated: FilterSection) => {
    setSections((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  };

  if (!tf) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--text-secondary)]">
        Design a filter in the Standard or Custom tab first
      </div>
    );
  }

  return (
    <div className="p-4">
      <CircuitCascade sections={sections} onUpdateSection={handleUpdateSection} />
      <div className="mt-4 p-4 rounded-lg bg-[var(--panel)] border border-[var(--border)]">
        <h3 className="text-sm font-semibold text-[var(--text)] mb-2">Notes</h3>
        <ul className="text-xs text-[var(--text-secondary)] space-y-1 list-disc pl-4">
          <li>1st order sections use passive RC lowpass topology</li>
          <li>2nd order sections use unity-gain Sallen-Key topology</li>
          <li>Edit any component value below the diagram — the other values auto-recalculate to preserve the same transfer function</li>
          <li>Sections are cascaded in series for the full filter response</li>
        </ul>
      </div>
    </div>
  );
}
