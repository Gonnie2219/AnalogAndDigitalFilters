import { Complex, TransferFunction } from "./types";
import { cDiv } from "./complex";
import { polyFromRoots } from "./polynomial";

export interface DigitalTransferFunction {
  zeros: Complex[];
  poles: Complex[];
  gain: number;
  b: number[];  // numerator coefficients [b0, b1, ...] in z^{-k} powers
  a: number[];  // denominator coefficients [1, a1, a2, ...] in z^{-k} powers
  fs: number;
}

export interface DigitalFrequencyResponse {
  omega: number[];        // normalized frequency 0..pi
  frequencies: number[];  // Hz (0..Fs/2)
  magnitude: number[];
  magnitudeDb: number[];
  phase: number[];        // degrees
}

/** Map an s-plane point to z-plane via bilinear transform: z = (c + s) / (c - s) */
function mapStoZ(s: Complex, c: number): Complex {
  return cDiv({ re: c + s.re, im: s.im }, { re: c - s.re, im: -s.im });
}

/** Bilinear transform with frequency prewarping.
 *  Converts analog H(s) to digital H(z) at sampling rate fs.
 *  prewarpFreq (rad/s) controls where the frequency mapping is exact. */
export function bilinearTransform(
  tf: TransferFunction,
  fs: number,
  prewarpFreq: number
): DigitalTransferFunction {
  // Prewarped bilinear constant: c = wc / tan(wc / (2*Fs))
  const c = prewarpFreq / Math.tan(prewarpFreq / (2 * fs));

  // Map analog poles and zeros to z-domain
  const digitalPoles = tf.poles.map((p) => mapStoZ(p, c));
  const digitalZeros = tf.zeros.map((z) => mapStoZ(z, c));

  // Extra zeros at z = -1 for each order difference (N_poles - N_zeros)
  const extra = tf.poles.length - tf.zeros.length;
  for (let i = 0; i < extra; i++) {
    digitalZeros.push({ re: -1, im: 0 });
  }

  // Digital gain: K_d = K * prod|c - z_k| / prod|c - p_k|
  // (product over conjugate pairs is real and positive)
  let Kd = tf.gain;
  for (const z of tf.zeros) {
    Kd *= Math.sqrt((c - z.re) * (c - z.re) + z.im * z.im);
  }
  for (const p of tf.poles) {
    Kd /= Math.sqrt((c - p.re) * (c - p.re) + p.im * p.im);
  }

  // Build polynomials from digital roots (ascending powers of z)
  const numPoly = polyFromRoots(digitalZeros);
  const denPoly = polyFromRoots(digitalPoles);

  const N = denPoly.coeffs.length - 1;
  const denLeading = denPoly.coeffs[N];

  // Convert to z^{-k} form: reverse coefficients and normalize
  const b: number[] = [];
  const a: number[] = [];
  for (let k = 0; k <= N; k++) {
    const numIdx = numPoly.coeffs.length - 1 - k;
    b.push(((numIdx >= 0 ? numPoly.coeffs[numIdx] : 0) * Kd) / denLeading);
    a.push(denPoly.coeffs[N - k] / denLeading);
  }

  return { zeros: digitalZeros, poles: digitalPoles, gain: Kd, b, a, fs };
}

