import { Complex, Polynomial } from "./types";
import { cMul, cAdd, cScale } from "./complex";

/** Multiply two polynomials */
export function polyMultiply(a: Polynomial, b: Polynomial): Polynomial {
  const result = new Array(a.coeffs.length + b.coeffs.length - 1).fill(0);
  for (let i = 0; i < a.coeffs.length; i++) {
    for (let j = 0; j < b.coeffs.length; j++) {
      result[i + j] += a.coeffs[i] * b.coeffs[j];
    }
  }
  return { coeffs: result };
}

/** Build polynomial from roots: prod(s - r_i)
 *  Returns real coefficients (imaginary parts from conjugate pairs cancel) */
export function polyFromRoots(roots: Complex[]): Polynomial {
  let result: Polynomial = { coeffs: [1] };
  for (const root of roots) {
    // Multiply by (s - root)
    // coeffs are [a0, a1, ...] for a0 + a1*s + ...
    // (s - root) = [-root, 1] but root is complex
    // We pair conjugate roots to get real coefficients
    const rootMag = Math.sqrt(root.re * root.re + root.im * root.im);
    if (Math.abs(root.im) < 1e-10 * (1 + rootMag)) {
      // Real root: (s - re)
      result = polyMultiply(result, { coeffs: [-root.re, 1] });
    } else if (root.im > 0) {
      // Complex conjugate pair: (s - root)(s - conj(root)) = s^2 - 2*re*s + |root|^2
      const mag2 = root.re * root.re + root.im * root.im;
      result = polyMultiply(result, { coeffs: [mag2, -2 * root.re, 1] });
    }
    // Skip roots with im < 0 (they're conjugates, already handled)
  }
  return result;
}

/** Evaluate polynomial at complex point s */
export function polyEval(p: Polynomial, s: Complex): Complex {
  let result: Complex = { re: 0, im: 0 };
  let sPow: Complex = { re: 1, im: 0 };
  for (let i = 0; i < p.coeffs.length; i++) {
    result = cAdd(result, cScale(sPow, p.coeffs[i]));
    sPow = cMul(sPow, s);
  }
  return result;
}

/** Scale polynomial: p(s/wc) and normalize so leading coeff = 1 */
export function polyScaleFreq(p: Polynomial, wc: number): Polynomial {
  const n = p.coeffs.length - 1;
  const result = new Array(p.coeffs.length);
  for (let i = 0; i <= n; i++) {
    result[i] = p.coeffs[i] * Math.pow(wc, n - i);
  }
  // Normalize
  const lead = result[n];
  return { coeffs: result.map((c) => c / lead) };
}

/** Format polynomial to LaTeX string */
export function polyToLatex(p: Polynomial, variable: string = "s"): string {
  const n = p.coeffs.length - 1;
  const terms: string[] = [];
  for (let i = n; i >= 0; i--) {
    const c = p.coeffs[i];
    if (c === 0) continue;
    const absC = Math.abs(c);
    const sign = c >= 0 ? "+" : "-";
    let coefStr: string;
    if (i === n && Math.abs(absC - 1) < 1e-10) {
      coefStr = "";
    } else {
      coefStr = formatCoef(absC);
    }
    let term: string;
    if (i === 0) {
      term = formatCoef(absC);
    } else if (i === 1) {
      term = coefStr ? `${coefStr}${variable}` : variable;
    } else {
      term = coefStr ? `${coefStr}${variable}^{${i}}` : `${variable}^{${i}}`;
    }
    if (terms.length === 0) {
      terms.push(c < 0 ? `-${term}` : term);
    } else {
      terms.push(`${sign} ${term}`);
    }
  }
  return terms.join(" ") || "0";
}

export function formatCoef(c: number): string {
  if (c === 0) return "0";
  // Small integers: display directly (must be >= 1 to avoid catching tiny floats)
  if (c >= 1 && c < 1e4 && Math.abs(c - Math.round(c)) < 1e-6) {
    return Math.round(c).toString();
  }
  // Large or small numbers: scientific notation in LaTeX
  if (c >= 1e4 || c < 0.01) {
    const exp = Math.floor(Math.log10(c));
    const mantissa = c / Math.pow(10, exp);
    if (Math.abs(mantissa - 1) < 1e-4) {
      return `10^{${exp}}`;
    }
    const mRound = Math.abs(mantissa - Math.round(mantissa)) < 1e-4
      ? Math.round(mantissa).toString()
      : mantissa.toPrecision(4).replace(/0+$/, "").replace(/\.$/, "");
    return `${mRound} \\times 10^{${exp}}`;
  }
  // Medium decimals
  return c.toPrecision(4).replace(/0+$/, "").replace(/\.$/, "");
}
