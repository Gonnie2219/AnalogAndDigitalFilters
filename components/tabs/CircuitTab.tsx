"use client";
import { TransferFunction } from "@/lib/filters/types";
import { FilterSection, CircuitResponseType } from "@/lib/circuit/types";
import { factorize } from "@/lib/circuit/factorize";
import CircuitCascade from "@/components/circuit/CircuitCascade";
import { useState, useEffect } from "react";

type ResponseType = "lowpass" | "highpass" | "bandpass" | "bandstop";

interface CircuitTabProps {
  tf: TransferFunction | null;
  responseType?: ResponseType;
}

export default function CircuitTab({ tf, responseType }: CircuitTabProps) {
  const [sections, setSections] = useState<FilterSection[]>([]);
  const [localTopology, setLocalTopology] = useState<CircuitResponseType>("lowpass");

  // When responseType is undefined (Custom tab), use local toggle
  const isCustomSource = responseType === undefined;
  const effectiveType: ResponseType = isCustomSource ? localTopology : responseType;
  const isBandType = effectiveType === "bandpass" || effectiveType === "bandstop";

  // Recompute sections whenever the transfer function changes
  useEffect(() => {
    if (!tf || isBandType) {
      setSections([]);
      return;
    }
    try {
      setSections(factorize(tf, effectiveType as CircuitResponseType));
    } catch (e) {
      console.error("Factorize error:", e);
      setSections([]);
    }
  }, [tf, effectiveType, isBandType]);

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

  if (isBandType) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--text-secondary)]">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Circuit view not available</p>
          <p className="text-sm">Circuit topology is only supported for lowpass and highpass filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {isCustomSource && (
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-semibold text-[var(--text-secondary)]">Circuit topology:</label>
          <select
            value={localTopology}
            onChange={(e) => setLocalTopology(e.target.value as CircuitResponseType)}
            className="px-2 py-1 rounded border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text)] text-sm"
          >
            <option value="lowpass">Lowpass</option>
            <option value="highpass">Highpass</option>
          </select>
        </div>
      )}
      <CircuitCascade sections={sections} onUpdateSection={handleUpdateSection} />
      <div className="mt-4 p-4 rounded-lg bg-[var(--panel)] border border-[var(--border)]">
        <h3 className="text-sm font-semibold text-[var(--text)] mb-2">Notes</h3>
        <ul className="text-xs text-[var(--text-secondary)] space-y-1 list-disc pl-4">
          <li>1st order sections use passive RC {effectiveType} topology</li>
          <li>2nd order sections use unity-gain Sallen-Key {effectiveType} topology</li>
          <li>Edit any component value below the diagram — the other values auto-recalculate to preserve the same transfer function</li>
          <li>Sections are cascaded in series for the full filter response</li>
        </ul>
      </div>
    </div>
  );
}
