# 08 — Sample app: Harbor Backup

Harbor Backup is the reference app: one window with sidebar navigation and five pages (Overview, Schedules, Destinations, Restore files, Settings), shown on every skin in light and dark. It is the end-to-end acceptance test for every package and adapter: it must run in the browser with `host-web` and in Wails with `host-wails`, with only `app.config.ts` differing.

It lives in its own repository, [`Spartan-Native/harbor`](https://github.com/Spartan-Native/harbor), and installs the `@spartan-native/*` packages from npm like any other app. The full spec (window, pages, layer walkthrough, acceptance criteria) is `docs/sample-app.md` there, and the design source is [`reference/design-source/SampleApp.dc.html`](reference/design-source/SampleApp.dc.html) here.

## Acceptance

- Runs in the browser with `host-web` and in Wails with `host-wails`, with no UI code changes. Only `app.config.ts` differs.
- Looks correct on all 7 skins × light/dark × 5 text sizes × reduced transparency on/off × focused/inactive.
- Changing the OS accent or dark mode while the app is running updates it live.
