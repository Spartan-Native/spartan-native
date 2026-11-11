// Harbor Backup as a desktop app: the Angular Harbor app (apps/harbor-backup)
// in a Wails v3 window, with the Spartan Native service reading the OS.
//
//	npm run build:harbor-desktop   # builds Harbor, embeds it, builds this binary
//	npm run start:harbor-desktop   # … and runs it
package main

import (
	"embed"
	"io/fs"
	"log"
	"runtime"

	spartannative "github.com/spartan-native/host-wails/native"
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
		Name:        "Harbor Backup",
		Description: "Back up your documents, photos and projects",
		// Reads the real accent, light/dark, contrast, transparency, motion and text size,
		// and emits "spartan-native:appearance" when they change.
		Services: []application.Service{application.NewService(spartannative.New())},
		Assets:   application.AssetOptions{Handler: application.AssetFileServerFS(assets)},
		Mac:      application.MacOptions{ApplicationShouldTerminateAfterLastWindowClosed: true},
	})

	app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:     "Harbor Backup",
		Width:     1120,
		Height:    740,
		MinWidth:  900,
		MinHeight: 600,
		URL:       "/",
		// Windows and Linux: no OS frame; Harbor draws its title bar and window buttons
		// (desktop-ui), and they act on this window through wailsHost().
		Frameless: runtime.GOOS != "darwin",
		// macOS: the OS keeps the traffic lights; the title bar area becomes Harbor's.
		Mac: application.MacWindow{
			TitleBar:                application.MacTitleBarHiddenInset,
			InvisibleTitleBarHeight: 38,
		},
	})

	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}
