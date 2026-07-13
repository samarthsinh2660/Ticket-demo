-- CreateTable
CREATE TABLE "attachments" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "storedFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
