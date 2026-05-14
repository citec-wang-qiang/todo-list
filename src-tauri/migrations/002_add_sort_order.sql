ALTER TABLE tasks ADD COLUMN sort_order REAL NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON tasks (sort_order);
