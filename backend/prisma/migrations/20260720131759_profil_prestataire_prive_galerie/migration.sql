-- AlterTable
ALTER TABLE "Prestataire" ADD COLUMN     "photosBoutique" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "_CategorieToPrestataire" ADD CONSTRAINT "_CategorieToPrestataire_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_CategorieToPrestataire_AB_unique";

-- CreateTable
CREATE TABLE "ProfilPrestatairePrive" (
    "id" TEXT NOT NULL,
    "prestataireId" TEXT NOT NULL,
    "telephonePro" TEXT,
    "email" TEXT,
    "photoProfilPriveeUrl" TEXT,
    "cniRectoUrl" TEXT,
    "cniVersoUrl" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfilPrestatairePrive_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfilPrestatairePrive_prestataireId_key" ON "ProfilPrestatairePrive"("prestataireId");

-- AddForeignKey
ALTER TABLE "ProfilPrestatairePrive" ADD CONSTRAINT "ProfilPrestatairePrive_prestataireId_fkey" FOREIGN KEY ("prestataireId") REFERENCES "Prestataire"("id") ON DELETE CASCADE ON UPDATE CASCADE;
