import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideInbox, lucidePencil, lucidePlus, lucideTrash2 } from '@ng-icons/lucide';
import { SnCommandBarImports, SnMenuImports, SnStatusPage, type SnMenuItem } from '@spartan-native/desktop-ui';
import { SnSelectableImports } from '@spartan-native/helm';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { NewItemSheet, type NewItem } from '../../dialogs/new-item-sheet/new-item-sheet';

interface Item {
  id: string;
  name: string;
  kind: string;
  sizeMb: number;
}

/**
 * A view of records: a command bar over a selectable table, with an empty state.
 * Selection (click, Shift/Ctrl-click, arrows, Ctrl/⌘+A, type-ahead) comes from helm's snSelectable.
 */
@Component({
  selector: 'app-list-page',
  imports: [
    SnCommandBarImports,
    SnMenuImports,
    SnStatusPage,
    SnSelectableImports,
    HlmButtonImports,
    HlmDropdownMenuImports,
    HlmTableImports,
    NewItemSheet,
  ],
  providers: [provideIcons({ lucideInbox, lucidePencil, lucidePlus, lucideTrash2 })],
  templateUrl: './list-page.html',
  styleUrl: './list-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListPage {
  protected readonly items = signal<Item[]>([
    { id: '1', name: 'Quarterly report', kind: 'Document', sizeMb: 2.4 },
    { id: '2', name: 'Team photo', kind: 'Image', sizeMb: 5.1 },
  ]);

  /** Selected ids (stable keys, not indexes). */
  protected readonly selection = signal<readonly string[]>([]);
  protected readonly hasSelection = computed(() => this.selection().length > 0);
  protected readonly adding = signal(false);

  /** One menu definition; native on hosts with native menus, drawn in the page otherwise. */
  protected rowMenu(item: Item): SnMenuItem[] {
    return [
      { label: 'Open', action: () => this.open(item.id) },
      { label: 'Rename…', accelerator: 'f2', action: () => this.rename(item.id) },
      { type: 'separator' },
      { label: 'Delete', accelerator: 'delete', action: () => this.remove([item.id]) },
    ];
  }

  protected create(item: NewItem): void {
    this.items.update((list) => [...list, { id: crypto.randomUUID(), sizeMb: 0, ...item }]);
    this.adding.set(false);
  }

  protected open(id: string): void {
    // navigate to the item
  }

  protected rename(id: string): void {
    // open a rename sheet
  }

  protected remove(ids: readonly string[]): void {
    this.items.update((list) => list.filter((i) => !ids.includes(i.id)));
  }
}
