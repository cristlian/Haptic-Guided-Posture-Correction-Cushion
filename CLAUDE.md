# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**SenseGrid** — a haptic-guided posture correction cushion prototype for the BIOE60007 HCARD coursework. The system reads 8 FSR (Force Sensitive Resistor) channels from a smart cushion via Arduino, streams values over serial, and renders a real-time pressure heatmap dashboard in the browser.

## Key files

| File | Purpose |
|---|---|
| `dashboard-test.html` | Live dashboard — opens in browser, connects to Arduino via Web Serial API |
| `dashboard-rendered.html` | Static reference render of the intended dashboard design |
| `Motor.ino` | Arduino sketch (upload via Arduino IDE to the board) |
| `_analyze_topview.py` | One-off helper to identify FSR zone positions from `smart-cushion-top-view.png` |

## Hardware & serial protocol

- **Arduino** reads 8 FSR channels via a CD74HC4067 16-channel MUX (channels 8–15, truth table hardcoded in `Motor.ino`)
- **Serial baud rate:** 9600
- **Serial frame format:** `val0,val1,val2,val3,val4,val5,val6,val7\n` (8 comma-separated integers, 0–1023, one per loop iteration at ~30 ms)
- **Motor output:** PCA9685 PWM driver over I²C (SDA=A4, SCL=A5), PWM frequency 1000 Hz, 12-bit resolution (0–4095), motor index matches FSR index

## Dashboard architecture (`dashboard-test.html`)

The dashboard is a single self-contained HTML file with all CSS and JS inline. It uses the **Web Serial API** (Chrome/Edge only, requires HTTPS or localhost).

### FSR signal pipeline

Raw serial frame → `remapRawFsrFrame` → `normalizeLiveFsrFrame` → `spreadLiveFsrFrame` → render

1. **Remap** (`remapRawFsrFrame`): reorders the 8 raw Arduino channels to logical cushion zones using `LIVE_FSR_RAW_TO_ZONE_MAP = [7, 6, 5, 4, 3, 2, 1, 0]` (index = zone, value = Arduino channel).
2. **Normalize** (`normalizeLiveFsrFrame`): adaptive floor/ceiling calibration over a rolling 48-frame history (`LIVE_FSR_HISTORY_SIZE = 48`); idle detection (thresholds: `LIVE_FSR_EMPTY_MAX = 12`, `LIVE_FSR_EMPTY_SUM = 36`) zeroes output when all sensors are near baseline; gain exponent `0.58`.
3. **Spread** (`spreadLiveFsrFrame`): applies `LIVE_FSR_BLEED_MATRIX` to simulate physical pressure diffusion between adjacent zones.

The entire pipeline is exposed on `globalThis.__SENSEGRID_LIVE_FSR__` for external testing/inspection, and includes a self-test suite (`runLiveFsrSelfTests`) that validates 17 assertions covering remapping, normalisation, spread, and idle-reset behaviour.

### Rendering

- SVG-based cushion heatmap with 8 named zones mapped to SVG `<path>` elements
- Left sidebar: zone cards with sparklines and expandable detail stats
- Right sidebar: posture detection card (top) → motor status panel → threshold slider → session stats
- Bottom: collapsible pressure timeline drawer (last 30s, 8 zone lines)
- Pressure colour scale: 6 levels (`--pressure-0` through `--pressure-5`), warm palette

### Motor layout (8 motors)

| ID | Type | Zone | SVG position |
|---|---|---|---|
| C0 | Cylindrical | Back-Right | cx=90, cy=60 |
| S0 | Square | Back-Center | cx=250, cy=60 |
| C2 | Cylindrical | Back-Left | cx=410, cy=60 |
| C1 | Cylindrical | Hip-Right | cx=90, cy=175 |
| S1 | Square | Thigh-Center | cx=250, cy=175 |
| C3 | Cylindrical | Hip-Left | cx=410, cy=175 |
| S2 | Square | Front-Right | cx=130, cy=310 |
| S3 | Square | Front-Left | cx=370, cy=310 |

`MOTOR_LABELS = ['C0','S0','C2','C1','S1','C3','S2','S3']` — index 0–7 matches SVG `data-motor` attributes and `state.motors` array. Motor buttons in the sidebar are **read-only status indicators** (no manual override).

### Posture prediction pipeline

Serial frame → FSR pipeline → `predictPosture` → `updatePostureSmoothed` → motor routing → UI

1. **`predictPosture(fsrValues)`**: normalises FSR [0–1023] to [0–1], computes cosine similarity against 6 prototype unit vectors (`POSTURE_UNIT_VECS`), returns ranked candidates with confidence flags.
2. **`updatePostureSmoothed(postureState, rawResult)`**: applies EMA smoothing (α=0.30) on per-posture scores and enforces 5-tick label persistence before switching the displayed posture.
3. **Motor routing**: on confident prediction (`score > 0.78`, margin `> 0.18`), looks up `MOTOR_ROUTING[postureId]` to get the 8-motor bitmask and reason string. Motors are all-off when uncertain or seat is empty.

### Posture prototypes (6 classes)

Defined in `POSTURE_PROTOTYPES`. Zone vector order: `[Back-R, Back-L, Hip-R, Thigh-R, Thigh-L, Hip-L, Front-R, Front-L]`.

| ID | Label |
|---|---|
| `lean_left` | Lean Left |
| `lean_right` | Lean Right |
| `lean_forward` | Lean Forward |
| `lean_back` | Lean Back |
| `cross_right` | Cross-leg · R (right leg over left) |
| `cross_left` | Cross-leg · L (left leg over right) |

Confidence thresholds: `POSTURE_CONF_HIGH = 0.78`, `POSTURE_CONF_LOW = 0.62`, `POSTURE_MARGIN_HIGH = 0.18`, `POSTURE_MARGIN_LOW = 0.10`. Derived from inter-prototype cosine similarity analysis (hardest pair `lean_left`↔`lean_back` ≈ 0.74).

### Default mode

The dashboard starts in **hardware-ready** mode — no data flows until the user clicks **Connect Hardware**. Clicking again (when connected) disconnects. Mock/simulation mode has been fully removed.

## Running the dashboard

1. Upload `Motor.ino` to the Arduino using the Arduino IDE (select the correct COM port and board).
2. Open `dashboard-test.html` directly in Chrome or Edge (no build step, no server needed for local use).
3. Click **Connect** → select the Arduino serial port → data streams immediately.

## Python helper

`_analyze_topview.py` requires Pillow (`pip install pillow` or use the `.venv`). Run from the repo root:

```bash
python _analyze_topview.py
```

The `.venv` contains Pillow and supporting packages (starlette, uvicorn, httpx, pydantic — likely from a separate tooling context; only Pillow is needed for this script).
