"use client";
import { FilterSpec, FilterResult } from "@/lib/filters/types";
import FilterSpecPanel from "@/components/panels/FilterSpecPanel";
import TransferFunctionDisplay from "@/components/panels/TransferFunctionDisplay";
import FrequencyResponsePlots from "@/components/panels/FrequencyResponsePlots";
import PoleZeroMap from "@/components/panels/PoleZeroMap";
import SummaryCard from "@/components/panels/SummaryCard";
import AxisControls, { AxisRanges, SuggestedDefaults } from "@/components/panels/AxisControls";
import { radToHz } from "@/lib/utils/units";
import { useMemo, useState } from "react";

interface StandardTabProps {
  spec: FilterSpec;
  result: FilterResult | null;
  onChange: (partial: Partial<FilterSpec>) => void;
  onReset: () => void;
  dark: boolean;
}

const defaultRanges: AxisRanges = {
  freqMin: "", freqMax: "",
  magMin: "", magMax: "",
  phaseMin: "", phaseMax: "",
};

export default function StandardTab({ spec, result, onChange, onReset, dark }: StandardTabProps) {
  const [useHz, setUseHz] = useState(true);
  const [magDb, setMagDb] = useState(true);
  const [ranges, setRanges] = useState<AxisRanges>(defaultRanges);

  const suggestedDefaults = useMemo<SuggestedDefaults>(() => {
    const fc = useHz ? radToHz(spec.cutoffFreq) : spec.cutoffFreq;
    return {
      freqMin: fc / 100,
      freqMax: fc * 100,
      magMin: magDb ? -100 : 0,
      magMax: magDb ? 5 : 1.5,
      phaseMin: -270,
      phaseMax: 0,
    };
  }, [spec.cutoffFreq, useHz, magDb]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 p-4">
      {/* Left sidebar */}
      <div className="space-y-4">
        <FilterSpecPanel spec={spec} onChange={onChange} onReset={onReset} />
        {result && <SummaryCard result={result} />}
        {result && (
          <PoleZeroMap poles={result.tf.poles} zeros={result.tf.zeros} dark={dark} />
        )}
      </div>

      {/* Main content */}
      <div className="space-y-4">
        {result && <TransferFunctionDisplay tf={result.tf} />}
        <AxisControls useHz={useHz} onToggleHz={() => setUseHz(!useHz)} magDb={magDb} onToggleMagDb={() => setMagDb(!magDb)} ranges={ranges} onRangeChange={setRanges} suggestedDefaults={suggestedDefaults} />
        {result && (
          <FrequencyResponsePlots response={result.response} dark={dark} useHz={useHz} magDb={magDb} ranges={ranges} />
        )}
        {!result && (
          <div className="flex items-center justify-center h-64 text-[var(--text-secondary)]">
            Error computing filter. Check parameters.
          </div>
        )}
      </div>
    </div>
  );
}
