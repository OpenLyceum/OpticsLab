# SceneryStack Code Review — Findings

**Date:** 2026-07-21 (citations refreshed 2026-09-27 to name symbols, not line numbers)
**Scope:** OpticsLab shared stack (`src/common/`) and screens, reviewed against the six SceneryStack
pillars: architecture, memory, accessibility, layout, numerics, i18n.
**Focus:** architecture, a11y, and i18n pillars (not a full physics/deserialization audit).

---

## Summary

OpticsLab scores well on the two pillars that are hardest to retrofit: **model–view separation is
clean** (no view imports anywhere under `src/common/model/**`) and **disposal discipline is real**
(explicit `disposeNodes` arrays, listeners unlinked on `disposeEmitter`, a per-frame allocation path
that was deliberately optimized for static scenes). The gaps are concentrated in **internationalization
of accessibility strings** and a couple of **frame-rate-coupling** rough edges.

| # | Pillar | Severity | One-line | Status |
|---|--------|----------|----------|--------|
| 1 | i18n / a11y | MEDIUM | Optical-element accessible names are English-only, bypassing `StringManager` | **Fixed** |
| 2 | i18n | LOW–MED | Hardcoded `"∫I ="` detector label sits next to a properly localized sibling | **Fixed** |
| 3 | Numerics | LOW–MED | No `dt` cap; acquisition sample count is frame-rate-dependent | Open |
| 4 | Architecture | LOW | Element geometry is plain objects, not Axon Properties → manual `invalidate()` | Open |

---

## FINDING #1 — Optical-element accessible names bypass i18n (English-only)

**Where:** `RayTracingCommonView._setupView` assigns `accessibleName`; the English fallback is
`ElementTypeToAccessibleName` in the same file. Localized names come from
`StringManager.getElementTypeNameProperty`.
**Pillars:** 6 (i18n) + 3 (a11y) — **Severity: MEDIUM**

### Code (current)

```typescript
view.accessibleName =
  StringManager.getInstance().getElementTypeNameProperty(element.type) ?? ElementTypeToAccessibleName(element.type);

function ElementTypeToAccessibleName(type: string): string {
  return type.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
}
```

### Problem

Every draggable optical element's screen-reader name used to be derived by splitting its **English**
type string (`"IdealLens"` → `"Ideal Lens"`). Every *other* accessible name in
`RayTracingCommonView` already went through `StringManager` string Properties (the reset-all and
download-scene buttons). OpticsLab ships a French UI, so:

- Screen-reader users on `fr` (or any non-English locale) heard English element names.
- `accessibleName` was a **plain string**, not a `StringProperty`, so it did **not** update when the
  locale changed at runtime.

### Fix — applied

`StringManager.getElementTypeNameProperty` maps each `ELEMENT_TYPE_*` constant to its localized
component `StringProperty`. `RayTracingCommonView._setupView` assigns that Property to
`accessibleName`, and falls back to `ElementTypeToAccessibleName` only for internal types with no
component label (e.g. `FiberCoreGlass`). Names localize and stay reactive to locale changes.

---

## FINDING #2 — Hardcoded `"∫I ="` label in the detector chart

**Where:** `DetectorChartPanel` constructor, the `powerLabel` `Text` next to `hitCountLabel`.
**Pillar:** 6 (i18n) — **Severity: LOW–MEDIUM**

### Code (current)

```typescript
const hitCountLabel = new Text(StringManager.getInstance().getUIStrings().detectorHitsStringProperty, { … });
const powerLabel = new Text(StringManager.getInstance().getUIStrings().detectorIntegratedIntensityStringProperty, { … });
```

### Problem

The two readout labels are built side by side, but `powerLabel` used to be the raw literal `"∫I ="`.
Translators could not reach it. `hitCountLabel` already showed the intended pattern.

### Fix — applied

Added a `detectorIntegratedIntensity` key to all three locale files and exposed it as
`detectorIntegratedIntensityStringProperty` via `StringManager.getUIStrings()`. `DetectorChartPanel`
passes that Property to the `Text` node, as `hitCountLabel` already did.

