# PERPETUAL MANDATE — DeenDawn autonomous quality loop

This is the standing brief for the long-running autonomous engineering session.
Zohaib set it 2026-07-21. It is subordinate to `CLAUDE.md` (the constitution).
When this doc and the constitution conflict, the constitution wins — except where
Zohaib's answers below tighten or loosen a latitude the constitution left open.

## Owner's decisions (2026-07-21)

- **Priorities (all four, interleaved):** world-class design & polish · rock-solid
  reliability & bug-hunting · driving toward TestFlight on his phone · new features.
- **Design latitude: WIDE** — make reasonable design/UX calls inside the approved
  Khavion brand + "Rich Screens / Direction 1c" spec autonomously; log them in
  DECISIONS.md; only stop for big brand-level or irreversible choices.
- **Scope: perfect + build new** — perfect the existing app AND build net-new
  features, always obeying Rule 1 (NO-AI ZONE) and the scholar/human gates.
- **When clearly-valuable work runs dry:** switch to research mode (study competitor
  and best-in-class apps, best practices, Expo changes) and queue proposals — do NOT
  invent low-value churn.
- **Apple:** owner WILL set up the $99/yr Apple Developer account. Prep everything so
  the TestFlight upload is nearly one click; give click-by-click account+key steps.
- **Autonomy: FULL** — push to `main` when green, install packages, run builds and
  emulator tests unattended. Only the constitution's Human Gates + big brand calls stop.
- **Owner comms: ONE running doc** — `docs/BLOCKERS.md` is the single plain-English
  file Zohaib reads. Keep a ranked "WHAT NEEDS YOU" section at the very top
  (unlock-testing items first, nice-to-have proposals last), each with a yes/no rec.

## Operating rules for the loop

1. Run the constitution's **Autonomous operating loop** continuously; never idle.
   Read PROGRESS/TODO/BLOCKERS, take the top unblocked task, plan 3–5 lines, tests
   first, implement, make green, run ALL gates, conventional-commit, push, update docs.
2. **Every commit gate:** `tsc --noEmit`, `eslint`, affected `jest`, religious-text
   checksum test. Never work around a red religious-content check. Never end with
   `main` red or work uncommitted.
3. **Reliability is a continuous discipline, not a phase.** Regularly boot the iOS
   simulator and Android emulator, run the Maestro flows on both, capture screenshots,
   and actively hunt for regressions, jank, layout breaks, and edge cases — not just
   run existing tests. Log findings, fix them, add tests that would have caught them.
4. **Use the deep-research subagent proactively** (per global instruction) for anything
   current/external/verifiable: Expo/RN API changes, competitor feature teardowns,
   licensing, accessibility norms, design references. Write it a full brief; trust its
   report; continue. Don't ask Zohaib to research.
5. **Gates never stop the whole loop.** When a task hits a Human Gate, write the
   context + recommendation to BLOCKERS.md, print `GATE: <summary>`, and move to the
   next unblocked task. Accumulate gate items; keep building.
6. **New features:** build non-gated features autonomously. Any feature touching
   religious text/rulings, brand identity, or a Human Gate → build behind a flag/draft,
   flag it (SCHOLAR_REVIEW / TRANSLATION_REVIEW), and add a yes/no line to BLOCKERS.md.
7. **Design work:** execute the approved `docs/RICH_DESIGN_SPEC.md` + `DESIGN_AUDIT.md`
   roadmap (adaptive tiers, motion system, haptics vocabulary, skeletons, remaining
   Rich screens, reverence guardrails). Keep Quranic/Arabic surfaces serene and still.
8. **Near-term ordering** (owner picked all priorities, so interleave with this bias):
   (a) make the TestFlight path near-one-click + write Apple account/key click-by-click
   as the #1 BLOCKERS item; (b) finish Rich design + motion (biggest felt quality jump,
   already approved); (c) continuous reliability/bug passes throughout; (d) then
   net-new features; (e) research mode when the concrete backlog is exhausted.
9. Keep everything **offline-first, privacy-absolute, free, no-ads, no-accounts,
   no-tracking** — these are non-negotiable and are the whole point of the product.
