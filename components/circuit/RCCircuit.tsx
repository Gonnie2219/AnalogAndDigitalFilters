"use client";
import { FirstOrderSection } from "@/lib/circuit/types";
import { formatEngineering } from "@/lib/utils/formatLatex";
import ComponentInput from "./ComponentInput";

interface RCCircuitProps {
  section: FirstOrderSection;
  index: number;
  onUpdate: (updated: FirstOrderSection) => void;
}

export default function RCCircuit({ section, index, onUpdate }: RCCircuitProps) {
  const wc = Math.max(Math.abs(section.pole.re), 1e-10);
  const isHP = section.responseType === "highpass";

  const handleRChange = (value: number) => {
    onUpdate({ ...section, R: value, C: 1 / (wc * value) });
  };

  const handleCChange = (value: number) => {
    onUpdate({ ...section, C: value, R: 1 / (wc * value) });
  };

  // Series component (first in path): R for LP, C for HP
  const seriesLabel = isHP ? "C" : "R";
  const seriesValue = isHP ? formatEngineering(section.C) + "F" : formatEngineering(section.R) + "Ω";
  // Shunt component (to ground): C for LP, R for HP
  const shuntLabel = isHP ? "R" : "C";
  const shuntValue = isHP ? formatEngineering(section.R) + "Ω" : formatEngineering(section.C) + "F";

  return (
    <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
      <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
        Stage {index + 1}: 1st Order RC {isHP ? "Highpass" : "Lowpass"}
      </h4>
      <svg viewBox="0 0 280 100" className="w-full max-w-[300px]" style={{ color: "var(--text)" }}>
        <line x1="10" y1="40" x2="40" y2="40" stroke="currentColor" strokeWidth="1.5" />
        <text x="10" y="30" fill="currentColor" fontSize="11" fontWeight="bold">Vin</text>
        {/* Series component */}
        {isHP ? (
          <>
            {/* Capacitor in series (two parallel lines) */}
            <line x1="40" y1="40" x2="62" y2="40" stroke="currentColor" strokeWidth="1.5" />
            <line x1="62" y1="28" x2="62" y2="52" stroke="currentColor" strokeWidth="1.5" />
            <line x1="68" y1="28" x2="68" y2="52" stroke="currentColor" strokeWidth="1.5" />
            <line x1="68" y1="40" x2="100" y2="40" stroke="currentColor" strokeWidth="1.5" />
          </>
        ) : (
          <>
            {/* Resistor box in series */}
            <rect x="40" y="32" width="60" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" rx="2" />
          </>
        )}
        <text x="60" y="28" fill="currentColor" fontSize="12" fontWeight="bold" textAnchor="middle">{seriesLabel}</text>
        <text x="70" y="65" fill="var(--accent)" fontSize="11" fontWeight="600">{seriesValue}</text>
        <line x1="100" y1="40" x2="150" y2="40" stroke="currentColor" strokeWidth="1.5" />
        {/* Shunt component to ground */}
        {isHP ? (
          <>
            {/* Resistor to ground */}
            <line x1="130" y1="40" x2="130" y2="50" stroke="currentColor" strokeWidth="1.5" />
            <rect x="122" y="50" width="16" height="26" fill="none" stroke="currentColor" strokeWidth="1.5" rx="2" />
            <line x1="130" y1="76" x2="130" y2="80" stroke="currentColor" strokeWidth="1.5" />
          </>
        ) : (
          <>
            {/* Capacitor to ground (two parallel lines) */}
            <line x1="130" y1="40" x2="130" y2="55" stroke="currentColor" strokeWidth="1.5" />
            <line x1="118" y1="55" x2="142" y2="55" stroke="currentColor" strokeWidth="1.5" />
            <line x1="118" y1="60" x2="142" y2="60" stroke="currentColor" strokeWidth="1.5" />
            <line x1="130" y1="60" x2="130" y2="80" stroke="currentColor" strokeWidth="1.5" />
          </>
        )}
        <text x="146" y="55" fill="currentColor" fontSize="12" fontWeight="bold">{shuntLabel}</text>
        <text x="146" y="72" fill="var(--accent)" fontSize="11" fontWeight="600">{shuntValue}</text>
        {/* Ground symbol */}
        <line x1="120" y1="80" x2="140" y2="80" stroke="currentColor" strokeWidth="1.5" />
        <line x1="124" y1="84" x2="136" y2="84" stroke="currentColor" strokeWidth="1" />
        <line x1="127" y1="88" x2="133" y2="88" stroke="currentColor" strokeWidth="0.8" />
        {/* Output */}
        <line x1="150" y1="40" x2="200" y2="40" stroke="currentColor" strokeWidth="1.5" />
        <text x="170" y="30" fill="currentColor" fontSize="11" fontWeight="bold">Vout</text>
      </svg>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <ComponentInput label="R" unit="Ω" value={section.R} onChange={handleRChange} />
        <ComponentInput label="C" unit="F" value={section.C} onChange={handleCChange} />
      </div>
    </div>
  );
}
