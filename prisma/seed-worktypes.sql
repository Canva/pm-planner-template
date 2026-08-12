-- Seed WorkTypeConfig table (safe to re-run — uses INSERT OR IGNORE)
-- These are the app's default brief types. BAU is protected in the Admin
-- UI/API (see PROTECTED_WORK_TYPES) because it skips the phase pipeline
-- entirely — the other three are freely editable and more can be added.

INSERT OR IGNORE INTO "WorkTypeConfig" ("id","key","label","color","sortOrder","createdAt","updatedAt") VALUES
  ('wt_strategic', 'STRATEGIC', 'Strategic', '#6366f1', 0, datetime('now'), datetime('now')),
  ('wt_task',      'TASK',      'Task',      '#f59e0b', 1, datetime('now'), datetime('now')),
  ('wt_bau',       'BAU',       'BAU',       '#10b981', 2, datetime('now'), datetime('now')),
  ('wt_micro',     'MICRO',     'Micro',     '#06b6d4', 3, datetime('now'), datetime('now'));
