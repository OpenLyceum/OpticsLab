/**
 * GlassEditControls.ts
 *
 * Edit-panel control builders for glass and lens element types:
 * SphericalLens, IdealLens, BaseGlass (generic refractive-index control),
 * and the typed fixed-shape prisms (EquilateralPrism, RightAnglePrism,
 * PorroPrism, SlabGlass, ParallelogramPrism, DovePrism).
 */

import { NumberProperty, type ReadOnlyProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { Node } from "scenerystack/scenery";
import { NumberControl } from "scenerystack/scenery-phet";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "../../../i18n/StringManager.js";
import {
  CONSTRAINED_CURVATURE_MAX,
  CONSTRAINED_CURVATURE_MIN,
  CONSTRAINED_LENS_RADIUS_MIN,
  DIMENSIONAL_GLASS_HEIGHT_MAX_M,
  DIMENSIONAL_GLASS_HEIGHT_MIN_M,
  DIMENSIONAL_GLASS_SIZE_DELTA,
  DIMENSIONAL_GLASS_WIDTH_MAX_M,
  DIMENSIONAL_GLASS_WIDTH_MIN_M,
  ELEMENT_ANGLE_MAX_DEG,
  ELEMENT_ANGLE_MIN_DEG,
  FOCAL_LENGTH_MAX_M,
  FOCAL_LENGTH_MIN_M,
  PRISM_SIZE_DELTA,
  PRISM_SIZE_MAX_M,
  PRISM_SIZE_MIN_M,
  REFRACTIVE_INDEX_DELTA,
  REFRACTIVE_INDEX_MAX,
  REFRACTIVE_INDEX_MIN,
  SEGMENT_LENGTH_MAX,
  SEGMENT_LENGTH_MIN,
  SPHERICAL_CURVATURE_MAX,
  SPHERICAL_CURVATURE_MIN,
  SPHERICAL_R1_FALLBACK,
  SPHERICAL_R2_FALLBACK,
  SPHERICAL_RADIUS_MAX,
  SPHERICAL_RADIUS_MIN,
} from "../../../OpticsLabConstants.js";
import type { SignConvention } from "../../../preferences/OpticsLabPreferencesModel.js";
import type { BaseGlass } from "../../model/glass/BaseGlass.js";
import type { DovePrism } from "../../model/glass/DovePrism.js";
import type { EquilateralPrism } from "../../model/glass/EquilateralPrism.js";
import type { GlassPathPoint } from "../../model/glass/Glass.js";
import type { HalfPlaneGlass } from "../../model/glass/HalfPlaneGlass.js";
import type { IdealLens } from "../../model/glass/IdealLens.js";
import type { ParallelogramPrism } from "../../model/glass/ParallelogramPrism.js";
import type { PorroPrism } from "../../model/glass/PorroPrism.js";
import type { RightAnglePrism } from "../../model/glass/RightAnglePrism.js";
import type { SlabGlass } from "../../model/glass/SlabGlass.js";
import type { SphericalLens } from "../../model/glass/SphericalLens.js";
import {
  buildSegmentAngleControl,
  buildSegmentLengthControl,
  makeControl,
  numberControlOptions,
  resizeSegment,
  safeClamp,
  segmentAngleDeg,
  segmentLength,
} from "./EditControlHelpers.js";
import type { EditControlsResult } from "./EditControlsResult.js";

// ── Private helpers ───────────────────────────────────────────────────────────

/** Angle in degrees [0,360) of path[0] relative to the path centroid. */
function prismPathAngleDeg(path: GlassPathPoint[]): number {
  const n = path.length;
  if (n < 1) {
    return 0;
  }
  let cx = 0;
  let cy = 0;
  for (const p of path) {
    cx += p.x;
    cy += p.y;
  }
  cx /= n;
  cy /= n;
  const p0 = path[0] as GlassPathPoint;
  const deg = Math.atan2(p0.y - cy, p0.x - cx) * (180 / Math.PI);
  return ((deg % 360) + 360) % 360;
}

/** Rotate all path vertices about their centroid by deltaRad radians. */
function rotatePrismPath(path: GlassPathPoint[], deltaRad: number): void {
  const n = path.length;
  if (n < 3) {
    return;
  }
  let cx = 0;
  let cy = 0;
  for (const p of path) {
    cx += p.x;
    cy += p.y;
  }
  cx /= n;
  cy /= n;
  const cos = Math.cos(deltaRad);
  const sin = Math.sin(deltaRad);
  for (const p of path) {
    const dx = p.x - cx;
    const dy = p.y - cy;
    p.x = cx + dx * cos - dy * sin;
    p.y = cy + dx * sin + dy * cos;
  }
}

type ControlWithRefresh = { control: NumberControl; refresh: () => void };

/** Normalizes an angle in radians to degrees in [0, 360). */
function radiansToDegrees360(rad: number): number {
  return (((rad * (180 / Math.PI)) % 360) + 360) % 360;
}

/**
 * Build a 0–360° angle slider. `readDeg` reports the element's current angle;
 * `applyAngle` receives the new and previous slider values, so callers may
 * apply either an absolute angle or a delta that stays in sync with drags.
 */
function buildAngleControl(
  readDeg: () => number,
  applyAngle: (deg: number, prevDeg: number) => void,
  triggerRebuild: () => void,
): ControlWithRefresh {
  const controlStrings = StringManager.getInstance().getControlStrings();
  const A_RANGE = new Range(ELEMENT_ANGLE_MIN_DEG, ELEMENT_ANGLE_MAX_DEG);
  let prevAngleDeg = readDeg();
  const angleProperty = new NumberProperty(prevAngleDeg, { range: A_RANGE, tandem: Tandem.OPTIONAL });
  let angleDriving = false;
  angleProperty.lazyLink((deg) => {
    angleDriving = true;
    const prev = prevAngleDeg;
    prevAngleDeg = deg;
    applyAngle(deg, prev);
    triggerRebuild();
    angleDriving = false;
  });
  const control = new NumberControl(
    controlStrings.angleStringProperty,
    angleProperty,
    A_RANGE,
    numberControlOptions(1, 0, Tandem.OPTIONAL),
  );
  const refresh = (): void => {
    if (angleDriving) {
      return;
    }
    prevAngleDeg = readDeg();
    angleProperty.value = prevAngleDeg;
  };
  return { control, refresh };
}

/** Angle slider for a SphericalLens: rotates by the slider delta, then rebuilds the arc path. */
function buildSphericalLensAngleControl(element: SphericalLens, triggerRebuild: () => void): ControlWithRefresh {
  return buildAngleControl(
    () => segmentAngleDeg(element.p1, element.p2),
    (deg, prevDeg) => {
      element.rotate((deg - prevDeg) * (Math.PI / 180));
      const { d, r1, r2 } = element.getDR1R2();
      element.createLensWithDR1R2(d, r1, r2);
    },
    triggerRebuild,
  );
}

/** Angle slider for a path prism: rotates every vertex about the centroid by the slider delta. */
function buildGlassPrismAngleControl(path: GlassPathPoint[], triggerRebuild: () => void): ControlWithRefresh {
  return buildAngleControl(
    () => prismPathAngleDeg(path),
    (deg, prevDeg) => {
      rotatePrismPath(path, (deg - prevDeg) * (Math.PI / 180));
    },
    triggerRebuild,
  );
}

/** Angle slider for a DimensionalGlass element: reads `rotation` and writes via setRotation(). */
function buildDimensionalGlassAngleControl(
  element: { rotation: number; setRotation: (angle: number) => void },
  triggerRebuild: () => void,
): ControlWithRefresh {
  return buildAngleControl(
    () => radiansToDegrees360(element.rotation),
    (deg) => {
      element.setRotation(deg * (Math.PI / 180));
    },
    triggerRebuild,
  );
}

/** Refractive-index slider shared by every glass element. */
function buildRefractiveIndexControl(element: BaseGlass, triggerRebuild: () => void): Node {
  return makeControl(
    StringManager.getInstance().getControlStrings().refractiveIndexStringProperty,
    element.refIndex,
    new Range(REFRACTIVE_INDEX_MIN, REFRACTIVE_INDEX_MAX),
    REFRACTIVE_INDEX_DELTA,
    (v) => {
      element.refIndex = v;
    },
    triggerRebuild,
    Tandem.OPTIONAL,
  );
}

/**
 * Two-way sync guard for lens sliders.
 * sliderDriving: a slider is changing the model → suppress refresh.
 * viewDriving: refresh is updating slider displays → suppress slider listeners.
 */
type LensSync = {
  /** Wraps a slider listener so it ignores refresh-driven changes. */
  fromSlider: (apply: (v: number) => void) => (v: number) => void;
  /** Builds a refresh callback that ignores slider-driven model changes. */
  refresher: (update: () => void) => () => void;
};

function createLensSync(triggerRebuild: () => void): LensSync {
  let sliderDriving = false;
  let viewDriving = false;
  return {
    fromSlider: (apply) => (v) => {
      if (viewDriving) {
        return;
      }
      sliderDriving = true;
      apply(v);
      triggerRebuild();
      sliderDriving = false;
    },
    refresher: (update) => () => {
      if (sliderDriving) {
        return;
      }
      viewDriving = true;
      update();
      viewDriving = false;
    },
  };
}

/** Shared lens slider skeleton: the surface sliders, then length, angle and refractive index. */
type LensSliders = {
  /** Surface sliders shown above the length slider. */
  surfaceControls: NumberControl[];
  /** Updates the surface slider values from the model; called inside the refresh guard. */
  refreshSurfaces: () => void;
};

function assembleLensControls(
  element: SphericalLens,
  triggerRebuild: () => void,
  buildSurfaces: (sync: LensSync) => LensSliders,
): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  const sync = createLensSync(triggerRebuild);
  const L_RANGE = new Range(SEGMENT_LENGTH_MIN, SEGMENT_LENGTH_MAX);
  const readLength = () => safeClamp(segmentLength(element.p1, element.p2), L_RANGE.min, L_RANGE.max, 1.0);
  const lenProperty = new NumberProperty(readLength(), { range: L_RANGE, tandem: Tandem.OPTIONAL });
  lenProperty.lazyLink(
    sync.fromSlider((v) => {
      const resized = resizeSegment(element.p1, element.p2, v);
      element.p1 = resized.p1;
      element.p2 = resized.p2;
      const { d, r1, r2 } = element.getDR1R2();
      element.createLensWithDR1R2(d, r1, r2);
    }),
  );

  const { control: angleControl, refresh: refreshAngle } = buildSphericalLensAngleControl(element, triggerRebuild);
  const { surfaceControls, refreshSurfaces } = buildSurfaces(sync);
  const refreshSliders = sync.refresher(() => {
    refreshSurfaces();
    lenProperty.value = readLength();
  });

  return {
    controls: [
      ...surfaceControls,
      new NumberControl(
        controlStrings.lengthStringProperty,
        lenProperty,
        L_RANGE,
        numberControlOptions(0.05, 2, Tandem.OPTIONAL),
      ),
      angleControl,
      buildRefractiveIndexControl(element, triggerRebuild),
    ],
    refreshCallback: () => {
      refreshSliders();
      refreshAngle();
    },
  };
}

