"use client";

interface ESP32GuideProps {
  fs: number;
}

export default function ESP32Guide({ fs }: ESP32GuideProps) {
  const nyquist = Math.round(fs / 2);

  return (
    <div className="rounded-lg bg-[var(--panel)] border border-[var(--border)] overflow-hidden">
      <div className="px-4 pt-3 pb-2">
        <h3 className="text-sm font-semibold text-[var(--text)]">
          ESP32 Implementation Guide
        </h3>
      </div>
      <div className="px-4 pb-4 space-y-2">

        {/* Section 1: Components */}
        <details className="group">
          <summary className="text-sm font-medium text-[var(--text)] cursor-pointer select-none list-none flex items-center gap-2">
            <span className="text-xs transition-transform group-open:rotate-90">&#9654;</span>
            Components Needed
          </summary>
          <div className="mt-2 text-xs text-[var(--text-secondary)] space-y-2 pl-5">
            <ul className="list-disc pl-4 space-y-1">
              <li>ESP32 dev board (e.g. ESP32-DevKitC)</li>
              <li>Breadboard + jumper wires</li>
              <li>2&times; 10k&Omega; resistors &mdash; input voltage divider (biases signal to 1.65V for 3.3V logic)</li>
              <li>1&times; 1&mu;F capacitor &mdash; AC coupling for input (blocks DC from signal source)</li>
            </ul>
            <p className="italic">
              No output RC filter needed &mdash; the ESP32 has a built-in 8-bit DAC on GPIO 25
              that outputs a true analog voltage (0&ndash;3.3V). Connect directly to your load.
            </p>
          </div>
        </details>

        {/* Section 2: Wiring */}
        <details className="group">
          <summary className="text-sm font-medium text-[var(--text)] cursor-pointer select-none list-none flex items-center gap-2">
            <span className="text-xs transition-transform group-open:rotate-90">&#9654;</span>
            Wiring Guide
          </summary>
          <div className="mt-2 text-xs text-[var(--text-secondary)] space-y-3 pl-5">
            <div>
              <p className="font-semibold text-[var(--text)] mb-1">Input Circuit (GPIO 34)</p>
              <p className="mb-1">
                The ESP32 ADC reads 0&ndash;3.3V. Bias the input to 1.65V with a voltage divider.
                GPIO 34 is an input-only pin on ADC1 (no conflict with Wi-Fi).
              </p>
              <pre className="text-[10px] leading-relaxed font-mono bg-[var(--bg-secondary)] rounded p-2 overflow-x-auto">
{`                   3.3V
                     │
                 10kΩ ┤
                     │
Signal ──┤├── 1μF ──┬── GPIO 34
                     │
                 10kΩ ┤
                     │
                    GND`}
              </pre>
              <p className="mt-1">
                The two 10k&Omega; resistors form a series voltage divider between 3.3V and GND,
                setting a 1.65V DC bias at the midpoint (GPIO 34).
                The 1&mu;F cap passes the AC signal while blocking any DC offset from the source.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)] mb-1">Output (GPIO 25 &mdash; DAC)</p>
              <p className="mb-1">
                GPIO 25 is the built-in 8-bit DAC output. No external filtering needed &mdash;
                connect directly to your load or measurement equipment.
              </p>
              <pre className="text-[10px] leading-relaxed font-mono bg-[var(--bg-secondary)] rounded p-2 overflow-x-auto">
{`GPIO 25 ── Output
                  (0 - 3.3V analog)`}
              </pre>
              <p className="mt-1">
                The DAC outputs a true analog voltage with 8-bit resolution (256 steps across 0&ndash;3.3V).
                For higher resolution output, consider an external I2S DAC.
              </p>
            </div>
          </div>
        </details>

        {/* Section 3: Verification */}
        <details className="group">
          <summary className="text-sm font-medium text-[var(--text)] cursor-pointer select-none list-none flex items-center gap-2">
            <span className="text-xs transition-transform group-open:rotate-90">&#9654;</span>
            Verification with Analog Discovery 2
          </summary>
          <div className="mt-2 text-xs text-[var(--text-secondary)] space-y-2 pl-5">
            <p className="font-semibold text-[var(--text)]">Connections</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>AD2 Wavegen 1 (W1) &rarr; ESP32 input (through the 1&mu;F coupling cap)</li>
              <li>AD2 Scope Ch1 (1+/1&minus;) &rarr; GPIO 34 (measures input after bias)</li>
              <li>AD2 Scope Ch2 (2+/2&minus;) &rarr; GPIO 25 (DAC output &mdash; direct connection)</li>
              <li>Connect all grounds together (AD2 GND, ESP32 GND)</li>
            </ul>
            <p className="font-semibold text-[var(--text)] mt-2">WaveForms &mdash; Network Analyzer</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Open <strong>Network Analyzer</strong> in WaveForms</li>
              <li>Set <strong>Wavegen</strong> as the stimulus (W1), amplitude ~750mV (stay within 3.3V range)</li>
              <li>Set <strong>Channel 1</strong> as Reference, <strong>Channel 2</strong> as the measured response</li>
              <li>Set frequency sweep range: start at ~1 Hz, stop at {nyquist.toLocaleString()} Hz (Nyquist = F<sub>s</sub>/2)</li>
              <li>Use logarithmic sweep with 100&ndash;200 points for a smooth Bode plot</li>
              <li>Click <strong>Start</strong> to measure the magnitude and phase response</li>
              <li>Compare the measured Bode plot with the designed digital frequency response above</li>
            </ol>
            <p className="italic mt-1">
              Tip: The ESP32 ADC has known nonlinearity near 0V and 3.3V.
              Keep your input signal amplitude moderate (~1.5Vpp centered at 1.65V) for best accuracy.
            </p>
          </div>
        </details>

      </div>
    </div>
  );
}
