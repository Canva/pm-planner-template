PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                    TEXT PRIMARY KEY NOT NULL,
    "checksum"              TEXT NOT NULL,
    "finished_at"           DATETIME,
    "migration_name"        TEXT NOT NULL,
    "logs"                  TEXT,
    "rolled_back_at"        DATETIME,
    "started_at"            DATETIME NOT NULL DEFAULT current_timestamp,
    "applied_steps_count"   INTEGER UNSIGNED NOT NULL DEFAULT 0
);
INSERT INTO _prisma_migrations VALUES('990a3362-c4b8-404d-bd14-4c61a2f060dd','5a38b1b7f1d431f77ed7350144ce3594b0157a82eeb06a6688073ecd194d3c7c',1786581450338,'20260806011635_init',NULL,NULL,1786581449957,1);
INSERT INTO _prisma_migrations VALUES('8888c6e7-a6fd-46cf-b0a9-c6cf969944b7','7904cf7c6ef108afa27182bd1bbfda334fb6dff9fb24fde85e6cd09439df39ad',1786581450405,'20260811010000_configurable_brief_types',NULL,NULL,1786581450349,1);
CREATE TABLE IF NOT EXISTS "TeamMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'COPYWRITER',
    "weeklyCapacity" REAL NOT NULL DEFAULT 40.0,
    "workingDays" JSONB NOT NULL DEFAULT ["Mon","Tue","Wed","Thu","Fri"],
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "GeneralTodo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamMemberId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "dueDate" DATETIME,
    "url" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GeneralTodo_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "GeneralTodoSubtask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "todoId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GeneralTodoSubtask_todoId_fkey" FOREIGN KEY ("todoId") REFERENCES "GeneralTodo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Squad" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "SquadMember" (
    "squadId" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,

    PRIMARY KEY ("squadId", "teamMemberId"),
    CONSTRAINT "SquadMember_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "Squad" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SquadMember_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Leave" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamMemberId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "reason" TEXT,
    "isHalfDay" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Leave_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mondayItemId" TEXT,
    "mondayBoardId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INTAKE',
    "effort" INTEGER NOT NULL DEFAULT 2,
    "workType" TEXT NOT NULL DEFAULT 'TASK',
    "startDate" DATETIME,
    "dueDate" DATETIME,
    "deadline" DATETIME,
    "mondayLink" TEXT,
    "briefLink" TEXT,
    "figmaLink" TEXT,
    "iconikLink" TEXT,
    "slackThreadLink" TEXT,
    "internalSlackLink" TEXT,
    "customLinks" JSONB,
    "mondayUpdates" JSONB,
    "notes" TEXT,
    "catNumber" TEXT,
    "channel" TEXT,
    "stakeholder" TEXT,
    "opsLead" TEXT,
    "priorityLevel" TEXT,
    "urgency" TEXT,
    "isInIntake" BOOLEAN NOT NULL DEFAULT true,
    "currentPhaseType" TEXT,
    "hasBuild" BOOLEAN NOT NULL DEFAULT false,
    "hasLocalization" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "Assignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,
    "phaseId" TEXT,
    "startDate" DATETIME NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "durationDays" REAL NOT NULL DEFAULT 1.0,
    "durationType" TEXT NOT NULL DEFAULT 'FULL_DAY',
    "capacityUnits" REAL NOT NULL DEFAULT 1.0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Assignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Assignment_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "TempAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "durationType" TEXT NOT NULL DEFAULT 'FULL_DAY',
    "capacityUnits" REAL NOT NULL DEFAULT 1.0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TempAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "NextStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" DATETIME,
    "dueDate" DATETIME,
    "durationType" TEXT NOT NULL DEFAULT 'FULL_DAY',
    "assignedToId" TEXT,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "url" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NextStep_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NextStep_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "TeamMember" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "NextStepChecklistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nextStepId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "url" TEXT,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NextStepChecklistItem_nextStepId_fkey" FOREIGN KEY ("nextStepId") REFERENCES "NextStep" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "taskId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentSlack" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "SlackTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appTitle" TEXT NOT NULL DEFAULT 'Lifecycle Planner',
    "mondayBoardId" TEXT,
    "mondayApiToken" TEXT,
    "slackWebhookUrl" TEXT,
    "slackBotToken" TEXT,
    "slackChannelId" TEXT,
    "maxActiveProjectsPerWeek" INTEGER NOT NULL DEFAULT 2,
    "weeklyCapacityDefault" REAL NOT NULL DEFAULT 40.0,
    "weeklyHoursCapacity" INTEGER NOT NULL DEFAULT 40,
    "notifEmail" BOOLEAN NOT NULL DEFAULT false,
    "notifSlack" BOOLEAN NOT NULL DEFAULT false,
    "notifOnIntake" BOOLEAN NOT NULL DEFAULT true,
    "notifOnOverdue" BOOLEAN NOT NULL DEFAULT true,
    "notifOnAtRisk" BOOLEAN NOT NULL DEFAULT true,
    "notifOnCapacity" BOOLEAN NOT NULL DEFAULT true,
    "notifOnAssigned" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO AppSettings VALUES('cmsqsmhic0000ghyucnspqpfp','Growth Planner',NULL,NULL,NULL,NULL,NULL,2,5.0,40,0,0,1,1,1,1,1,'2026-08-13T00:41:54.468+00:00');
