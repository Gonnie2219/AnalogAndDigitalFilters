import { Complex } from "./types";

export function complex(re: number, im: number): Complex {
  return { re, im };
}

export function cAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

export function cSub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}

export function cMul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

export function cDiv(a: Complex, b: Complex): Complex {
  const denom = b.re * b.re + b.im * b.im;
  return {
    re: (a.re * b.re + a.im * b.im) / denom,
    im: (a.im * b.re - a.re * b.im) / denom,
  };
}

export function cAbs(a: Complex): number {
  return Math.sqrt(a.re * a.re + a.im * a.im);
}

export function cArg(a: Complex): number {
  return Math.atan2(a.im, a.re);
}

export function cConj(a: Complex): Complex {
  return { re: a.re, im: -a.im };
}

export function cNeg(a: Complex): Complex {
  return { re: -a.re, im: -a.im };
}

export function cScale(a: Complex, s: number): Complex {
  return { re: a.re * s, im: a.im * s };
}

export function cRecip(a: Complex): Complex {
  const denom = a.re * a.re + a.im * a.im;
  return { re: a.re / denom, im: -a.im / denom };
}

export function cExp(a: Complex): Complex {
  const er = Math.exp(a.re);
  return { re: er * Math.cos(a.im), im: er * Math.sin(a.im) };
}

export function cSqrt(a: Complex): Complex {
  const r = cAbs(a);
  const theta = cArg(a);
  const sr = Math.sqrt(r);
  return { re: sr * Math.cos(theta / 2), im: sr * Math.sin(theta / 2) };
}

/** Evaluate product: gain * prod(s - z_i) / prod(s - p_i) */
export function evalTransferFunction(
  s: Complex,
  zeros: Complex[],
  poles: Complex[],
  gain: number
): Complex {
  let num: Complex = { re: gain, im: 0 };
  for (const z of zeros) {
    num = cMul(num, cSub(s, z));
  }
  let den: Complex = { re: 1, im: 0 };
  for (const p of poles) {
    den = cMul(den, cSub(s, p));
  }
  return cDiv(num, den);
}
