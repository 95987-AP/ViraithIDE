mod commands;
mod database;
mod files;
mod git;

use database::Database;
use std::sync::Arc;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Initialize database
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");

            std::fs::create_dir_all(&app_data_dir).expect("Failed to create app data directory");

            let db_path = app_data_dir.join("viraith.db");
            let db = Database::new(&db_path).expect("Failed to initialize database");

            app.manage(Arc::new(db));

            // Open devtools in development
            #[cfg(debug_assertions)]
            {
                if let Some(window) = app.get_webview_window("main") {
                    window.open_devtools();
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Project commands
            commands::project::create_project,
            commands::project::get_projects,
            commands::project::delete_project,
            // Board commands
            commands::board::get_boards,
            commands::board::create_board,
            // Column commands
            commands::column::get_columns,
            commands::column::create_column,
            commands::column::update_column,
            commands::column::delete_column,
            // Card commands
            commands::card::get_cards,
            commands::card::create_card,
            commands::card::update_card,
            commands::card::delete_card,
            commands::card::move_card,
            commands::card::attach_folder,
            commands::card::execute_card_placeholder,
            // File commands
            commands::file::get_file_tree,
            commands::file::read_file,
            commands::file::write_file,
            commands::file::create_file,
            commands::file::create_directory,
            commands::file::delete_file,
            commands::file::file_exists,
            commands::file::open_folder_dialog,
            // Git commands
            commands::git::get_branches,
            commands::git::create_ghost_branch,
            commands::git::get_branch_diff,
            commands::git::merge_ghost_branch,
            // Shell commands
            commands::shell::reveal_in_finder,
            commands::shell::open_path,
            // Window commands
            commands::window::minimize_window,
            commands::window::maximize_window,
            commands::window::close_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
