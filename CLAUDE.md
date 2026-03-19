# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**SenseGrid** is a haptic-guided posture correction cushion prototype for the BIOE60007 HCARD coursework. The system reads 8 FSR (Force Sensitive Resistor) channels from a smart cushion via Arduino, streams values over serial, and renders a real-time pressure heatmap dashboard in the browser.

## Key files

| File | Purpose |
|---|---|
| `dashboard-test.html` | Live dashboard. Contains all HTML, CSS, and JavaScript inline. Supports both hardware mode and a software-only demo session. |
| `dashboard-rendered.html` | Static reference render of the intended dashboard design. |
| `tests/dashboard-test.test.js` | Software-only regression suite for dashboard logic and posture-visualization behavior using synthetic serial and FSR data. |
| `tests/helpers/load-dashboard.js` | Node test harness that loads the inline dashboard script into a stubbed DOM for repeatable testing. |
| `Motor.ino` | Arduino sketch to upload with the Arduino IDE. |
| `_analyze_topview.py` | One-off helper used to identify FSR zone positions from `smart-cushion-top-view.png`. |

## Hardware and serial protocol

- **Arduino input path:** 8 FSR channels are read via a CD74HC4067 16-channel MUX using channels 8-15, with the truth table hardcoded in `Motor.ino`.
- **Serial baud rate:** `9600`
- **Serial frame format:** `val0,val1,val2,val3,val4,val5,val6,val7\n`
- **Frame cadence:** about one frame every `30 ms`
- **Motor output:** PCA9685 PWM driver over I2C (`SDA=A4`, `SCL=A5`), PWM frequency `1000 Hz`, 12-bit resolution (`0-4095`), motor index matched to the FSR index on the Arduino side.

## Dashboard architecture (`dashboard-test.html`)

The dashboard is a single self-contained HTML file. It uses the **Web Serial API** for hardware mode and a synthetic software data source for demo mode.

### FSR signal pipeline

Raw serial frame -> `remapRawFsrFrame` -> `normalizeLiveFsrFrame` -> `spreadLiveFsrFrame` -> render

1. **Remap** (`remapRawFsrFrame`)
   Uses `LIVE_FSR_RAW_TO_ZONE_MAP = [7, 6, 5, 4, 3, 2, 1, 0]` where the index is the visual zone and the value is the Arduino channel.
2. **Normalize** (`normalizeLiveFsrFrame`)
   Uses adaptive floor and ceiling calibration over a rolling `48`-frame history (`LIVE_FSR_HISTORY_SIZE = 48`), idle detection (`LIVE_FSR_EMPTY_MAX = 12`, `LIVE_FSR_EMPTY_SUM = 36`), and a gain exponent of `0.58`.
3. **Spread** (`spreadLiveFsrFrame`)
   Applies `LIVE_FSR_BLEED_MATRIX` to simulate pressure diffusion between neighboring zones.

The full live-FSR transform is exposed on `globalThis.__SENSEGRID_LIVE_FSR__` for inspection and testing. It includes `runLiveFsrSelfTests()`, which validates remapping, normalization, spread, clamping, and idle-reset behavior against the dashboard's current visual zone order:

`[Back-R, Back-L, Hip-R, Thigh-R, Thigh-L, Hip-L, Front-R, Front-L]`

### Rendering

- **Main heatmap:** SVG-based cushion view with 8 named zones mapped to SVG `<path>` elements.
- **Left sidebar:** zone cards with sparklines and compact inline detail stats.
- **Right sidebar:** posture detection card, physical motor layout panel, threshold slider, and session stats.
- **Bottom drawer:** 30-second pressure timeline with 8 zone traces. It opens expanded by default but remains collapsible.
- **Color scale:** 6 pressure levels, `--pressure-0` through `--pressure-5`.
- **Empty state:** a centered overlay prompts the user to connect hardware before the first live or demo frame arrives.

### Real-time behavior and latency notes

- The heatmap itself interpolates between frames for visual smoothness.
- To avoid a visible one-frame lag in the sidebars, `onData(...)` calls `updateZoneCards(data.fsr)` and `updateStats(data.fsr)` with the newest sample immediately.
- Cards, sparklines, and session stats update from the newest packet even while the central heatmap is still easing toward the same target frame.
- Sparkline and timeline canvas rendering are dirty-flagged, so they redraw only when new data or threshold changes arrive.
- Zone colors are cached in state and reused across the heatmap, cards, and sparkline rendering paths to reduce redundant per-frame work.

### Motor layout (8 motors)

