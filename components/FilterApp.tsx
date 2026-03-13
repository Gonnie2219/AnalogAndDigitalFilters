"use client";
import { useState } from "react";
import TabBar from "@/components/ui/TabBar";
import ThemeToggle from "@/components/ui/ThemeToggle";
import StandardTab from "@/components/tabs/StandardTab";
import CustomTab from "@/components/tabs/CustomTab";
import CircuitTab from "@/components/tabs/CircuitTab";
import DigitalTab from "@/components/tabs/DigitalTab";
import CompareTab from "@/components/tabs/CompareTab";
import { useFilterDesign } from "@/hooks/useFilterDesign";
import { useCustomOptimization } from "@/hooks/useCustomOptimization";
import { useTheme } from "@/hooks/useTheme";
import { TransferFunction, FrequencyResponse } from "@/lib/filters/types";

const TABS = ["Standard", "Custom", "Std Circuit", "Custom Circuit", "Digital", "Compare"];

/** Estimate -3dB cutoff from a frequency response (rad/s) */
function estimateCutoff(response: FrequencyResponse, fallback: number): number {
  const idx = response.magnitudeDb.findIndex((m) => m < -3);
  if (idx > 0) {
    const f1 = Math.log10(response.frequencies[idx - 1]);
    const f2 = Math.log10(response.frequencies[idx]);
    const m1 = response.magnitudeDb[idx - 1];
    const m2 = response.magnitudeDb[idx];
    const t = (-3 - m1) / (m2 - m1);
    return Math.pow(10, f1 + t * (f2 - f1));
  }
  return fallback;
}

export default function FilterApp() {
  const [activeTab, setActiveTab] = useState(0);
  const { dark, toggle } = useTheme();
  const { spec, result, updateSpec, resetSpec } = useFilterDesign();
  const custom = useCustomOptimization();

  // Explicit source selector for the Digital tab
  const [digitalSource, setDigitalSource] = useState<"standard" | "custom">("standard");

  const handleTabChange = (tab: number) => {
    // Auto-switch digital source when visiting a design tab
    if (tab === 0) setDigitalSource("standard");
    if (tab === 1) setDigitalSource("custom");
    setActiveTab(tab);
  };

  // Active analog TF for Circuit and Digital tabs
  const activeTf: TransferFunction | null =
    digitalSource === "custom" && custom.result
      ? custom.result.tf
      : result?.tf ?? null;

  // Prewarp frequency for Digital tab (cutoff for Standard, estimated for Custom)
  const prewarpFreq: number =
    digitalSource === "custom" && custom.result
      ? estimateCutoff(custom.result.response, spec.cutoffFreq)
      : spec.cutoffFreq;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <h1 className="text-lg font-bold text-[var(--text)]">Analog & Digital Filter Designer</h1>
        <ThemeToggle dark={dark} onToggle={toggle} />
      </header>
      <TabBar tabs={TABS} active={activeTab} onChange={handleTabChange} />
      <main>
        {activeTab === 0 && (
          <StandardTab
            spec={spec}
            result={result}
            onChange={updateSpec}
            onReset={resetSpec}
            dark={dark}
          />
        )}
        {activeTab === 1 && (
          <CustomTab
            dark={dark}
            targets={custom.targets}
            onTargetsChange={custom.setTargets}
            numPoles={custom.numPoles}
            onNumPolesChange={custom.setNumPoles}
            responseType={custom.responseType}
            onResponseTypeChange={custom.setResponseType}
            result={custom.result}
            running={custom.running}
            error={custom.error}
            onRun={custom.run}
          />
        )}
        {activeTab === 2 && (
          <CircuitTab
            tf={result?.tf ?? null}
            responseType={spec.responseType}
          />
        )}
        {activeTab === 3 && (
          <CircuitTab
            tf={custom.result?.tf ?? null}
            responseType={custom.responseType}
          />
        )}
        {activeTab === 4 && (
          <DigitalTab
            analogTf={activeTf}
            defaultPrewarp={prewarpFreq}
            dark={dark}
            sourceLabel={digitalSource === "custom" && custom.result ? "Custom" : "Standard"}
            onToggleSource={() => setDigitalSource(s => s === "standard" ? "custom" : "standard")}
            hasStandardResult={!!result}
            hasCustomResult={!!custom.result}
          />
        )}
        {activeTab === 5 && (
          <CompareTab dark={dark} />
        )}
      </main>
    </div>
  );
}
