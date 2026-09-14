// Preuve reproductible CT-01 : 8 requetes PATCH /reservations/:id/confirmer
// simultanees sur LA MEME reservation (cf. docs/PLAN_DE_TESTS.md, ligne 16).
//
// Prerequis :
//   - Une base Postgres de test accessible via DATABASE_URL (voir .env)
//   - Le serveur Nest demarre (npm run start:dev) sur http://localhost:3000
//
// Usage :
//   npx tsx scripts/ct01-concurrence-reservation.ts
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const API = process.env.API_URL ?? 'http://localhost:3000';

function signerToken(utilisateur: { id: string; email: string | null; role: string }) {
  return jwt.sign(
    { sub: utilisateur.id, email: utilisateur.email, role: utilisateur.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '1h' },
  );
}

async function main() {
  const suffixe = Date.now();

  const domaine = await prisma.domaine.create({ data: { nom: `Domaine test ${suffixe}`, ordre: 1 } });
  const categorie = await prisma.categorie.create({
    data: { nom: `Categorie test ${suffixe}`, domaineId: domaine.id },
  });

  const utilisateurPrestataire = await prisma.utilisateur.create({
    data: { nom: 'Prestataire Test', email: `prestataire-${suffixe}@test.local`, role: 'prestataire' },
  });
  const utilisateurClient = await prisma.utilisateur.create({
    data: { nom: 'Client Test', email: `client-${suffixe}@test.local`, role: 'client' },
  });

  const prestataire = await prisma.prestataire.create({
    data: {
      utilisateurId: utilisateurPrestataire.id,
      rdvGratuitsRestants: 10,
      categories: { connect: [{ id: categorie.id }] },
    },
  });

  const prestation = await prisma.prestation.create({
    data: { prestataireId: prestataire.id, titre: 'Prestation test', prix: 20, dureeMin: 30 },
  });

  const creneau = await prisma.creneau.create({
    data: {
      prestataireId: prestataire.id,
      debut: new Date(Date.now() + 3600_000),
      fin: new Date(Date.now() + 7200_000),
      statut: 'libre',
    },
  });

  const reservation = await prisma.reservation.create({
    data: {
      clientId: utilisateurClient.id,
      prestationId: prestation.id,
      creneauId: creneau.id,
      modePaiement: 'a_la_livraison',
      statut: 'en_attente',
    },
  });

  const tokenPrestataire = signerToken({
    id: utilisateurPrestataire.id,
    email: utilisateurPrestataire.email,
    role: 'prestataire',
  });

  console.log(`Reservation de test : ${reservation.id}`);
  console.log(`Creneau de test     : ${creneau.id} (statut initial: ${creneau.statut})`);
  console.log('Envoi de 8 requetes PATCH /reservations/:id/confirmer en parallele...\n');

  const requetes = Array.from({ length: 8 }, (_, i) =>
    fetch(`${API}/reservations/${reservation.id}/confirmer`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenPrestataire}` },
    }).then(async (res) => ({ i, status: res.status, body: await res.json().catch(() => null) })),
  );

  const resultats = await Promise.all(requetes);
  resultats.sort((a, b) => a.i - b.i);

  let succes = 0;
  let conflits = 0;
  let autres = 0;
  for (const r of resultats) {
    const marqueur = r.status === 200 ? 'SUCCES 200' : r.status === 409 ? 'CONFLIT 409' : `AUTRE ${r.status}`;
    console.log(`  requete #${r.i + 1} -> ${marqueur}`);
    if (r.status === 200) succes++;
    else if (r.status === 409) conflits++;
    else autres++;
  }

  const creneauFinal = await prisma.creneau.findUniqueOrThrow({ where: { id: creneau.id } });
  const reservationsFinales = await prisma.reservation.findMany({
    where: { creneauId: creneau.id },
  });
  const confirmees = reservationsFinales.filter((r) => r.statut === 'confirmee');

  console.log('\n--- Verification en base ---');
  console.log(`Statut final du creneau       : ${creneauFinal.statut}`);
  console.log(`Nombre de reservations confirmees sur ce creneau : ${confirmees.length}`);
  console.log(`\nBilan HTTP : ${succes} succes (200) / ${conflits} conflits (409) / ${autres} autres`);

  const conforme = succes === 1 && conflits === 7 && confirmees.length === 1 && creneauFinal.statut === 'reserve';
  console.log(conforme ? '\nRESULTAT : CONFORME (1 succes, 7 rejets 409, aucune double reservation)' : '\nRESULTAT : NON CONFORME - a examiner');

  // Nettoyage des donnees de test
  await prisma.reservation.deleteMany({ where: { creneauId: creneau.id } });
  await prisma.creneau.delete({ where: { id: creneau.id } });
  await prisma.prestation.delete({ where: { id: prestation.id } });
  await prisma.prestataire.delete({ where: { id: prestataire.id } });
  await prisma.utilisateur.deleteMany({ where: { id: { in: [utilisateurPrestataire.id, utilisateurClient.id] } } });
  await prisma.categorie.delete({ where: { id: categorie.id } });
  await prisma.domaine.delete({ where: { id: domaine.id } });

  process.exit(conforme ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
