use crate::database::{Database, Project};
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn create_project(
    name: String,
    root_path: String,
    db: State<'_, Arc<Database>>,
) -> Result<Project, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp();

    db.create_project(&id, &name, &root_path)
        .map_err(|e| e.to_string())?;

    Ok(Project {
        id,
        name,
        root_path,
        created_at: now,
        updated_at: now,
        settings: "{}".to_string(),
    })
}

#[tauri::command]
pub async fn get_projects(db: State<'_, Arc<Database>>) -> Result<Vec<Project>, String> {
    db.get_projects().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_project(id: String, db: State<'_, Arc<Database>>) -> Result<(), String> {
    db.delete_project(&id).map_err(|e| e.to_string())
}
