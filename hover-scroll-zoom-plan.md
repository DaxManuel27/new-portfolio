# Hover + scroll-up zoom

Status: Implemented. Build and all nine scroll-gesture tests pass.

## Behavior

Hovering over a desk object or its label and scrolling up opens that object's section. Once zoomed in, a new upward scroll gesture returns to the desk, preserving the existing behavior.

## Implementation

1. **Detect the hovered object.** Use the existing object detection for the laptop, notebooks, printer, and race car. Hovering an object's label should work too. The ultrawide monitor is temporarily excluded from the website; include it only when restored.

2. **Recognize a deliberate upward scroll.** Accumulate enough movement to ignore small trackpad jitters. Reset when the hovered object changes, the pointer leaves, or scrolling reverses. Preserve browser pinch-to-zoom.

3. **Open the corresponding section.** Reuse the existing click navigation and camera animation so the content, URL, and back behavior stay consistent.

4. **Prevent accidental zoom-in/zoom-out loops.** Ignore scrolling during the camera transition, then require the original gesture's momentum to stop before accepting a new scroll-up gesture to return. Apply the same protection when returning to the desk so continued momentum cannot reopen an object.

5. **Keep existing controls.** Clicking objects and labels still works. Empty desk space does nothing; touch and keyboard navigation remain available.

6. **Verify mouse and trackpad behavior.** Check every available object, label hovering, rapid direction changes, continued momentum, interrupted transitions, and reduced-motion mode.

## Acceptance checks

- A deliberate upward scroll over an available object or its label opens the correct section exactly once.
- Small jitters, downward scrolling, empty desk space, and pinch-to-zoom do not open a section.
- Scroll input during camera movement does not reverse the transition or queue another navigation.
- Remaining momentum cannot immediately close a newly opened section or reopen an object after returning to the desk.
- A fresh upward scroll in a settled close-up returns to the desk, preserving existing scrollable-content handling.
- Clicking, keyboard navigation, touch navigation, browser history, and reduced-motion behavior continue to work.
- The hidden ultrawide monitor cannot be hovered, selected, or opened through this gesture.

## Implementation notes

- Shared wheel handling in `web/src/scroll-back.ts` handles desk entry and close-up return.
- A 70-pixel accumulated upward gesture triggers navigation; 280 ms of wheel inactivity separates gestures after navigation.
- Camera and notebook movement block new navigation. Momentum remains locked across arrival and departure, including instant reduced-motion transitions.
- Canvas detection uses the existing raycast and ignores invisible objects; printer housing maps to the résumé section. Labels use their existing destination IDs.
- Navigation reuses the current open/close paths, preserving URLs, focus, click behavior, and scrollable-content handling.
- Browser checks confirmed Contact-label entry, scroll-up return, and direct laptop entry.
