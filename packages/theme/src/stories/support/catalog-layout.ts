import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArchive,
  lucideCalendarClock,
  lucideCircleCheck,
  lucideCloud,
  lucideFileText,
  lucideFolder,
  lucideFolderSearch,
  lucideHardDrive,
  lucideHistory,
  lucideHouse,
  lucideImage,
  lucideServer,
  lucideSettings,
} from '@ng-icons/lucide';
import { HlmAccordionImports } from '@spartan-ng/helm/accordion';
import { HlmAspectRatioImports } from '@spartan-ng/helm/aspect-ratio';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmCarouselImports } from '@spartan-ng/helm/carousel';
import { HlmCollapsibleImports } from '@spartan-ng/helm/collapsible';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmItemImports } from '@spartan-ng/helm/item';
import { HlmResizableImports } from '@spartan-ng/helm/resizable';
import { HlmScrollAreaImports } from '@spartan-ng/helm/scroll-area';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { HlmTypographyImports } from '@spartan-ng/helm/typography';
import { NgScrollbar } from 'ngx-scrollbar';
import { SHARED_STYLES } from './showcases';

// Stock spartan/ui layout and display components, used exactly as an app would.

/** A tiny inline avatar picture: no network, so screenshots stay deterministic. */
const AVATAR_SVG =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#3b82f6"/>' +
      '<circle cx="20" cy="16" r="7" fill="#dbeafe"/><rect x="8" y="26" width="24" height="14" rx="7" fill="#dbeafe"/></svg>',
  );

