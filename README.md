# Haptic-Guided Posture Correction Cushion

SenseGrid is a browser-based dashboard and Arduino prototype for an 8-zone smart cushion. It reads FSR data over serial, renders a real-time pressure heatmap, predicts posture, and shows the corresponding haptic motor routing.

## Key files

- `dashboard-test.html`: the live dashboard. It contains all HTML, CSS, and JavaScript inline.
- `dashboard-rendered.html`: static visual reference for the intended dashboard design.
- `Motor.ino`: Arduino sketch for the FSR multiplexer and motor driver path.
- `tests/dashboard-test.test.js`: software-only regression suite for dashboard logic.
- `tests/helpers/load-dashboard.js`: Node-based harness that loads the inline dashboard script into a stubbed DOM.
- `_analyze_topview.py`: helper for analyzing the cushion top-view layout image.

## Dashboard features

- 8-zone pressure heatmap with the current visual zone order:
  `Back-R, Back-L, Hip-R, Thigh-R, Thigh-L, Hip-L, Front-R, Front-L`
- Posture prediction with smoothing and motor routing
- Physical-layout motor status panel
- Pressure timeline drawer
- Real hardware mode through the Web Serial API
- Software-only demo session with synthetic data

## Running the dashboard

### Hardware mode

1. Upload `Motor.ino` to the Arduino.
2. Open `dashboard-test.html` in Chrome or Edge.
3. Click `Connect Hardware` and select the serial device.

### Demo mode

You can run a fake monitoring session without hardware in either of these ways:

- Open `dashboard-test.html?demo=1`
- Or open the page normally and click `Run Demo Session`

The demo mode drives the normal dashboard pipeline with synthetic 8-channel frames, so the heatmap, pressure cards, posture prediction, timeline, and motor routing can be inspected in real time without hardware.

## Serial protocol

- Baud rate: `9600`
- Frame format: `val0,val1,val2,val3,val4,val5,val6,val7\n`
- 8 comma-separated integer FSR readings per frame

## Test workflow

The dashboard has a software-only regression suite. No hardware is required.

Run:

```bash
node --test --test-isolation=none
```

Current suite coverage includes:

- live FSR remapping and self-tests
- posture classification and smoothing
- motor routing
- serial buffering
- software demo session behavior
- immediate UI stat/card updates
- pressure color endpoint clamping

Current result: `9/9` tests passing.

## Notes

- The dashboard handles sensor remapping, normalization, pressure spread, demo mode, and posture logic on the browser side.
- The heatmap is visually interpolated for smoothness, while the sidebar stats/cards update immediately from the newest sample.
- Coursework PDFs, local captures, rendered media, and other workspace-only assets may exist locally but are not necessarily tracked in Git.
