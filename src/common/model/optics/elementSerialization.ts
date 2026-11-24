/**
 * Deserialization of optical elements from plain objects (saved scenes, PhET-iO state).
 *
 * Most element types follow a uniform pattern: validate a fixed set of point/number
 * fields, call the constructor, and restore the serialized ID.  These are handled
 * data-driven via the DEFS map so that adding a new element type only requires
 * one schema entry.  The four special cases (Glass, SphericalLens, DetectorElement,
 * FiberOpticElement) keep explicit code because they have irregular validation or
 * post-construction steps that do not fit the shared loop.
 */

import { ARCHETYPE_DEFAULT_WAVELENGTH_NM, DEFAULT_BEAM_BRIGHTNESS } from "../../../OpticsLabConstants.js";
import {
  ELEMENT_TYPE_APERTURE,
  ELEMENT_TYPE_APERTURED_PARABOLIC_MIRROR,
  ELEMENT_TYPE_ARC_MIRROR,
  ELEMENT_TYPE_ARC_SOURCE,
  ELEMENT_TYPE_BEAM,
  ELEMENT_TYPE_BEAM_SPLITTER,
  ELEMENT_TYPE_BICONCAVE_LENS,
  ELEMENT_TYPE_BICONVEX_LENS,
  ELEMENT_TYPE_CIRCLE_GLASS,
  ELEMENT_TYPE_CONTINUOUS_SPECTRUM_SOURCE,
  ELEMENT_TYPE_DETECTOR,
  ELEMENT_TYPE_DIVERGENT_BEAM,
  ELEMENT_TYPE_DOVE_PRISM,
  ELEMENT_TYPE_EQUILATERAL_PRISM,
  ELEMENT_TYPE_FIBER_OPTIC,
  ELEMENT_TYPE_GLASS,
  ELEMENT_TYPE_IDEAL_LENS,
  ELEMENT_TYPE_IDEAL_MIRROR,
  ELEMENT_TYPE_LINE_BLOCKER,
  ELEMENT_TYPE_PARABOLIC_MIRROR,
  ELEMENT_TYPE_PARALLELOGRAM_PRISM,
  ELEMENT_TYPE_PLANE_GLASS,
  ELEMENT_TYPE_PLANO_CONCAVE_LENS,
  ELEMENT_TYPE_PLANO_CONVEX_LENS,
  ELEMENT_TYPE_POINT_SOURCE,
  ELEMENT_TYPE_PORRO_PRISM,
  ELEMENT_TYPE_REFLECTION_GRATING,
  ELEMENT_TYPE_RIGHT_ANGLE_PRISM,
  ELEMENT_TYPE_SEGMENT_MIRROR,
  ELEMENT_TYPE_SINGLE_RAY,
  ELEMENT_TYPE_SLAB_GLASS,
  ELEMENT_TYPE_SPHERICAL_LENS,
  ELEMENT_TYPE_TRACK,
  ELEMENT_TYPE_TRANSMISSION_GRATING,
} from "../../../OpticsLabStrings.js";
import { ApertureElement } from "../blockers/ApertureElement.js";
import { LineBlocker } from "../blockers/LineBlocker.js";
import { DetectorElement } from "../detectors/DetectorElement.js";
import { FiberOpticElement } from "../fiber/FiberOpticElement.js";
import { BiconcaveLens } from "../glass/BiconcaveLens.js";
import { BiconvexLens } from "../glass/BiconvexLens.js";
import { CircleGlass } from "../glass/CircleGlass.js";
import { DovePrism } from "../glass/DovePrism.js";
import { EquilateralPrism } from "../glass/EquilateralPrism.js";
import type { GlassPathPoint } from "../glass/Glass.js";
import { Glass } from "../glass/Glass.js";
import { HalfPlaneGlass } from "../glass/HalfPlaneGlass.js";
import { IdealLens } from "../glass/IdealLens.js";
import { ParallelogramPrism } from "../glass/ParallelogramPrism.js";
import { PlanoConcaveLens } from "../glass/PlanoConcaveLens.js";
import { PlanoConvexLens } from "../glass/PlanoConvexLens.js";
import { PorroPrism } from "../glass/PorroPrism.js";
import { RightAnglePrism } from "../glass/RightAnglePrism.js";
import { SlabGlass } from "../glass/SlabGlass.js";
import { SphericalLens } from "../glass/SphericalLens.js";
import { ReflectionGrating } from "../gratings/ReflectionGrating.js";
import { TransmissionGrating } from "../gratings/TransmissionGrating.js";
import { TrackElement } from "../guides/TrackElement.js";
import { ArcLightSource } from "../light-sources/ArcLightSource.js";
import { BeamSource } from "../light-sources/BeamSource.js";
import { ContinuousSpectrumSource } from "../light-sources/ContinuousSpectrumSource.js";
import { DivergentBeam } from "../light-sources/DivergentBeam.js";
import { PointSourceElement } from "../light-sources/PointSourceElement.js";
import { SingleRaySource } from "../light-sources/SingleRaySource.js";
import { AperturedParabolicMirror } from "../mirrors/AperturedParabolicMirror.js";
import { ArcMirror } from "../mirrors/ArcMirror.js";
import { BeamSplitterElement } from "../mirrors/BeamSplitterElement.js";
import { IdealCurvedMirror } from "../mirrors/IdealCurvedMirror.js";
import { ParabolicMirror } from "../mirrors/ParabolicMirror.js";
import { SegmentMirror } from "../mirrors/SegmentMirror.js";
import { BaseElement } from "./BaseElement.js";
import type { Point } from "./Geometry.js";
import { point } from "./Geometry.js";
import type { OpticalElement } from "./OpticsTypes.js";

