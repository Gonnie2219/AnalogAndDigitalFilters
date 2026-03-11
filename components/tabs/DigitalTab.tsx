"use client";
import { useMemo, useState } from "react";
import { TransferFunction } from "@/lib/filters/types";
import {
  bilinearTransform,
  computeDigitalResponse,
  generateCCode,
  DigitalTransferFunction,
  DigitalFrequencyResponse,
} from "@/lib/filters/bilinear";
import { digitalTfToLatex } from "@/lib/utils/formatLatex";
import { radToHz, hzToRad } from "@/lib/utils/units";
import PoleZeroMap from "@/components/panels/PoleZeroMap";
import AxisControls, { AxisRanges, SuggestedDefaults } from "@/components/panels/AxisControls";
import NumberInput from "@/components/ui/NumberInput";
import Plot from "@/components/plot/PlotlyWrapper";
import "katex/dist/katex.min.css";
import katex from "katex";

interface DigitalTabProps {
  analogTf: TransferFunction | null;
  defaultPrewarp: number; // rad/s
  dark: boolean;
}

const defaultRanges: AxisRanges = {
  freqMin: "",
  freqMax: "",
  magMin: "",
  magMax: "",
  phaseMin: "",
  phaseMax: "",
};

function parseRange(
  min: string,
  max: string
): [number, number] | undefined {
  const lo = parseFloat(min);
  const hi = parseFloat(max);
  if (!isNaN(lo) && !isNaN(hi) && lo < hi) return [lo, hi];
  return undefined;
}

