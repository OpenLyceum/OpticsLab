import type { ScreenOptions } from "scenerystack/sim";
import type { OpticsLabPreferencesModel } from "../preferences/OpticsLabPreferencesModel.js";
import type { ComponentKey } from "./view/ComponentCarousel.js";

/** Extends the base ScreenOptions with the preferences model required by RayTracingCommonView. */
export type OpticsLabScreenOptions = ScreenOptions & {
  opticsLabPreferences: OpticsLabPreferencesModel;

  /**
   * Optional list of component keys to show in the carousel (in order).
   * When omitted, all components are shown in the default order.
   */
  carouselComponents?: ComponentKey[];
};
