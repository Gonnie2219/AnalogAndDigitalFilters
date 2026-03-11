import { Complex } from "./types";

/**
 * Elliptic (Cauer) filter prototype poles and zeros.
 * Uses Jacobi elliptic functions computed via the AGM method.
 */

/** Complete elliptic integral K(m) via AGM */
function ellipticK(m: number): number {
  if (m >= 1) return Infinity;
  if (m < 0) m = 0;
  let a = 1;
  let b = Math.sqrt(1 - m);
  for (let i = 0; i < 50; i++) {
    const aNew = (a + b) / 2;
    const bNew = Math.sqrt(a * b);
    if (Math.abs(aNew - bNew) < 1e-15) {
      a = aNew;
      break;
    }
    a = aNew;
    b = bNew;
  }
  return Math.PI / (2 * a);
}

/** Jacobi elliptic functions sn, cn, dn via descending Landen transformation */
function jacobiElliptic(u: number, m: number): { sn: number; cn: number; dn: number } {
  if (m < 1e-15) {
    return { sn: Math.sin(u), cn: Math.cos(u), dn: 1 };
  }
  if (m > 1 - 1e-15) {
    const t = Math.tanh(u);
    const s = 1 / Math.cosh(u);
    return { sn: t, cn: s, dn: s };
  }

  const N = 30;
  const a = new Array(N);
  const c = new Array(N);
  a[0] = 1;
  let b = Math.sqrt(1 - m);
  c[0] = Math.sqrt(m);
  let n = 0;
  for (n = 0; n < N - 1; n++) {
    a[n + 1] = (a[n] + b) / 2;
    c[n + 1] = (a[n] - b) / 2;
    b = Math.sqrt(a[n] * b);
    if (Math.abs(c[n + 1]) < 1e-15) {
      n++;
      break;
    }
  }

  let phi = Math.pow(2, n) * a[n] * u;
  for (let i = n; i >= 1; i--) {
    phi = (phi + Math.asin((c[i] / a[i]) * Math.sin(phi))) / 2;
  }

  const sn = Math.sin(phi);
  const cn = Math.cos(phi);
  const dn = Math.sqrt(1 - m * sn * sn);
  return { sn, cn, dn };
}

/** Complex Jacobi sn function */
function jacobiSnComplex(uRe: number, uIm: number, m: number): { re: number; im: number } {
  const e1 = jacobiElliptic(uRe, m);
  const m1 = 1 - m;
  const e2 = jacobiElliptic(uIm, m1);
  const denom = e1.cn * e1.cn * e2.dn * e2.dn + m * e1.sn * e1.sn * e2.sn * e2.sn * e2.cn * e2.cn / (e2.dn * e2.dn);
  // More stable form
  const D = e2.cn * e2.cn + m * e1.sn * e1.sn * e2.sn * e2.sn;
  const re = (e1.sn * e2.dn) / D;
  const im = (e1.cn * e1.dn * e2.sn * e2.cn) / D;
  return { re, im };
}

