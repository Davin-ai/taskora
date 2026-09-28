# Task 20 — desktop browser QA

Date: 2026-09-27
Environment: local Vite app, Codex in-app Chromium browser, desktop viewport.
These are interactive browser observations, separate from the automated SSR/model checks.

## Verified
- Demo entry, dashboard, project list, project board, My Tasks, Calendar, Reports, Profile and Settings render.
- Empty project search and reset restore the four projects.
- Task creation rejects missing project, title and deadline.
- Created a disposable task, reloaded, edited its title, changed status, deleted it, restored it with Undo, then deleted it again. Original 36 tasks remain.
- Native date input accepted keyboard entry. The browser automation fill command alone did not commit the controlled date value; a native arrow-key change did.
- Calendar next month and Today navigation.
- Profile rejects an empty display name; a temporary name persisted after reload and was restored to Kosar.
- Settings priority was temporarily saved, reloaded and restored to Medium.
- Invalid backup version is rejected. Empty backup shows replacement warning and Cancel leaves all 36 tasks untouched.
- Leaving demo redirects to entry; a direct /tasks request returns to My Tasks after re-entry.
- Unknown route displays 404 and its dashboard link works.
- No captured browser warning/error logs during the checked flows.

## Fix
React autofocus ran while the native dialog was still closed. Opening it then focused the first button (Close).
Input and Button now expose the requested autofocus target; Modal focuses it after showModal().
Verified: Title receives focus for task creation; Cancel receives focus in deletion/backup confirmation.
Escape closes creation and restores focus to Add task.

Evidence: task20-form.png.

## Remaining verification limits
- CSV download was requested but the browser download event timed out; file delivery is not verified. JSON download delivery is also unverified.
- Actual backup replacement was not executed against the browser workspace; validation/replacement logic is covered by automated checks.
- Pointer drag-and-drop, all filter combinations, mobile breakpoints, and cross-browser behavior are not exhaustively covered here.
- No claim of full end-to-end coverage is made.

Fixtures in scripts/fixtures support repeating invalid/empty backup preview tests.
Do not confirm an empty backup replacement in a workspace whose tasks should be retained.
