# Haptic-Guided Posture Correction Cushion

Repository for the smart-cushion dashboard prototype, Arduino integration code, and top-view layout analysis assets.

## Key files

- `dashboard-rendered.html`: rendered dashboard reference for the intended visual design and behavior.
- `dashboard-test.html`: hardware-facing dashboard used for live integration with Arduino serial data.
- `Motor.ino`: Arduino sketch that reads the 8 FSR channels and drives the vibration motors.
- `_analyze_topview.py`: helper script for analyzing the cushion top-view layout.
- `smart-cushion-top-view.png`: source image used by the layout analysis helper.

## Notes

- The live dashboard path is implemented in `dashboard-test.html`.
- Dashboard-side sensor remapping and demo heatmap enhancement are handled in the dashboard, not in the Arduino sketch.
- Coursework PDFs, presentation decks, extracted intermediates, and other local-only assets may exist in the workspace but are intentionally excluded from version control.
