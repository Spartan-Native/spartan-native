import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideClock, lucideCloud, lucideHistory, lucideHouse, lucideServer, lucideSettings, lucideUsb } from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { SnSidebarNavImports } from '../lib/patterns/sidebar-nav';

const ICONS = { lucideClock, lucideCloud, lucideHistory, lucideHouse, lucideServer, lucideSettings, lucideUsb };

@Component({
  selector: 'sn-sidebar-nav-demo',
  imports: [SnSidebarNavImports],
  providers: [provideIcons(ICONS)],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sn-window frame">
      <sn-sidebar-nav aria-label="Sections">
        @if (sections()) {
          <sn-sidebar-section title="Backups">
            <button snSidebarItem icon="lucideHouse" [active]="page() === 'Overview'" (click)="page.set('Overview')">Overview</button>
            <button snSidebarItem icon="lucideClock" [active]="page() === 'Schedules'" (click)="page.set('Schedules')">Schedules</button>
            <button snSidebarItem icon="lucideHistory" badge="3" [active]="page() === 'Restore files'" (click)="page.set('Restore files')">Restore files</button>
          </sn-sidebar-section>
          <sn-sidebar-section title="Destinations">
            <button snSidebarItem icon="lucideServer" [active]="page() === 'Office NAS'" (click)="page.set('Office NAS')">Office NAS</button>
            <button snSidebarItem icon="lucideUsb" [active]="page() === 'Backup drive'" (click)="page.set('Backup drive')">Backup drive</button>
            <button snSidebarItem icon="lucideCloud" badge="12" [active]="page() === 'Cloud'" (click)="page.set('Cloud')">Cloud</button>
          </sn-sidebar-section>
          <sn-sidebar-section>
            <button snSidebarItem icon="lucideSettings" [active]="page() === 'Settings'" (click)="page.set('Settings')">Settings</button>
          </sn-sidebar-section>
        } @else {
          @for (item of flat; track item.label) {
            <a snSidebarItem href="#" [icon]="item.icon" [active]="page() === item.label" (click)="$event.preventDefault(); page.set(item.label)">
              {{ item.label }}
            </a>
          }
        }
      </sn-sidebar-nav>
      <main class="sn-content content">
        <h1>{{ page() }}</h1>
        <p>Tab into the sidebar, then use ↑ ↓ Home End. Set Window → inactive to see the selection change.</p>
      </main>
    </div>
  `,
  styles: `
    .frame { display: flex; max-width: 46rem; height: 28rem; }
    .content { flex: 1; min-width: 0; padding: 1.5rem; }
    h1 { margin: 0 0 0.5rem; font-size: var(--sn-font-size-title); font-weight: var(--sn-font-weight-strong); }
    p { margin: 0; color: var(--sn-color-fg-muted); }
  `,
})
class SidebarNavDemo {
  readonly sections = input(true);
  protected readonly page = signal('Overview');
  protected readonly flat = [
    { label: 'Overview', icon: 'lucideHouse' },
    { label: 'Schedules', icon: 'lucideClock' },
    { label: 'Destinations', icon: 'lucideServer' },
    { label: 'Restore files', icon: 'lucideHistory' },
    { label: 'Settings', icon: 'lucideSettings' },
  ];
}

/**
 * Sidebar navigation with the platform's selection idiom. Switch the OS in the toolbar:
 * Windows 11 pill, Windows 10 accent bar, macOS tinted fill (grey when inactive),
 * GNOME neutral fill, KDE accent fill and outline, ChromeOS tonal pill.
 */
const meta: Meta = {
  title: 'Desktop UI/Patterns/Sidebar navigation',
  decorators: [moduleMetadata({ imports: [SidebarNavDemo] })],
};
export default meta;

export const WithSections: StoryObj = {
  name: 'With sections',
  render: () => ({ template: `<div style="padding: 2rem"><sn-sidebar-nav-demo /></div>` }),
};

export const Flat: StoryObj = {
  name: 'Flat, with links',
  render: () => ({ template: `<div style="padding: 2rem"><sn-sidebar-nav-demo [sections]="false" /></div>` }),
};
