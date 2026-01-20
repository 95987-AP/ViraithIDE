use crate::database::{Column, Database};
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn get_columns(
    board_id: String,
    db: State<'_, Arc<Database>>,
) -> Result<Vec<Column>, String> {
    db.get_columns(&board_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_column(
    board_id: String,
    name: String,
    position: i32,
    db: State<'_, Arc<Database>>,
) -> Result<Column, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp();

    db.create_column(&id, &board_id, &name, position)
        .map_err(|e| e.to_string())?;

    Ok(Column {
        id,
        board_id,
        name,
        position,
        automation_rules: "[]".to_string(),
        created_at: now,
    })
}

#[tauri::command]
pub async fn update_column(
    id: String,
    name: String,
    position: i32,
    db: State<'_, Arc<Database>>,
) -> Result<(), String> {
    db.update_column(&id, &name, position)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_column(id: String, db: State<'_, Arc<Database>>) -> Result<(), String> {
    db.delete_column(&id).map_err(|e| e.to_string())
}
