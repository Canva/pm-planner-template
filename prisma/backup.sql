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
INSERT INTO Leave VALUES('cmsr4s4n8txblyu5','cmsr0joac000gtiyu0m5wztt5','2026-08-13T00:00:00.000+00:00','2026-08-17T00:00:00.000+00:00',NULL,0,'2026-08-13T06:22:13.124+00:00');
INSERT INTO Leave VALUES('cmsr4shh20iilpuo','cmsr0m2z9000ktiyuba7vf5hq','2026-08-14T00:00:00.000+00:00','2026-08-14T00:00:00.000+00:00',NULL,0,'2026-08-13T06:22:29.750+00:00');
INSERT INTO Leave VALUES('cmsr4spk2ls9x23n','cmsqzp3180008tiyuvicvcspv','2026-08-14T00:00:00.000+00:00','2026-08-14T00:00:00.000+00:00',NULL,0,'2026-08-13T06:22:40.226+00:00');
INSERT INTO Leave VALUES('cmsr4t51viia5y0i','cmsr0joac000gtiyu0m5wztt5','2026-08-24T00:00:00.000+00:00','2026-08-28T00:00:00.000+00:00',NULL,0,'2026-08-13T06:23:00.307+00:00');
INSERT INTO Leave VALUES('cmsr4thy94ktkki0','cmsqznjsy0005tiyuig4j2cpf','2026-08-28T00:00:00.000+00:00','2026-09-02T00:00:00.000+00:00',NULL,0,'2026-08-13T06:23:17.025+00:00');
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
INSERT INTO Task VALUES('cmsr2fwe4000wtiyu2li4ecio',NULL,NULL,'Q3 2026 GAC/PMAX Evergreen (Batch 1)',NULL,'DONE',2,'CHANNEL_SPECIFIC','2026-07-31T00:00:00.000+00:00','2026-08-12T00:00:00.000+00:00','2026-08-12T00:00:00.000+00:00','https://canva-group.monday.com/boards/9599240736/pulses/12720765383',NULL,NULL,'https://icnk.io/u/7s86CnrJPqEv/',NULL,NULL,'[{"name":"Working Deck","url":"https://canva.link/f196jha3a1yim6f"},{"name":"Rollout Deck","url":"https://canva.link/2bqib2m90bx0b4s"},{"name":"Lucidlink","url":"https://app.lucidlink.com/l/1/ZmI4OGQ2ZWItYTViZC00NjFhLWJhOGEtYTkxZjM2MTM1ZTRkL2NjNTU2ODg2LWU4YTQtNDdmZC1hZTg0LTRkNjk2OTVkNTg3OS8xNjE6MTkwODIyLzQ2NTo0MTgzNg/AQAAAAAAAABEHIn2mw7WBSCDQDneCfh4wv6U3LHIHc2JsIo0ClA"},{"name":"GAC Brief","url":"https://www.canva.com/design/DAXOwkrvT7w/XDCAz_lCPRSPDCb2LypCig/edit"},{"name":"PMAX Brief","url":"https://www.canva.com/design/DAXOwhTpYPQ/RgsfU7iss3_bkXEEL84UDw/edit"}]',NULL,NULL,'GRMA26068','GAC/PMAX','Liz Mofu, Natalie Reid',NULL,'P2 - Important, Flexible','FIXED',0,NULL,0,0,'2026-08-13T05:16:43.324+00:00','2026-08-13T07:03:48.162+00:00');
INSERT INTO Task VALUES('cmsr4zf6q001ktiyu3fnwbjfi',NULL,NULL,'Q3 2026 GAC/PMAX Evergreen (Batch 2)',NULL,'IN_PROGRESS',2,'CHANNEL_SPECIFIC','2026-08-12T00:00:00.000+00:00','2026-08-25T00:00:00.000+00:00','2026-08-24T00:00:00.000+00:00','https://canva-group.monday.com/boards/9599240736/pulses/12720786770',NULL,NULL,'https://icnk.io/u/7s86CnrJPqEv/',NULL,NULL,'[{"name":"Working Deck","url":"https://www.canva.com/design/DAXQj8fNV3Y/kudXnGWz2WsaRhWqgOYvpQ/edit?ui=eyJBIjp7fSwiRiI6e319"},{"name":"Rollout Deck","url":"https://www.canva.com/design/DAHR9VVwS1g/RRqJ4kj8JiA4AcaXnchpVg/edit"},{"name":"Lucidlink","url":"https://app.lucidlink.com/l/1/ZmI4OGQ2ZWItYTViZC00NjFhLWJhOGEtYTkxZjM2MTM1ZTRkL2NjNTU2ODg2LWU4YTQtNDdmZC1hZTg0LTRkNjk2OTVkNTg3OS8xNjE6MTkwODIyLzQ2NTo0MTgzNg/AQAAAAAAAABEHIn2mw7WBSCDQDneCfh4wv6U3LHIHc2JsIo0ClA"},{"name":"GAC Brief","url":"https://www.canva.com/design/DAXOwkrvT7w/XDCAz_lCPRSPDCb2LypCig/edit"},{"name":"PMAX Brief","url":"https://www.canva.com/design/DAXOwhTpYPQ/RgsfU7iss3_bkXEEL84UDw/edit"}]',NULL,NULL,'GRMA26068','GAC/PMAX','Liz Mofu, Natalie Reid',NULL,'P2 - Important, Flexible','FIXED',0,NULL,0,0,'2026-08-13T06:27:53.378+00:00','2026-08-13T07:28:41.661+00:00');
INSERT INTO Task VALUES('cmsr5lmmd0022tiyutjv17stj',NULL,NULL,'Q3 2026 GAC/PMAX Evergreen (Batch 3)',NULL,'INTAKE',2,'CHANNEL_SPECIFIC','2026-08-24T00:00:00.000+00:00','2026-09-03T00:00:00.000+00:00','2026-09-03T00:00:00.000+00:00','https://canva-group.monday.com/boards/9599240736/pulses/12720786770',NULL,NULL,'https://app.iconik.io/review/share/collections/2fae9c16-8a33-11f1-a4b3-1a99c240160e/gallery?hash=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzaGFyZV9pZCI6IjIwMWQyNjBhLTk2ZDYtMTFmMS1iNzljLTZlYWU0ZGQyZWNmMSIsInNoYXJlX3VzZXJfaWQiOiIyMDI0NGI2MC05NmQ2LTExZjEtYjc5Yy02ZWFlNGRkMmVjZjEiLCJleHAiOjE5NDQyNzgxODMsInN5cyI6Imljb25pay11cyJ9.UDFfim07x4-xaTLo0c7sC1c6QM1jYtnxliq8v1oP_70',NULL,NULL,'[{"name":"Working Deck","url":"https://www.canva.com/design/DAXQj8fNV3Y/kudXnGWz2WsaRhWqgOYvpQ/edit?ui=eyJBIjp7fSwiRiI6e319"},{"name":"Rollout Deck","url":"https://www.canva.com/design/DAHR9VVwS1g/RRqJ4kj8JiA4AcaXnchpVg/edit"},{"name":"Lucidlink","url":"https://app.lucidlink.com/l/1/ZmI4OGQ2ZWItYTViZC00NjFhLWJhOGEtYTkxZjM2MTM1ZTRkL2NjNTU2ODg2LWU4YTQtNDdmZC1hZTg0LTRkNjk2OTVkNTg3OS8xNjE6MTkwODIyLzQ2NTo0MTgzNg/AQAAAAAAAABEHIn2mw7WBSCDQDneCfh4wv6U3LHIHc2JsIo0ClA"},{"name":"GAC Brief","url":"https://www.canva.com/design/DAXOwkrvT7w/XDCAz_lCPRSPDCb2LypCig/edit"},{"name":"PMAX Brief","url":"https://www.canva.com/design/DAXOwhTpYPQ/RgsfU7iss3_bkXEEL84UDw/edit"}]',NULL,NULL,'GRMA26068','GAC/PMAX','Liz Mofu, Natalie Reid',NULL,'P2 - Important, Flexible','FIXED',0,'INTAKE',0,0,'2026-08-13T06:45:09.445+00:00','2026-08-14T02:11:45.125+00:00');
INSERT INTO Task VALUES('cmsr5nsxi0024tiyu1wpe6kwe',NULL,NULL,'Q3 2026 GAC/PMAX Evergreen (Batch 4)',NULL,'INTAKE',2,'CHANNEL_SPECIFIC','2026-09-03T00:00:00.000+00:00','2026-09-14T00:00:00.000+00:00','2026-09-14T00:00:00.000+00:00','https://canva-group.monday.com/boards/9599240736/pulses/12720786770',NULL,NULL,'https://app.iconik.io/review/share/?object_type=collections&object_id=2fae9c16-8a33-11f1-a4b3-1a99c240160e&hash=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzaGFyZV9pZCI6IjIwMWQyNjBhLTk2ZDYtMTFmMS1iNzljLTZlYWU0ZGQyZWNmMSIsInNoYXJlX3VzZXJfaWQiOiIyMDI0NGI2MC05NmQ2LTExZjEtYjc5Yy02ZWFlNGRkMmVjZjEiLCJleHAiOjE5NDQyNzgxODMsInN5cyI6Imljb25pay11cyJ9.UDFfim07x4-xaTLo0c7sC1c6QM1jYtnxliq8v1oP_70',NULL,NULL,'[{"name":"Working Deck","url":"https://www.canva.com/design/DAXQj8fNV3Y/kudXnGWz2WsaRhWqgOYvpQ/edit?ui=eyJBIjp7fSwiRiI6e319"},{"name":"Rollout Deck","url":"https://www.canva.com/design/DAHR9VVwS1g/RRqJ4kj8JiA4AcaXnchpVg/edit"},{"name":"Lucidlink","url":"https://app.lucidlink.com/l/1/ZmI4OGQ2ZWItYTViZC00NjFhLWJhOGEtYTkxZjM2MTM1ZTRkL2NjNTU2ODg2LWU4YTQtNDdmZC1hZTg0LTRkNjk2OTVkNTg3OS8xNjE6MTkwODIyLzQ2NTo0MTgzNg/AQAAAAAAAABEHIn2mw7WBSCDQDneCfh4wv6U3LHIHc2JsIo0ClA"},{"name":"GAC Brief","url":"https://www.canva.com/design/DAXOwkrvT7w/XDCAz_lCPRSPDCb2LypCig/edit"},{"name":"PMAX Brief","url":"https://www.canva.com/design/DAXOwhTpYPQ/RgsfU7iss3_bkXEEL84UDw/edit"}]',NULL,NULL,'GRMA26068','GAC/PMAX','Liz Mofu, Natalie Reid',NULL,'P2 - Important, Flexible','FIXED',0,'INTAKE',0,0,'2026-08-13T06:46:50.934+00:00','2026-08-14T02:11:41.595+00:00');
INSERT INTO Task VALUES('cmssbgfbz003itiyui87tpnc0',NULL,NULL,'Wave 11: SocMed Creation + Quality Visual Work',NULL,'IN_PROGRESS',2,'SPRINT','2026-08-04T00:00:00.000+00:00','2026-08-26T00:00:00.000+00:00','2026-08-24T00:00:00.000+00:00','https://canva-group.monday.com/boards/9599240736/pulses/11409282215','https://www.canva.com/design/DAXRMAO_q-o/PBg-0ocMfv91Md4sHUTKQg/edit',NULL,'https://icnk.io/u/W53JjhkCXFhZ/',NULL,'https://canva.slack.com/archives/C0A8QR99BKP/p1785892950321629','[{"name":"Working Deck","url":"https://www.canva.com/design/DAHRYO0ZCuQ/kM-yUhDQ4cTPh68mYTxtSw/edit"},{"name":"Rollout Deck","url":"https://www.canva.com/design/DAHRYIS7koc/Faju1tVRA8EZlShbl227tg/edit"},{"name":"Lucidlink","url":"https://app.lucidlink.com/l/1/ZmI4OGQ2ZWItYTViZC00NjFhLWJhOGEtYTkxZjM2MTM1ZTRkL2NjNTU2ODg2LWU4YTQtNDdmZC1hZTg0LTRkNjk2OTVkNTg3OS8xNjE6MTkwODIyLzQ0ODozMDE3Mg/AQAAAAAAAACLbjjzOoeLyrdM2YtU_zXe9Jm_5_IQGVW-rN5A-eHTJRUwZJLn0FEkcDKBwnYbl8TB2BVYcLcAEc28GCsj"}]',NULL,NULL,'GRMA26063',NULL,'Jack Delaney',NULL,'P1 - Important, Urgent','CRITICAL',0,NULL,0,0,'2026-08-14T02:16:50.591+00:00','2026-08-14T02:37:03.795+00:00');
INSERT INTO Task VALUES('cmssc96nj004dtiyuhh9rtcaa',NULL,NULL,'Wave 12: MAU/REV (Quality Visual Work + Social Media Creation - SMB/Happyfield)','','IN_PROGRESS',2,'SPRINT','2026-08-06T00:00:00.000+00:00','2026-09-10T00:00:00.000+00:00','2026-08-08T00:00:00.000+00:00','https://canva-group.monday.com/boards/9599240736/pulses/11409282475',NULL,NULL,NULL,NULL,NULL,'[]',NULL,NULL,'GRMA26065',NULL,'Jack Delaney',NULL,'P1 - Important, Urgent','CRITICAL',0,NULL,0,0,'2026-08-14T02:39:12.367+00:00','2026-08-14T02:51:45.793+00:00');
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
INSERT INTO Assignment VALUES('cmsr3pli90016tiyuq3ceatnv','cmsr2fwe4000wtiyu2li4ecio','cmsqzp3180008tiyuvicvcspv','["cmsr3jfma000ytiyu9pp0h46j","cmsr3jyjn000ztiyum273pqgf","cmsr657af0031tiyu5yqogfrx","cmsr3lz2t0012tiyuu43o8ez9","cmsr3mrh20014tiyu52jyhdtx"]','2026-07-31T00:00:00.000+00:00','2026-08-12T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-13T05:52:15.393+00:00','2026-08-13T07:01:18.027+00:00');
INSERT INTO Assignment VALUES('cmsr3plit0017tiyuegy5r3n5','cmsr2fwe4000wtiyu2li4ecio','cmsr0lacp000itiyuift9otk3','["cmsr3jfma000ytiyu9pp0h46j","cmsr3ljgu0011tiyuyyk7dsel"]','2026-07-31T00:00:00.000+00:00','2026-08-06T00:00:00.000+00:00',1.0,'TWO_HOURS',0.25,NULL,'2026-08-13T05:52:15.413+00:00','2026-08-13T07:01:18.100+00:00');
INSERT INTO Assignment VALUES('cmsr3pljd0018tiyu0hs6b1l9','cmsr2fwe4000wtiyu2li4ecio','cmsqzooho0007tiyuz87yxv7l','["cmsr3jfma000ytiyu9pp0h46j","cmsr3jyjn000ztiyum273pqgf","cmsr657af0031tiyu5yqogfrx","cmsr3lz2t0012tiyuu43o8ez9","cmsr3mrh20014tiyu52jyhdtx"]','2026-07-31T00:00:00.000+00:00','2026-08-12T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-13T05:52:15.433+00:00','2026-08-13T07:01:18.008+00:00');
INSERT INTO Assignment VALUES('cmsr3pljw0019tiyujnp904ac','cmsr2fwe4000wtiyu2li4ecio','cmsr0m2z9000ktiyuba7vf5hq','["cmsr3jfma000ytiyu9pp0h46j","cmsr3ljgu0011tiyuyyk7dsel","cmsr3mbm90013tiyu4r9exzkq","cmsr3mw440015tiyu02dvpwgi"]','2026-07-31T00:00:00.000+00:00','2026-08-12T00:00:00.000+00:00',1.0,'TWO_HOURS',0.25,NULL,'2026-08-13T05:52:15.452+00:00','2026-08-13T07:01:18.111+00:00');
INSERT INTO Assignment VALUES('cmsr3plkh001atiyus5szl4cu','cmsr2fwe4000wtiyu2li4ecio','cmsr0kvz6000htiyu06tyv0f8','["cmsr3jfma000ytiyu9pp0h46j","cmsr3jyjn000ztiyum273pqgf","cmsr3lz2t0012tiyuu43o8ez9","cmsr3mrh20014tiyu52jyhdtx"]','2026-07-31T00:00:00.000+00:00','2026-08-12T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-13T05:52:15.473+00:00','2026-08-13T07:01:18.089+00:00');
INSERT INTO Assignment VALUES('cmsr3pll0001btiyuaw6n7b7z','cmsr2fwe4000wtiyu2li4ecio','cmsr0iucr000etiyuo6lxfy7z','["cmsr3jfma000ytiyu9pp0h46j","cmsr657af0031tiyu5yqogfrx","cmsr3lz2t0012tiyuu43o8ez9","cmsr3mrh20014tiyu52jyhdtx"]','2026-07-31T00:00:00.000+00:00','2026-08-12T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-13T05:52:15.492+00:00','2026-08-13T07:01:18.047+00:00');
INSERT INTO Assignment VALUES('cmsr3pllk001ctiyudadcw9fz','cmsr2fwe4000wtiyu2li4ecio','cmsr0joac000gtiyu0m5wztt5','["cmsr3jfma000ytiyu9pp0h46j","cmsr657af0031tiyu5yqogfrx","cmsr3lz2t0012tiyuu43o8ez9","cmsr3mrh20014tiyu52jyhdtx"]','2026-07-31T00:00:00.000+00:00','2026-08-12T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-13T05:52:15.512+00:00','2026-08-13T07:01:18.069+00:00');
INSERT INTO Assignment VALUES('cmsr3plm4001dtiyu8f5tjfc6','cmsr2fwe4000wtiyu2li4ecio','cmsqznjsy0005tiyuig4j2cpf','["cmsr3jfma000ytiyu9pp0h46j","cmsr3jyjn000ztiyum273pqgf","cmsr3lz2t0012tiyuu43o8ez9","cmsr3mrh20014tiyu52jyhdtx"]','2026-07-31T00:00:00.000+00:00','2026-08-12T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-13T05:52:15.532+00:00','2026-08-13T07:01:17.996+00:00');
INSERT INTO Assignment VALUES('cmsr4pu2f001jtiyubpkxl0ox','cmsr2fwe4000wtiyu2li4ecio','cmsr0miw1000ltiyuv55c1kif','["cmsr3mw440015tiyu02dvpwgi"]','2026-08-12T00:00:00.000+00:00','2026-08-12T00:00:00.000+00:00',1.0,'TWO_HOURS',0.25,NULL,'2026-08-13T06:20:26.103+00:00','2026-08-13T07:01:18.122+00:00');
INSERT INTO Assignment VALUES('cmsr57yv1001ttiyuxjpyjive','cmsr4zf6q001ktiyu3fnwbjfi','cmsqzooho0007tiyuz87yxv7l','["cmsr52tp6001mtiyulbs4rw8l","cmsr531su001ntiyu007xwxet","cmsr53vhu001ptiyukc8olowr","cmsr54lsh001rtiyuu1qc1but"]','2026-08-12T00:00:00.000+00:00','2026-08-24T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-13T06:34:32.125+00:00','2026-08-13T06:56:07.382+00:00');
INSERT INTO Assignment VALUES('cmsr57yvl001utiyucu5ot1y7','cmsr4zf6q001ktiyu3fnwbjfi','cmsr0m2z9000ktiyuba7vf5hq','["cmsr543sf001qtiyungg3lebt","cmsr5547q001stiyuj2vrf0wa"]','2026-08-20T00:00:00.000+00:00','2026-08-25T00:00:00.000+00:00',1.0,'TWO_HOURS',0.25,NULL,'2026-08-13T06:34:32.145+00:00','2026-08-13T06:56:07.492+00:00');
INSERT INTO Assignment VALUES('cmsr57yw4001vtiyu63huepkz','cmsr4zf6q001ktiyu3fnwbjfi','cmsr0kvz6000htiyu06tyv0f8','["cmsr52tp6001mtiyulbs4rw8l","cmsr53vhu001ptiyukc8olowr","cmsr54lsh001rtiyuu1qc1but"]','2026-08-12T00:00:00.000+00:00','2026-08-24T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-13T06:34:32.164+00:00','2026-08-13T06:56:07.461+00:00');
INSERT INTO Assignment VALUES('cmsr57ywo001wtiyuo941z65a','cmsr4zf6q001ktiyu3fnwbjfi','cmsr0iegh000dtiyumgs0y2xc','["cmsr531su001ntiyu007xwxet","cmsr53vhu001ptiyukc8olowr","cmsr54lsh001rtiyuu1qc1but"]','2026-08-12T00:00:00.000+00:00','2026-08-24T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-13T06:34:32.184+00:00','2026-08-13T06:56:07.422+00:00');
INSERT INTO Assignment VALUES('cmsr57yx8001xtiyu9m7vkuos','cmsr4zf6q001ktiyu3fnwbjfi','cmsr0lacp000itiyuift9otk3','["cmsr53dxq001otiyurc0vtzg6"]','2026-08-17T00:00:00.000+00:00','2026-08-17T00:00:00.000+00:00',1.0,'TWO_HOURS',0.25,NULL,'2026-08-13T06:34:32.204+00:00','2026-08-13T06:56:07.481+00:00');
INSERT INTO Assignment VALUES('cmsr57yxs001ytiyuuvey2fu0','cmsr4zf6q001ktiyu3fnwbjfi','cmsqzp3180008tiyuvicvcspv','["cmsr52tp6001mtiyulbs4rw8l","cmsr531su001ntiyu007xwxet","cmsr53vhu001ptiyukc8olowr","cmsr54lsh001rtiyuu1qc1but"]','2026-08-12T00:00:00.000+00:00','2026-08-24T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-13T06:34:32.224+00:00','2026-08-13T06:56:07.402+00:00');
INSERT INTO Assignment VALUES('cmsr57yyd001ztiyuckvw2v0m','cmsr4zf6q001ktiyu3fnwbjfi','cmsr0miw1000ltiyuv55c1kif','["cmsr54lsh001rtiyuu1qc1but","cmsr5547q001stiyuj2vrf0wa"]','2026-08-24T00:00:00.000+00:00','2026-08-25T00:00:00.000+00:00',1.0,'TWO_HOURS',0.25,NULL,'2026-08-13T06:34:32.245+00:00','2026-08-13T06:56:07.512+00:00');
INSERT INTO Assignment VALUES('cmsr57yyx0020tiyucf8yv2gz','cmsr4zf6q001ktiyu3fnwbjfi','cmsr0iucr000etiyuo6lxfy7z','["cmsr531su001ntiyu007xwxet","cmsr53vhu001ptiyukc8olowr","cmsr54lsh001rtiyuu1qc1but"]','2026-08-12T00:00:00.000+00:00','2026-08-24T00:00:00.000+00:00',1.0,'FULL_DAY',1.0,NULL,'2026-08-13T06:34:32.265+00:00','2026-08-13T06:56:07.441+00:00');
INSERT INTO Assignment VALUES('cmsr57yzh0021tiyusfpsbuyc','cmsr4zf6q001ktiyu3fnwbjfi','cmsqznjsy0005tiyuig4j2cpf','["cmsr52tp6001mtiyulbs4rw8l","cmsr53vhu001ptiyukc8olowr","cmsr54lsh001rtiyuu1qc1but"]','2026-08-12T00:00:00.000+00:00','2026-08-24T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-13T06:34:32.285+00:00','2026-08-13T06:56:07.362+00:00');
INSERT INTO Assignment VALUES('cmsr5xcbs002dtiyu4r99nmga','cmsr5lmmd0022tiyutjv17stj','cmsqzooho0007tiyuz87yxv7l','["cmsr5sd6h0026tiyuekt18v23","cmsr5soxg0027tiyuxkd7h25f","cmsr5u8hh0029tiyuqt45xz9v","cmsr5uo4x002btiyud1w1z8y2"]','2026-08-24T00:00:00.000+00:00','2026-09-03T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-13T06:54:15.976+00:00','2026-08-13T06:54:15.976+00:00');
INSERT INTO Assignment VALUES('cmsr5xccc002etiyuf1w1q7va','cmsr5lmmd0022tiyutjv17stj','cmsr0m2z9000ktiyuba7vf5hq','["cmsr5tzjs0028tiyue5e0lvsp","cmsr5uhf6002atiyu1afqvp5k","cmsr5v0nk002ctiyuxhq01bm3"]','2026-08-27T00:00:00.000+00:00','2026-09-03T00:00:00.000+00:00',1.0,'TWO_HOURS',0.25,NULL,'2026-08-13T06:54:15.996+00:00','2026-08-13T06:54:15.996+00:00');
INSERT INTO Assignment VALUES('cmsr5xccv002ftiyu3vfaot5a','cmsr5lmmd0022tiyutjv17stj','cmsr0kvz6000htiyu06tyv0f8','["cmsr5sd6h0026tiyuekt18v23","cmsr5u8hh0029tiyuqt45xz9v","cmsr5uo4x002btiyud1w1z8y2"]','2026-08-24T00:00:00.000+00:00','2026-09-03T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-13T06:54:16.015+00:00','2026-08-13T06:54:16.015+00:00');
INSERT INTO Assignment VALUES('cmsr5xcdf002gtiyu0tt60vt2','cmsr5lmmd0022tiyutjv17stj','cmsqznjsy0005tiyuig4j2cpf','["cmsr5sd6h0026tiyuekt18v23","cmsr5u8hh0029tiyuqt45xz9v","cmsr5uo4x002btiyud1w1z8y2"]','2026-08-24T00:00:00.000+00:00','2026-09-03T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-13T06:54:16.035+00:00','2026-08-13T06:54:16.035+00:00');
INSERT INTO Assignment VALUES('cmsr5xcdy002htiyuw7d4vxtx','cmsr5lmmd0022tiyutjv17stj','cmsr0j9f8000ftiyujl6ma1zz','["cmsr5soxg0027tiyuxkd7h25f","cmsr5u8hh0029tiyuqt45xz9v","cmsr5uo4x002btiyud1w1z8y2"]','2026-08-24T00:00:00.000+00:00','2026-09-03T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-13T06:54:16.054+00:00','2026-08-13T06:54:16.054+00:00');
INSERT INTO Assignment VALUES('cmsr5xcei002itiyu7f4q5scy','cmsr5lmmd0022tiyutjv17stj','cmsr0iegh000dtiyumgs0y2xc','["cmsr5soxg0027tiyuxkd7h25f","cmsr5u8hh0029tiyuqt45xz9v","cmsr5uo4x002btiyud1w1z8y2"]','2026-08-24T00:00:00.000+00:00','2026-09-03T00:00:00.000+00:00',1.0,'FULL_DAY',1.0,NULL,'2026-08-13T06:54:16.074+00:00','2026-08-13T06:54:16.074+00:00');
INSERT INTO Assignment VALUES('cmsr5xcf1002jtiyudq01pbbo','cmsr5lmmd0022tiyutjv17stj','cmsr0lacp000itiyuift9otk3','["cmsr5tzjs0028tiyue5e0lvsp"]','2026-08-27T00:00:00.000+00:00','2026-08-27T00:00:00.000+00:00',1.0,'TWO_HOURS',0.25,NULL,'2026-08-13T06:54:16.093+00:00','2026-08-13T06:54:16.093+00:00');
INSERT INTO Assignment VALUES('cmsr5xcfk002ktiyu15idl8mt','cmsr5lmmd0022tiyutjv17stj','cmsqzp3180008tiyuvicvcspv','["cmsr5sd6h0026tiyuekt18v23","cmsr5soxg0027tiyuxkd7h25f","cmsr5u8hh0029tiyuqt45xz9v","cmsr5uo4x002btiyud1w1z8y2"]','2026-08-24T00:00:00.000+00:00','2026-09-03T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-13T06:54:16.112+00:00','2026-08-13T06:54:16.112+00:00');
INSERT INTO Assignment VALUES('cmsr60z1x002ltiyu1pd5wdf7','cmsr5nsxi0024tiyu1wpe6kwe','cmsqzooho0007tiyuz87yxv7l','["cmsr61lwz002utiyuqupcgm10","cmsr61vex002vtiyufdvv0crv","cmsr62e13002xtiyuop8sdwfy","cmsr62rdj002ztiyu7iizi6ui"]','2026-09-03T00:00:00.000+00:00','2026-09-11T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-13T06:57:05.397+00:00','2026-08-13T06:59:42.924+00:00');
INSERT INTO Assignment VALUES('cmsr60z28002mtiyuarwsoqs4','cmsr5nsxi0024tiyu1wpe6kwe','cmsr0m2z9000ktiyuba7vf5hq','["cmsr624va002wtiyu8aff5pwr","cmsr62izb002ytiyu9ip385te","cmsr62v9n0030tiyum4f2kuc1"]','2026-09-07T00:00:00.000+00:00','2026-09-14T00:00:00.000+00:00',1.0,'TWO_HOURS',0.25,NULL,'2026-08-13T06:57:05.408+00:00','2026-08-13T06:59:43.043+00:00');
INSERT INTO Assignment VALUES('cmsr60z2j002ntiyuzloqspvf','cmsr5nsxi0024tiyu1wpe6kwe','cmsr0kvz6000htiyu06tyv0f8','["cmsr61lwz002utiyuqupcgm10","cmsr62e13002xtiyuop8sdwfy","cmsr62rdj002ztiyu7iizi6ui"]','2026-09-03T00:00:00.000+00:00','2026-09-11T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-13T06:57:05.419+00:00','2026-08-13T06:59:43.004+00:00');
INSERT INTO Assignment VALUES('cmsr60z2u002otiyu0xgmb0tx','cmsr5nsxi0024tiyu1wpe6kwe','cmsr0joac000gtiyu0m5wztt5','["cmsr61vex002vtiyufdvv0crv","cmsr62e13002xtiyuop8sdwfy","cmsr62rdj002ztiyu7iizi6ui"]','2026-09-03T00:00:00.000+00:00','2026-09-11T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-13T06:57:05.430+00:00','2026-08-13T06:59:42.984+00:00');
INSERT INTO Assignment VALUES('cmsr60z35002ptiyuv94n0x8s','cmsr5nsxi0024tiyu1wpe6kwe','cmsqznjsy0005tiyuig4j2cpf','["cmsr61lwz002utiyuqupcgm10","cmsr62e13002xtiyuop8sdwfy","cmsr62rdj002ztiyu7iizi6ui"]','2026-09-03T00:00:00.000+00:00','2026-09-11T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-13T06:57:05.441+00:00','2026-08-13T06:59:42.905+00:00');
INSERT INTO Assignment VALUES('cmsr60z3f002qtiyujpq9by5l','cmsr5nsxi0024tiyu1wpe6kwe','cmsr0miw1000ltiyuv55c1kif','["cmsr62v9n0030tiyum4f2kuc1"]','2026-09-14T00:00:00.000+00:00','2026-09-14T00:00:00.000+00:00',1.0,'TWO_HOURS',0.25,NULL,'2026-08-13T06:57:05.451+00:00','2026-08-13T06:59:43.063+00:00');
INSERT INTO Assignment VALUES('cmsr60z3q002rtiyuw25f1jdu','cmsr5nsxi0024tiyu1wpe6kwe','cmsr0j9f8000ftiyujl6ma1zz','["cmsr61vex002vtiyufdvv0crv","cmsr62e13002xtiyuop8sdwfy","cmsr62rdj002ztiyu7iizi6ui"]','2026-09-03T00:00:00.000+00:00','2026-09-11T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-13T06:57:05.462+00:00','2026-08-13T06:59:42.964+00:00');
INSERT INTO Assignment VALUES('cmsr60z41002stiyukpkr5xgm','cmsr5nsxi0024tiyu1wpe6kwe','cmsr0lacp000itiyuift9otk3','["cmsr624va002wtiyu8aff5pwr"]','2026-09-07T00:00:00.000+00:00','2026-09-07T00:00:00.000+00:00',1.0,'TWO_HOURS',0.25,NULL,'2026-08-13T06:57:05.473+00:00','2026-08-13T06:59:43.024+00:00');
INSERT INTO Assignment VALUES('cmsr60z4b002ttiyu6gbt5e4p','cmsr5nsxi0024tiyu1wpe6kwe','cmsqzp3180008tiyuvicvcspv','["cmsr61lwz002utiyuqupcgm10","cmsr61vex002vtiyufdvv0crv","cmsr62rdj002ztiyu7iizi6ui","cmsr62e13002xtiyuop8sdwfy"]','2026-09-03T00:00:00.000+00:00','2026-09-11T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-13T06:57:05.483+00:00','2026-08-13T06:59:42.944+00:00');
INSERT INTO Assignment VALUES('cmssbx2qm0040tiyuduqmvtlc','cmssbgfbz003itiyui87tpnc0','cmsqzooho0007tiyuz87yxv7l','["cmssbk8g1003ltiyu72iaudm8","cmssbln4a003mtiyudfd2glzy","cmssbm3f9003ntiyu690wurg4","cmssbn599003ptiyuiamf1im0","cmssbniqq003qtiyuxsezmhg1","cmssboy5q003rtiyus7icpi5h","cmssbs807003utiyuotit52xm","cmssbsz2z003xtiyukgfl7zt1"]','2026-08-04T00:00:00.000+00:00','2026-08-24T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-14T02:29:47.422+00:00','2026-08-14T02:37:03.672+00:00');
INSERT INTO Assignment VALUES('cmssbx2r60041tiyuagm2pzve','cmssbgfbz003itiyui87tpnc0','cmsqzmxjw0004tiyua1x6cn0b','["cmssbk8g1003ltiyu72iaudm8","cmssbln4a003mtiyudfd2glzy","cmssbm3f9003ntiyu690wurg4","cmssbn599003ptiyuiamf1im0","cmssbs807003utiyuotit52xm","cmssbsz2z003xtiyukgfl7zt1"]','2026-08-04T00:00:00.000+00:00','2026-08-24T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-14T02:29:47.442+00:00','2026-08-14T02:37:03.641+00:00');
INSERT INTO Assignment VALUES('cmssbx2rq0042tiyuvrjvdjet','cmssbgfbz003itiyui87tpnc0','cmsqzpph40009tiyuk7qz0x3u','["cmssbk8g1003ltiyu72iaudm8","cmssbln4a003mtiyudfd2glzy","cmssbm3f9003ntiyu690wurg4","cmssbniqq003qtiyuxsezmhg1","cmssbxc0c004btiyujun2a7ys","cmssbs807003utiyuotit52xm"]','2026-08-04T00:00:00.000+00:00','2026-08-20T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-14T02:29:47.462+00:00','2026-08-14T02:37:03.703+00:00');
INSERT INTO Assignment VALUES('cmssbx2sa0043tiyu3dy95ryl','cmssbgfbz003itiyui87tpnc0','cmsr0m2z9000ktiyuba7vf5hq','["cmssbln4a003mtiyudfd2glzy","cmssbmknk003otiyup5t4tzw8","cmssbqd3p003stiyu3dry03pl","cmssbqkua003ttiyu869ezpo6","cmssbsnml003wtiyu9va0bdxm","cmssbt6ni003ytiyu6vpao3b8","cmssbk8g1003ltiyu72iaudm8","cmssc2xoy004ctiyuf17kmfge","cmssbshdd003vtiyupda2q9nv","cmssbtba1003ztiyungk05afj"]','2026-08-04T00:00:00.000+00:00','2026-08-26T00:00:00.000+00:00',1.0,'TWO_HOURS',0.25,NULL,'2026-08-14T02:29:47.482+00:00','2026-08-14T02:37:03.765+00:00');
INSERT INTO Assignment VALUES('cmssbx2su0044tiyuqldi7k1g','cmssbgfbz003itiyui87tpnc0','cmsqzmdyv0003tiyu1w2auvqk','["cmssbk8g1003ltiyu72iaudm8","cmssbln4a003mtiyudfd2glzy","cmssbm3f9003ntiyu690wurg4","cmssbn599003ptiyuiamf1im0","cmssbs807003utiyuotit52xm","cmssbsz2z003xtiyukgfl7zt1"]','2026-08-04T00:00:00.000+00:00','2026-08-24T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-14T02:29:47.502+00:00','2026-08-14T02:37:03.630+00:00');
INSERT INTO Assignment VALUES('cmssbx2te0045tiyu3tts7e2m','cmssbgfbz003itiyui87tpnc0','cmsr0miw1000ltiyuv55c1kif','["cmssbt6ni003ytiyu6vpao3b8","cmssbtba1003ztiyungk05afj"]','2026-08-24T00:00:00.000+00:00','2026-08-26T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-14T02:29:47.522+00:00','2026-08-14T02:37:03.785+00:00');
INSERT INTO Assignment VALUES('cmssbx2ty0046tiyuvyrbf5c6','cmssbgfbz003itiyui87tpnc0','cmsqzqbq5000atiyuadkrcbu1','["cmssbk8g1003ltiyu72iaudm8","cmssbln4a003mtiyudfd2glzy","cmssbm3f9003ntiyu690wurg4","cmssbniqq003qtiyuxsezmhg1","cmssbxc0c004btiyujun2a7ys","cmssbs807003utiyuotit52xm","cmssbsz2z003xtiyukgfl7zt1"]','2026-08-04T00:00:00.000+00:00','2026-08-24T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-14T02:29:47.542+00:00','2026-08-14T02:37:03.723+00:00');
INSERT INTO Assignment VALUES('cmssbx2ui0047tiyubcdzwa17','cmssbgfbz003itiyui87tpnc0','cmsr0j9f8000ftiyujl6ma1zz','["cmssbk8g1003ltiyu72iaudm8","cmssbln4a003mtiyudfd2glzy","cmssbm3f9003ntiyu690wurg4","cmssboy5q003rtiyus7icpi5h","cmssbs807003utiyuotit52xm","cmssbsz2z003xtiyukgfl7zt1"]','2026-08-04T00:00:00.000+00:00','2026-08-24T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-14T02:29:47.562+00:00','2026-08-14T02:37:03.734+00:00');
INSERT INTO Assignment VALUES('cmssbx2v30048tiyurohhv8xc','cmssbgfbz003itiyui87tpnc0','cmsr0lacp000itiyuift9otk3','["cmssbk8g1003ltiyu72iaudm8","cmssbln4a003mtiyudfd2glzy","cmssbm3f9003ntiyu690wurg4","cmssbmknk003otiyup5t4tzw8","cmssc2xoy004ctiyuf17kmfge"]','2026-08-04T00:00:00.000+00:00','2026-08-20T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-14T02:29:47.583+00:00','2026-08-14T02:37:03.745+00:00');
INSERT INTO Assignment VALUES('cmssbx2vm0049tiyup9g41uql','cmssbgfbz003itiyui87tpnc0','cmsqzo4kk0006tiyuqyechuk0','["cmssbk8g1003ltiyu72iaudm8","cmssbln4a003mtiyudfd2glzy","cmssbm3f9003ntiyu690wurg4","cmssboy5q003rtiyus7icpi5h","cmssbsz2z003xtiyukgfl7zt1","cmssbs807003utiyuotit52xm"]','2026-08-04T00:00:00.000+00:00','2026-08-24T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-14T02:29:47.602+00:00','2026-08-14T02:37:03.653+00:00');
INSERT INTO Assignment VALUES('cmssbx2w6004atiyu61h7ggyu','cmssbgfbz003itiyui87tpnc0','cmsqzp3180008tiyuvicvcspv','["cmssbk8g1003ltiyu72iaudm8","cmssbln4a003mtiyudfd2glzy","cmssbm3f9003ntiyu690wurg4","cmssbn599003ptiyuiamf1im0","cmssbs807003utiyuotit52xm","cmssbsz2z003xtiyukgfl7zt1"]','2026-08-04T00:00:00.000+00:00','2026-08-24T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-14T02:29:47.622+00:00','2026-08-14T02:37:03.684+00:00');
INSERT INTO Assignment VALUES('cmsscj3vf004vtiyu2ptouqpf','cmssc96nj004dtiyuhh9rtcaa','cmsqzooho0007tiyuz87yxv7l','["cmsscdo28004ktiyudhp439nk","cmssca9bo004ftiyuj9na9xhw","cmsschhai004ttiyuedtfo5kv","cmsschsj8004utiyu994s1mjz","cmssce64g004ltiyuwhi6wsnk","cmsscg4zj004qtiyumrxefv8d"]','2026-08-24T00:00:00.000+00:00','2026-09-07T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-14T02:46:55.323+00:00','2026-08-14T02:51:45.573+00:00');
INSERT INTO Assignment VALUES('cmsscj3vz004wtiyu4hzcg6g3','cmssc96nj004dtiyuhh9rtcaa','cmsqzmxjw0004tiyua1x6cn0b','["cmsscdo28004ktiyudhp439nk","cmssca9bo004ftiyuj9na9xhw","cmsschhai004ttiyuedtfo5kv","cmssce64g004ltiyuwhi6wsnk","cmsscg4zj004qtiyumrxefv8d"]','2026-08-24T00:00:00.000+00:00','2026-09-07T00:00:00.000+00:00',1.0,'FULL_DAY',1.0,NULL,'2026-08-14T02:46:55.343+00:00','2026-08-14T02:51:45.533+00:00');
INSERT INTO Assignment VALUES('cmsscj3wk004xtiyupvluvaza','cmssc96nj004dtiyuhh9rtcaa','cmsqzpph40009tiyuk7qz0x3u','["cmsscdbo5004jtiyuh7v41482","cmsscaik5004gtiyut3cimbok","cmsscdo28004ktiyudhp439nk","cmssca9bo004ftiyuj9na9xhw","cmsscf1ti004mtiyub5ml1n7v","cmsschhai004ttiyuedtfo5kv","cmsscg4zj004qtiyumrxefv8d","cmssccxqn004itiyu57ka87t7"]','2026-08-06T00:00:00.000+00:00','2026-09-07T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-14T02:46:55.364+00:00','2026-08-14T02:51:45.613+00:00');
INSERT INTO Assignment VALUES('cmsscj3x4004ytiyuu0km3d11','cmssc96nj004dtiyuhh9rtcaa','cmsr0m2z9000ktiyuba7vf5hq','["cmsscdo28004ktiyudhp439nk","cmssca9bo004ftiyuj9na9xhw","cmsscffxr004ntiyuo3v40e6m","cmsscfmcc004otiyuwdeh6xfd","cmsscfu6s004ptiyuky3i75g5","cmsscg9e1004rtiyul1k03uns","cmsscgdvo004stiyuxj6jjf8q"]','2026-08-24T00:00:00.000+00:00','2026-09-10T00:00:00.000+00:00',1.0,'TWO_HOURS',0.25,NULL,'2026-08-14T02:46:55.384+00:00','2026-08-14T02:51:45.754+00:00');
INSERT INTO Assignment VALUES('cmsscj3xo004ztiyu3qru078v','cmssc96nj004dtiyuhh9rtcaa','cmsr0hlfv000ctiyuwo47tgeo','["cmsscdbo5004jtiyuh7v41482","cmsscaik5004gtiyut3cimbok","cmsscdo28004ktiyudhp439nk","cmssca9bo004ftiyuj9na9xhw","cmsscf1ti004mtiyub5ml1n7v","cmsscg4zj004qtiyumrxefv8d"]','2026-08-07T00:00:00.000+00:00','2026-09-07T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-14T02:46:55.404+00:00','2026-08-14T02:51:45.654+00:00');
INSERT INTO Assignment VALUES('cmsscj3y90050tiyuk3izv93c','cmssc96nj004dtiyuhh9rtcaa','cmsqzmdyv0003tiyu1w2auvqk','["cmsscdbo5004jtiyuh7v41482","cmssca9bo004ftiyuj9na9xhw","cmsscg4zj004qtiyumrxefv8d","cmsscdo28004ktiyudhp439nk","cmsschhai004ttiyuedtfo5kv","cmssce64g004ltiyuwhi6wsnk"]','2026-08-07T00:00:00.000+00:00','2026-09-07T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-14T02:46:55.425+00:00','2026-08-14T02:51:45.512+00:00');
INSERT INTO Assignment VALUES('cmsscj3yt0051tiyuri2r55mw','cmssc96nj004dtiyuhh9rtcaa','cmsr0miw1000ltiyuv55c1kif','["cmsscg9e1004rtiyul1k03uns","cmsscgdvo004stiyuxj6jjf8q"]','2026-09-08T00:00:00.000+00:00','2026-09-10T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-14T02:46:55.445+00:00','2026-08-14T02:51:45.774+00:00');
INSERT INTO Assignment VALUES('cmsscj3zd0052tiyuc65xwocw','cmssc96nj004dtiyuhh9rtcaa','cmsqzqbq5000atiyuadkrcbu1','["cmsscdo28004ktiyudhp439nk","cmssca9bo004ftiyuj9na9xhw","cmsscg4zj004qtiyumrxefv8d","cmsscf1ti004mtiyub5ml1n7v"]','2026-08-24T00:00:00.000+00:00','2026-09-07T00:00:00.000+00:00',1.0,'FULL_DAY',1.0,NULL,'2026-08-14T02:46:55.465+00:00','2026-08-14T02:51:45.633+00:00');
INSERT INTO Assignment VALUES('cmsscj3zy0053tiyupidk21xw','cmssc96nj004dtiyuhh9rtcaa','cmsr0j9f8000ftiyujl6ma1zz','["cmsscdo28004ktiyudhp439nk","cmssca9bo004ftiyuj9na9xhw","cmsschsj8004utiyu994s1mjz","cmsscg4zj004qtiyumrxefv8d","cmssce64g004ltiyuwhi6wsnk"]','2026-08-24T00:00:00.000+00:00','2026-09-07T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-14T02:46:55.486+00:00','2026-08-14T02:51:45.693+00:00');
INSERT INTO Assignment VALUES('cmsscj40i0054tiyu5k27rvjq','cmssc96nj004dtiyuhh9rtcaa','cmsr0lacp000itiyuift9otk3','["cmsscdbo5004jtiyuh7v41482","cmsscdo28004ktiyudhp439nk","cmssca9bo004ftiyuj9na9xhw","cmsscffxr004ntiyuo3v40e6m","cmsscfmcc004otiyuwdeh6xfd","cmsscaik5004gtiyut3cimbok"]','2026-08-07T00:00:00.000+00:00','2026-09-03T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-14T02:46:55.506+00:00','2026-08-14T02:51:45.733+00:00');
INSERT INTO Assignment VALUES('cmsscj4130055tiyuzve19m79','cmssc96nj004dtiyuhh9rtcaa','cmsqzo4kk0006tiyuqyechuk0','["cmsscdbo5004jtiyuh7v41482","cmsscaik5004gtiyut3cimbok","cmssca9bo004ftiyuj9na9xhw","cmsscf1ti004mtiyub5ml1n7v","cmsschsj8004utiyu994s1mjz","cmssce64g004ltiyuwhi6wsnk","cmsscg4zj004qtiyumrxefv8d","cmsscdo28004ktiyudhp439nk","cmsschhai004ttiyuedtfo5kv"]','2026-08-07T00:00:00.000+00:00','2026-09-07T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-14T02:46:55.527+00:00','2026-08-14T02:51:45.553+00:00');
INSERT INTO Assignment VALUES('cmsscj41o0056tiyuh4c3e44a','cmssc96nj004dtiyuhh9rtcaa','cmsqzp3180008tiyuvicvcspv','["cmsscdo28004ktiyudhp439nk","cmssca9bo004ftiyuj9na9xhw","cmsschhai004ttiyuedtfo5kv","cmssce64g004ltiyuwhi6wsnk","cmsscg4zj004qtiyumrxefv8d"]','2026-08-24T00:00:00.000+00:00','2026-09-07T00:00:00.000+00:00',1.0,'HALF_DAY',0.5,NULL,'2026-08-14T02:46:55.548+00:00','2026-08-14T02:51:45.594+00:00');
INSERT INTO Assignment VALUES('cmsscj4280057tiyus1j0aetk','cmssc96nj004dtiyuhh9rtcaa','cmsr0joac000gtiyu0m5wztt5','["cmssca9bo004ftiyuj9na9xhw","cmsschsj8004utiyu994s1mjz","cmsscg4zj004qtiyumrxefv8d","cmsscdo28004ktiyudhp439nk","cmssce64g004ltiyuwhi6wsnk"]','2026-08-24T00:00:00.000+00:00','2026-09-07T00:00:00.000+00:00',1.0,'FULL_DAY',1.0,NULL,'2026-08-14T02:46:55.568+00:00','2026-08-14T02:51:45.713+00:00');
INSERT INTO Assignment VALUES('cmsscj42s0058tiyu0lv4cs0l','cmssc96nj004dtiyuhh9rtcaa','cmsr0iucr000etiyuo6lxfy7z','["cmsscdo28004ktiyudhp439nk","cmssca9bo004ftiyuj9na9xhw","cmsschsj8004utiyu994s1mjz","cmssce64g004ltiyuwhi6wsnk","cmsscg4zj004qtiyumrxefv8d"]','2026-08-24T00:00:00.000+00:00','2026-09-07T00:00:00.000+00:00',1.0,'FULL_DAY',1.0,NULL,'2026-08-14T02:46:55.588+00:00','2026-08-14T02:51:45.673+00:00');
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
INSERT INTO Notification VALUES('cmsr4zf71001ltiyu7xvg1zhz','NEW_INTAKE','New intake task','"Q3 2026 GAC/PMAX Evergreen (Batch 2)" has been added to the intake queue','cmsr4zf6q001ktiyu3fnwbjfi',0,0,'2026-08-13T06:27:53.389+00:00');
INSERT INTO Notification VALUES('cmsr5lmmp0023tiyus4acwjie','NEW_INTAKE','New intake task','"Q3 2026 GAC/PMAX Evergreen (Batch 3)" has been added to the intake queue','cmsr5lmmd0022tiyutjv17stj',0,0,'2026-08-13T06:45:09.457+00:00');
INSERT INTO Notification VALUES('cmsr5nsxs0025tiyulxdrlrl0','NEW_INTAKE','New intake task','"Q3 2026 GAC/PMAX Evergreen (Batch 4)" has been added to the intake queue','cmsr5nsxi0024tiyu1wpe6kwe',0,0,'2026-08-13T06:46:50.944+00:00');
INSERT INTO Notification VALUES('cmsr7na4z0035tiyu5fbrlsn0','NEW_INTAKE','New intake task','"Wave 11: SocMed Creation + Quality Visual Work" has been added to the intake queue',NULL,0,0,'2026-08-13T07:42:25.811+00:00');
INSERT INTO Notification VALUES('cmssbgfca003jtiyukcqz9c8p','NEW_INTAKE','New intake task','"Wave 11: SocMed Creation + Quality Visual Work" has been added to the intake queue','cmssbgfbz003itiyui87tpnc0',0,0,'2026-08-14T02:16:50.602+00:00');
INSERT INTO Notification VALUES('cmssc96nu004etiyu5efmjpqw','NEW_INTAKE','New intake task','"Wave 12: MAU/REV (Quality Visual Work + Social Media Creation - SMB/Happyfield)" has been added to the intake queue','cmssc96nj004dtiyuhh9rtcaa',0,0,'2026-08-14T02:39:12.378+00:00');
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
INSERT INTO TaskPhase VALUES('cmsr52tp6001mtiyulbs4rw8l','cmsr4zf6q001ktiyu3fnwbjfi','CREATIVE_DEVELOPMENT','NOT_STARTED','2026-08-12T00:00:00.000+00:00','2026-08-14T00:00:00.000+00:00',NULL,NULL,4,NULL,'2026-08-13T06:30:32.154+00:00','2026-08-13T06:30:32.154+00:00');
INSERT INTO TaskPhase VALUES('cmsr531su001ntiyu007xwxet','cmsr4zf6q001ktiyu3fnwbjfi','CREATIVE_DEVELOPMENT_MOTION','NOT_STARTED','2026-08-12T00:00:00.000+00:00','2026-08-14T00:00:00.000+00:00',NULL,NULL,99,NULL,'2026-08-13T06:30:42.654+00:00','2026-08-13T06:30:42.654+00:00');
INSERT INTO TaskPhase VALUES('cmsr53dxq001otiyurc0vtzg6','cmsr4zf6q001ktiyu3fnwbjfi','CD_REVIEW_WIPS','NOT_STARTED','2026-08-17T00:00:00.000+00:00','2026-08-17T00:00:00.000+00:00',NULL,NULL,100,NULL,'2026-08-13T06:30:58.382+00:00','2026-08-13T06:30:58.382+00:00');
INSERT INTO TaskPhase VALUES('cmsr53vhu001ptiyukc8olowr','cmsr4zf6q001ktiyu3fnwbjfi','CREATIVE_REFINEMENT','NOT_STARTED','2026-08-18T00:00:00.000+00:00','2026-08-19T00:00:00.000+00:00',NULL,NULL,7,NULL,'2026-08-13T06:31:21.138+00:00','2026-08-13T06:31:21.138+00:00');
INSERT INTO TaskPhase VALUES('cmsr543sf001qtiyungg3lebt','cmsr4zf6q001ktiyu3fnwbjfi','PERMAR_REVIEW_WIPS','NOT_STARTED','2026-08-20T00:00:00.000+00:00','2026-08-20T00:00:00.000+00:00',NULL,NULL,101,NULL,'2026-08-13T06:31:31.887+00:00','2026-08-13T06:31:31.887+00:00');
INSERT INTO TaskPhase VALUES('cmsr54lsh001rtiyuu1qc1but','cmsr4zf6q001ktiyu3fnwbjfi','ASSET_FINALIZATION','NOT_STARTED','2026-08-24T00:00:00.000+00:00','2026-08-24T00:00:00.000+00:00',NULL,NULL,8,NULL,'2026-08-13T06:31:55.217+00:00','2026-08-13T06:31:55.217+00:00');
INSERT INTO TaskPhase VALUES('cmsr5547q001stiyuj2vrf0wa','cmsr4zf6q001ktiyu3fnwbjfi','DISPATCH','NOT_STARTED','2026-08-24T00:00:00.000+00:00','2026-08-25T00:00:00.000+00:00',NULL,NULL,102,NULL,'2026-08-13T06:32:19.094+00:00','2026-08-13T06:32:19.094+00:00');
INSERT INTO TaskPhase VALUES('cmsr5sd6h0026tiyuekt18v23','cmsr5lmmd0022tiyutjv17stj','CREATIVE_DEVELOPMENT','NOT_STARTED','2026-08-24T00:00:00.000+00:00','2026-08-26T00:00:00.000+00:00',NULL,NULL,4,NULL,'2026-08-13T06:50:23.801+00:00','2026-08-13T06:50:23.801+00:00');
INSERT INTO TaskPhase VALUES('cmsr5soxg0027tiyuxkd7h25f','cmsr5lmmd0022tiyutjv17stj','CREATIVE_DEVELOPMENT_MOTION','NOT_STARTED','2026-08-24T00:00:00.000+00:00','2026-08-26T00:00:00.000+00:00',NULL,NULL,99,NULL,'2026-08-13T06:50:39.028+00:00','2026-08-13T06:50:39.028+00:00');
INSERT INTO TaskPhase VALUES('cmsr5tzjs0028tiyue5e0lvsp','cmsr5lmmd0022tiyutjv17stj','CD_REVIEW_WIPS','NOT_STARTED','2026-08-27T00:00:00.000+00:00','2026-08-27T00:00:00.000+00:00',NULL,NULL,100,NULL,'2026-08-13T06:51:39.448+00:00','2026-08-13T06:51:39.448+00:00');
INSERT INTO TaskPhase VALUES('cmsr5u8hh0029tiyuqt45xz9v','cmsr5lmmd0022tiyutjv17stj','CREATIVE_REFINEMENT','NOT_STARTED','2026-08-28T00:00:00.000+00:00','2026-09-01T00:00:00.000+00:00',NULL,NULL,7,NULL,'2026-08-13T06:51:51.029+00:00','2026-08-13T06:51:51.029+00:00');
INSERT INTO TaskPhase VALUES('cmsr5uhf6002atiyu1afqvp5k','cmsr5lmmd0022tiyutjv17stj','PERMAR_REVIEW_WIPS','NOT_STARTED','2026-09-02T00:00:00.000+00:00','2026-09-02T00:00:00.000+00:00',NULL,NULL,101,NULL,'2026-08-13T06:52:02.610+00:00','2026-08-13T06:52:02.610+00:00');
INSERT INTO TaskPhase VALUES('cmsr5uo4x002btiyud1w1z8y2','cmsr5lmmd0022tiyutjv17stj','ASSET_FINALIZATION','NOT_STARTED','2026-09-03T00:00:00.000+00:00','2026-09-03T00:00:00.000+00:00',NULL,NULL,8,NULL,'2026-08-13T06:52:11.313+00:00','2026-08-13T06:52:11.313+00:00');
INSERT INTO TaskPhase VALUES('cmsr5v0nk002ctiyuxhq01bm3','cmsr5lmmd0022tiyutjv17stj','DISPATCH','NOT_STARTED','2026-09-03T00:00:00.000+00:00','2026-09-03T00:00:00.000+00:00',NULL,NULL,102,NULL,'2026-08-13T06:52:27.536+00:00','2026-08-13T06:52:27.536+00:00');
INSERT INTO TaskPhase VALUES('cmsr61lwz002utiyuqupcgm10','cmsr5nsxi0024tiyu1wpe6kwe','CREATIVE_DEVELOPMENT','NOT_STARTED','2026-09-03T00:00:00.000+00:00','2026-09-04T00:00:00.000+00:00',NULL,NULL,4,NULL,'2026-08-13T06:57:35.028+00:00','2026-08-13T06:57:35.028+00:00');
INSERT INTO TaskPhase VALUES('cmsr61vex002vtiyufdvv0crv','cmsr5nsxi0024tiyu1wpe6kwe','CREATIVE_DEVELOPMENT_MOTION','NOT_STARTED','2026-09-03T00:00:00.000+00:00','2026-09-04T00:00:00.000+00:00',NULL,NULL,99,NULL,'2026-08-13T06:57:47.337+00:00','2026-08-13T06:57:47.337+00:00');
INSERT INTO TaskPhase VALUES('cmsr624va002wtiyu8aff5pwr','cmsr5nsxi0024tiyu1wpe6kwe','CD_REVIEW_WIPS','NOT_STARTED','2026-09-07T00:00:00.000+00:00','2026-09-07T00:00:00.000+00:00',NULL,NULL,100,NULL,'2026-08-13T06:57:59.590+00:00','2026-08-13T06:57:59.590+00:00');
INSERT INTO TaskPhase VALUES('cmsr62e13002xtiyuop8sdwfy','cmsr5nsxi0024tiyu1wpe6kwe','CREATIVE_REFINEMENT','NOT_STARTED','2026-09-08T00:00:00.000+00:00','2026-09-09T00:00:00.000+00:00',NULL,NULL,7,NULL,'2026-08-13T06:58:11.463+00:00','2026-08-13T06:58:11.463+00:00');
INSERT INTO TaskPhase VALUES('cmsr62izb002ytiyu9ip385te','cmsr5nsxi0024tiyu1wpe6kwe','PERMAR_REVIEW_WIPS','NOT_STARTED','2026-09-10T00:00:00.000+00:00','2026-09-10T00:00:00.000+00:00',NULL,NULL,101,NULL,'2026-08-13T06:58:17.879+00:00','2026-08-13T06:58:17.879+00:00');
INSERT INTO TaskPhase VALUES('cmsr62rdj002ztiyu7iizi6ui','cmsr5nsxi0024tiyu1wpe6kwe','ASSET_FINALIZATION','NOT_STARTED','2026-09-11T00:00:00.000+00:00','2026-09-11T00:00:00.000+00:00',NULL,NULL,8,NULL,'2026-08-13T06:58:28.759+00:00','2026-08-13T06:58:28.759+00:00');
INSERT INTO TaskPhase VALUES('cmsr62v9n0030tiyum4f2kuc1','cmsr5nsxi0024tiyu1wpe6kwe','DISPATCH','NOT_STARTED','2026-09-14T00:00:00.000+00:00','2026-09-14T00:00:00.000+00:00',NULL,NULL,102,NULL,'2026-08-13T06:58:33.803+00:00','2026-08-13T06:58:33.803+00:00');
INSERT INTO TaskPhase VALUES('cmsr657af0031tiyu5yqogfrx','cmsr2fwe4000wtiyu2li4ecio','CREATIVE_DEVELOPMENT_MOTION','NOT_STARTED','2026-08-03T00:00:00.000+00:00','2026-08-06T00:00:00.000+00:00',NULL,NULL,102,NULL,'2026-08-13T07:00:22.695+00:00','2026-08-13T07:00:22.695+00:00');
INSERT INTO TaskPhase VALUES('cmssbk8g1003ltiyu72iaudm8','cmssbgfbz003itiyui87tpnc0','BRIEF_REVIEW','NOT_STARTED','2026-08-04T00:00:00.000+00:00','2026-08-04T00:00:00.000+00:00',NULL,NULL,0,NULL,'2026-08-14T02:19:48.289+00:00','2026-08-14T02:23:11.610+00:00');
INSERT INTO TaskPhase VALUES('cmssbln4a003mtiyudfd2glzy','cmssbgfbz003itiyui87tpnc0','KICKOFF','NOT_STARTED','2026-08-05T00:00:00.000+00:00','2026-08-05T00:00:00.000+00:00',NULL,NULL,1,NULL,'2026-08-14T02:20:53.962+00:00','2026-08-14T02:23:11.862+00:00');
INSERT INTO TaskPhase VALUES('cmssbm3f9003ntiyu690wurg4','cmssbgfbz003itiyui87tpnc0','BRAINSTORM','NOT_STARTED','2026-08-05T00:00:00.000+00:00','2026-08-07T00:00:00.000+00:00',NULL,NULL,2,NULL,'2026-08-14T02:21:15.093+00:00','2026-08-14T02:23:12.105+00:00');
INSERT INTO TaskPhase VALUES('cmssbmknk003otiyup5t4tzw8','cmssbgfbz003itiyui87tpnc0','CREATIVE_REVIEW','NOT_STARTED','2026-08-10T00:00:00.000+00:00','2026-08-10T00:00:00.000+00:00',NULL,NULL,4,NULL,'2026-08-14T02:21:37.424+00:00','2026-08-14T02:23:12.615+00:00');
INSERT INTO TaskPhase VALUES('cmssbn599003ptiyuiamf1im0','cmssbgfbz003itiyui87tpnc0','CREATIVE_DEVELOPMENT','NOT_STARTED','2026-08-10T00:00:00.000+00:00','2026-08-20T00:00:00.000+00:00',NULL,NULL,3,NULL,'2026-08-14T02:22:04.125+00:00','2026-08-14T02:23:12.362+00:00');
INSERT INTO TaskPhase VALUES('cmssbniqq003qtiyuxsezmhg1','cmssbgfbz003itiyui87tpnc0','CREATIVE_DEVELOPMENT_VIDEO','NOT_STARTED','2026-08-10T00:00:00.000+00:00','2026-08-20T00:00:00.000+00:00',NULL,NULL,5,NULL,'2026-08-14T02:22:21.602+00:00','2026-08-14T02:23:12.896+00:00');
INSERT INTO TaskPhase VALUES('cmssboy5q003rtiyus7icpi5h','cmssbgfbz003itiyui87tpnc0','CREATIVE_DEVELOPMENT_MOTION','NOT_STARTED','2026-08-10T00:00:00.000+00:00','2026-08-20T00:00:00.000+00:00',NULL,NULL,99,NULL,'2026-08-14T02:23:28.238+00:00','2026-08-14T02:23:28.238+00:00');
INSERT INTO TaskPhase VALUES('cmssbqd3p003stiyu3dry03pl','cmssbgfbz003itiyui87tpnc0','SH_REVIEW','NOT_STARTED','2026-08-14T00:00:00.000+00:00','2026-08-17T00:00:00.000+00:00',NULL,NULL,6,NULL,'2026-08-14T02:24:34.261+00:00','2026-08-14T02:24:34.261+00:00');
INSERT INTO TaskPhase VALUES('cmssbqkua003ttiyu869ezpo6','cmssbgfbz003itiyui87tpnc0','DANA_REVIEW','NOT_STARTED','2026-08-17T00:00:00.000+00:00','2026-08-18T00:00:00.000+00:00',NULL,NULL,100,NULL,'2026-08-14T02:24:44.290+00:00','2026-08-14T02:24:44.290+00:00');
INSERT INTO TaskPhase VALUES('cmssbs807003utiyuotit52xm','cmssbgfbz003itiyui87tpnc0','CREATIVE_REFINEMENT','NOT_STARTED','2026-08-19T00:00:00.000+00:00','2026-08-20T00:00:00.000+00:00',NULL,NULL,7,NULL,'2026-08-14T02:26:00.967+00:00','2026-08-14T02:26:00.967+00:00');
INSERT INTO TaskPhase VALUES('cmssbshdd003vtiyupda2q9nv','cmssbgfbz003itiyui87tpnc0','PERMAR_REVIEW_WIPS','NOT_STARTED','2026-08-20T00:00:00.000+00:00','2026-08-20T00:00:00.000+00:00',NULL,NULL,101,NULL,'2026-08-14T02:26:13.105+00:00','2026-08-14T02:26:13.105+00:00');
INSERT INTO TaskPhase VALUES('cmssbsnml003wtiyu9va0bdxm','cmssbgfbz003itiyui87tpnc0','DANA_REVIEW_WIPS','NOT_STARTED','2026-08-21T00:00:00.000+00:00','2026-08-21T00:00:00.000+00:00',NULL,NULL,102,NULL,'2026-08-14T02:26:21.213+00:00','2026-08-14T02:26:21.213+00:00');
INSERT INTO TaskPhase VALUES('cmssbsz2z003xtiyukgfl7zt1','cmssbgfbz003itiyui87tpnc0','ASSET_FINALIZATION','NOT_STARTED','2026-08-24T00:00:00.000+00:00','2026-08-24T00:00:00.000+00:00',NULL,NULL,8,NULL,'2026-08-14T02:26:36.059+00:00','2026-08-14T02:26:36.059+00:00');
INSERT INTO TaskPhase VALUES('cmssbt6ni003ytiyu6vpao3b8','cmssbgfbz003itiyui87tpnc0','DISPATCH','NOT_STARTED','2026-08-24T00:00:00.000+00:00','2026-08-24T00:00:00.000+00:00',NULL,NULL,103,NULL,'2026-08-14T02:26:45.870+00:00','2026-08-14T02:26:45.870+00:00');
INSERT INTO TaskPhase VALUES('cmssbtba1003ztiyungk05afj','cmssbgfbz003itiyui87tpnc0','ASSET_UPLOADING','NOT_STARTED','2026-08-25T00:00:00.000+00:00','2026-08-26T00:00:00.000+00:00',NULL,NULL,104,NULL,'2026-08-14T02:26:51.865+00:00','2026-08-14T02:26:51.865+00:00');
INSERT INTO TaskPhase VALUES('cmssbxc0c004btiyujun2a7ys','cmssbgfbz003itiyui87tpnc0','SHOOT_DAY','NOT_STARTED','2026-08-13T00:00:00.000+00:00','2026-08-13T00:00:00.000+00:00',NULL,NULL,105,NULL,'2026-08-14T02:29:59.436+00:00','2026-08-14T02:29:59.436+00:00');
INSERT INTO TaskPhase VALUES('cmssc2xoy004ctiyuf17kmfge','cmssbgfbz003itiyui87tpnc0','CD_REVIEW_WIPS','NOT_STARTED','2026-08-20T00:00:00.000+00:00','2026-08-20T00:00:00.000+00:00',NULL,NULL,106,NULL,'2026-08-14T02:34:20.818+00:00','2026-08-14T02:34:20.818+00:00');
INSERT INTO TaskPhase VALUES('cmssca9bo004ftiyuj9na9xhw','cmssc96nj004dtiyuhh9rtcaa','KICKOFF','NOT_STARTED','2026-08-27T00:00:00.000+00:00','2026-08-27T00:00:00.000+00:00',NULL,NULL,4,NULL,'2026-08-14T02:40:02.484+00:00','2026-08-14T02:45:19.344+00:00');
INSERT INTO TaskPhase VALUES('cmsscaik5004gtiyut3cimbok','cmssc96nj004dtiyuhh9rtcaa','SHOOT_DAY','NOT_STARTED','2026-08-18T00:00:00.000+00:00','2026-08-18T00:00:00.000+00:00',NULL,NULL,2,NULL,'2026-08-14T02:40:14.453+00:00','2026-08-14T02:45:18.835+00:00');
INSERT INTO TaskPhase VALUES('cmssccxqn004itiyu57ka87t7','cmssc96nj004dtiyuhh9rtcaa','DANA_REVIEW','NOT_STARTED','2026-08-06T00:00:00.000+00:00','2026-08-06T00:00:00.000+00:00',NULL,NULL,0,NULL,'2026-08-14T02:42:07.439+00:00','2026-08-14T02:45:18.314+00:00');
INSERT INTO TaskPhase VALUES('cmsscdbo5004jtiyuh7v41482','cmssc96nj004dtiyuhh9rtcaa','PRE_PRODUCTION','NOT_STARTED','2026-08-07T00:00:00.000+00:00','2026-08-17T00:00:00.000+00:00',NULL,NULL,1,NULL,'2026-08-14T02:42:25.493+00:00','2026-08-14T02:45:18.585+00:00');
INSERT INTO TaskPhase VALUES('cmsscdo28004ktiyudhp439nk','cmssc96nj004dtiyuhh9rtcaa','BRIEF_REVIEW','NOT_STARTED','2026-08-24T00:00:00.000+00:00','2026-08-24T00:00:00.000+00:00',NULL,NULL,3,NULL,'2026-08-14T02:42:41.552+00:00','2026-08-14T02:45:19.090+00:00');
INSERT INTO TaskPhase VALUES('cmssce64g004ltiyuwhi6wsnk','cmssc96nj004dtiyuhh9rtcaa','BRAINSTORM','NOT_STARTED','2026-08-28T00:00:00.000+00:00','2026-08-31T00:00:00.000+00:00',NULL,NULL,6,NULL,'2026-08-14T02:43:04.960+00:00','2026-08-14T02:45:55.350+00:00');
INSERT INTO TaskPhase VALUES('cmsscf1ti004mtiyub5ml1n7v','cmssc96nj004dtiyuhh9rtcaa','CREATIVE_DEVELOPMENT_VIDEO','NOT_STARTED','2026-08-27T00:00:00.000+00:00','2026-09-02T00:00:00.000+00:00',NULL,NULL,5,NULL,'2026-08-14T02:43:46.038+00:00','2026-08-14T02:45:55.100+00:00');
INSERT INTO TaskPhase VALUES('cmsscffxr004ntiyuo3v40e6m','cmssc96nj004dtiyuhh9rtcaa','CD_REVIEW_WIPS','NOT_STARTED','2026-09-02T00:00:00.000+00:00','2026-09-02T00:00:00.000+00:00',NULL,NULL,7,NULL,'2026-08-14T02:44:04.335+00:00','2026-08-14T02:45:20.099+00:00');
INSERT INTO TaskPhase VALUES('cmsscfmcc004otiyuwdeh6xfd','cmssc96nj004dtiyuhh9rtcaa','SH_REVIEW','NOT_STARTED','2026-09-03T00:00:00.000+00:00','2026-09-03T00:00:00.000+00:00',NULL,NULL,8,NULL,'2026-08-14T02:44:12.636+00:00','2026-08-14T02:45:20.350+00:00');
INSERT INTO TaskPhase VALUES('cmsscfu6s004ptiyuky3i75g5','cmssc96nj004dtiyuhh9rtcaa','DANA_REVIEW','NOT_STARTED','2026-09-04T00:00:00.000+00:00','2026-09-04T00:00:00.000+00:00',NULL,NULL,9,NULL,'2026-08-14T02:44:22.804+00:00','2026-08-14T02:45:20.616+00:00');
INSERT INTO TaskPhase VALUES('cmsscg4zj004qtiyumrxefv8d','cmssc96nj004dtiyuhh9rtcaa','ASSET_FINALIZATION','NOT_STARTED','2026-09-07T00:00:00.000+00:00','2026-09-07T00:00:00.000+00:00',NULL,NULL,10,NULL,'2026-08-14T02:44:36.799+00:00','2026-08-14T02:45:20.949+00:00');
INSERT INTO TaskPhase VALUES('cmsscg9e1004rtiyul1k03uns','cmssc96nj004dtiyuhh9rtcaa','DISPATCH','NOT_STARTED','2026-09-08T00:00:00.000+00:00','2026-09-08T00:00:00.000+00:00',NULL,NULL,11,NULL,'2026-08-14T02:44:42.505+00:00','2026-08-14T02:45:21.209+00:00');
INSERT INTO TaskPhase VALUES('cmsscgdvo004stiyuxj6jjf8q','cmssc96nj004dtiyuhh9rtcaa','ASSET_UPLOADING','NOT_STARTED','2026-09-09T00:00:00.000+00:00','2026-09-10T00:00:00.000+00:00',NULL,NULL,12,NULL,'2026-08-14T02:44:48.324+00:00','2026-08-14T02:45:21.460+00:00');
INSERT INTO TaskPhase VALUES('cmsschhai004ttiyuedtfo5kv','cmssc96nj004dtiyuhh9rtcaa','CREATIVE_DEVELOPMENT','NOT_STARTED','2026-08-27T00:00:00.000+00:00','2026-09-02T00:00:00.000+00:00',NULL,NULL,13,NULL,'2026-08-14T02:45:39.402+00:00','2026-08-14T02:45:39.402+00:00');
INSERT INTO TaskPhase VALUES('cmsschsj8004utiyu994s1mjz','cmssc96nj004dtiyuhh9rtcaa','CREATIVE_DEVELOPMENT_MOTION','NOT_STARTED','2026-08-27T00:00:00.000+00:00','2026-09-02T00:00:00.000+00:00',NULL,NULL,14,NULL,'2026-08-14T02:45:53.972+00:00','2026-08-14T02:45:55.642+00:00');
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
INSERT INTO UserAccount VALUES('6cbf64c0-618f-4dbc-9adc-cac117fc6a5e','Ellaine Llave','marieaellaine@canva.com','ADMIN',NULL,1,NULL,'2026-08-13T00:39:05.430Z','2026-08-14T02:10:03.891+00:00','$2b$10$graDV/u6AFRCSWQ2O5jpSe6J6X8cZinL6Dqm.tX32i0p4O6fVSFWe');
INSERT INTO UserAccount VALUES('cmsr67lrq0032tiyuwov7njm3','Growth Creatives','gtalboys@canva.com','VIEWER',NULL,1,NULL,'2026-08-13T07:02:14.774+00:00','2026-08-14T02:09:54.746+00:00',NULL);
INSERT INTO UserAccount VALUES('cmsr6oexg0033tiyutxf8safs','Tessa','tessamarf@canva.com','ADMIN',NULL,1,NULL,'2026-08-13T07:15:19.060+00:00','2026-08-13T07:15:19.060+00:00',NULL);
CREATE TABLE IF NOT EXISTS "Holiday" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "endDate" DATETIME,
    "type" TEXT NOT NULL DEFAULT 'PUBLIC',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO Holiday VALUES('cmsr4hytc001etiyuvb73mpx3','PH Holiday','2026-08-21T00:00:00.000+00:00','2026-08-21T00:00:00.000+00:00','PUBLIC','2026-08-13T06:14:19.008+00:00','2026-08-13T06:14:19.008+00:00');
