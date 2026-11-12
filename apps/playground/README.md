# Docs playground

Every component and OS pattern on every skin, with the same controls as the design canvas (skin, accent, light/dark, text size, transparency, window focus). It replaces the canvas as the living spec.

> Status: **not built yet.** The app is still the Angular CLI starter page. Until it is built, the three Storybooks (`npm run storybook:theme`, `:helm`, `:desktop-ui`) are the living spec. See the [roadmap](../../docs/09-roadmap.md).

```bash
npx ng serve playground
npx ng build playground
```

## Target design

The playground reproduces the design canvas's comparison views: pick a component or pattern, then see it on every skin, with light and dark side by side.

![Component comparison: Button on every skin](../../docs/images/helm-button.jpg)

![OS pattern comparison: settings list](../../docs/images/desktop-ui-settings-list.jpg)
