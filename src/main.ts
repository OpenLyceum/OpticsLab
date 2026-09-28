/**
 * main.ts
 *
 * Entry point for the simulation. Initializes SceneryStack, creates the
 * screens, and starts the main event loop.
 *
 * !! CRITICAL IMPORT ORDER !!
 * brand.js MUST be the first import. Each module imports the next, so the import nesting is
 *
 *   main → brand → splash → assert → init
 *
 * and therefore the actual EXECUTION order (deepest import runs first) is the reverse:
 *
 *   init → assert → splash → brand → main
 *
 * SceneryStack requires this exact load order. Never reorder these imports.
 */

// brand.js MUST be first; importing it runs the whole chain (init→assert→splash→brand) before main.
import "./brand.js";

import { onReadyToLaunch, PreferencesModel, Sim } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import {
  createDiffractionIcon,
  createIntroIcon,
  createLabIcon,
  createPresetsIcon,
} from "./common/OpticsLabScreenIcons.js";
import type { ComponentKey } from "./common/view/ComponentCarousel.js";
import { DiffractionScreen } from "./diffraction/DiffractionScreen.js";
import { StringManager } from "./i18n/StringManager.js";
import { IntroScreen } from "./intro/IntroScreen.js";
import { LabScreen } from "./lab/LabScreen.js";
import OpticsLabColors from "./OpticsLabColors.js";
import {
  TANDEM_DIFFRACTION_SCREEN,
  TANDEM_INTRO_SCREEN,
  TANDEM_LAB_SCREEN,
  TANDEM_OPTICS_LAB_PREFERENCES,
  TANDEM_PRESETS_SCREEN,
} from "./OpticsLabStrings.js";
import { OpticsLabPreferencesModel } from "./preferences/OpticsLabPreferencesModel.js";
import { OpticsLabPreferencesNode } from "./preferences/OpticsLabPreferencesNode.js";
import opticsLabQueryParameters from "./preferences/opticsLabQueryParameters.js";
import { PresetsScreen } from "./presets/PresetsScreen.js";

onReadyToLaunch(() => {
  const stringManager = StringManager.getInstance();
  const opticsLabPreferences = new OpticsLabPreferencesModel(Tandem.ROOT.createTandem(TANDEM_OPTICS_LAB_PREFERENCES));
  const screenNames = stringManager.getScreenNames();

  const commonScreenOptions = {
    backgroundColorProperty: OpticsLabColors.backgroundColorProperty,
    opticsLabPreferences,
  };

  // Components shared by non-diffraction screens (everything except gratings).
  const standardComponents: ComponentKey[] = [
    "beam",
    "singleRay",
    "continuousSpectrum",
    "arcSource",
    "pointSource",
    "sphericalLens",
    "biconvexLens",
    "biconcaveLens",
    "planoConvexLens",
    "planoConcaveLens",
    "idealLens",
    "circleGlass",
    "prism",
    "equilateralPrism",
    "rightAnglePrism",
    "porroPrism",
    "slabGlass",
    "parallelogramPrism",
    "dovePrism",
    "halfPlaneGlass",
    "flatMirror",
    "arcMirror",
    "idealMirror",
    "parabolicMirror",
    "lineBlocker",
    "detector",
    "aperture",
    "beamSplitter",
    "track",
    ...(opticsLabQueryParameters.enabledOpticalFiber ? ["fiberOptic" as ComponentKey] : []),
  ];

  // The diffraction screen adds gratings and a curated subset of other components.
  const diffractionComponents: ComponentKey[] = [
    "transmissionGrating",
    "reflectionGrating",
    "beam",
    "singleRay",
    "continuousSpectrum",
    "pointSource",
    "aperture",
    "detector",
    "flatMirror",
    "lineBlocker",
    "track",
  ];

  const screens = [
    new IntroScreen({
      // The screen name Property updates automatically when the locale changes
      name: screenNames.introStringProperty,
      tandem: Tandem.ROOT.createTandem(TANDEM_INTRO_SCREEN),
      carouselComponents: standardComponents,
      homeScreenIcon: createIntroIcon(),
      ...commonScreenOptions,
    }),
    new LabScreen({
      // The screen name Property updates automatically when the locale changes
      name: screenNames.labStringProperty,
      tandem: Tandem.ROOT.createTandem(TANDEM_LAB_SCREEN),
      carouselComponents: standardComponents,
      homeScreenIcon: createLabIcon(),
      ...commonScreenOptions,
    }),
    new PresetsScreen({
      // The screen name Property updates automatically when the locale changes
      name: screenNames.presetsStringProperty,
      tandem: Tandem.ROOT.createTandem(TANDEM_PRESETS_SCREEN),
      carouselComponents: standardComponents,
      homeScreenIcon: createPresetsIcon(),
      ...commonScreenOptions,
    }),
    new DiffractionScreen({
      // The screen name Property updates automatically when the locale changes
      name: screenNames.diffractionStringProperty,
      tandem: Tandem.ROOT.createTandem(TANDEM_DIFFRACTION_SCREEN),
      carouselComponents: diffractionComponents,
      homeScreenIcon: createDiffractionIcon(),
      ...commonScreenOptions,
    }),
  ];

  const sim = new Sim(stringManager.getTitleStringProperty(), screens, {
    preferencesModel: new PreferencesModel({
      visualOptions: {
        // Adds a "Projector Mode" toggle in Preferences → Visual
        supportsProjectorMode: true,
        // Enables keyboard-navigation highlight outlines
        supportsInteractiveHighlights: true,
      },
      simulationOptions: {
        customPreferences: [
          {
            createContent: (tandem: Tandem) => new OpticsLabPreferencesNode(opticsLabPreferences, tandem),
          },
        ],
      },
      localizationOptions: {
        // Adds a language picker in Preferences → Language
        supportsDynamicLocale: true,
      },
      inputOptions: {
        supportsGestureControl: true,
      },
    }),
    webgl: true,
  });
  sim.start();
});
