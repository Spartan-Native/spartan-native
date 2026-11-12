# Design archive

Historical material from the design phase, before any package code existed. **It is not maintained**, and nothing in the build or the tests reads it.

| Path | What it was |
| --- | --- |
| `design-source/` | The design mockups, exported as HTML artboards (`*.dc.html`) with their canvas file |
| `component-skins.mockup.css` | All mockup CSS, extracted. The skins in `@spartan-native/theme` replaced it |
| `palette.reference.ts` | The first typed port of the mockups' color code. `derivePalette()` in `@spartan-native/theme` replaced it |
| `screenshot-tools/` | The scripts that rendered `docs/images/` from the artboards. They need the mockups' design runtime, which is not in this repository |

Where the packages and these files disagree, the packages are right.
