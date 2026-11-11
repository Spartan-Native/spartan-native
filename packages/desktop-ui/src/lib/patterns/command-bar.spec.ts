import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SnCommandBarImports } from './command-bar';

@Component({
  imports: [SnCommandBarImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sn-command-bar title="Documents">
      <button snCommand label="New"></button>
      <button snCommand label="Share" disabled></button>
      <button snCommand label="Delete"></button>
      <ng-template snCommandOverflow><div>menu</div></ng-template>
    </sn-command-bar>
  `,
})
class Host {}

describe('SnCommandBar', () => {
  it('is one toolbar tab stop; arrows move between enabled commands and the overflow button', async () => {
    document.documentElement.dataset['snSkin'] = 'win';
    const fixture = TestBed.createComponent(Host);
    document.body.append(fixture.nativeElement);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const toolbar = el.querySelector<HTMLElement>('[role="toolbar"]')!;
    const buttons = [...el.querySelectorAll<HTMLButtonElement>('[data-slot="sn-command"]')];
    const tabbable = () => buttons.filter((b) => b.tabIndex === 0).map((b) => b.textContent!.trim());
    const keyCodes: Record<string, number> = { ArrowLeft: 37, ArrowRight: 39, End: 35 };
    const press = async (key: string) => {
      document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key, keyCode: keyCodes[key], bubbles: true }));
      await fixture.whenStable();
    };

    expect(toolbar.getAttribute('aria-label')).toBe('Documents');
    expect(el.querySelector('sn-command-bar')!.hasAttribute('title')).toBe(false);
    expect(buttons.map((b) => b.textContent!.trim())).toEqual(['New', 'Share', 'Delete', 'More options']);
    expect(buttons[3].getAttribute('aria-haspopup')).toBe('menu');
    expect(tabbable()).toEqual(['New']);

    buttons[0].focus();
    await press('ArrowRight'); // skips the disabled Share
    expect(document.activeElement).toBe(buttons[2]);
    expect(tabbable()).toEqual(['Delete']);
    await press('End');
    expect(document.activeElement).toBe(buttons[3]);
    await press('ArrowRight'); // wraps
    expect(document.activeElement).toBe(buttons[0]);
    await press('ArrowLeft');
    expect(document.activeElement).toBe(buttons[3]);

    // Windows shows labels; macOS hides them (accessible name + tooltip stay)
    expect(buttons[0].title).toBe('');
    document.documentElement.dataset['snSkin'] = 'mac';
    await new Promise((r) => setTimeout(r));
    await fixture.whenStable();
    expect(buttons[0].title).toBe('New');
    fixture.nativeElement.remove();
  });
});