/** A NumberProperty that tracks `read()` and writes through `apply` under the lens sync guard. */
function surfaceProperty(
  range: Range,
  read: () => number,
  apply: (v: number) => void,
  sync: LensSync,
): { property: NumberProperty; refresh: () => void } {
  const property = new NumberProperty(read(), { range, tandem: Tandem.OPTIONAL });
  property.lazyLink(sync.fromSlider(apply));
  return {
    property,
    refresh: () => {
      property.value = read();
    },
  };
}

// ── Exported builders ─────────────────────────────────────────────────────────

export function buildSphericalLensControls(
  element: SphericalLens,
  triggerRebuild: () => void,
  signConvention: SignConvention,
  useCurvatureDisplay: boolean,
): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  // In Real-is-Positive mode, R₂ is negated for display.
  const isRIP = signConvention === "realIsPositive";
  const displayR2 = (r2: number): number => (isRIP ? -r2 : r2);

  return assembleLensControls(element, triggerRebuild, (sync) => {
    if (useCurvatureDisplay) {
      // Curvature mode: κ = 1/R (m⁻¹). κ = 0 represents a flat surface (R = ∞).
      const K_RANGE = new Range(SPHERICAL_CURVATURE_MIN, SPHERICAL_CURVATURE_MAX);
      const toKappa = (r: number): number => (Number.isFinite(r) && r !== 0 ? 1 / r : 0);
      const toRadius = (k: number): number => (k === 0 ? Infinity : 1 / k);
      const k1 = surfaceProperty(
        K_RANGE,
        () => safeClamp(toKappa(element.getDR1R2().r1), K_RANGE.min, K_RANGE.max, toKappa(SPHERICAL_R1_FALLBACK)),
        (kappa) => {
          element.applyRadiusKeepingCorners("r1", toRadius(kappa));
        },
        sync,
      );
      const k2 = surfaceProperty(
        K_RANGE,
        () =>
          safeClamp(
            toKappa(displayR2(element.getDR1R2().r2)),
            K_RANGE.min,
            K_RANGE.max,
            toKappa(SPHERICAL_R2_FALLBACK),
          ),
        (kappa) => {
          // In RIP mode the slider holds κ(-R₂_model); apply sign inversion.
          element.applyRadiusKeepingCorners("r2", toRadius(isRIP ? -kappa : kappa));
        },
        sync,
      );
      const k2Label = isRIP
        ? controlStrings.kappa2RightRIPStringProperty
        : controlStrings.kappa2RightSurfaceStringProperty;
      return {
        surfaceControls: [
          new NumberControl(
            controlStrings.kappa1LeftSurfaceStringProperty,
            k1.property,
            K_RANGE,
            numberControlOptions(0.05, 2, Tandem.OPTIONAL),
          ),
          new NumberControl(k2Label, k2.property, K_RANGE, numberControlOptions(0.05, 2, Tandem.OPTIONAL)),
        ],
        refreshSurfaces: () => {
          k1.refresh();
          k2.refresh();
        },
      };
    }

    // Radius mode (default). Each slider moves only its arc apex, like the curvature drag handles.
    const R_RANGE = new Range(SPHERICAL_RADIUS_MIN, SPHERICAL_RADIUS_MAX);
    const r1 = surfaceProperty(
      R_RANGE,
      () => safeClamp(element.getDR1R2().r1, R_RANGE.min, R_RANGE.max, SPHERICAL_R1_FALLBACK),
      (v) => {
        element.applyRadiusKeepingCorners("r1", v);
      },
      sync,
    );
    const r2 = surfaceProperty(
      R_RANGE,
      () => safeClamp(displayR2(element.getDR1R2().r2), R_RANGE.min, R_RANGE.max, SPHERICAL_R2_FALLBACK),
      (v) => {
        // In RIP mode the slider holds −R₂_model; invert before storing.
        element.applyRadiusKeepingCorners("r2", isRIP ? -v : v);
      },
      sync,
    );
    const r2Label = isRIP ? controlStrings.r2RightRIPStringProperty : controlStrings.r2RightSurfaceStringProperty;
    return {
      surfaceControls: [
        new NumberControl(
          controlStrings.r1LeftSurfaceStringProperty,
          r1.property,
          R_RANGE,
          numberControlOptions(0.1, 1, Tandem.OPTIONAL),
        ),
        new NumberControl(r2Label, r2.property, R_RANGE, numberControlOptions(0.1, 1, Tandem.OPTIONAL)),
      ],
      refreshSurfaces: () => {
        r1.refresh();
        r2.refresh();
      },
    };
  });
}

