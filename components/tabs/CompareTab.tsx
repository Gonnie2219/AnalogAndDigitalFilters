"use client";
import { useState, useMemo } from "react";
import { FilterSpec, FilterResult } from "@/lib/filters/types";
import { designFilter } from "@/lib/filters/design";
import FilterSpecPanel from "@/components/panels/FilterSpecPanel";
import FrequencyResponsePlots from "@/components/panels/FrequencyResponsePlots";
import PoleZeroMap from "@/components/panels/PoleZeroMap";
import AxisControls, { AxisRanges, SuggestedDefaults } from "@/components/panels/AxisControls";
import { radToHz } from "@/lib/utils/units";

interface CompareTabProps {
  dark: boolean;
}

const defaultSpecA: FilterSpec = {
  filterType: "butterworth",
  responseType: "lowpass",
  order: 3,
  cutoffFreq: 1000,
  ripple: 1,
  stopbandAtten: 40,
};

const defaultSpecB: FilterSpec = {
  filterType: "chebyshev1",
  responseType: "lowpass",
  order: 3,
  cutoffFreq: 1000,
  ripple: 1,
  stopbandAtten: 40,
};

const defaultRanges: AxisRanges = {
  freqMin: "", freqMax: "",
  magMin: "", magMax: "",
  phaseMin: "", phaseMax: "",
};

function safeDesign(spec: FilterSpec): FilterResult | null {
  try {
    return designFilter(spec);
  } catch {
    return null;
  }
}

export default function CompareTab({ dark }: CompareTabProps) {
  const [specA, setSpecA] = useState<FilterSpec>(defaultSpecA);
  const [specB, setSpecB] = useState<FilterSpec>(defaultSpecB);
  const [useHz, setUseHz] = useState(true);
  const [magDb, setMagDb] = useState(true);
  const [ranges, setRanges] = useState<AxisRanges>(defaultRanges);

  const resultA = useMemo(() => safeDesign(specA), [specA]);
  const resultB = useMemo(() => safeDesign(specB), [specB]);

  const updateA = (partial: Partial<FilterSpec>) => setSpecA((prev) => ({ ...prev, ...partial }));
  const updateB = (partial: Partial<FilterSpec>) => setSpecB((prev) => ({ ...prev, ...partial }));
  const resetA = () => setSpecA(defaultSpecA);
  const resetB = () => setSpecB(defaultSpecB);

  const suggestedDefaults = useMemo<SuggestedDefaults>(() => {
    const fcA = useHz ? radToHz(specA.cutoffFreq) : specA.cutoffFreq;
    const fcB = useHz ? radToHz(specB.cutoffFreq) : specB.cutoffFreq;
    const fc = Math.max(fcA, fcB);
    return {
      freqMin: fc / 100,
      freqMax: fc * 100,
      magMin: magDb ? -100 : 0,
      magMax: magDb ? 5 : 1.5,
      phaseMin: -270,
      phaseMax: 0,
    };
  }, [specA.cutoffFreq, specB.cutoffFreq, useHz, magDb]);

  const labelA = `A: ${specA.filterType.charAt(0).toUpperCase() + specA.filterType.slice(1)} n=${specA.order}`;
  const labelB = `B: ${specB.filterType.charAt(0).toUpperCase() + specB.filterType.slice(1)} n=${specB.order}`;

  return (
    <div className="p-4 space-y-4">
      {/* Two filter spec panels side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
            <span className="text-sm font-semibold text-[var(--text)]">Filter A</span>
          </div>
          <FilterSpecPanel spec={specA} onChange={updateA} onReset={resetA} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
            <span className="text-sm font-semibold text-[var(--text)]">Filter B</span>
          </div>
          <FilterSpecPanel spec={specB} onChange={updateB} onReset={resetB} />
        </div>
      </div>

      {/* Shared axis controls */}
      <AxisControls
        useHz={useHz}
        onToggleHz={() => setUseHz(!useHz)}
        magDb={magDb}
        onToggleMagDb={() => setMagDb(!magDb)}
        ranges={ranges}
        onRangeChange={setRanges}
        suggestedDefaults={suggestedDefaults}
      />

      {/* Overlaid frequency response plots */}
      {resultA ? (
        <FrequencyResponsePlots
          response={resultA.response}
          dark={dark}
          useHz={useHz}
          magDb={magDb}
          ranges={ranges}
          compareResponse={resultB?.response}
          primaryLabel={labelA}
          compareLabel={labelB}
        />
      ) : resultB ? (
        <FrequencyResponsePlots
          response={resultB.response}
          dark={dark}
          useHz={useHz}
          magDb={magDb}
          ranges={ranges}
          primaryLabel={labelB}
        />
      ) : (
        <div className="flex items-center justify-center h-64 text-[var(--text-secondary)]">
          Error computing both filters. Check parameters.
        </div>
      )}

      {/* Overlaid pole-zero map */}
      {resultA && (
        <PoleZeroMap
          poles={resultA.tf.poles}
          zeros={resultA.tf.zeros}
          dark={dark}
          comparePoles={resultB?.tf.poles}
          compareZeros={resultB?.tf.zeros}
          primaryLabel={labelA}
          compareLabel={labelB}
        />
      )}
    </div>
  );
}
