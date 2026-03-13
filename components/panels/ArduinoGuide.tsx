"use client";

interface ArduinoGuideProps {
  fs: number;
}

export default function ArduinoGuide({ fs }: ArduinoGuideProps) {
  const nyquist = Math.round(fs / 2);

  return (
    <div className="rounded-lg bg-[var(--panel)] border border-[var(--border)] overflow-hidden">
      <div className="px-4 pt-3 pb-2">
        <h3 className="text-sm font-semibold text-[var(--text)]">
          Arduino Implementation Guide
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
              <li>Arduino Uno (ATmega328P)</li>
              <li>Breadboard + jumper wires</li>
              <li>2&times; 10k&Omega; resistors &mdash; input voltage divider (biases signal to 2.5V)</li>
              <li>1&times; 1&mu;F capacitor &mdash; AC coupling for input (blocks DC from signal source)</li>
              <li>1&times; 1k&Omega; resistor + 1&times; 10nF capacitor &mdash; output RC low-pass filter (f<sub>c</sub> &asymp; 15.9 kHz)</li>
            </ul>
            <p className="italic">
              The output RC filter smooths the 62.5 kHz PWM into an analog voltage.
              Its cutoff should be well above your signal bandwidth but well below 62.5 kHz.
              Adjust R and C values for your application.
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
              <p className="font-semibold text-[var(--text)] mb-1">Input Circuit (Pin A0)</p>
              <p className="mb-1">
                The Arduino ADC reads 0&ndash;5V. To handle AC signals (centered at 0V), bias the input to 2.5V with a voltage divider and use a coupling capacitor to block DC from the source.
              </p>
              <pre className="text-[10px] leading-relaxed font-mono bg-[var(--bg-secondary)] rounded p-2 overflow-x-auto">
{`                    5V
                     │
                 10kΩ ┤
                     │
Signal ──┤├── 1μF ──┬── A0
                     │
                 10kΩ ┤
                     │
                    GND`}
              </pre>
              <p className="mt-1">
                The two 10k&Omega; resistors form a series voltage divider between 5V and GND,
                setting a 2.5V DC bias at the midpoint (A0).
                The 1&mu;F cap passes the AC signal while blocking any DC offset from the source.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)] mb-1">Output Circuit (Pin 9)</p>
              <p className="mb-1">
                Pin 9 outputs a 62.5 kHz PWM signal. A simple RC low-pass filter converts it to a smooth analog voltage.
              </p>
              <pre className="text-[10px] leading-relaxed font-mono bg-[var(--bg-secondary)] rounded p-2 overflow-x-auto">
{`Pin 9 ── 1kΩ ──┬── Output
                │
              10nF
                │
               GND`}
              </pre>
              <p className="mt-1">
                This gives f<sub>c</sub> &asymp; 15.9 kHz, which passes audio signals while filtering
                the PWM carrier. For lower bandwidth signals, increase C (e.g. 100nF for f<sub>c</sub> &asymp; 1.6 kHz).
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
              <li>AD2 Wavegen 1 (W1) &rarr; Arduino input (through the 1&mu;F coupling cap)</li>
              <li>AD2 Scope Ch1 (1+/1&minus;) &rarr; Arduino A0 (measures input after bias)</li>
              <li>AD2 Scope Ch2 (2+/2&minus;) &rarr; output junction (after the RC filter)</li>
              <li>Connect all grounds together (AD2 GND, Arduino GND)</li>
            </ul>
            <p className="font-semibold text-[var(--text)] mt-2">WaveForms &mdash; Network Analyzer</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Open <strong>Network Analyzer</strong> in WaveForms</li>
              <li>Set <strong>Wavegen</strong> as the stimulus (W1), amplitude ~500mV</li>
              <li>Set <strong>Channel 1</strong> as Reference, <strong>Channel 2</strong> as the measured response</li>
              <li>Set frequency sweep range: start at ~1 Hz, stop at {nyquist.toLocaleString()} Hz (Nyquist = F<sub>s</sub>/2)</li>
              <li>Use logarithmic sweep with 100&ndash;200 points for a smooth Bode plot</li>
              <li>Click <strong>Start</strong> to measure the magnitude and phase response</li>
              <li>Compare the measured Bode plot with the designed digital frequency response above</li>
            </ol>
            <p className="italic mt-1">
              Tip: If the measured response deviates at high frequencies, check that your
              output RC filter isn&apos;t attenuating the signal in the passband.
              Keep the RC cutoff well above your filter&apos;s passband edge.
            </p>
          </div>
        </details>

      </div>
    </div>
  );
}
