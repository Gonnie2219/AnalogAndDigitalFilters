import { Complex } from "./types";

/** Chebyshev Type II (Inverse Chebyshev) prototype poles and zeros */
export function chebyshev2Poles(order: number, stopbandDb: number): Complex[] {
  const eps = 1 / Math.sqrt(Math.pow(10, stopbandDb / 10) - 1);
  const mu = (1 / order) * Math.asinh(1 / eps);
  const poles: Complex[] = [];
  for (let k = 0; k < order; k++) {
    const theta = (Math.PI * (2 * k + 1)) / (2 * order);
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);
    const sigmaP = -Math.sinh(mu) * sinT;
    const omegaP = Math.cosh(mu) * cosT;
    // Invert: Chebyshev II poles = 1 / Chebyshev I poles
    const denom = sigmaP * sigmaP + omegaP * omegaP;
    poles.push({
      re: sigmaP / denom,
      im: -omegaP / denom,
    });
  }
  return poles;
}

export function chebyshev2Zeros(order: number): Complex[] {
  const zeros: Complex[] = [];
  for (let k = 0; k < order; k++) {
    const theta = (Math.PI * (2 * k + 1)) / (2 * order);
    const cosT = Math.cos(theta);
    if (Math.abs(cosT) > 1e-14) {
      const omegaZ = 1 / cosT;
      zeros.push({ re: 0, im: omegaZ });
      zeros.push({ re: 0, im: -omegaZ });
    }
  }
  // Remove duplicate pairs, keep only unique |im| values with +im
  const seen = new Set<string>();
  const unique: Complex[] = [];
  for (const z of zeros) {
    const key = Math.abs(z.im).toFixed(12);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push({ re: 0, im: Math.abs(z.im) });
      unique.push({ re: 0, im: -Math.abs(z.im) });
    }
  }
  return unique;
}

export function chebyshev2Gain(poles: Complex[], zeros: Complex[]): number {
  // H(0) = gain * prod(-z_i) / prod(-p_i) = 1
  let numProd = 1;
  for (const z of zeros) {
    numProd *= Math.sqrt(z.re * z.re + z.im * z.im);
  }
  let denProd = 1;
  for (const p of poles) {
    denProd *= Math.sqrt(p.re * p.re + p.im * p.im);
  }
  return denProd / numProd;
}
