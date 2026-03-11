import { FilterSpec, FilterResult, TransferFunction } from "./types";
import { getPrototype } from "./prototypes";
import { transformPoles } from "./transformations";
import { computeResponse, logspace } from "./response";
import { polyFromRoots } from "./polynomial";

/** Top-level design function: spec -> complete result */
export function designFilter(spec: FilterSpec): FilterResult {
  if (spec.cutoffFreq <= 0) throw new Error("Cutoff frequency must be positive");
  if (spec.order < 1) throw new Error("Order must be at least 1");

  // 1. Get normalized lowpass prototype
  const proto = getPrototype(spec);

  // 2. Apply frequency transformation
  const { poles, zeros, gain } = transformPoles(
    proto.poles,
    proto.zeros,
    proto.gain,
    spec.responseType,
    spec.cutoffFreq,
    spec.cutoffFreq2
  );

  // 3. Build transfer function polynomials
  const numerator = polyFromRoots(zeros);
  const denominator = polyFromRoots(poles);

  // Scale numerator by gain
  const scaledNum = {
    coeffs: numerator.coeffs.map((c) => c * gain),
  };

  const tf: TransferFunction = {
    zeros,
    poles,
    gain,
    numerator: scaledNum,
    denominator,
  };

  // 4. Compute frequency response
  const fMin = spec.cutoffFreq / 100;
  const fMax = spec.cutoffFreq * 100;
  const frequencies = logspace(fMin, fMax, 500);
  const response = computeResponse(zeros, poles, gain, frequencies);

  return { spec, tf, response };
}
