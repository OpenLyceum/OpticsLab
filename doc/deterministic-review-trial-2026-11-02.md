# Deterministic review-tool trial — 2026-11-02

Scope: OpticsLab source analysis, focused on duplication and maintainability.
Reviewed revision: `3166aa3`; working tree was clean before the trial.
Runtime: Node v26.13.0, Python 3.14.4.
No source changes or automatic fixes were made.

## Tools and results

| Tool | Version | Result |
| --- | --- | --- |
| jscpd | 5.4.2 | 139 clone matches; 2,663 reported duplicated TypeScript lines (9.68% of 27,512 TS lines), across 130 TypeScript files. Including three JSON files: 9.44% of 28,196 lines. |
| Knip | 6.44.1 | Five unused-file candidates, unused value exports in 11 files, unused type exports in five files, and six duplicate-export groups. |
| Madge | 8.0.0 | No cycles found in the analyzed graph (149 files). Skipped 18 SceneryStack external module specifiers. |
| dependency-cruiser | 18.7.1 | Cruised 167 modules and 879 dependencies; no direct model-to-view imports found by examining the resulting graph. |
| Lizard | 1.25.0 | Six functions exceed cyclomatic complexity 15. |
| Oxlint, type aware | 1.90.0 | Six warnings, all for array construction or unnecessary iterable-to-array spreads; exit 0. |

Knip and Lizard exited 1 because they reported findings. The other commands exited 0.
dependency-cruiser used its installed TypeScript 5.9.3 parser compatibility dependency.
Its `--no-config` run only generates a graph: zero configured-rule violations is not a layering-policy pass.
Semgrep rules and class diagrams were outside this duplication-focused trial.

## Duplication candidates

jscpd used a minimum of 60 tokens and its default mode. Matches can overlap and can include
declarations or surrounding boilerplate; these totals are not unique removable lines.
The following candidates were prioritized from its output; the first two were also checked
against the source.

1. **Parabola geometry:** [ParabolicMirror.ts](../src/common/model/mirrors/ParabolicMirror.ts)
   `computePoints()` (line 55) and
   [AperturedParabolicMirror.ts](../src/common/model/mirrors/AperturedParabolicMirror.ts)
   `computePoints()` (line 59) repeat the parabola sampling calculation.
   The latter explicitly documents matching the former. A shared model geometry helper
   would keep the calculations synchronized while preserving aperture-specific behavior.
   jscpd reports overlapping 31- and 36-line matches here.

2. **Arc geometry:** [DetectorElement.ts](../src/common/model/detectors/DetectorElement.ts)
   `setRadius()` (line 59) and [ArcMirror.ts](../src/common/model/mirrors/ArcMirror.ts)
   `setRadius()` (line 60) repeat the radius-to-sagitta calculation (36-line match).
   Arc membership and ray intersection also match (15 and 23 lines).
   Shared geometry helpers are candidates; detector acquisition and mirror reflection remain
   separate behaviors. Degenerate-arc handling differs and must be preserved.

3. **Mirror interaction setup:** [ArcMirrorView.ts](../src/common/view/mirrors/ArcMirrorView.ts)
   and [ParabolicMirrorView.ts](../src/common/view/mirrors/ParabolicMirrorView.ts)
   contain a 56-line match around lines 100 and 131, plus additional matching setup.
   Inspect drag/handle setup as a possible shared view helper.

4. **Grating view setup:** [ReflectionGratingView.ts](../src/common/view/gratings/ReflectionGratingView.ts)
   line 100 and [TransmissionGratingView.ts](../src/common/view/gratings/TransmissionGratingView.ts)
   line 91 have a 41-line match.

5. **Repeated glass editor controls:** [GlassEditControls.ts](../src/common/view/edit-controls/GlassEditControls.ts)
   lines 453 and 619 contain a 32-line match in the same file.

Similar screen constructors, import lists, and locale type declarations also produce matches.
Review those for readability before deciding whether extraction helps.

## Other signals

Knip's five unused-file candidates:

- `src/common/OpticsLabPanel.ts`
- `src/common/model/index.ts`
- `src/common/view/FocalMarkersVisibleProperty.ts`
- `src/common/view/HandlesVisibleProperty.ts`
- `src/common/view/RayArrowsVisibleProperty.ts`

A source/test name search found no external references to the four named UI modules.
The model index is a barrel; its API should be checked before removing it.
These are candidates, not proof that deletion is safe.
Knip also reports shared button options and memory-leak helper exports; any changes to
template-owned files belong in SceneryStackTemplate first.
Its duplicate-export groups include constants sharing primitive values, which does not
by itself establish redundant APIs.

