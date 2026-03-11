import { Complex } from "./types";

export interface TimeParams {
  fs: number;
  nSamples: number;
}

export interface TimeResponse {
  time: number[];
  impulse: number[];
  step: number[];
}

/** Automatically choose simulation rate and duration from pole positions. */
export function autoTimeParams(
  poles: Complex[],
  isDigital: boolean,
  digitalFs?: number
): TimeParams {
  if (isDigital && digitalFs) {
    // Digital: duration from slowest pole (closest to unit circle)
    const maxRadius = Math.max(...poles.map((p) => Math.sqrt(p.re * p.re + p.im * p.im)), 0.5);
    // Time constant in samples: -1 / ln(r)
    const tauSamples = maxRadius > 0.999 ? 2000 : -1 / Math.log(maxRadius);
    const nSamples = Math.min(2048, Math.max(50, Math.round(5 * tauSamples)));
    return { fs: digitalFs, nSamples };
  }

  // Analog: work from s-plane poles
  const absReals = poles
    .map((p) => Math.abs(p.re))
    .filter((r) => r > 1e-10);
  const maxPoleMag = Math.max(
    ...poles.map((p) => Math.sqrt(p.re * p.re + p.im * p.im)),
    1
  );

  // Simulation rate: at least 20× the fastest pole frequency
  const fs = 20 * maxPoleMag;

  // Duration: 5 time constants of the slowest pole
  const minAbsReal = absReals.length > 0 ? Math.min(...absReals) : maxPoleMag;
  const duration = 5 / minAbsReal;

  const nSamples = Math.min(2048, Math.max(200, Math.round(fs * duration)));
  return { fs, nSamples };
}

/** Run Direct Form I difference equation for both impulse and step inputs. */
export function computeTimeResponse(
  b: number[],
  a: number[],
  fs: number,
  nSamples: number
): TimeResponse {
  const time: number[] = [];
  const impulse: number[] = [];
  const step: number[] = [];

  const N = Math.max(b.length, a.length);

  // Impulse response
  const xImp = new Float64Array(N);
  const yImp = new Float64Array(N);
  // Step response
  const xStep = new Float64Array(N);
  const yStep = new Float64Array(N);

  for (let n = 0; n < nSamples; n++) {
    time.push(n / fs);

    // Shift input/output buffers
    for (let j = N - 1; j > 0; j--) {
      xImp[j] = xImp[j - 1];
      yImp[j] = yImp[j - 1];
      xStep[j] = xStep[j - 1];
      yStep[j] = yStep[j - 1];
    }
    xImp[0] = n === 0 ? 1 : 0;
    xStep[0] = 1;

    // y[n] = sum(b[k]*x[n-k]) - sum(a[k]*y[n-k]) for k>=1
    let yI = 0;
    let yS = 0;
    for (let k = 0; k < b.length; k++) {
      yI += b[k] * xImp[k];
      yS += b[k] * xStep[k];
    }
    for (let k = 1; k < a.length; k++) {
      yI -= a[k] * yImp[k];
      yS -= a[k] * yStep[k];
    }

    yImp[0] = yI;
    yStep[0] = yS;
    impulse.push(yI);
    step.push(yS);
  }

  return { time, impulse, step };
}
