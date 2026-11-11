import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { injectSkin, skinFamily } from '@spartan-native/theme';

let nextId = 0;

/**
 * Lays out the main content with an `<sn-inspector>` on the trailing side. Below 40rem of
 * width the inspector floats over the content instead of squeezing it (AdwOverlaySplitView).
 *
 * ```html
 * <sn-inspector-layout>
 *   <div snSelectable [(selection)]="selected">…</div>
 *   <sn-inspector [(open)]="infoOpen" [title]="file().name" icon="lucideFileText">…</sn-inspector>
 * </sn-inspector-layout>
 * ```
 */
@Component({
  selector: 'sn-inspector-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sn-inspector-layout',
    '[attr.data-family]': 'family()',
    '[attr.data-skin]': 'skin()',
  },
  template: `
    <div class="main"><ng-content /></div>
    <ng-content select="sn-inspector" />
  `,
  styleUrl: './inspector.scss',
})
export class SnInspectorLayout {
  protected readonly skin = injectSkin();
  protected readonly family = computed(() => skinFamily(this.skin()));
}

/**
 * The detail side panel for the current selection:
 *  - macOS: Inspector, a glass trailing column with section headers (floating on macOS 26)
 *  - Windows: SplitView pane on the trailing side with a stroke divider
 *  - GNOME: AdwOverlaySplitView sidebar (sidebar color, header-bar title; overlays on narrow widths)
 *  - KDE: Dolphin information panel, big preview icon on top, then the properties
 *  - ChromeOS: Material 3 side sheet with a headline and a close button
 *
 * `icon` is an @ng-icons name the app registered with provideIcons(). Hidden while `open` is false.
 *
 * ```html
 * <sn-inspector [(open)]="infoOpen" title="Q3 report.pdf" icon="lucideFileText">
 *   <sn-inspector-section title="General">
 *     <sn-inspector-property label="Kind">PDF document</sn-inspector-property>
 *     <sn-inspector-property label="Size">2.4 MB</sn-inspector-property>
 *   </sn-inspector-section>
 * </sn-inspector>
 * ```
 */
@Component({
  selector: 'sn-inspector',
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sn-inspector',
    role: 'complementary',
    '[attr.aria-labelledby]': 'headingId',
    '[attr.hidden]': 'open() ? null : ""',
    '[attr.data-family]': 'family()',
    '[attr.data-skin]': 'skin()',
  },
  template: `
    <header>
      @if (icon()) {
        <ng-icon class="preview" [name]="icon()" aria-hidden="true" />
      }
      <h2 [id]="headingId">{{ title() }}</h2>
      @if (skin() === 'cros') {
        <button type="button" class="close" aria-label="Close" (click)="open.set(false)">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
        </button>
      }
    </header>
    <div class="body"><ng-content /></div>
  `,
  styleUrl: './inspector.scss',
})
export class SnInspector {
  /** Shown or hidden. Two-way bindable; the ChromeOS close button sets it to false. */
  readonly open = model(true);
  /** The panel's heading, usually the selected item's name; also its accessible name. */
  readonly title = input.required<string>();
  /** Preview icon above (KDE) or next to the title. */
  readonly icon = input('');
  protected readonly headingId = `sn-inspector-${nextId++}`;
  protected readonly skin = injectSkin();
  protected readonly family = computed(() => skinFamily(this.skin()));
}

/** A titled group of properties or controls inside the inspector ("General", "Sharing", …). */
@Component({
  selector: 'sn-inspector-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sn-inspector-section',
    role: 'group',
    '[attr.aria-labelledby]': 'title() ? headingId : null',
    '[attr.data-family]': 'family()',
    '[attr.data-skin]': 'skin()',
  },
  template: `
    @if (title()) {
      <h3 [id]="headingId">{{ title() }}</h3>
    }
    <div class="rows"><ng-content /></div>
  `,
  styleUrl: './inspector.scss',
})
export class SnInspectorSection {
  readonly title = input('');
  protected readonly headingId = `sn-inspector-section-${nextId++}`;
  protected readonly skin = injectSkin();
  protected readonly family = computed(() => skinFamily(this.skin()));
}

/**
 * A label/value row. The value is the content. macOS and KDE align labels in a column
 * ("Kind: PDF document"); Windows, GNOME and ChromeOS stack a small label above the value.
 */
@Component({
  selector: 'sn-inspector-property',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sn-inspector-property',
    '[attr.data-family]': 'family()',
    '[attr.data-skin]': 'skin()',
  },
  template: `
    <span class="label">{{ label() }}</span>
    <span class="value"><ng-content /></span>
  `,
  styleUrl: './inspector.scss',
})
export class SnInspectorProperty {
  readonly label = input.required<string>();
  protected readonly skin = injectSkin();
  protected readonly family = computed(() => skinFamily(this.skin()));
}

export const SnInspectorImports = [SnInspectorLayout, SnInspector, SnInspectorSection, SnInspectorProperty] as const;
