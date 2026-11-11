# Harbor Backup · desktop (Wails v3)

The Harbor Backup Angular app (`apps/harbor-backup`) as a native desktop app. The Spartan Native Go service reads the real OS settings, and the window is Harbor's own.

```bash
npm run start:harbor-desktop    # build Harbor, embed it, build and run the binary
npm run build:harbor-desktop    # build only → apps/harbor-desktop/bin/harbor-backup[.exe]
SPARTAN_NATIVE_DEBUG=1 apps/harbor-desktop/bin/harbor-backup   # log what the OS reports
```

Needs Go ≥ 1.26 and the Wails v3 platform prerequisites (WebView2 on Windows, WebKitGTK on Linux; see the Wails docs).

| OS | Window | Harbor draws |
| --- | --- | --- |
| Windows | frameless | the Fluent title bar and caption buttons (they act on the window) |
| macOS | hidden-inset title bar | its sidebar under the system traffic lights |
| Linux | frameless | the GNOME header bar and close button |

Harbor picks the host at runtime: `isWails() ? wailsHost() : webHost()`. Change the system accent, dark mode, contrast or (on Windows) the text size while it runs, and the window follows within about a second.

| File | What it is |
| --- | --- |
| `main.go` | The Wails app: embeds `frontend/dist`, registers `spartannative.New()`, opens the window |
| `scripts/build.mjs` | Cross-platform build: `ng build` → copy → `go build` (`--run` to start) |
| `go.mod` | Uses the adapter from this repo via `replace` (workspace glue) |
