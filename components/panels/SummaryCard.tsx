"use client";
import { FilterResult } from "@/lib/filters/types";
import { radToHz } from "@/lib/utils/units";

interface SummaryCardProps {
  result: FilterResult;
}

export default function SummaryCard({ result }: SummaryCardProps) {
  const { spec, tf, response } = result;

  // Find -3dB frequency with interpolation
  const idx3dB = response.magnitudeDb.findIndex((m) => m < -3);
  let freq3dB = spec.cutoffFreq; // fallback
  if (idx3dB > 0) {
    const f1 = Math.log10(response.frequencies[idx3dB - 1]);
    const f2 = Math.log10(response.frequencies[idx3dB]);
    const m1 = response.magnitudeDb[idx3dB - 1];
    const m2 = response.magnitudeDb[idx3dB];
    const t = (-3 - m1) / (m2 - m1);
    freq3dB = Math.pow(10, f1 + t * (f2 - f1));
  }

  // DC gain
  const dcGain = response.magnitudeDb[0];

  // Number of poles/zeros
  const nPoles = tf.poles.length;
  const nZeros = tf.zeros.length;

  const typeLabels: Record<string, string> = {
    butterworth: "Butterworth",
    chebyshev1: "Chebyshev Type I",
    chebyshev2: "Chebyshev Type II",
    bessel: "Bessel",
    elliptic: "Elliptic (Cauer)",
  };

  return (
    <div className="p-4 rounded-lg bg-[var(--panel)] border border-[var(--border)]">
      <h3 className="text-sm font-semibold text-[var(--text)] mb-2">Summary</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <span className="text-[var(--text-secondary)]">Type</span>
        <span className="text-[var(--text)]">{typeLabels[spec.filterType]}</span>
        <span className="text-[var(--text-secondary)]">Response</span>
        <span className="text-[var(--text)] capitalize">{spec.responseType}</span>
        <span className="text-[var(--text-secondary)]">Order</span>
        <span className="text-[var(--text)]">{spec.order}</span>
        <span className="text-[var(--text-secondary)]">-3dB Freq</span>
        <span className="text-[var(--text)]">{radToHz(freq3dB).toFixed(2)} Hz</span>
        <span className="text-[var(--text-secondary)]">DC Gain</span>
        <span className="text-[var(--text)]">{dcGain.toFixed(2)} dB</span>
        <span className="text-[var(--text-secondary)]">Poles</span>
        <span className="text-[var(--text)]">{nPoles}</span>
        <span className="text-[var(--text-secondary)]">Zeros</span>
        <span className="text-[var(--text)]">{nZeros}</span>
      </div>
    </div>
  );
}
