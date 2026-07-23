/*
  Warnings:

  - The `role` column on the `Utilisateur` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('client', 'prestataire', 'admin');

-- CreateEnum
CREATE TYPE "Langue" AS ENUM ('fr', 'en');

-- CreateEnum
CREATE TYPE "StatutCreneau" AS ENUM ('libre', 'reserve', 'indisponible');

-- CreateEnum
CREATE TYPE "StatutReservation" AS ENUM ('en_attente', 'confirmee', 'en_cours', 'terminee', 'validee', 'payee_cloturee', 'annulee', 'litige');

-- CreateEnum
CREATE TYPE "ModePaiement" AS ENUM ('en_ligne', 'a_la_livraison');

-- CreateEnum
CREATE TYPE "StatutPaiement" AS ENUM ('en_attente', 'reussi', 'echoue', 'rembourse');

-- CreateEnum
CREATE TYPE "Operateur" AS ENUM ('orange_money', 'mtn_momo');

-- AlterTable
ALTER TABLE "Utilisateur" ADD COLUMN     "langue" "Langue" NOT NULL DEFAULT 'fr',
DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'client';

-- CreateTable
CREATE TABLE "Prestataire" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "description" TEXT,
    "rdvGratuitsRestants" INTEGER NOT NULL DEFAULT 10,
    "lienPartage" TEXT,
    "verifie" BOOLEAN NOT NULL DEFAULT false,
    "abonnementId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prestataire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prestation" (
    "id" TEXT NOT NULL,
    "prestataireId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "prix" INTEGER NOT NULL,
    "dureeMin" INTEGER NOT NULL,

    CONSTRAINT "Prestation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Creneau" (
    "id" TEXT NOT NULL,
    "prestataireId" TEXT NOT NULL,
    "debut" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "statut" "StatutCreneau" NOT NULL DEFAULT 'libre',

    CONSTRAINT "Creneau_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "prestationId" TEXT NOT NULL,
    "creneauId" TEXT NOT NULL,
    "statut" "StatutReservation" NOT NULL DEFAULT 'en_attente',
    "modePaiement" "ModePaiement" NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paiement" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "montant" INTEGER NOT NULL,
    "operateur" "Operateur",
    "statut" "StatutPaiement" NOT NULL DEFAULT 'en_attente',
    "referenceExterne" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Abonnement" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prixMois" INTEGER NOT NULL,
    "prioriteRang" INTEGER NOT NULL DEFAULT 0,
    "publiciteExterne" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Abonnement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Avis" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "note" INTEGER NOT NULL,
    "commentaire" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Avis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Prestataire_utilisateurId_key" ON "Prestataire"("utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "Prestataire_lienPartage_key" ON "Prestataire"("lienPartage");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_creneauId_key" ON "Reservation"("creneauId");

-- CreateIndex
CREATE UNIQUE INDEX "Paiement_reservationId_key" ON "Paiement"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "Abonnement_nom_key" ON "Abonnement"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Avis_reservationId_key" ON "Avis"("reservationId");

-- AddForeignKey
ALTER TABLE "Prestataire" ADD CONSTRAINT "Prestataire_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prestataire" ADD CONSTRAINT "Prestataire_abonnementId_fkey" FOREIGN KEY ("abonnementId") REFERENCES "Abonnement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prestation" ADD CONSTRAINT "Prestation_prestataireId_fkey" FOREIGN KEY ("prestataireId") REFERENCES "Prestataire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Creneau" ADD CONSTRAINT "Creneau_prestataireId_fkey" FOREIGN KEY ("prestataireId") REFERENCES "Prestataire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_prestationId_fkey" FOREIGN KEY ("prestationId") REFERENCES "Prestation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_creneauId_fkey" FOREIGN KEY ("creneauId") REFERENCES "Creneau"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avis" ADD CONSTRAINT "Avis_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
