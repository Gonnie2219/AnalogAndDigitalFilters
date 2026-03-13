"use client";
import { useState, useCallback, useRef } from "react";
import { MagnitudeTarget, CustomFitResult, customFit } from "@/lib/optimization/customFit";
import { ResponseType } from "@/lib/filters/types";
import { hzToRad } from "@/lib/utils/units";

const defaultTargets: MagnitudeTarget[] = [
  { frequency: hzToRad(100), magnitude: 1.0, weight: 1 },
  { frequency: hzToRad(500), magnitude: 0.7, weight: 1 },
  { frequency: hzToRad(2000), magnitude: 0.1, weight: 1 },
];

export function useCustomOptimization() {
  const [targets, setTargets] = useState<MagnitudeTarget[]>(defaultTargets);
  const [numPoles, setNumPoles] = useState(4);
  const [responseType, setResponseType] = useState<ResponseType>("lowpass");
  const [result, setResult] = useState<CustomFitResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const runningRef = useRef(false);

  const run = useCallback(() => {
    if (targets.length < 2 || runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    setError(null);
    // Run async to not block UI
    setTimeout(() => {
      try {
        const res = customFit(targets, numPoles, responseType);
        setResult(res);
      } catch (e) {
        console.error("Optimization error:", e);
        setResult(null);
        setError(e instanceof Error ? e.message : "Optimization failed");
      }
      setRunning(false);
      runningRef.current = false;
    }, 10);
  }, [targets, numPoles, responseType]);

  return { targets, setTargets, numPoles, setNumPoles, responseType, setResponseType, result, running, error, run };
}
