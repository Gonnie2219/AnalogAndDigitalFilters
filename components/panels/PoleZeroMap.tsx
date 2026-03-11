"use client";
import Plot from "@/components/plot/PlotlyWrapper";
import { Complex } from "@/lib/filters/types";

interface PoleZeroMapProps {
  poles: Complex[];
  zeros: Complex[];
  dark: boolean;
}

function isValid(p: Complex): boolean {
  return isFinite(p.re) && isFinite(p.im);
}

export default function PoleZeroMap({ poles, zeros, dark }: PoleZeroMapProps) {
  const bgColor = dark ? "#1e293b" : "#ffffff";
  const gridColor = dark ? "#334155" : "#e5e7eb";
  const textColor = dark ? "#e2e8f0" : "#374151";

  const validPoles = poles.filter(isValid);
  const validZeros = zeros.filter(isValid);

  // Unit circle
  const theta = Array.from({ length: 100 }, (_, i) => (i / 99) * 2 * Math.PI);
  const unitCircleX = theta.map(Math.cos);
  const unitCircleY = theta.map(Math.sin);

  // Compute axis range
  const allPoints = [...validPoles, ...validZeros];
  const maxAbs = Math.max(
    2,
    ...allPoints.map((p) => Math.max(Math.abs(p.re), Math.abs(p.im)) * 1.3)
  );

  const traces: Plotly.Data[] = [
    {
      x: unitCircleX,
      y: unitCircleY,
      type: "scatter" as const,
      mode: "lines" as const,
      line: { color: gridColor, width: 1, dash: "dash" },
      showlegend: false,
      hoverinfo: "skip" as const,
    },
  ];

  if (validPoles.length > 0) {
    traces.push({
      x: validPoles.map((p) => p.re),
      y: validPoles.map((p) => p.im),
      type: "scatter" as const,
      mode: "markers" as const,
      marker: { symbol: "x", size: 10, color: dark ? "#f87171" : "#dc2626", line: { width: 2 } },
      name: "Poles",
      showlegend: false,
    });
  }

  if (validZeros.length > 0) {
    traces.push({
      x: validZeros.map((z) => z.re),
      y: validZeros.map((z) => z.im),
      type: "scatter" as const,
      mode: "markers" as const,
      marker: { symbol: "circle-open", size: 10, color: dark ? "#60a5fa" : "#2563eb", line: { width: 2 } },
      name: "Zeros",
      showlegend: false,
    });
  }

  return (
    <div className="rounded-lg bg-[var(--panel)] border border-[var(--border)] overflow-hidden">
      <h3 className="text-sm font-semibold text-[var(--text)] px-4 pt-3">Pole-Zero Map</h3>
      <Plot
        data={traces}
        layout={{
          height: 300,
          paper_bgcolor: bgColor,
          plot_bgcolor: bgColor,
          font: { color: textColor, size: 11 },
          margin: { l: 50, r: 20, t: 10, b: 40 },
          showlegend: false,
          xaxis: {
            title: { text: "Real" },
            range: [-maxAbs, maxAbs],
            gridcolor: gridColor,
            linecolor: gridColor,
            zeroline: true,
            zerolinecolor: textColor,
          },
          yaxis: {
            title: { text: "Imaginary" },
            range: [-maxAbs, maxAbs],
            scaleanchor: "x",
            gridcolor: gridColor,
            linecolor: gridColor,
            zeroline: true,
            zerolinecolor: textColor,
          },
        }}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: "100%", height: "300px" }}
      />
      {/* HTML legend — avoids Plotly's in-plot legend marker being mistaken for data */}
      <div className="flex items-center gap-4 px-4 pb-2 text-xs text-[var(--text-secondary)]">
        <span className="flex items-center gap-1">
          <svg width="12" height="12"><line x1="2" y1="2" x2="10" y2="10" stroke={dark ? "#f87171" : "#dc2626"} strokeWidth="2" /><line x1="10" y1="2" x2="2" y2="10" stroke={dark ? "#f87171" : "#dc2626"} strokeWidth="2" /></svg>
          Poles ({validPoles.length})
        </span>
        {validZeros.length > 0 && (
          <span className="flex items-center gap-1">
            <svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="none" stroke={dark ? "#60a5fa" : "#2563eb"} strokeWidth="2" /></svg>
            Zeros ({validZeros.length})
          </span>
        )}
      </div>
    </div>
  );
}
