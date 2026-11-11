import { ChangeDetectionStrategy, Component, model, output, signal } from '@angular/core';
import { SnModalSheet } from '@spartan-native/desktop-ui';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';

export interface NewItem {
  name: string;
  kind: string;
}

/**
 * A short modal form. It renders as a macOS sheet, a Windows ContentDialog, a GNOME AdwDialog…
 * The buttons are marked (snSheetCancel / snSheetPrimary) and placed in the OS's order.
 * Enter submits the form (the primary button is its submit button) and Esc cancels.
 * Outside sn-modal-sheet (hlm-dialog, a card footer), use helm's snDefaultAction / snCancelAction.
 *
 * Usage: <app-new-item-sheet [(open)]="adding" (created)="create($event)" />
 * On macOS the sheet hangs from the nearest [snSheetHost] (the window in app-shell).
 */
@Component({
  selector: 'app-new-item-sheet',
  imports: [SnModalSheet, HlmButtonImports, HlmInputImports, HlmLabelImports],
  templateUrl: './new-item-sheet.html',
  styleUrl: './new-item-sheet.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewItemSheet {
  readonly open = model(false);
  readonly created = output<NewItem>();

  protected readonly name = signal('');
  protected readonly kind = signal('Document');

  protected submit(): void {
    const name = this.name().trim();
    if (!name) return;
    this.created.emit({ name, kind: this.kind() });
    this.name.set('');
    this.open.set(false); // the primary button doesn't close the sheet by itself
  }
}
