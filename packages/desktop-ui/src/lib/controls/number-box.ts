import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  forwardRef,
  inject,
  input,
  linkedSignal,
  model,
  numberAttribute,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { injectSkin, skinFamily, type Skin } from '@spartan-native/theme';

let nextId = 0;

/** Skins whose steppers read − / + (the others draw chevrons). */
const PLUS_MINUS: readonly Skin[] = ['gtk', 'cros', 'web'];

const REPEAT_DELAY_MS = 400;
const REPEAT_INTERVAL_MS = 60;

/**
 * Evaluates the simple arithmetic a Fluent NumberBox accepts: numbers, + − * /, parentheses
 * and unary minus. A comma works as the decimal separator too. Returns null for anything else
 * (no variables, no functions, nothing is executed).
 *
 * ```ts
 * evaluateNumberExpression('1.5 * (2 + 2)') // 6
 * evaluateNumberExpression('12,5')          // 12.5
 * ```
 */
export function evaluateNumberExpression(text: string): number | null {
  const tokens = text.replace(/,/g, '.').match(/\d*\.?\d+(?:e[+-]?\d+)?|[-+*/()]|\S/gi);
  if (!tokens) return null;
  let pos = 0;
  const peek = () => tokens[pos];

  const primary = (): number => {
    const token = tokens[pos++];
    if (token === '-') return -primary();
    if (token === '+') return primary();
    if (token === '(') {
      const value = sum();
      if (tokens[pos++] !== ')') throw new Error('missing )');
      return value;
    }
    const value = Number(token);
    if (token === undefined || !/^[\d.]/.test(token) || Number.isNaN(value)) throw new Error(`unexpected ${token}`);
    return value;
  };
  const product = (): number => {
    let value = primary();
    while (peek() === '*' || peek() === '/') value = tokens[pos++] === '*' ? value * primary() : value / primary();
    return value;
  };
  const sum = (): number => {
    let value = product();
    while (peek() === '+' || peek() === '-') value = tokens[pos++] === '+' ? value + product() : value - product();
    return value;
  };

  try {
    const value = sum();
    return pos === tokens.length && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

/** Decimal places of a number as written (0.25 → 2), to round away float noise after a step. */
function decimalsOf(n: number): number {
  const [, fraction = ''] = String(n).split('.');
  return fraction.length;
}

/**
 * A number field with step buttons, in the OS's own layout:
 *  - Windows 11 / 10: Fluent NumberBox, ∧ ∨ buttons inside the field (SpinButtonPlacementMode.Inline)
 *  - macOS 26 / 13–15: a text field with an NSStepper beside it (stacked arrows)
 *  - GNOME: GtkSpinButton, − and + buttons inside the entry's end, divided by lines
 *  - KDE: QSpinBox (Breeze), small stacked arrows inside the field
 *  - ChromeOS: an M3 text field with round − / + icon buttons at the end
 *
 * The field is drawn by the skin's text field, so it has the OS's border, focus and hover.
 * Keyboard: ↑ ↓ step, PgUp PgDn take a large step, Home End go to min / max, Enter commits,
 * Esc reverts what you typed. Typing `2*15` or `100/4` works (Fluent NumberBox math).
 * The step buttons repeat while held; they aren't Tab stops (the arrow keys do the same).
 *
 * Bind with `[(value)]`, or as a form control (`formControlName`, `[(ngModel)]`):
 *
 * ```html
 * <label hlmLabel for="keep">Keep versions</label>
 * <sn-number-box inputId="keep" [(value)]="versions" [min]="1" [max]="100" />
 * ```
 */
@Component({
  selector: 'sn-number-box',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SnNumberBox), multi: true }],
  host: {
    'data-slot': 'sn-number-box',
    '[attr.data-family]': 'family()',
    '[attr.data-skin]': 'skin()',
    '[attr.data-disabled]': "isDisabled() ? '' : null",
    '[attr.data-spin]': 'spinButtons() ? glyphs() : null',
  },
  template: `
    <input
      #field
      data-slot="input"
      type="text"
      inputmode="decimal"
      autocomplete="off"
      role="spinbutton"
      [id]="inputId()"
      [attr.aria-label]="ariaLabel() || null"
      [attr.aria-valuenow]="value()"
      [attr.aria-valuemin]="min()"
      [attr.aria-valuemax]="max()"
      [attr.aria-invalid]="invalid() || null"
      [attr.placeholder]="placeholder() || null"
      [disabled]="isDisabled()"
      [value]="draft()"
      (input)="onInput($event)"
      (keydown)="onKeydown($event)"
      (blur)="commit(); onTouched()"
      (wheel)="onWheel($event)"
    />
    @if (spinButtons()) {
      <span class="spin" aria-hidden="true">
        <button
          type="button"
          class="up"
          tabindex="-1"
          [disabled]="isDisabled() || atMax()"
          (pointerdown)="press($event, 1)"
          (pointerup)="release()"
          (pointerleave)="release()"
          (pointercancel)="release()"
        >
          @if (glyphs() === 'plus-minus') {
            <svg viewBox="0 0 16 16"><path d="M3.5 8h9M8 3.5v9" /></svg>
          } @else {
            <svg viewBox="0 0 16 16"><path d="M4 10l4-4 4 4" /></svg>
          }
        </button>
        <button
          type="button"
          class="down"
          tabindex="-1"
          [disabled]="isDisabled() || atMin()"
          (pointerdown)="press($event, -1)"
          (pointerup)="release()"
          (pointerleave)="release()"
          (pointercancel)="release()"
        >
          @if (glyphs() === 'plus-minus') {
            <svg viewBox="0 0 16 16"><path d="M3.5 8h9" /></svg>
          } @else {
            <svg viewBox="0 0 16 16"><path d="M4 6l4 4 4-4" /></svg>
          }
        </button>
      </span>
    }
  `,
  styleUrl: './number-box.scss',
})
export class SnNumberBox implements ControlValueAccessor {
  /** The number; null when the field is empty. Two-way bindable. */
  readonly value = model<number | null>(null);
  readonly min = input<number | null, unknown>(null, { transform: optionalNumber });
  readonly max = input<number | null, unknown>(null, { transform: optionalNumber });
  /** What ↑ ↓ and the buttons add or subtract. */
  readonly step = input(1, { transform: numberAttribute });
  /** What PgUp / PgDn add or subtract; defaults to 10 steps. */
  readonly largeStep = input<number | null, unknown>(null, { transform: optionalNumber });
  /** Round to this many decimal places (and always show them). Default: as typed. */
  readonly decimals = input<number | null, unknown>(null, { transform: optionalNumber });
  /** Show the step buttons. */
  readonly spinButtons = input(true, { transform: booleanAttribute });
  /** Accept arithmetic such as `2*15` (Fluent NumberBox). */
  readonly acceptsExpression = input(true, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly placeholder = input('');
  /** The input's id, for `<label for>`. */
  readonly inputId = input(`sn-number-box-${nextId++}`);
  /** Accessible name when there's no `<label for>`. */
  readonly ariaLabel = input('');

  protected readonly skin = injectSkin();
  protected readonly family = computed(() => skinFamily(this.skin()));
  protected readonly glyphs = computed(() => (PLUS_MINUS.includes(this.skin()) ? 'plus-minus' : 'chevrons'));

  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  /** The text in the field: the formatted value, or what the user is typing. */
  protected readonly draft = linkedSignal(() => this.format(this.value()));
  /** The text doesn't parse; shown until it's committed or reverted. */
  protected readonly invalid = computed(() => {
    const text = this.draft().trim();
    return text !== '' && this.parse(text) === null;
  });
  protected readonly atMin = computed(() => this.bound(this.min(), (v, b) => v <= b));
  protected readonly atMax = computed(() => this.bound(this.max(), (v, b) => v >= b));

  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');
  private repeatTimer: ReturnType<typeof setTimeout> | undefined;
  private onChange: (value: number | null) => void = () => {};
  protected onTouched: () => void = () => {};

  constructor() {
    inject(DestroyRef).onDestroy(() => this.release());
  }

  /** Adds `steps` × step (negative to subtract) and commits. */
  stepBy(steps: number, size = this.step()): void {
    if (this.isDisabled()) return;
    this.commit();
    const current = this.value();
    const base = current ?? (steps > 0 ? (this.min() ?? 0) : (this.max() ?? 0));
    const precision = Math.max(decimalsOf(base), decimalsOf(size));
    const next = current === null ? base : Number((base + steps * size).toFixed(precision));
    this.set(next);
  }

  /** Parses the text in the field and makes it the value; reverts text that doesn't parse. */
  commit(): void {
    const text = this.draft().trim();
    if (text === '') return this.set(null);
    const parsed = this.parse(text);
    if (parsed === null) return this.show(this.format(this.value()));
    this.set(parsed);
  }

  focus(): void {
    this.field().nativeElement.focus();
  }

  // --- Events ------------------------------------------------------------------------------
  protected onInput(event: Event): void {
    this.draft.set((event.target as HTMLInputElement).value);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const large = this.largeStep() ?? this.step() * 10;
    switch (event.key) {
      case 'ArrowUp':
        this.stepBy(1);
        break;
      case 'ArrowDown':
        this.stepBy(-1);
        break;
      case 'PageUp':
        this.stepBy(1, large);
        break;
      case 'PageDown':
        this.stepBy(-1, large);
        break;
      case 'Home':
        if (this.min() === null) return;
        this.set(this.min());
        break;
      case 'End':
        if (this.max() === null) return;
        this.set(this.max());
        break;
      case 'Enter':
        // commit, and let the event reach a dialog's default button
        this.commit();
        return;
      case 'Escape': {
        const formatted = this.format(this.value());
        if (this.draft() === formatted) return; // nothing to revert: let a dialog close
        this.show(formatted);
        break;
      }
      default:
        return;
    }
    event.preventDefault();
  }

  protected onWheel(event: WheelEvent): void {
    // only while focused, so scrolling the page past the field doesn't change it
    if (event.deltaY === 0 || this.field().nativeElement !== this.field().nativeElement.ownerDocument.activeElement)
      return;
    event.preventDefault();
    this.stepBy(event.deltaY < 0 ? 1 : -1);
  }

  protected press(event: PointerEvent, steps: number): void {
    if (event.button !== 0) return;
    event.preventDefault(); // keep the focus (and the caret) in the field
    this.field().nativeElement.focus();
    this.release();
    this.stepBy(steps);
    const repeat = () => {
      this.stepBy(steps);
      this.repeatTimer = setTimeout(repeat, REPEAT_INTERVAL_MS);
    };
    this.repeatTimer = setTimeout(repeat, REPEAT_DELAY_MS);
  }

  protected release(): void {
    clearTimeout(this.repeatTimer);
    this.repeatTimer = undefined;
  }

  // --- ControlValueAccessor ------------------------------------------------------------------
  writeValue(value: unknown): void {
    this.value.set(typeof value === 'number' && Number.isFinite(value) ? value : null);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }

  // --- Helpers -----------------------------------------------------------------------------
  private set(value: number | null): void {
    let next = value;
    if (next !== null) {
      const min = this.min();
      const max = this.max();
      if (min !== null) next = Math.max(min, next);
      if (max !== null) next = Math.min(max, next);
      const decimals = this.decimals();
      if (decimals !== null) next = Number(next.toFixed(decimals));
    }
    // the text may differ from the value (e.g. "2*3" for 6) even when the value doesn't change
    this.show(this.format(next));
    if (next === this.value()) return;
    this.value.set(next);
    this.onChange(next);
  }

  /**
   * Puts `text` in the field. Written to the element too: when the value didn't change, the
   * `[value]` binding sees the same string as last time and wouldn't replace what was typed.
   */
  private show(text: string): void {
    this.draft.set(text);
    const field = this.field().nativeElement;
    if (field.value !== text) field.value = text;
  }

  private parse(text: string): number | null {
    if (this.acceptsExpression()) return evaluateNumberExpression(text);
    const n = Number(text.replace(',', '.'));
    return text !== '' && Number.isFinite(n) ? n : null;
  }

  private format(value: number | null): string {
    if (value === null) return '';
    const decimals = this.decimals();
    return decimals === null ? String(value) : value.toFixed(decimals);
  }

  private bound(bound: number | null, reached: (value: number, bound: number) => boolean): boolean {
    const value = this.value();
    return bound !== null && value !== null && reached(value, bound);
  }
}

function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = numberAttribute(value, NaN);
  return Number.isNaN(n) ? null : n;
}
