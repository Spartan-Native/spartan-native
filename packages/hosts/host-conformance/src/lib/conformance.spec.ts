import { type NativeHost, staticHost } from '@spartan-native/theme';
import { checkHostConformance } from './conformance';
import { describeHostConformance } from './describe';

// The reference host passes everything, including the live checks.
describeHostConformance('staticHost', () => {
  const host = staticHost({ skin: 'mac', accent: '#007aff' });
  return { host, driver: { setAppearance: (p) => host.set(p), setFocused: (f) => host.setFocused(f) } };
});

describe('checkHostConformance', () => {
  it('passes a correct host and skips live checks without a driver', async () => {
    const report = await checkHostConformance(staticHost());
    expect(report.passed).toBe(true);
    expect(report.results.filter((r) => r.status === 'skip').map((r) => r.id)).toEqual([
      'live-appearance',
      'live-appearance-stops',
      'live-focus',
    ]);
  });

  it('names exactly what a broken host gets wrong', async () => {
    const good = staticHost();
    const broken: NativeHost = {
      ...good,
      runtime: 'carrier-pigeon' as NativeHost['runtime'],
      capabilities: { ...good.capabilities, systemAccent: 'sometimes' as never, fileDialogs: 'native' }, // …but no dialogs
      appearance: async () => ({ ...(await good.appearance()), accent: 'blue', skin: 'gtk' }),
      onAppearanceChange: () => undefined as never, // forgot to return unsubscribe
    };
    const report = await checkHostConformance(broken, {
      setAppearance: () => undefined, // the OS changes, but the host never notifies
    });
    const failed = Object.fromEntries(report.results.filter((r) => r.status === 'fail').map((r) => [r.id, r.detail]));

    expect(report.passed).toBe(false);
    expect(failed['runtime']).toContain('carrier-pigeon');
    expect(failed['capabilities']).toContain('systemAccent');
    expect(failed['appearance']).toContain('#rrggbb');
    expect(failed['skin-agrees']).toContain('gtk');
    expect(failed['dialogs-match-capability']).toContain('no dialogs');
    expect(failed['unsubscribe']).toBeDefined();
    expect(failed['live-appearance']).toBeDefined();
  });
});
