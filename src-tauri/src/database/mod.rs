mod schema;

use parking_lot::Mutex;
use rusqlite::{Connection, Result as SqliteResult};
use std::path::Path;

pub use schema::*;

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new(path: &Path) -> SqliteResult<Self> {
        let conn = Connection::open(path)?;

        // Enable foreign keys
        conn.execute_batch("PRAGMA foreign_keys = ON;")?;

        // Initialize schema
        conn.execute_batch(SCHEMA)?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    pub fn with_conn<F, T>(&self, f: F) -> SqliteResult<T>
    where
        F: FnOnce(&Connection) -> SqliteResult<T>,
    {
        let conn = self.conn.lock();
        f(&conn)
    }

    pub fn with_conn_mut<F, T>(&self, f: F) -> SqliteResult<T>
    where
        F: FnOnce(&mut Connection) -> SqliteResult<T>,
    {
        let mut conn = self.conn.lock();
        f(&mut conn)
    }
}

// Project operations
impl Database {
    pub fn create_project(
        &self,
        id: &str,
        name: &str,
        root_path: &str,
    ) -> SqliteResult<()> {
        self.with_conn(|conn| {
            conn.execute(
                "INSERT INTO projects (id, name, root_path) VALUES (?1, ?2, ?3)",
                [id, name, root_path],
            )?;
            Ok(())
        })
    }

    pub fn get_projects(&self) -> SqliteResult<Vec<Project>> {
        self.with_conn(|conn| {
            let mut stmt = conn.prepare(
                "SELECT id, name, root_path, created_at, updated_at, settings FROM projects ORDER BY updated_at DESC"
            )?;

            let projects = stmt
                .query_map([], |row| {
                    Ok(Project {
                        id: row.get(0)?,
                        name: row.get(1)?,
                        root_path: row.get(2)?,
                        created_at: row.get(3)?,
                        updated_at: row.get(4)?,
                        settings: row.get::<_, String>(5)?,
                    })
                })?
                .collect::<SqliteResult<Vec<_>>>()?;

            Ok(projects)
        })
    }

    pub fn delete_project(&self, id: &str) -> SqliteResult<()> {
        self.with_conn(|conn| {
            conn.execute("DELETE FROM projects WHERE id = ?1", [id])?;
            Ok(())
        })
    }
}

// Board operations
impl Database {
    pub fn create_board(
        &self,
        id: &str,
        project_id: &str,
        name: &str,
        position: i32,
    ) -> SqliteResult<()> {
        self.with_conn(|conn| {
            conn.execute(
                "INSERT INTO boards (id, project_id, name, position) VALUES (?1, ?2, ?3, ?4)",
                rusqlite::params![id, project_id, name, position],
            )?;
            Ok(())
        })
    }

    pub fn get_boards(&self, project_id: &str) -> SqliteResult<Vec<Board>> {
        self.with_conn(|conn| {
            let mut stmt = conn.prepare(
                "SELECT id, project_id, name, position, created_at FROM boards WHERE project_id = ?1 ORDER BY position"
            )?;

            let boards = stmt
                .query_map([project_id], |row| {
                    Ok(Board {
                        id: row.get(0)?,
                        project_id: row.get(1)?,
                        name: row.get(2)?,
                        position: row.get(3)?,
                        created_at: row.get(4)?,
                    })
                })?
                .collect::<SqliteResult<Vec<_>>>()?;

            Ok(boards)
        })
    }
}

// Column operations
impl Database {
    pub fn create_column(
        &self,
        id: &str,
        board_id: &str,
        name: &str,
        position: i32,
    ) -> SqliteResult<()> {
        self.with_conn(|conn| {
            conn.execute(
                "INSERT INTO columns (id, board_id, name, position) VALUES (?1, ?2, ?3, ?4)",
                rusqlite::params![id, board_id, name, position],
            )?;
            Ok(())
        })
    }

    pub fn get_columns(&self, board_id: &str) -> SqliteResult<Vec<Column>> {
        self.with_conn(|conn| {
            let mut stmt = conn.prepare(
                "SELECT id, board_id, name, position, automation_rules, created_at FROM columns WHERE board_id = ?1 ORDER BY position"
            )?;

            let columns = stmt
                .query_map([board_id], |row| {
                    Ok(Column {
                        id: row.get(0)?,
                        board_id: row.get(1)?,
                        name: row.get(2)?,
                        position: row.get(3)?,
                        automation_rules: row.get::<_, String>(4)?,
                        created_at: row.get(5)?,
                    })
                })?
                .collect::<SqliteResult<Vec<_>>>()?;

            Ok(columns)
        })
    }

