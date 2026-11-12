// ============================================================================
//  The Spartan Native toolbar (Storybook manager addon).
//
//    // .storybook/manager.tsx
//    import '@spartan-native/theme/storybook/manager';
//
//  Draws the globals that spartanNativePreview() declares:
//    skin          an OS select with an icon per platform
//    transparency  a toggle: Reduce transparency
//    contrast      a toggle: Increase contrast
//    window        a toggle: Inactive window (only when windowFocus is on)
//    accent        a select with a swatch per preset, plus a custom color picker
//  A control is drawn only when the preview declares its global.
//  The text size stays a regular toolbar dropdown (globalTypes.textScale).
// ============================================================================
import React from 'react';
import { Select, Separator, ToggleButton } from 'storybook/internal/components';
import { addons, types, useGlobals, useGlobalTypes } from 'storybook/manager-api';
import {
  AppleIcon,
  ChromeIcon,
  ContrastIcon,
  EyeCloseIcon,
  LinuxIcon,
  MirrorIcon,
  WindowsIcon,
} from '@storybook/icons';
import { ACCENT_PRESETS, STORYBOOK_SKINS, type OsFamily } from '../src/toolbar-options';

const ADDON_ID = 'spartan-native/toolbar';

const OS_ICONS: Record<OsFamily, React.ReactElement> = {
  windows: <WindowsIcon />,
  apple: <AppleIcon />,
  linux: <LinuxIcon />,
  chrome: <ChromeIcon />,
};

/** A round color chip, used as the icon of each accent option. */
const Swatch = ({ color }: { color: string }) => (
  <span
    aria-hidden="true"
    style={{
      display: 'inline-block',
      width: 14,
      height: 14,
      borderRadius: '50%',
      background: color,
      boxShadow: 'inset 0 0 0 1px rgb(0 0 0 / 0.2)',
      flex: 'none',
    }}
  />
);

/** On/off switch for a two-valued global: pressed = the `on` value. */
function Switch(props: { global: string; on: string; off: string; label: string; icon: React.ReactElement }) {
  const [globals, updateGlobals] = useGlobals();
  const pressed = globals[props.global] === props.on;
  return (
    <ToggleButton
      variant="ghost"
      padding="small"
      pressed={pressed}
      ariaLabel={props.label}
      tooltip={`${props.label}: ${pressed ? 'on' : 'off'}`}
      onClick={() => updateGlobals({ [props.global]: pressed ? props.off : props.on })}
    >
      {props.icon}
    </ToggleButton>
  );
}

const Toolbar = React.memo(function Toolbar() {
  const [globals, updateGlobals] = useGlobals();
  const declared = useGlobalTypes();
  const has = (key: string) => key in declared;

  const skin = STORYBOOK_SKINS.find((s) => s.value === globals['skin']) ?? STORYBOOK_SKINS[0];
  const accent = String(globals['accent'] ?? ACCENT_PRESETS[0].value).toLowerCase();
  const preset = ACCENT_PRESETS.find((p) => p.value === accent);

  return (
    <>
      <Separator />
      {has('skin') && (
        <Select
          // Remount when the value changes elsewhere (URL, another addon): the select is uncontrolled.
          key={`skin-${skin.value}`}
          ariaLabel="Operating system"
          icon={OS_ICONS[skin.family]}
          defaultOptions={skin.value}
          options={STORYBOOK_SKINS.map((s) => ({ value: s.value, title: s.title, icon: OS_ICONS[s.family] }))}
          onSelect={(value) => updateGlobals({ skin: value })}
        >
          {skin.title}
        </Select>
      )}
      {has('transparency') && (
        <Switch global="transparency" on="reduced" off="normal" label="Reduce transparency" icon={<MirrorIcon />} />
      )}
      {has('contrast') && (
        <Switch global="contrast" on="more" off="normal" label="Increase contrast" icon={<ContrastIcon />} />
      )}
      {has('window') && (
        <Switch global="window" on="inactive" off="focused" label="Inactive window" icon={<EyeCloseIcon />} />
      )}
      {has('accent') && (
        <>
          <Select
            key={`accent-${accent}`}
            ariaLabel="Accent color"
            icon={<Swatch color={accent} />}
            defaultOptions={preset?.value}
            options={ACCENT_PRESETS.map((p) => ({
              value: p.value,
              title: p.title,
              icon: <Swatch color={p.value} />,
              aside: p.value,
            }))}
            onSelect={(value) => updateGlobals({ accent: value })}
          >
            {preset?.title ?? accent}
          </Select>
          {/* Any other color: the native picker, drawn as a small chip */}
          <label
            title="Custom accent color"
            style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
          >
            <input
              type="color"
              aria-label="Custom accent color"
              value={accent}
              onChange={(e) => updateGlobals({ accent: e.currentTarget.value })}
              style={{ width: 22, height: 22, padding: 0, border: 0, background: 'none', cursor: 'pointer' }}
            />
          </label>
        </>
      )}
    </>
  );
});

addons.register(ADDON_ID, () => {
  addons.add(ADDON_ID, {
    title: 'Spartan Native',
    type: types.TOOL,
    match: ({ viewMode, tabId }) => !!viewMode?.match(/^(story|docs)$/) && !tabId,
    render: () => <Toolbar />,
  });
});
