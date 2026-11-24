/** Live bench summary shared by all four OpticsLab screens. */
import { DerivedProperty, DynamicProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { StringManager } from "../../i18n/StringManager.js";
import type { OpticsScene } from "../model/optics/OpticsScene.js";
import type { OpticalElement } from "../model/optics/OpticsTypes.js";

export class OpticsLabScreenSummaryContent extends ScreenSummaryContent {
  public constructor(scene: OpticsScene, selectedElementProperty: TReadOnlyProperty<OpticalElement | null>) {
    const strings = StringManager.getInstance();
    const a11y = strings.getA11yStrings();
    const nameProperty = new DerivedProperty([selectedElementProperty], (element) =>
      element
        ? (strings.getElementTypeNameProperty(element.type) ?? a11y.selectedElementStringProperty)
        : a11y.noSelectionStringProperty,
    );
    const name = new DynamicProperty<string, string, TReadOnlyProperty<string>>(nameProperty);
    const currentDetailsProperty = new DerivedProperty(
      [
        scene.opticalElementsGroup.countProperty,
        selectedElementProperty,
        name,
        a11y.currentDetailsPatternStringProperty,
        a11y.selectedPatternStringProperty,
      ],
      (count, selected, label, pattern, selectedPattern) =>
        pattern
          .replace("{{count}}", String(count))
          .replace("{{selection}}", selected ? selectedPattern.replace("{{name}}", label) : label),
    );
    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: currentDetailsProperty,
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
    this.disposeEmitter.addListener(() => {
      currentDetailsProperty.dispose();
      name.dispose();
      nameProperty.dispose();
    });
  }
}
