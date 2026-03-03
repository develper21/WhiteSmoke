#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{CustomMenuItem, SystemTray, SystemTrayMenu, SystemTrayEvent, Manager, Builder, generate_context};
use tauri::api::process::Command;

#[tauri::main]
fn main() {
    // Tray menu items
    let toggle_theme = CustomMenuItem::new("toggle_theme".to_string(), "Toggle Theme");
    let check_updates = CustomMenuItem::new("check_updates".to_string(), "Check for Updates");

    let tray_menu = SystemTrayMenu::new()
        .add_item(toggle_theme)
        .add_item(check_updates);

    let system_tray = SystemTray::new().with_menu(tray_menu);

    Builder::default()
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::MenuItemClick { id, .. } => {
                match id.as_str() {
                    "toggle_theme" => {
                        // emit an event to frontend to toggle theme
                        let _ = app.emit_all("toggle-theme", "");
                    }
                    "check_updates" => {
                        // Spawn async task to query GitHub releases (placeholder repo)
                        let app_handle = app.handle();
                        tauri::async_runtime::spawn(async move {
                            let endpoint = "https://api.github.com/repos/owner/whitesmoke/releases/latest";
                            match reqwest::Client::new()
                                .get(endpoint)
                                .header("User-Agent", "Whitesmoke-Updater")
                                .send()
                                .await
                            {
                                Ok(resp) => {
                                    if resp.status().is_success() {
                                        if let Ok(json) = resp.json::<serde_json::Value>().await {
                                            let tag = json.get("tag_name").and_then(|v| v.as_str()).unwrap_or("");
                                            let _ = app_handle.emit_all("update-available", tag);
                                            return;
                                        }
                                    }
                                    let _ = app_handle.emit_all("update-none", "");
                                }
                                Err(e) => {
                                    let _ = app_handle.emit_all("update-error", format!("{}", e));
                                }
                            }
                        });
                    }
                    _ => {}
                }
            }
            _ => {}
        })
        .run(generate_context!())
        .expect("error while running tauri application");
}
