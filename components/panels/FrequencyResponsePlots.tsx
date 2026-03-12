"use client";
import Plot from "@/components/plot/PlotlyWrapper";
import { FrequencyResponse } from "@/lib/filters/types";
import { computeGroupDelay } from "@/lib/filters/response";
import { radToHz } from "@/lib/utils/units";
import { AxisRanges } from "./AxisControls";

interface FrequencyResponsePlotsProps {
  response: FrequencyResponse;
  dark: boolean;
  useHz: boolean;
  magDb: boolean;
  ranges: AxisRanges;
  compareResponse?: FrequencyResponse;
  compareLabel?: string;
  primaryLabel?: string;
}

function parseRange(min: string, max: string): [number, number] | undefined {
  const lo = parseFloat(min);
  const hi = parseFloat(max);
  if (!isNaN(lo) && !isNaN(hi) && lo < hi) return [lo, hi];
  return undefined;
}

/** Format a number with SI prefix (e.g. 5000 → "5k", 2000000 → "2M") */
function formatSI(value: number): string {
  if (value >= 1e9) return `${value / 1e9}G`;
  if (value >= 1e6) return `${value / 1e6}M`;
  if (value >= 1e3) return `${value / 1e3}k`;
  if (value < 1 && value > 0) return String(Math.round(value * 1000) / 1000);
  return String(value);
}

/** Generate explicit tick positions + SI-prefixed labels for a log frequency axis */
function generateLogTicks(minVal: number, maxVal: number): { tickvals: number[]; ticktext: string[] } {
  const safeMin = Math.max(minVal, 1e-10);
  const minExp = Math.floor(Math.log10(safeMin));
  const maxExp = Math.ceil(Math.log10(maxVal));
  const numDecades = maxExp - minExp;

  // Fewer sub-decade ticks for wide ranges to avoid clutter
  const steps = numDecades <= 4 ? [1, 2, 5] : numDecades <= 5 ? [1, 5] : [1];

  const tickvals: number[] = [];
  const ticktext: string[] = [];

  for (let exp = minExp; exp <= maxExp; exp++) {
    for (const s of steps) {
      const val = s * Math.pow(10, exp);
      if (val >= safeMin * 0.5 && val <= maxVal * 2) {
        tickvals.push(val);
        ticktext.push(formatSI(val));
      }
    }
  }
  return { tickvals, ticktext };
}