/** Default serialized shape for the PhET-iO group archetype (PointSource). */
export const ARCHETYPE_ELEMENT_STATE: Record<string, unknown> = {
  type: ELEMENT_TYPE_POINT_SOURCE,
  x: 0,
  y: 0,
  brightness: DEFAULT_BEAM_BRIGHTNESS,
  wavelength: ARCHETYPE_DEFAULT_WAVELENGTH_NM,
  id: "archetype",
};

/** Internal key: live model reference when adding an element without round-trip clone. */
export const LIVE_ELEMENT_STATE_KEY = "__opticsLabLiveElement__";

// ── Validation helpers ────────────────────────────────────────────────────────

function asPoint(v: unknown, field: string): Point {
  if (typeof v !== "object" || v === null || !("x" in v) || !("y" in v)) {
    throw new Error(`Invalid point at field "${field}"`);
  }
  return point(asNumber(v.x, `${field}.x`), asNumber(v.y, `${field}.y`));
}

function asNumber(v: unknown, field: string, min?: number, max?: number): number {
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new Error(`Invalid number at field "${field}": ${JSON.stringify(v)}`);
  }
  if (min !== undefined && v < min) {
    throw new Error(`Value at field "${field}" (${v}) is below minimum ${min}`);
  }
  if (max !== undefined && v > max) {
    throw new Error(`Value at field "${field}" (${v}) exceeds maximum ${max}`);
  }
  return v;
}

/**
 * Parse a radius-of-curvature field. Flat surfaces are represented as
 * ±Infinity in the model, which JSON.stringify serializes as null — so
 * null/undefined and non-finite numbers are all restored as Infinity.
 * A zero radius is invalid (degenerate surface).
 */
function asRadius(v: unknown, field: string): number {
  if (v === null || v === undefined) {
    return Infinity;
  }
  if (typeof v !== "number" || Number.isNaN(v)) {
    throw new Error(`Invalid radius at field "${field}": ${JSON.stringify(v)}`);
  }
  if (v === 0) {
    throw new Error(`Radius at field "${field}" must not be zero`);
  }
  return v;
}

function assignElementId(element: OpticalElement, rawId: unknown): void {
  if (typeof rawId === "string" && element instanceof BaseElement) {
    element.reassignIdForDeserialization(rawId);
  }
}

/** Minimum allowed refractive index (must be strictly positive and non-zero). */
const REF_INDEX_MIN = 1e-9;

type ElementDecoder = (raw: Record<string, unknown>) => OpticalElement;

const decodeContinuousSpectrum: ElementDecoder = (raw) => {
  const p1 = asPoint(raw["p1"], "p1");
  const p2 = asPoint(raw["p2"], "p2");
  const wavelengthMin = asNumber(raw["wavelengthMin"], "wavelengthMin", 0);
  const wavelengthStep = asNumber(raw["wavelengthStep"], "wavelengthStep", 0);
  const wavelengthMax = asNumber(raw["wavelengthMax"], "wavelengthMax", 0);
  const brightness = asNumber(raw["brightness"], "brightness", 0);
  return new ContinuousSpectrumSource(p1, p2, wavelengthMin, wavelengthStep, wavelengthMax, brightness);
};

