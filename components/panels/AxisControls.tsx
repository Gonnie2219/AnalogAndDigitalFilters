"use client";
import { useState, useEffect } from "react";
import { hzToRad } from "@/lib/utils/units";

export interface AxisRanges {
  freqMin: string;
  freqMax: string;
  magMin: string;
  magMax: string;
  phaseMin: string;
  phaseMax: string;
}

export interface SuggestedDefaults {
  freqMin?: number;
  freqMax?: number;
  magMin?: number;
  magMax?: number;
  phaseMin?: number;
  phaseMax?: number;
}

interface AxisControlsProps {
  useHz: boolean;
  onToggleHz: () => void;
  magDb: boolean;
  onToggleMagDb: () => void;
  ranges: AxisRanges;
  onRangeChange: (ranges: AxisRanges) => void;
  maxFreq?: number;
  suggestedDefaults?: SuggestedDefaults;
}

type FreqPreset = "auto" | "audio" | "wide" | "custom";

// Preset ranges defined in Hz
const PRESET_HZ: Record<"audio" | "wide", [number, number]> = {
  audio: [20, 20000],
  wide: [1, 1000000],
};

const FALLBACK_DEFAULTS: SuggestedDefaults = {
  freqMin: 1, freqMax: 100000,
  magMin: -100, magMax: 5,
  phaseMin: -270, phaseMax: 0,
};

function isAuto(min: string, max: string): boolean {
  return min === "" && max === "";
}

function formatNum(s: string): string {
  const n = parseFloat(s);
  if (isNaN(n)) return s;
  if (Math.abs(n) >= 1e6) return `${n / 1e6}M`;
  if (Math.abs(n) >= 1e3) return `${n / 1e3}k`;
  return String(Math.round(n * 100) / 100);
}

