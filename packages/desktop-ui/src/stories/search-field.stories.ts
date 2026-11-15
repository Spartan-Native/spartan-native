import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { SnSearchField } from '../lib/controls/search-field';

const FILES = ['Q3 report.pdf', 'Budget 2027.xlsx', 'Team photo.jpg', 'Roadmap.md', 'Invoice 0042.pdf'];

@Component({
  selector: 'sn-search-field-demo',
  imports: [SnSearchField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="demo">
      <sn-search-field [(value)]="query" placeholder="Search files" />
      <ul>
        @for (f of matches(); track f) {
          <li>{{ f }}</li>
        } @empty {
          <li class="none">No files match “{{ query() }}”.</li>
        }
      </ul>
    </div>
  `,
  styles: `
    .demo {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 20rem;
      padding: 2rem;
    }
    ul {
      margin: 0;
      padding-inline-start: 1.25rem;
    }
    .none {
      color: var(--sn-color-fg-muted);
    }
  `,
})
class SearchFieldDemo {
  protected readonly query = signal('');
  protected readonly matches = computed(() =>
    FILES.filter((f) => f.toLowerCase().includes(this.query().trim().toLowerCase())),
  );
}

/** Type to filter; the ✕ or Esc clears it. Switch the OS in the toolbar to see each skin's field. */
const meta: Meta = {
  title: 'Desktop UI/Controls/Search field',
  decorators: [moduleMetadata({ imports: [SearchFieldDemo] })],
};
export default meta;

export const Default: StoryObj = {
  render: () => ({ template: `<sn-search-field-demo />` }),
};
