use crate::database::{Board, Database};
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn get_boards(
    project_id: String,
    db: State<'_, Arc<Database>>,
) -> Result<Vec<Board>, String> {
    db.get_boards(&project_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_board(
    project_id: String,
    name: String,
    position: i32,
    db: State<'_, Arc<Database>>,
) -> Result<Board, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp();

    db.create_board(&id, &project_id, &name, position)
        .map_err(|e| e.to_string())?;

    Ok(Board {
        id,
        project_id,
        name,
        position,
        created_at: now,
    })
}
