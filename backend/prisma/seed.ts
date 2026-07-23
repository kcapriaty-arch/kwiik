import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

interface DomaineSeed {
  nom: string;
  ordre: number;
  categories: string[];
}

const domaines: DomaineSeed[] = [
  {
    nom: 'Beauté & bien-être',
    ordre: 10,
    categories: [
      'Coiffure',
      'Barbier',
      'Onglerie',
      'Esthétique',
      'Maquillage',
      'Massage',
      'Spa',
      'Tatouage & piercing',
    ],
  },
  {
    nom: 'Maison & réparation',
    ordre: 20,
    categories: [
      'Plomberie',
      'Électricité',
      'Menuiserie',
      'Peinture',
      'Maçonnerie',
      'Serrurerie',
      'Climatisation',
      'Bricolage & dépannage',
    ],
  },
  {
    nom: 'Ménage & entretien',
    ordre: 30,
    categories: ['Ménage', 'Repassage', 'Nettoyage de vitres', 'Jardinage', 'Blanchisserie'],
  },
  {
    nom: 'Événementiel & traiteur',
    ordre: 40,
    categories: [
      'Traiteur',
      'Pâtisserie & gâteaux',
      "Organisation d'événements",
      'Location de matériel',
      'Décoration',
      'Photographe',
      'DJ & animation',
    ],
  },
  {
    nom: 'Auto & transport',
    ordre: 50,
    categories: ['Lavage auto', 'Mécanique', 'Transport & déménagement', 'Chauffeur'],
  },
  {
    nom: 'Santé & soins',
    ordre: 60,
    categories: ['Soins à domicile', 'Coaching sportif', 'Nutrition'],
  },
  {
    nom: 'Cours & services pro',
    ordre: 70,
    categories: [
      'Cours particuliers',
      'Informatique & dépannage',
      'Couture & retouches',
      'Traduction',
    ],
  },
];

async function main() {
  const abonnements = [
    {
      nom: 'Découverte',
      prixMois: 0,
      prioriteRang: 0,
      publiciteExterne: false,
    },
    {
      nom: 'Pro',
      prixMois: 5000,
      prioriteRang: 1,
      publiciteExterne: false,
    },
    {
      nom: 'Premium',
      prixMois: 15000,
      prioriteRang: 2,
      publiciteExterne: true,
    },
  ];

  for (const abonnement of abonnements) {
    await prisma.abonnement.upsert({
      where: { nom: abonnement.nom },
      update: abonnement,
      create: abonnement,
    });
  }

  for (const domaineSeed of domaines) {
    const domaine = await prisma.domaine.upsert({
      where: { nom: domaineSeed.nom },
      update: { ordre: domaineSeed.ordre },
      create: {
        nom: domaineSeed.nom,
        ordre: domaineSeed.ordre,
      },
    });

    for (const nomCategorie of domaineSeed.categories) {
      await prisma.categorie.upsert({
        where: { nom: nomCategorie },
        update: { domaineId: domaine.id },
        create: {
          nom: nomCategorie,
          domaineId: domaine.id,
        },
      });
    }
  }

  console.log('Abonnements seedes :', abonnements.map((a) => a.nom).join(', '));
  console.log(
    'Domaines/categories seedes :',
    domaines.map((d) => `${d.nom} (${d.categories.length})`).join(', '),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });