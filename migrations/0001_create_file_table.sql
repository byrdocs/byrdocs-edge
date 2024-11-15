-- CreateTable
CREATE TABLE "file" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "uploader" TEXT NOT NULL,
    "uploadTime" DATETIME,
    "status" TEXT NOT NULL CHECK ("status" IN ('Pending', 'Timeout', 'Expired', 'Error', 'Uploaded', 'Published')),
    "errorMessage" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "file_fileName_key" ON "file"("fileName");
