import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideClock,
  lucideCircleCheck,
  lucideCircleX,
  lucideDownload,
  lucideFileText,
  lucideHardDrive,
} from '@ng-icons/lucide';
import { HlmAttachmentImports } from '@spartan-ng/helm/attachment';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmBubbleImports } from '@spartan-ng/helm/bubble';
import { HLM_CHART_THEME, HlmChartImports } from '@spartan-ng/helm/chart';
import { HlmCodeBlockImports } from '@spartan-ng/helm/code-block';
import { HlmMarkerImports } from '@spartan-ng/helm/marker';
import { HlmMessageImports } from '@spartan-ng/helm/message';
import { HlmMessageScrollerImports } from '@spartan-ng/helm/message-scroller';
import { HlmQuestionnaireImports } from '@spartan-ng/helm/questionnaire';
import { HlmTraceImports } from '@spartan-ng/helm/trace';
import type { ChartOptions } from '@tanstack/angular-charts';
import { barY, defineChart } from '@tanstack/charts';
import { scaleBand } from '@tanstack/charts/scales/band';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { SHARED_STYLES } from './showcases';

// Stock spartan/ui chat & assistant components, used exactly as an app would. The theme does the rest.

const BACKUP_LOG = `02:00:01 INFO  Starting scheduled backup "Nightly"
02:00:04 INFO  Snapshot created (12,408 files)
02:14:37 WARN  office-nas:/harbor write slow (2.1 MB/s)
02:31:12 ERROR office-nas:/harbor disk full (0 B free)
02:31:12 INFO  Backup aborted, next attempt 03:00`;

