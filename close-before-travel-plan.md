# Close the laptop before every transfer

Status: implementation plan, 2026-10-02. No animation or runtime changes made for this request.

## Desired behavior

Every physical transfer follows **close on the desk → move closed → land closed → open at the destination**. The base stays planted while the hinge closes. The lid remains completely shut throughout lifting, spinning, translation and descent. After touchdown, it opens to the destination's existing presentation angle.

Preserve intentional exceptions: Intro already begins floating and closed; Formula SAE currently displays the laptop closed; Resume and Contact share a stationary laptop and only move the camera between them. These states do not need an artificial close/open cycle.

| Transfer | Planned sequence |
| --- | --- |
| Intro → Hack Atlantic | Preserve the floating closed opening; keep closed through flight; land, then open |
| Hack Atlantic → Formula SAE | Close while planted; transfer closed; remain closed for the car overview |
| Formula SAE → Ultra Maritime | Depart already closed; transfer and land closed; open after touchdown |
| Ultra Maritime → Projects | Close while planted; take the clear incoming route; land closed, then open |
| Projects → Resume | Close while planted; slide forward closed; lift and turn through the verified clear corridor; descend into the empty bay, then open |
| Resume → Contact | Keep the laptop parked at its current angle during the overhead camera move |

Reverse scrolling retraces the same sequence: an open destination closes before lifting backward, travels closed, lands at the preceding desk, then opens if that station presents it open.

## Current implementation findings

- The original clip mixes hinge movement with flight: some transfers partially reopen before landing. Changing only departure frames would leave those midair openings intact.
- Ordinary exit docking currently blends the whole laptop toward old animation endpoints. That can move or turn the base while the hinge is closing. Projects already uses the actual parked pose as its endpoint; extend that rule to every physical departure.
- Rig closure is not an identity quaternion. The Blender source maps opening angle to `110 - lid_deg`: a shut lid uses a local X rotation of 110 degrees, approximately quaternion `[0.819152, 0, 0, 0.573576]`. Confirm this against the existing closed Intro/Formula geometry before setting the canonical closed pose.
- `scene.ts` currently applies baked animation, Projects correction, desk-arrival correction and finally dock blending. The final dock blend can overwrite a separately applied hinge pose. The new motion evaluation must resolve these layers in a defined order.
- For Hack Atlantic, Ultra Maritime and Projects, camera focus timing currently depends partly on `state.dock`. Holding the body docked must not accidentally hold the camera close throughout exit.

## Timing and physical movement

Use the existing scroll phase lengths initially; these are scroll intervals, not timed waits.

1. **Exit:** hold the base at the exact station dock position and orientation for the whole phase. Ease the hinge closed during the first 80% and hold fully closed for the final 20%. The camera can pull back throughout. A station already closed simply remains closed.
2. **Travel:** start at that identical closed dock pose. Lift/turn only after the close phase has ended. Blend from the canonical dock into the existing route through clear space; do not interpolate backward through a prop to reconnect to an obsolete endpoint. Hold the lid closed for the entire flight.
3. **Landing and approach:** reach the destination's canonical dock closed. Where the existing approach still settles the base, finish that movement within the first 40% of approach. Start opening only after touchdown, provisionally over 45–95% of approach. Already-settled arrivals can hold briefly before opening. Preserve the closed Formula SAE presentation.
4. **Hold:** use the current station pose and lid angle exactly. Keep presentation and navigation stable.

Preserve the Projects forward corridor and Resume vertical descent. Their hinge poses will change, so revalidate their full moving geometry rather than assuming the old clearance measurements still apply. Inspect departure/arrival bridges at the other desks as well.

The existing Formula SAE approach is shorter than the others. Review that transition at normal scrolling speed; if a destination needs more time to settle/open clearly, adjust its internal timing before changing the journey's total length.

## Implementation structure

- Add a central pure laptop-motion evaluator, with shared closed-lid configuration and phase-based hinge timing. Inputs are absolute journey state, original sampled pose and station/route references; output is one complete body-and-lid pose. Avoid frame history, timers or accumulated offsets.
- Retain the original baked body rotations where safe, including full flips rather than shortest-path interpolation that erases a revolution. Use canonical dock endpoints and explicit short connection stages where needed.
- Reuse `projects-motion.ts` and `desk-arrival.ts` for their safe body routes. Separate route position/orientation from lid presentation so these helpers cannot reopen the laptop during flight.
- In `scene.ts`, restore the original sample, resolve the complete final pose, and apply it once. Remove any later generic dock interpolation that would undo the closing rule.
- Separate body docking, lid opening and camera focus in `journey.ts`. Preserve the current camera's continuous approach/exit behavior without deriving it from the new permanently-docked exit body state.
- Follow the final body/lid bounds in the camera. Fit the thinner closed silhouette with smooth framing; avoid abrupt zoom changes as the hinge closes or opens. Preserve Formula's composition and the printer/contact overhead views.
- Preserve print-job state, physical printer-button interaction and reduced-motion station stills.

Likely files: `web/src/journey.ts`, `web/src/scene.ts`, `web/src/camera.ts`, new `web/src/laptop-motion.ts` and shared configuration, with focused changes to the two existing route helpers and their tests.

## Blender and source plan

Motion-only revision of the existing realistic hero prop for the browser portfolio. Preserve physical scale, feet/spin/hinge pivots, geometry, materials and textures; add no polygons or textures. The TypeScript evaluator remains authoritative for scroll interaction.

Apply the Blender Director and Animation workflow: block the planted-close/closed-flight/landed-open poses, check silhouettes and collisions, then ease and review the continuous sequence. After runtime validation, export the evaluated poses at 30 fps and create a backed-up Blender review with named `AN_` actions through MCP. Keep original GLBs and authored source motion recoverable, and document how subsequent asset exports retain the runtime correction.

## Acceptance checks

- Every physical departure stays at its canonical dock until the lid is shut. No base movement or yaw during closure.
- Every airborne or transferring pose has the canonical closed hinge angle, including fractional samples and phase boundaries.
- Opening starts only after the base has landed and aligned. Formula remains closed; the shared-desk camera switch does not move the laptop.
- Closed geometry does not penetrate the deck, desk or surrounding props. Recheck the full hinge sweep while opening/closing, all station departure/landing connections, the ultrawide corridor, and the phone/printer/notebook area.
- Position, orientation, hinge angle and camera remain continuous through each phase. Forward, backward, rapid and direct seeks give identical poses at identical progress.
- Review normal-speed and slow playback at every station from the normal camera and side views, with desktop and portrait framing. No cropped laptop or abrupt zoom as its silhouette changes.
- Update assertions that intentionally depended on the previous open-lid flights, while retaining independent physical-clearance and framing checks. Run the full unit suite, full-journey/browser checks, focused Projects and safe-landing tests, printer/shared-desk regressions and production build.

Deliver the working preview, matching Blender review, updated source documentation and a concise validation report.
