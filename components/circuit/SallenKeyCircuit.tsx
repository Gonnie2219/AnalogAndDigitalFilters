"use client";
import { SecondOrderSection } from "@/lib/circuit/types";
import { formatEngineering } from "@/lib/utils/formatLatex";
import ComponentInput from "./ComponentInput";

interface SallenKeyCircuitProps {
  section: SecondOrderSection;
  index: number;
  onUpdate: (updated: SecondOrderSection) => void;
}

export default function SallenKeyCircuit({ section, index, onUpdate }: SallenKeyCircuitProps) {
  const sigma = Math.max(Math.abs(section.poles[0].re), 1e-10);
  const omega = Math.abs(section.poles[0].im);
  const w0 = Math.sqrt(sigma * sigma + omega * omega);
  const Q = w0 / (2 * sigma);
  const isHP = section.responseType === "highpass";

  // LP handlers (equal-R design)
  const handleRChange_LP = (value: number) => {
    const C1 = 2 * Q / (w0 * value);
    const C2 = 1 / (2 * Q * w0 * value);
    onUpdate({ ...section, R1: value, R2: value, C1: Math.abs(C1), C2: Math.abs(C2) });
  };

  const handleC1Change_LP = (value: number) => {
    const C2 = 1 / (w0 * w0 * section.R1 * section.R1 * value);
    onUpdate({ ...section, C1: value, C2: Math.abs(C2) });
  };

  const handleC2Change_LP = (value: number) => {
    const C1 = 1 / (w0 * w0 * section.R1 * section.R1 * value);
    onUpdate({ ...section, C2: value, C1: Math.abs(C1) });
  };

  // HP handlers (equal-C design)
  const handleCChange_HP = (value: number) => {
    const R1 = 1 / (2 * Q * w0 * value);
    const R2 = (2 * Q) / (w0 * value);
    onUpdate({ ...section, C1: value, C2: value, R1: Math.abs(R1), R2: Math.abs(R2) });
  };

  const handleR1Change_HP = (value: number) => {
    const R2 = 1 / (w0 * w0 * section.C1 * section.C1 * value);
    onUpdate({ ...section, R1: value, R2: Math.abs(R2) });
  };

  const handleR2Change_HP = (value: number) => {
    const R1 = 1 / (w0 * w0 * section.C1 * section.C1 * value);
    onUpdate({ ...section, R2: value, R1: Math.abs(R1) });
  };

  return (
    <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
      <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
        Stage {index + 1}: 2nd Order Sallen-Key {isHP ? "Highpass" : "Lowpass"}
      </h4>
      {isHP ? <SallenKeyHP section={section} /> : <SallenKeyLP section={section} />}
      <div className="grid grid-cols-3 gap-3 mt-3">
        {isHP ? (
          <>
            <ComponentInput label="C1 = C2" unit="F" value={section.C1} onChange={handleCChange_HP} />
            <ComponentInput label="R1" unit="Ω" value={section.R1} onChange={handleR1Change_HP} />
            <ComponentInput label="R2" unit="Ω" value={section.R2} onChange={handleR2Change_HP} />
          </>
        ) : (
          <>
            <ComponentInput label="R1 = R2" unit="Ω" value={section.R1} onChange={handleRChange_LP} />
            <ComponentInput label="C1" unit="F" value={section.C1} onChange={handleC1Change_LP} />
            <ComponentInput label="C2" unit="F" value={section.C2} onChange={handleC2Change_LP} />
          </>
        )}
      </div>
    </div>
  );
}