---

## FINDING #3 — No `dt` cap; acquisition sampling is frame-rate-coupled

**Where:**
- `RayTracingCommonModel.step` forwards raw `dt` to each detector
- `DetectorAcquisition.step` accumulates that `dt` (the old `TimeModel` clock is gone)
- `RayTracingCommonView.updateRayPropagation` runs a fixed `ACQUISITION_PASSES_PER_FRAME` loop
- `ACQUISITION_DURATION_S` and `ACQUISITION_PASSES_PER_FRAME` in `OpticsLabConstants.ts`

**Pillar:** 5 (numerics / variable frame rate) — **Severity: LOW–MEDIUM**

### Problem

There is no `dt = Math.min(dt, MAX_DT)` anywhere in the codebase. `DetectorAcquisition.step` adds the
raw `dt` toward `ACQUISITION_DURATION_S` (2.0 s). The jittered sample passes that fill the acquisition
histogram run a **fixed** `ACQUISITION_PASSES_PER_FRAME` (100) per animation frame inside
`RayTracingCommonView.updateRayPropagation`, independent of `dt`.

Consequences of the frame-count coupling:

- Total samples per acquisition ≈ `100 × (frames elapsed during 2 s)` — ~12 000 at 60 fps but ~6 000 at
  30 fps. **Acquisition quality depends on the device's frame rate**, not on physical time.
- After a backgrounded/refocused tab, a single large `dt` can push `elapsed` past `ACQUISITION_DURATION_S`
  in **one frame**, completing the acquisition with only ~100 samples — a visibly noisier histogram.

There is no continuous integrator here, so nothing "explodes" (unlike a dynamics sim), which is why this
is low–medium rather than high. But it violates the "resilient to variable frame rates" guideline.

### Fix

Cap `dt` at `RayTracingCommonModel.step` (or inside `DetectorAcquisition.step`) and/or drive the number
of jitter passes from `dt` rather than a fixed per-frame count, so total sample count tracks physical
acquisition time. This is a numerics change; leave it until someone is ready to retune acquisition.

---

## FINDING #4 — Element geometry is plain objects, not Axon Properties

**Where:** `RayTracingCommonView._setupView`, the `rebuildListener` on `BaseOpticalElementView.rebuildEmitter`.
**Pillar:** 1 (Property hygiene) — **Severity: LOW (deliberate tradeoff, but fragile)**

### Code (current)

```typescript
// Element positions are plain objects (not axon Properties), so dragging
// does not automatically mark the scene dirty. Invalidate here so the
// ray tracer re-runs on the next step() rather than showing a stale result.
this.model.scene.invalidate();
```

### Problem

Element position/geometry is imperative mutable state rather than reactive `Property` state. Nothing
observes it, so the view must remember to call `OpticsScene.invalidate()` by hand after any geometry
change. The call sits in that rebuild listener. The invariant "every geometry mutation must be followed
by `invalidate()`" is enforced by nothing. A future drag path, a preset loader, or a programmatic move
that forgets the call will silently render a **stale ray trace** with no error.

This is a conscious performance tradeoff (Properties on every control point would be heavier), so it is
not a defect to "fix" blindly. It should stay documented as a load-bearing invariant, or be centralized
behind a single helper that invalidates internally.

---

## Pillars that passed

- **Architecture (model–view).** No `scenerystack/scenery`, `scenerystack/sun`, or `common/view` imports
  under `src/common/model/**`. Data flows Model → View through Properties and `OpticsScene` invalidation.
- **Memory / disposal.** `DetectorChartPanel.dispose` disposes every node listed in `disposeNodes`.
  `RayTracingCommonView._setupView` removes the rebuild listener, the selection link, the body-drag
  link, and the selection input listener on each view's `disposeEmitter`. Dynamic element add/remove is
  covered by `tests/memory-leak.test.ts`.
- **Per-frame allocation.** `RayTracingCommonView.updateRayPropagation` reuses the cached `TraceResult`
  for static scenes; the allocation-heavy path only runs while a detector is actively acquiring.
