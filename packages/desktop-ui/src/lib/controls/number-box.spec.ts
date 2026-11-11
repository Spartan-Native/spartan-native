import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { evaluateNumberExpression, SnNumberBox } from './number-box';

describe('evaluateNumberExpression', () => {
  it('evaluates Fluent NumberBox arithmetic', () => {
    expect(evaluateNumberExpression('42')).toBe(42);
    expect(evaluateNumberExpression(' 1.5 * (2 + 2) ')).toBe(6);
    expect(evaluateNumberExpression('100/4-5')).toBe(20);
    expect(evaluateNumberExpression('-3 + -2')).toBe(-5);
    expect(evaluateNumberExpression('12,5')).toBe(12.5);
    expect(evaluateNumberExpression('2 * 3 + 4')).toBe(10);
  });

  it('rejects anything else', () => {
    for (const text of ['', 'abc', '2 +', '(1 + 2', '1 / 0', 'alert(1)', '1 2', '2 ** 3']) {
      expect(evaluateNumberExpression(text)).toBeNull();
    }
  });
});

@Component({
  imports: [SnNumberBox, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sn-number-box ariaLabel="Versions" [(value)]="versions" [min]="1" [max]="20" [step]="2" />
    <sn-number-box ariaLabel="Size" [formControl]="size" [decimals]="1" />
  `,
})
class Host {
  readonly versions = signal<number | null>(5);
  readonly size = new FormControl<number | null>(1.25);
}

describe('SnNumberBox', () => {
  async function setup(skin = 'win') {
    document.documentElement.dataset['snSkin'] = skin;
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const [versions, size] = [...el.querySelectorAll<HTMLInputElement>('input')];
    const key = async (input: HTMLInputElement, k: string) => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
      await fixture.whenStable();
    };
    const type = async (input: HTMLInputElement, text: string) => {
      input.value = text;
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('blur'));
      await fixture.whenStable();
    };
    return { fixture, el, host: fixture.componentInstance, versions, size, key, type };
  }

  it('is a spinbutton with its range', async () => {
    const { versions } = await setup();
    expect(versions.getAttribute('role')).toBe('spinbutton');
    expect(versions.getAttribute('aria-label')).toBe('Versions');
    expect(versions.getAttribute('aria-valuenow')).toBe('5');
    expect(versions.getAttribute('aria-valuemin')).toBe('1');
    expect(versions.getAttribute('aria-valuemax')).toBe('20');
    expect(versions.value).toBe('5');
  });

  it('steps with the arrows and pages, clamps, and goes to min / max', async () => {
    const { host, versions, key } = await setup();
    await key(versions, 'ArrowUp');
    expect(host.versions()).toBe(7);
    await key(versions, 'ArrowDown');
    await key(versions, 'ArrowDown');
    expect(host.versions()).toBe(3);
    await key(versions, 'PageUp'); // 10 steps of 2, clamped
    expect(host.versions()).toBe(20);
    expect(versions.value).toBe('20');
    await key(versions, 'Home');
    expect(host.versions()).toBe(1);
    await key(versions, 'End');
    expect(host.versions()).toBe(20);
  });

  it('commits typed numbers and math, reverts what does not parse', async () => {
    const { host, versions, type, key } = await setup();
    await type(versions, '3*4');
    expect(host.versions()).toBe(12);
    expect(versions.value).toBe('12');
    await type(versions, 'lots');
    expect(host.versions()).toBe(12);
    expect(versions.value).toBe('12');
    await type(versions, '999');
    expect(host.versions()).toBe(20);
    await type(versions, '');
    expect(host.versions()).toBeNull();

    // Esc reverts the text being typed
    versions.value = '7';
    versions.dispatchEvent(new Event('input'));
    await key(versions, 'Escape');
    expect(versions.value).toBe('');
  });

  it('disables the step button at a bound', async () => {
    const { el, host, fixture } = await setup();
    host.versions.set(20);
    await fixture.whenStable();
    const [up, down] = [...el.querySelectorAll<HTMLButtonElement>('sn-number-box')[0].querySelectorAll('button')];
    expect(up.disabled).toBe(true);
    expect(down.disabled).toBe(false);
    expect(up.tabIndex).toBe(-1);
  });

  it('works as a form control, rounding to its decimals', async () => {
    const { host, size, key, fixture } = await setup();
    expect(size.value).toBe('1.3');
    await key(size, 'ArrowUp');
    expect(host.size.value).toBe(2.3);
    host.size.disable();
    await fixture.whenStable();
    expect(size.disabled).toBe(true);
  });

  it('draws − / + on GNOME and chevrons on Windows', async () => {
    const win = await setup('win');
    expect(win.el.querySelector('sn-number-box')!.getAttribute('data-spin')).toBe('chevrons');
    TestBed.resetTestingModule();
    const gtk = await setup('gtk');
    expect(gtk.el.querySelector('sn-number-box')!.getAttribute('data-spin')).toBe('plus-minus');
  });
});
