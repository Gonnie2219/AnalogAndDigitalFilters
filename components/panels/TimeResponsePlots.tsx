"use client";
import Plot from "@/components/plot/PlotlyWrapper";

interface TimeResponsePlotsProps {
  time: number[];
  impulse: number[];
  step: number[];
  dark: boolean;
  digital?: boolean;
}

export default function TimeResponsePlots({ time, impulse, step, dark, digital }: TimeResponsePlotsProps) {
  const bgColor = dark ? "#1e293b" : "#ffffff";
  const gridColor = dark ? "#334155" : "#e5e7eb";
  const textColor = dark ? "#e2e8f0" : "#374151";
  const impulseColor = dark ? "#60a5fa" : "#2563eb";
  const stepColor = dark ? "#34d399" : "#059669";

  const xLabel = "Time (s)";
  const impulseLabel = digital ? "h[n]" : "h(t)";
  const stepLabel = digital ? "s[n]" : "s(t)";

  const commonLayout = {
    paper_bgcolor: bgColor,
    plot_bgcolor: bgColor,
    font: { color: textColor, size: 12 },
    margin: { l: 60, r: 20, t: 10, b: 40 },
    xaxis: {
      title: { text: xLabel },
      gridcolor: gridColor,
      linecolor: gridColor,
      tickformat: "~s",
    },
  };

  return (
    <div className="space-y-2">
      <div className="rounded-lg bg-[var(--panel)] border border-[var(--border)] overflow-hidden">
        <Plot
          data={[
            {
              x: time,
              y: impulse,
              type: "scatter" as const,
              mode: "lines" as const,
              line: { color: impulseColor, width: 2 },
              name: "Impulse",
            },
          ]}
          layout={{
            ...commonLayout,
            height: 220,
            yaxis: {
              title: { text: impulseLabel },
              gridcolor: gridColor,
              linecolor: gridColor,
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
              x: time,
              y: step,
              type: "scatter" as const,
              mode: "lines" as const,
              line: { color: stepColor, width: 2 },
              name: "Step",
            },
          ]}
          layout={{
            ...commonLayout,
            height: 220,
            yaxis: {
              title: { text: stepLabel },
              gridcolor: gridColor,
              linecolor: gridColor,
            },
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: "100%", height: "220px" }}
        />
      </div>
    </div>
  );
}
