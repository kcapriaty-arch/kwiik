-- AlterTable
ALTER TABLE "Prestataire" ADD COLUMN     "factureElectriciteUrl" TEXT,
ADD COLUMN     "proposeLocalAVendreOuLouer" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Utilisateur" ADD COLUMN     "appleId" TEXT,
ADD COLUMN     "emailConfirme" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "motDePasseHash" TEXT,
ALTER COLUMN "telephone" DROP NOT NULL;

-- DropTable
DROP TABLE "CodeVerification";

-- CreateTable
CREATE TABLE "CodeConfirmationEmail" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHache" TEXT NOT NULL,
    "expireLe" TIMESTAMP(3) NOT NULL,
    "tentatives" INTEGER NOT NULL DEFAULT 0,
    "utilise" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodeConfirmationEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CodeConfirmationEmail_email_idx" ON "CodeConfirmationEmail"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_appleId_key" ON "Utilisateur"("appleId");