const elementDecoders = new Map<string, ElementDecoder>([
  // ── Light sources ────────────────────────────────────────────────────────
  [
    ELEMENT_TYPE_POINT_SOURCE,
    (raw) => {
      const x = asNumber(raw["x"], "x");
      const y = asNumber(raw["y"], "y");
      const brightness = asNumber(raw["brightness"], "brightness", 0);
      const wavelength = asNumber(raw["wavelength"], "wavelength", 0);
      return new PointSourceElement(point(x, y), brightness, wavelength);
    },
  ],
  [
    ELEMENT_TYPE_BEAM,
    (raw) => {
      const p1 = asPoint(raw["p1"], "p1");
      const p2 = asPoint(raw["p2"], "p2");
      const brightness = asNumber(raw["brightness"], "brightness", 0);
      const wavelength = asNumber(raw["wavelength"], "wavelength", 0);
      return new BeamSource(p1, p2, brightness, wavelength);
    },
  ],
  [
    ELEMENT_TYPE_DIVERGENT_BEAM,
    (raw) => {
      const p1 = asPoint(raw["p1"], "p1");
      const p2 = asPoint(raw["p2"], "p2");
      const brightness = asNumber(raw["brightness"], "brightness", 0);
      const wavelength = asNumber(raw["wavelength"], "wavelength", 0);
      const emisAngle = asNumber(raw["emisAngle"], "emisAngle", 0);
      return new DivergentBeam(p1, p2, brightness, wavelength, emisAngle);
    },
  ],
  [
    ELEMENT_TYPE_SINGLE_RAY,
    (raw) => {
      const p1 = asPoint(raw["p1"], "p1");
      const p2 = asPoint(raw["p2"], "p2");
      const brightness = asNumber(raw["brightness"], "brightness", 0);
      const wavelength = asNumber(raw["wavelength"], "wavelength", 0);
      return new SingleRaySource(p1, p2, brightness, wavelength);
    },
  ],
  [
    ELEMENT_TYPE_ARC_SOURCE,
    (raw) => {
      const x = asNumber(raw["x"], "x");
      const y = asNumber(raw["y"], "y");
      const direction = asNumber(raw["direction"], "direction");
      const emissionAngle = asNumber(raw["emissionAngle"], "emissionAngle", 0);
      const brightness = asNumber(raw["brightness"], "brightness", 0);
      const wavelength = asNumber(raw["wavelength"], "wavelength", 0);
      return new ArcLightSource(point(x, y), direction, emissionAngle, brightness, wavelength);
    },
  ],
  [ELEMENT_TYPE_CONTINUOUS_SPECTRUM_SOURCE, decodeContinuousSpectrum],
  // Legacy camelCase key written by versions prior to the PascalCase rename.
  ["continuousSpectrumSource", decodeContinuousSpectrum],

  // ── Mirrors ──────────────────────────────────────────────────────────────
  [
    ELEMENT_TYPE_SEGMENT_MIRROR,
    (raw) => {
      const p1 = asPoint(raw["p1"], "p1");
      const p2 = asPoint(raw["p2"], "p2");
      return new SegmentMirror(p1, p2);
    },
  ],
  [
    ELEMENT_TYPE_ARC_MIRROR,
    (raw) => {
      const p1 = asPoint(raw["p1"], "p1");
      const p2 = asPoint(raw["p2"], "p2");
      const p3 = asPoint(raw["p3"], "p3");
      return new ArcMirror(p1, p2, p3);
    },
  ],
  [
    ELEMENT_TYPE_PARABOLIC_MIRROR,
    (raw) => {
      const p1 = asPoint(raw["p1"], "p1");
      const p2 = asPoint(raw["p2"], "p2");
      const p3 = asPoint(raw["p3"], "p3");
      return new ParabolicMirror(p1, p2, p3);
    },
  ],
  [
    ELEMENT_TYPE_IDEAL_MIRROR,
    (raw) => {
      const p1 = asPoint(raw["p1"], "p1");
      const p2 = asPoint(raw["p2"], "p2");
      const focalLength = asNumber(raw["focalLength"], "focalLength");
      return new IdealCurvedMirror(p1, p2, focalLength);
    },
  ],
  [
    ELEMENT_TYPE_BEAM_SPLITTER,
    (raw) => {
      const p1 = asPoint(raw["p1"], "p1");
      const p2 = asPoint(raw["p2"], "p2");
      const transRatio = asNumber(raw["transRatio"], "transRatio", 0, 1);
      return new BeamSplitterElement(p1, p2, transRatio);
    },
  ],
  [
    ELEMENT_TYPE_APERTURED_PARABOLIC_MIRROR,
    (raw) => {
      const p1 = asPoint(raw["p1"], "p1");
      const p2 = asPoint(raw["p2"], "p2");
      const p3 = asPoint(raw["p3"], "p3");
      const apertureHalfWidth = asNumber(raw["apertureHalfWidth"], "apertureHalfWidth", 0);
      return new AperturedParabolicMirror(p1, p2, p3, apertureHalfWidth);
    },
  ],

  // ── Prisms & glass ───────────────────────────────────────────────────────
  [
    ELEMENT_TYPE_EQUILATERAL_PRISM,
    (raw) => {
      const cx = asNumber(raw["cx"], "cx");
      const cy = asNumber(raw["cy"], "cy");
      const size = asNumber(raw["size"], "size", 0);
      const refIndex = asNumber(raw["refIndex"], "refIndex", REF_INDEX_MIN);
      return new EquilateralPrism(point(cx, cy), size, refIndex);
    },
  ],
  [
    ELEMENT_TYPE_RIGHT_ANGLE_PRISM,
    (raw) => {
      const cx = asNumber(raw["cx"], "cx");
      const cy = asNumber(raw["cy"], "cy");
      const legLength = asNumber(raw["legLength"], "legLength", 0);
      const refIndex = asNumber(raw["refIndex"], "refIndex", REF_INDEX_MIN);
      return new RightAnglePrism(point(cx, cy), legLength, refIndex);
    },
  ],
  [
    ELEMENT_TYPE_PORRO_PRISM,
    (raw) => {
      const cx = asNumber(raw["cx"], "cx");
      const cy = asNumber(raw["cy"], "cy");
      const legLength = asNumber(raw["legLength"], "legLength", 0);
      const refIndex = asNumber(raw["refIndex"], "refIndex", REF_INDEX_MIN);
      return new PorroPrism(point(cx, cy), legLength, refIndex);
    },
  ],
  [
    ELEMENT_TYPE_SLAB_GLASS,
    (raw) => {
      const cx = asNumber(raw["cx"], "cx");
      const cy = asNumber(raw["cy"], "cy");
      const width = asNumber(raw["width"], "width", 0);
      const height = asNumber(raw["height"], "height", 0);
      const refIndex = asNumber(raw["refIndex"], "refIndex", REF_INDEX_MIN);
      const rotation = raw["rotation"] === undefined ? undefined : asNumber(raw["rotation"], "rotation");
      const element = new SlabGlass(point(cx, cy), width, height, refIndex);
      if (rotation !== undefined && rotation !== 0) {
        element.setRotation(rotation);
      }
      return element;
    },
  ],
  [
    ELEMENT_TYPE_PARALLELOGRAM_PRISM,
    (raw) => {
      const cx = asNumber(raw["cx"], "cx");
      const cy = asNumber(raw["cy"], "cy");
      const width = asNumber(raw["width"], "width", 0);
      const height = asNumber(raw["height"], "height", 0);
      const refIndex = asNumber(raw["refIndex"], "refIndex", REF_INDEX_MIN);
      const rotation = raw["rotation"] === undefined ? undefined : asNumber(raw["rotation"], "rotation");
      const element = new ParallelogramPrism(point(cx, cy), width, height, refIndex);
      if (rotation !== undefined && rotation !== 0) {
        element.setRotation(rotation);
      }
      return element;
    },
  ],
  [
    ELEMENT_TYPE_DOVE_PRISM,
    (raw) => {
      const cx = asNumber(raw["cx"], "cx");
      const cy = asNumber(raw["cy"], "cy");
      const width = asNumber(raw["width"], "width", 0);
      const height = asNumber(raw["height"], "height", 0);
      const refIndex = asNumber(raw["refIndex"], "refIndex", REF_INDEX_MIN);
      const rotation = raw["rotation"] === undefined ? undefined : asNumber(raw["rotation"], "rotation");
      const element = new DovePrism(point(cx, cy), width, height, refIndex);
      if (rotation !== undefined && rotation !== 0) {
        element.setRotation(rotation);
      }
      return element;
    },
  ],
  [
    ELEMENT_TYPE_CIRCLE_GLASS,
    (raw) => {
      const p1 = asPoint(raw["p1"], "p1");
      const p2 = asPoint(raw["p2"], "p2");
      const refIndex = asNumber(raw["refIndex"], "refIndex", REF_INDEX_MIN);
      return new CircleGlass(p1, p2, refIndex);
    },
  ],
  [
    ELEMENT_TYPE_PLANE_GLASS,
    (raw) => {
      const p1 = asPoint(raw["p1"], "p1");
      const p2 = asPoint(raw["p2"], "p2");
      const refIndex = asNumber(raw["refIndex"], "refIndex", REF_INDEX_MIN);
      return new HalfPlaneGlass(p1, p2, refIndex);
    },
  ],
  [
    ELEMENT_TYPE_IDEAL_LENS,
    (raw) => {
      const p1 = asPoint(raw["p1"], "p1");
      const p2 = asPoint(raw["p2"], "p2");
      const focalLength = asNumber(raw["focalLength"], "focalLength");
      if (focalLength === 0) {
        throw new Error("focalLength must not be zero");
      }
      return new IdealLens(p1, p2, focalLength);
    },
  ],

  // ── Blockers ─────────────────────────────────────────────────────────────
  [
    ELEMENT_TYPE_APERTURE,
    (raw) => {
      const p1 = asPoint(raw["p1"], "p1");
      const p2 = asPoint(raw["p2"], "p2");
      const p3 = asPoint(raw["p3"], "p3");
      const p4 = asPoint(raw["p4"], "p4");
      return new ApertureElement(p1, p2, p3, p4);
    },
  ],
  [
    ELEMENT_TYPE_LINE_BLOCKER,
    (raw) => {
      const p1 = asPoint(raw["p1"], "p1");
      const p2 = asPoint(raw["p2"], "p2");
      return new LineBlocker(p1, p2);
    },
  ],

  // ── Gratings ─────────────────────────────────────────────────────────────
  [
    ELEMENT_TYPE_REFLECTION_GRATING,
    (raw) => {
      const p1 = asPoint(raw["p1"], "p1");
      const p2 = asPoint(raw["p2"], "p2");
      const linesDensity = asNumber(raw["linesDensity"], "linesDensity", 0);
      const dutyCycle = asNumber(raw["dutyCycle"], "dutyCycle", 1e-9, 1 - 1e-9);
      return new ReflectionGrating(p1, p2, linesDensity, dutyCycle);
    },
  ],
  [
    ELEMENT_TYPE_TRANSMISSION_GRATING,
    (raw) => {
      const p1 = asPoint(raw["p1"], "p1");
      const p2 = asPoint(raw["p2"], "p2");
      const linesDensity = asNumber(raw["linesDensity"], "linesDensity", 0);
      const dutyCycle = asNumber(raw["dutyCycle"], "dutyCycle", 1e-9, 1 - 1e-9);
      return new TransmissionGrating(p1, p2, linesDensity, dutyCycle);
    },
  ],

  // ── Guides ───────────────────────────────────────────────────────────────
  [
    ELEMENT_TYPE_TRACK,
    (raw) => {
      const p1 = asPoint(raw["p1"], "p1");
      const p2 = asPoint(raw["p2"], "p2");
      return new TrackElement(p1, p2);
    },
  ],
]);

