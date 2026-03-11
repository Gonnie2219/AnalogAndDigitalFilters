"use client";
import { useState, useMemo } from "react";
import { FilterSpec, FilterResult } from "@/lib/filters/types";
import { designFilter } from "@/lib/filters/design";

const defaultSpec: FilterSpec = {
  filterType: "butterworth",
  responseType: "lowpass",
  order: 3,
  cutoffFreq: 1000, // rad/s
  ripple: 1,
  stopbandAtten: 40,
};

export function useFilterDesign() {
  const [spec, setSpec] = useState<FilterSpec>(defaultSpec);

  const result: FilterResult | null = useMemo(() => {
    try {
      return designFilter(spec);
    } catch (e) {
      console.error("Filter design error:", e);
      return null;
    }
  }, [spec]);

  const updateSpec = (partial: Partial<FilterSpec>) => {
    setSpec((prev) => ({ ...prev, ...partial }));
  };

  const resetSpec = () => setSpec(defaultSpec);

  return { spec, result, updateSpec, resetSpec };
}