export default function AxisControls({
  useHz, onToggleHz, magDb, onToggleMagDb, ranges, onRangeChange, maxFreq, suggestedDefaults,
}: AxisControlsProps) {
  const defaults = { ...FALLBACK_DEFAULTS, ...suggestedDefaults };
  const isDigital = maxFreq !== undefined;

  // --- Frequency preset state ---
  const [freqPreset, setFreqPreset] = useState<FreqPreset>("auto");
  const [autoMag, setAutoMag] = useState(isAuto(ranges.magMin, ranges.magMax));
  const [autoPhase, setAutoPhase] = useState(isAuto(ranges.phaseMin, ranges.phaseMax));

  // Which presets are available
  const showAudio = isDigital ? (useHz && maxFreq! >= 20000) : true;
  const showWide = !isDigital;

  // Convert Hz preset values to current unit
  const toUnit = (hz: number) => {
    if (useHz) return hz;
    // For analog (rad/s): convert via 2*pi*f
    // For digital rad/sample: maxFreq is already in current unit, but named presets
    // don't apply in that mode (showAudio/showWide will be false)
    return Math.round(hzToRad(hz) * 100) / 100;
  };

  const applyFreqPreset = (preset: FreqPreset) => {
    setFreqPreset(preset);
    switch (preset) {
      case "auto":
        onRangeChange({ ...ranges, freqMin: "", freqMax: "" });
        break;
      case "audio":
      case "wide": {
        const [minHz, maxHz] = PRESET_HZ[preset];
        const min = toUnit(minHz);
        let max = toUnit(maxHz);
        if (maxFreq !== undefined) max = Math.min(max, maxFreq);
        onRangeChange({ ...ranges, freqMin: String(min), freqMax: String(max) });
        break;
      }
      case "custom":
        // If coming from auto, populate with suggested defaults
        if (ranges.freqMin === "" && ranges.freqMax === "") {
          onRangeChange({ ...ranges, freqMin: String(defaults.freqMin), freqMax: String(defaults.freqMax) });
        }
        break;
    }
  };

  // Re-apply named preset when Hz/rad toggle changes
  useEffect(() => {
    if (freqPreset === "audio" || freqPreset === "wide") {
      // If preset no longer available in new unit mode, fall back to auto
      if ((freqPreset === "audio" && !(isDigital ? (useHz && maxFreq! >= 20000) : true)) ||
          (freqPreset === "wide" && isDigital)) {
        setFreqPreset("auto");
        onRangeChange({ ...ranges, freqMin: "", freqMax: "" });
        return;
      }
      const [minHz, maxHz] = PRESET_HZ[freqPreset];
      const min = useHz ? minHz : Math.round(hzToRad(minHz) * 100) / 100;
      let max = useHz ? maxHz : Math.round(hzToRad(maxHz) * 100) / 100;
      if (maxFreq !== undefined) max = Math.min(max, maxFreq);
      onRangeChange({ ...ranges, freqMin: String(min), freqMax: String(max) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useHz]);

  // Sync state if ranges cleared externally
  useEffect(() => {
    if (isAuto(ranges.freqMin, ranges.freqMax) && freqPreset !== "auto") setFreqPreset("auto");
    if (isAuto(ranges.magMin, ranges.magMax) && !autoMag) setAutoMag(true);
    if (isAuto(ranges.phaseMin, ranges.phaseMax) && !autoPhase) setAutoPhase(true);
  }, [ranges, freqPreset, autoMag, autoPhase]);

  const update = (field: keyof AxisRanges, value: string) => {
    if (maxFreq !== undefined && (field === "freqMin" || field === "freqMax")) {
      const num = parseFloat(value);
      if (!isNaN(num) && num > maxFreq) value = String(maxFreq);
    }
    onRangeChange({ ...ranges, [field]: value });
  };

  const toggleAutoAxis = (axis: "mag" | "phase", currentlyAuto: boolean) => {
    if (currentlyAuto) {
      if (axis === "mag") {
        setAutoMag(false);
        onRangeChange({ ...ranges, magMin: String(defaults.magMin), magMax: String(defaults.magMax) });
      } else {
        setAutoPhase(false);
        onRangeChange({ ...ranges, phaseMin: String(defaults.phaseMin), phaseMax: String(defaults.phaseMax) });
      }
    } else {
      if (axis === "mag") {
        setAutoMag(true);
        onRangeChange({ ...ranges, magMin: "", magMax: "" });
      } else {
        setAutoPhase(true);
        onRangeChange({ ...ranges, phaseMin: "", phaseMax: "" });
      }
    }
  };

  const resetAll = () => {
    setFreqPreset("auto");
    setAutoMag(true);
    setAutoPhase(true);
    onRangeChange({ freqMin: "", freqMax: "", magMin: "", magMax: "", phaseMin: "", phaseMax: "" });
  };

  // Validation
  const freqMinVal = parseFloat(ranges.freqMin);
  const freqMaxVal = parseFloat(ranges.freqMax);
  const magMinVal = parseFloat(ranges.magMin);
  const magMaxVal = parseFloat(ranges.magMax);
  const phaseMinVal = parseFloat(ranges.phaseMin);
  const phaseMaxVal = parseFloat(ranges.phaseMax);

  const freqError = freqPreset === "custom" && !isNaN(freqMinVal) && !isNaN(freqMaxVal)
    ? (freqMinVal <= 0 && !isDigital) ? "Min must be > 0" : freqMinVal >= freqMaxVal ? "Min must be < Max" : null
    : null;
  const magError = !autoMag && !isNaN(magMinVal) && !isNaN(magMaxVal) && magMinVal >= magMaxVal
    ? "Min must be < Max" : null;
  const phaseError = !autoPhase && !isNaN(phaseMinVal) && !isNaN(phaseMaxVal) && phaseMinVal >= phaseMaxVal
    ? "Min must be < Max" : null;

  const allAuto = freqPreset === "auto" && autoMag && autoPhase;
  const unit = useHz ? "Hz" : "rad/s";

  // Info text for named presets
  const freqInfo = freqPreset === "auto" ? "auto-scaled"
    : freqPreset === "custom" ? null
    : `${formatNum(ranges.freqMin)} – ${formatNum(ranges.freqMax)} ${unit}`;

  const inputClass = (hasError: boolean) =>
    `w-full px-1.5 py-1 text-xs rounded border bg-[var(--bg)] text-[var(--text)] focus:outline-none ${
      hasError ? "border-red-500" : "border-[var(--border)] focus:border-[var(--accent)]"
    }`;

  const presetBtn = (id: FreqPreset, label: string) => (
    <button
      key={id}
      onClick={() => applyFreqPreset(id)}
      className={`px-2 py-0.5 text-[10px] rounded-full transition-colors ${
        freqPreset === id
          ? "bg-[var(--accent)] text-white"
          : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text)]"
      }`}
    >{label}</button>
  );

  return (
    <div className="p-3 rounded-lg bg-[var(--panel)] border border-[var(--border)] space-y-3">
      {/* Unit toggles + Reset */}
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-secondary)]">Frequency:</span>
          <button onClick={onToggleHz}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              useHz ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
            }`}>Hz</button>
          <button onClick={onToggleHz}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              !useHz ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
            }`}>rad/s</button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-secondary)]">Magnitude:</span>
          <button onClick={onToggleMagDb}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              magDb ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
            }`}>dB</button>
          <button onClick={onToggleMagDb}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              !magDb ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
            }`}>Linear</button>
        </div>
        {!allAuto && (
          <button onClick={resetAll}
            className="ml-auto px-2 py-1 text-xs rounded border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] hover:border-[var(--accent)] transition-colors"
          >Reset All to Auto</button>
        )}
      </div>

      {/* Axis range groups */}
      <div className="grid grid-cols-3 gap-3">
        {/* Frequency range — preset toggles */}
        <div>
          <label className="text-[10px] font-medium text-[var(--text-secondary)] block mb-1">
            Freq range ({unit})
          </label>
          <div className="flex gap-1 flex-wrap mb-1">
            {presetBtn("auto", "Auto")}
            {showAudio && presetBtn("audio", "Audio")}
            {showWide && presetBtn("wide", "Wide")}
            {presetBtn("custom", "Custom")}
          </div>
          {freqInfo && (
            <div className="text-[10px] text-[var(--text-secondary)] text-center">{freqInfo}</div>
          )}
          {freqPreset === "custom" && (
            <>
              <div className="flex items-center gap-1">
                <input type="number" value={ranges.freqMin} onChange={(e) => update("freqMin", e.target.value)}
                  placeholder="min" min={0} {...(maxFreq !== undefined && { max: maxFreq })}
                  className={inputClass(!!freqError)} />
                <span className="text-[10px] text-[var(--text-secondary)]">-</span>
                <input type="number" value={ranges.freqMax} onChange={(e) => update("freqMax", e.target.value)}
                  placeholder="max" min={0} {...(maxFreq !== undefined && { max: maxFreq })}
                  className={inputClass(!!freqError)} />
              </div>
              {freqError && <p className="text-[10px] text-red-500 mt-0.5">{freqError}</p>}
            </>
          )}
        </div>

        {/* Magnitude range */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-medium text-[var(--text-secondary)]">
              Magnitude ({magDb ? "dB" : "linear"})
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={autoMag}
                onChange={() => toggleAutoAxis("mag", autoMag)}
                className="w-3 h-3 accent-[var(--accent)]" />
              <span className="text-[10px] text-[var(--text-secondary)]">Auto</span>
            </label>
          </div>
          {autoMag ? (
            <div className="text-[10px] text-[var(--text-secondary)] py-1.5 text-center">auto-scaled</div>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <input type="number" value={ranges.magMin} onChange={(e) => update("magMin", e.target.value)}
                  placeholder="min" className={inputClass(!!magError)} />
                <span className="text-[10px] text-[var(--text-secondary)]">-</span>
                <input type="number" value={ranges.magMax} onChange={(e) => update("magMax", e.target.value)}
                  placeholder="max" className={inputClass(!!magError)} />
              </div>
              {magError && <p className="text-[10px] text-red-500 mt-0.5">{magError}</p>}
            </>
          )}
        </div>

        {/* Phase range */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-medium text-[var(--text-secondary)]">
              Phase (deg)
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={autoPhase}
                onChange={() => toggleAutoAxis("phase", autoPhase)}
                className="w-3 h-3 accent-[var(--accent)]" />
              <span className="text-[10px] text-[var(--text-secondary)]">Auto</span>
            </label>
          </div>
          {autoPhase ? (
            <div className="text-[10px] text-[var(--text-secondary)] py-1.5 text-center">auto-scaled</div>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <input type="number" value={ranges.phaseMin} onChange={(e) => update("phaseMin", e.target.value)}
                  placeholder="min" className={inputClass(!!phaseError)} />
                <span className="text-[10px] text-[var(--text-secondary)]">-</span>
                <input type="number" value={ranges.phaseMax} onChange={(e) => update("phaseMax", e.target.value)}
                  placeholder="max" className={inputClass(!!phaseError)} />
              </div>
              {phaseError && <p className="text-[10px] text-red-500 mt-0.5">{phaseError}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
