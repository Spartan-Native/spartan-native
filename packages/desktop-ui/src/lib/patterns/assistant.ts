import { NgTemplateOutlet } from '@angular/common';
import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  Directive,
  ElementRef,
  inject,
  input,
  model,
  output,
  TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import { injectSkin, skinFamily, type PlatformFamily, type Skin } from '@spartan-native/theme';

let nextId = 0;

/**
 * One page of an `<sn-assistant>`.
 *
 * ```html
 * <ng-template snAssistantPage title="Destination" [canContinue]="form.valid">…</ng-template>
 * ```
 */
@Directive({ selector: 'ng-template[snAssistantPage]' })
export class SnAssistantPage {
  readonly template = inject(TemplateRef);
  /** The page's title, shown as its heading (and in the KDE step list). */
  readonly title = input.required<string>();
  /** False disables Next / Continue (e.g. while the page's form is invalid). Default: true. */
  readonly canContinue = input(true, { transform: booleanAttribute });
}

/** Skins that show page dots under a multi-page assistant (GNOME, ChromeOS and the web fallback). */
const PAGE_DOTS: Record<Skin, boolean> = {
  win: false,
  w10: false,
  mac: false,
  macc: false,
  gtk: true,
  qt: false,
  cros: true,
  web: true,
};

/** The words each OS uses for an assistant's buttons. */
const LABELS: Record<PlatformFamily, { back: string; next: string; finish: string; cancel: string }> = {
  windows: { back: 'Back', next: 'Next', finish: 'Finish', cancel: 'Cancel' },
  macos: { back: 'Go Back', next: 'Continue', finish: 'Done', cancel: 'Cancel' },
  linux: { back: 'Back', next: 'Next', finish: 'Done', cancel: 'Cancel' },
  chromeos: { back: 'Back', next: 'Next', finish: 'Done', cancel: 'Cancel' },
  web: { back: 'Back', next: 'Next', finish: 'Done', cancel: 'Cancel' },
};

/**
 * A step-by-step setup flow, laid out the way each OS does it:
 *  - Windows: a wizard, "Step 2 of 4" over the page title, Back · Next · Cancel at the bottom right
 *  - macOS: a Setup Assistant page, large centered title, Go Back · Continue at the bottom right
 *  - GNOME: Back and Next in a header bar around the page title, page dots at the bottom
 *  - KDE: a QWizard with the list of steps at the side, Back · Next · Cancel at the bottom right
 *  - ChromeOS: an M3 flow, headline, page dots, Back · Next at the bottom end
 *
 * Pages are templates; only the current one is rendered. Next becomes Finish / Done on the last
 * page and emits `finish`; Cancel emits `cancel`. Bind `step` to keep or set the page. Put it in an
 * `<sn-modal-sheet>` (without sheet buttons) for a modal assistant, or in a window as a page.
 *
 * ```html
 * <sn-assistant [(step)]="step" (finish)="save()" (cancel)="open.set(false)">
 *   <ng-template snAssistantPage title="Welcome">…</ng-template>
 *   <ng-template snAssistantPage title="Destination" [canContinue]="destination() !== null">…</ng-template>
 *   <ng-template snAssistantPage title="Schedule">…</ng-template>
 * </sn-assistant>
 * ```
 *
 * The buttons carry spartan's button hooks (`data-slot="button"`), so the theme draws them as each
 * skin's standard and accent buttons. Their words follow the OS (Continue on macOS, Finish on
 * Windows…); set `backLabel`, `nextLabel`, `finishLabel`, `cancelLabel` to translate them.
 */
