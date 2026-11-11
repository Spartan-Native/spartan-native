// main.go: a Wails v3 window running the Angular frontend, with the Spartan Native
// service reading the real OS settings (accent, light/dark, contrast, transparency,
// motion, text size) and providing native menus and dialogs.
//
//	cd frontend && npx ng build && cp -R dist/<project>/browser/. dist/   # index.html at dist/ root
//	go build -o bin/my-app .
package main

import (
	"embed"
	"io/fs"
	"log"
	"runtime"

	spartannative "github.com/spartan-native/host-wails"
	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:frontend/dist
var embedded embed.FS

func main() {
	assets, err := fs.Sub(embedded, "frontend/dist")
	if err != nil {
		log.Fatal(err)
	}

	app := application.New(application.Options{
		Name: "My App",
		// Register once. Options: spartannative.WithSkin("gtk"),
		// spartannative.WithPollInterval(500*time.Millisecond). Debug: SPARTAN_NATIVE_DEBUG=1
		Services: []application.Service{application.NewService(spartannative.New())},
		Assets:   application.AssetOptions{Handler: application.AssetFileServerFS(assets)},
		Mac:      application.MacOptions{ApplicationShouldTerminateAfterLastWindowClosed: true},
	})

	app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:     "My App",
		Width:     1120,
		Height:    740,
		MinWidth:  800,
		MinHeight: 520,
		URL:       "/",
		// Windows and Linux: no OS frame. <sn-title-bar> draws the title bar and the
		// window buttons, and they act on this window through wailsHost().
		Frameless: runtime.GOOS != "darwin",
		// macOS: the OS keeps the traffic lights; <sn-title-bar windowControls="native">
		// leaves their space free.
		Mac: application.MacWindow{
			TitleBar:                application.MacTitleBarHiddenInset,
			InvisibleTitleBarHeight: 38,
		},
	})

	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}