| ID | Type | Zone | SVG position |
|---|---|---|---|
| C0 | Cylindrical | Back-Right | `cx=90, cy=60` |
| S0 | Square | Back-Center | `cx=250, cy=60` |
| C2 | Cylindrical | Back-Left | `cx=410, cy=60` |
| C1 | Cylindrical | Hip-Right | `cx=90, cy=175` |
| S1 | Square | Thigh-Center | `cx=250, cy=175` |
| C3 | Cylindrical | Hip-Left | `cx=410, cy=175` |
| S2 | Square | Front-Right | `cx=130, cy=310` |
| S3 | Square | Front-Left | `cx=370, cy=310` |

`MOTOR_LABELS = ['C0', 'S0', 'C2', 'C1', 'S1', 'C3', 'S2', 'S3']`

The sidebar motor panel is a read-only physical layout schematic. It mirrors the cushion motor placement but does not allow manual override.

### Posture prediction pipeline

Serial frame -> FSR pipeline -> `predictPosture` -> `updatePostureSmoothed` -> motor routing -> UI

1. **`predictPosture(fsrValues)`**
   Normalizes FSR values from `[0-1023]` to `[0-1]`, computes cosine similarity against `POSTURE_UNIT_VECS`, and returns ranked candidates plus confidence flags.
2. **`updatePostureSmoothed(postureState, rawResult)`**
   Applies EMA smoothing with `POSTURE_EMA_ALPHA = 0.30` and requires 5 ticks of label persistence before switching the displayed posture.
3. **Motor routing**
   For confident predictions (`score > 0.78` and margin `> 0.18`), `MOTOR_ROUTING[postureId]` provides the 8-motor bitmask and reason string. Motors are off when the seat is empty or the result is uncertain.

### Posture visualization architecture

The posture card keeps the original minimal seated silhouette, but it is now articulated into lightweight SVG subgroups:

- `poseChair`
- `poseUpperBody`
- `poseHeadGroup`
- `poseLeftArmGroup`
- `poseRightArmGroup`
- `poseLowerBody`
- leg variants for normal, cross-right, and cross-left

`computeProjectedPose(postureId, score, confident, tentative)` converts the predicted posture into a set of cheap 2D affine transforms derived from pose presets (yaw, pitch, roll, and planar shifts). `renderProjectedPose(...)` applies those transforms to the existing silhouette groups.

This is intentionally CPU-light:

- no 3D mesh
- no canvas model rendering
- no WebGL or GPU path
- only a few SVG subgroup transforms updated when posture changes

### Posture prototypes (6 classes)

Defined in `POSTURE_PROTOTYPES`. Zone vector order is:

`[Back-R, Back-L, Hip-R, Thigh-R, Thigh-L, Hip-L, Front-R, Front-L]`

| ID | Label |
|---|---|
| `lean_left` | Lean Left |
| `lean_right` | Lean Right |
| `lean_forward` | Lean Forward |
| `lean_back` | Lean Back |
| `cross_right` | Cross-leg · R |
| `cross_left` | Cross-leg · L |

Confidence thresholds:

- `POSTURE_CONF_HIGH = 0.78`
- `POSTURE_CONF_LOW = 0.62`
- `POSTURE_MARGIN_HIGH = 0.18`
- `POSTURE_MARGIN_LOW = 0.10`

These were derived from inter-prototype cosine similarity analysis, with the hardest pair being approximately `lean_left <-> lean_back` at `~0.74` cosine similarity.

### Data sources and startup behavior

- The dashboard starts in **Awaiting Connection** mode with no incoming data.
- **Hardware mode:** clicking **Connect Hardware** uses `SerialDataSource` and the Web Serial API.
- **Demo mode:** clicking **Run Demo Session** uses `FakeSessionDataSource`, which emits synthetic 8-channel frames through the same `onData(...)` pipeline as real hardware.
- The `?demo=1` query parameter auto-starts the software demo session on page load.
- Hardware mode and demo mode are mutually exclusive; starting one stops the other.

## Test strategy

- **Software-only verification:** all current automated tests run without hardware.
- **Synthetic data:** tests use artificial serial lines and FSR frames to mimic hardware integration behavior.
- **Coverage focus:** remap order, embedded FSR self-tests, posture classification, smoothing/reset behavior, projected posture visualization behavior, motor routing, serial line buffering, software demo session behavior, immediate stat/card updates, and color clamping.
- **Command:** `node --test --test-isolation=none`
- **Current result:** `10/10` tests passing.

## Running the dashboard

1. Upload `Motor.ino` to the Arduino using the Arduino IDE.
2. Open `dashboard-test.html` directly in Chrome or Edge.
3. Click **Connect Hardware** and select the Arduino serial port for live mode, or click **Run Demo Session** for a software-only session.

For an auto-starting software-only session, open:

```bash
dashboard-test.html?demo=1
```

For software-only verification during development, run:

```bash
node --test --test-isolation=none
```

## Python helper

`_analyze_topview.py` requires Pillow.

```bash
python _analyze_topview.py
```

The existing `.venv` contains Pillow and some unrelated support packages from other tooling contexts. Only Pillow is needed for this script.
