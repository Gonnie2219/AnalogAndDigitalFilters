import { Complex, TransferFunction } from "../filters/types";
import { FilterSection, FirstOrderSection, SecondOrderSection, CircuitResponseType } from "./types";

/** Split transfer function into cascaded 1st and 2nd order sections */
export function factorize(tf: TransferFunction, responseType: CircuitResponseType = "lowpass"): FilterSection[] {
  const poles = [...tf.poles];
  const sections: FilterSection[] = [];
  const used = new Array(poles.length).fill(false);

  // Pair conjugate poles
  for (let i = 0; i < poles.length; i++) {
    if (used[i]) continue;
    if (Math.abs(poles[i].im) < 1e-10) {
      // Real pole -> 1st order section
      sections.push(createFirstOrder(poles[i], responseType));
      used[i] = true;
    } else {
      // Find conjugate
      for (let j = i + 1; j < poles.length; j++) {
        if (used[j]) continue;
        if (
          Math.abs(poles[i].re - poles[j].re) < 1e-10 &&
          Math.abs(poles[i].im + poles[j].im) < 1e-10
        ) {
          sections.push(createSecondOrder(poles[i], poles[j], responseType));
          used[i] = true;
          used[j] = true;
          break;
        }
      }
      // If no conjugate found, treat as pair anyway
      if (!used[i]) {
        const conj: Complex = { re: poles[i].re, im: -poles[i].im };
        sections.push(createSecondOrder(poles[i], conj, responseType));
        used[i] = true;
      }
    }
  }

  return sections;
}

function createFirstOrder(pole: Complex, responseType: CircuitResponseType): FirstOrderSection {
  // H(s) = wc / (s + wc) where wc = |pole.re|
  const wc = Math.max(Math.abs(pole.re), 1e-10);
  // RC = 1/wc — same values for LP and HP, just swapped positions
  const C = 10e-9;
  const R = 1 / (wc * C);
  return { type: "first-order", responseType, pole, gain: 1, R, C };
}

function createSecondOrder(p1: Complex, p2: Complex, responseType: CircuitResponseType): SecondOrderSection {
  const sigma = Math.max(Math.abs(p1.re), 1e-10);
  const omega = Math.abs(p1.im);
  const w0 = Math.sqrt(sigma * sigma + omega * omega);
  const Q = w0 / (2 * sigma);

  let R1: number, R2: number, C1: number, C2: number;

  if (responseType === "highpass") {
    // Equal-C design: C1=C2=C, R1=1/(2Q·w0·C), R2=2Q/(w0·C)
    const C = 10e-9;
    C1 = C;
    C2 = C;
    R1 = 1 / (2 * Q * w0 * C);
    R2 = (2 * Q) / (w0 * C);
  } else {
    // Equal-R design: R1=R2=R, C1=2Q/(w0·R), C2=1/(2Q·w0·R)
    const R = 10000;
    R1 = R;
    R2 = R;
    C1 = 2 * Q / (w0 * R);
    C2 = 1 / (2 * Q * w0 * R);
  }

  return {
    type: "second-order",
    responseType,
    poles: [p1, p2],
    gain: 1,
    R1,
    R2,
    C1: Math.abs(C1),
    C2: Math.abs(C2),
  };
}
