import { contrastRatio } from './color';
import { derivePalette } from './derive-palette';
import { paletteToCssVars } from './palette-css-vars';
import type { Skin } from '../contract/native-host';

const SKINS: Skin[] = ['win', 'w10', 'mac', 'macc', 'gtk', 'qt', 'cros'];
const ACCENTS = ['#0078D4', '#007AFF', '#3584E4', '#3DAEE9', '#9141AC', '#E66100', '#26A269', '#D56199'];

describe('derivePalette', () => {
  for (const skin of SKINS) {
    for (const scheme of ['light', 'dark'] as const) {
      it(`${skin} ${scheme}: text tokens reach WCAG contrast for every swatch`, () => {
        for (const accent of ACCENTS) {
          const p = derivePalette({ skin, accent, scheme });
          expect(contrastRatio(p.fg, p.bg)).toBeGreaterThanOrEqual(4.5);
          expect(contrastRatio(p.fgMuted, p.bg)).toBeGreaterThanOrEqual(4.5);
          expect(contrastRatio(p.accentText, p.bg)).toBeGreaterThanOrEqual(4.5);
          expect(contrastRatio(p.primaryFg, p.primary)).toBeGreaterThanOrEqual(3);
        }
      });
    }
  }

  it('matches the design reference for Windows 11 light', () => {
    const p = derivePalette({ skin: 'win', accent: '#0078D4', scheme: 'light' });
    expect(p.primary).toBe('#0067b5');
    expect(p.surface).toBe(p.surfaceSolid);
  });

  it('is deterministic and falls back to the default accent on bad input', () => {
    const a = derivePalette({ skin: 'gtk', accent: 'nope', scheme: 'dark' });
    const b = derivePalette({ skin: 'gtk', accent: '#0078d4', scheme: 'dark' });
    expect(a).toEqual(b);
  });

  it('makes macOS surfaces translucent, and solid with reduced transparency', () => {
    const glassy = derivePalette({ skin: 'mac', accent: '#007AFF', scheme: 'light' });
    const solid = derivePalette({ skin: 'mac', accent: '#007AFF', scheme: 'light', reduceTransparency: true });
    expect(glassy.surface.startsWith('rgba(')).toBe(true);
    expect(solid.surface).toBe(solid.surfaceSolid);
    expect(solid.wall).toBe(solid.bg);
    expect(solid.glassHighlight).toBe('transparent');
  });

  it('exposes every token as a --sn-color-* variable', () => {
    const vars = paletteToCssVars(derivePalette({ skin: 'win', accent: '#0078D4', scheme: 'light' }));
    expect(vars['--sn-color-fg-muted']).toMatch(/^#/);
    expect(vars['--sn-color-primary-edge']).toMatch(/^#/);
    expect(Object.keys(vars).every((k) => k.startsWith('--sn-color-'))).toBe(true);
  });
});
