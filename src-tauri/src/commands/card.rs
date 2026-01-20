use crate::database::{Card, Database};
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn get_cards(
    column_id: String,
    db: State<'_, Arc<Database>>,
) -> Result<Vec<Card>, String> {
    db.get_cards(&column_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_card(
    column_id: String,
    title: String,
    description: Option<String>,
    position: i32,
    db: State<'_, Arc<Database>>,
) -> Result<Card, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp();

    db.create_card(&id, &column_id, &title, description.as_deref(), position)
        .map_err(|e| e.to_string())?;

    Ok(Card {
        id,
        column_id,
        title,
        description,
        folder_path: None,
        file_paths: "[]".to_string(),
        agent_config: "{}".to_string(),
        position,
        status: "idle".to_string(),
        created_at: now,
        updated_at: now,
        metadata: "{}".to_string(),
    })
}

#[tauri::command]
pub async fn update_card(
    id: String,
    title: String,
    description: Option<String>,
    status: String,
    db: State<'_, Arc<Database>>,
) -> Result<(), String> {
    db.update_card(&id, &title, description.as_deref(), &status)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn move_card(
    id: String,
    column_id: String,
    position: i32,
    db: State<'_, Arc<Database>>,
) -> Result<(), String> {
    db.move_card(&id, &column_id, position)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn attach_folder(
    id: String,
    folder_path: String,
    db: State<'_, Arc<Database>>,
) -> Result<(), String> {
    db.attach_folder(&id, &folder_path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_card(id: String, db: State<'_, Arc<Database>>) -> Result<(), String> {
    db.delete_card(&id).map_err(|e| e.to_string())
}

/// Phase 1 placeholder for card execution
/// In Phase 2, this will invoke the AI agent
#[tauri::command]
pub async fn execute_card_placeholder(
    card_id: String,
    db: State<'_, Arc<Database>>,
) -> Result<String, String> {
    // Update status to executing
    db.update_card_status(&card_id, "executing")
        .map_err(|e| e.to_string())?;

    // Simulate work (in real implementation, this would be async agent work)
    tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;

    // Update status to review
    db.update_card_status(&card_id, "review")
        .map_err(|e| e.to_string())?;

    Ok("Card executed (placeholder - AI integration coming in Phase 2)".to_string())
}
