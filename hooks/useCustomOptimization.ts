"use client";
import { useState, useCallback } from "react";
import { MagnitudeTarget, CustomFitResult, customFit } from "@/lib/optimization/customFit";
import { hzToRad } from "@/lib/utils/units";

const defaultTargets: MagnitudeTarget[] = [
  { frequency: hzToRad(100), magnitude: 1.0, weight: 1 },
  { frequency: hzToRad(500), magnitude: 0.7, weight: 1 },
  { frequency: hzToRad(2000), magnitude: 0.1, weight: 1 },
];

export function useCustomOptimization() {
  const [targets, setTargets] = useState<MagnitudeTarget[]>(defaultTargets);
  const [numPoles, setNumPoles] = useState(4);
  const [result, setResult] = useState<CustomFitResult | null>(null);
  const [running, setRunning] = useState(false);

  const run = useCallback(() => {
    if (targets.length < 2) return;
    setRunning(true);
    // Run async to not block UI
    setTimeout(() => {
      try {
        const res = customFit(targets, numPoles);
        setResult(res);
      } catch (e) {
        console.error("Optimization error:", e);
      }
      setRunning(false);
    }, 10);
  }, [targets, numPoles]);

  return { targets, setTargets, numPoles, setNumPoles, result, running, run };
}
