import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCalendarClock,
  lucideCloud,
  lucideDatabaseBackup,
  lucideFileText,
  lucideFolder,
  lucideHardDrive,
  lucideHistory,
  lucideRotateCcw,
  lucideSettings,
} from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmBreadcrumbImports } from '@spartan-ng/helm/breadcrumb';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCommandImports } from '@spartan-ng/helm/command';
import { HlmContextMenuImports } from '@spartan-ng/helm/context-menu';
import { HlmDrawerImports } from '@spartan-ng/helm/drawer';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmHoverCardImports } from '@spartan-ng/helm/hover-card';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmMenubarImports } from '@spartan-ng/helm/menubar';
import { HlmNavigationMenuImports } from '@spartan-ng/helm/navigation-menu';
import { HlmPaginationImports } from '@spartan-ng/helm/pagination';
import { HlmPopoverImports } from '@spartan-ng/helm/popover';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { HlmToasterImports } from '@spartan-ng/helm/sonner';
import { SHARED_STYLES } from './showcases';

// Navigation, popups and the command palette: stock spartan/ui, used exactly as an app would.

/** Shortcut glyphs follow the active skin, not the machine Storybook runs on. */
function modKey(): string {
  const skin = document.documentElement.dataset['snSkin'] ?? '';
  return skin.startsWith('mac') ? '⌘' : 'Ctrl+';
}

