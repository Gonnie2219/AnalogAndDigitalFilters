import { Complex, TransferFunction, FrequencyResponse } from "../filters/types";
import { nelderMead } from "./nelderMead";
import { computeResponse, logspace } from "../filters/response";
import { polyFromRoots } from "../filters/polynomial";
import { cAbs, evalTransferFunction } from "../filters/complex";

export interface MagnitudeTarget {
  frequency: number; // rad/s
  magnitude: number; // linear
  weight: number;
}

export interface CustomFitResult {
  tf: TransferFunction;
  response: FrequencyResponse;
  error: number;
}

/** Fit a filter to custom magnitude targets.
 *  Parameterize poles as (-exp(x_i), y_i) to guarantee stability. */
export function customFit(
  targets: MagnitudeTarget[],
  numPoles: number
): CustomFitResult {
  if (targets.length === 0) {
    // No targets — return a trivial unity transfer function
    const tf: TransferFunction = {
      zeros: [], poles: [], gain: 1,
      numerator: { coeffs: [1] }, denominator: { coeffs: [1] },
    };
    const response = computeResponse([], [], 1, logspace(1, 1000, 500));
    return { tf, response, error: 0 };
  }

  // Each pole pair parameterized by 2 values: real part = -exp(x), imag part = y
  // For even numPoles, all are conjugate pairs
  // For odd, last one is real
  const nPairs = Math.floor(numPoles / 2);
  const hasReal = numPoles % 2 === 1;
  const nParams = nPairs * 2 + (hasReal ? 1 : 0);

  // Estimate cutoff frequency from targets for Butterworth initialization
  const sorted = [...targets].sort((a, b) => a.frequency - b.frequency);
  const dcMag = sorted[0].magnitude;
  const cutoffMag = dcMag * Math.SQRT1_2;

  let wc: number | undefined;
  // Interpolate -3dB point from target data
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].magnitude <= cutoffMag && sorted[i - 1].magnitude > cutoffMag) {
      const f1 = Math.log(sorted[i - 1].frequency);
      const f2 = Math.log(sorted[i].frequency);
      const m1 = sorted[i - 1].magnitude;
      const m2 = sorted[i].magnitude;
      const t = (cutoffMag - m1) / (m2 - m1);
      wc = Math.exp(f1 + t * (f2 - f1));
      break;
    }
  }
  if (wc === undefined) {
    // Fallback: geometric mean of target frequencies
    wc = Math.exp(sorted.reduce((s, t) => s + Math.log(t.frequency), 0) / sorted.length);
  }

  // Generate Butterworth poles at estimated cutoff for initialization
  const x0 = new Array(nParams);
  let pairIdx = 0;
  for (let k = 0; k < numPoles; k++) {
    const theta = Math.PI * (2 * k + numPoles + 1) / (2 * numPoles);
    const re = wc * Math.cos(theta);  // negative
    const im = wc * Math.sin(theta);

    if (Math.abs(im) < 1e-10 * wc) {
      // Real pole
      if (hasReal) {
        x0[nParams - 1] = Math.log(Math.abs(re));
      }
    } else if (im > 0) {
      // One half of conjugate pair
      x0[pairIdx * 2] = Math.log(Math.abs(re));
      x0[pairIdx * 2 + 1] = im;
      pairIdx++;
    }
  }

  function paramsToPoles(params: number[]): Complex[] {
    const poles: Complex[] = [];
    for (let i = 0; i < nPairs; i++) {
      const re = -Math.exp(params[i * 2]);
      const im = params[i * 2 + 1];
      poles.push({ re, im: Math.abs(im) });
      poles.push({ re, im: -Math.abs(im) });
    }
    if (hasReal) {
      poles.push({ re: -Math.exp(params[nParams - 1]), im: 0 });
    }
    return poles;
  }

  // Normalize gain so H(0) matches the lowest-frequency target's magnitude
  function objective(params: number[]): number {
    const poles = paramsToPoles(params);
    let prodPoleMag = 1;
    for (const p of poles) {
      prodPoleMag *= Math.sqrt(p.re * p.re + p.im * p.im);
    }
    const gain = dcMag * prodPoleMag; // H(0) = gain / prod(|p_i|) = dcMag

    let totalError = 0;
    for (const t of targets) {
      const s: Complex = { re: 0, im: t.frequency };
      const H = evalTransferFunction(s, [], poles, gain);
      const mag = cAbs(H);
      const diff = mag - t.magnitude;
      totalError += t.weight * diff * diff;
    }
    return totalError;
  }

  const bestParams = nelderMead(objective, x0, { maxIter: 5000 });
  const poles = paramsToPoles(bestParams);
  const zeros: Complex[] = [];

  let prodPoleMag = 1;
  for (const p of poles) {
    prodPoleMag *= Math.sqrt(p.re * p.re + p.im * p.im);
  }
  const gain = Math.max(dcMag * prodPoleMag, 1e-20);

  const numerator = polyFromRoots(zeros);
  const denominator = polyFromRoots(poles);
  const scaledNum = { coeffs: numerator.coeffs.map((c) => c * gain) };

  const tf: TransferFunction = { zeros, poles, gain, numerator: scaledNum, denominator };

  const fMin = Math.min(...targets.map((t) => t.frequency)) / 10;
  const fMax = Math.max(...targets.map((t) => t.frequency)) * 10;
  const response = computeResponse(zeros, poles, gain, logspace(fMin, fMax, 500));

  const error = objective(bestParams);

  return { tf, response, error };
}
