"use client";
import Plot from "@/components/plot/PlotlyWrapper";
import { FrequencyResponse } from "@/lib/filters/types";
import { radToHz } from "@/lib/utils/units";
import { AxisRanges } from "./AxisControls";

interface FrequencyResponsePlotsProps {
  response: FrequencyResponse;
  dark: boolean;
  useHz: boolean;
  magDb: boolean;
  ranges: AxisRanges;
}

function parseRange(min: string, max: string): [number, number] | undefined {
  const lo = parseFloat(min);
  const hi = parseFloat(max);
  if (!isNaN(lo) && !isNaN(hi) && lo < hi) return [lo, hi];
  return undefined;
}

export default function FrequencyResponsePlots({ response, dark, useHz, magDb, ranges }: FrequencyResponsePlotsProps) {
  const bgColor = dark ? "#1e293b" : "#ffffff";
  const gridColor = dark ? "#334155" : "#e5e7eb";
  const textColor = dark ? "#e2e8f0" : "#374151";
  const lineColor = dark ? "#60a5fa" : "#2563eb";
  const phaseColor = dark ? "#f472b6" : "#ec4899";

  const freqs = useHz
    ? response.frequencies.map(radToHz)
    : response.frequencies;
  const freqLabel = useHz ? "Frequency (Hz)" : "Frequency (rad/s)";

  const freqRange = parseRange(ranges.freqMin, ranges.freqMax);
  const magRange = parseRange(ranges.magMin, ranges.magMax);
  const phaseRange = parseRange(ranges.phaseMin, ranges.phaseMax);

  // For log axis, Plotly needs log10 of the range values
  const xRange = freqRange
    ? [Math.log10(freqRange[0]), Math.log10(freqRange[1])]
    : undefined;

  const commonLayout = {
    paper_bgcolor: bgColor,
    plot_bgcolor: bgColor,
    font: { color: textColor, size: 12 },
    margin: { l: 60, r: 20, t: 10, b: 40 },
    xaxis: {
      type: "log" as const,
      title: { text: freqLabel },
      gridcolor: gridColor,
      linecolor: gridColor,
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
              name: "Magnitude",
            },
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
              name: "Phase",
            },
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
    </div>
  );
}
