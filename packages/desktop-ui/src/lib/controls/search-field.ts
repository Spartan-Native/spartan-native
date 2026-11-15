import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { injectSkin, skinFamily } from '@spartan-native/theme';

/**
 * The platform's search field: a text field with a magnifier and a clear button, drawn as each
 * skin draws its text fields.
 *  - macOS (NSSearchField), GNOME (GtkSearchEntry), KDE and ChromeOS: magnifier at the start
 *  - Windows (AutoSuggestBox): magnifier at the end
 *
 * Esc empties a field that has text and stops there; on an empty field it goes on to the
 * surrounding dialog or menu, so Esc still closes them. The clear button empties it and gives
 * the focus back to the field.
 *
 * ```html
 * <sn-search-field [(value)]="query" placeholder="Search files" />
 * <sn-search-field [formControl]="query" label="Filter the list" />
 * ```
 *
 * The placeholder is also the accessible name unless `label` is set. Works with `[(value)]`,
 * `ngModel` and reactive forms.
 */
@Component({
  selector: 'sn-search-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SnSearchField), multi: true }],
  host: {
    'data-slot': 'sn-search-field',
    '[attr.data-family]': 'family()',
    '[attr.data-skin]': 'skin()',
    '[attr.data-filled]': 'value() ? "" : null',
  },
  template: `
    <svg class="glass" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5 14 14" />
    </svg>
    <input
      #field
      type="search"
      data-slot="input"
      autocomplete="off"
      spellcheck="false"
      [value]="value()"
      [placeholder]="placeholder()"
      [attr.aria-label]="label() || placeholder()"
      [disabled]="isDisabled()"
      (input)="onInput($event)"
      (keydown.escape)="onEscape($event)"
      (keydown.enter)="submitted.emit(value())"
      (blur)="touched()"
    />
    @if (value() && !isDisabled()) {
      <button type="button" class="clear" tabindex="-1" [attr.aria-label]="clearLabel()" (click)="clear()">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 5l6 6M11 5l-6 6" /></svg>
      </button>
    }
  `,
  styleUrl: './search-field.scss',
})
export class SnSearchField implements ControlValueAccessor {
  /** The text. Two-way bindable. */
  readonly value = model('');
  /** Default: "Search". Also the accessible name when `label` is empty. */
  readonly placeholder = input('Search');
  /** The accessible name, when the placeholder doesn't say enough. */
  readonly label = input('');
  /** The clear button's accessible name. Default: "Clear". */
  readonly clearLabel = input('Clear');
  // eslint-disable-next-line @angular-eslint/no-input-rename -- `disabled` is also set by forms (setDisabledState)
  readonly disabledInput = input(false, { alias: 'disabled', transform: booleanAttribute });
  /** Enter in the field, with its text. */
  readonly submitted = output<string>();

  protected readonly skin = injectSkin();
  protected readonly family = computed(() => skinFamily(this.skin()));
  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabledInput() || this.formDisabled());
  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');
  private onChange: (value: string) => void = () => undefined;
  protected touched: () => void = () => undefined;

  /** Puts the keyboard focus in the field (e.g. for ⌘F / Ctrl+F). */
  focus(): void {
    this.field().nativeElement.focus();
  }

  /** Empties the field and keeps the focus in it. */
  clear(): void {
    this.set('');
    this.focus();
  }

  protected onInput(event: Event): void {
    this.set((event.target as HTMLInputElement).value);
  }

  protected onEscape(event: Event): void {
    if (!this.value()) return;
    event.stopPropagation();
    event.preventDefault();
    this.set('');
  }

  private set(value: string): void {
    this.value.set(value);
    this.onChange(value);
  }

  /** @internal ControlValueAccessor */
  writeValue(value: unknown): void {
    this.value.set(value == null ? '' : String(value));
  }

  /** @internal ControlValueAccessor */
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  /** @internal ControlValueAccessor */
  registerOnTouched(fn: () => void): void {
    this.touched = fn;
  }

  /** @internal ControlValueAccessor */
  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
}
