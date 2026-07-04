pub mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::binary_manager::check_binaries,
            commands::binary_manager::download_binary,
            commands::downloader::check_url,
            commands::downloader::start_download
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
