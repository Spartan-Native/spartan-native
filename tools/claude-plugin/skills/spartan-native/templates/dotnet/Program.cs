// Program.cs: a Photino.NET window running the Angular frontend, with the Spartan Native
// service reading the real OS settings (accent, light/dark, contrast, transparency, motion,
// text size) and providing the window actions and file dialogs.
//
//   dotnet add package Photino.NET
//   dotnet add package SpartanNative.Photino --version 1.2.3   # same version as @spartan-native/host-dotnet
//
// The .csproj copies the Angular build (frontend/dist/<project>/browser) to wwwroot/.

using Photino.NET;
using SpartanNative.Photino;

class Program
{
    [STAThread]
    static void Main()
    {
        var window = new PhotinoWindow()
            .SetTitle("My App")
            .SetSize(1120, 740)
            .SetMinSize(800, 520)
            .Center()
            // Keep the OS frame: Photino's chromeless windows can't be dragged or resized.
            .Load("wwwroot/index.html");

        // Before WaitForClose(). Options: new SpartanNativeOptions { Skin = "gtk",
        // PollInterval = TimeSpan.FromMilliseconds(500) }. Debug: SPARTAN_NATIVE_DEBUG=1
        using var spartan = SpartanNativeService.Attach(window);

        window.WaitForClose();
    }
}
