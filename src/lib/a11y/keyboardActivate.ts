import type { KeyboardEvent } from "react";

/** Activate on Enter/Space for elements with role="button". */
export function handleKeyboardActivate(
  event: KeyboardEvent,
  action: () => void,
): void {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    action();
  }
}
