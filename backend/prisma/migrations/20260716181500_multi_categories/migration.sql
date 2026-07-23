/*
  Warnings:

  - The `categorie` column on the `Prestataire` table is dropped. Existing text values are replaced by the new many-to-many category relation going forward.
*/

-- CreateTable
CREATE TABLE "Domaine" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Domaine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categorie" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "domaineId" TEXT NOT NULL,

    CONSTRAINT "Categorie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategorieToPrestataire" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- AlterTable
ALTER TABLE "Prestataire" DROP COLUMN "categorie";

-- CreateIndex
CREATE UNIQUE INDEX "Domaine_nom_key" ON "Domaine"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Categorie_nom_key" ON "Categorie"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "_CategorieToPrestataire_AB_unique" ON "_CategorieToPrestataire"("A", "B");

-- CreateIndex
CREATE INDEX "_CategorieToPrestataire_B_index" ON "_CategorieToPrestataire"("B");

-- AddForeignKey
ALTER TABLE "Categorie" ADD CONSTRAINT "Categorie_domaineId_fkey" FOREIGN KEY ("domaineId") REFERENCES "Domaine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategorieToPrestataire" ADD CONSTRAINT "_CategorieToPrestataire_A_fkey" FOREIGN KEY ("A") REFERENCES "Categorie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategorieToPrestataire" ADD CONSTRAINT "_CategorieToPrestataire_B_fkey" FOREIGN KEY ("B") REFERENCES "Prestataire"("id") ON DELETE CASCADE ON UPDATE CASCADE;