Lizard's functions above the threshold:

| Function | File and line | Complexity |
| --- | --- | --- |
| `deserializeElement` | `src/common/model/optics/elementSerialization.ts:421` | 22 |
| `processRayEntry` | `src/common/model/optics/RayTracer.ts:190` | 18 |
| `paintSegment` | `src/common/view/RayPropagationView.ts:269` | 18 |
| `build` | `src/common/model/optics/SpatialIndex.ts:51` | 17 |
| `refractRay` | `src/common/model/glass/BaseGlass.ts:71` | 16 |
| `tryHandleToolsPanelShortcut` | `src/common/view/RayTracingCommonView.ts:78` | 16 |

These are review priorities, not demonstrated defects.

## Reproduction and artifacts

Run from the OpticsLab repository. Set `REPORT_DIR` to a scratch directory outside the repo.

```bash
jscpd src --min-tokens 60 --reporters consoleFull,json --output "$REPORT_DIR/jscpd" --no-colors
knip --no-progress --reporter compact
madge --circular --warning --extensions ts --ts-config tsconfig.json src
depcruise src --no-config --ts-config tsconfig.json --output-type json
lizard src -l typescript -w -C 15
oxlint --type-aware src
```

Raw logs and the machine-readable clone/dependency reports from this trial are in
`/tmp/opticslab-review-2026-11-02-uouFWX` (temporary local artifacts).
No lint/typecheck/build/unit/browser tests were run: this trial changed only this report
and does not establish runtime or physics correctness.

## Follow-up improvements — 2026-11-02

The subsequent implementation consolidates parabola sampling in Geometry.ts, shared by
both parabolic mirror models and the parabolic mirror view. ArcMirror and DetectorElement
now share radius adjustment and arc membership calculations. Their distinct flat-arc
intersection behavior is preserved.

The shared radius calculation also fixes two demonstrated numerical defects:

- Subtracting nearly equal values flattened shallow arcs (for example, radius 1e8 m
  across a 2 m chord). A rationalized, scaled sagitta formula retains the curvature
  and avoids squaring large finite radii.
- Coincident endpoints or a non-finite radius could produce NaN control points.
  These inputs now leave the existing control point unchanged.

Eight regression cases failed against the original implementation and passed after the fix.
The final 27 geometry checks also cover analytic and rotated parabolas, aperture transmission,
off-axis reflection toward the focus, brightness and wavelength preservation, major arcs,
normal orientation, curvature side, and the detector's flat fallback.

With the same jscpd settings, clone matches decreased from 139 to 133 and reported
duplicated TypeScript lines from 2,663/27,512 (9.68%) to 2,516/27,446 (9.17%).
These remain tool-reported counts, including overlapping matches.

Before pushing, the implementation was rebased onto the concurrently merged template
update 58b5581. Its public-API comments change the final denominator to 27,454 TypeScript
lines: 2,516 duplicated lines (9.16%), still 133 matches.
Post-rebase lint, type checks, local compliance, and import-cycle checks passed;
all 459 unit tests passed again (47.70 seconds), as did both quick fuzz modes
with seed 829885 (27.4 seconds overall).

Final validation on Node v26.13.0:

- npm run lint, npm run check, and npm run build passed.
- npm test passed: 459 tests across seven files (48.08 seconds).
- Pointer and keyboard quick fuzz passed: 10 seconds per mode, seed 829885
  (27.3 seconds overall).
- Local repository compliance passed. Live GitHub security settings were not checked
  because gh was unavailable in the sandbox.
- Oxlint retained the same six array/spread warnings as the initial trial.
- The import scan found no cycles, with the same external SceneryStack resolution caveat.

One earlier keyboard fuzz run with seed 829885 failed on a SceneryStack focus/hotkey
reentry assertion. Replaying that seed on an untouched archive of revision 3166aa3 passed
both modes, as did the final implementation. The cause remains unresolved; these runs do
not establish whether that intermittent assertion predates the changes.

Final clone report: /tmp/opticslab-improve-jscpd-final/jscpd-report.json.
Validation logs: /tmp/opticslab-improve-test.log, /tmp/opticslab-improve-build.log,
/tmp/opticslab-improve-fuzz-final.log, and /tmp/opticslab-baseline-fuzz.log.
The post-rebase clone report is /tmp/opticslab-improve-jscpd-rebased/jscpd-report.json;
post-rebase validation logs are /tmp/opticslab-improve-rebased-test.log and
/tmp/opticslab-improve-rebased-fuzz.log.

