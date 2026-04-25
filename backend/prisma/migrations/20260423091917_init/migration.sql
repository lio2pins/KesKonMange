-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "ingredients" TEXT NOT NULL,
    "totalMinutes" INTEGER NOT NULL DEFAULT 0,
    "steps" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'a_tester',
    "type" TEXT NOT NULL DEFAULT 'semaine',
    "weekendCategory" TEXT NOT NULL DEFAULT ''
);

-- CreateTable
CREATE TABLE "MenuWeek" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekStart" DATETIME NOT NULL,
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MenuSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "menuId" TEXT NOT NULL,
    "slotDate" DATETIME NOT NULL,
    "recipeId" TEXT,
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "MenuSlot_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "MenuWeek" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MenuSlot_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
