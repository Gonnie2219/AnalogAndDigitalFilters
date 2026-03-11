import { Complex } from "./types";

/** Chebyshev Type I prototype poles */
export function chebyshev1Poles(order: number, rippleDb: number): Complex[] {
  const eps = Math.sqrt(Math.pow(10, rippleDb / 10) - 1);
  const mu = (1 / order) * Math.asinh(1 / eps);
  const poles: Complex[] = [];
  for (let k = 0; k < order; k++) {
    const theta = (Math.PI * (2 * k + 1)) / (2 * order);
    poles.push({
      re: -Math.sinh(mu) * Math.sin(theta),
      im: Math.cosh(mu) * Math.cos(theta),
    });
  }
  return poles;
}

export function chebyshev1Zeros(): Complex[] {
  return [];
}

/** Gain: for odd order H(0)=1, for even order H(0)= 1/sqrt(1+eps^2)
 *  We compute gain = prod(|poles|) / (eps * 2^(n-1)) for even,
 *  or gain = prod(|poles|) for odd normalized so H(0) = 1 */
export function chebyshev1Gain(poles: Complex[], order: number, rippleDb: number): number {
  let prodPoles = 1;
  for (const p of poles) {
    prodPoles *= Math.sqrt(p.re * p.re + p.im * p.im);
  }
  if (order % 2 === 0) {
    const eps = Math.sqrt(Math.pow(10, rippleDb / 10) - 1);
    return prodPoles / Math.sqrt(1 + eps * eps);
  }
  return prodPoles;
}
