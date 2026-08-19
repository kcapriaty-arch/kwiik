-- CreateTable
CREATE TABLE "Favori" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "prestataireId" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favori_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Favori_utilisateurId_prestataireId_key" ON "Favori"("utilisateurId", "prestataireId");

-- AddForeignKey
ALTER TABLE "Favori" ADD CONSTRAINT "Favori_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favori" ADD CONSTRAINT "Favori_prestataireId_fkey" FOREIGN KEY ("prestataireId") REFERENCES "Prestataire"("id") ON DELETE CASCADE ON UPDATE CASCADE;