/**
 * Controls for a lens with one adjustable surface radius whose sign is fixed
 * by the lens type. The slider shows the positive magnitude (or curvature
 * 1/|R|); the stored radius keeps the sign it had when the panel opened.
 */
function buildFixedSignSurfaceControls(
  element: SphericalLens,
  triggerRebuild: () => void,
  surface: "r1" | "r2",
  fallbackRadius: number,
  useCurvatureDisplay: boolean,
): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  const sign: 1 | -1 = element.getDR1R2()[surface] >= 0 ? 1 : -1;
  const readMagnitude = () => sign * element.getDR1R2()[surface];

  return assembleLensControls(element, triggerRebuild, (sync) => {
    // Curvature mode shows κ = 1/|R|; radius mode shows |R|. Both keep the fixed sign.
    const mode = useCurvatureDisplay
      ? {
          range: new Range(CONSTRAINED_CURVATURE_MIN, CONSTRAINED_CURVATURE_MAX),
          toDisplay: (magnitude: number) => 1 / magnitude,
          toRadius: (kappa: number) => sign / kappa,
          fallback: 1 / Math.abs(fallbackRadius),
          label: controlStrings.curvatureStringProperty,
          options: numberControlOptions(0.01, 2, Tandem.OPTIONAL),
        }
      : {
          range: new Range(CONSTRAINED_LENS_RADIUS_MIN, SPHERICAL_RADIUS_MAX),
          toDisplay: (magnitude: number) => magnitude,
          toRadius: (v: number) => sign * v,
          fallback: Math.abs(fallbackRadius),
          label: controlStrings.radiusOfCurvatureStringProperty,
          options: numberControlOptions(0.1, 1, Tandem.OPTIONAL),
        };
    const { range } = mode;
    const slider = surfaceProperty(
      range,
      () => safeClamp(mode.toDisplay(readMagnitude()), range.min, range.max, mode.fallback),
      (v) => {
        element.applyRadiusKeepingCorners(surface, mode.toRadius(v));
      },
      sync,
    );
    return {
      surfaceControls: [new NumberControl(mode.label, slider.property, range, mode.options)],
      refreshSurfaces: slider.refresh,
    };
  });
}

