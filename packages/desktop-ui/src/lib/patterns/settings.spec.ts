import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SnSettingsGroup, SnSettingsRow } from './settings';

@Component({
  imports: [SnSettingsGroup, SnSettingsRow],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sn-settings-group title="Backups" description="Choose when backups run.">
      <sn-settings-row title="Automatic backups" />
    </sn-settings-group>
  `,
})
class Host {}

describe('sn-settings-group', () => {
  it('is a labelled group without a landmark of its own (safe inside dialogs)', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const group = fixture.nativeElement.querySelector('sn-settings-group') as HTMLElement;
    const heading = group.querySelector('h2')!;
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(group.querySelector('header, footer, section, nav, aside, main, [role="banner"]')).toBeNull();
  });
});
