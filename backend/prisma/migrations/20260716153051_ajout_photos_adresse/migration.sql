-- AlterTable
ALTER TABLE "Prestataire" ADD COLUMN     "adresse" TEXT,
ADD COLUMN     "photoLieuUrl" TEXT;

-- AlterTable
ALTER TABLE "Prestation" ADD COLUMN     "photoUrl" TEXT;