/**
 * Controls for symmetric lenses (BiconvexLens, BiconcaveLens).
 * Shows a single "Radius of Curvature" slider (positive magnitude) instead of
 * separate R₁ / R₂ sliders, since both surfaces are always equal-magnitude.
 * The sign is fixed by lens type (r1 > 0 biconvex, r1 < 0 biconcave).
 */
export function buildSymmetricLensControls(
  element: SphericalLens,
  triggerRebuild: () => void,
  _signConvention: SignConvention,
  useCurvatureDisplay: boolean,
): EditControlsResult {
  return buildFixedSignSurfaceControls(element, triggerRebuild, "r1", SPHERICAL_R1_FALLBACK, useCurvatureDisplay);
}

/**
 * Controls for plano lenses (PlanoConvexLens, PlanoConcaveLens).
 * Shows only the R₂ (curved surface) slider — the R₁ surface is always flat
 * (Infinity) and is not user-adjustable. The sign is fixed by lens type
 * (r2 < 0 plano-convex, r2 > 0 plano-concave).
 */
export function buildPlanoLensControls(
  element: SphericalLens,
  triggerRebuild: () => void,
  _signConvention: SignConvention,
  useCurvatureDisplay: boolean,
): EditControlsResult {
  return buildFixedSignSurfaceControls(element, triggerRebuild, "r2", SPHERICAL_R2_FALLBACK, useCurvatureDisplay);
}

