import { Complex, TransferFunction } from "../filters/types";
import { FilterSection, FirstOrderSection, SecondOrderSection } from "./types";

/** Split transfer function into cascaded 1st and 2nd order sections */
export function factorize(tf: TransferFunction): FilterSection[] {
  const poles = [...tf.poles];
  const sections: FilterSection[] = [];
  const used = new Array(poles.length).fill(false);

  // Pair conjugate poles
  for (let i = 0; i < poles.length; i++) {
    if (used[i]) continue;
    if (Math.abs(poles[i].im) < 1e-10) {
      // Real pole -> 1st order section
      sections.push(createFirstOrder(poles[i]));
      used[i] = true;
    } else {
      // Find conjugate
      for (let j = i + 1; j < poles.length; j++) {
        if (used[j]) continue;
        if (
          Math.abs(poles[i].re - poles[j].re) < 1e-10 &&
          Math.abs(poles[i].im + poles[j].im) < 1e-10
        ) {
          sections.push(createSecondOrder(poles[i], poles[j]));
          used[i] = true;
          used[j] = true;
          break;
        }
      }
      // If no conjugate found, treat as pair anyway
      if (!used[i]) {
        const conj: Complex = { re: poles[i].re, im: -poles[i].im };
        sections.push(createSecondOrder(poles[i], conj));
        used[i] = true;
      }
    }
  }

  return sections;
}

function createFirstOrder(pole: Complex): FirstOrderSection {
  // H(s) = wc / (s + wc) where wc = |pole.re|
  const wc = Math.max(Math.abs(pole.re), 1e-10);
  // RC lowpass: R*C = 1/wc
  // Choose C = 10nF, compute R
  const C = 10e-9;
  const R = 1 / (wc * C);
  return { type: "first-order", pole, gain: 1, R, C };
}

function createSecondOrder(p1: Complex, p2: Complex): SecondOrderSection {
  // For conjugate pair: s^2 + 2*sigma*s + (sigma^2 + omega^2)
  const sigma = Math.max(Math.abs(p1.re), 1e-10);
  const omega = Math.abs(p1.im);
  const w0 = Math.sqrt(sigma * sigma + omega * omega);
  const Q = w0 / (2 * sigma);

  // Sallen-Key equal-R design: R1=R2=R, compute C1,C2
  // w0 = 1/(R*sqrt(C1*C2)), Q = sqrt(C1*C2)/(C1+C2)*...
  // Simplified: choose R=10kΩ, then:
  const R = 10000;
  const C1 = 2 * Q / (w0 * R);
  const C2 = 1 / (2 * Q * w0 * R);

  return {
    type: "second-order",
    poles: [p1, p2],
    gain: 1,
    R1: R,
    R2: R,
    C1: Math.abs(C1),
    C2: Math.abs(C2),
  };
}
