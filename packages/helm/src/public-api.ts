/*
 * Public API surface of @spartan-native/helm: desktop behaviors for spartan/ui.
 * Styles: @use '@spartan-native/helm/styles/spartan-native-helm' after the theme.
 */

// Desktop selection model (lists and tables)
export {
  EMPTY_SELECTION,
  SELECTION_PAGE_SIZE,
  selectionAll,
  selectionClear,
  selectionClick,
  selectionMoveBy,
  selectionMoveTo,
  selectionSync,
  selectionToggleActive,
  TYPEAHEAD_RESET_MS,
  typeaheadIndex,
} from './lib/selection/selection-model';
export type { SelectionModifiers, SelectionState } from './lib/selection/selection-model';
export { SnSelectable, SnSelectableImports, SnSelectableItem } from './lib/selection/selectable';
export type { SelectableRole } from './lib/selection/selectable';

// Default (Enter) and cancel (Esc) buttons
export {
  SnActionScope,
  SnCancelAction,
  SnDefaultAction,
  SnDialogActionsImports,
  SnDialogButtons,
} from './lib/actions/dialog-actions';
