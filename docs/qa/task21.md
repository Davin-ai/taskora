# Task 21 — responsive and keyboard QA

Date: 2026-09-27. Local app in Chromium, viewport simulation (not a physical phone).

## Changes
- Removed the body minimum width that produced horizontal overflow at a 320px viewport with a scrollbar.
- Mobile navigation closes on Escape and restores focus to its toggle.
- Navigation links move focus to the main content, including when the mobile menu collapses.
- Menu toggle, search clear, bottom navigation links, dialog close and calendar month controls have at least 44px touch targets in mobile layouts.
- Mobile form controls use 16px text; content and scroll padding account for the bottom navigation and safe-area inset.

## Browser verification
- At 320px: Dashboard, Projects, My Tasks, Calendar, Reports, Profile, Settings and the Mobile App Design board all have document scrollWidth equal to clientWidth after the fix.
- At 390px and 768px: Dashboard, My Tasks, Calendar, Reports and Settings also have no document horizontal overflow.
- Escape from a menu link closes navigation and focuses the toggle.
- Selecting Reports from the menu focuses main content.
- Skip to content focuses main.
- At 320px the task dialog has no horizontal overflow, scrolls vertically, and its submit validation and Cancel remain usable.
- Calendar month controls measure 44 by 44 pixels.
- No captured browser warnings/errors in the checked flows.
- Screenshot: task21-mobile.png. Temporary viewport override reset afterwards.

## Limits
This is targeted responsive and keyboard verification, not a full WCAG audit. Physical iOS/Android keyboard, screen-reader output, all contrast ratios and every zoom/device combination remain unverified. Task 20 download/import verification limits remain open.