    pub fn update_column(&self, id: &str, name: &str, position: i32) -> SqliteResult<()> {
        self.with_conn(|conn| {
            conn.execute(
                "UPDATE columns SET name = ?2, position = ?3 WHERE id = ?1",
                rusqlite::params![id, name, position],
            )?;
            Ok(())
        })
    }

    pub fn delete_column(&self, id: &str) -> SqliteResult<()> {
        self.with_conn(|conn| {
            conn.execute("DELETE FROM columns WHERE id = ?1", [id])?;
            Ok(())
        })
    }
}

// Card operations
impl Database {
    pub fn create_card(
        &self,
        id: &str,
        column_id: &str,
        title: &str,
        description: Option<&str>,
        position: i32,
    ) -> SqliteResult<()> {
        self.with_conn(|conn| {
            conn.execute(
                "INSERT INTO cards (id, column_id, title, description, position) VALUES (?1, ?2, ?3, ?4, ?5)",
                rusqlite::params![id, column_id, title, description, position],
            )?;
            Ok(())
        })
    }

    pub fn get_cards(&self, column_id: &str) -> SqliteResult<Vec<Card>> {
        self.with_conn(|conn| {
            let mut stmt = conn.prepare(
                "SELECT id, column_id, title, description, folder_path, file_paths, agent_config, position, status, created_at, updated_at, metadata FROM cards WHERE column_id = ?1 ORDER BY position"
            )?;

            let cards = stmt
                .query_map([column_id], |row| {
                    Ok(Card {
                        id: row.get(0)?,
                        column_id: row.get(1)?,
                        title: row.get(2)?,
                        description: row.get(3)?,
                        folder_path: row.get(4)?,
                        file_paths: row.get::<_, String>(5)?,
                        agent_config: row.get::<_, String>(6)?,
                        position: row.get(7)?,
                        status: row.get(8)?,
                        created_at: row.get(9)?,
                        updated_at: row.get(10)?,
                        metadata: row.get::<_, String>(11)?,
                    })
                })?
                .collect::<SqliteResult<Vec<_>>>()?;

            Ok(cards)
        })
    }

    pub fn update_card(
        &self,
        id: &str,
        title: &str,
        description: Option<&str>,
        status: &str,
    ) -> SqliteResult<()> {
        self.with_conn(|conn| {
            conn.execute(
                "UPDATE cards SET title = ?2, description = ?3, status = ?4, updated_at = strftime('%s', 'now') WHERE id = ?1",
                rusqlite::params![id, title, description, status],
            )?;
            Ok(())
        })
    }

    pub fn move_card(&self, id: &str, column_id: &str, position: i32) -> SqliteResult<()> {
        self.with_conn(|conn| {
            conn.execute(
                "UPDATE cards SET column_id = ?2, position = ?3, updated_at = strftime('%s', 'now') WHERE id = ?1",
                rusqlite::params![id, column_id, position],
            )?;
            Ok(())
        })
    }

    pub fn attach_folder(&self, id: &str, folder_path: &str) -> SqliteResult<()> {
        self.with_conn(|conn| {
            conn.execute(
                "UPDATE cards SET folder_path = ?2, updated_at = strftime('%s', 'now') WHERE id = ?1",
                [id, folder_path],
            )?;
            Ok(())
        })
    }

    pub fn update_card_status(&self, id: &str, status: &str) -> SqliteResult<()> {
        self.with_conn(|conn| {
            conn.execute(
                "UPDATE cards SET status = ?2, updated_at = strftime('%s', 'now') WHERE id = ?1",
                [id, status],
            )?;
            Ok(())
        })
    }

    pub fn delete_card(&self, id: &str) -> SqliteResult<()> {
        self.with_conn(|conn| {
            conn.execute("DELETE FROM cards WHERE id = ?1", [id])?;
            Ok(())
        })
    }
}

// Data structures
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub root_path: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub settings: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Board {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub position: i32,
    pub created_at: i64,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Column {
    pub id: String,
    pub board_id: String,
    pub name: String,
    pub position: i32,
    pub automation_rules: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Card {
    pub id: String,
    pub column_id: String,
    pub title: String,
    pub description: Option<String>,
    pub folder_path: Option<String>,
    pub file_paths: String,
    pub agent_config: String,
    pub position: i32,
    pub status: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub metadata: String,
}