@Component({
  selector: 'sn-conversation-showcase',
  imports: [
    HlmMessageScrollerImports,
    HlmMessageImports,
    HlmBubbleImports,
    HlmAvatarImports,
    HlmCodeBlockImports,
    HlmAttachmentImports,
    HlmMarkerImports,
    NgIcon,
  ],
  providers: [provideIcons({ lucideClock, lucideCircleX, lucideDownload, lucideFileText })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chat">
      <div hlmMessageScrollerProvider defaultScrollPosition="start">
        <hlm-message-scroller>
          <hlm-message-scroller-viewport aria-label="Conversation with Harbor Assistant">
            <hlm-message-scroller-content>
              <hlm-message-scroller-item messageId="day">
                <hlm-marker variant="separator"><hlm-marker-content>Today</hlm-marker-content></hlm-marker>
              </hlm-message-scroller-item>

              <hlm-message-scroller-item messageId="q1">
                <hlm-message align="end">
                  <hlm-message-avatar>
                    <hlm-avatar size="lg"><span hlmAvatarFallback>AM</span></hlm-avatar>
                  </hlm-message-avatar>
                  <hlm-message-content>
                    <hlm-message-header>You · 09:12</hlm-message-header>
                    <hlm-bubble align="end">
                      <hlm-bubble-content>Why did last night's backup fail?</hlm-bubble-content>
                    </hlm-bubble>
                    <hlm-message-footer>Read</hlm-message-footer>
                  </hlm-message-content>
                </hlm-message>
              </hlm-message-scroller-item>

              <hlm-message-scroller-item messageId="a1">
                <hlm-message>
                  <hlm-message-avatar>
                    <hlm-avatar size="lg"><span hlmAvatarFallback>H</span></hlm-avatar>
                  </hlm-message-avatar>
                  <hlm-message-content>
                    <hlm-message-header>Harbor Assistant · 09:12</hlm-message-header>
                    <hlm-marker>
                      <hlm-marker-icon><ng-icon name="lucideClock" /></hlm-marker-icon>
                      <hlm-marker-content>Read 3 log files in 1.7 s</hlm-marker-content>
                    </hlm-marker>
                    <hlm-bubble variant="ghost">
                      <hlm-bubble-content>
                        The "Nightly" backup stopped at 02:31 because the office NAS ran out of space. Here is the
                        relevant part of the log:
                      </hlm-bubble-content>
                    </hlm-bubble>
                    <hlm-code-block>
                      <hlm-code-block-header>
                        <span hlmCodeBlockTitle><ng-icon name="lucideFileText" />backup.log</span>
                        <hlm-code-block-actions>
                          <button hlmCodeBlockCopyButton [value]="log" copyText="Copy log"></button>
                        </hlm-code-block-actions>
                      </hlm-code-block-header>
                      <pre hlmCodeBlockContent lineNumbers startLine="118">
                        <span hlmCodeBlockLine>02:00:01 INFO  Starting scheduled backup "Nightly"</span>
                        <span hlmCodeBlockLine>02:00:04 INFO  Snapshot created (12,408 files)</span>
                        <span hlmCodeBlockLine>02:14:37 WARN  office-nas:/harbor write slow (2.1 MB/s)</span>
                        <span hlmCodeBlockLine variant="removed">02:31:12 ERROR office-nas:/harbor disk full (0 B free)</span>
                        <span hlmCodeBlockLine variant="highlighted">02:31:12 INFO  Backup aborted, next attempt 03:00</span>
                      </pre>
                    </hlm-code-block>
                    <hlm-attachment-group>
                      <hlm-attachment>
                        <hlm-attachment-media><ng-icon name="lucideFileText" /></hlm-attachment-media>
                        <hlm-attachment-content>
                          <hlm-attachment-title>backup.log</hlm-attachment-title>
                          <hlm-attachment-description>48 KB · Log file</hlm-attachment-description>
                        </hlm-attachment-content>
                        <hlm-attachment-actions>
                          <button hlmAttachmentAction aria-label="Download backup.log">
                            <ng-icon name="lucideDownload" />
                          </button>
                        </hlm-attachment-actions>
                      </hlm-attachment>
                      <hlm-attachment state="error">
                        <hlm-attachment-media><ng-icon name="lucideCircleX" /></hlm-attachment-media>
                        <hlm-attachment-content>
                          <hlm-attachment-title>nas-snapshot.json</hlm-attachment-title>
                          <hlm-attachment-description>Could not be read</hlm-attachment-description>
                        </hlm-attachment-content>
                      </hlm-attachment>
                    </hlm-attachment-group>
                    <hlm-message-footer>2 sources</hlm-message-footer>
                  </hlm-message-content>
                </hlm-message>
              </hlm-message-scroller-item>

              <hlm-message-scroller-item messageId="q2">
                <hlm-message align="end">
                  <hlm-message-content>
                    <hlm-bubble align="end">
                      <hlm-bubble-content>Can you free some space and try again?</hlm-bubble-content>
                    </hlm-bubble>
                  </hlm-message-content>
                </hlm-message>
              </hlm-message-scroller-item>

              <hlm-message-scroller-item messageId="a2">
                <hlm-message>
                  <hlm-message-content>
                    <hlm-bubble variant="muted">
                      <hlm-bubble-content>I can remove snapshots older than 90 days (about 310 GB).</hlm-bubble-content>
                    </hlm-bubble>
                    <hlm-bubble variant="tinted">
                      <hlm-bubble-content>Then I'll retry the backup right away.</hlm-bubble-content>
                    </hlm-bubble>
                    <hlm-bubble variant="destructive">
                      <hlm-bubble-content>Deleted snapshots can't be restored.</hlm-bubble-content>
                    </hlm-bubble>
                  </hlm-message-content>
                </hlm-message>
              </hlm-message-scroller-item>
            </hlm-message-scroller-content>
          </hlm-message-scroller-viewport>
          <button hlmMessageScrollerButton aria-label="Jump to latest"></button>
        </hlm-message-scroller>
      </div>
    </div>
    <p class="caption">message · bubble (default / ghost / muted / tinted / destructive) · code block · attachment · marker</p>
  `,
  styles: [
    SHARED_STYLES,
    `.chat { display: flex; flex-direction: column; block-size: 30rem; max-inline-size: 36rem; }`,
  ],
})
export class ConversationShowcase {
  protected readonly log = BACKUP_LOG;
}

@Component({
  selector: 'sn-assistant-showcase',
  imports: [HlmTraceImports, HlmQuestionnaireImports, NgIcon],
  providers: [provideIcons({ lucideCircleCheck, lucideCircleX, lucideClock, lucideFileText, lucideHardDrive })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel">
      <hlm-trace>
        <div hlmTraceLine>
          <span hlmTraceIcon><ng-icon name="lucideFileText" /></span>
          <span hlmTraceTitle>Read backup.log</span>
          <span hlmTraceDescription>0.2 s</span>
        </div>
        <div hlmTraceLine>
          <span hlmTraceIcon><ng-icon name="lucideHardDrive" /></span>
          <span hlmTraceTitle>Checked destination office-nas</span>
          <span hlmTraceDescription>1.1 s</span>
        </div>
        <div hlmTraceCollapsible [expanded]="true">
          <button hlmTraceCollapsibleTrigger>
            <span hlmTraceLine status="error">
              <span hlmTraceIcon><ng-icon name="lucideCircleX" /></span>
              <span hlmTraceTitle>Write test to office-nas failed</span>
              <span hlmTraceDescription>0.4 s</span>
            </span>
          </button>
          <hlm-trace-collapsible-content>
            Disk full: 0 B free of 2 TB. The cloud destination has 1.2 TB free.
          </hlm-trace-collapsible-content>
        </div>
        <div hlmTraceLine status="pending">
          <span hlmTraceIcon><ng-icon name="lucideClock" /></span>
          <span hlmTraceTitle>Retry backup</span>
        </div>
      </hlm-trace>
      <p class="caption">trace · done / error (expanded) / pending</p>

      <form hlmQuestionnaire shortcuts="numbers" aria-label="Retry backup">
        <span hlmQuestionnaireProgress></span>
        <fieldset hlmQuestionnaireItem name="destination" required>
          <legend hlmQuestionnaireTitle>Which destination should Harbor retry?</legend>
          <p hlmQuestionnaireDescription>Last night's backup stopped before it reached every destination.</p>
          <div hlmQuestionnaireChoices>
            <label hlmQuestionnaireChoice value="cloud" defaultChecked>
              Harbor Cloud
              <span hlmQuestionnaireChoiceDescription>1.2 TB free · recommended</span>
            </label>
            <label hlmQuestionnaireChoice value="nas">
              Office NAS
              <span hlmQuestionnaireChoiceDescription>0 B free · will fail again</span>
            </label>
            <label hlmQuestionnaireChoice value="usb" disabled>
              USB drive “Archive”
              <span hlmQuestionnaireChoiceDescription>Not connected</span>
            </label>
          </div>
          <p hlmQuestionnaireError></p>
        </fieldset>
        <fieldset hlmQuestionnaireItem name="cleanup" multiple>
          <legend hlmQuestionnaireTitle>Free up space first?</legend>
          <div hlmQuestionnaireChoices>
            <label hlmQuestionnaireChoice value="old">Remove snapshots older than 90 days</label>
            <label hlmQuestionnaireChoice value="cache">Clear the local cache</label>
          </div>
        </fieldset>
        <div hlmQuestionnaireActions>
          <button hlmQuestionnairePrevious>Back</button>
          <button hlmQuestionnaireSkip>Skip</button>
          <button hlmQuestionnaireNext>Next</button>
          <button hlmQuestionnaireSubmit>Retry backup</button>
        </div>
      </form>
      <p class="caption">questionnaire · radio choices with shortcuts, description, disabled choice</p>
    </div>
  `,
  styles: [
    SHARED_STYLES,
    `.panel { display: flex; flex-direction: column; gap: 1.5rem; max-inline-size: 36rem; }`,
  ],
})
export class AssistantShowcase {}

interface BackupDay {
  day: string;
  gb: number;
}

// Fixed week; the last night is the aborted run.
const BACKUP_WEEK: readonly BackupDay[] = [
  { day: 'Mon 3', gb: 41.2 },
  { day: 'Tue 4', gb: 41.9 },
  { day: 'Wed 5', gb: 42.4 },
  { day: 'Thu 6', gb: 42.8 },
  { day: 'Fri 7', gb: 43.5 },
  { day: 'Sat 8', gb: 43.9 },
  { day: 'Sun 9', gb: 18.3 },
];

@Component({
  selector: 'sn-chart-showcase',
  imports: [HlmChartImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chart">
      <tanstack-chart hlmChart [options]="options" />
    </div>
    <p class="caption">chart · backup size per night (GB), palette from --chart-1</p>
  `,
  styles: [SHARED_STYLES, `.chart { max-inline-size: 36rem; }`],
})
export class ChartShowcase {
  protected readonly options: ChartOptions<BackupDay, string, number> = {
    definition: defineChart({
      marks: [barY(BACKUP_WEEK, { x: 'day', y: 'gb' })],
      scales: {
        x: {
          scale: () =>
            scaleBand<string>()
              .domain(BACKUP_WEEK.map((d) => d.day))
              .padding(0.2),
        },
        y: { scale: scaleLinear, nice: true, grid: true, axis: { label: 'Backup size (GB)' } },
      },
      theme: HLM_CHART_THEME,
    }),
    ariaLabel: 'Backup size per night, last 7 days',
    // Height follows the width, so nothing is set in px.
    aspectRatio: 2,
    // Screenshot hook: set once the measured (client) render is on screen.
    onRender: ({ container }) => container.closest('tanstack-chart')?.setAttribute('data-rendered', ''),
  };
}
