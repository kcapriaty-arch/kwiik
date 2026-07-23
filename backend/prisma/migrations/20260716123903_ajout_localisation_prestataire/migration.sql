-- AlterTable
ALTER TABLE "Prestataire" ADD COLUMN     "quartier" TEXT,
ADD COLUMN     "ville" TEXT NOT NULL DEFAULT 'Douala';
