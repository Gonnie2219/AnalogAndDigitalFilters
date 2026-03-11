import { Complex, FrequencyResponse } from "./types";
import { evalTransferFunction, cAbs, cArg } from "./complex";

/** Generate logarithmically spaced frequency vector */
export function logspace(start: number, stop: number, n: number): number[] {
  const logStart = Math.log10(start);
  const logStop = Math.log10(stop);
  const step = (logStop - logStart) / (n - 1);
  return Array.from({ length: n }, (_, i) => Math.pow(10, logStart + i * step));
}

/** Compute frequency response from poles, zeros, and gain */
export function computeResponse(
  zeros: Complex[],
  poles: Complex[],
  gain: number,
  frequencies: number[]
): FrequencyResponse {
  const magnitude: number[] = [];
  const magnitudeDb: number[] = [];
  const phase: number[] = [];

  for (const w of frequencies) {
    const s: Complex = { re: 0, im: w };
    const H = evalTransferFunction(s, zeros, poles, gain);
    const mag = cAbs(H);
    magnitude.push(mag);
    magnitudeDb.push(20 * Math.log10(Math.max(mag, 1e-20)));
    phase.push((cArg(H) * 180) / Math.PI);
  }

  // Unwrap phase
  unwrapPhase(phase);

  return { frequencies, magnitude, magnitudeDb, phase };
}

/** Unwrap phase to avoid discontinuities at ±180° */
function unwrapPhase(phase: number[]): void {
  for (let i = 1; i < phase.length; i++) {
    let diff = phase[i] - phase[i - 1];
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    phase[i] = phase[i - 1] + diff;
  }
}