/** Evaluate digital frequency response H(e^{jw}) for w = 0 to just below pi */
export function computeDigitalResponse(
  b: number[],
  a: number[],
  fs: number,
  nPoints: number = 512
): DigitalFrequencyResponse {
  const omega: number[] = [];
  const frequencies: number[] = [];
  const magnitude: number[] = [];
  const magnitudeDb: number[] = [];
  const phase: number[] = [];

  for (let i = 0; i < nPoints; i++) {
    // Exclude w=pi exactly to avoid numerical artifacts at z=-1
    const w = (Math.PI * i) / nPoints;
    omega.push(w);
    frequencies.push((w * fs) / (2 * Math.PI));

    // H(e^{jw}) = sum(b_k * e^{-jwk}) / sum(a_k * e^{-jwk})
    let numRe = 0,
      numIm = 0;
    for (let k = 0; k < b.length; k++) {
      numRe += b[k] * Math.cos(-w * k);
      numIm += b[k] * Math.sin(-w * k);
    }
    let denRe = 0,
      denIm = 0;
    for (let k = 0; k < a.length; k++) {
      denRe += a[k] * Math.cos(-w * k);
      denIm += a[k] * Math.sin(-w * k);
    }

    const denom = denRe * denRe + denIm * denIm;
    const hRe = (numRe * denRe + numIm * denIm) / denom;
    const hIm = (numIm * denRe - numRe * denIm) / denom;

    const mag = Math.sqrt(hRe * hRe + hIm * hIm);
    magnitude.push(mag);
    magnitudeDb.push(20 * Math.log10(Math.max(mag, 1e-20)));
    phase.push((Math.atan2(hIm, hRe) * 180) / Math.PI);
  }

  // Unwrap phase
  for (let i = 1; i < phase.length; i++) {
    let diff = phase[i] - phase[i - 1];
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    phase[i] = phase[i - 1] + diff;
  }

  return { omega, frequencies, magnitude, magnitudeDb, phase };
}

