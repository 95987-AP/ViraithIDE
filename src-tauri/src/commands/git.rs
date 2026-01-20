use git2::{BranchType, Repository, Signature};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitBranch {
    pub name: String,
    pub is_head: bool,
    pub is_ghost: bool,
    pub last_commit: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitCommit {
    pub sha: String,
    pub message: String,
    pub timestamp: i64,
    pub author: String,
}

#[tauri::command]
pub async fn get_branches(repo_path: String) -> Result<Vec<GitBranch>, String> {
    let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;

    let branches = repo
        .branches(Some(BranchType::Local))
        .map_err(|e| e.to_string())?;

    let mut result = Vec::new();

    for branch in branches {
        let (branch, _) = branch.map_err(|e| e.to_string())?;
        let name = branch.name().map_err(|e| e.to_string())?.unwrap_or("").to_string();
        let is_head = branch.is_head();
        let is_ghost = name.starts_with("ghost/");

        let last_commit = branch
            .get()
            .peel_to_commit()
            .ok()
            .map(|c| c.message().unwrap_or("").to_string());

        result.push(GitBranch {
            name,
            is_head,
            is_ghost,
            last_commit,
        });
    }

    Ok(result)
}

#[tauri::command]
pub async fn create_ghost_branch(repo_path: String, card_id: String) -> Result<String, String> {
    let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;

    let head = repo.head().map_err(|e| e.to_string())?;
    let commit = head.peel_to_commit().map_err(|e| e.to_string())?;

    let timestamp = chrono::Utc::now().timestamp();
    let branch_name = format!("ghost/{}/{}", card_id, timestamp);

    repo.branch(&branch_name, &commit, false)
        .map_err(|e| e.to_string())?;

    // Checkout the ghost branch
    let obj = repo
        .revparse_single(&format!("refs/heads/{}", branch_name))
        .map_err(|e| e.to_string())?;

    repo.checkout_tree(&obj, None).map_err(|e| e.to_string())?;

    repo.set_head(&format!("refs/heads/{}", branch_name))
        .map_err(|e| e.to_string())?;

    Ok(branch_name)
}

#[tauri::command]
pub async fn get_branch_diff(
    repo_path: String,
    branch1: String,
    branch2: String,
) -> Result<String, String> {
    let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;

    let tree1 = repo
        .revparse_single(&branch1)
        .map_err(|e| e.to_string())?
        .peel_to_tree()
        .map_err(|e| e.to_string())?;

    let tree2 = repo
        .revparse_single(&branch2)
        .map_err(|e| e.to_string())?
        .peel_to_tree()
        .map_err(|e| e.to_string())?;

    let diff = repo
        .diff_tree_to_tree(Some(&tree1), Some(&tree2), None)
        .map_err(|e| e.to_string())?;

    let mut diff_text = String::new();
    diff.print(git2::DiffFormat::Patch, |_delta, _hunk, line| {
        diff_text.push_str(&String::from_utf8_lossy(line.content()));
        true
    })
    .map_err(|e| e.to_string())?;

    Ok(diff_text)
}

#[tauri::command]
pub async fn merge_ghost_branch(repo_path: String, ghost_branch: String) -> Result<(), String> {
    let repo = Repository::open(&repo_path).map_err(|e| e.to_string())?;

    // Checkout main
    let main = repo
        .revparse_single("main")
        .or_else(|_| repo.revparse_single("master"))
        .map_err(|e| e.to_string())?;

    repo.checkout_tree(&main, None).map_err(|e| e.to_string())?;

    let main_branch_name = if repo.revparse_single("main").is_ok() {
        "main"
    } else {
        "master"
    };

    repo.set_head(&format!("refs/heads/{}", main_branch_name))
        .map_err(|e| e.to_string())?;

    // Get commits
    let ghost_commit = repo
        .revparse_single(&ghost_branch)
        .map_err(|e| e.to_string())?
        .peel_to_commit()
        .map_err(|e| e.to_string())?;

    let head_commit = repo
        .head()
        .map_err(|e| e.to_string())?
        .peel_to_commit()
        .map_err(|e| e.to_string())?;

    // Merge
    let mut index = repo
        .merge_commits(&head_commit, &ghost_commit, None)
        .map_err(|e| e.to_string())?;

    if index.has_conflicts() {
        return Err("Merge conflicts detected - resolve manually".to_string());
    }

    // Create merge commit
    let tree_id = index.write_tree_to(&repo).map_err(|e| e.to_string())?;
    let tree = repo.find_tree(tree_id).map_err(|e| e.to_string())?;

    let signature = Signature::now("VIRAITH User", "user@viraith.dev").map_err(|e| e.to_string())?;

    repo.commit(
        Some("HEAD"),
        &signature,
        &signature,
        &format!("[VIRAITH] Merge ghost branch {}", ghost_branch),
        &tree,
        &[&head_commit, &ghost_commit],
    )
    .map_err(|e| e.to_string())?;

    // Delete ghost branch
    let mut branch = repo
        .find_branch(&ghost_branch, BranchType::Local)
        .map_err(|e| e.to_string())?;
    branch.delete().map_err(|e| e.to_string())?;

    Ok(())
}