CREATE TABLE IF NOT EXISTS "Automation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggerType" TEXT NOT NULL,
    "triggerValue" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "TaskPhase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "notes" TEXT,
    "roundTag" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "amPm" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TaskPhase_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "AutomationStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "automationId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "durationType" TEXT NOT NULL DEFAULT 'FULL_DAY',
    "assignedToId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "AutomationStep_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "AutomationSubtask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stepId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "AutomationSubtask_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "AutomationStep" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "UserAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "teamMemberId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "brainDumpContent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL, "passwordHash" TEXT,
    CONSTRAINT "UserAccount_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO UserAccount VALUES('6cbf64c0-618f-4dbc-9adc-cac117fc6a5e','Ellaine Llave','marieaellaine@canva.com','ADMIN',NULL,1,NULL,'2026-08-13T00:39:05.430Z','2026-08-13T00:39:05.430Z',NULL);
CREATE TABLE IF NOT EXISTS "Holiday" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "endDate" DATETIME,
    "type" TEXT NOT NULL DEFAULT 'PUBLIC',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "PhaseConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "estMin" INTEGER,
    "estMax" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "supportsRoundTag" BOOLEAN NOT NULL DEFAULT false,
    "capacityHoursPerDay" REAL NOT NULL DEFAULT 4,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO PhaseConfig VALUES('phase_intake','INTAKE','Intake','#94a3b8',NULL,NULL,0,0,4.0,'2026-08-13 00:39:05','2026-08-13 00:39:05');
INSERT INTO PhaseConfig VALUES('phase_brief_review','BRIEF_REVIEW','Brief Review','#a78bfa',1,2,1,0,4.0,'2026-08-13 00:39:05','2026-08-13 00:39:05');
INSERT INTO PhaseConfig VALUES('phase_kickoff','KICKOFF','Kickoff','#8b5cf6',1,1,2,0,4.0,'2026-08-13 00:39:05','2026-08-13 00:39:05');
INSERT INTO PhaseConfig VALUES('phase_brainstorm','BRAINSTORM','Brainstorm','#6366f1',2,2,3,0,4.0,'2026-08-13 00:39:05','2026-08-13 00:39:05');
INSERT INTO PhaseConfig VALUES('phase_creative_dev','CREATIVE_DEVELOPMENT','Creative Development','#3b82f6',3,5,4,0,4.0,'2026-08-13 00:39:05','2026-08-13 00:39:05');
INSERT INTO PhaseConfig VALUES('phase_creative_rev','CREATIVE_REVIEW','Creative Review','#0ea5e9',1,2,5,1,4.0,'2026-08-13 00:39:05','2026-08-13 00:39:05');
INSERT INTO PhaseConfig VALUES('phase_sh_review','SH_REVIEW','SH Review','#f59e0b',1,2,6,1,4.0,'2026-08-13 00:39:05','2026-08-13 00:39:05');
INSERT INTO PhaseConfig VALUES('phase_refinement','CREATIVE_REFINEMENT','Creative Refinement','#f97316',3,3,7,0,4.0,'2026-08-13 00:39:05','2026-08-13 00:39:05');
INSERT INTO PhaseConfig VALUES('phase_asset_final','ASSET_FINALIZATION','Asset Finalization','#10b981',2,2,8,0,4.0,'2026-08-13 00:39:05','2026-08-13 00:39:05');
INSERT INTO PhaseConfig VALUES('phase_build','BUILD','Build','#14b8a6',3,3,9,0,4.0,'2026-08-13 00:39:05','2026-08-13 00:39:05');
INSERT INTO PhaseConfig VALUES('phase_localization','LOCALIZATION','Localization','#ec4899',3,NULL,10,0,4.0,'2026-08-13 00:39:05','2026-08-13 00:39:05');
CREATE TABLE IF NOT EXISTS "WorkTypeConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO WorkTypeConfig VALUES('wt_strategic','STRATEGIC','Strategic','#6366f1',0,'2026-08-13 00:39:05','2026-08-13 00:39:05');
INSERT INTO WorkTypeConfig VALUES('wt_task','TASK','Task','#f59e0b',1,'2026-08-13 00:39:05','2026-08-13 00:39:05');
INSERT INTO WorkTypeConfig VALUES('wt_bau','BAU','BAU','#10b981',2,'2026-08-13 00:39:05','2026-08-13 00:39:05');
INSERT INTO WorkTypeConfig VALUES('wt_micro','MICRO','Micro','#06b6d4',3,'2026-08-13 00:39:05','2026-08-13 00:39:05');
CREATE UNIQUE INDEX "TeamMember_email_key" ON "TeamMember"("email");
CREATE UNIQUE INDEX "Task_mondayItemId_key" ON "Task"("mondayItemId");
CREATE UNIQUE INDEX "Assignment_taskId_teamMemberId_key" ON "Assignment"("taskId", "teamMemberId");
CREATE UNIQUE INDEX "SlackTemplate_key_key" ON "SlackTemplate"("key");
CREATE UNIQUE INDEX "UserAccount_email_key" ON "UserAccount"("email");
CREATE UNIQUE INDEX "UserAccount_teamMemberId_key" ON "UserAccount"("teamMemberId");
CREATE UNIQUE INDEX "PhaseConfig_key_key" ON "PhaseConfig"("key");
CREATE UNIQUE INDEX "WorkTypeConfig_key_key" ON "WorkTypeConfig"("key");
COMMIT;
