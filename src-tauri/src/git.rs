// Git operations module
// Provides Ghost Mode functionality for safe, isolated code changes

use git2::{BranchType, Repository, Signature};

pub struct GhostMode {
    repo: Repository,
}

impl GhostMode {
    pub fn new(repo_path: &str) -> Result<Self, String> {
        let repo =
            Repository::open(repo_path).map_err(|e| format!("Failed to open git repo: {}", e))?;

        Ok(Self { repo })
    }

    pub fn create_ghost_branch(&self, card_id: &str) -> Result<String, String> {
        let head = self.repo.head().map_err(|e| e.to_string())?;

        let commit = head.peel_to_commit().map_err(|e| e.to_string())?;

        let branch_name = format!("ghost/{}/{}", card_id, chrono::Utc::now().timestamp());

        self.repo
            .branch(&branch_name, &commit, false)
            .map_err(|e| e.to_string())?;

        // Checkout the ghost branch
        let obj = self
            .repo
            .revparse_single(&format!("refs/heads/{}", branch_name))
            .map_err(|e| e.to_string())?;

        self.repo
            .checkout_tree(&obj, None)
            .map_err(|e| e.to_string())?;

        self.repo
            .set_head(&format!("refs/heads/{}", branch_name))
            .map_err(|e| e.to_string())?;

        Ok(branch_name)
    }

    pub fn merge_to_main(&self, ghost_branch: &str) -> Result<(), String> {
        // Checkout main
        let main = self
            .repo
            .revparse_single("main")
            .or_else(|_| self.repo.revparse_single("master"))
            .map_err(|e| e.to_string())?;

        self.repo
            .checkout_tree(&main, None)
            .map_err(|e| e.to_string())?;

        let main_branch = if self.repo.revparse_single("main").is_ok() {
            "main"
        } else {
            "master"
        };

        self.repo
            .set_head(&format!("refs/heads/{}", main_branch))
            .map_err(|e| e.to_string())?;

        // Merge ghost branch
        let ghost_commit = self
            .repo
            .revparse_single(ghost_branch)
            .map_err(|e| e.to_string())?
            .peel_to_commit()
            .map_err(|e| e.to_string())?;

        let head_commit = self
            .repo
            .head()
            .map_err(|e| e.to_string())?
            .peel_to_commit()
            .map_err(|e| e.to_string())?;

        let mut index = self
            .repo
            .merge_commits(&head_commit, &ghost_commit, None)
            .map_err(|e| e.to_string())?;

        if index.has_conflicts() {
            return Err("Merge conflicts detected - resolve manually".to_string());
        }

        // Create merge commit
        let tree_id = index.write_tree_to(&self.repo).map_err(|e| e.to_string())?;
        let tree = self.repo.find_tree(tree_id).map_err(|e| e.to_string())?;

        let signature =
            Signature::now("VIRAITH User", "user@viraith.dev").map_err(|e| e.to_string())?;

        self.repo
            .commit(
                Some("HEAD"),
                &signature,
                &signature,
                &format!("[VIRAITH] Merge ghost branch {}", ghost_branch),
                &tree,
                &[&head_commit, &ghost_commit],
            )
            .map_err(|e| e.to_string())?;

        // Delete ghost branch
        let mut branch = self
            .repo
            .find_branch(ghost_branch, BranchType::Local)
            .map_err(|e| e.to_string())?;
        branch.delete().map_err(|e| e.to_string())?;

        Ok(())
    }

    pub fn get_diff(&self, branch1: &str, branch2: &str) -> Result<String, String> {
        let tree1 = self
            .repo
            .revparse_single(branch1)
            .map_err(|e| e.to_string())?
            .peel_to_tree()
            .map_err(|e| e.to_string())?;

        let tree2 = self
            .repo
            .revparse_single(branch2)
            .map_err(|e| e.to_string())?
            .peel_to_tree()
            .map_err(|e| e.to_string())?;

        let diff = self
            .repo
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

    pub fn list_ghost_branches(&self) -> Result<Vec<String>, String> {
        let branches = self
            .repo
            .branches(Some(BranchType::Local))
            .map_err(|e| e.to_string())?;

        let ghost_branches: Vec<String> = branches
            .filter_map(|b| b.ok())
            .filter_map(|(branch, _)| branch.name().ok().flatten().map(|s| s.to_string()))
            .filter(|name| name.starts_with("ghost/"))
            .collect();

        Ok(ghost_branches)
    }
}
