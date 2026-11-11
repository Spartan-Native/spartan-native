# 05 — Components (`@spartan-native/helm`)

The component comparison artboard (`Main.dc.html`, "Light vs dark per platform") shows 28 entries: the derived palette plus 27 spartan/helm component groups. Each is shown on all seven skins in light and dark, at every text size, with reduced transparency and window-focus toggles. Each one needs a skin per platform plus the states listed under the table.

| # | Component | spartan API | Mockup content to reproduce |
| --- | --- | --- | --- |
| 0 | Derived palette | theme tokens (CSS vars) | 12 swatches: background, surface, primary, primary-fg, secondary, accent-text, muted, border, destructive, success, warning, ring 50% |
| 1 | Button | `hlmBtn` | Primary, Secondary, Outline, Ghost, Delete (destructive), Disabled |
| 2 | Input & Label | `hlmInput` · `hlmLabel` | Email with helper "Used for sign-in only."; Display name in its focus state |
| 3 | Checkbox & Radio group | `hlm-checkbox` · `hlm-radio-group` | Auto-save drafts / Send usage data / Start at login; Compact / Comfortable / Spacious |
| 4 | Switch | `hlm-switch` | Follow system accent / Low power mode / Notifications |
| 5 | Slider & Progress | `hlm-slider` · `hlm-progress` | Volume 62%; Syncing files 45% |
| 6 | Select (open) | `hlm-select` | Small / Medium / Large / Extra large |
| 7 | Dialog | `hlm-alert-dialog` | "Save changes to 'Report.md'?" with Don't save / Cancel / Save; Enter saves, Esc cancels |
| 8 | Card | `hlmCard` | "Cloud sync" with Later / Turn on |
| 9 | Badge & Alert | `hlmBadge` · `hlmAlert` | Badges: Primary, Secondary, Outline, Success, Warning, Error; alert "Update available · Install" |
| 10 | Tabs | `hlm-tabs` | General / Appearance / Accounts |
| 11 | Toast | `hlm-toaster` (sonner) | "Export complete · report.pdf saved to Downloads · Open" |
| 12 | Textarea | `hlmTextarea` | Release notes with counter "58 / 500 characters" |
| 13 | Spinner & Skeleton | `hlm-spinner` · `hlmSkeleton` | "Loading…" |
| 14 | Toggle group | `hlm-toggle-group` | B / I / U (multi); align left/center/right (single) |
| 15 | Breadcrumb & Pagination | `hlm-breadcrumb` · `hlm-pagination` | Home › Documents › Reports; 9 pages with an ellipsis |
| 16 | Tooltip & Popover | `hlm-tooltip` · `hlm-popover` | "Sync now (Ctrl+S / ⌘S)"; "Share link · Copy link" |
| 17 | Avatar | `hlm-avatar` | AK Anna Kovács, Owner · online; group BT CS DN +3 |
| 18 | Context / Dropdown menu | `hlm-menu` | Cut, Copy, Paste, Rename…, Move to trash, with per-OS shortcuts |
| 19 | Accordion | `hlm-accordion` | 3 backup FAQ items |
| 20 | Combobox | `hlm-autocomplete` / `brn-popover` + command | Time zone filter with a "No matches" state |
| 21 | Command palette | `hlm-command` | Suggestions/Settings groups with filtering and a "No matching commands" state |
| 22 | Data table | `hlm-table` · tanstack sorting | Name/Size/Modified/Status with sorting, status badges and the desktop selection model |
| 23 | Menubar | `hlm-menubar` | Harbor · File / Edit / View / Help |
| 24 | Date picker | `hlm-date-picker` · `hlm-calendar` | "Next backup"; Monday-first, month navigation |
| 25 | Sheet (side drawer) | `hlm-sheet` | "Destinations · Edit destination" with Name/Path fields |
| 26 | Kbd & Separator | `hlm-kbd` · `hlmSeparator` | Command palette Ctrl K, New window Ctrl N, Preferences Ctrl , |
| 27 | Scroll area | `hlm-scroll-area` | "Activity log" |

## States every component must cover

- Hover, pressed (active), `:focus-visible` (accent ring `--ring`), disabled.
- Light and dark, all 5 text sizes, reduced transparency, inactive window.
- Selected/checked states use the platform's selection idiom:
  - **Windows 11:** accent pill indicator.
  - **Windows 10:** `primary 30%` fill.
  - **macOS:** accent fill, grey when the window is inactive.
  - **Breeze (KDE):** accent-outline hover, accent-filled selection.
  - **Material 3 (ChromeOS):** tonal fill.

## Desktop interaction rules (helm behaviors)

| Rule | Detail |
| --- | --- |
| Cursor | Arrow (`cursor: default`) on all controls, not the web hand pointer |
| Chrome text | Not selectable (`user-select: none`) on buttons, tabs, menus and title bars |
| Dialog keys | Enter triggers the default button, Esc cancels |
| Dialog button order | Per OS (Q5): Windows and KDE put the default button first and Cancel last; macOS puts the default button on the right, Cancel left of it and other buttons apart on the far left; GNOME puts Cancel first and the default button last. Mark the buttons with `snDefaultAction` / `snCancelAction`; hlm dialog footers and `[snDialogButtons]` reorder them |
| List and table selection | Click selects one; Shift-click selects a range from the anchor; Ctrl/⌘-click toggles; ↑ ↓ move; Home/End; type-ahead jumps by prefix; Ctrl/⌘A selects all; Esc clears. The table status line reads "{n} selected · click, Shift-click, Ctrl-click · ↑ ↓ Home End · type to jump · Ctrl+A · Esc clears" |
| Shortcut display | `⌘X` on macOS, `Ctrl+X` elsewhere; Rename is `↩` vs `F2`; Delete is `⌘⌫` vs `Del` |
| Accessibility | Real `<button>`/`<input>`; `aria-pressed`, `aria-checked`, `aria-selected`, `aria-sort`, `aria-expanded`, `aria-current="page"` as in the mockups; contrast ≥ 4.5:1 |

## Gaps (roadmap phase 06)

spartan has no tree view, number box, split button or status bar. `@spartan-native/desktop-ui` adds them: `<sn-tree>`, `<sn-number-box>`, `<sn-split-button>` and `<sn-status-bar>`, each drawn the way its OS draws it (see [06](06-os-patterns.md#other-desktop-ui-pieces)).
