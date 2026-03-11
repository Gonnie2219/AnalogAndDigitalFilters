"use client";
import { TransferFunction } from "@/lib/filters/types";
import { transferFunctionToLatex } from "@/lib/utils/formatLatex";
import "katex/dist/katex.min.css";
import katex from "katex";
import { useMemo, useState } from "react";

interface TransferFunctionDisplayProps {
  tf: TransferFunction;
}

/** Format a coefficient for readable export (e.g., 1e9 instead of 1000000000) */
function fmtCoef(c: number): string {
  if (c === 0) return "0";
  const abs = Math.abs(c);
  if (abs < 1e4 && Math.abs(c - Math.round(c)) < 1e-6) return Math.round(c).toString();
  const s = c.toPrecision(6);
  if (s.includes("e")) {
    const [mantissa, exp] = s.split("e");
    return mantissa.replace(/\.?0+$/, "") + "e" + exp;
  }
  return s.replace(/\.?0+$/, "").replace(/\.$/, "");
}

export default function TransferFunctionDisplay({ tf }: TransferFunctionDisplayProps) {
  const [copied, setCopied] = useState(false);

  const html = useMemo(() => {
    try {
      const latex = transferFunctionToLatex(tf);
      return katex.renderToString(latex, { displayMode: true, throwOnError: false });
    } catch {
      return "<span>Error rendering transfer function</span>";
    }
  }, [tf]);

  const handleCopy = () => {
    // MATLAB/Python convention: highest degree first
    const num = [...tf.numerator.coeffs].reverse().map(fmtCoef).join(", ");
    const den = [...tf.denominator.coeffs].reverse().map(fmtCoef).join(", ");
    const text = `num = [${num}]\nden = [${den}]`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <div className="p-4 rounded-lg bg-[var(--panel)] border border-[var(--border)] overflow-x-auto">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-[var(--text)]">Transfer Function</h3>
        <button
          onClick={handleCopy}
          className="text-xs px-2 py-1 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] hover:border-[var(--accent)] transition-colors"
        >
          {copied ? "Copied!" : "Copy H(s)"}
        </button>
      </div>
      <div
        className="text-center py-2"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
