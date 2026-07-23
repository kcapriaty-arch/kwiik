-- CreateTable
CREATE TABLE "CodeVerification" (
    "id" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "codeHache" TEXT NOT NULL,
    "expireLe" TIMESTAMP(3) NOT NULL,
    "tentatives" INTEGER NOT NULL DEFAULT 0,
    "utilise" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodeVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CodeVerification_telephone_idx" ON "CodeVerification"("telephone");
