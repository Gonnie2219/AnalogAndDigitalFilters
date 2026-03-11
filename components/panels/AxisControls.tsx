"use client";

export interface AxisRanges {
  freqMin: string;
  freqMax: string;
  magMin: string;
  magMax: string;
  phaseMin: string;
  phaseMax: string;
}

interface AxisControlsProps {
  useHz: boolean;
  onToggleHz: () => void;
  magDb: boolean;
  onToggleMagDb: () => void;
  ranges: AxisRanges;
  onRangeChange: (ranges: AxisRanges) => void;
  maxFreq?: number; // optional upper bound for frequency inputs
}

export default function AxisControls({ useHz, onToggleHz, magDb, onToggleMagDb, ranges, onRangeChange, maxFreq }: AxisControlsProps) {
  const update = (field: keyof AxisRanges, value: string) => {
    // Clamp frequency fields to maxFreq if provided
    if (maxFreq !== undefined && (field === "freqMin" || field === "freqMax")) {
      const num = parseFloat(value);
      if (!isNaN(num) && num > maxFreq) {
        value = String(maxFreq);
      }
    }
    onRangeChange({ ...ranges, [field]: value });
  };

  return (
    <div className="p-3 rounded-lg bg-[var(--panel)] border border-[var(--border)] space-y-3">
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-secondary)]">Frequency:</span>
          <button
            onClick={onToggleHz}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              useHz
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
            }`}
          >
            Hz
          </button>
          <button
            onClick={onToggleHz}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              !useHz
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
            }`}
          >
            rad/s
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-secondary)]">Magnitude:</span>
          <button
            onClick={onToggleMagDb}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              magDb
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
            }`}
          >
            dB
          </button>
          <button
            onClick={onToggleMagDb}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              !magDb
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
            }`}
          >
            Linear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Frequency range */}
        <div>
          <label className="text-[10px] font-medium text-[var(--text-secondary)] block mb-1">
            Freq range ({useHz ? "Hz" : "rad/s"})
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={ranges.freqMin}
              onChange={(e) => update("freqMin", e.target.value)}
              placeholder="auto"
              min={0}
              {...(maxFreq !== undefined && { max: maxFreq })}
              className="w-full px-1.5 py-1 text-xs rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
            />
            <span className="text-[10px] text-[var(--text-secondary)]">-</span>
            <input
              type="number"
              value={ranges.freqMax}
              onChange={(e) => update("freqMax", e.target.value)}
              placeholder="auto"
              min={0}
              {...(maxFreq !== undefined && { max: maxFreq })}
              className="w-full px-1.5 py-1 text-xs rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {/* Magnitude range */}
        <div>
          <label className="text-[10px] font-medium text-[var(--text-secondary)] block mb-1">
            Magnitude ({magDb ? "dB" : "linear"})
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={ranges.magMin}
              onChange={(e) => update("magMin", e.target.value)}
              placeholder="auto"
              className="w-full px-1.5 py-1 text-xs rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
            />
            <span className="text-[10px] text-[var(--text-secondary)]">-</span>
            <input
              type="number"
              value={ranges.magMax}
              onChange={(e) => update("magMax", e.target.value)}
              placeholder="auto"
              className="w-full px-1.5 py-1 text-xs rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {/* Phase range */}
        <div>
          <label className="text-[10px] font-medium text-[var(--text-secondary)] block mb-1">
            Phase (deg)
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={ranges.phaseMin}
              onChange={(e) => update("phaseMin", e.target.value)}
              placeholder="auto"
              className="w-full px-1.5 py-1 text-xs rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
            />
            <span className="text-[10px] text-[var(--text-secondary)]">-</span>
            <input
              type="number"
              value={ranges.phaseMax}
              onChange={(e) => update("phaseMax", e.target.value)}
              placeholder="auto"
              className="w-full px-1.5 py-1 text-xs rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
