# Photino.NET (.NET) desktop app

Read `node_modules/@spartan-native/host-dotnet/AGENTS.md` after this. It has the full API.

`@spartan-native/host-dotnet` has two halves:

| Half | Where | Does |
| --- | --- | --- |
| .NET service | NuGet `SpartanNative.Photino` | Reads the real OS accent, scheme, contrast, transparency, motion, text size; pushes changes; owns the window actions; shows the OS file dialogs |
| TS adapter | npm `@spartan-native/host-dotnet` | `dotnetHost()`: implements the host contract over Photino's web messages |

Both halves are released together from one tag, so **use the same version of each**: `@spartan-native/host-dotnet@1.2.3` with `SpartanNative.Photino` `1.2.3`.

**What Photino can't do:** native menus (desktop-ui draws the menubar and context menus in the page), alerts with your own buttons (no `host.dialogs.message`: use an `hlm-alert-dialog`), and dragging or resizing a chromeless window. Keep the OS window frame.

## Layout of a Photino project

```
my-app/
├── MyApp.csproj       Photino.NET + SpartanNative.Photino; copies the Angular build to wwwroot/
├── Program.cs         opens the window, attaches the service
└── frontend/          the Angular app (setup.md applies here)
```

## 1. Frontend packages

Do the shared setup in `setup.md` inside `frontend/`, then:

```bash
npm install @spartan-native/host-dotnet @spartan-native/host-web
```

## 2. .NET service

Both packages are on GitHub Packages. Add the NuGet source once, with a token that has `read:packages`:

```bash
dotnet nuget add source https://nuget.pkg.github.com/spartan-native/index.json --name spartan-native --username <github-user> --password <token>
dotnet add package Photino.NET
dotnet add package SpartanNative.Photino --version 1.2.3     # same version as the npm package
```

Start `Program.cs` from `templates/dotnet/Program.cs`. The important line, before `WaitForClose()`:

```csharp
using var spartan = SpartanNativeService.Attach(window);
```

Options: `new SpartanNativeOptions { Skin = "gtk", PollInterval = TimeSpan.FromMilliseconds(500) }`. Set `SPARTAN_NATIVE_DEBUG=1` to log what the OS reports. If the app has its own `WebMessageReceived` handler, skip the service's messages with `SpartanNativeService.IsServiceMessage(message)`.

## 3. The window

Keep Photino's OS frame (its default). The OS draws the title bar and window buttons, so the shell shows no `<sn-title-bar>` (`templates/shell` already does this for the `dotnet` runtime).

## 4. Provider

```ts
import { dotnetHost, isPhotino } from '@spartan-native/host-dotnet';
import { webHost } from '@spartan-native/host-web';

provideSpartanNative({ host: isPhotino() ? dotnetHost() : webHost() })
```

## 5. Native services through the host

Never call `window.external` from components. Use the host: `host.dialogs?.openFile(…)` gives files with a `path`. Check before use: `host.menus` is absent, and so is `host.dialogs.message`.

## 6. Build

```bash
(cd frontend && npx ng build)      # → frontend/dist/<project>/browser, copied to wwwroot/ by the .csproj
dotnet run
```

## Testing without Photino

`dotnetHost({ bridge: fake })` takes a fake channel (`sendMessage`, `receiveMessage`). For a custom adapter, run `describeHostConformance` from `@spartan-native/host-conformance`.
