import { Complex } from "./types";

/**
 * Bessel filter prototype poles (hardcoded for orders 1-10).
 * These are the standard normalized Bessel-Thomson poles.
 */
const BESSEL_POLES: Record<number, Complex[]> = {
  1: [{ re: -1.0, im: 0.0 }],
  2: [
    { re: -1.1016, im: 0.6368 },
    { re: -1.1016, im: -0.6368 },
  ],
  3: [
    { re: -1.0474, im: 0.9992 },
    { re: -1.0474, im: -0.9992 },
    { re: -1.3226, im: 0.0 },
  ],
  4: [
    { re: -0.9953, im: 1.2571 },
    { re: -0.9953, im: -1.2571 },
    { re: -1.3700, im: 0.4102 },
    { re: -1.3700, im: -0.4102 },
  ],
  5: [
    { re: -0.9576, im: 1.4711 },
    { re: -0.9576, im: -1.4711 },
    { re: -1.3809, im: 0.7179 },
    { re: -1.3809, im: -0.7179 },
    { re: -1.5069, im: 0.0 },
  ],
  6: [
    { re: -0.9306, im: 1.6618 },
    { re: -0.9306, im: -1.6618 },
    { re: -1.3819, im: 0.9714 },
    { re: -1.3819, im: -0.9714 },
    { re: -1.5735, im: 0.3213 },
    { re: -1.5735, im: -0.3213 },
  ],
  7: [
    { re: -0.9098, im: 1.8364 },
    { re: -0.9098, im: -1.8364 },
    { re: -1.3789, im: 1.1915 },
    { re: -1.3789, im: -1.1915 },
    { re: -1.6120, im: 0.5896 },
    { re: -1.6120, im: -0.5896 },
    { re: -1.6843, im: 0.0 },
  ],
  8: [
    { re: -0.8928, im: 1.9983 },
    { re: -0.8928, im: -1.9983 },
    { re: -1.3738, im: 1.3884 },
    { re: -1.3738, im: -1.3884 },
    { re: -1.6369, im: 0.8224 },
    { re: -1.6369, im: -0.8224 },
    { re: -1.7572, im: 0.2737 },
    { re: -1.7572, im: -0.2737 },
  ],
  9: [
    { re: -0.8783, im: 2.1509 },
    { re: -0.8783, im: -2.1509 },
    { re: -1.3675, im: 1.5677 },
    { re: -1.3675, im: -1.5677 },
    { re: -1.6523, im: 1.0313 },
    { re: -1.6523, im: -1.0313 },
    { re: -1.8071, im: 0.5126 },
    { re: -1.8071, im: -0.5126 },
    { re: -1.8566, im: 0.0 },
  ],
  10: [
    { re: -0.8657, im: 2.2962 },
    { re: -0.8657, im: -2.2962 },
    { re: -1.3607, im: 1.7335 },
    { re: -1.3607, im: -1.7335 },
    { re: -1.6616, im: 1.2219 },
    { re: -1.6616, im: -1.2219 },
    { re: -1.8460, im: 0.7272 },
    { re: -1.8460, im: -0.7272 },
    { re: -1.9270, im: 0.2418 },
    { re: -1.9270, im: -0.2418 },
  ],
};

export function besselPoles(order: number): Complex[] {
  if (order < 1 || order > 10) {
    throw new Error("Bessel filter order must be between 1 and 10");
  }
  return BESSEL_POLES[order].map((p) => ({ ...p }));
}

export function besselZeros(): Complex[] {
  return [];
}

export function besselGain(poles: Complex[]): number {
  let g = 1;
  for (const p of poles) {
    g *= Math.sqrt(p.re * p.re + p.im * p.im);
  }
  return g;
}
