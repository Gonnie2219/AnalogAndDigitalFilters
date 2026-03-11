import { Complex, FilterSpec } from "./types";
import { butterworthPoles, butterworthZeros, butterworthGain } from "./butterworth";
import { chebyshev1Poles, chebyshev1Zeros, chebyshev1Gain } from "./chebyshev1";
import { chebyshev2Poles, chebyshev2Zeros, chebyshev2Gain } from "./chebyshev2";
import { besselPoles, besselZeros, besselGain } from "./bessel";
import { ellipticPoles, ellipticZeros, ellipticGain } from "./elliptic";

export interface PrototypeResult {
  poles: Complex[];
  zeros: Complex[];
  gain: number;
}

/** Get normalized (cutoff = 1 rad/s) lowpass prototype */
export function getPrototype(spec: FilterSpec): PrototypeResult {
  switch (spec.filterType) {
    case "butterworth": {
      const poles = butterworthPoles(spec.order);
      return { poles, zeros: butterworthZeros(), gain: butterworthGain(poles) };
    }
    case "chebyshev1": {
      const ripple = spec.ripple ?? 1;
      const poles = chebyshev1Poles(spec.order, ripple);
      return { poles, zeros: chebyshev1Zeros(), gain: chebyshev1Gain(poles, spec.order, ripple) };
    }
    case "chebyshev2": {
      const atten = spec.stopbandAtten ?? 40;
      const poles = chebyshev2Poles(spec.order, atten);
      const zeros = chebyshev2Zeros(spec.order);
      return { poles, zeros, gain: chebyshev2Gain(poles, zeros) };
    }
    case "bessel": {
      const poles = besselPoles(spec.order);
      return { poles, zeros: besselZeros(), gain: besselGain(poles) };
    }
    case "elliptic": {
      const ripple = spec.ripple ?? 1;
      const atten = spec.stopbandAtten ?? 40;
      const poles = ellipticPoles(spec.order, ripple, atten);
      const zeros = ellipticZeros(spec.order, ripple, atten);
      return { poles, zeros, gain: ellipticGain(poles, zeros, spec.order, ripple) };
    }
  }
}
