/**
 * OpticsLabColors.ts
 *
 * Central location for all colors used in the OpticsLab simulation, providing
 * support for different color profiles (default and projector mode).
 */

import { toFixed } from "scenerystack/dot";
import { Color, ProfileColorProperty } from "scenerystack/scenery";
import OpticsLabNamespace from "./OpticsLabNamespace.js";

// ── Base colors ───────────────────────────────────────────────────────────
const BLACK = new Color(0, 0, 0);
const WHITE = new Color(255, 255, 255);

// ── ProfileColorProperty factory ──────────────────────────────────────────
const OpticsLabColors = {
  // Background
  backgroundColorProperty: new ProfileColorProperty(OpticsLabNamespace, "backgroundColor", {
    default: BLACK,
    projector: WHITE,
  }),

  // Panels
  panelFillProperty: new ProfileColorProperty(OpticsLabNamespace, "panelFill", {
    default: new Color(25, 25, 45, 0.95),
    projector: new Color(245, 245, 250, 0.98),
  }),
  panelStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "panelStroke", {
    default: new Color(120, 120, 140),
    projector: new Color(180, 180, 200),
  }),

  // Selection frame drawn around the active optical element
  selectionFrameStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "selectionFrameStroke", {
    default: new Color(255, 220, 0, 0.75),
    projector: new Color(255, 220, 0, 0.75),
  }),

  // Preferences checkboxes
  checkboxPreferencesColorProperty: new ProfileColorProperty(OpticsLabNamespace, "checkboxPreferencesColor", {
    default: new Color(40, 40, 40),
    projector: new Color(40, 40, 40),
  }),
  checkboxPreferencesColorBackgroundProperty: new ProfileColorProperty(
    OpticsLabNamespace,
    "checkboxPreferencesColorBackground",
    { default: new Color(200, 200, 220, 0.5), projector: new Color(200, 200, 220, 0.5) },
  ),
  controlPanelBackgroundColorProperty: new ProfileColorProperty(OpticsLabNamespace, "controlPanelBackgroundColor", {
    default: new Color(255, 255, 255, 0.9),
    projector: new Color(255, 255, 255, 0.9),
  }),
  controlPanelBorderColorProperty: new ProfileColorProperty(OpticsLabNamespace, "controlPanelBorderColor", {
    default: new Color(150, 150, 150),
    projector: new Color(150, 150, 150),
  }),
  controlPanelTextColorProperty: new ProfileColorProperty(OpticsLabNamespace, "controlPanelTextColor", {
    default: new Color(30, 30, 30),
    projector: new Color(30, 30, 30),
  }),

  // Preferences dialog
  preferencesTextProperty: new ProfileColorProperty(OpticsLabNamespace, "preferencesText", {
    default: BLACK,
    projector: BLACK,
  }),
  preferencesTextSecondaryProperty: new ProfileColorProperty(OpticsLabNamespace, "preferencesTextSecondary", {
    default: new Color(102, 102, 102),
    projector: new Color(80, 80, 80),
  }),

  // ── Drag handles ───────────────────────────────────────────────────────────
  handleFillProperty: new ProfileColorProperty(OpticsLabNamespace, "handleFill", {
    default: "rgba(255, 255, 255, 0.88)",
    projector: "rgba(0, 0, 0, 0.65)",
  }),
  // Stroke contrasts with fill: dark on near-white (default), light on near-black (projector).
  handleStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "handleStroke", {
    default: "#333",
    projector: "#ccc",
  }),

  // ── Mirror rendering ───────────────────────────────────────────────────────
  mirrorBackStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "mirrorBackStroke", {
    default: "#666",
    projector: "#444",
  }),
  // Front edge must stay visible on both black (default) and white (projector) backgrounds.
  mirrorFrontStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "mirrorFrontStroke", {
    default: "#d8d8d8",
    projector: "#555",
  }),
  beamSplitterBackStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "beamSplitterBackStroke", {
    default: "rgba(100, 90, 0, 0.5)",
    projector: "rgba(100, 90, 0, 0.5)",
  }),
  beamSplitterFrontStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "beamSplitterFrontStroke", {
    default: "rgba(220, 200, 60, 0.85)",
    projector: "rgba(220, 200, 60, 0.85)",
  }),
  beamSplitterIconBodyStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "beamSplitterIconBodyStroke", {
    default: "#999",
    projector: "#666",
  }),

  // ── Blocker rendering ──────────────────────────────────────────────────────
  blockerBackStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "blockerBackStroke", {
    default: "#555",
    projector: "#333",
  }),
  // Front stroke is brighter than back so the silhouette reads on the black default background.
  blockerFrontStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "blockerFrontStroke", {
    default: "#aaa",
    projector: "#111",
  }),

  // ── Detector rendering ────────────────────────────────────────────────────
  detectorBackStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "detectorBackStroke", {
    default: "#00696B",
    projector: "#004D4F",
  }),
  detectorFrontStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "detectorFrontStroke", {
    default: "#00BCD4",
    projector: "#008C9E",
  }),
  /** Red record-dot fill inside the detector Acquire RoundPushButton. */
  detectorRecordDotFillProperty: new ProfileColorProperty(OpticsLabNamespace, "detectorRecordDotFill", {
    default: "#ff0000",
    projector: "#cc0000",
  }),
  detectorChartBackgroundProperty: new ProfileColorProperty(OpticsLabNamespace, "detectorChartBackground", {
    default: "rgba(0,30,40,0.85)",
    projector: "rgba(230,240,245,0.9)",
  }),
  detectorChartBarFillProperty: new ProfileColorProperty(OpticsLabNamespace, "detectorChartBarFill", {
    default: "#00E5FF",
    projector: "#0097A7",
  }),
  detectorTickStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "detectorTickStroke", {
    default: "rgba(255,255,255,0.75)",
    projector: "rgba(0,70,80,0.8)",
  }),

  // ── Ideal optical elements ─────────────────────────────────────────────────
  idealMirrorStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "idealMirrorStroke", {
    default: "#e8c000",
    projector: "#c8a000",
  }),
  idealMirrorTickStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "idealMirrorTickStroke", {
    default: "#b89000",
    projector: "#987000",
  }),
  idealLensStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "idealLensStroke", {
    default: "#44cc88",
    projector: "#22aa66",
  }),
  idealLensArrowStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "idealLensArrowStroke", {
    default: "#ffee44",
    projector: "#ddcc00",
  }),
  alignmentMarkStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "alignmentMarkStroke", {
    default: "rgba(255,255,255,0.55)",
    projector: "rgba(0,0,0,0.40)",
  }),

  // ── Glass / lens rendering ─────────────────────────────────────────────────
  glassFillProperty: new ProfileColorProperty(OpticsLabNamespace, "glassFill", {
    default: "rgba(100, 180, 255, 0.22)",
    projector: "rgba(60, 130, 210, 0.25)",
  }),
  glassStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "glassStroke", {
    default: "rgba(60, 130, 210, 0.8)",
    projector: "rgba(60, 130, 210, 0.8)",
  }),

  // ── Fiber optic rendering ──────────────────────────────────────────────────
  /** Warm amber fill for the inner core, suggesting guided light. */
  fiberCoreFillProperty: new ProfileColorProperty(OpticsLabNamespace, "fiberCoreFill", {
    default: "rgba(255, 190, 50, 0.75)",
    projector: "rgba(220, 150, 30, 0.80)",
  }),
  fiberCoreStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "fiberCoreStroke", {
    default: "rgba(200, 140, 20, 0.6)",
    projector: "rgba(160, 100, 10, 0.6)",
  }),
  glassHatchStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "glassHatchStroke", {
    default: "rgba(60, 130, 210, 0.5)",
    projector: "rgba(60, 130, 210, 0.5)",
  }),
  prismAddFillProperty: new ProfileColorProperty(OpticsLabNamespace, "prismAddFill", {
    default: "rgba(100, 220, 100, 0.9)",
    projector: "rgba(100, 220, 100, 0.9)",
  }),
  prismAddStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "prismAddStroke", {
    default: "#2a7a2a",
    projector: "#2a7a2a",
  }),
  prismRemoveFillProperty: new ProfileColorProperty(OpticsLabNamespace, "prismRemoveFill", {
    default: "rgba(255, 120, 120, 0.9)",
    projector: "rgba(255, 120, 120, 0.9)",
  }),
  prismRemoveStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "prismRemoveStroke", {
    default: "#a03030",
    projector: "#a03030",
  }),

  // ── Spherical lens special handles ────────────────────────────────────────
  focalMarkerFillProperty: new ProfileColorProperty(OpticsLabNamespace, "focalMarkerFill", {
    default: "rgb(255,0,255)",
    projector: "rgb(180,0,180)",
  }),
  rotationHandleFillProperty: new ProfileColorProperty(OpticsLabNamespace, "rotationHandleFill", {
    default: "rgba(255, 200, 50, 0.9)",
    projector: "rgba(255, 200, 50, 0.9)",
  }),
  rotationHandleStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "rotationHandleStroke", {
    default: "#996600",
    projector: "#996600",
  }),
  rotationIndicatorStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "rotationIndicatorStroke", {
    default: "rgba(150, 120, 0, 0.7)",
    projector: "rgba(150, 120, 0, 0.7)",
  }),
  curvatureHandleFillProperty: new ProfileColorProperty(OpticsLabNamespace, "curvatureHandleFill", {
    default: "rgba(100, 220, 255, 0.9)",
    projector: "rgba(100, 220, 255, 0.9)",
  }),
  curvatureHandleStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "curvatureHandleStroke", {
    default: "#006090",
    projector: "#006090",
  }),

  // ── Arc / point light source ───────────────────────────────────────────────
  arcSourceGlowFillProperty: new ProfileColorProperty(OpticsLabNamespace, "arcSourceGlowFill", {
    default: "rgba(255, 220, 80, 0.28)",
    projector: "rgba(255, 220, 80, 0.28)",
  }),
  arcSourceGlowStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "arcSourceGlowStroke", {
    default: "rgba(255, 220, 80, 0.90)",
    projector: "rgba(255, 220, 80, 0.90)",
  }),
  arcSourceSectorFillProperty: new ProfileColorProperty(OpticsLabNamespace, "arcSourceSectorFill", {
    default: "rgba(255, 215, 60, 0.13)",
    projector: "rgba(255, 215, 60, 0.13)",
  }),
  arcSourceSectorStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "arcSourceSectorStroke", {
    default: "rgba(255, 215, 60, 0.65)",
    projector: "rgba(255, 215, 60, 0.65)",
  }),
  arcSourceRimStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "arcSourceRimStroke", {
    default: "rgba(255, 215, 60, 0.25)",
    projector: "rgba(255, 215, 60, 0.25)",
  }),
  arcSourceBoundaryStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "arcSourceBoundaryStroke", {
    default: "rgba(255, 215, 60, 0.55)",
    projector: "rgba(255, 215, 60, 0.55)",
  }),
  arcSourceSpokeStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "arcSourceSpokeStroke", {
    default: "rgba(255, 210, 60, 0.55)",
    projector: "rgba(255, 210, 60, 0.55)",
  }),

  // ── Direction indicators (wavelength-independent sources) ──────────────────
  sourceDirLineStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "sourceDirLineStroke", {
    default: "rgba(255,255,255,0.70)",
    projector: "rgba(0,0,0,0.50)",
  }),
  sourceDirArrowStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "sourceDirArrowStroke", {
    default: "rgba(255,255,255,0.90)",
    projector: "rgba(0,0,0,0.70)",
  }),

  // ── Grid ───────────────────────────────────────────────────────────────────
  gridLineStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "gridLineStroke", {
    default: "rgba(255,255,255,0.15)",
    projector: "rgba(0,0,0,0.15)",
  }),

  // ── Overlay UI (panels, labels on dark/light background) ──────────────────
  overlayLabelFillProperty: new ProfileColorProperty(OpticsLabNamespace, "overlayLabelFill", {
    default: "#bbb",
    projector: "#444",
  }),
  comboBoxHighlightFillProperty: new ProfileColorProperty(OpticsLabNamespace, "comboBoxHighlightFill", {
    default: new Color(80, 100, 180, 0.55),
    projector: new Color(60, 90, 200, 0.2),
  }),
  overlayValueFillProperty: new ProfileColorProperty(OpticsLabNamespace, "overlayValueFill", {
    default: "#eee",
    projector: "#111",
  }),
  overlayInputBackgroundProperty: new ProfileColorProperty(OpticsLabNamespace, "overlayInputBackground", {
    default: "rgba(0,0,0,0.35)",
    projector: "rgba(0,0,0,0.08)",
  }),
  overlayInputBorderProperty: new ProfileColorProperty(OpticsLabNamespace, "overlayInputBorder", {
    default: "rgba(100,100,120,0.6)",
    projector: "rgba(100,100,120,0.6)",
  }),
  deleteButtonBaseColorProperty: new ProfileColorProperty(OpticsLabNamespace, "deleteButtonBaseColor", {
    default: "#883333",
    projector: "#883333",
  }),

  // ── Track (guide rail) ──────────────────────────────────────────────────────
  trackStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "trackStroke", {
    default: "rgba(100, 200, 180, 0.55)",
    projector: "rgba(60, 140, 120, 0.55)",
  }),

  // ── Carousel ────────────────────────────────────────────────────────────────
  carouselSeparatorStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "carouselSeparatorStroke", {
    default: "rgba(120, 120, 140, 0.45)",
    projector: "rgba(160, 160, 180, 0.45)",
  }),
  carouselButtonBaseColorProperty: new ProfileColorProperty(OpticsLabNamespace, "carouselButtonBaseColor", {
    default: "rgba(80, 80, 100, 0.6)",
    projector: "rgba(200, 200, 220, 0.8)",
  }),
  carouselArrowStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "carouselArrowStroke", {
    default: "#ccc",
    projector: "#444",
  }),
  carouselLabelFillProperty: new ProfileColorProperty(OpticsLabNamespace, "carouselLabelFill", {
    default: "#ccc",
    projector: "#444",
  }),
  pageControlCurrentFillProperty: new ProfileColorProperty(OpticsLabNamespace, "pageControlCurrentFill", {
    default: "#ccc",
    projector: "#444",
  }),
  pageControlInactiveFillProperty: new ProfileColorProperty(OpticsLabNamespace, "pageControlInactiveFill", {
    default: "rgba(180, 180, 200, 0.35)",
    projector: "rgba(80, 80, 100, 0.35)",
  }),

  // ── Carousel icons ──────────────────────────────────────────────────────────
  iconRayStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "iconRayStroke", {
    default: "#44ee66",
    projector: "#22cc44",
  }),
  pointSourceFillProperty: new ProfileColorProperty(OpticsLabNamespace, "pointSourceFill", {
    default: "#ff8844",
    projector: "#ff8844",
  }),

  // ── Blocker fill ────────────────────────────────────────────────────────────
  blockerFillProperty: new ProfileColorProperty(OpticsLabNamespace, "blockerFill", {
    default: "rgba(30, 30, 30, 0.5)",
    projector: "rgba(30, 30, 30, 0.5)",
  }),

  // ── Glass border (high-opacity stroke for half-plane boundary line) ─────────
  glassBorderStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "glassBorderStroke", {
    default: "rgba(60, 130, 210, 0.95)",
    projector: "rgba(60, 130, 210, 0.95)",
  }),

  // ── Hit-area fill (invisible but non-null so Scenery includes it in hit-testing) ──
  /**
   * Nearly-transparent fill applied to invisible body-drag hit paths.
   * A non-zero alpha is required so Scenery includes the fill area in
   * containsPoint() — the path remains visually invisible.
   */
  hitAreaFillProperty: new ProfileColorProperty(OpticsLabNamespace, "hitAreaFill", {
    default: "rgba(0,0,0,0.001)",
    projector: "rgba(0,0,0,0.001)",
  }),

  // ── Image overlay markers (real / virtual image positions) ─────────────────
  /** Base fill colour for real-image markers (yellow-orange). */
  imageRealFillBaseColorProperty: new ProfileColorProperty(OpticsLabNamespace, "imageRealFillBase", {
    default: "rgba(255, 200, 0, 0.85)",
    projector: "rgba(200, 150, 0, 0.85)",
  }),
  /** Base stroke colour for real-image markers. */
  imageRealStrokeBaseColorProperty: new ProfileColorProperty(OpticsLabNamespace, "imageRealStrokeBase", {
    default: "rgba(200, 150, 0, 1)",
    projector: "rgba(150, 100, 0, 1)",
  }),
  /** Label fill for real-image markers. */
  imageRealLabelFillProperty: new ProfileColorProperty(OpticsLabNamespace, "imageRealLabelFill", {
    default: "rgba(255, 220, 80, 0.95)",
    projector: "rgba(180, 130, 0, 0.95)",
  }),
  /** Base stroke colour for virtual-object markers (red). */
  imageVirtualObjectStrokeBaseColorProperty: new ProfileColorProperty(
    OpticsLabNamespace,
    "imageVirtualObjectStrokeBase",
    { default: "rgba(255, 80, 80, 1)", projector: "rgba(200, 40, 40, 1)" },
  ),
  /** Label fill for virtual-object markers. */
  imageVirtualObjectLabelFillProperty: new ProfileColorProperty(OpticsLabNamespace, "imageVirtualObjectLabelFill", {
    default: "rgba(255, 100, 100, 0.95)",
    projector: "rgba(200, 50, 50, 0.95)",
  }),
  /** Base stroke colour for virtual-image markers (cyan). */
  imageVirtualStrokeBaseColorProperty: new ProfileColorProperty(OpticsLabNamespace, "imageVirtualStrokeBase", {
    default: "rgba(0, 210, 255, 1)",
    projector: "rgba(0, 150, 200, 1)",
  }),
  /** Label fill for virtual-image markers. */
  imageVirtualLabelFillProperty: new ProfileColorProperty(OpticsLabNamespace, "imageVirtualLabelFill", {
    default: "rgba(80, 210, 255, 0.95)",
    projector: "rgba(0, 130, 180, 0.95)",
  }),

  // ── Measuring tape ──────────────────────────────────────────────────────────
  measuringTapeTextColorProperty: new ProfileColorProperty(OpticsLabNamespace, "measuringTapeTextColor", {
    default: "white",
    projector: "black",
  }),
  measuringTapeBackgroundColorProperty: new ProfileColorProperty(OpticsLabNamespace, "measuringTapeBackground", {
    default: "rgba(0,0,0,0.65)",
    projector: "rgba(255,255,255,0.65)",
  }),

  // ── Wavelength thumb outline ────────────────────────────────────────────────
  wavelengthThumbStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "wavelengthThumbStroke", {
    default: "rgba(0,0,0,0.55)",
    projector: "rgba(0,0,0,0.55)",
  }),

  // ── Observer node ──────────────────────────────────────────────────────────
  observerCircleStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "observerCircleStroke", {
    default: "rgba(255, 220, 80, 0.65)",
    projector: "rgba(180, 140, 0, 0.80)",
  }),
  observerCircleFillProperty: new ProfileColorProperty(OpticsLabNamespace, "observerCircleFill", {
    default: "rgba(255, 220, 80, 0.06)",
    projector: "rgba(255, 220, 80, 0.06)",
  }),
  observerDotFillProperty: new ProfileColorProperty(OpticsLabNamespace, "observerDotFill", {
    default: "rgba(255, 220, 80, 0.9)",
    projector: "rgba(180, 140, 0, 0.9)",
  }),
  observerDotStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "observerDotStroke", {
    default: "rgba(160, 120, 0, 1.0)",
    projector: "rgba(160, 120, 0, 1.0)",
  }),
  observerLabelFillProperty: new ProfileColorProperty(OpticsLabNamespace, "observerLabelFill", {
    default: "rgba(255, 220, 80, 0.85)",
    projector: "rgba(140, 100, 0, 0.90)",
  }),
  observerRimFillProperty: new ProfileColorProperty(OpticsLabNamespace, "observerRimFill", {
    default: "rgba(255, 220, 80, 0.55)",
    projector: "rgba(180, 140, 0, 0.65)",
  }),
  observerRimStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "observerRimStroke", {
    default: "rgba(160, 120, 0, 0.9)",
    projector: "rgba(160, 120, 0, 0.9)",
  }),

  // ── Fiber optic carousel icon ─────────────────────────────────────────────
  /** Cladding fill used in the fiber-optic carousel icon (glass-blue, icon opacity). */
  fiberIconCladdingFillProperty: new ProfileColorProperty(OpticsLabNamespace, "fiberIconCladdingFill", {
    default: "rgba(100, 160, 255, 0.28)",
    projector: "rgba(60, 100, 200, 0.28)",
  }),
  /** Cladding stroke used in the fiber-optic carousel icon. */
  fiberIconCladdingStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "fiberIconCladdingStroke", {
    default: "rgba(60, 130, 210, 0.75)",
    projector: "rgba(60, 130, 210, 0.75)",
  }),
  /** Core fill used in the fiber-optic carousel icon (amber, icon opacity). */
  fiberIconCoreFillProperty: new ProfileColorProperty(OpticsLabNamespace, "fiberIconCoreFill", {
    default: "rgba(255, 190, 50, 0.80)",
    projector: "rgba(220, 150, 30, 0.85)",
  }),
  /** Core stroke used in the fiber-optic carousel icon. */
  fiberIconCoreStrokeProperty: new ProfileColorProperty(OpticsLabNamespace, "fiberIconCoreStroke", {
    default: "rgba(200, 140, 20, 0.5)",
    projector: "rgba(160, 100, 10, 0.5)",
  }),

  // Fleet-standard aliases for shared Panel + ButtonOptions modules.
  panelBackgroundColorProperty: new ProfileColorProperty(OpticsLabNamespace, "panelBackground", {
    default: new Color(25, 25, 45, 0.95),
    projector: new Color(245, 245, 250, 0.98),
  }),
  panelBorderColorProperty: new ProfileColorProperty(OpticsLabNamespace, "panelBorder", {
    default: new Color(120, 120, 140),
    projector: new Color(180, 180, 200),
  }),
  textColorProperty: new ProfileColorProperty(OpticsLabNamespace, "text", { default: WHITE, projector: BLACK }),

  // ── Light control surfaces ───────────────────────────────────────────────────
  // White chrome (combo boxes, flat push buttons, editable input fields) stays light
  // in both profiles; its text stays dark.

  /** Fill of light control surfaces: combo-box button/list, editable input fields. */
  controlSurfaceColorProperty: new ProfileColorProperty(OpticsLabNamespace, "controlSurface", {
    default: "#ffffff",
    projector: "#ffffff",
  }),

  /** Fill of a disabled control surface (grayed-out editable input field). */
  controlSurfaceDisabledColorProperty: new ProfileColorProperty(OpticsLabNamespace, "controlSurfaceDisabled", {
    default: "#cccccc",
    projector: "#cccccc",
  }),

  /** Text on light control surfaces: combo items, flat-button labels, field values, preferences. */
  controlSurfaceTextColorProperty: new ProfileColorProperty(OpticsLabNamespace, "controlSurfaceText", {
    default: "#1a1a1a",
    projector: "#1a1a1a",
  }),

  /** Ray stroke on home-screen icons. */
  iconRayColorProperty: new ProfileColorProperty(OpticsLabNamespace, "iconRay", {
    default: "#55ee77",
    projector: "#1b8a3a",
  }),

  /** Softer companion ray on home-screen icons. */
  iconRaySoftColorProperty: new ProfileColorProperty(OpticsLabNamespace, "iconRaySoft", {
    default: "#88dd99",
    projector: "#4caf6a",
  }),

  /** Lens outline on home-screen icons. */
  iconLensStrokeColorProperty: new ProfileColorProperty(OpticsLabNamespace, "iconLensStroke", {
    default: "rgba(140, 200, 255, 0.95)",
  }),

  /** Lens body on home-screen icons. */
  iconLensFillColorProperty: new ProfileColorProperty(OpticsLabNamespace, "iconLensFill", {
    default: "rgba(100, 180, 255, 0.35)",
  }),

  /** Mirror surface on home-screen icons. */
  iconMirrorColorProperty: new ProfileColorProperty(OpticsLabNamespace, "iconMirror", {
    default: "rgba(210, 210, 220, 0.9)",
  }),

  /** Incoming white light on home-screen icons. */
  iconWhiteRayColorProperty: new ProfileColorProperty(OpticsLabNamespace, "iconWhiteRay", {
    default: "rgba(255, 255, 235, 0.95)",
  }),

  /** White light inside the prism on home-screen icons. */
  iconWhiteRayFaintColorProperty: new ProfileColorProperty(OpticsLabNamespace, "iconWhiteRayFaint", {
    default: "rgba(255,255,235,0.55)",
  }),

  /** Glass body (prisms) on home-screen icons. */
  iconGlassFillColorProperty: new ProfileColorProperty(OpticsLabNamespace, "iconGlassFill", {
    default: "rgba(120, 165, 215, 0.22)",
  }),

  /** Glass outline (prisms) on home-screen icons. */
  iconGlassStrokeColorProperty: new ProfileColorProperty(OpticsLabNamespace, "iconGlassStroke", {
    default: "rgba(165, 205, 248, 0.9)",
  }),

  /** Preset card fill on home-screen icons. */
  iconPresetRowColorProperty: new ProfileColorProperty(OpticsLabNamespace, "iconPresetRow", {
    default: "rgba(160, 175, 200, 0.55)",
  }),

  /** Preset card outline on home-screen icons. */
  iconPresetRowStrokeColorProperty: new ProfileColorProperty(OpticsLabNamespace, "iconPresetRowStroke", {
    default: "rgba(200, 210, 230, 0.5)",
  }),

  /** Optical-bench rail on home-screen icons. */
  iconBenchRailColorProperty: new ProfileColorProperty(OpticsLabNamespace, "iconBenchRail", {
    default: "rgba(135, 150, 182, 0.9)",
  }),

  /** Optical-bench rail ticks on home-screen icons. */
  iconBenchTickColorProperty: new ProfileColorProperty(OpticsLabNamespace, "iconBenchTick", {
    default: "rgba(85, 98, 128, 0.85)",
  }),

  /** Stands rising from the bench rail on home-screen icons. */
  iconBenchStandColorProperty: new ProfileColorProperty(OpticsLabNamespace, "iconBenchStand", {
    default: "rgba(108, 124, 158, 0.85)",
  }),

  /** Off-axis rays converging to the focus on home-screen icons. */
  iconRayConvergingColorProperty: new ProfileColorProperty(OpticsLabNamespace, "iconRayConverging", {
    default: "rgba(85, 238, 119, 0.6)",
  }),

  /** Point-source core outline on home-screen icons. */
  iconSourceRimColorProperty: new ProfileColorProperty(OpticsLabNamespace, "iconSourceRim", {
    default: "rgba(255, 195, 85, 0.9)",
  }),

  /** Point-source inner glow ring on home-screen icons. */
  iconSourceGlowInnerColorProperty: new ProfileColorProperty(OpticsLabNamespace, "iconSourceGlowInner", {
    default: "rgba(255, 190, 80, 0.35)",
  }),

  /** Point-source outer glow ring on home-screen icons. */
  iconSourceGlowOuterColorProperty: new ProfileColorProperty(OpticsLabNamespace, "iconSourceGlowOuter", {
    default: "rgba(255, 185, 75, 0.15)",
  }),

  /** Detector screen body on home-screen icons. */
  iconDetectorFillColorProperty: new ProfileColorProperty(OpticsLabNamespace, "iconDetectorFill", {
    default: "rgba(75, 90, 122, 0.4)",
  }),

  /** Detector screen outline on home-screen icons. */
  iconDetectorStrokeColorProperty: new ProfileColorProperty(OpticsLabNamespace, "iconDetectorStroke", {
    default: "rgba(152, 168, 205, 0.9)",
  }),

  /** Focal-spot outline on home-screen icons. */
  iconFocalSpotRimColorProperty: new ProfileColorProperty(OpticsLabNamespace, "iconFocalSpotRim", {
    default: "rgba(85, 238, 119, 0.5)",
  }),

  /** Focus-mark outline on the reflector card on home-screen icons. */
  iconFocusMarkRimColorProperty: new ProfileColorProperty(OpticsLabNamespace, "iconFocusMarkRim", {
    default: "rgba(255, 195, 85, 0.6)",
  }),

  /** Spectroscope prism outline on home-screen icons. */
  iconPrismStrokeColorProperty: new ProfileColorProperty(OpticsLabNamespace, "iconPrismStroke", {
    default: "rgba(155, 195, 238, 0.75)",
  }),

  /** Grating rulings on home-screen icons. */
  iconGratingLineColorProperty: new ProfileColorProperty(OpticsLabNamespace, "iconGratingLine", {
    default: "rgba(200, 210, 230, 0.85)",
  }),

  /** Accent mark (source or focus) on home-screen icons. */
  iconAccentColorProperty: new ProfileColorProperty(OpticsLabNamespace, "iconAccent", {
    default: "#ffaa55",
    projector: "#e65100",
  }),
};

/**
 * Returns the fill color for any glass element, scaling opacity with the
 * refractive index so denser glass appears more opaque.
 * n=1 → ~0.05 (barely visible), n=3 → ~0.40
 */
export function glassFill(refIndex: number): string {
  const opacity = 0.05 + ((refIndex - 1.0) / 2.0) * 0.35;
  return `rgba(100, 160, 255, ${toFixed(opacity, 3)})`;
}

export default OpticsLabColors;