/** Lowpass Sallen-Key SVG: series R1,R2; shunt C1; feedback C2 */
function SallenKeyLP({ section }: { section: SecondOrderSection }) {
  return (
    <svg viewBox="-10 -5 370 180" className="w-full max-w-[420px]" style={{ color: "var(--text)" }}>
      <line x1="10" y1="50" x2="30" y2="50" stroke="currentColor" strokeWidth="1.5" />
      <text x="5" y="40" fill="currentColor" fontSize="11" fontWeight="bold">Vin</text>
      {/* R1 */}
      <rect x="30" y="42" width="50" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" rx="2" />
      <text x="55" y="38" fill="currentColor" fontSize="12" fontWeight="bold" textAnchor="middle">R1</text>
      <text x="30" y="74" fill="var(--accent)" fontSize="11" fontWeight="600">{formatEngineering(section.R1)}Ω</text>
      {/* R2 */}
      <rect x="100" y="42" width="50" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" rx="2" />
      <text x="125" y="38" fill="currentColor" fontSize="12" fontWeight="bold" textAnchor="middle">R2</text>
      <text x="100" y="74" fill="var(--accent)" fontSize="11" fontWeight="600">{formatEngineering(section.R2)}Ω</text>
      <line x1="80" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="1.5" />
      {/* C1 shunt */}
      <line x1="90" y1="50" x2="90" y2="80" stroke="currentColor" strokeWidth="1.5" />
      <line x1="78" y1="80" x2="102" y2="80" stroke="currentColor" strokeWidth="1.5" />
      <line x1="78" y1="85" x2="102" y2="85" stroke="currentColor" strokeWidth="1.5" />
      <line x1="90" y1="85" x2="90" y2="105" stroke="currentColor" strokeWidth="1.5" />
      <text x="106" y="82" fill="currentColor" fontSize="12" fontWeight="bold">C1</text>
      <text x="106" y="98" fill="var(--accent)" fontSize="11" fontWeight="600">{formatEngineering(section.C1)}F</text>
      <line x1="80" y1="105" x2="100" y2="105" stroke="currentColor" strokeWidth="1.5" />
      <line x1="83" y1="109" x2="97" y2="109" stroke="currentColor" strokeWidth="1" />
      <line x1="86" y1="113" x2="94" y2="113" stroke="currentColor" strokeWidth="0.8" />
      {/* C2 feedback + op-amp */}
      <line x1="150" y1="50" x2="190" y2="50" stroke="currentColor" strokeWidth="1.5" />
      <line x1="170" y1="50" x2="170" y2="20" stroke="currentColor" strokeWidth="1.5" />
      <line x1="170" y1="20" x2="290" y2="20" stroke="currentColor" strokeWidth="1.5" />
      <line x1="290" y1="20" x2="290" y2="60" stroke="currentColor" strokeWidth="1.5" />
      <line x1="158" y1="35" x2="182" y2="35" stroke="currentColor" strokeWidth="1.5" />
      <line x1="158" y1="30" x2="182" y2="30" stroke="currentColor" strokeWidth="1.5" />
      <text x="186" y="30" fill="currentColor" fontSize="12" fontWeight="bold">C2</text>
      <text x="200" y="16" fill="var(--accent)" fontSize="11" fontWeight="600">{formatEngineering(section.C2)}F</text>
      {/* Op-amp */}
      <polygon points="190,35 190,75 240,55" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text x="194" y="48" fill="currentColor" fontSize="10">+</text>
      <text x="194" y="68" fill="currentColor" fontSize="10">-</text>
      <line x1="190" y1="65" x2="180" y2="65" stroke="currentColor" strokeWidth="1.5" />
      <line x1="180" y1="65" x2="180" y2="130" stroke="currentColor" strokeWidth="1.5" />
      <line x1="180" y1="130" x2="290" y2="130" stroke="currentColor" strokeWidth="1.5" />
      <line x1="290" y1="130" x2="290" y2="60" stroke="currentColor" strokeWidth="1.5" />
      <line x1="240" y1="55" x2="290" y2="55" stroke="currentColor" strokeWidth="1.5" />
      <line x1="290" y1="55" x2="330" y2="55" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="290" cy="55" r="2" fill="currentColor" />
      <text x="300" y="48" fill="currentColor" fontSize="11" fontWeight="bold">Vout</text>
    </svg>
  );
}

