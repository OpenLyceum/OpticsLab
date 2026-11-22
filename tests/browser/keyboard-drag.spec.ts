/**
 * Regression: keyboard-dragging an optical element must not reparent it.
 *
 * The carousel drop-target logic used to lift the element into the drag layer
 * whenever the combined RichDragListener isPressedProperty went true. On an
 * arrow-key press that happens inside the Hotkey's isPressedProperty
 * notification. The reparent blurred the focused PDOM element, the blur cleared
 * the global key state, and that released the same Hotkey mid-notification
 * ("reentry detected" assertion under ?ea, seen in the keyboard-fuzz soak).
 *
 * Run: npx playwright test tests/browser/keyboard-drag.spec.ts
 */

import { expect, test } from "@playwright/test";

test("arrow-key dragging keeps focus on the optical element", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });

  await page.goto("/?ea&homeScreen=false&initialScreen=3");
  await page.getByRole("button", { name: "Choose a Preset Empty Lab" }).press("Enter");
  await page.getByRole("option", { name: "Convex Lens Focus" }).dispatchEvent("click");

  const body = page.getByText("Move element", { exact: true }).first();
  await body.focus();
  await expect(body).toBeFocused();
  for (const key of ["ArrowRight", "ArrowDown", "ArrowLeft"]) {
    await page.keyboard.press(key);
    await expect(body).toBeFocused();
  }
  expect(errors).toEqual([]);
});
