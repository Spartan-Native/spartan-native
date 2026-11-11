import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { injectSkin, skinFamily } from '@spartan-native/theme';

/**
 * A list of setup tasks: numbered rows that tick off as they are done, each with an action.
 *
 * ```html
 * <sn-checklist aria-label="Get started">
 *   <sn-checklist-item title="Add a destination" [done]="hasDestination()">
 *     Where your backups go: a disk, a NAS or the cloud.
 *     <button hlmBtn size="sm" snChecklistAction (click)="add()">Add…</button>
 *   </sn-checklist-item>
 *   <sn-checklist-item title="Choose what to back up">…</sn-checklist-item>
 * </sn-checklist>
 * ```
 */
@Component({
  selector: 'sn-checklist',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sn-checklist',
    role: 'list',
    '[attr.data-family]': 'family()',
    '[attr.data-skin]': 'skin()',
  },
  template: '<ng-content />',
  styleUrl: './checklist.scss',
})
export class SnChecklist {
  protected readonly skin = injectSkin();
  protected readonly family = computed(() => skinFamily(this.skin()));
}

/**
 * One task of an `<sn-checklist>`: a number (a tick once `done`), the title, a description
 * (the content) and an action (`[snChecklistAction]`, hidden once done unless `keepAction`).
 */
@Component({
  selector: 'sn-checklist-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sn-checklist-item',
    role: 'listitem',
    '[attr.data-done]': 'done() ? "" : null',
    '[attr.data-keep-action]': 'keepAction() ? "" : null',
  },
  template: `
    <span class="marker" aria-hidden="true">
      @if (done()) {
        <svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" /></svg>
      }
    </span>
    <div class="text">
      <span class="title">{{ title() }}<span class="state"> ({{ done() ? doneLabel() : todoLabel() }})</span></span>
      <div class="description"><ng-content /></div>
    </div>
    <div class="action"><ng-content select="[snChecklistAction]" /></div>
  `,
  styleUrl: './checklist.scss',
})
export class SnChecklistItem {
  readonly title = input.required<string>();
  readonly done = input(false, { transform: booleanAttribute });
  /** Keep the action visible once the task is done (e.g. "Change…"). */
  readonly keepAction = input(false, { transform: booleanAttribute });
  /** Read by screen readers after the title. */
  readonly doneLabel = input('done');
  readonly todoLabel = input('to do');
}

export const SnChecklistImports = [SnChecklist, SnChecklistItem] as const;
