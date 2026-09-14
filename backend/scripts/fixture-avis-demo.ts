// Script ponctuel (audit RNCP) : cree un avis de demonstration sur un
// prestataire deja seede, pour que l'etoile de notation soit visible a
// l'ecran Decouverte lors des captures d'ecran. Donnees fictives uniquement.
import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const prestataire = await prisma.prestataire.findFirst({ include: { prestations: true } });
  if (!prestataire) throw new Error('Aucun prestataire seede trouve.');

  const client = await prisma.utilisateur.create({
    data: { nom: 'Client Demo Avis', email: `client-avis-${Date.now()}@example.local`, role: 'client' },
  });

  let prestation = prestataire.prestations[0];
  if (!prestation) {
    prestation = await prisma.prestation.create({
      data: { prestataireId: prestataire.id, titre: 'Prestation demo', prix: 15000, dureeMin: 60 },
    });
  }

  const creneau = await prisma.creneau.create({
    data: {
      prestataireId: prestataire.id,
      debut: new Date(Date.now() - 7200_000),
      fin: new Date(Date.now() - 3600_000),
      statut: 'reserve',
    },
  });

  const reservation = await prisma.reservation.create({
    data: {
      clientId: client.id,
      prestationId: prestation.id,
      creneauId: creneau.id,
      modePaiement: 'a_la_livraison',
      statut: 'validee',
    },
  });

  await prisma.avis.create({
    data: { reservationId: reservation.id, note: 5, commentaire: 'Tres bon service (donnee de demonstration).' },
  });

  console.log(`Avis cree pour le prestataire ${prestataire.id} (${prestataire.ville}).`);
  console.log(`Recharge la page Decouverte pour voir l'etoile de notation.`);
}

main().finally(() => prisma.$disconnect());