// Breadcrumb and pagination links host RouterLink, so the app needs provideRouter(...).
@Component({
  selector: 'sn-navigation-showcase',
  imports: [
    HlmBreadcrumbImports,
    HlmDropdownMenuImports,
    HlmMenubarImports,
    HlmNavigationMenuImports,
    HlmPaginationImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-menubar style="align-self: flex-start">
      <button [hlmMenubarTrigger]="fileMenu">File</button>
      <button [hlmMenubarTrigger]="editMenu">Edit</button>
      <button [hlmMenubarTrigger]="viewMenu">View</button>
      <button [hlmMenubarTrigger]="fileMenu" disabled>Window</button>
    </hlm-menubar>

    <nav hlmBreadcrumb>
      <ol hlmBreadcrumbList>
        <li hlmBreadcrumbItem><a hlmBreadcrumbLink link="/">Harbor</a></li>
        <li hlmBreadcrumbSeparator></li>
        <li hlmBreadcrumbItem><hlm-breadcrumb-ellipsis /></li>
        <li hlmBreadcrumbSeparator></li>
        <li hlmBreadcrumbItem><a hlmBreadcrumbLink link="/backups">Backups</a></li>
        <li hlmBreadcrumbSeparator></li>
        <li hlmBreadcrumbItem><span hlmBreadcrumbPage>Photos → Office NAS</span></li>
      </ol>
    </nav>

    <nav hlmPagination aria-label="Backup history" style="justify-content: flex-start">
      <ul hlmPaginationContent>
        <li hlmPaginationItem><hlm-pagination-previous /></li>
        <li hlmPaginationItem><a hlmPaginationLink>1</a></li>
        <li hlmPaginationItem><a hlmPaginationLink isActive>2</a></li>
        <li hlmPaginationItem><a hlmPaginationLink>3</a></li>
        <li hlmPaginationItem><hlm-pagination-ellipsis /></li>
        <li hlmPaginationItem><a hlmPaginationLink>12</a></li>
        <li hlmPaginationItem><hlm-pagination-next /></li>
      </ul>
    </nav>

    <nav hlmNavigationMenu openOn="click" style="align-self: flex-start">
      <ul hlmNavigationMenuList>
        <li hlmNavigationMenuItem>
          <button hlmNavigationMenuTrigger>Backups</button>
          <hlm-navigation-menu-content *hlmNavigationMenuPortal>
            <ul style="display: grid; gap: 0.25rem; width: 18rem; margin: 0; padding: 0; list-style: none">
              <li>
                <a hlmNavigationMenuLink style="flex-direction: column; align-items: flex-start">
                  <span>Photos → Office NAS</span>
                  <span class="caption">Every hour · 182 GB</span>
                </a>
              </li>
              <li>
                <a hlmNavigationMenuLink style="flex-direction: column; align-items: flex-start">
                  <span>Documents → Cloud</span>
                  <span class="caption">Daily · 4.2 GB</span>
                </a>
              </li>
            </ul>
          </hlm-navigation-menu-content>
        </li>
        <li hlmNavigationMenuItem>
          <button hlmNavigationMenuTrigger>Destinations</button>
          <hlm-navigation-menu-content *hlmNavigationMenuPortal>
            <ul style="display: grid; gap: 0.25rem; width: 14rem; margin: 0; padding: 0; list-style: none">
              <li><a hlmNavigationMenuLink>Office NAS</a></li>
              <li><a hlmNavigationMenuLink>Cloud</a></li>
              <li><a hlmNavigationMenuLink>External drive</a></li>
            </ul>
          </hlm-navigation-menu-content>
        </li>
        <li hlmNavigationMenuItem><a hlmNavigationMenuLink active>Schedules</a></li>
      </ul>
    </nav>
    <p class="caption">menubar · breadcrumb · pagination · navigation-menu (click a trigger)</p>

    <ng-template #fileMenu>
      <hlm-dropdown-menu style="width: 14rem">
        <button hlmDropdownMenuItem>
          New backup… <span hlmDropdownMenuShortcut>{{ mod() }}N</span>
        </button>
        <button hlmDropdownMenuItem>
          Back up now <span hlmDropdownMenuShortcut>{{ mod() }}B</span>
        </button>
        <button hlmDropdownMenuItem>
          Restore files… <span hlmDropdownMenuShortcut>{{ mod() }}R</span>
        </button>
        <hlm-dropdown-menu-separator />
        <button hlmDropdownMenuItem disabled>Export settings…</button>
        <button hlmDropdownMenuItem>
          Close window <span hlmDropdownMenuShortcut>{{ mod() }}W</span>
        </button>
      </hlm-dropdown-menu>
    </ng-template>
    <ng-template #editMenu>
      <hlm-dropdown-menu style="width: 14rem">
        <button hlmDropdownMenuItem>
          Undo <span hlmDropdownMenuShortcut>{{ mod() }}Z</span>
        </button>
        <hlm-dropdown-menu-separator />
        <button hlmDropdownMenuItem>
          Copy <span hlmDropdownMenuShortcut>{{ mod() }}C</span>
        </button>
        <button hlmDropdownMenuItem>
          Select all <span hlmDropdownMenuShortcut>{{ mod() }}A</span>
        </button>
      </hlm-dropdown-menu>
    </ng-template>
    <ng-template #viewMenu>
      <hlm-dropdown-menu style="width: 14rem">
        <span hlmDropdownMenuLabel>Show</span>
        <button hlmDropdownMenuCheckbox [checked]="true"><hlm-dropdown-menu-checkbox-indicator />Sidebar</button>
        <button hlmDropdownMenuCheckbox><hlm-dropdown-menu-checkbox-indicator />Hidden files</button>
      </hlm-dropdown-menu>
    </ng-template>
  `,
  styles: SHARED_STYLES,
})
export class NavigationShowcase {
  protected readonly mod = modKey;
}

@Component({
  selector: 'sn-popups-showcase',
  imports: [
    HlmButtonImports,
    HlmContextMenuImports,
    HlmDrawerImports,
    HlmDropdownMenuImports,
    HlmHoverCardImports,
    HlmInputImports,
    HlmLabelImports,
    HlmPopoverImports,
    HlmSheetImports,
    HlmToasterImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row">
      <hlm-popover>
        <button hlmBtn variant="outline" hlmPopoverTrigger>Retention…</button>
        <hlm-popover-content *hlmPopoverPortal="let ctx">
          <hlm-popover-header>
            <h4 hlmPopoverTitle>Retention</h4>
            <p hlmPopoverDescription>How long old versions are kept.</p>
          </hlm-popover-header>
          <div class="field">
            <label hlmLabel for="pp-keep">Keep versions for (days)</label>
            <input hlmInput id="pp-keep" type="number" value="30" />
          </div>
        </hlm-popover-content>
      </hlm-popover>

      <hlm-hover-card>
        <button hlmBtn variant="link" hlmHoverCardTrigger>Office NAS</button>
        <hlm-hover-card-content *hlmHoverCardPortal>
          <div class="field">
            <strong>Office NAS</strong>
            <p class="caption">/Volumes/Office NAS/Backups</p>
            <p class="caption">412 GB free of 2 TB · last seen today, 09:12</p>
          </div>
        </hlm-hover-card-content>
      </hlm-hover-card>

      <hlm-sheet side="right">
        <button hlmBtn variant="outline" hlmSheetTrigger>Backup details</button>
        <hlm-sheet-content *hlmSheetPortal="let ctx">
          <hlm-sheet-header>
            <h3 hlmSheetTitle>Photos → Office NAS</h3>
            <p hlmSheetDescription>Every hour · 182 GB · 48 versions.</p>
          </hlm-sheet-header>
          <div class="field" style="padding: 0 1rem">
            <label hlmLabel for="sh-name">Name</label>
            <input hlmInput id="sh-name" value="Photos" />
          </div>
          <hlm-sheet-footer>
            <button hlmBtn hlmSheetClose>Save</button>
            <button hlmBtn variant="outline" hlmSheetClose>Cancel</button>
          </hlm-sheet-footer>
        </hlm-sheet-content>
      </hlm-sheet>

      <hlm-drawer>
        <button hlmBtn variant="outline" hlmDrawerTrigger>Restore files</button>
        <hlm-drawer-content *hlmDrawerPortal="let ctx">
          <hlm-drawer-header>
            <h3 hlmDrawerTitle>Restore files</h3>
            <p hlmDrawerDescription>Pick a version of “Photos” to restore.</p>
          </hlm-drawer-header>
          <hlm-drawer-footer>
            <button hlmBtn hlmDrawerClose>Restore latest</button>
            <button hlmBtn variant="outline" hlmDrawerClose>Cancel</button>
          </hlm-drawer-footer>
        </hlm-drawer-content>
      </hlm-drawer>

      <button hlmBtn variant="outline" (click)="notify()">Show notification</button>
    </div>

    <div
      [hlmContextMenuTrigger]="fileMenu"
      style="display: grid; place-items: center; height: 6rem; max-width: 22.5rem; border: 0.0625rem dashed var(--sn-color-border); border-radius: var(--sn-radius-surface)"
    >
      <p class="caption">Right-click a backup</p>
    </div>
    <p class="caption">popover · hover card · sheet · drawer · toast · context menu</p>

    <hlm-toaster />

    <ng-template #fileMenu>
      <hlm-dropdown-menu style="width: 14rem">
        <button hlmDropdownMenuItem>
          Open <span hlmDropdownMenuShortcut>{{ mod() }}O</span>
        </button>
        <button hlmDropdownMenuItem>
          Back up now <span hlmDropdownMenuShortcut>{{ mod() }}B</span>
        </button>
        <button hlmDropdownMenuItem>Show in Finder</button>
        <hlm-dropdown-menu-separator />
        <button hlmDropdownMenuItem variant="destructive">Delete backup</button>
      </hlm-dropdown-menu>
    </ng-template>
  `,
  styles: SHARED_STYLES,
})
export class PopupsShowcase {
  protected readonly mod = modKey;

  protected notify(): void {
    // Infinity: the toast stays until dismissed, so a screenshot can't race the timer.
    toast.success('Backup complete', { description: '1,204 files copied to Office NAS.', duration: Infinity });
  }
}

@Component({
  selector: 'sn-command-showcase',
  imports: [HlmCommandImports, NgIcon],
  providers: [
    provideIcons({
      lucideCalendarClock,
      lucideCloud,
      lucideDatabaseBackup,
      lucideFileText,
      lucideFolder,
      lucideHardDrive,
      lucideHistory,
      lucideRotateCcw,
      lucideSettings,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Rendered inline, so the palette is visible without opening it -->
    <hlm-command style="max-width: 28rem">
      <hlm-command-input placeholder="Search backups, destinations, files…" />
      <hlm-command-list>
        <div *hlmCommandEmptyState hlmCommandEmpty>No results found.</div>
        <hlm-command-group>
          <hlm-command-group-label>Backups</hlm-command-group-label>
          <button hlmCommandItem value="back-up-now">
            <ng-icon name="lucideDatabaseBackup" />Back up now<span hlmCommandShortcut>{{ mod() }}B</span>
          </button>
          <button hlmCommandItem value="restore">
            <ng-icon name="lucideRotateCcw" />Restore files…<span hlmCommandShortcut>{{ mod() }}R</span>
          </button>
          <button hlmCommandItem value="history"><ng-icon name="lucideHistory" />Version history</button>
          <button hlmCommandItem value="verify" disabled><ng-icon name="lucideFileText" />Verify archive</button>
        </hlm-command-group>
        <hlm-command-separator />
        <hlm-command-group>
          <hlm-command-group-label>Destinations</hlm-command-group-label>
          <button hlmCommandItem value="office-nas"><ng-icon name="lucideHardDrive" />Office NAS</button>
          <button hlmCommandItem value="cloud"><ng-icon name="lucideCloud" />Cloud</button>
          <button hlmCommandItem value="documents"><ng-icon name="lucideFolder" />Documents folder</button>
        </hlm-command-group>
        <hlm-command-separator />
        <hlm-command-group>
          <hlm-command-group-label>Settings</hlm-command-group-label>
          <button hlmCommandItem value="schedules"><ng-icon name="lucideCalendarClock" />Schedules</button>
          <button hlmCommandItem value="preferences">
            <ng-icon name="lucideSettings" />Preferences<span hlmCommandShortcut>{{ mod() }},</span>
          </button>
        </hlm-command-group>
      </hlm-command-list>
    </hlm-command>
  `,
  styles: SHARED_STYLES,
})
export class CommandShowcase {
  protected readonly mod = modKey;
}
