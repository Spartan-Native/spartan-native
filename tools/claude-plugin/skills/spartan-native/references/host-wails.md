# Wails v3 (Go) desktop app

Read `node_modules/@spartan-native/host-wails/AGENTS.md` after this. It has the full API.

`@spartan-native/host-wails` has two halves:

| Half | Where | Does |
| --- | --- | --- |
| Go service | module `github.com/spartan-native/host-wails/native` | Reads the real OS accent, scheme, contrast, transparency, motion, text size; pushes changes; shows native menus and file/message dialogs |
| TS adapter | npm `@spartan-native/host-wails` | `wailsHost()`: implements the host contract over the Wails runtime |

## Layout of a Wails project

```
my-app/
├── main.go            Wails app: registers spartannative.New(), opens the window
├── go.mod
└── frontend/          the Angular app (setup.md applies here)
    └── dist/          ng build output, embedded by main.go
```

## 1. Frontend packages

Do the shared setup in `setup.md` inside `frontend/`, then:

```bash
npm install @spartan-native/host-wails @spartan-native/host-web @wailsio/runtime
```

`host-web` is the fallback so the same frontend runs in a browser during development (`ng serve`) and in Storybook.

## 2. Go service

```bash
go get github.com/spartan-native/host-wails/native
go get github.com/wailsapp/wails/v3
```

Start `main.go` from `templates/wails/main.go`. The important lines:

```go
Services: []application.Service{application.NewService(spartannative.New())},
```

Options: `spartannative.WithSkin("gtk")` forces a skin, `spartannative.WithPollInterval(500*time.Millisecond)` changes how often it polls settings that have no OS event. Set `SPARTAN_NATIVE_DEBUG=1` to log what the OS reports.

Register the service once. It owns the `spartan-native:*` events; don't add a second appearance or menu service.

## 3. The window

The app draws its own title bar, except where the OS keeps its buttons:

| OS | Wails window option | In the frontend |
| --- | --- | --- |
| Windows | `Frameless: true` | `<sn-title-bar>` draws title and caption buttons; they act on the real window |
| Linux | `Frameless: true` | `<sn-title-bar>` draws the header bar and close button |
| macOS | `Mac.TitleBar: application.MacTitleBarHiddenInset` | The OS draws the traffic lights. Use `<sn-title-bar windowControls="native">` so the bar leaves their space free |

`templates/wails/main.go` sets this up with `Frameless: runtime.GOOS != "darwin"`, and `templates/shell` picks `windowControls` to match. `<sn-title-bar>` is already a `--wails-draggable` region: don't add your own.

## 4. Provider

```ts
import { isWails, wailsHost } from '@spartan-native/host-wails';
import { webHost } from '@spartan-native/host-web';

provideSpartanNative({ host: isWails() ? wailsHost() : webHost() })
```

## 5. Native services through the host

Never call `@wailsio/runtime` or bound Go methods from components. Use the host:

```ts
private readonly host = inject(NATIVE_HOST);

async open() {
  const [file] = (await this.host.dialogs?.openFile({ filters: [{ name: 'Backups', extensions: ['hbk'] }] })) ?? [];
  if (file) this.load(file.path!);   // Wails gives a path; the browser gives a handle instead
}

async confirmClose() {
  const answer = await this.host.dialogs?.message?.({
    kind: 'question', message: 'Save changes?',
    buttons: [{ id: 'save', label: 'Save' }, { id: 'discard', label: "Don't save" }, { id: 'cancel', label: 'Cancel' }],
    defaultId: 'save', cancelId: 'cancel',     // always pass cancelId
  });
}
```

Menus: use `<sn-menubar [menu]="menu">` and `[snContextMenu]` from desktop-ui. They use the native menus on Wails and draw in the page in a browser.

## 6. Build

```bash
(cd frontend && npx ng build)      # → frontend/dist/<project>/browser
# copy that folder to frontend/dist so main.go's //go:embed finds index.html at its root
go build -o bin/my-app .
```

Needs Go and the Wails v3 platform prerequisites (WebView2 on Windows, WebKitGTK on Linux).

## Testing without Wails

`wailsHost({ runtime: fakeRuntime })` takes a fake runtime. For a custom adapter, run `describeHostConformance` from `@spartan-native/host-conformance`.