export function ellipticPoles(order: number, rippleDb: number, stopbandDb: number): Complex[] {
  const eps = Math.sqrt(Math.pow(10, rippleDb / 10) - 1);
  const delta = Math.sqrt(Math.pow(10, stopbandDb / 10) - 1);
  const k1 = eps / delta;
  const k1p = Math.sqrt(1 - k1 * k1);

  // Selectivity parameter k from degree equation
  const K1 = ellipticK(k1 * k1);
  const K1p = ellipticK(k1p * k1p);
  const ratio = K1p / K1 / order;

  // Find k such that K(k')/K(k) = ratio using Newton's method on the nome
  let k: number;
  {
    // Use the nome relationship
    const qTarget = Math.exp(-Math.PI * ratio);
    // Approximate k from nome q: k ≈ 4*sqrt(q)
    let q = qTarget;
    k = 4 * Math.sqrt(q);
    // Refine: compute K'/K for this k and adjust
    for (let iter = 0; iter < 50; iter++) {
      if (k > 0.9999) k = 0.9999;
      if (k < 0.0001) k = 0.0001;
      const kp = Math.sqrt(1 - k * k);
      const Kk = ellipticK(k * k);
      const Kkp = ellipticK(kp * kp);
      const currentRatio = Kkp / Kk;
      if (Math.abs(currentRatio - 1 / ratio) < 1e-12) break;
      // Binary search approach
      const target = 1 / ratio;
      if (currentRatio > target) {
        k = k * 1.001;
      } else {
        k = k * 0.999;
      }
    }
    // More robust: use direct calculation
    // K'(k)/K(k) = 1/(n * K'(k1)/K(k1))
    // Solve via bisection
    let lo = 0.0001, hi = 0.9999;
    const target = 1 / ratio; // K'(k)/K(k) target
    for (let iter = 0; iter < 100; iter++) {
      const mid = (lo + hi) / 2;
      const kp = Math.sqrt(1 - mid * mid);
      const Kk = ellipticK(mid * mid);
      const Kkp = ellipticK(kp * kp);
      const r = Kkp / Kk;
      if (r < target) {
        hi = mid;
      } else {
        lo = mid;
      }
    }
    k = (lo + hi) / 2;
  }

  const m = k * k;
  const Kk = ellipticK(m);
  const kp = Math.sqrt(1 - m);
  const Kkp = ellipticK(kp * kp);

  // Compute v0 = -j * sn^{-1}(j/(eps*k1), k1) / (n*K(k1))
  // Simplified: v0 from inverse sn
  const K1val = ellipticK(k1 * k1);
  const v0 = (1 / (order * K1val)) * Math.asinh(1 / eps);

  const poles: Complex[] = [];
  for (let i = 0; i < order; i++) {
    const ui = (2 * i + 1) / order;
    const uVal = ui * Kk;
    // Pole = j * cd(u - j*v0*K', m) with appropriate mapping
    // Using the standard formulation: pole_i = j * sn(K*ui + j*v0*K', m)
    // with the j*K' shift handled via complex sn
    const snVal = jacobiSnComplex(uVal, v0 * Kkp, m);
    // The pole in the s-plane
    poles.push({
      re: -snVal.im * k,  // real part
      im: snVal.re * k,   // imaginary part
    });
  }

  // Ensure left-half plane
  return poles.map(p => ({
    re: p.re > 0 ? -p.re : p.re,
    im: p.im
  }));
}

export function ellipticZeros(order: number, rippleDb: number, stopbandDb: number): Complex[] {
  const eps = Math.sqrt(Math.pow(10, rippleDb / 10) - 1);
  const delta = Math.sqrt(Math.pow(10, stopbandDb / 10) - 1);
  const k1 = eps / delta;
  const k1p = Math.sqrt(1 - k1 * k1);

  const K1 = ellipticK(k1 * k1);
  const K1p = ellipticK(k1p * k1p);
  const ratio = K1p / K1 / order;

  // Find k via bisection (same as above)
  let lo = 0.0001, hi = 0.9999;
  const target = 1 / ratio;
  for (let iter = 0; iter < 100; iter++) {
    const mid = (lo + hi) / 2;
    const kp = Math.sqrt(1 - mid * mid);
    const Kk = ellipticK(mid * mid);
    const Kkp = ellipticK(kp * kp);
    if (Kkp / Kk < target) hi = mid;
    else lo = mid;
  }
  const k = (lo + hi) / 2;
  const m = k * k;
  const Kk = ellipticK(m);

  const zeros: Complex[] = [];
  const nZeros = Math.floor(order / 2);
  for (let i = 0; i < nZeros; i++) {
    const ui = (2 * i + 1) / order;
    const uVal = ui * Kk;
    const e = jacobiElliptic(uVal, m);
    if (Math.abs(e.sn) > 1e-14) {
      const zIm = 1 / (k * e.sn);
      zeros.push({ re: 0, im: zIm });
      zeros.push({ re: 0, im: -zIm });
    }
  }
  return zeros;
}

export function ellipticGain(poles: Complex[], zeros: Complex[], order: number, rippleDb: number): number {
  // At DC (s=0): H(0) = gain * prod(|z|) / prod(|p|)
  // For even order, H(0) = 1/sqrt(1+eps^2)
  // For odd order, H(0) = 1
  let numProd = 1;
  for (const z of zeros) numProd *= Math.sqrt(z.re * z.re + z.im * z.im);
  let denProd = 1;
  for (const p of poles) denProd *= Math.sqrt(p.re * p.re + p.im * p.im);

  if (order % 2 === 0) {
    const eps = Math.sqrt(Math.pow(10, rippleDb / 10) - 1);
    return (denProd / numProd) / Math.sqrt(1 + eps * eps);
  }
  return denProd / numProd;
}
