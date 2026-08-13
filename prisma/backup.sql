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
INSERT INTO TeamMember VALUES('cmsqzmdyv0003tiyu1w2auvqk','Kyla Baltazar','kyla@canva.com','Brand Designer',5.0,'["Mon","Tue","Wed","Thu","Fri"]',NULL,1,'2026-08-13T03:57:47.191+00:00','2026-08-13T03:57:47.191+00:00');
INSERT INTO TeamMember VALUES('cmsqzmxjw0004tiyua1x6cn0b','Arvic Alvarez','arvic@canva.com','Brand Designer',5.0,'["Mon","Tue","Wed","Thu","Fri"]',NULL,1,'2026-08-13T03:58:12.572+00:00','2026-08-13T03:58:12.572+00:00');
INSERT INTO TeamMember VALUES('cmsqznjsy0005tiyuig4j2cpf','Kitkat Lastimosa','kitkat@canva.com','Brand Designer',5.0,'["Mon","Tue","Wed","Thu","Fri"]',NULL,1,'2026-08-13T03:58:41.410+00:00','2026-08-13T03:58:41.410+00:00');
INSERT INTO TeamMember VALUES('cmsqzo4kk0006tiyuqyechuk0','Steph Whitehouse','stephw@canva.com','Art Director',5.0,'["Mon","Tue","Wed","Thu","Fri"]',NULL,1,'2026-08-13T03:59:08.324+00:00','2026-08-13T03:59:08.324+00:00');
INSERT INTO TeamMember VALUES('cmsqzooho0007tiyuz87yxv7l','Andy Enriquez','andye@canva.com','Copywriter',5.0,'["Mon","Tue","Wed","Thu","Fri"]',NULL,1,'2026-08-13T03:59:34.140+00:00','2026-08-13T03:59:34.140+00:00');
INSERT INTO TeamMember VALUES('cmsqzp3180008tiyuvicvcspv','Vinny Lamorena','vlamorena@canva.com','Copywriter',5.0,'["Mon","Tue","Wed","Thu","Fri"]',NULL,1,'2026-08-13T03:59:52.988+00:00','2026-08-13T03:59:52.988+00:00');
INSERT INTO TeamMember VALUES('cmsqzpph40009tiyuk7qz0x3u','Christian Love','christianlove@canva.com','Videographer',5.0,'["Mon","Tue","Wed","Thu","Fri"]',NULL,1,'2026-08-13T04:00:22.072+00:00','2026-08-13T04:00:22.072+00:00');
INSERT INTO TeamMember VALUES('cmsqzqbq5000atiyuadkrcbu1','Lydia Proudlove','proudlove@canva.com','Videographer',5.0,'["Mon","Tue","Wed","Thu","Fri"]',NULL,1,'2026-08-13T04:00:50.909+00:00','2026-08-13T04:00:50.909+00:00');
INSERT INTO TeamMember VALUES('cmsr0gxpl000btiyuw6t4t7bd','Jess Holmes','jessh@canva.com','Videographer',5.0,'["Mon","Tue","Wed","Thu","Fri"]',NULL,1,'2026-08-13T04:21:32.457+00:00','2026-08-13T04:21:32.457+00:00');
INSERT INTO TeamMember VALUES('cmsr0hlfv000ctiyuwo47tgeo','Jess Edwards','jess.e@canva.com','Videographer',5.0,'["Mon","Tue","Wed","Thu","Fri"]',NULL,1,'2026-08-13T04:22:03.211+00:00','2026-08-13T04:22:03.211+00:00');
INSERT INTO TeamMember VALUES('cmsr0iegh000dtiyumgs0y2xc','Sean Pointing','seanp@canva.com','Motion Designer',5.0,'["Mon","Tue","Wed","Thu","Fri"]',NULL,1,'2026-08-13T04:22:40.817+00:00','2026-08-13T04:22:40.817+00:00');
INSERT INTO TeamMember VALUES('cmsr0iucr000etiyuo6lxfy7z','Kristen Uy','kristen.u@canva.com','Motion Designer',5.0,'["Mon","Tue","Wed","Thu","Fri"]',NULL,1,'2026-08-13T04:23:01.419+00:00','2026-08-13T04:23:01.419+00:00');
INSERT INTO TeamMember VALUES('cmsr0j9f8000ftiyujl6ma1zz','Lyra Bertulfo','lyrscb@canva.com','Motion Designer',5.0,'["Mon","Tue","Wed","Thu","Fri"]',NULL,1,'2026-08-13T04:23:20.948+00:00','2026-08-13T04:23:20.948+00:00');
INSERT INTO TeamMember VALUES('cmsr0joac000gtiyu0m5wztt5','Kat Agapito','katagapito@canva.com','Motion Designer',5.0,'["Mon","Tue","Wed","Thu","Fri"]',NULL,1,'2026-08-13T04:23:40.212+00:00','2026-08-13T04:23:40.212+00:00');
INSERT INTO TeamMember VALUES('cmsr0kvz6000htiyu06tyv0f8','Judea Bartolome','mbartolome@canva.com','Graphic Designer',5.0,'["Mon","Tue","Wed","Thu","Fri"]',NULL,1,'2026-08-13T04:24:36.834+00:00','2026-08-13T04:24:36.834+00:00');
INSERT INTO TeamMember VALUES('cmsr0lacp000itiyuift9otk3','Simon Jackson','simonj@canva.com','Creative Director',5.0,'["Mon","Tue","Wed","Thu","Fri"]',NULL,1,'2026-08-13T04:24:55.465+00:00','2026-08-13T04:24:55.465+00:00');
INSERT INTO TeamMember VALUES('cmsr0lrp6000jtiyuhwaqeghm','Gina Talboys','gtalboys@canva.com','Creative Ops',5.0,'["Mon","Tue","Wed","Thu","Fri"]',NULL,1,'2026-08-13T04:25:17.946+00:00','2026-08-13T04:25:17.946+00:00');
INSERT INTO TeamMember VALUES('cmsr0m2z9000ktiyuba7vf5hq','Ellaine Llave','marieaellaine@canva.com','Creative Ops',5.0,'["Mon","Tue","Wed","Thu","Fri"]',NULL,1,'2026-08-13T04:25:32.565+00:00','2026-08-13T04:25:32.565+00:00');
INSERT INTO TeamMember VALUES('cmsr0miw1000ltiyuv55c1kif','Lex Nocheseda','lexnoche@canva.com','Content Admin',5.0,'["Mon","Tue","Wed","Thu","Fri"]',NULL,1,'2026-08-13T04:25:53.185+00:00','2026-08-13T04:25:53.185+00:00');
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
INSERT INTO Task VALUES('cmsr2fwe4000wtiyu2li4ecio',NULL,NULL,'Q3 2026 GAC/PMAX Evergreen','Batch 1','DONE',2,'CHANNEL_SPECIFIC','2026-07-31T00:00:00.000+00:00','2026-08-12T00:00:00.000+00:00','2026-08-12T00:00:00.000+00:00','https://canva-group.monday.com/boards/9599240736/pulses/12720765383',NULL,NULL,'https://icnk.io/u/7s86CnrJPqEv/',NULL,NULL,'[{"name":"Working Deck","url":"https://canva.link/f196jha3a1yim6f"},{"name":"Rollout Deck","url":"https://canva.link/2bqib2m90bx0b4s"},{"name":"Lucidlink","url":"https://app.lucidlink.com/l/1/ZmI4OGQ2ZWItYTViZC00NjFhLWJhOGEtYTkxZjM2MTM1ZTRkL2NjNTU2ODg2LWU4YTQtNDdmZC1hZTg0LTRkNjk2OTVkNTg3OS8xNjE6MTkwODIyLzQ2NTo0MTgzNg/AQAAAAAAAABEHIn2mw7WBSCDQDneCfh4wv6U3LHIHc2JsIo0ClA"},{"name":"GAC Brief","url":"https://www.canva.com/design/DAXOwkrvT7w/XDCAz_lCPRSPDCb2LypCig/edit"},{"name":"PMAX Brief","url":"https://www.canva.com/design/DAXOwhTpYPQ/RgsfU7iss3_bkXEEL84UDw/edit"}]',NULL,NULL,'GRMA26068','GAC/PMAX','Liz Mofu',NULL,'P2 - Important, Flexible','FIXED',0,NULL,0,0,'2026-08-13T05:16:43.324+00:00','2026-08-13T05:56:55.964+00:00');
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
INSERT INTO Assignment VALUES('cmsr3pli90016tiyuq3ceatnv','cmsr2fwe4000wtiyu2li4ecio','cmsqzp3180008tiyuvicvcspv','["cmsr3jfma000ytiyu9pp0h46j"]','2026-07-31T00:00:00.000+00:00','2026-07-31T00:00:00.000+00:00',1.0,'TWO_HOURS',0.25,NULL,'2026-08-13T05:52:15.393+00:00','2026-08-13T05:52:15.393+00:00');
INSERT INTO Assignment VALUES('cmsr3plit0017tiyuegy5r3n5','cmsr2fwe4000wtiyu2li4ecio','cmsr0lacp000itiyuift9otk3','["cmsr3jfma000ytiyu9pp0h46j"]','2026-07-31T00:00:00.000+00:00','2026-07-31T00:00:00.000+00:00',1.0,'TWO_HOURS',0.25,NULL,'2026-08-13T05:52:15.413+00:00','2026-08-13T05:52:15.413+00:00');
INSERT INTO Assignment VALUES('cmsr3pljd0018tiyu0hs6b1l9','cmsr2fwe4000wtiyu2li4ecio','cmsqzooho0007tiyuz87yxv7l','["cmsr3jfma000ytiyu9pp0h46j"]','2026-07-31T00:00:00.000+00:00','2026-07-31T00:00:00.000+00:00',1.0,'TWO_HOURS',0.25,NULL,'2026-08-13T05:52:15.433+00:00','2026-08-13T05:52:15.433+00:00');
INSERT INTO Assignment VALUES('cmsr3pljw0019tiyujnp904ac','cmsr2fwe4000wtiyu2li4ecio','cmsr0m2z9000ktiyuba7vf5hq','["cmsr3jfma000ytiyu9pp0h46j"]','2026-07-31T00:00:00.000+00:00','2026-07-31T00:00:00.000+00:00',1.0,'TWO_HOURS',0.25,NULL,'2026-08-13T05:52:15.452+00:00','2026-08-13T05:52:15.452+00:00');
INSERT INTO Assignment VALUES('cmsr3plkh001atiyus5szl4cu','cmsr2fwe4000wtiyu2li4ecio','cmsr0kvz6000htiyu06tyv0f8','["cmsr3jfma000ytiyu9pp0h46j"]','2026-07-31T00:00:00.000+00:00','2026-07-31T00:00:00.000+00:00',1.0,'TWO_HOURS',0.25,NULL,'2026-08-13T05:52:15.473+00:00','2026-08-13T05:52:15.473+00:00');
INSERT INTO Assignment VALUES('cmsr3pll0001btiyuaw6n7b7z','cmsr2fwe4000wtiyu2li4ecio','cmsr0iucr000etiyuo6lxfy7z','["cmsr3jfma000ytiyu9pp0h46j"]','2026-07-31T00:00:00.000+00:00','2026-07-31T00:00:00.000+00:00',1.0,'TWO_HOURS',0.25,NULL,'2026-08-13T05:52:15.492+00:00','2026-08-13T05:52:15.492+00:00');
INSERT INTO Assignment VALUES('cmsr3pllk001ctiyudadcw9fz','cmsr2fwe4000wtiyu2li4ecio','cmsr0joac000gtiyu0m5wztt5','["cmsr3jfma000ytiyu9pp0h46j"]','2026-07-31T00:00:00.000+00:00','2026-07-31T00:00:00.000+00:00',1.0,'TWO_HOURS',0.25,NULL,'2026-08-13T05:52:15.512+00:00','2026-08-13T05:52:15.512+00:00');
INSERT INTO Assignment VALUES('cmsr3plm4001dtiyu8f5tjfc6','cmsr2fwe4000wtiyu2li4ecio','cmsqznjsy0005tiyuig4j2cpf','["cmsr3jfma000ytiyu9pp0h46j"]','2026-07-31T00:00:00.000+00:00','2026-07-31T00:00:00.000+00:00',1.0,'TWO_HOURS',0.25,NULL,'2026-08-13T05:52:15.532+00:00','2026-08-13T05:52:15.532+00:00');
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
INSERT INTO Notification VALUES('cmsr2fweg000xtiyupp60cdp5','NEW_INTAKE','New intake task','"Q3 2026 GAC/PMAX Evergreen" has been added to the intake queue','cmsr2fwe4000wtiyu2li4ecio',0,0,'2026-08-13T05:16:43.336+00:00');
CREATE TABLE IF NOT EXISTS "SlackTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO SlackTemplate VALUES('cmsqt56770000tiyu7hg3o10y','brief-internal','New Brief Internal',replace(':thread: *Brief*\n*Creatives/* :brand-copywriting:  :brand-design:  :localisation: :canva-in-review: *Owner/*\n> :monday: Ticket\n:docs: Brief\n:slack: SH thread','\n',char(10)),'2026-08-13T00:56:26.275+00:00','2026-08-13T00:56:26.275+00:00');
INSERT INTO SlackTemplate VALUES('cmsqt567j0001tiyukwtaud0k','brief-sh','New Brief SH',replace(':thread: *Brief*\n\n*Creatives/* :brand-copywriting:  :brand-design:  :localisation: :canva-in-review: *Owner/*\n\n> :monday: Ticket\n\n:docs: Brief\n\n:slack: Marketer thread','\n',char(10)),'2026-08-13T00:56:26.287+00:00','2026-08-13T00:56:26.287+00:00');
INSERT INTO SlackTemplate VALUES('cmsqt567v0002tiyun7h2m12l','monday-summary','Monday Summary',replace('📅 Week of [date]\n\nTeam\n\nActive briefs: 0','\n',char(10)),'2026-08-13T00:56:26.299+00:00','2026-08-13T00:56:26.299+00:00');
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
INSERT INTO TaskPhase VALUES('cmsr3jfma000ytiyu9pp0h46j','cmsr2fwe4000wtiyu2li4ecio','KICKOFF','NOT_STARTED','2026-07-31T00:00:00.000+00:00','2026-07-31T00:00:00.000+00:00',NULL,NULL,2,NULL,'2026-08-13T05:47:27.826+00:00','2026-08-13T05:47:27.826+00:00');
INSERT INTO TaskPhase VALUES('cmsr3jyjn000ztiyum273pqgf','cmsr2fwe4000wtiyu2li4ecio','CREATIVE_DEVELOPMENT','NOT_STARTED','2026-08-03T00:00:00.000+00:00','2026-08-06T00:00:00.000+00:00',NULL,NULL,4,NULL,'2026-08-13T05:47:52.355+00:00','2026-08-13T05:47:52.355+00:00');
INSERT INTO TaskPhase VALUES('cmsr3ljgu0011tiyuyyk7dsel','cmsr2fwe4000wtiyu2li4ecio','CD_REVIEW_WIPS','NOT_STARTED','2026-08-06T00:00:00.000+00:00','2026-08-06T00:00:00.000+00:00',NULL,NULL,99,NULL,'2026-08-13T05:49:06.126+00:00','2026-08-13T05:49:06.126+00:00');
INSERT INTO TaskPhase VALUES('cmsr3lz2t0012tiyuu43o8ez9','cmsr2fwe4000wtiyu2li4ecio','CREATIVE_REFINEMENT','NOT_STARTED','2026-08-07T00:00:00.000+00:00','2026-08-10T00:00:00.000+00:00',NULL,NULL,7,NULL,'2026-08-13T05:49:26.357+00:00','2026-08-13T05:49:26.357+00:00');
INSERT INTO TaskPhase VALUES('cmsr3mbm90013tiyu4r9exzkq','cmsr2fwe4000wtiyu2li4ecio','PERMAR_REVIEW_WIPS','NOT_STARTED','2026-08-11T00:00:00.000+00:00','2026-08-11T00:00:00.000+00:00',NULL,NULL,100,'PM','2026-08-13T05:49:42.609+00:00','2026-08-13T05:56:08.053+00:00');
INSERT INTO TaskPhase VALUES('cmsr3mrh20014tiyu52jyhdtx','cmsr2fwe4000wtiyu2li4ecio','ASSET_FINALIZATION','NOT_STARTED','2026-08-11T00:00:00.000+00:00','2026-08-12T00:00:00.000+00:00',NULL,NULL,8,NULL,'2026-08-13T05:50:03.158+00:00','2026-08-13T05:50:03.158+00:00');
INSERT INTO TaskPhase VALUES('cmsr3mw440015tiyu02dvpwgi','cmsr2fwe4000wtiyu2li4ecio','DISPATCH','NOT_STARTED','2026-08-12T00:00:00.000+00:00','2026-08-12T00:00:00.000+00:00',NULL,NULL,101,NULL,'2026-08-13T05:50:09.172+00:00','2026-08-13T05:50:09.172+00:00');
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
INSERT INTO PhaseConfig VALUES('phase_brief_review','BRIEF_REVIEW','Brief Review','#feffd1',1,2,1,0,4.0,'2026-08-13 00:39:05','2026-08-13T04:42:55.954+00:00');
INSERT INTO PhaseConfig VALUES('phase_kickoff','KICKOFF','Kickoff','#e2dc3c',1,1,2,0,1.0,'2026-08-13 00:39:05','2026-08-13T05:52:34.928+00:00');
INSERT INTO PhaseConfig VALUES('phase_brainstorm','BRAINSTORM','Brainstorm','#ffbd80',2,2,3,0,4.0,'2026-08-13 00:39:05','2026-08-13T04:43:07.894+00:00');
INSERT INTO PhaseConfig VALUES('phase_creative_dev','CREATIVE_DEVELOPMENT','Creative Development','#ff8b1f',3,5,4,0,-1.0,'2026-08-13 00:39:05','2026-08-13T04:43:19.784+00:00');
INSERT INTO PhaseConfig VALUES('phase_creative_rev','CREATIVE_REVIEW','CD Review (Concepts)','#ffb8de',1,2,6,1,4.0,'2026-08-13 00:39:05','2026-08-13T04:43:45.222+00:00');
INSERT INTO PhaseConfig VALUES('phase_sh_review','SH_REVIEW','PerMar Review (Concepts)','#ff8abd',1,2,7,1,8.0,'2026-08-13 00:39:05','2026-08-13T04:43:56.218+00:00');
INSERT INTO PhaseConfig VALUES('phase_refinement','CREATIVE_REFINEMENT','Creative Refinement','#c061ff',3,3,9,0,-1.0,'2026-08-13 00:39:05','2026-08-13T04:44:26.601+00:00');
INSERT INTO PhaseConfig VALUES('phase_asset_final','ASSET_FINALIZATION','Asset Finalization and Exports','#94ffcd',2,2,13,0,-1.0,'2026-08-13 00:39:05','2026-08-13T04:45:22.289+00:00');
INSERT INTO PhaseConfig VALUES('cmsr0pyzh000mtiyu45q3tw03','DANA_REVIEW','Dana Review  (Concepts)','#ff5ce1',1,2,8,1,8.0,'2026-08-13T04:28:34.013+00:00','2026-08-13T04:44:10.057+00:00');
INSERT INTO PhaseConfig VALUES('cmsr0r3q7000ntiyui7drw86y','SHOOT_DAY','Shoot Day','#ff471a',NULL,NULL,5,0,8.0,'2026-08-13T04:29:26.815+00:00','2026-08-13T04:43:32.604+00:00');
INSERT INTO PhaseConfig VALUES('cmsr123hl000otiyu2d364v97','CD_REVIEW_WIPS','CD Review (WIPs)','#add5ff',1,NULL,10,1,4.0,'2026-08-13T04:37:59.721+00:00','2026-08-13T04:44:41.371+00:00');
INSERT INTO PhaseConfig VALUES('cmsr12nx9000ptiyubm4xvljv','PERMAR_REVIEW_WIPS','PerMar Review (WIPs)','#6678ff',1,NULL,11,1,8.0,'2026-08-13T04:38:26.205+00:00','2026-08-13T04:44:56.374+00:00');
INSERT INTO PhaseConfig VALUES('cmsr12wcy000qtiyuz8ij2nb2','DANA_REVIEW_WIPS','Dana Review (WIPs)','#0004ff',1,2,12,1,8.0,'2026-08-13T04:38:37.138+00:00','2026-08-13T04:45:03.694+00:00');
INSERT INTO PhaseConfig VALUES('cmsr16lhl000rtiyu1kvad273','DISPATCH','Dispatch','#41ef34',NULL,NULL,14,0,4.0,'2026-08-13T04:41:29.673+00:00','2026-08-13T04:45:44.008+00:00');
INSERT INTO PhaseConfig VALUES('cmsr16vi3000stiyua6e75xpm','ASSET_UPLOADING','Asset Uploading','#43b66c',1,2,15,0,8.0,'2026-08-13T04:41:42.651+00:00','2026-08-13T04:46:00.569+00:00');
CREATE TABLE IF NOT EXISTS "WorkTypeConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO WorkTypeConfig VALUES('wt_bau','BAU','BAU','#10b981',2,'2026-08-13 00:39:05','2026-08-13 00:39:05');
INSERT INTO WorkTypeConfig VALUES('cmsr1fgn8000ttiyudhx1vmta','ADHOC','Adhoc','#f2ed64',3,'2026-08-13T04:48:23.300+00:00','2026-08-13T04:48:23.300+00:00');
INSERT INTO WorkTypeConfig VALUES('cmsr1fpen000utiyukug4muor','CAMPAIGN','Campaign','#f41515',4,'2026-08-13T04:48:34.655+00:00','2026-08-13T04:48:34.655+00:00');
INSERT INTO WorkTypeConfig VALUES('cmsr1g8f9000vtiyu9qg30sav','CHANNEL_SPECIFIC','Channel-specific','#6366f1',5,'2026-08-13T04:48:59.301+00:00','2026-08-13T04:48:59.301+00:00');
CREATE UNIQUE INDEX "TeamMember_email_key" ON "TeamMember"("email");
CREATE UNIQUE INDEX "Task_mondayItemId_key" ON "Task"("mondayItemId");
CREATE UNIQUE INDEX "Assignment_taskId_teamMemberId_key" ON "Assignment"("taskId", "teamMemberId");
CREATE UNIQUE INDEX "SlackTemplate_key_key" ON "SlackTemplate"("key");
CREATE UNIQUE INDEX "UserAccount_email_key" ON "UserAccount"("email");
CREATE UNIQUE INDEX "UserAccount_teamMemberId_key" ON "UserAccount"("teamMemberId");
CREATE UNIQUE INDEX "PhaseConfig_key_key" ON "PhaseConfig"("key");
CREATE UNIQUE INDEX "WorkTypeConfig_key_key" ON "WorkTypeConfig"("key");
COMMIT;
