"use client";
import { FilterSpec, FilterType, ResponseType } from "@/lib/filters/types";
import NumberInput from "@/components/ui/NumberInput";
import { radToHz, hzToRad } from "@/lib/utils/units";
import { useState } from "react";

interface FilterSpecPanelProps {
  spec: FilterSpec;
  onChange: (partial: Partial<FilterSpec>) => void;
  onReset: () => void;
}

const filterTypes: { value: FilterType; label: string }[] = [
  { value: "butterworth", label: "Butterworth" },
  { value: "chebyshev1", label: "Chebyshev I" },
  { value: "chebyshev2", label: "Chebyshev II" },
  { value: "bessel", label: "Bessel" },
  { value: "elliptic", label: "Elliptic" },
];

const responseTypes: { value: ResponseType; label: string }[] = [
  { value: "lowpass", label: "Low-Pass" },
  { value: "highpass", label: "High-Pass" },
  { value: "bandpass", label: "Band-Pass" },
  { value: "bandstop", label: "Band-Stop" },
];

export default function FilterSpecPanel({ spec, onChange, onReset }: FilterSpecPanelProps) {
  const [freqInHz, setFreqInHz] = useState(true);
  const needsRipple = spec.filterType === "chebyshev1" || spec.filterType === "elliptic";
  const needsStopband = spec.filterType === "chebyshev2" || spec.filterType === "elliptic";
  const needsSecondFreq = spec.responseType === "bandpass" || spec.responseType === "bandstop";
  const maxOrder = spec.filterType === "bessel" ? 10 : 20;

  const displayFreq = (radPerSec: number) =>
    freqInHz ? Math.round(radToHz(radPerSec) * 100) / 100 : Math.round(radPerSec * 100) / 100;

  const parseFreq = (displayed: number) =>
    freqInHz ? hzToRad(Math.max(0.01, displayed)) : Math.max(0.01, displayed);

  const freqUnit = freqInHz ? "Hz" : "rad/s";

  const toggleUnit = () => setFreqInHz((prev) => !prev);

  return (
    <div className="space-y-3 p-4 rounded-lg bg-[var(--panel)] border border-[var(--border)]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text)]">Filter Specification</h3>
        <button
          onClick={onReset}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--text-secondary)]">Filter Type</label>
          <select
            value={spec.filterType}
            onChange={(e) => onChange({ filterType: e.target.value as FilterType })}
            className="w-full px-2 py-1.5 text-sm rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
          >
            {filterTypes.map((ft) => (
              <option key={ft.value} value={ft.value}>{ft.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--text-secondary)]">Response</label>
          <select
            value={spec.responseType}
            onChange={(e) => onChange({ responseType: e.target.value as ResponseType })}
            className="w-full px-2 py-1.5 text-sm rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
          >
            {responseTypes.map((rt) => (
              <option key={rt.value} value={rt.value}>{rt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <NumberInput
        label="Order"
        value={spec.order}
        onChange={(v) => onChange({ order: Math.max(1, Math.min(maxOrder, Math.round(v))) })}
        min={1}
        max={maxOrder}
        step={1}
      />

      {/* Cutoff frequency with Hz/rad toggle */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-[var(--text-secondary)]">Cutoff Frequency</label>
          <FreqUnitToggle inHz={freqInHz} onToggle={toggleUnit} />
        </div>
        <input
          type="number"
          value={displayFreq(spec.cutoffFreq)}
          onChange={(e) => onChange({ cutoffFreq: parseFreq(parseFloat(e.target.value) || 0.01) })}
          min={0.01}
          step={freqInHz ? 10 : 50}
          className="w-full px-2 py-1.5 text-sm rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
        />
      </div>

      {needsSecondFreq && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--text-secondary)]">
            Upper Cutoff ({freqUnit})
          </label>
          <input
            type="number"
            value={displayFreq(spec.cutoffFreq2 ?? spec.cutoffFreq * 2)}
            onChange={(e) => onChange({ cutoffFreq2: parseFreq(parseFloat(e.target.value) || 0.01) })}
            min={0.01}
            step={freqInHz ? 10 : 50}
            className="w-full px-2 py-1.5 text-sm rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
      )}

      {needsRipple && (
        <NumberInput
          label="Passband Ripple (dB)"
          value={spec.ripple ?? 1}
          onChange={(v) => onChange({ ripple: Math.max(0.01, v) })}
          min={0.01}
          max={10}
          step={0.1}
        />
      )}

      {needsStopband && (
        <NumberInput
          label="Stopband Attenuation (dB)"
          value={spec.stopbandAtten ?? 40}
          onChange={(v) => onChange({ stopbandAtten: Math.max(10, v) })}
          min={10}
          max={120}
          step={1}
        />
      )}
    </div>
  );
}

function FreqUnitToggle({ inHz, onToggle }: { inHz: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onToggle}
        className={`px-1.5 py-0.5 text-[10px] rounded transition-colors ${
          inHz ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
        }`}
      >
        Hz
      </button>
      <button
        onClick={onToggle}
        className={`px-1.5 py-0.5 text-[10px] rounded transition-colors ${
          !inHz ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
        }`}
      >
        rad/s
      </button>
    </div>
  );
}
