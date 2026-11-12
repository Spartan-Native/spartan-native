# @spartan-native/helm

**Layer 02 · optional.** Desktop **behaviors** for stock spartan/ui. `@spartan-native/theme` makes the components _look_ native; helm makes them _behave_ like a desktop app.

> Status: **first components implemented**: the desktop selection model and the default/cancel buttons. Spec: [`05-components.md`](https://github.com/Spartan-Native/spartan-native/blob/main/docs/05-components.md) (desktop interaction rules).

## Components

| Directive | What it does |
| --- | --- |
| `snSelectable` + `snSelectableItem` | The desktop selection model for lists (`snSelectable`, `role="listbox"`) and tables (`snSelectable="grid"`) |
| `snDefaultAction` | Enter in the surrounding dialog or form presses this button |
| `snCancelAction` | Esc in the surrounding dialog or form presses this button |
| `snActionScope` | Marks a custom area for the two above (dialogs and forms are scopes already) |
| `snDialogButtons` | A row of dialog buttons in the OS's order: default, cancel and other buttons move to where the skin puts them (`--sn-dialog-order-*`). hlm dialog and alert-dialog footers get this without the directive |

### Selection model

```html
<div snSelectable [(selection)]="selected" (activated)="open($event)" aria-label="Files">
  @for (f of files; track f.id) {
  <div snSelectableItem [value]="f.id">{{ f.name }}</div>
  }
</div>

<table hlmTable snSelectable="grid" [(selection)]="selected">
  <tbody hlmTBody>
    @for (row of rows; track row.id) {
    <tr hlmTr snSelectableItem [value]="row.id">
      …
    </tr>
    }
  </tbody>
</table>
```

| Input | Action |
| --- | --- |
| Click | Select one row |
| Ctrl-click (⌘-click on macOS) | Toggle a row |
| Shift-click | Select the range from the anchor (with Ctrl/⌘: add it) |
| ↑ ↓ · Home End · PageUp PageDown | Move and select; Shift extends; Ctrl moves the focus only; on macOS ⌘↑ / ⌘↓ jump to the ends |
| Space / Ctrl+Space | Select / toggle the focused row |
| Ctrl+A (⌘A) | Select all |
| Esc | Clear the selection (then lets a dialog close) |
| Typing | Jump to the next row starting with the typed text; a repeated letter cycles |
| Enter, double-click | `activated` emits the row's key |

Inputs: `selection` (two-way, keys in row order), `multiple` (default `true`), `snSelectableLabel` on a row for type-ahead text. ARIA: `listbox`/`option` or `grid`/`row`, `aria-selected`, `aria-multiselectable`, `aria-activedescendant`.

The logic is a set of pure functions in `selection-model.ts` (`selectionClick`, `selectionMoveBy`, `typeaheadIndex`, …), usable without Angular.

### Default and cancel buttons

```html
<form>
  <input hlmInput />
  <button hlmBtn variant="outline" snCancelAction (click)="close()">Cancel</button>
  <button hlmBtn snDefaultAction (click)="save()">Save</button>
</form>
```

Enter is left alone in multi-line text, on other buttons and links, and in lists and menus. A disabled button is skipped.

## Styles

```scss
// after the theme
@use '@spartan-native/theme/styles/spartan-native';
@use '@spartan-native/helm/styles/spartan-native-helm';
```

The styles contain **no per-OS rules**. They read the theme's row tokens, so each skin decides the look:

| Token | Windows 11 | macOS 26 | GNOME |
| --- | --- | --- | --- |
| `--sn-row-selected-bg` | neutral fill + accent pill (`--sn-row-selected-indicator`) | accent fill, white text | accent tint |
| `--sn-row-selected-bg-unfocused` | same | grey (also when the window is inactive) | same |
| `--sn-row-focus-ring` | 2px foreground | 2px accent | 2px accent |

Hooks: `[data-slot="sn-selectable"]`, `[data-slot="sn-selectable-item"]` with `[data-selected]` and `[data-active]`. Tip: derive secondary text in rows from `currentColor`, so it stays readable on the macOS accent fill.

## Structure

| Path                 | Purpose                                                            |
| -------------------- | ------------------------------------------------------------------ |
| `src/lib/selection/` | `selection-model.ts` (pure logic) and `selectable.ts` (directives) |
| `src/lib/actions/`   | `snDefaultAction`, `snCancelAction`, `snActionScope`               |
| `styles/`            | Published as `@spartan-native/helm/styles/*`                       |
| `src/stories/`       | Storybook: Selection (list, table), Default & cancel buttons       |
| `.storybook/`        | Toolbar from `@spartan-native/theme/storybook`, plus window focus  |

## Dependencies

`@spartan-native/theme` (peer), Angular `^22.2.0`, spartan/ui `^1.9.0`. The stories use the stock spartan components from the workspace (`@spartan-ng/helm/*`).

## Commands

```bash
npm run storybook:helm      # http://localhost:6007
npx ng test helm            # 20 tests: selection model, directives, default/cancel
npx ng build helm
```
