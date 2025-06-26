-- CreateTable
CREATE TABLE "github_bind" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "installationId" INTEGER NOT NULL,
    "repo" TEXT NOT NULL
);