export default function DigitalTab({
  analogTf,
  defaultPrewarp,
  dark,
}: DigitalTabProps) {
  const [fs, setFs] = useState(44100);
  const [prewarpHz, setPrewarpHz] = useState(() => radToHz(defaultPrewarp));
  const [useHz, setUseHz] = useState(true);
  const [magDb, setMagDb] = useState(true);
  const [ranges, setRanges] = useState<AxisRanges>(defaultRanges);
  const [copiedHz, setCopiedHz] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Recompute when analog TF or settings change
  const result = useMemo<{
    dtf: DigitalTransferFunction;
    response: DigitalFrequencyResponse;
  } | null>(() => {
    if (!analogTf) return null;
    const prewarpRad = hzToRad(prewarpHz);
    // Prewarp frequency must be below Nyquist
    if (prewarpRad <= 0 || prewarpHz >= fs / 2) return null;
    try {
      const dtf = bilinearTransform(analogTf, fs, prewarpRad);
      const response = computeDigitalResponse(
        dtf.b, dtf.a, fs,
        useHz ? 512 : 1024,
        useHz ? 0.98 * Math.PI : 2 * 2 * Math.PI
      );
      return { dtf, response };
    } catch (e) {
      console.error("Bilinear transform error:", e);
      return null;
    }
  }, [analogTf, fs, prewarpHz, useHz]);

  // LaTeX rendering
  const tfHtml = useMemo(() => {
    if (!result) return "";
    try {
      const latex = digitalTfToLatex(result.dtf.b, result.dtf.a);
      return katex.renderToString(latex, {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      return "<span>Error rendering transfer function</span>";
    }
  }, [result]);

  // C code
  const cCode = useMemo(() => {
    if (!result) return "";
    return generateCCode(result.dtf.b, result.dtf.a, fs);
  }, [result, fs]);

  const handleCopyHz = () => {
    if (!result) return;
    const bStr = result.dtf.b.map((v) => v.toPrecision(8)).join(", ");
    const aStr = result.dtf.a.map((v) => v.toPrecision(8)).join(", ");
    const text = `b = [${bStr}];\na = [${aStr}];`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedHz(true);
      setTimeout(() => setCopiedHz(false), 2000);
    }).catch(() => {});
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(cCode).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }).catch(() => {});
  };

  if (!analogTf) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--text-secondary)]">
        Design an analog filter in the Standard or Custom tab first
      </div>
    );
  }

  // Plot colors
  const bgColor = dark ? "#1e293b" : "#ffffff";
  const gridColor = dark ? "#334155" : "#e5e7eb";
  const textColor = dark ? "#e2e8f0" : "#374151";
  const lineColor = dark ? "#60a5fa" : "#2563eb";
  const phaseColor = dark ? "#f472b6" : "#ec4899";

  // Frequency axis data
  const freqs = result
    ? useHz
      ? result.response.frequencies
      : result.response.omega.map(w => w * fs)  // rad/sample → rad/s
    : [];
  const freqLabel = useHz
    ? "Frequency (Hz)"
    : "\u03c9 (rad/s)";

  const nyquist = useHz ? fs / 2 : 2 * 2 * Math.PI * fs;
  // Actual sweep extent for default axis range
  const sweepMax = useHz ? (0.98 * fs) / 2 : 0.98 * 2 * 2 * Math.PI * fs;
  const userFreqRange = parseRange(ranges.freqMin, ranges.freqMax);
  const magRange = parseRange(ranges.magMin, ranges.magMax);
  const phaseRange = parseRange(ranges.phaseMin, ranges.phaseMax);
  // Clamp frequency range to [0, Nyquist] — digital response is only unique in this band
  const freqRange: [number, number] = userFreqRange
    ? [Math.max(0, Math.min(userFreqRange[0], nyquist)), Math.min(userFreqRange[1], nyquist)]
    : [0, sweepMax];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 p-4">
      {/* Sidebar */}
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-[var(--panel)] border border-[var(--border)] space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text)]">
            Digital Settings
          </h3>
          <NumberInput
            label="Sampling Frequency (Hz)"
            value={fs}
            onChange={(v) => setFs(Math.max(1, Math.round(v)))}
            min={1}
            step={1}
          />
          <NumberInput
            label="Prewarp Frequency (Hz)"
            value={prewarpHz}
            onChange={(v) => setPrewarpHz(Math.max(0.01, v))}
            min={0.01}
            step={1}
          />
          {prewarpHz >= fs / 2 && (
            <p className="text-xs text-red-500">
              Prewarp frequency must be below Nyquist ({(fs / 2).toFixed(0)} Hz)
            </p>
          )}
          {fs > 10000 && (
            <p className="text-xs text-yellow-500">
              Fs &gt; 10 kHz may be too fast for Arduino Uno (16 MHz). Consider Due, Teensy, or ESP32.
            </p>
          )}
        </div>

        {result && (
          <PoleZeroMap
            poles={result.dtf.poles}
            zeros={result.dtf.zeros}
            dark={dark}
          />
        )}
      </div>

      {/* Main content */}
      <div className="space-y-4">
        {/* Transfer function display */}
        {result && (
          <div className="p-4 rounded-lg bg-[var(--panel)] border border-[var(--border)] overflow-x-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[var(--text)]">
                Digital Transfer Function
              </h3>
              <button
                onClick={handleCopyHz}
                className="text-xs px-2 py-1 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] hover:border-[var(--accent)] transition-colors"
              >
                {copiedHz ? "Copied!" : "Copy H(z)"}
              </button>
            </div>
            <div
              className="text-center py-2"
              dangerouslySetInnerHTML={{ __html: tfHtml }}
            />
          </div>
        )}

        {/* Axis controls */}
        <AxisControls
          useHz={useHz}
          onToggleHz={() => setUseHz(!useHz)}
          magDb={magDb}
          onToggleMagDb={() => setMagDb(!magDb)}
          ranges={ranges}
          onRangeChange={setRanges}
          maxFreq={nyquist}
          suggestedDefaults={{
            freqMin: 0, freqMax: nyquist,
            magMin: magDb ? -100 : 0, magMax: magDb ? 5 : 1.5,
            phaseMin: -270, phaseMax: 0,
          }}
        />

        {/* Frequency response plots */}
        {result && (
          <div className="space-y-2">
            <div className="rounded-lg bg-[var(--panel)] border border-[var(--border)] overflow-hidden">
              <Plot
                data={[
                  {
                    x: freqs,
                    y: magDb
                      ? result.response.magnitudeDb
                      : result.response.magnitude,
                    type: "scatter" as const,
                    mode: "lines" as const,
                    line: { color: lineColor, width: 2 },
                    name: "Magnitude",
                  },
                ]}
                layout={{
                  height: 250,
                  paper_bgcolor: bgColor,
                  plot_bgcolor: bgColor,
                  font: { color: textColor, size: 12 },
                  margin: { l: 60, r: 20, t: 10, b: 40 },
                  xaxis: {
                    title: { text: freqLabel },
                    gridcolor: gridColor,
                    linecolor: gridColor,
                    ...(freqRange && { range: freqRange }),
                    ...(!useHz && { tickformat: "~s" }),
                  },
                  yaxis: {
                    title: {
                      text: magDb ? "Magnitude (dB)" : "Magnitude",
                    },
                    gridcolor: gridColor,
                    linecolor: gridColor,
                    ...(magRange && { range: magRange }),
                  },
                }}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: "100%", height: "250px" }}
              />
            </div>

            <div className="rounded-lg bg-[var(--panel)] border border-[var(--border)] overflow-hidden">
              <Plot
                data={[
                  {
                    x: freqs,
                    y: result.response.phase,
                    type: "scatter" as const,
                    mode: "lines" as const,
                    line: { color: phaseColor, width: 2 },
                    name: "Phase",
                  },
                ]}
                layout={{
                  height: 220,
                  paper_bgcolor: bgColor,
                  plot_bgcolor: bgColor,
                  font: { color: textColor, size: 12 },
                  margin: { l: 60, r: 20, t: 10, b: 40 },
                  xaxis: {
                    title: { text: freqLabel },
                    gridcolor: gridColor,
                    linecolor: gridColor,
                    ...(freqRange && { range: freqRange }),
                    ...(!useHz && { tickformat: "~s" }),
                  },
                  yaxis: {
                    title: { text: "Phase (degrees)" },
                    gridcolor: gridColor,
                    linecolor: gridColor,
                    ...(phaseRange && { range: phaseRange }),
                  },
                }}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: "100%", height: "220px" }}
              />
            </div>
          </div>
        )}

        {/* Arduino/C code block */}
        {result && (
          <div className="rounded-lg bg-[var(--panel)] border border-[var(--border)] overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <h3 className="text-sm font-semibold text-[var(--text)]">
                Arduino / C Implementation
              </h3>
              <button
                onClick={handleCopyCode}
                className="text-xs px-2 py-1 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] hover:border-[var(--accent)] transition-colors"
              >
                {copiedCode ? "Copied!" : "Copy Code"}
              </button>
            </div>
            <pre className="px-4 pb-4 overflow-x-auto text-xs leading-relaxed font-mono text-[var(--text)] bg-[var(--bg-secondary)]">
              <code>{cCode}</code>
            </pre>
          </div>
        )}

        {!result && analogTf && (
          <div className="flex items-center justify-center h-64 text-[var(--text-secondary)]">
            Adjust sampling and prewarp frequencies above
          </div>
        )}
      </div>
    </div>
  );
}
