import { Complex } from "../filters/types";

export type CircuitResponseType = "lowpass" | "highpass";

export interface FirstOrderSection {
  type: "first-order";
  responseType: CircuitResponseType;
  pole: Complex;
  gain: number;
  R: number;  // Ohms
  C: number;  // Farads
}

export interface SecondOrderSection {
  type: "second-order";
  responseType: CircuitResponseType;
  poles: [Complex, Complex];
  gain: number;
  // Sallen-Key component values
  R1: number;
  R2: number;
  C1: number;
  C2: number;
}

export type FilterSection = FirstOrderSection | SecondOrderSection;