/** Generate a complete Arduino sketch with timer ISR, ADC, filter, and PWM output */
export function generateCCode(b: number[], a: number[], fs: number): string {
  const N = b.length - 1;
  const F_CPU = 16000000;

  // Timer2 prescaler selection (8-bit: OCR 0-255)
  const t2Prescalers = [
    { value: 1, csBits: "0b001" },
    { value: 8, csBits: "0b010" },
    { value: 32, csBits: "0b011" },
    { value: 64, csBits: "0b100" },
    { value: 128, csBits: "0b101" },
    { value: 256, csBits: "0b110" },
    { value: 1024, csBits: "0b111" },
  ];
  let t2Prescaler = t2Prescalers[t2Prescalers.length - 1];
  let t2OcrValue = 255;
  for (const p of t2Prescalers) {
    const ocr = Math.round(F_CPU / (p.value * fs)) - 1;
    if (ocr >= 1 && ocr <= 255) {
      t2Prescaler = p;
      t2OcrValue = ocr;
      break;
    }
  }
  const actualFs = F_CPU / (t2Prescaler.value * (t2OcrValue + 1));
  const fsError = Math.abs(actualFs - fs) / fs * 100;

  const lines: string[] = [];

  lines.push(`// =============================================================`);
  lines.push(`// Digital Filter - Complete Arduino Sketch`);
  lines.push(`// Direct Form II Transposed implementation`);
  lines.push(`// Sampling frequency: ${fs} Hz (actual: ${actualFs.toFixed(1)} Hz)`);
  lines.push(`// Filter order: ${N}`);
  lines.push(`// =============================================================`);
  if (fsError > 0.1) {
    lines.push(`// NOTE: Timer2 (8-bit) cannot produce exactly ${fs} Hz.`);
    lines.push(`//       Actual Fs = ${actualFs.toFixed(2)} Hz (${fsError.toFixed(2)}% error)`);
  }
  if (fs > 10000) {
    lines.push(`//`);
    lines.push(`// WARNING: Fs > 10 kHz may be too fast for Arduino Uno (16 MHz).`);
    lines.push(`//          analogRead() takes ~100us, limiting throughput to ~10 kHz.`);
    lines.push(`//          Consider using Arduino Due, Teensy, or ESP32.`);
  }
  lines.push(``);
  lines.push(`#include <avr/interrupt.h>`);
  lines.push(``);
  lines.push(`#define FILTER_ORDER ${N}`);
  lines.push(`#define ADC_PIN A0`);
  lines.push(`#define PWM_PIN 9   // Timer1 OC1A (pin 9) for PWM output`);
  lines.push(``);

  // Coefficients
  lines.push(`// Filter coefficients`);
  lines.push(`const float b[FILTER_ORDER + 1] = {${b.map(fmtCFloat).join(", ")}};`);
  lines.push(`const float a[FILTER_ORDER + 1] = {${a.map(fmtCFloat).join(", ")}};`);
  lines.push(``);
  lines.push(`float w[FILTER_ORDER] = {0};  // state variables`);
  lines.push(`volatile bool sampleReady = false;`);
  lines.push(``);

  // Filter function
  lines.push(`// Direct Form II Transposed filter`);
  lines.push(`float filter(float x) {`);
  lines.push(`  float y = b[0] * x + w[0];`);
  if (N > 1) {
    lines.push(`  for (int i = 0; i < FILTER_ORDER - 1; i++) {`);
    lines.push(`    w[i] = b[i + 1] * x - a[i + 1] * y + w[i + 1];`);
    lines.push(`  }`);
  }
  lines.push(`  w[FILTER_ORDER - 1] = b[FILTER_ORDER] * x - a[FILTER_ORDER] * y;`);
  lines.push(`  return y;`);
  lines.push(`}`);
  lines.push(``);

  // Timer2 ISR — just sets a flag (no slow analogRead inside ISR)
  lines.push(`// Timer2 Compare Match ISR - sets flag at Fs`);
  lines.push(`ISR(TIMER2_COMPA_vect) {`);
  lines.push(`  sampleReady = true;`);
  lines.push(`}`);
  lines.push(``);

  // setup()
  lines.push(`void setup() {`);
  lines.push(`  pinMode(PWM_PIN, OUTPUT);`);
  lines.push(``);
  lines.push(`  // --- Timer1: Fast PWM, 8-bit (pin 9) for analog output ---`);
  lines.push(`  TCCR1A = _BV(COM1A1) | _BV(WGM10);  // Non-inverting PWM, 8-bit`);
  lines.push(`  TCCR1B = _BV(WGM12) | _BV(CS10);     // Fast PWM, no prescaler (62.5 kHz)`);
  lines.push(`  OCR1A = 128;  // 50% initial duty`);
  lines.push(``);
  lines.push(`  // --- Timer2: CTC mode for sampling at ${fs} Hz ---`);
  lines.push(`  TCCR2A = _BV(WGM21);                  // CTC mode`);
  lines.push(`  TCCR2B = ${t2Prescaler.csBits};${` `.repeat(Math.max(1, 24 - t2Prescaler.csBits.length))}// prescaler = ${t2Prescaler.value}`);
  lines.push(`  OCR2A = ${t2OcrValue};${` `.repeat(Math.max(1, 26 - String(t2OcrValue).length))}// -> ${actualFs.toFixed(1)} Hz`);
  lines.push(`  TIMSK2 = _BV(OCIE2A);                 // Enable compare match interrupt`);
  lines.push(``);
  lines.push(`  sei();  // Enable global interrupts`);
  lines.push(`}`);
  lines.push(``);

  // loop()
  lines.push(`void loop() {`);
  lines.push(`  if (sampleReady) {`);
  lines.push(`    sampleReady = false;`);
  lines.push(``);
  lines.push(`    // Read ADC and convert (0-1023) to float (-1.0 to +1.0)`);
  lines.push(`    float input = analogRead(ADC_PIN) / 512.0f - 1.0f;`);
  lines.push(``);
  lines.push(`    // Apply filter`);
  lines.push(`    float output = filter(input);`);
  lines.push(``);
  lines.push(`    // Convert back to PWM range (0-255)`);
  lines.push(`    int pwmVal = constrain((int)((output + 1.0f) * 127.5f), 0, 255);`);
  lines.push(`    OCR1A = pwmVal;`);
  lines.push(`  }`);
  lines.push(`}`);

  return lines.join("\n");
}

function fmtCFloat(v: number): string {
  if (Math.abs(v) < 1e-20) return "0.0f";
  // Use enough precision to maintain filter accuracy
  const s = v.toPrecision(8).replace(/0+$/, "").replace(/\.$/, ".0");
  return s + "f";
}
