# AGENTS.md: @spartan-native/helm

Instructions for AI coding agents building an Angular app with `@spartan-native/helm`.

## What this package is

Layer 02 of Spartan Native (optional). `@spartan-native/theme` makes stock spartan/ui _look_ native. helm makes it _behave_ like a desktop app: OS-correct list and table selection, Enter/Esc on the default and cancel buttons, and dialog buttons in each OS's order. It's directives only. You keep using the stock `hlm*` components and add helm's attributes to them.

Requires `@spartan-native/theme` (with `provideSpartanNative()`) and its stylesheet.

```scss
// after the theme
@use '@spartan-native/theme/styles/spartan-native';
@use '@spartan-native/helm/styles/spartan-native-helm';
```

## Public API (`import … from '@spartan-native/helm'`)

| Import | Directives |
| --- | --- |
| `SnSelectableImports` | `snSelectable`, `snSelectableItem` |
| `SnDialogActionsImports` | `snDefaultAction`, `snCancelAction`, `snActionScope`, `snDialogButtons` |
| Pure functions | `selectionClick`, `selectionMoveTo`, `selectionMoveBy`, `selectionToggleActive`, `selectionAll`, `selectionClear`, `selectionSync`, `typeaheadIndex`, `EMPTY_SELECTION`, the constants `SELECTION_PAGE_SIZE` (10) and `TYPEAHEAD_RESET_MS` (600), types `SelectionState`, `SelectionModifiers` |

### Lists and tables: `snSelectable`

Use it for any list or table where users select rows (files, records, messages). Don't hand-roll click/Shift/Ctrl handling.

```html
<div snSelectable [(selection)]="selected" (activated)="open($event)" aria-label="Files">
  @for (f of files(); track f.id) {
  <div snSelectableItem [value]="f.id">{{ f.name }}</div>
  }
</div>

<table hlmTable snSelectable="grid" [(selection)]="selected" aria-label="Backups">
  <tbody hlmTBody>
    @for (row of rows(); track row.id) {
    <tr hlmTr snSelectableItem [value]="row.id">
      …
    </tr>
    }
  </tbody>
</table>
```

- `selection`: two-way, the selected keys in row order. `multiple` defaults to `true`. `activated` emits a key on Enter or double-click.
- `snSelectableLabel` on a row sets its type-ahead text, when the visible text isn't the label.
- It handles: click, Ctrl-click (⌘ on macOS), Shift-click ranges, arrow keys, Home/End, PageUp/PageDown, Space, Ctrl/⌘+A, Esc, type-ahead. ARIA roles and `aria-selected` / `aria-activedescendant` are set for you, so don't add them yourself.
- Styling hooks: `[data-slot="sn-selectable-item"][data-selected]` and `[data-active]`. Colors come from the theme's `--sn-row-*` tokens. Derive secondary row text from `currentColor` so it stays readable on the macOS accent fill.

### Default and cancel buttons

```html
<form>
  <input hlmInput />
  <div snDialogButtons>
    <button hlmBtn snDefaultAction (click)="save()">Save</button>
    <button hlmBtn variant="outline" (click)="discard()">Don't save</button>
    <button hlmBtn variant="outline" snCancelAction (click)="close()">Cancel</button>
  </div>
</form>
```

- `snDefaultAction` (only on a `<button>`): Enter anywhere in the surrounding `form`, `[role=dialog]`, `[role=alertdialog]` or `[snActionScope]` presses it. Enter is left alone in textareas, on other buttons and links, and in lists and menus. A disabled button is skipped.
- `snCancelAction` (only on a `<button>`): Esc in the same scope presses it.
- `snActionScope`: marks a custom area as a scope.
- **Every dialog and form with a primary action should mark its buttons with these.**

### Dialog button order: `snDialogButtons`

Write the buttons in any order. Mark the default and cancel buttons, and the skin places them:

| Skin          | Order                        |
| ------------- | ---------------------------- |
| Windows, KDE  | default · other · Cancel     |
| macOS         | other ‹gap› Cancel · default |
| GNOME         | Cancel · other · default     |
| ChromeOS, web | other · Cancel · default     |

- `hlm-dialog-footer` and `hlm-alert-dialog-footer` get this automatically. Add `snDialogButtons` only to other button rows, such as a card footer (`<div hlmCardFooter snDialogButtons>`).
- A row with neither a default nor a cancel button keeps its source order.
- Don't re-sort buttons in code per OS, and don't use `flex-row-reverse` tricks.
- The per-skin tokens are `--sn-dialog-order-default|cancel|other` and `--sn-dialog-other-push`.

## Rules

1. Use the stock `@spartan-ng/helm/*` components and add helm directives to them. Don't wrap or fork them.
2. Selection keys must be stable (ids, not indexes): rows that disappear are dropped from the selection automatically.
3. The pure `selection*` functions work without Angular, for example in a store or a canvas list.