@Component({
  selector: 'sn-disclosure-showcase',
  imports: [HlmAccordionImports, HlmButtonImports, HlmCollapsibleImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-accordion style="max-width: 30rem">
      <hlm-accordion-item [isOpened]="true">
        <hlm-accordion-trigger>What gets backed up?</hlm-accordion-trigger>
        <hlm-accordion-content>
          Every folder you add under Sources, including hidden files. System caches are skipped.
        </hlm-accordion-content>
      </hlm-accordion-item>
      <hlm-accordion-item>
        <hlm-accordion-trigger>Can I restore a single file?</hlm-accordion-trigger>
        <hlm-accordion-content>Yes. Open the file browser, pick a version and choose Restore.</hlm-accordion-content>
      </hlm-accordion-item>
      <hlm-accordion-item>
        <hlm-accordion-trigger>Are backups encrypted?</hlm-accordion-trigger>
        <hlm-accordion-content>Backups are encrypted with AES-256 before they leave this device.</hlm-accordion-content>
      </hlm-accordion-item>
    </hlm-accordion>

    <hlm-collapsible [expanded]="true" class="field" style="max-width: 30rem">
      <div class="row" style="justify-content: space-between">
        <span>3 excluded folders</span>
        <button hlmCollapsibleTrigger hlmBtn variant="ghost" size="sm">Hide</button>
      </div>
      <hlm-collapsible-content class="field" style="max-width: none">
        <span class="caption">~/Library/Caches</span>
        <span class="caption">~/Downloads</span>
        <span class="caption">~/Projects/**/node_modules</span>
      </hlm-collapsible-content>
    </hlm-collapsible>
    <p class="caption">accordion: first item open · collapsible: expanded</p>
  `,
  styles: SHARED_STYLES,
})
export class DisclosureShowcase {}

@Component({
  selector: 'sn-display-showcase',
  imports: [
    HlmAvatarImports,
    HlmButtonImports,
    HlmEmptyImports,
    HlmItemImports,
    HlmSkeletonImports,
    HlmSpinnerImports,
    HlmTypographyImports,
    NgIcon,
  ],
  providers: [provideIcons({ lucideArchive, lucideHardDrive, lucideCloud })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row">
      <span hlmAvatar size="sm"><span hlmAvatarFallback>RM</span></span>
      <span hlmAvatar><img hlmAvatarImage [src]="avatarSrc" alt="Office laptop" /><span hlmAvatarFallback>OL</span></span>
      <span hlmAvatar size="lg"><span hlmAvatarFallback>NAS</span><span hlmAvatarBadge></span></span>
      <div hlmAvatarGroup>
        <span hlmAvatar><span hlmAvatarFallback>AK</span></span>
        <span hlmAvatar><span hlmAvatarFallback>JD</span></span>
        <span hlmAvatar><span hlmAvatarFallback>SL</span></span>
        <span hlmAvatarGroupCount>+4</span>
      </div>
    </div>

    <div hlmItemGroup style="max-width: 30rem">
      <div hlmItem variant="outline">
        <div hlmItemMedia variant="icon"><ng-icon name="lucideHardDrive" /></div>
        <div hlmItemContent>
          <div hlmItemTitle>Office NAS</div>
          <p hlmItemDescription>Last backup today at 09:12 · 217 GB used</p>
        </div>
        <div hlmItemActions><button hlmBtn variant="outline" size="sm">Browse</button></div>
      </div>
      <div hlmItemSeparator></div>
      <div hlmItem variant="muted" size="sm">
        <div hlmItemMedia variant="icon"><ng-icon name="lucideCloud" /></div>
        <div hlmItemContent>
          <div hlmItemTitle>Cloud</div>
          <p hlmItemDescription>Paused until Wi-Fi is available</p>
        </div>
      </div>
    </div>

    <div hlmEmpty class="border" style="max-width: 30rem">
      <div hlmEmptyHeader>
        <div hlmEmptyMedia variant="icon"><ng-icon name="lucideArchive" /></div>
        <h3 hlmEmptyTitle>No backups yet</h3>
        <p hlmEmptyDescription>Add a destination and Harbor will make its first backup tonight.</p>
      </div>
      <div hlmEmptyContent><button hlmBtn>Add destination</button></div>
    </div>

    <div class="row" style="max-width: 30rem; flex-wrap: nowrap">
      <div hlmSkeleton style="width: 2.5rem; height: 2.5rem; border-radius: 9999px; flex: none"></div>
      <div class="field" style="flex: 1">
        <div hlmSkeleton style="height: 1rem; width: 70%"></div>
        <div hlmSkeleton style="height: 1rem; width: 45%"></div>
      </div>
      <hlm-spinner aria-label="Loading destinations" />
    </div>

    <div class="field" style="max-width: 30rem">
      <h1 hlmH1>Harbor</h1>
      <h2 hlmH2>Restore files</h2>
      <h3 hlmH3>Choose a version</h3>
      <h4 hlmH4>Documents · Today, 09:12</h4>
      <p hlmLead>Backups run quietly in the background.</p>
      <p hlmP>Harbor keeps hourly versions for a day, daily versions for a month and weekly versions after that. Run <code hlmCode>harbor verify</code> to check an archive.</p>
      <blockquote hlmBlockquote>“The best backup is the one you never think about.”</blockquote>
      <ul hlmUl>
        <li>Incremental and deduplicated</li>
        <li>Encrypted before upload</li>
      </ul>
      <div hlmLarge>217 GB protected</div>
      <small hlmSmall>Next run in 42 minutes</small>
      <p hlmMuted>Versions older than 1 year are pruned.</p>
    </div>
  `,
  styles: SHARED_STYLES,
})
export class DisplayShowcase {
  protected readonly avatarSrc = AVATAR_SVG;
}

@Component({
  selector: 'sn-containers-showcase',
  imports: [
    HlmAspectRatioImports,
    HlmCardImports,
    HlmCarouselImports,
    HlmResizableImports,
    HlmScrollAreaImports,
    NgScrollbar,
    NgIcon,
  ],
  providers: [provideIcons({ lucideFolder, lucideFileText, lucideImage })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="width: 100%; max-width: 20rem">
      <div hlmAspectRatio="16/9">
        <div class="preview">
          <ng-icon name="lucideImage" />
          <span class="caption">beach-2024.jpg · 16:9</span>
        </div>
      </div>
    </div>

    <div class="field" style="max-width: 20rem">
      <p class="caption">Activity log</p>
      <ng-scrollbar hlm class="bordered" style="height: 10rem">
        <div style="padding: 0.75rem">
          @for (entry of log; track entry) {
            <p class="log-line">{{ entry }}</p>
          }
        </div>
      </ng-scrollbar>
    </div>

    <div class="bordered" style="max-width: 30rem; height: 12rem">
      <hlm-resizable-group direction="horizontal">
        <hlm-resizable-panel [defaultSize]="35" [minSize]="20">
          <div class="pane">
            @for (folder of folders; track folder) {
              <span class="row" style="gap: 0.375rem"><ng-icon name="lucideFolder" />{{ folder }}</span>
            }
          </div>
        </hlm-resizable-panel>
        <hlm-resizable-handle withHandle />
        <hlm-resizable-panel [defaultSize]="65">
          <div class="pane">
            @for (file of files; track file) {
              <span class="row" style="gap: 0.375rem"><ng-icon name="lucideFileText" />{{ file }}</span>
            }
          </div>
        </hlm-resizable-panel>
      </hlm-resizable-group>
    </div>

    <div style="max-width: 20rem; padding-inline: 3.5rem">
      <hlm-carousel>
        <hlm-carousel-content>
          @for (snap of snapshots; track snap.when) {
            <hlm-carousel-item>
              <section hlmCard>
                <div hlmCardHeader>
                  <h3 hlmCardTitle>{{ snap.when }}</h3>
                  <p hlmCardDescription>{{ snap.detail }}</p>
                </div>
              </section>
            </hlm-carousel-item>
          }
        </hlm-carousel-content>
        <button hlmCarouselPrevious></button>
        <button hlmCarouselNext></button>
        <!-- inside hlm-carousel: it injects the carousel -->
        <hlm-carousel-slide-display />
      </hlm-carousel>
    </div>
  `,
  styles: [
    SHARED_STYLES,
    `
      .preview {
        position: absolute; inset: 0; display: flex; flex-direction: column; gap: 0.25rem;
        align-items: center; justify-content: center; border-radius: var(--radius); background: var(--muted);
      }
      .bordered { border: 1px solid var(--border); border-radius: var(--radius); }
      .log-line { margin: 0 0 0.5rem; font-size: var(--sn-font-size-small); }
      .pane { display: flex; flex-direction: column; gap: 0.5rem; padding: 0.75rem; height: 100%; overflow: hidden; }
    `,
  ],
})
export class ContainersShowcase {
  protected readonly log = [
    '09:12  Documents → Office NAS · 1,204 files',
    '09:00  Scheduled run started',
    '08:00  Projects → Cloud · 312 files',
    '07:45  Cloud paused (metered connection)',
    '03:00  Weekly prune · 18 versions removed',
    'Mon 22:00  Photos → Office NAS · 4,880 files',
    'Mon 21:58  Verified archive “Photos”',
    'Mon 09:12  Documents → Office NAS · 96 files',
    'Sun 09:12  Documents → Office NAS · 12 files',
    'Sat 03:00  Weekly prune · 9 versions removed',
  ];
  protected readonly folders = ['Documents', 'Photos', 'Projects', 'Mail'];
  protected readonly files = ['Budget 2026.xlsx', 'Contract draft.docx', 'Notes.md', 'Receipts.pdf', 'Tax return.pdf'];
  protected readonly snapshots = [
    { when: 'Today, 09:12', detail: '1,204 files · 4.2 GB' },
    { when: 'Yesterday, 09:12', detail: '1,198 files · 4.1 GB' },
    { when: 'Monday, 09:12', detail: '1,180 files · 4.1 GB' },
  ];
}

@Component({
  selector: 'sn-sidebar-showcase',
  imports: [HlmSidebarImports, NgIcon],
  providers: [
    provideIcons({
      lucideHouse,
      lucideArchive,
      lucideServer,
      lucideCalendarClock,
      lucideFolderSearch,
      lucideHistory,
      lucideSettings,
      lucideCircleCheck,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- collapsible="none" is the stock inline sidebar (no fixed positioning, no mobile sheet).
         Its h-svh / the wrapper's min-h-svh are overridden inline so it fits the frame. -->
    <div class="frame">
      <div hlmSidebarWrapper style="height: 100%; min-height: 0">
        <hlm-sidebar collapsible="none" style="height: 100%">
          <div hlmSidebarHeader>
            <span class="row" style="gap: 0.5rem; padding: 0.25rem 0.5rem; font-weight: 600">
              <ng-icon name="lucideArchive" />Harbor
            </span>
          </div>
          <hlm-sidebar-content>
            <div hlmSidebarGroup>
              <div hlmSidebarGroupLabel>Backup</div>
              <div hlmSidebarGroupContent>
                <ul hlmSidebarMenu>
                  <li hlmSidebarMenuItem>
                    <button hlmSidebarMenuButton isActive><ng-icon name="lucideHouse" /><span>Overview</span></button>
                  </li>
                  <li hlmSidebarMenuItem>
                    <button hlmSidebarMenuButton><ng-icon name="lucideServer" /><span>Destinations</span></button>
                    <div hlmSidebarMenuBadge>3</div>
                  </li>
                  <li hlmSidebarMenuItem>
                    <button hlmSidebarMenuButton><ng-icon name="lucideCalendarClock" /><span>Schedules</span></button>
                  </li>
                  <li hlmSidebarMenuItem>
                    <button hlmSidebarMenuButton><ng-icon name="lucideFolderSearch" /><span>Files</span></button>
                  </li>
                  <li hlmSidebarMenuItem>
                    <button hlmSidebarMenuButton><ng-icon name="lucideHistory" /><span>Activity</span></button>
                    <div hlmSidebarMenuBadge>12</div>
                  </li>
                </ul>
              </div>
            </div>
            <!-- hlm-sidebar-menu-skeleton is left out: its text width is Math.random(). -->
          </hlm-sidebar-content>
          <hlm-sidebar-separator />
          <div hlmSidebarFooter>
            <ul hlmSidebarMenu>
              <li hlmSidebarMenuItem>
                <button hlmSidebarMenuButton><ng-icon name="lucideSettings" /><span>Settings</span></button>
              </li>
            </ul>
          </div>
        </hlm-sidebar>
        <main hlmSidebarInset style="padding: 1rem; gap: 0.5rem">
          <span class="row" style="gap: 0.5rem; font-weight: 600"><ng-icon name="lucideCircleCheck" />All backups up to date</span>
          <p class="caption">Last run today at 09:12 · next run in 42 minutes</p>
        </main>
      </div>
    </div>
  `,
  styles: [
    SHARED_STYLES,
    `.frame { position: relative; overflow: hidden; width: 100%; max-width: 40rem; height: 22rem;
              border: 1px solid var(--border); border-radius: var(--radius); }`,
  ],
})
export class SidebarShowcase {}