INSERT INTO Holiday VALUES('cmsr4iefc001ftiyuekpue9k4','PH Holiday','2026-08-31T00:00:00.000+00:00','2026-08-31T00:00:00.000+00:00','PUBLIC','2026-08-13T06:14:39.240+00:00','2026-08-13T06:14:39.240+00:00');
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
INSERT INTO PhaseConfig VALUES('phase_intake','INTAKE','Intake','#94a3b8',NULL,NULL,0,0,0.0,'2026-08-13 00:39:05','2026-08-13T06:01:42.146+00:00');
INSERT INTO PhaseConfig VALUES('phase_brief_review','BRIEF_REVIEW','Brief Review','#fff838',1,2,1,0,2.0,'2026-08-13 00:39:05','2026-08-14T02:20:21.890+00:00');
INSERT INTO PhaseConfig VALUES('phase_kickoff','KICKOFF','Kickoff','#e2dc3c',1,1,2,0,1.0,'2026-08-13 00:39:05','2026-08-13T05:52:34.928+00:00');
INSERT INTO PhaseConfig VALUES('phase_brainstorm','BRAINSTORM','Brainstorm','#ffbd80',2,2,3,0,4.0,'2026-08-13 00:39:05','2026-08-13T04:43:07.894+00:00');
INSERT INTO PhaseConfig VALUES('phase_creative_dev','CREATIVE_DEVELOPMENT','Creative Development (Static)','#ff8b1f',3,5,4,0,-1.0,'2026-08-13 00:39:05','2026-08-13T06:18:33.121+00:00');
INSERT INTO PhaseConfig VALUES('phase_creative_rev','CREATIVE_REVIEW','CD Review (Concepts)','#ffb8de',1,2,9,1,-1.0,'2026-08-13 00:39:05','2026-08-14T02:41:11.233+00:00');
INSERT INTO PhaseConfig VALUES('phase_sh_review','SH_REVIEW','PerMar Review (Concepts)','#ff8abd',1,2,10,1,8.0,'2026-08-13 00:39:05','2026-08-14T02:41:09.281+00:00');
INSERT INTO PhaseConfig VALUES('phase_refinement','CREATIVE_REFINEMENT','Creative Refinement','#c061ff',3,3,12,0,-1.0,'2026-08-13 00:39:05','2026-08-14T02:41:03.208+00:00');
INSERT INTO PhaseConfig VALUES('phase_asset_final','ASSET_FINALIZATION','Asset Finalization and Exports','#94ffcd',2,2,16,0,-1.0,'2026-08-13 00:39:05','2026-08-14T02:40:51.060+00:00');
INSERT INTO PhaseConfig VALUES('cmsr0pyzh000mtiyu45q3tw03','DANA_REVIEW','Dana Review  (Concepts)','#ff5ce1',1,2,11,1,8.0,'2026-08-13T04:28:34.013+00:00','2026-08-14T02:41:06.532+00:00');
INSERT INTO PhaseConfig VALUES('cmsr0r3q7000ntiyui7drw86y','SHOOT_DAY','Shoot Day','#ff471a',NULL,NULL,8,0,8.0,'2026-08-13T04:29:26.815+00:00','2026-08-14T02:41:13.228+00:00');
INSERT INTO PhaseConfig VALUES('cmsr123hl000otiyu2d364v97','CD_REVIEW_WIPS','CD Review (WIPs)','#add5ff',1,NULL,13,1,-1.0,'2026-08-13T04:37:59.721+00:00','2026-08-14T02:41:00.265+00:00');
INSERT INTO PhaseConfig VALUES('cmsr12nx9000ptiyubm4xvljv','PERMAR_REVIEW_WIPS','PerMar Review (WIPs)','#6678ff',1,NULL,14,1,8.0,'2026-08-13T04:38:26.205+00:00','2026-08-14T02:40:57.649+00:00');
INSERT INTO PhaseConfig VALUES('cmsr12wcy000qtiyuz8ij2nb2','DANA_REVIEW_WIPS','Dana Review (WIPs)','#0004ff',1,2,15,1,8.0,'2026-08-13T04:38:37.138+00:00','2026-08-14T02:40:55.242+00:00');
INSERT INTO PhaseConfig VALUES('cmsr16lhl000rtiyu1kvad273','DISPATCH','Dispatch','#41ef34',NULL,NULL,17,0,4.0,'2026-08-13T04:41:29.673+00:00','2026-08-14T02:40:47.180+00:00');
INSERT INTO PhaseConfig VALUES('cmsr16vi3000stiyua6e75xpm','ASSET_UPLOADING','Asset Uploading','#43b66c',1,2,18,0,8.0,'2026-08-13T04:41:42.651+00:00','2026-08-14T02:40:44.664+00:00');
INSERT INTO PhaseConfig VALUES('cmsr4jin7001gtiyuh3y5auo3','CREATIVE_DEVELOPMENT_VIDEO','Creative Development (Video)','#ff8b1f',NULL,NULL,5,0,-1.0,'2026-08-13T06:15:31.363+00:00','2026-08-14T02:23:45.928+00:00');
INSERT INTO PhaseConfig VALUES('cmsr4js8v001htiyuh42dax3x','CREATIVE_DEVELOPMENT_MOTION','Creative Development (Motion)','#ff8b1f',NULL,NULL,6,0,-1.0,'2026-08-13T06:15:43.807+00:00','2026-08-13T06:16:59.664+00:00');
INSERT INTO PhaseConfig VALUES('cmsscb324004htiyu6a3a92ad','PRE_PRODUCTION','Pre-production','#6366f1',NULL,NULL,7,0,4.0,'2026-08-14T02:40:41.020+00:00','2026-08-14T02:41:13.216+00:00');
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
INSERT INTO WorkTypeConfig VALUES('cmssbhcou003ktiyu2qqpy41b','SPRINT','Sprint','#f2b764',6,'2026-08-14T02:17:33.822+00:00','2026-08-14T02:17:43.558+00:00');
CREATE UNIQUE INDEX "TeamMember_email_key" ON "TeamMember"("email");
CREATE UNIQUE INDEX "Task_mondayItemId_key" ON "Task"("mondayItemId");
CREATE UNIQUE INDEX "Assignment_taskId_teamMemberId_key" ON "Assignment"("taskId", "teamMemberId");
CREATE UNIQUE INDEX "SlackTemplate_key_key" ON "SlackTemplate"("key");
CREATE UNIQUE INDEX "UserAccount_email_key" ON "UserAccount"("email");
CREATE UNIQUE INDEX "UserAccount_teamMemberId_key" ON "UserAccount"("teamMemberId");
CREATE UNIQUE INDEX "PhaseConfig_key_key" ON "PhaseConfig"("key");
CREATE UNIQUE INDEX "WorkTypeConfig_key_key" ON "WorkTypeConfig"("key");
COMMIT;