@Component({
  selector: 'sn-assistant',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sn-assistant',
    '[attr.data-family]': 'family()',
    '[attr.data-skin]': 'skin()',
  },
  template: `
    @if (skin() === 'qt') {
      <ol class="steps">
        @for (page of pages(); track page; let i = $index) {
          <li [attr.aria-current]="i === current() ? 'step' : null" [attr.data-done]="i < current() ? '' : null">
            {{ page.title() }}
          </li>
        }
      </ol>
    }
    <div class="main">
      <div class="head">
        @if (family() === 'windows' && pages().length > 1) {
          <span class="progress">{{ progressText() }}</span>
        }
        <h2 #heading class="page-title" tabindex="-1" [id]="headingId">{{ page()?.title() }}</h2>
      </div>
      <div class="page" role="group" [attr.aria-labelledby]="headingId">
        @if (page(); as p) {
          <ng-container [ngTemplateOutlet]="p.template" />
        }
      </div>
      @if (showDots()) {
        <div class="dots" aria-hidden="true">
          @for (page of pages(); track page; let i = $index) {
            <span class="dot" [attr.data-current]="i === current() ? '' : null"></span>
          }
        </div>
      }
      <div class="nav">
        @if (cancelable()) {
          <button
            type="button"
            data-slot="button"
            class="sn-assistant-button cancel border-border"
            (click)="cancel.emit()"
          >
            {{ cancelLabel() || words().cancel }}
          </button>
        }
        @if (current() > 0) {
          <button type="button" data-slot="button" class="sn-assistant-button back border-border" (click)="back()">
            {{ backLabel() || words().back }}
          </button>
        }
        <button
          type="button"
          data-slot="button"
          class="sn-assistant-button next bg-primary"
          [disabled]="!page()?.canContinue()"
          (click)="next()"
        >
          {{ last() ? finishLabel() || words().finish : nextLabel() || words().next }}
        </button>
      </div>
    </div>
  `,
  styleUrl: './assistant.scss',
})
export class SnAssistant {
  /** The current page, from 0. */
  readonly step = model(0);
  /** Show a Cancel button. Default: true. */
  readonly cancelable = input(true, { transform: booleanAttribute });
  readonly backLabel = input('');
  readonly nextLabel = input('');
  readonly finishLabel = input('');
  readonly cancelLabel = input('');
  /** "Step {current} of {total}" on Windows; `{current}` and `{total}` are replaced. */
  readonly progressLabel = input('Step {current} of {total}');

  /** Next on the last page. */
  readonly finish = output<void>();
  // eslint-disable-next-line @angular-eslint/no-output-native -- public API; the DOM `cancel` event (dialogs) doesn't bubble, so it can't collide
  readonly cancel = output<void>();

  protected readonly skin = injectSkin();
  protected readonly family = computed(() => skinFamily(this.skin()));
  protected readonly words = computed(() => LABELS[this.family()]);
  protected readonly pages = contentChildren(SnAssistantPage);
  protected readonly current = computed(() => Math.min(Math.max(this.step(), 0), Math.max(this.pages().length - 1, 0)));
  protected readonly page = computed(() => this.pages()[this.current()] ?? null);
  protected readonly last = computed(() => this.current() >= this.pages().length - 1);
  protected readonly showDots = computed(() => PAGE_DOTS[this.skin()] && this.pages().length > 1);
  protected readonly progressText = computed(() =>
    this.progressLabel()
      .replace('{current}', String(this.current() + 1))
      .replace('{total}', String(this.pages().length)),
  );
  protected readonly headingId = `sn-assistant-heading-${nextId++}`;

  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    // A new page: move the focus to its title (screen readers read it), unless the user is
    // typing somewhere outside the assistant.
    let first = true;
    afterRenderEffect(() => {
      this.current();
      if (first) {
        first = false;
        return;
      }
      untracked(() => {
        const active = this.host.ownerDocument.activeElement;
        if (!active || active === this.host.ownerDocument.body || this.host.contains(active))
          this.heading().nativeElement.focus();
      });
    });
  }

  /** Goes to the next page, or emits `finish` on the last one. */
  next(): void {
    if (!this.page()?.canContinue()) return;
    if (this.last()) this.finish.emit();
    else this.step.set(this.current() + 1);
  }

  /** Goes to the previous page. */
  back(): void {
    if (this.current() > 0) this.step.set(this.current() - 1);
  }
}

export const SnAssistantImports = [SnAssistant, SnAssistantPage] as const;
