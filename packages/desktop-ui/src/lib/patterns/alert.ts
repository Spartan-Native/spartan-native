import { DOCUMENT } from '@angular/common';
import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  computed,
  createComponent,
  EnvironmentInjector,
  inject,
  Injectable,
  input,
  signal,
} from '@angular/core';
import { NATIVE_HOST, type MessageOptions } from '@spartan-native/theme';
import { SnModalSheet } from './modal-sheet';

/** The words of `SnAlert.confirm()`. */
export interface SnConfirmOptions {
  /** A short heading; the message goes under it. */
  readonly title?: string;
  /** Default: `'question'`. */
  readonly kind?: MessageOptions['kind'];
  /** The button that confirms. Default: "OK". Say what it does ("Send", "Delete") where you can. */
  readonly confirmLabel?: string;
  /** Default: "Cancel". */
  readonly cancelLabel?: string;
}

const OK = { id: 'ok', label: 'OK' } as const;

/**
 * @internal The in-page alert: an `alertdialog` sheet with the buttons of the options, the
 * default one focused (Enter presses it), Esc and the cancel button answering `cancelId`.
 */
@Component({
  selector: 'sn-alert-sheet',
  imports: [SnModalSheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-slot': 'sn-alert-sheet' },
  // The buttons come from a loop, so each group is projected into its slot with ngProjectAs.
  template: `
    <sn-modal-sheet
      [role]="'alertdialog'"
      [open]="open()"
      (openChange)="!$event && answer(options().cancelId ?? null)"
      [title]="options().title || options().message"
    >
      @if (options().title) {
        <p class="message">{{ options().message }}</p>
      }
      <ng-container ngProjectAs="[snSheetSecondary]">
        @for (b of others(); track b.id) {
          <button type="button" data-slot="button" class="sn-alert-button border-border" (click)="answer(b.id)">
            {{ b.label }}
          </button>
        }
      </ng-container>
      <ng-container ngProjectAs="[snSheetCancel]">
        @if (cancel(); as b) {
          <button type="button" data-slot="button" class="sn-alert-button border-border">{{ b.label }}</button>
        }
      </ng-container>
      <ng-container ngProjectAs="[snSheetPrimary]">
        @if (primary(); as b) {
          <button
            type="button"
            data-slot="button"
            class="sn-alert-button bg-primary"
            cdkFocusInitial
            [attr.data-kind]="options().kind ?? 'info'"
            (click)="answer(b.id)"
          >
            {{ b.label }}
          </button>
        }
      </ng-container>
    </sn-modal-sheet>
  `,
  styleUrl: './alert.scss',
})
export class SnAlertSheet {
  readonly options = input.required<MessageOptions>();
  /** Called once with the pressed button's id (null: dismissed without a cancel button). */
  readonly answered = input.required<(id: string | null) => void>();

  protected readonly open = signal(true);
  protected readonly buttons = computed(() => (this.options().buttons?.length ? this.options().buttons! : [OK]));
  /** Enter's button: `defaultId`, else the first one that isn't Cancel. */
  protected readonly defaultId = computed(() => {
    const { defaultId, cancelId } = this.options();
    return defaultId ?? this.buttons().find((b) => b.id !== cancelId)?.id ?? this.buttons()[0].id;
  });
  protected readonly primary = computed(() => this.buttons().find((b) => b.id === this.defaultId()) ?? null);
  protected readonly cancel = computed(() => {
    const { cancelId } = this.options();
    return this.buttons().find((b) => b.id === cancelId && b.id !== this.defaultId()) ?? null;
  });
  protected readonly others = computed(() => this.buttons().filter((b) => b !== this.primary() && b !== this.cancel()));
  private done = false;

  protected answer(id: string | null): void {
    if (this.done) return;
    this.done = true;
    this.open.set(false);
    this.answered()(id);
  }
}

/**
 * Alerts and confirmations, native where the host can draw them. The host's alert
 * (`NativeHost.dialogs.message`) is used when there is one: the real NSAlert, TaskDialog or
 * AdwAlertDialog. Otherwise, in the browser and on hosts without one, an in-page
 * `alertdialog` sheet in the skin's dialog layout. Either way you get the same answer:
 *
 * ```ts
 * private readonly alert = inject(SnAlert);
 *
 * async remove() {
 *   if (!(await this.alert.confirm('Delete “Q3 report.pdf”?', { confirmLabel: 'Delete', kind: 'warning' }))) return;
 *   …
 * }
 *
 * const answer = await this.alert.show({
 *   kind: 'warning',
 *   message: 'Save changes to “Report.md”?',
 *   buttons: [{ id: 'save', label: 'Save' }, { id: 'discard', label: "Don't Save" }, { id: 'cancel', label: 'Cancel' }],
 *   defaultId: 'save',
 *   cancelId: 'cancel',
 * });
 * ```
 *
 * In the in-page sheet, Enter presses the default button (`defaultId`, else the first button
 * that isn't Cancel) and Esc presses `cancelId`. On macOS it hangs from the window marked
 * `snSheetHost`, like `<sn-modal-sheet>`.
 */
@Injectable({ providedIn: 'root' })
export class SnAlert {
  private readonly host = inject(NATIVE_HOST, { optional: true });
  private readonly appRef = inject(ApplicationRef);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly document = inject(DOCUMENT);

  /**
   * Shows the alert and resolves the id of the pressed button: `cancelId` when it was dismissed
   * (Esc, the window's close button), or null when there is no `cancelId`.
   */
  show(options: MessageOptions): Promise<string | null> {
    const native = this.host?.dialogs?.message;
    if (native) return native.call(this.host!.dialogs, options);
    return this.inPage(options);
  }

  /** "Are you sure?": true when the user pressed the confirm button. */
  async confirm(message: string, options: SnConfirmOptions = {}): Promise<boolean> {
    const answer = await this.show({
      kind: options.kind ?? 'question',
      title: options.title,
      message,
      buttons: [
        { id: 'confirm', label: options.confirmLabel ?? 'OK' },
        { id: 'cancel', label: options.cancelLabel ?? 'Cancel' },
      ],
      defaultId: 'confirm',
      cancelId: 'cancel',
    });
    return answer === 'confirm';
  }

  private inPage(options: MessageOptions): Promise<string | null> {
    return new Promise((resolve) => {
      const ref = createComponent(SnAlertSheet, { environmentInjector: this.environmentInjector });
      ref.setInput('options', options);
      ref.setInput('answered', (id: string | null) => {
        resolve(id);
        // Let the sheet close (and give the focus back) before it goes.
        queueMicrotask(() => {
          this.appRef.detachView(ref.hostView);
          ref.destroy();
        });
      });
      (this.document.querySelector('[snSheetHost]') ?? this.document.body).appendChild(ref.location.nativeElement);
      this.appRef.attachView(ref.hostView);
    });
  }
}
