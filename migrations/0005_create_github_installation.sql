-- CreateTable
CREATE TABLE "github_installation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "installationId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_github_bind" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "repo" TEXT
);
INSERT INTO "new_github_bind" ("createdAt", "id", "repo") SELECT "createdAt", "id", "repo" FROM "github_bind";
DROP TABLE "github_bind";
ALTER TABLE "new_github_bind" RENAME TO "github_bind";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "github_installation_userId_installationId_key" ON "github_installation"("userId", "installationId");
