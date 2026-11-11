import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmKbdImports } from '@spartan-ng/helm/kbd';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { SnShortcut } from '../lib/platform/shortcut';

const stage = (content: string) => `<div style="padding: 2rem; max-width: 40rem">${content}</div>`;

/**
 * Shortcuts written once (`mod+shift+s`) and shown in the OS's notation: ⇧⌘S on macOS, Ctrl+Shift+S
 * on Windows, GNOME, KDE and ChromeOS. Switch the OS in the toolbar.
 */
const meta: Meta = {
  title: 'Desktop UI/Platform/Shortcut',
  decorators: [moduleMetadata({ imports: [SnShortcut, HlmKbdImports, HlmTableImports] })],
};
export default meta;
type Story = StoryObj;

/** Harbor's shortcuts: the notation, and what the active OS shows. */
export const Table: Story = {
  render: () => ({
    props: {
      shortcuts: [
        ['Back up now', 'mod+b'],
        ['Save', 'mod+s'],
        ['Save as', 'mod+shift+s'],
        ['Settings', 'mod+,'],
        ['Find', 'mod+f'],
        ['Find in all backups', 'ctrl+mod+f'],
        ['Developer tools', 'alt+mod+i'],
        ['Delete (macOS: ⌘⌫)', 'mod+backspace'],
        ['Delete (Windows, Linux)', 'delete'],
        ['Rename (Windows, Linux)', 'f2'],
        ['Rename (macOS)', 'enter'],
        ['Previous version', 'alt+left'],
        ['Next version', 'alt+right'],
        ['Cancel', 'escape'],
        ['Next field', 'tab'],
        ['Quick look', 'space'],
        ['Close window', 'alt+f4'],
      ],
    },
    template: stage(`
      <div hlmTableContainer>
        <table hlmTable>
          <thead hlmTHead>
            <tr hlmTr><th hlmTh>Command</th><th hlmTh>Written as</th><th hlmTh>Shown as</th></tr>
          </thead>
          <tbody hlmTBody>
            @for (s of shortcuts; track s[1]) {
              <tr hlmTr>
                <td hlmTd>{{ s[0] }}</td>
                <td hlmTd><code>{{ s[1] }}</code></td>
                <td hlmTd><kbd hlmKbd [snShortcut]="s[1]"></kbd></td>
              </tr>
            }
          </tbody>
        </table>
      </div>`),
  }),
};

/** Inline in text, as in a tooltip or a menu hint. */
export const Inline: Story = {
  render: () => ({
    template: stage(`
      <p style="margin: 0">Press <kbd hlmKbd snShortcut="mod+b"></kbd> to back up now, or
        <kbd hlmKbd snShortcut="mod+shift+s"></kbd> to save the backup plan under a new name.</p>`),
  }),
};
