import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SnAssistantImports } from './assistant';
import { SnChecklistImports } from './checklist';

@Component({
  imports: [SnAssistantImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sn-assistant [(step)]="step" (finish)="finished = finished + 1" (cancel)="cancelled = cancelled + 1">
      <ng-template snAssistantPage title="Welcome"><p id="p1">Hi</p></ng-template>
      <ng-template snAssistantPage title="Destination" [canContinue]="valid()"><p id="p2">Where?</p></ng-template>
      <ng-template snAssistantPage title="Schedule"><p id="p3">When?</p></ng-template>
    </sn-assistant>
  `,
})
class Host {
  readonly step = signal(0);
  readonly valid = signal(false);
  finished = 0;
  cancelled = 0;
}

describe('SnAssistant', () => {
  afterEach(() => document.querySelectorAll('[ng-version]').forEach((n) => n.remove()));

  it('walks the pages, waits for canContinue, and finishes on the last page', async () => {
    document.documentElement.dataset['snSkin'] = 'win';
    const fixture = TestBed.createComponent(Host);
    document.body.append(fixture.nativeElement);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const button = (cls: string) => el.querySelector<HTMLButtonElement>(`.sn-assistant-button.${cls}`);
    const host = fixture.componentInstance;

    expect(el.querySelector('#p1')).not.toBeNull();
    expect(el.querySelector('#p2')).toBeNull();
    expect(el.querySelector('.progress')!.textContent).toBe('Step 1 of 3');
    expect(button('back')).toBeNull();
    expect(button('next')!.textContent!.trim()).toBe('Next');

    button('next')!.click();
    await fixture.whenStable();
    expect(host.step()).toBe(1);
    expect(el.querySelector('.page-title')!.textContent).toBe('Destination');
    expect(document.activeElement).toBe(el.querySelector('.page-title'));
    expect(button('next')!.disabled).toBe(true);

    host.valid.set(true);
    await fixture.whenStable();
    button('next')!.click();
    await fixture.whenStable();
    expect(button('next')!.textContent!.trim()).toBe('Finish');
    button('next')!.click();
    expect(host.finished).toBe(1);

    button('back')!.click();
    await fixture.whenStable();
    expect(host.step()).toBe(1);
    button('cancel')!.click();
    expect(host.cancelled).toBe(1);

    // macOS words
    document.documentElement.dataset['snSkin'] = 'mac';
    await new Promise((r) => setTimeout(r));
    await fixture.whenStable();
    expect(button('next')!.textContent!.trim()).toBe('Continue');
    expect(button('back')!.textContent!.trim()).toBe('Go Back');
  });
});

@Component({
  imports: [SnChecklistImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sn-checklist>
      <sn-checklist-item title="Add a destination" done
        >Where backups go. <button snChecklistAction>Add</button></sn-checklist-item
      >
      <sn-checklist-item title="Pick folders"><button snChecklistAction>Pick</button></sn-checklist-item>
    </sn-checklist>
  `,
})
class List {}

describe('SnChecklist', () => {
  it('is a list of tasks that read as done or to do', async () => {
    const fixture = TestBed.createComponent(List);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const items = [...el.querySelectorAll('[role="listitem"]')];
    expect(el.querySelector('[role="list"]')).not.toBeNull();
    expect(items.map((i) => i.querySelector('.title')!.textContent)).toEqual([
      'Add a destination (done)',
      'Pick folders (to do)',
    ]);
    expect(items[0].hasAttribute('data-done')).toBe(true);
    expect(items[0].querySelector('.action button')).not.toBeNull();
  });
});
