-- CreateEnum
CREATE TYPE "ModeService" AS ENUM ('adresse_fixe', 'a_domicile', 'en_ligne');

-- AlterTable
ALTER TABLE "Categorie" ADD COLUMN     "licenceRequise" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Prestataire" ADD COLUMN     "licenceUrl" TEXT,
ADD COLUMN     "modeService" "ModeService";

-- AlterTable
ALTER TABLE "Utilisateur" ADD COLUMN     "cniRectoUrl" TEXT,
ADD COLUMN     "cniVersoUrl" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "photoProfilUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");
