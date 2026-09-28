/**
 * opticsLabQueryParameters.ts
 *
 * Sim-specific startup query parameters. This is the single place where every
 * sim-specific query parameter is declared and documented. Public-facing
 * parameters (intended for end users / sharing links) must set `public: true`.
 *
 * ── How to add a query parameter ──────────────────────────────────────────────
 * 1. Add an entry below with a `type`, `defaultValue`, and (if user-facing)
 *    `public: true`. Add `isValidValue` to bound numeric ranges.
 * 2. If it should also be user-editable at runtime, surface it as a preference
 *    in OpticsLabPreferencesModel (initialize that Property from this query parameter).
 *
 * Usage: append e.g. `?snapToGrid=true&gridSpacing=2` to the sim URL.
 */

import { logGlobal } from "scenerystack/phet-core";
import { QueryStringMachine } from "scenerystack/query-string-machine";
import {
  DEFAULT_RAY_DENSITY,
  GRID_SPACING_M,
  GRID_SPACING_MAX_M,
  GRID_SPACING_MIN_M,
  MAX_RAY_DEPTH_PROPERTY_MAX,
  MAX_RAY_DEPTH_PROPERTY_MIN,
  QUERY_DEFAULT_MAX_RAY_DEPTH,
  RAY_DENSITY_MAX,
  RAY_DENSITY_MIN,
  RAY_STUB_LENGTH_DEFAULT_PX,
  RAY_STUB_LENGTH_MAX_PX,
  RAY_STUB_LENGTH_MIN_PX,
} from "../OpticsLabConstants.js";
import OpticsLabNamespace from "../OpticsLabNamespace.js";

const opticsLabQueryParameters = QueryStringMachine.getAll({
  /*
   add optical Fiber to the carrousel
   */
  enabledOpticalFiber: {
    type: "boolean",
    defaultValue: true,
    public: true,
  },

  /**
   * The number of steps a light ray is allowed to reflect/refract before it is considered to be lost.
   * Integer, same range as `OpticsScene.maxRayDepthProperty`.
   */
  maximumLightRayDepth: {
    type: "number" as const,
    defaultValue: QUERY_DEFAULT_MAX_RAY_DEPTH,
    isValidValue: (value: number) =>
      Number.isInteger(value) && value >= MAX_RAY_DEPTH_PROPERTY_MIN && value <= MAX_RAY_DEPTH_PROPERTY_MAX,
    public: true,
  },

  // Whether components snap to grid.
  snapToGrid: {
    type: "boolean",
    defaultValue: false,
    public: true,
  },

  // Spacing between major grid lines, in model metres (same range as preferences / scene grid size).
  gridSpacing: {
    type: "number" as const,
    defaultValue: GRID_SPACING_M,
    isValidValue: (value: number) => value >= GRID_SPACING_MIN_M && value <= GRID_SPACING_MAX_M,
    public: true,
  },

  // ── Tools panel (RayTracingCommonView) ─────────────────────────────────────

  /** Show the measuring tape at startup. */
  showMeasuringTape: {
    type: "boolean",
    defaultValue: false,
    public: true,
  },

  /** Show the protractor at startup. */
  showProtractor: {
    type: "boolean",
    defaultValue: false,
    public: true,
  },

  /** Start in extended-rays mode (vs discrete rays). */
  extendedRays: {
    type: "boolean",
    defaultValue: false,
    public: true,
  },

  /** Show drag handles on optical elements. */
  showHandles: {
    type: "boolean",
    defaultValue: true,
    public: true,
  },

  /** Show focal-point markers on lenses and mirrors. */
  showFocalMarkers: {
    type: "boolean",
    defaultValue: true,
    public: true,
  },

  /** Show directional arrowheads on ray segments at startup. */
  showRayArrows: {
    type: "boolean",
    defaultValue: false,
    public: true,
  },

  /** Enable ray-stubs mode at startup (only short stubs drawn from each ray origin). */
  showRayStubs: {
    type: "boolean",
    defaultValue: false,
    public: true,
  },

  /** Length of ray stubs in view pixels when ray-stubs mode is active. */
  rayStubLength: {
    type: "number" as const,
    defaultValue: RAY_STUB_LENGTH_DEFAULT_PX,
    isValidValue: (value: number) => value >= RAY_STUB_LENGTH_MIN_PX && value <= RAY_STUB_LENGTH_MAX_PX,
    public: true,
  },

  /** Show the background grid at startup. */
  showGrid: {
    type: "boolean",
    defaultValue: false,
    public: true,
  },

  /** Initial ray density (Tools panel slider); must lie between RAY_DENSITY_MIN and RAY_DENSITY_MAX. */
  rayDensity: {
    type: "number" as const,
    defaultValue: DEFAULT_RAY_DENSITY,
    isValidValue: (value: number) => value >= RAY_DENSITY_MIN && value <= RAY_DENSITY_MAX,
    public: true,
  },

  /** When true, flat aperture-rim edges of SphericalLens elements absorb rays instead of refracting them. */
  lensRimBlocking: {
    type: "boolean",
    defaultValue: false,
    public: true,
  },
});

OpticsLabNamespace.register("opticsLabQueryParameters", opticsLabQueryParameters);

// Log query parameters (for the console / PhET-iO).
logGlobal("phet.chipper.queryParameters");

export default opticsLabQueryParameters;