export default function FrequencyResponsePlots({ response, dark, useHz, magDb, ranges, compareResponse, compareLabel, primaryLabel }: FrequencyResponsePlotsProps) {
  const bgColor = dark ? "#1e293b" : "#ffffff";
  const gridColor = dark ? "#334155" : "#e5e7eb";
  const textColor = dark ? "#e2e8f0" : "#374151";
  const lineColor = dark ? "#60a5fa" : "#2563eb";
  const phaseColor = dark ? "#f472b6" : "#ec4899";
  const gdColor = dark ? "#34d399" : "#10b981";

  // Compare trace colors (orange)
  const compareLineColor = dark ? "#fb923c" : "#ea580c";
  const comparePhaseColor = dark ? "#fbbf24" : "#d97706";
  const compareGdColor = dark ? "#a78bfa" : "#7c3aed";

  // Group delay: differentiate with respect to rad/s (always), display in seconds
  const groupDelay = computeGroupDelay(response.phase, response.frequencies);

  const freqs = useHz
    ? response.frequencies.map(radToHz)
    : response.frequencies;
  const freqLabel = useHz ? "Frequency (Hz)" : "Frequency (rad/s)";

  // Compare data
  const cmpFreqs = compareResponse
    ? (useHz ? compareResponse.frequencies.map(radToHz) : compareResponse.frequencies)
    : null;
  const cmpGroupDelay = compareResponse
    ? computeGroupDelay(compareResponse.phase, compareResponse.frequencies)
    : null;

  const freqRange = parseRange(ranges.freqMin, ranges.freqMax);
  const magRange = parseRange(ranges.magMin, ranges.magMax);
  const phaseRange = parseRange(ranges.phaseMin, ranges.phaseMax);

  // For log axis, Plotly needs log10 of the range values
  const xRange = freqRange
    ? [Math.log10(Math.max(freqRange[0], 1e-6)), Math.log10(freqRange[1])]
    : undefined;

  // Generate SI-prefixed tick labels covering the visible range
  const tickMin = freqRange ? freqRange[0] : freqs[0];
  const tickMax = freqRange ? freqRange[1] : freqs[freqs.length - 1];
  const { tickvals, ticktext } = generateLogTicks(tickMin, tickMax);

  const isComparing = !!compareResponse;

  const commonLayout = {
    paper_bgcolor: bgColor,
    plot_bgcolor: bgColor,
    font: { color: textColor, size: 12 },
    margin: { l: 60, r: 20, t: isComparing ? 30 : 10, b: 40 },
    showlegend: isComparing,
    legend: isComparing ? { x: 0, y: 1.15, orientation: "h" as const, font: { size: 11 } } : undefined,
    xaxis: {
      type: "log" as const,
      tickmode: "array" as const,
      title: { text: freqLabel },
      gridcolor: gridColor,
      linecolor: gridColor,
      tickvals,
      ticktext,
      ...(xRange && { range: xRange }),
    },
  };

  return (
    <div className="space-y-2">
      <div className="rounded-lg bg-[var(--panel)] border border-[var(--border)] overflow-hidden">
        <Plot
          data={[
            {
              x: freqs,
              y: magDb ? response.magnitudeDb : response.magnitude,
              type: "scatter" as const,
              mode: "lines" as const,
              line: { color: lineColor, width: 2 },
              name: primaryLabel || "Magnitude",
            },
            ...(compareResponse && cmpFreqs ? [{
              x: cmpFreqs,
              y: magDb ? compareResponse.magnitudeDb : compareResponse.magnitude,
              type: "scatter" as const,
              mode: "lines" as const,
              line: { color: compareLineColor, width: 2 },
              name: compareLabel || "Compare",
            }] : []),
          ]}
          layout={{
            ...commonLayout,
            height: 250,
            yaxis: {
              title: { text: magDb ? "Magnitude (dB)" : "Magnitude" },
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
              y: response.phase,
              type: "scatter" as const,
              mode: "lines" as const,
              line: { color: phaseColor, width: 2 },
              name: primaryLabel || "Phase",
            },
            ...(compareResponse && cmpFreqs ? [{
              x: cmpFreqs,
              y: compareResponse.phase,
              type: "scatter" as const,
              mode: "lines" as const,
              line: { color: comparePhaseColor, width: 2 },
              name: compareLabel || "Compare",
            }] : []),
          ]}
          layout={{
            ...commonLayout,
            height: 220,
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

      <div className="rounded-lg bg-[var(--panel)] border border-[var(--border)] overflow-hidden">
        <Plot
          data={[
            {
              x: freqs,
              y: groupDelay,
              type: "scatter" as const,
              mode: "lines" as const,
              line: { color: gdColor, width: 2 },
              name: primaryLabel || "Group Delay",
            },
            ...(compareResponse && cmpFreqs && cmpGroupDelay ? [{
              x: cmpFreqs,
              y: cmpGroupDelay,
              type: "scatter" as const,
              mode: "lines" as const,
              line: { color: compareGdColor, width: 2 },
              name: compareLabel || "Compare",
            }] : []),
          ]}
          layout={{
            ...commonLayout,
            height: 200,
            yaxis: {
              title: { text: "Group Delay (s)" },
              gridcolor: gridColor,
              linecolor: gridColor,
              tickformat: "~s",
            },
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: "100%", height: "200px" }}
        />
      </div>
    </div>
  );
}
