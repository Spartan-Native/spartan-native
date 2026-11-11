// src-tauri/src/lib.rs: a Tauri v2 app running the Angular frontend, with the Spartan Native
// plugin reading the real OS settings (accent, light/dark, contrast, transparency, motion,
// text size) and providing the window actions, native menus and dialogs.
//
// src-tauri/Cargo.toml:
//   tauri-plugin-dialog = "2"
//   tauri-plugin-spartan-native = { git = "https://github.com/spartan-native/host-tauri", tag = "v1.2.3" }

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // The Spartan Native plugin's file dialogs and alerts go through this plugin.
        .plugin(tauri_plugin_dialog::init())
        // Register once. Options: tauri_plugin_spartan_native::Builder::default()
        //     .skin("gtk").poll_interval(std::time::Duration::from_millis(500)).build()
        // Debug: SPARTAN_NATIVE_DEBUG=1
        .plugin(tauri_plugin_spartan_native::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