export function buildIdealLensControls(element: IdealLens, triggerRebuild: () => void): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  const { control: lenControl, refresh: refreshLen } = buildSegmentLengthControl(
    element,
    controlStrings.lengthStringProperty,
    triggerRebuild,
    Tandem.OPTIONAL,
  );
  const { control: angleControl, refresh: refreshAngle } = buildSegmentAngleControl(
    element,
    controlStrings.angleStringProperty,
    triggerRebuild,
    Tandem.OPTIONAL,
  );
  return {
    controls: [
      makeControl(
        controlStrings.focalLengthStringProperty,
        element.focalLength,
        new Range(FOCAL_LENGTH_MIN_M, FOCAL_LENGTH_MAX_M),
        0.1,
        (v) => {
          element.focalLength = v;
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
      lenControl,
      angleControl,
    ],
    refreshCallback: () => {
      refreshLen?.();
      refreshAngle();
    },
  };
}

/** Refractive index + angle + length for HalfPlaneGlass (boundary segment p1–p2). */
export function buildHalfPlaneGlassControls(element: HalfPlaneGlass, triggerRebuild: () => void): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  const { control: angleControl, refresh: refreshAngle } = buildSegmentAngleControl(
    element,
    controlStrings.angleStringProperty,
    triggerRebuild,
    Tandem.OPTIONAL,
  );
  const { control: lenControl, refresh: refreshLength } = buildSegmentLengthControl(
    element,
    controlStrings.lengthStringProperty,
    triggerRebuild,
    Tandem.OPTIONAL,
  );
  return {
    controls: [buildRefractiveIndexControl(element, triggerRebuild), angleControl, lenControl],
    refreshCallback: () => {
      refreshAngle();
      refreshLength();
    },
  };
}

