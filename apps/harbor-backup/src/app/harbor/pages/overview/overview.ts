import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HLM_CHART_THEME, HlmChartImports } from '@spartan-ng/helm/chart';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmProgressImports } from '@spartan-ng/helm/progress';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';
import type { ChartOptions } from '@tanstack/angular-charts';
import { barY, defineChart } from '@tanstack/charts';
import { scaleBand } from '@tanstack/charts/scales/band';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { type Destination, FREQUENCIES, HarborStore } from '../../data/harbor-store';

/**
 * Overview: the current backup, the schedule summary, storage per destination, backup size over the
 * last week and recent activity (docs/08-sample-app.md, plus the storage and chart cards).
 */
@Component({
  selector: 'harbor-overview',
  imports: [HlmBadgeImports, HlmButtonImports, HlmCardImports, HlmChartImports, HlmLabelImports, HlmProgressImports, HlmSelectImports, HlmSwitchImports],
  templateUrl: './overview.html',
  styleUrl: './overview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HarborOverview {
  protected readonly store = inject(HarborStore);
  protected readonly frequencies = FREQUENCIES;

  private readonly history = this.store.history;
  protected readonly chart: ChartOptions<(typeof this.history)[number], string, number> = {
    definition: defineChart({
      marks: [barY(this.history, { x: 'day', y: 'gb' })],
      scales: {
        x: { scale: () => scaleBand<string>().domain(this.history.map((d) => d.day)).padding(0.25) },
        y: { scale: scaleLinear, nice: true, grid: true },
      },
      theme: HLM_CHART_THEME,
    }),
    ariaLabel: 'Backup size per day, last 7 days',
    aspectRatio: 2.4,
    // Screenshot hook: set once the measured render is on screen.
    onRender: ({ container }) => container.closest('tanstack-chart')?.setAttribute('data-rendered', ''),
  };

  protected usedPercent(d: Destination): number {
    return Math.round((d.usedGb / d.totalGb) * 100);
  }

  protected usedLabel(d: Destination): string {
    const tb = (gb: number) => (gb >= 1000 ? `${(gb / 1000).toFixed(1)} TB` : `${gb} GB`);
    return `${tb(d.usedGb)} of ${tb(d.totalGb)} · ${this.usedPercent(d)}%`;
  }

  protected statusLabel(s: Destination['status']): string {
    return { online: 'Online', syncing: 'Syncing', offline: 'Offline' }[s];
  }

  protected statusTone(s: Destination['status']): string {
    return { online: 'sn-tone-success', syncing: 'sn-tone-accent', offline: 'sn-tone-danger' }[s];
  }
}
