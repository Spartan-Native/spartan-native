# 08 — Sample app: Harbor Backup

> **Describes:** the sample app, which lives in its own repository. Its full specification is there.

Harbor Backup is the reference app: one window with sidebar navigation and five pages (Overview, Schedules, Destinations, Restore files, Settings), shown on every skin in light and dark. It is the end-to-end acceptance test for every package and adapter: it runs in the browser and as a PWA with `host-web`, and as a desktop app in Wails with `host-wails`, with only `app.config.ts` differing. Tauri and Photino.NET shells are planned (see the [roadmap](09-roadmap.md)).

It lives in its own repository, [`Spartan-Native/harbor`](https://github.com/Spartan-Native/harbor), and installs the `@spartan-native/*` packages from npm like any other app. The full specification (window, pages, layer walkthrough, acceptance criteria) is `docs/sample-app.md` in that repository. Its original design mockup is archived here as [`reference/design-source/SampleApp.dc.html`](reference/design-source/SampleApp.dc.html).

## Acceptance

- Runs in the browser with `host-web` and in Wails with `host-wails`, with no UI code changes. Only `app.config.ts` differs.
- Looks correct on all 7 skins × light/dark × 5 text sizes × reduced transparency on/off × focused/inactive.
- Changing the OS accent or dark mode while the app is running updates it live.