/** Highpass Sallen-Key SVG: series C1,C2; shunt R1; feedback R2 */
function SallenKeyHP({ section }: { section: SecondOrderSection }) {
  return (
    <svg viewBox="-10 -5 370 180" className="w-full max-w-[420px]" style={{ color: "var(--text)" }}>
      <line x1="10" y1="50" x2="30" y2="50" stroke="currentColor" strokeWidth="1.5" />
      <text x="5" y="40" fill="currentColor" fontSize="11" fontWeight="bold">Vin</text>
      {/* C1 series (capacitor: two parallel lines) */}
      <line x1="30" y1="50" x2="50" y2="50" stroke="currentColor" strokeWidth="1.5" />
      <line x1="50" y1="38" x2="50" y2="62" stroke="currentColor" strokeWidth="1.5" />
      <line x1="56" y1="38" x2="56" y2="62" stroke="currentColor" strokeWidth="1.5" />
      <line x1="56" y1="50" x2="80" y2="50" stroke="currentColor" strokeWidth="1.5" />
      <text x="53" y="34" fill="currentColor" fontSize="12" fontWeight="bold" textAnchor="middle">C1</text>
      <text x="30" y="78" fill="var(--accent)" fontSize="11" fontWeight="600">{formatEngineering(section.C1)}F</text>
      {/* C2 series */}
      <line x1="100" y1="50" x2="120" y2="50" stroke="currentColor" strokeWidth="1.5" />
      <line x1="120" y1="38" x2="120" y2="62" stroke="currentColor" strokeWidth="1.5" />
      <line x1="126" y1="38" x2="126" y2="62" stroke="currentColor" strokeWidth="1.5" />
      <line x1="126" y1="50" x2="150" y2="50" stroke="currentColor" strokeWidth="1.5" />
      <text x="123" y="34" fill="currentColor" fontSize="12" fontWeight="bold" textAnchor="middle">C2</text>
      <text x="100" y="78" fill="var(--accent)" fontSize="11" fontWeight="600">{formatEngineering(section.C2)}F</text>
      {/* Junction between C1 and C2 */}
      <line x1="80" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="1.5" />
      {/* R1 shunt to ground */}
      <line x1="90" y1="50" x2="90" y2="80" stroke="currentColor" strokeWidth="1.5" />
      <rect x="82" y="80" width="16" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" rx="2" />
      <line x1="90" y1="104" x2="90" y2="110" stroke="currentColor" strokeWidth="1.5" />
      <text x="106" y="90" fill="currentColor" fontSize="12" fontWeight="bold">R1</text>
      <text x="106" y="106" fill="var(--accent)" fontSize="11" fontWeight="600">{formatEngineering(section.R1)}Ω</text>
      {/* Ground */}
      <line x1="80" y1="110" x2="100" y2="110" stroke="currentColor" strokeWidth="1.5" />
      <line x1="83" y1="114" x2="97" y2="114" stroke="currentColor" strokeWidth="1" />
      <line x1="86" y1="118" x2="94" y2="118" stroke="currentColor" strokeWidth="0.8" />
      {/* R2 feedback + op-amp */}
      <line x1="150" y1="50" x2="190" y2="50" stroke="currentColor" strokeWidth="1.5" />
      <line x1="170" y1="50" x2="170" y2="20" stroke="currentColor" strokeWidth="1.5" />
      <line x1="170" y1="20" x2="290" y2="20" stroke="currentColor" strokeWidth="1.5" />
      <line x1="290" y1="20" x2="290" y2="60" stroke="currentColor" strokeWidth="1.5" />
      {/* R2 feedback (resistor box) */}
      <rect x="210" y="12" width="40" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" rx="2" />
      <text x="230" y="10" fill="currentColor" fontSize="12" fontWeight="bold" textAnchor="middle">R2</text>
      <text x="215" y="42" fill="var(--accent)" fontSize="11" fontWeight="600">{formatEngineering(section.R2)}Ω</text>
      {/* Op-amp */}
      <polygon points="190,35 190,75 240,55" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text x="194" y="48" fill="currentColor" fontSize="10">+</text>
      <text x="194" y="68" fill="currentColor" fontSize="10">-</text>
      <line x1="190" y1="65" x2="180" y2="65" stroke="currentColor" strokeWidth="1.5" />
      <line x1="180" y1="65" x2="180" y2="130" stroke="currentColor" strokeWidth="1.5" />
      <line x1="180" y1="130" x2="290" y2="130" stroke="currentColor" strokeWidth="1.5" />
      <line x1="290" y1="130" x2="290" y2="60" stroke="currentColor" strokeWidth="1.5" />
      <line x1="240" y1="55" x2="290" y2="55" stroke="currentColor" strokeWidth="1.5" />
      <line x1="290" y1="55" x2="330" y2="55" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="290" cy="55" r="2" fill="currentColor" />
      <text x="300" y="48" fill="currentColor" fontSize="11" fontWeight="bold">Vout</text>
    </svg>
  );
}
