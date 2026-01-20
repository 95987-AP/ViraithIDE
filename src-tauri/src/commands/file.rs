use serde::{Deserialize, Serialize};
use std::path::Path;
use tauri_plugin_dialog::DialogExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub children: Option<Vec<FileNode>>,
    pub size: Option<u64>,
    pub modified: Option<i64>,
}

#[tauri::command]
pub async fn get_file_tree(project_path: String) -> Result<FileNode, String> {
    let path = Path::new(&project_path);

    if !path.exists() {
        return Err(format!("Path does not exist: {}", project_path));
    }

    fn build_tree(path: &Path, max_depth: usize, current_depth: usize) -> Option<FileNode> {
        if current_depth > max_depth {
            return None;
        }

        let name = path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| path.to_string_lossy().to_string());

        // Skip hidden files and common ignored directories
        if name.starts_with('.') || name == "node_modules" || name == "target" || name == "dist" {
            return None;
        }

        let metadata = std::fs::metadata(path).ok();
        let is_directory = path.is_dir();

        let (size, modified) = metadata
            .map(|m| {
                (
                    if is_directory { None } else { Some(m.len()) },
                    m.modified()
                        .ok()
                        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                        .map(|d| d.as_secs() as i64),
                )
            })
            .unwrap_or((None, None));

        let children = if is_directory {
            let mut entries: Vec<FileNode> = std::fs::read_dir(path)
                .ok()?
                .filter_map(|entry| entry.ok())
                .filter_map(|entry| build_tree(&entry.path(), max_depth, current_depth + 1))
                .collect();

            // Sort: directories first, then files, alphabetically
            entries.sort_by(|a, b| {
                match (a.is_directory, b.is_directory) {
                    (true, false) => std::cmp::Ordering::Less,
                    (false, true) => std::cmp::Ordering::Greater,
                    _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
                }
            });

            Some(entries)
        } else {
            None
        };

        Some(FileNode {
            name,
            path: path.to_string_lossy().to_string(),
            is_directory,
            children,
            size,
            modified,
        })
    }

    build_tree(path, 10, 0).ok_or_else(|| "Failed to build file tree".to_string())
}

#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String> {
    tokio::fs::read_to_string(&path)
        .await
        .map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
pub async fn open_folder_dialog(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use std::sync::mpsc;

    let (tx, rx) = mpsc::channel();

    app.dialog()
        .file()
        .pick_folder(move |folder_path| {
            let path = folder_path.map(|p| p.to_string());
            let _ = tx.send(path);
        });

    // Wait for dialog result
    rx.recv()
        .map_err(|e| format!("Dialog error: {}", e))
}

#[tauri::command]
pub async fn write_file(path: String, content: String) -> Result<(), String> {
    // Create parent directories if they don't exist
    if let Some(parent) = Path::new(&path).parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| format!("Failed to create parent directories: {}", e))?;
    }

    tokio::fs::write(&path, content)
        .await
        .map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
pub async fn create_file(path: String, content: String) -> Result<(), String> {
    // Create parent directories if they don't exist
    if let Some(parent) = Path::new(&path).parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| format!("Failed to create parent directories: {}", e))?;
    }

    tokio::fs::write(&path, content)
        .await
        .map_err(|e| format!("Failed to create file: {}", e))
}

#[tauri::command]
pub async fn create_directory(path: String) -> Result<(), String> {
    tokio::fs::create_dir_all(&path)
        .await
        .map_err(|e| format!("Failed to create directory: {}", e))
}

#[tauri::command]
pub async fn delete_file(path: String) -> Result<(), String> {
    let path_ref = Path::new(&path);

    if path_ref.is_dir() {
        tokio::fs::remove_dir_all(&path)
            .await
            .map_err(|e| format!("Failed to delete directory: {}", e))
    } else {
        tokio::fs::remove_file(&path)
            .await
            .map_err(|e| format!("Failed to delete file: {}", e))
    }
}

#[tauri::command]
pub async fn file_exists(path: String) -> Result<bool, String> {
    Ok(Path::new(&path).exists())
}
