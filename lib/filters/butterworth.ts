import { Complex } from "./types";

/** Butterworth prototype poles on the left-half unit semicircle */
export function butterworthPoles(order: number): Complex[] {
  const poles: Complex[] = [];
  for (let k = 0; k < order; k++) {
    const angle = (Math.PI * (2 * k + order + 1)) / (2 * order);
    poles.push({
      re: Math.cos(angle),
      im: Math.sin(angle),
    });
  }
  return poles;
}

/** Butterworth has no finite zeros */
export function butterworthZeros(): Complex[] {
  return [];
}

/** DC gain normalization: gain = 1/prod(|poles|) -> H(0) = 1 */
export function butterworthGain(poles: Complex[]): number {
  let g = 1;
  for (const p of poles) {
    g *= Math.sqrt(p.re * p.re + p.im * p.im);
  }
  return g;
}
