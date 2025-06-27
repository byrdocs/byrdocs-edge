PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_github_bind" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "installationId" INTEGER NOT NULL,
    "repo" TEXT
);
INSERT INTO "new_github_bind" ("createdAt", "id", "installationId", "repo") SELECT "createdAt", "id", "installationId", "repo" FROM "github_bind";
DROP TABLE "github_bind";
ALTER TABLE "new_github_bind" RENAME TO "github_bind";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
