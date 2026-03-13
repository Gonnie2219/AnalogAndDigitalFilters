"use client";
import MagnitudeTable from "@/components/panels/MagnitudeTable";
import TransferFunctionDisplay from "@/components/panels/TransferFunctionDisplay";
import FrequencyResponsePlots from "@/components/panels/FrequencyResponsePlots";
import TimeResponsePlots from "@/components/panels/TimeResponsePlots";
import PoleZeroMap from "@/components/panels/PoleZeroMap";
import NumberInput from "@/components/ui/NumberInput";
import AxisControls, { AxisRanges, SuggestedDefaults } from "@/components/panels/AxisControls";
import { MagnitudeTarget, CustomFitResult } from "@/lib/optimization/customFit";
import { ResponseType } from "@/lib/filters/types";
import { radToHz } from "@/lib/utils/units";
import { bilinearTransform } from "@/lib/filters/bilinear";
import { autoTimeParams, computeTimeResponse } from "@/lib/filters/timeResponse";
import { useMemo, useState } from "react";

interface CustomTabProps {
  dark: boolean;
  targets: MagnitudeTarget[];
  onTargetsChange: (targets: MagnitudeTarget[]) => void;
  numPoles: number;
  onNumPolesChange: (n: number) => void;
  responseType: ResponseType;
  onResponseTypeChange: (t: ResponseType) => void;
  result: CustomFitResult | null;
  running: boolean;
  error: string | null;
  onRun: () => void;
}

const defaultRanges: AxisRanges = {
  freqMin: "", freqMax: "",
  magMin: "", magMax: "",
  phaseMin: "", phaseMax: "",
};

export default function CustomTab({
  dark, targets, onTargetsChange, numPoles, onNumPolesChange, responseType, onResponseTypeChange, result, running, error, onRun,
}: CustomTabProps) {
  const [useHz, setUseHz] = useState(true);
  const [magDb, setMagDb] = useState(true);
  const [ranges, setRanges] = useState<AxisRanges>(defaultRanges);

  const timeResp = useMemo(() => {
    if (!result) return null;
    try {
      const { fs, nSamples } = autoTimeParams(result.tf.poles, false);
      const maxPoleMag = Math.max(
        ...result.tf.poles.map((p) => Math.sqrt(p.re * p.re + p.im * p.im)), 1
      );
      const dtf = bilinearTransform(result.tf, fs, maxPoleMag);
      return computeTimeResponse(dtf.b, dtf.a, fs, nSamples);
    } catch { return null; }
  }, [result]);

  const suggestedDefaults = useMemo<SuggestedDefaults>(() => {
    if (targets.length === 0) return {};
    const freqs = targets.map((t) => useHz ? radToHz(t.frequency) : t.frequency);
    const fMin = Math.min(...freqs);
    const fMax = Math.max(...freqs);
    return {
      freqMin: fMin / 10,
      freqMax: fMax * 10,
      magMin: magDb ? -100 : 0,
      magMax: magDb ? 5 : 1.5,
      phaseMin: -270,
      phaseMax: 0,
    };
  }, [targets, useHz, magDb]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 p-4">
      <div className="space-y-4">
        <MagnitudeTable targets={targets} onChange={onTargetsChange} />
        <div className="p-4 rounded-lg bg-[var(--panel)] border border-[var(--border)] space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Response Type</label>
            <select
              value={responseType}
              onChange={(e) => onResponseTypeChange(e.target.value as ResponseType)}
              className="w-full px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text)] text-sm"
            >
              <option value="lowpass">Low-Pass</option>
              <option value="highpass">High-Pass</option>
              <option value="bandpass">Band-Pass</option>
              <option value="bandstop">Band-Stop</option>
            </select>
          </div>
          <NumberInput
            label="Number of Poles"
            value={numPoles}
            onChange={(v) => onNumPolesChange(Math.max(1, Math.min(10, Math.round(v))))}
            min={1}
            max={10}
            step={1}
          />
          <button
            onClick={onRun}
            disabled={running || targets.length < 2}
            className="w-full py-2 text-sm rounded bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50"
          >
            {running ? "Optimizing..." : "Optimize"}
          </button>
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
          {result && (
            <p className="text-xs text-[var(--text-secondary)]">
              Fit error: {result.error.toExponential(3)}
            </p>
          )}
        </div>
        {result && (
          <PoleZeroMap poles={result.tf.poles} zeros={result.tf.zeros} dark={dark} />
        )}
      </div>
      <div className="space-y-4">
        {result && <TransferFunctionDisplay tf={result.tf} />}
        <AxisControls
          useHz={useHz} onToggleHz={() => setUseHz(!useHz)}
          magDb={magDb} onToggleMagDb={() => setMagDb(!magDb)}
          ranges={ranges} onRangeChange={setRanges}
          suggestedDefaults={suggestedDefaults}
        />
        {result && (
          <FrequencyResponsePlots
            response={result.response} dark={dark}
            useHz={useHz} magDb={magDb} ranges={ranges}
            targetPoints={targets.map(t => ({ frequency: t.frequency, magnitude: t.magnitude }))}
          />
        )}
        {result && timeResp && (
          <TimeResponsePlots time={timeResp.time} impulse={timeResp.impulse} step={timeResp.step} dark={dark} />
        )}
        {!result && (
          <div className="flex items-center justify-center h-64 text-[var(--text-secondary)]">
            Add magnitude targets and click Optimize
          </div>
        )}
      </div>
    </div>
  );
}
