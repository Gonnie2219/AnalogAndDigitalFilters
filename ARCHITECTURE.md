# Analog & Digital Filter Designer - Architecture

## Overview
A client-side Next.js web app for designing analog filters (Butterworth, Chebyshev I/II, Bessel, Elliptic), converting them to digital filters via the bilinear transform, visualizing frequency responses and pole-zero maps, specifying custom magnitude targets via optimization, viewing circuit implementations, and generating Arduino/C code for digital filter implementation.

## Tech Stack
- **Next.js 16** (App Router, Turbopack), TypeScript, Tailwind CSS v4
- **Plotly.js** (`plotly.js-basic-dist-min` + `react-plotly.js`) for interactive plots
- **KaTeX** for LaTeX rendering of transfer functions
- **No backend** - all math runs client-side

## Project Structure

```
app/                          # Next.js App Router
  layout.tsx                  # HTML shell + metadata
  page.tsx                    # Renders FilterApp (client component)
  globals.css                 # Tailwind imports + CSS variables for theming

components/
  FilterApp.tsx               # Top-level state owner + tab router
  tabs/
    StandardTab.tsx           # Standard filter design UI
    CustomTab.tsx             # Custom magnitude specification UI
    CircuitTab.tsx            # Circuit implementation UI
    DigitalTab.tsx            # Digital filter (bilinear transform) UI
    CompareTab.tsx            # A vs B filter comparison with overlaid plots
  panels/
    FilterSpecPanel.tsx       # Filter type/order/cutoff inputs
    TransferFunctionDisplay.tsx  # KaTeX H(s) display
    FrequencyResponsePlots.tsx   # Magnitude + Phase + Group Delay Plotly plots (optional target point markers)
    PoleZeroMap.tsx           # s-plane pole/zero scatter plot
    MagnitudeTable.tsx        # Custom freq/mag target table
    SummaryCard.tsx           # Key filter specs card
    AxisControls.tsx          # Hz/rad toggle
  circuit/
    RCCircuit.tsx             # 1st order RC SVG diagram
    SallenKeyCircuit.tsx      # 2nd order Sallen-Key SVG diagram
    CircuitCascade.tsx        # Renders cascade of sections
  ui/
    TabBar.tsx                # Tab navigation
    ThemeToggle.tsx           # Dark/light mode toggle
    NumberInput.tsx           # Labeled number input
  plot/
    PlotlyWrapper.tsx         # Dynamic import (ssr: false) for Plotly

lib/
  filters/
    types.ts                  # Core types: FilterSpec, FilterResult, Complex, etc.
    complex.ts                # Complex number arithmetic
    polynomial.ts             # Polynomial operations (multiply, from roots, evaluate, LaTeX)
    butterworth.ts            # Butterworth prototype poles
    chebyshev1.ts             # Chebyshev Type I prototype
    chebyshev2.ts             # Chebyshev Type II prototype (poles + zeros)
    bessel.ts                 # Bessel prototype (hardcoded poles, orders 1-10)
    elliptic.ts               # Elliptic (Cauer) prototype via Jacobi elliptic functions
    prototypes.ts             # Dispatcher: spec -> prototype poles/zeros/gain
    transformations.ts        # LP -> HP/BP/BS frequency transformations
    response.ts               # H(jw) evaluation, logspace, phase unwrapping
    design.ts                 # Top-level orchestrator: spec -> FilterResult
    bilinear.ts               # Bilinear transform: H(s) -> H(z), digital response, C code gen
  optimization/
    nelderMead.ts             # Nelder-Mead simplex optimizer
    customFit.ts              # Custom magnitude fitting (stability-guaranteed parameterization)
  circuit/
    types.ts                  # FirstOrderSection, SecondOrderSection types
    factorize.ts              # Split transfer function into 1st/2nd order cascade
  utils/
    formatLatex.ts            # Transfer function to LaTeX, engineering notation
    units.ts                  # Hz <-> rad/s conversion

hooks/
  useFilterDesign.ts          # Standard tab: spec state + memoized design result
  useCustomOptimization.ts    # Custom tab: targets state + optimization runner
  useTheme.ts                 # Dark/light mode with localStorage persistence
```

## Data Flow

### Standard Tab
1. `useFilterDesign` holds `FilterSpec` state
2. On any spec change, `designFilter(spec)` runs (memoized):
   - `getPrototype(spec)` → normalized LP poles/zeros/gain
   - `transformPoles(...)` → frequency-transformed poles/zeros/gain
   - `polyFromRoots(...)` → numerator/denominator polynomials
   - `computeResponse(...)` → frequency response (mag, phase)
3. `FilterResult` is passed to all display components

### Custom Tab
1. `useCustomOptimization` holds magnitude targets + pole count
2. On "Optimize" click, `customFit(targets, numPoles)` runs:
   - Parameterizes poles as `(-exp(x), y)` for guaranteed stability
   - Nelder-Mead minimizes weighted magnitude error
3. Returns `CustomFitResult` with fitted transfer function + response

### Circuit Tabs (Std Circuit / Custom Circuit)
Two separate circuit tabs, each dedicated to one design source:
- **Std Circuit** (tab 2): wired to Standard tab's `result.tf` + `spec.responseType`
- **Custom Circuit** (tab 3): wired to Custom tab's `custom.result.tf`, shows local lowpass/highpass topology toggle

Both render the same `CircuitTab` component with different props:
1. `factorize(tf, responseType)` splits into 1st/2nd order sections
2. Each section computes component values (RC or Sallen-Key)

### Digital Tab
1. Takes active analog `TransferFunction` + estimated prewarp frequency
2. User sets sampling frequency Fs and prewarp frequency
3. `bilinearTransform(tf, fs, prewarpFreq)` converts H(s) to H(z):
   - Maps s-plane poles/zeros to z-plane via `z = (c+s)/(c-s)` where `c = wc/tan(wc/(2Fs))`
   - Adds extra zeros at z=-1 for order difference
   - Normalizes gain to match DC
4. `computeDigitalResponse(b, a, fs)` evaluates H(e^{jw}) for w = 0..pi
5. `generateCCode(b, a, fs)` produces Direct Form II Transposed implementation

### Compare Tab
1. Self-contained — manages its own two `FilterSpec` states (A and B)
2. Each spec calls `designFilter()` via `useMemo` independently
3. `FrequencyResponsePlots` renders both responses overlaid (blue vs orange traces)
4. `PoleZeroMap` renders both filters' poles/zeros overlaid with color-coded legend
5. Shared `AxisControls` for Hz/dB toggles and axis ranges

## Key Design Decisions
- **State management**: React state in FilterApp + prop drilling. No Redux needed.
- **Bessel poles**: Hardcoded lookup table (orders 1-10). Robust and standard.
- **Elliptic**: Jacobi elliptic functions via AGM/Landen transformation.
- **Frequency response**: Evaluated in pole-zero form (not polynomial) for numerical stability.
- **Custom optimization**: Nelder-Mead with stability guarantee via `-exp(x)` parameterization.
- **Plotly**: Uses `plotly.js-basic-dist-min` (~800KB vs 3MB full bundle), loaded via dynamic import (no SSR).
- **Theming**: CSS custom properties toggled by `.dark` class on `<html>`.
- **Bilinear transform**: Pole-zero mapping approach for numerical stability. Prewarping ensures the digital cutoff matches the analog cutoff exactly.
