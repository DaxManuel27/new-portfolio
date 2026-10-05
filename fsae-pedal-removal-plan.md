# Remove the accelerator pedal sensor from Formula SAE

Status: implemented on 3 October 2026. Website, active Blender source, car exports, and fallback stills updated. Original design references and removed editable assets retained outside the active build.

## Intended result

Formula SAE presents one project: data logging with the Raspberry Pi 5. Remove the accelerator pedal sensor's label, connector, anchor, standalone model, text, scroll section, transition, fallback content, and shipped assets. The car overview retains only the plain-text Data logging label. Scrolling remains the navigation mechanism; do not restore component buttons.

This removes the sensor project presentation. Keep ordinary car geometry that belongs to the vehicle itself, including its footwell; do not dismantle the car to remove the separate representative pedal model.

## Scroll sequence and exit

New sequence:

Workstation monitor → FSAE car overview → behind-seat data-logging approach → Pi 5 and one text panel → brief return into the car's exit → Projects.

Keep the current behind-seat approach (1.1 scroll units) and reading section (1.8). Replace `component-transfer`, `pedal-hold`, and `pedal-return` (3.6 combined) with `data-return` (initial budget: 0.6). Connect that return to the existing FSAE exit (0.65), with no additional overview hold. Continue into the existing Projects handoff. The current 29.1-unit journey becomes 26.1 units if other timings remain unchanged.

Reverse scrolling must follow the same path back into the Pi. Match position, orientation, framing, opacity, and cutaway state at every join. Preserve the existing hidden-camera-switch technique between the isolated Pi presentation and the car. Review the return-to-exit join for a visible pause; tune the interpolation if needed without adding a new stop.

## Implementation steps

### 1. Remove the narrative and navigation references

- `web/src/fsae-projects.ts`: retain only data logging. Remove the pedal entry and obsolete `next`/`nextLabel` fields that referenced component links already removed from the interface.
- `web/src/main.ts`: generate only the data-logging article and reduced-motion section. Remove any assumptions that two component sections exist. Preserve the Pi poster and licence link.
- Keep `#fsae-data-logging` working. Normalize the obsolete `#fsae-pedal-sensor` hash to `#formula-sae` using history replacement, then use the normal overview restoration path. This is a compatibility redirect, not a remaining sensor section or visible link.
- Inspect page restoration after the shorter journey so stored progress cannot produce an invalid phase or a blank screen.

### 2. Simplify the camera and scene logic

- `web/src/journey.ts`: remove the three obsolete phases and their type variants; add `data-return` before the existing FSAE exit.
- `web/src/fsae-focus.ts`: remove the data-to-pedal transfer, pedal framing scale, cockpit route, and project-switch logic. Retain the data approach, hold, and reversed return.
- `web/src/scene.ts`: load only the Pi detail asset. Remove the second component's in-car instance, dual-model bridge, and pedal-specific seat/harness fading. Preserve the seat and the data logger's bodywork cutaway behaviour.
- Delete the pedal label, connector, and anchor objects from the active car asset. Do not merely skip drawing their text: their geometry must also be absent from bounds, raycasts, and title-layout obstacle calculations.
- Make the remaining label-generation code explicitly handle Data logging. It currently treats any other FSAE label as the pedal label.
- Recheck the responsive FSAE heading layout and live Workstation monitor preview after removing the lower callout.

### 3. Remove regeneration paths and active assets

- `blender/completion_pipeline.py`: stop creating `FSAE_Label_PedalSensor`, `FSAE_Connector_PedalSensor`, and `FSAE_Anchor_PedalSensor`; update the callout metadata.
- `blender/fsae_focus_routes.py`: export only the behind-seat data anchor and camera route.
- `blender/build_fsae_details.py`: stop building/exporting/rendering the representative pedal scene. Remove its entry from the source-file and poster generation loops.
- `web/scripts/prepare-fsae-details.mjs`: prepare only the Pi; rewrite manifests and asset reports with only the data anchor/route. Explicitly remove stale pedal outputs from the active output directories so rebuilding does not retain them.
- `web/src/types.ts`: reduce the anchor and focus-route schema to data logging.
- Update the active Blender scene and save it, then regenerate the affected Formula SAE car export, browser assets, and overview fallback still. Ensure the static still no longer contains the sensor callout.
- Remove `pedal-sensor.glb` and `pedal-sensor.webp` from `web/public/assets` and `exports/web`, and refresh the production build. Remove pedal outputs from `exports/fsae-details` as well.
- Preserve the editable pedal `.blend` and original design references in an archive outside served/build inputs for recoverability. They must not be loaded, packaged, or regenerated by the active pipeline. Historical backups may remain untouched.
- Update the current implementation documentation to mark the two-component design superseded. No Figma edits are needed to remove the feature from the live site; original Figma references remain historical source material.

### 4. Update verification

- Replace two-component/transfer tests in `web/tests/fsae-focus.test.ts` with the single-project phase order, data-return joins, and forward/reverse determinism checks.
- Update journey-duration expectations in `web/tests/journey.test.ts` from the actual final timing.
- Preserve Pi scale, licence, framing, camera continuity, and existing unrelated scene checks.
- Update `web/scripts/verify-fsae-details.mjs` to verify only the data section, scroll into Projects, reverse back to the Pi, obsolete-hash redirection, and absent pedal content/assets.
- Retire or rewrite pedal/transfer screenshot scripts. Capture the car overview, behind-seat approach, Pi hold, return/exit, and Projects arrival on desktop and phone.
- Verify reduced motion and failed-Pi-download fallback still expose the data-logging content without a pedal article or poster.
- Inspect browser requests: no pedal asset downloads. Inspect the prepared GLB/manifests: no pedal callout nodes, anchor, or focus route. Inspect production output: no standalone pedal assets.
- Run the production build and relevant automated checks, then the existing regression suite once after integration.

## Acceptance criteria

- No accelerator pedal sensor label, connector, model presentation, text section, button, or navigation destination appears in the FSAE experience, monitor preview, or fallback stills.
- Data logging remains the sole FSAE project, with its Pi model, behind-seat approach, plain-text label, and one stable text section.
- Continuing to scroll after the Pi leads into Projects without a cockpit-to-pedal detour, blank interval, or leftover reading space.
- Reverse scrolling and direct data-logging links work; an old pedal link lands at the FSAE overview.
- Active exports, manifests, browser requests, and a fresh production build contain no sensor-project assets or routes.
- Regenerating assets cannot bring the removed section back.
