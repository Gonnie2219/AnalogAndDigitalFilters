export interface Complex {
  re: number;
  im: number;
}

export type FilterType = "butterworth" | "chebyshev1" | "chebyshev2" | "bessel" | "elliptic";
export type ResponseType = "lowpass" | "highpass" | "bandpass" | "bandstop";

export interface FilterSpec {
  filterType: FilterType;
  responseType: ResponseType;
  order: number;
  cutoffFreq: number;       // rad/s
  cutoffFreq2?: number;     // rad/s (for bandpass/bandstop)
  ripple?: number;           // dB (Chebyshev I, Elliptic passband ripple)
  stopbandAtten?: number;    // dB (Chebyshev II, Elliptic stopband attenuation)
}

export interface Polynomial {
  coeffs: number[];  // [a0, a1, a2, ...] where p(s) = a0 + a1*s + a2*s^2 + ...
}

export interface TransferFunction {
  zeros: Complex[];
  poles: Complex[];
  gain: number;
  numerator: Polynomial;
  denominator: Polynomial;
}

export interface FrequencyResponse {
  frequencies: number[];     // rad/s
  magnitude: number[];       // linear
  magnitudeDb: number[];     // dB
  phase: number[];           // degrees
}

export interface FilterResult {
  spec: FilterSpec;
  tf: TransferFunction;
  response: FrequencyResponse;
}
