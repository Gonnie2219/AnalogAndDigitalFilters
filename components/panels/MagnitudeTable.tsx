"use client";
import { MagnitudeTarget } from "@/lib/optimization/customFit";
import { hzToRad, radToHz } from "@/lib/utils/units";
import { useState } from "react";

interface MagnitudeTableProps {
  targets: MagnitudeTarget[];
  onChange: (targets: MagnitudeTarget[]) => void;
}

export default function MagnitudeTable({ targets, onChange }: MagnitudeTableProps) {
  const [freqInHz, setFreqInHz] = useState(true);

  const addRow = () => {
    onChange([...targets, { frequency: hzToRad(1000), magnitude: 1, weight: 1 }]);
  };

  const removeRow = (i: number) => {
    onChange(targets.filter((_, j) => j !== i));
  };

  const updateRow = (i: number, field: keyof MagnitudeTarget, value: number) => {
    const updated = [...targets];
    updated[i] = { ...updated[i], [field]: value };
    onChange(updated);
  };

  const displayFreq = (radPerSec: number) =>
    freqInHz ? Math.round(radToHz(radPerSec) * 100) / 100 : Math.round(radPerSec * 100) / 100;

  const parseFreq = (displayed: number) =>
    freqInHz ? hzToRad(displayed || 1) : Math.max(0.01, displayed || 1);

  return (
    <div className="p-4 rounded-lg bg-[var(--panel)] border border-[var(--border)]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-[var(--text)]">Magnitude Targets</h3>
        <button
          onClick={addRow}
          className="px-2 py-1 text-xs rounded bg-[var(--accent)] text-white hover:opacity-90"
        >
          + Add Point
        </button>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[var(--text-secondary)]">
            <th className="text-left py-1">
              <div className="flex items-center gap-1">
                <span>Freq</span>
                <FreqToggle inHz={freqInHz} onToggle={() => setFreqInHz((v) => !v)} />
              </div>
            </th>
            <th className="text-left py-1">Magnitude</th>
            <th className="text-left py-1">Weight</th>
            <th className="w-8"></th>
          </tr>
        </thead>
        <tbody>
          {targets.map((t, i) => (
            <tr key={i} className="border-t border-[var(--border)]">
              <td className="py-1 pr-2">
                <input
                  type="number"
                  value={displayFreq(t.frequency)}
                  onChange={(e) => updateRow(i, "frequency", parseFreq(parseFloat(e.target.value)))}
                  className="w-full px-1 py-0.5 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)]"
                />
              </td>
              <td className="py-1 pr-2">
                <input
                  type="number"
                  value={t.magnitude}
                  onChange={(e) => updateRow(i, "magnitude", Math.max(0, parseFloat(e.target.value) || 0))}
                  step={0.1}
                  min={0}
                  className="w-full px-1 py-0.5 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)]"
                />
              </td>
              <td className="py-1 pr-2">
                <input
                  type="number"
                  value={t.weight}
                  onChange={(e) => updateRow(i, "weight", parseFloat(e.target.value) || 1)}
                  step={0.1}
                  min={0.1}
                  className="w-full px-1 py-0.5 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)]"
                />
              </td>
              <td className="py-1">
                <button
                  onClick={() => removeRow(i)}
                  className="text-[var(--text-secondary)] hover:text-red-500"
                >
                  x
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {targets.length === 0 && (
        <p className="text-xs text-[var(--text-secondary)] py-2 text-center">
          Add frequency/magnitude target points above
        </p>
      )}
    </div>
  );
}

function FreqToggle({ inHz, onToggle }: { inHz: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={onToggle}
        className={`px-1 py-0 text-[10px] rounded transition-colors ${
          inHz ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
        }`}
      >
        Hz
      </button>
      <button
        onClick={onToggle}
        className={`px-1 py-0 text-[10px] rounded transition-colors ${
          !inHz ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
        }`}
      >
        rad/s
      </button>
    </div>
  );
}
