# Code review — OpticsLab — 2026-11-16

Reviewed commit: `9242006ece04bbb38bacbede836df53aecdd3bf3`. Working tree was clean at review start.
Selected as one of the ten oldest catalogued simulations by the earliest root commit's author timestamp: `2026-02-24T21:11:56-05:00`. This is source-history age, not GitHub repository-creation age.

## Scope

Scene invalidation and command history; serialization and element lifetime; thin-lens and beam-splitter interactions; grating power/truncation; detector acquisition timing and existing physics regressions. No additional actionable defect confirmed in these paths.

This is a targeted functional code review with broad automated checks, not a full release certification. The findings below describe the reviewed commit. The remediation section records the subsequent corrections.

## Findings

No new actionable functional defect confirmed in the reviewed paths. This does not establish exhaustive correctness.

## Validation

Node v26.13.0. `npm run lint`, `npm run check`, `npm run build`, `npm run check:architecture`, and the existing `npm test` suite pass (459 tests). Local Baton compliance passes with warnings; GitHub security settings could not be read by the checker.

Template drift is pre-existing and separate from the functional findings:

```text
❌ OpticsLab (2)
   differs       biome.json — differs outside extendable keys
   dependency    @biomejs/biome — @biomejs/biome@^2.6.5 ≠ template ^2.6.6
```

## Limits and retained evidence

No new browser fuzz, live video/camera, heap profiling, manual screen-reader audit, remote dependency audit, or educator sign-off was performed in this review. Unit mocks and source tracing do not substitute for these checks. The November 15 fleet-fuzz results in the superproject review log are prior evidence, not a new browser run.

Validation logs and original diagnostic sources/output are retained locally in `/tmp/oldest-review/`; temporary evidence may be removed by the system. This report preserves the actionable reproducers.


## Remediation — 2026-11-16

No functional correction was needed in the reviewed paths.

Aligned template-owned configuration and shared dependency declarations with SceneryStackTemplate: Biome ^2.6.6, its 2.6.6 schema and locked executable, dependency ordering, and Resonance’s Vitest declaration where applicable. Preserved documented per-simulation configuration exceptions.

Final validation and commit identifiers are recorded in the superproject’s `review-log.md`.
