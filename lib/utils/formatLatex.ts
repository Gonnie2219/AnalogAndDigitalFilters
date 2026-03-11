import { TransferFunction } from "../filters/types";
import { polyToLatex, formatCoef } from "../filters/polynomial";

/** Format a transfer function as a LaTeX fraction */
export function transferFunctionToLatex(tf: TransferFunction): string {
  const numLatex = polyToLatex(tf.numerator, "s");
  const denLatex = polyToLatex(tf.denominator, "s");
  return `H(s) = \\frac{${numLatex}}{${denLatex}}`;
}

/** Format a digital transfer function H(z) as LaTeX in z^{-1} form */
export function digitalTfToLatex(b: number[], a: number[]): string {
  const numLatex = zInvPolyToLatex(b);
  const denLatex = zInvPolyToLatex(a);
  return `H(z) = \\frac{${numLatex}}{${denLatex}}`;
}

/** Format coefficients as a polynomial in z^{-1} */
function zInvPolyToLatex(coeffs: number[]): string {
  const terms: string[] = [];
  for (let k = 0; k < coeffs.length; k++) {
    const c = coeffs[k];
    if (c === 0) continue;
    const absC = Math.abs(c);
    const sign = c >= 0 ? "+" : "-";

    let coefStr: string;
    if (k > 0 && Math.abs(absC - 1) < 1e-10) {
      coefStr = "";
    } else {
      coefStr = formatCoef(absC);
    }

    let term: string;
    if (k === 0) {
      term = formatCoef(absC);
    } else if (k === 1) {
      term = coefStr ? `${coefStr}z^{-1}` : `z^{-1}`;
    } else {
      term = coefStr ? `${coefStr}z^{-${k}}` : `z^{-${k}}`;
    }

    if (terms.length === 0) {
      terms.push(c < 0 ? `-${term}` : term);
    } else {
      terms.push(`${sign} ${term}`);
    }
  }
  return terms.join(" ") || "0";
}

/** Format a number with engineering notation */
export function formatEngineering(value: number): string {
  if (value === 0) return "0";
  const abs = Math.abs(value);
  const prefixes = [
    { exp: 12, prefix: "T" },
    { exp: 9, prefix: "G" },
    { exp: 6, prefix: "M" },
    { exp: 3, prefix: "k" },
    { exp: 0, prefix: "" },
    { exp: -3, prefix: "m" },
    { exp: -6, prefix: "μ" },
    { exp: -9, prefix: "n" },
    { exp: -12, prefix: "p" },
  ];
  for (const { exp, prefix } of prefixes) {
    if (abs >= Math.pow(10, exp)) {
      const scaled = value / Math.pow(10, exp);
      return `${scaled.toFixed(3).replace(/\.?0+$/, "")}${prefix}`;
    }
  }
  return value.toExponential(3);
}

const siMultipliers: Record<string, number> = {
  T: 1e12, G: 1e9, M: 1e6, k: 1e3,
  m: 1e-3, u: 1e-6, "μ": 1e-6,
  n: 1e-9, p: 1e-12,
};

/** Parse a string with optional SI suffix (e.g., "10k", "200n", "1.5μ") */
export function parseEngineering(text: string): number | null {
  const s = text.trim();
  if (!s) return null;
  // Try plain number / exponential first
  const plain = Number(s);
  if (!isNaN(plain)) return plain;
  // Try with SI suffix: number followed by a single letter
  const match = s.match(/^([+-]?\d+\.?\d*(?:[eE][+-]?\d+)?)\s*([TGMkmμunp])$/);
  if (match) {
    const num = parseFloat(match[1]);
    const mult = siMultipliers[match[2]];
    if (!isNaN(num) && mult !== undefined) return num * mult;
  }
  return null;
}
