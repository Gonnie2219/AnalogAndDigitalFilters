import { Complex, ResponseType } from "./types";
import { cDiv, cScale, cAdd, cSub, cMul, cSqrt, complex } from "./complex";

/** Apply frequency transformation to poles and zeros.
 *  Transforms a normalized LP prototype to the target response type at the given cutoff(s). */
export function transformPoles(
  poles: Complex[],
  zeros: Complex[],
  gain: number,
  responseType: ResponseType,
  wc: number,
  wc2?: number
): { poles: Complex[]; zeros: Complex[]; gain: number } {
  switch (responseType) {
    case "lowpass":
      return lpToLp(poles, zeros, gain, wc);
    case "highpass":
      return lpToHp(poles, zeros, gain, wc);
    case "bandpass":
      return lpToBp(poles, zeros, gain, wc, wc2 ?? wc * 2);
    case "bandstop":
      return lpToBs(poles, zeros, gain, wc, wc2 ?? wc * 2);
  }
}

/** LP to LP: s -> s/wc (scale poles and zeros by wc) */
function lpToLp(
  poles: Complex[], zeros: Complex[], gain: number, wc: number
): { poles: Complex[]; zeros: Complex[]; gain: number } {
  const newPoles = poles.map((p) => cScale(p, wc));
  const newZeros = zeros.map((z) => cScale(z, wc));
  // Adjust gain for frequency scaling
  const extraZeros = poles.length - zeros.length;
  const newGain = gain * Math.pow(wc, extraZeros);
  return { poles: newPoles, zeros: newZeros, gain: newGain };
}

/** LP to HP: s -> wc/s (replace each pole p with wc/p, add zeros at origin) */
function lpToHp(
  poles: Complex[], zeros: Complex[], gain: number, wc: number
): { poles: Complex[]; zeros: Complex[]; gain: number } {
  const newPoles = poles.map((p) => cDiv(complex(wc, 0), p));
  const newZeros = zeros.map((z) => cDiv(complex(wc, 0), z));
  // Add zeros at the origin for each excess pole
  const extraZeros = poles.length - zeros.length;
  for (let i = 0; i < extraZeros; i++) {
    newZeros.push(complex(0, 0));
  }
  // Compute gain: H_hp(0) should have proper DC behavior
  // gain = prod(-p_i) / prod(-z_i) * original_gain_factor
  let prodPoles = 1;
  for (const p of poles) prodPoles *= Math.sqrt(p.re * p.re + p.im * p.im);
  let prodZeros = 1;
  for (const z of zeros) prodZeros *= Math.sqrt(z.re * z.re + z.im * z.im);
  const newGain = gain * (prodZeros || 1) / prodPoles;
  return { poles: newPoles, zeros: newZeros, gain: newGain };
}

/** LP to BP: s -> (s^2 + w0^2) / (BW*s) */
function lpToBp(
  poles: Complex[], zeros: Complex[], gain: number, wl: number, wh: number
): { poles: Complex[]; zeros: Complex[]; gain: number } {
  const w0 = Math.sqrt(wl * wh);
  const bw = wh - wl;
  const newPoles: Complex[] = [];
  const newZeros: Complex[] = [];

  for (const p of poles) {
    // s = (bw*p ± sqrt((bw*p)^2 - 4*w0^2)) / 2
    const bp = cScale(p, bw);
    const disc = cSub(cMul(bp, bp), complex(4 * w0 * w0, 0));
    const sqrtDisc = cSqrt(disc);
    newPoles.push(cScale(cAdd(bp, sqrtDisc), 0.5));
    newPoles.push(cScale(cSub(bp, sqrtDisc), 0.5));
  }

  for (const z of zeros) {
    const bz = cScale(z, bw);
    const disc = cSub(cMul(bz, bz), complex(4 * w0 * w0, 0));
    const sqrtDisc = cSqrt(disc);
    newZeros.push(cScale(cAdd(bz, sqrtDisc), 0.5));
    newZeros.push(cScale(cSub(bz, sqrtDisc), 0.5));
  }

  // Add zeros at origin for bandpass
  const extraZeros = poles.length - zeros.length;
  for (let i = 0; i < extraZeros; i++) {
    newZeros.push(complex(0, 0));
  }

  const newGain = gain * Math.pow(bw, extraZeros);
  return { poles: newPoles, zeros: newZeros, gain: newGain };
}

/** LP to BS: s -> BW*s / (s^2 + w0^2) */
function lpToBs(
  poles: Complex[], zeros: Complex[], gain: number, wl: number, wh: number
): { poles: Complex[]; zeros: Complex[]; gain: number } {
  const w0 = Math.sqrt(wl * wh);
  const bw = wh - wl;
  const newPoles: Complex[] = [];
  const newZeros: Complex[] = [];

  for (const p of poles) {
    // s = (bw/p ± sqrt((bw/p)^2 - 4*w0^2)) / 2
    const bp = cDiv(complex(bw, 0), p);
    const disc = cSub(cMul(bp, bp), complex(4 * w0 * w0, 0));
    const sqrtDisc = cSqrt(disc);
    newPoles.push(cScale(cAdd(bp, sqrtDisc), 0.5));
    newPoles.push(cScale(cSub(bp, sqrtDisc), 0.5));
  }

  for (const z of zeros) {
    const bz = cDiv(complex(bw, 0), z);
    const disc = cSub(cMul(bz, bz), complex(4 * w0 * w0, 0));
    const sqrtDisc = cSqrt(disc);
    newZeros.push(cScale(cAdd(bz, sqrtDisc), 0.5));
    newZeros.push(cScale(cSub(bz, sqrtDisc), 0.5));
  }

  // Add conjugate zeros at ±jw0 for bandstop
  const extraZeros = poles.length - zeros.length;
  for (let i = 0; i < extraZeros; i++) {
    newZeros.push(complex(0, w0));
    newZeros.push(complex(0, -w0));
  }

  // Gain adjustment
  let prodPoles = 1;
  for (const p of poles) prodPoles *= Math.sqrt(p.re * p.re + p.im * p.im);
  let prodZeros = 1;
  for (const z of zeros) prodZeros *= Math.sqrt(z.re * z.re + z.im * z.im);
  const newGain = gain * (prodZeros || 1) / prodPoles;
  return { poles: newPoles, zeros: newZeros, gain: newGain };
}
