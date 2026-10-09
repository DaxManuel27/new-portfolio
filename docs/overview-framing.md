# Closer desk overview

The desktop overview now moves the camera closer according to viewport aspect ratio, targeting roughly 70–75% desk width on wide screens. The camera height follows the distance to retain the tabletop angle. Tablets receive a gentler adjustment; portrait phones retain their previous complete scene framing.

The wall name retains its existing responsive screen-space size and upper-left position; its world-space dimensions adapt to the new overview. Camera changes do not scale or relocate the desk props.

`WorkspaceScene.overviewPose()` supplies one consistent destination for initial display, resizing, normal returns, and notebook close/return animation. The label solver has additional longer leader candidates to keep labels outside the enlarged props.

Changed runtime files: `web/src/workspace-scene.ts`, `web/src/workspace-labels.ts`.

Verification: production build; responsive label/keyboard/hover smoke check; `web/scripts/verify-overview.mjs` captures 2048×1035, 1440×960, 1024×768, and 390×844 views, checks label collision flags, measures desk width, and checks all six destinations return to the same overview camera pose. Evidence is saved to `web/test-results/overview/`.
