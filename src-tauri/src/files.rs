// File operations module
// This module handles file system operations for the IDE

use notify::{Event, RecursiveMode, Watcher};
use std::collections::HashMap;
use std::path::Path;

pub struct FileWatcher {
    watchers: HashMap<String, notify::RecommendedWatcher>,
}

impl FileWatcher {
    pub fn new() -> Self {
        Self {
            watchers: HashMap::new(),
        }
    }

    pub fn watch_folder<F>(&mut self, card_id: &str, path: &str, callback: F) -> Result<(), String>
    where
        F: Fn(Event) + Send + 'static,
    {
        let mut watcher = notify::recommended_watcher(move |res: Result<Event, _>| {
            if let Ok(event) = res {
                callback(event);
            }
        })
        .map_err(|e| e.to_string())?;

        watcher
            .watch(Path::new(path), RecursiveMode::Recursive)
            .map_err(|e| e.to_string())?;

        self.watchers.insert(card_id.to_string(), watcher);
        Ok(())
    }

    pub fn unwatch(&mut self, card_id: &str) {
        self.watchers.remove(card_id);
    }
}

impl Default for FileWatcher {
    fn default() -> Self {
        Self::new()
    }
}