// ── Public entry point ────────────────────────────────────────────────────────

export function deserializeElement(obj: Record<string, unknown>): OpticalElement | null {
  const type = obj["type"];
  if (typeof type !== "string") {
    return null;
  }

  // Most element types have a dedicated decoder.
  const decode = elementDecoders.get(type);
  if (decode) {
    const element = decode(obj);
    assignElementId(element, obj["id"]);
    return element;
  }

  // Elements with alternate formats or additional state use the dedicated cases below.
  switch (type) {
    case ELEMENT_TYPE_GLASS: {
      const path = obj["path"];
      if (!Array.isArray(path) || path.length < 3) {
        throw new Error("Glass path must have at least 3 vertices");
      }
      const rawVertices: readonly unknown[] = path;
      const vertices = rawVertices.map((vertex, index): GlassPathPoint => {
        const { x, y } = asPoint(vertex, `path[${index}]`);
        if (typeof vertex !== "object" || vertex === null) {
          throw new Error(`Invalid path vertex ${index}`);
        }
        return {
          x,
          y,
          ...("arc" in vertex && typeof vertex.arc === "boolean" && { arc: vertex.arc }),
          ...("isApertureEdge" in vertex &&
            typeof vertex.isApertureEdge === "boolean" && {
              isApertureEdge: vertex.isApertureEdge,
            }),
        };
      });
      const el = new Glass(vertices, asNumber(obj["refIndex"], "refIndex", REF_INDEX_MIN));
      assignElementId(el, obj["id"]);
      return el;
    }
    case ELEMENT_TYPE_SPHERICAL_LENS:
    case ELEMENT_TYPE_BICONVEX_LENS:
    case ELEMENT_TYPE_BICONCAVE_LENS:
    case ELEMENT_TYPE_PLANO_CONVEX_LENS:
    case ELEMENT_TYPE_PLANO_CONCAVE_LENS: {
      // Radii are parsed with asRadius because flat surfaces serialize
      // Infinity → null through JSON.
      const r1 = asRadius(obj["r1"], "r1");
      const r2 = asRadius(obj["r2"], "r2");
      const d = asNumber(obj["d"], "d", 0);
      const p1 = asPoint(obj["p1"], "p1");
      const p2 = asPoint(obj["p2"], "p2");
      const refIndex = asNumber(obj["refIndex"], "refIndex", REF_INDEX_MIN);
      let lens: SphericalLens;
      if (type === ELEMENT_TYPE_BICONVEX_LENS) {
        lens = new BiconvexLens(p1, p2, Math.abs(r1), refIndex);
      } else if (type === ELEMENT_TYPE_BICONCAVE_LENS) {
        lens = new BiconcaveLens(p1, p2, Math.abs(r1), refIndex);
      } else if (type === ELEMENT_TYPE_PLANO_CONVEX_LENS) {
        lens = new PlanoConvexLens(p1, p2, Math.abs(r2), refIndex);
      } else if (type === ELEMENT_TYPE_PLANO_CONCAVE_LENS) {
        lens = new PlanoConcaveLens(p1, p2, Math.abs(r2), refIndex);
      } else {
        lens = new SphericalLens(p1, p2, r1, r2, refIndex);
      }
      // Rebuild with the serialized thickness; subclass overrides re-enforce
      // their own r1/r2 constraints, so passing both radii is safe.
      lens.createLensWithDR1R2(d, r1, r2);
      assignElementId(lens, obj["id"]);
      return lens;
    }
    case ELEMENT_TYPE_DETECTOR: {
      const p3 = obj["p3"] !== undefined ? asPoint(obj["p3"], "p3") : undefined;
      const el = new DetectorElement(asPoint(obj["p1"], "p1"), asPoint(obj["p2"], "p2"), p3);
      assignElementId(el, obj["id"]);
      return el;
    }
    case ELEMENT_TYPE_FIBER_OPTIC: {
      const claddingRefIndex = asNumber(obj["refIndex"], "refIndex", REF_INDEX_MIN);
      const coreRefIndex =
        obj["coreRefIndex"] !== undefined ? asNumber(obj["coreRefIndex"], "coreRefIndex", REF_INDEX_MIN) : undefined;
      if (coreRefIndex !== undefined && coreRefIndex <= claddingRefIndex) {
        throw new Error(
          `Fiber core refractive index (${coreRefIndex}) must exceed cladding index (${claddingRefIndex}) for total internal reflection guiding`,
        );
      }
      const el = new FiberOpticElement(
        asPoint(obj["p1"], "p1"),
        asPoint(obj["cp1"], "cp1"),
        asPoint(obj["cp2"], "cp2"),
        asPoint(obj["cp3"], "cp3"),
        asPoint(obj["p2"], "p2"),
        asNumber(obj["outerRadius"], "outerRadius", 0),
        claddingRefIndex,
        obj["coreRadiusFraction"] !== undefined
          ? asNumber(obj["coreRadiusFraction"], "coreRadiusFraction", 0, 1)
          : undefined,
        coreRefIndex,
      );
      assignElementId(el, obj["id"]);
      return el;
    }
    default:
      return null;
  }
}