/** Generic refractive-index-only control for plain Glass / CircleGlass / HalfPlaneGlass. */
export function buildRefractiveIndexControls(element: BaseGlass, triggerRebuild: () => void): EditControlsResult {
  return { controls: [buildRefractiveIndexControl(element, triggerRebuild)], refreshCallback: null };
}

/** Size + angle + refractive index for a fixed-shape path prism. */
function buildPathPrismControls(
  element: BaseGlass & { path: GlassPathPoint[] },
  sizeLabel: ReadOnlyProperty<string>,
  size: number,
  setSize: (v: number) => void,
  triggerRebuild: () => void,
): EditControlsResult {
  const { control: angleControl, refresh: refreshAngle } = buildGlassPrismAngleControl(element.path, triggerRebuild);
  return {
    controls: [
      makeControl(
        sizeLabel,
        size,
        new Range(PRISM_SIZE_MIN_M, PRISM_SIZE_MAX_M),
        PRISM_SIZE_DELTA,
        setSize,
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
      angleControl,
      buildRefractiveIndexControl(element, triggerRebuild),
    ],
    refreshCallback: refreshAngle,
  };
}

export function buildEquilateralPrismControls(
  element: EquilateralPrism,
  triggerRebuild: () => void,
): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  return buildPathPrismControls(
    element,
    controlStrings.sizeStringProperty,
    element.size,
    (v) => {
      element.setSize(v);
    },
    triggerRebuild,
  );
}

export function buildRightAnglePrismControls(element: RightAnglePrism, triggerRebuild: () => void): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  return buildPathPrismControls(
    element,
    controlStrings.legLengthStringProperty,
    element.legLength,
    (v) => {
      element.setLegLength(v);
    },
    triggerRebuild,
  );
}

export function buildPorroPrismControls(element: PorroPrism, triggerRebuild: () => void): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  return buildPathPrismControls(
    element,
    controlStrings.legLengthStringProperty,
    element.legLength,
    (v) => {
      element.setLegLength(v);
    },
    triggerRebuild,
  );
}

/** Width + height + angle + refractive index for a DimensionalGlass element. */
function buildDimensionalGlassControls(
  element: SlabGlass | ParallelogramPrism | DovePrism,
  triggerRebuild: () => void,
): EditControlsResult {
  const controlStrings = StringManager.getInstance().getControlStrings();
  const { control: angleControl, refresh: refreshAngle } = buildDimensionalGlassAngleControl(element, triggerRebuild);
  return {
    controls: [
      makeControl(
        controlStrings.widthStringProperty,
        element.width,
        new Range(DIMENSIONAL_GLASS_WIDTH_MIN_M, DIMENSIONAL_GLASS_WIDTH_MAX_M),
        DIMENSIONAL_GLASS_SIZE_DELTA,
        (v) => {
          element.setWidth(v);
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
      makeControl(
        controlStrings.heightStringProperty,
        element.height,
        new Range(DIMENSIONAL_GLASS_HEIGHT_MIN_M, DIMENSIONAL_GLASS_HEIGHT_MAX_M),
        DIMENSIONAL_GLASS_SIZE_DELTA,
        (v) => {
          element.setHeight(v);
        },
        triggerRebuild,
        Tandem.OPTIONAL,
      ),
      angleControl,
      buildRefractiveIndexControl(element, triggerRebuild),
    ],
    refreshCallback: refreshAngle,
  };
}

export function buildSlabGlassControls(element: SlabGlass, triggerRebuild: () => void): EditControlsResult {
  return buildDimensionalGlassControls(element, triggerRebuild);
}

export function buildParallelogramPrismControls(
  element: ParallelogramPrism,
  triggerRebuild: () => void,
): EditControlsResult {
  return buildDimensionalGlassControls(element, triggerRebuild);
}

export function buildDovePrismControls(element: DovePrism, triggerRebuild: () => void): EditControlsResult {
  return buildDimensionalGlassControls(element, triggerRebuild);
}
