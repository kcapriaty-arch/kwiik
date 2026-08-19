-- CreateEnum
CREATE TYPE "TypeNotification" AS ENUM ('reservation', 'message', 'systeme');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "type" "TypeNotification" NOT NULL,
    "titre" TEXT NOT NULL,
    "corps" TEXT NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "lienType" TEXT,
    "lienId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_utilisateurId_idx" ON "Notification"("utilisateurId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
