-- Seed PhaseConfig table (safe to re-run — uses INSERT OR IGNORE)
-- Also re-applies data migrations in case backup had old phase names

-- Data migrations (in case backup has old phase names)
UPDATE "TaskPhase" SET "type" = 'SH_REVIEW' WHERE "type" = 'FEEDBACK_CONSOLIDATION';
UPDATE "Task" SET "currentPhaseType" = 'SH_REVIEW' WHERE "currentPhaseType" = 'FEEDBACK_CONSOLIDATION';
UPDATE "TaskPhase" SET "type" = 'ASSET_FINALIZATION' WHERE "type" = 'CONTENT_FINALIZATION';
UPDATE "Task" SET "currentPhaseType" = 'ASSET_FINALIZATION' WHERE "currentPhaseType" = 'CONTENT_FINALIZATION';

-- Seed phases (INSERT OR IGNORE so it's safe to re-run)
INSERT OR IGNORE INTO "PhaseConfig" ("id","key","label","color","estMin","estMax","sortOrder","supportsRoundTag","createdAt","updatedAt") VALUES
  ('phase_intake',       'INTAKE',               'Intake',               '#94a3b8', NULL, NULL, 0,  0, datetime('now'), datetime('now')),
  ('phase_brief_review', 'BRIEF_REVIEW',          'Brief Review',         '#a78bfa', 1,    2,    1,  0, datetime('now'), datetime('now')),
  ('phase_kickoff',      'KICKOFF',               'Kickoff',              '#8b5cf6', 1,    1,    2,  0, datetime('now'), datetime('now')),
  ('phase_brainstorm',   'BRAINSTORM',            'Brainstorm',           '#6366f1', 2,    2,    3,  0, datetime('now'), datetime('now')),
  ('phase_creative_dev', 'CREATIVE_DEVELOPMENT',  'Creative Development', '#3b82f6', 3,    5,    4,  0, datetime('now'), datetime('now')),
  ('phase_creative_rev', 'CREATIVE_REVIEW',       'Creative Review',      '#0ea5e9', 1,    2,    5,  1, datetime('now'), datetime('now')),
  ('phase_sh_review',    'SH_REVIEW',             'SH Review',            '#f59e0b', 1,    2,    6,  1, datetime('now'), datetime('now')),
  ('phase_refinement',   'CREATIVE_REFINEMENT',   'Creative Refinement',  '#f97316', 3,    3,    7,  0, datetime('now'), datetime('now')),
  ('phase_asset_final',  'ASSET_FINALIZATION',    'Asset Finalization',   '#10b981', 2,    2,    8,  0, datetime('now'), datetime('now')),
  ('phase_build',        'BUILD',                 'Build',                '#14b8a6', 3,    3,    9,  0, datetime('now'), datetime('now')),
  ('phase_localization', 'LOCALIZATION',          'Localization',         '#ec4899', 3,    NULL, 10, 0, datetime('now'), datetime('now'));
