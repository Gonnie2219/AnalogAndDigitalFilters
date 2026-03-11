import { Complex } from "../filters/types";

export interface FirstOrderSection {
  type: "first-order";
  pole: Complex;
  gain: number;
  R: number;  // Ohms
  C: number;  // Farads
}

export interface SecondOrderSection {
  type: "second-order";
  poles: [Complex, Complex];
  gain: number;
  // Sallen-Key component values
  R1: number;
  R2: number;
  C1: number;
  C2: number;
}

export type FilterSection = FirstOrderSection | SecondOrderSection;
