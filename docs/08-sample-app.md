# 08 — Sample app: Harbor Backup

Harbor Backup is the reference app. It is one window built from sidebar navigation, input, button, card, switch, select, progress and badge. It is shown on every skin in light and dark. Build it as `apps/harbor-backup` and use it as the end-to-end acceptance test for every package and adapter. Source: `SampleApp.dc.html`. The project page also uses a Backups settings screen ("See what each layer adds") to show the layers stacking.

## Window: Overview screen

- **Title bar:** "Harbor Backup" with the platform's window controls.
- **Sidebar:** Overview, Schedules, Destinations, Restore files, Settings. The current item uses `aria-current="page"` and the platform selection idiom.
- **Header:** the current page name and a primary **Back up now** button.
- **Current backup card:** a status badge, Running (secondary) or Paused (warning). It shows "Documents · 12.4 GB of 18.2 GB · 68%" with a progress bar, a Pause/Resume toggle and View files.
- **Schedule card:** an Automatic backups switch (on), a Back up on battery switch (off) and a Frequency select (Every hour).
- **Recent activity** (with Show all):
  - Photos → NAS · Today, 09:12 · 2.1 GB · badge **Completed**
  - Projects → Cloud · Yesterday, 22:40 · 14 files skipped · badge **Warning**
  - Mail archive → USB drive · Yesterday, 18:03 · drive not found · badge **Failed**

**Added to Overview:** a Storage card (each destination's usage and status) and a Backup size chart (the last 7 days).

## The other pages

Each menu point is its own page component in `apps/harbor-backup/src/app/harbor/pages/`, loaded lazily (`@defer`). The pages share their data and actions through `HarborStore` (`data/harbor-store.ts`), so a change on one page shows on the others: a new destination appears in Overview's Storage card, and a restore is added to Recent activity. The demo's "today" is fixed at Thu 12 March 2026, 09:12, so screenshots are stable.

| Page | What it does | Main components |
| --- | --- | --- |
| **Schedules** | A table of backup schedules with desktop selection (click, Shift/Ctrl-click, arrow keys); enable switches; a right-click menu; an "Upcoming runs" calendar; new/edit form; delete confirmation | `sn-command-bar`, `snSelectable`, table, hover card, context menu, calendar, `sn-modal-sheet` with toggle groups, date picker, slider, checkbox; alert dialog |
| **Destinations** | NAS, USB, cloud and SFTP destinations as cards or a list, filtered by kind; usage, status and encryption; verify, rename and remove (which also removes the schedules using it); a multi-step add form | cards / items, progress, spinner, dropdown menu, tooltip, toggle groups, `sn-coach-mark`, `sn-modal-sheet` with tabs, combobox, OTP code, input group, field validation; alert dialog |
| **Restore files** | Browse a snapshot: a folder list, a file table with desktop selection, search, a breadcrumb; restore or restore to a folder (keep both / replace / skip), with progress and a toast | select, autocomplete, breadcrumb, resizable panes, scroll area, `snSelectable`, context menu, `sn-inspector`, `sn-modal-sheet`, radio group, progress, skeleton, empty state |
| **Settings** | General, Backups, Notifications, Advanced and About tabs; every change saves immediately | `sn-settings-group` (each OS's settings layout), tabs, switches, radio group, native select, toggle group, slider, collapsible, textarea, accordion, alert dialog, avatar group, hover card, `kbd snShortcut`, `*snPlatformIf` |

Storybook has one story per page (*Harbor Backup → Window → Page · …*), and `npm run test:visual -- --project=harbor` screenshots every page on all seven skins in light and dark.

## Layer walkthrough (from the project page)

The same Backups settings screen (tabs Overview / Schedules / Settings, Automatic backups, Encrypt backups, destination "Office NAS", Cancel / Save) is built up one package at a time.

| Stage | What changes |
| --- | --- |
| Baseline: stock spartan/ui | Neutral zinc palette and web geometry. It works, but it looks like a website. |
| Layer 01: + theme | The system accent drives every color, with platform neutrals for light and dark. Shapes are still stock. |
| Layer 02: + helm | Each OS's control shapes, materials and hover, press and focus states. |
| Layer 03: + desktop-ui | Window chrome and OS patterns: the title bar and sidebar navigation. |
| Layer 04: + host adapter | Live values from the OS: accent, dark mode, text size and window focus (shown as an inactive window). |

This sequence makes a good demo for the docs playground. It is also a natural screenshot-regression suite.

## Acceptance

- Runs in the browser with `host-web` and in Wails with `host-wails`, with no UI code changes. Only `app.config.ts` differs.
- Looks correct on all 7 skins × light/dark × 5 text sizes × reduced transparency on/off × focused/inactive.
- Changing the OS accent or dark mode while the app is running updates it live.
