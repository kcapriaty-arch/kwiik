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

// Metiers exigeant l'upload d'une licence/certification a l'onboarding.
// Liste indicative a affiner avec le produit au fur et a mesure des metiers ajoutes.
const categoriesAvecLicence = new Set(['Esthétique', 'Massage', 'Électricité', 'Soins à domicile']);

interface PrestataireDemoSeed {
  telephone: string;
  nom: string;
  ville: string;
  quartier: string;
  adresse: string;
  description: string;
  categorieNom: string;
  modeService: 'adresse_fixe' | 'a_domicile' | 'en_ligne';
  photoLieuUrl: string;
  abonnementNom: string;
}

// Prestataires fictifs pour illustrer les vitrines avec de vraies photos en attendant
// l'arrivee de vrais prestataires. A completer au fur et a mesure des photos fournies.
const prestatairesDemo: PrestataireDemoSeed[] = [
  {
    telephone: '699000001',
    nom: 'Chantal Mbarga',
    ville: 'Douala',
    quartier: 'Bonapriso',
    adresse: 'Rue des Cocotiers, pres de la pharmacie Bonapriso',
    description:
      'Salon de coiffure haut de gamme specialise dans les coiffures naturelles, les chignons de ceremonie et les soins capillaires.',
    categorieNom: 'Coiffure',
    modeService: 'adresse_fixe',
    photoLieuUrl: '/uploads/demo-coiffure-salon.png',
    abonnementNom: 'Premium',
  },
  {
    telephone: '699000002',
    nom: 'Solange Eyenga',
    ville: 'Douala',
    quartier: 'Akwa',
    adresse: 'Intervention a domicile sur toute la zone Akwa - Bali',
    description:
      'Service de menage complet a domicile : entretien courant, grand nettoyage et remise en etat apres reception.',
    categorieNom: 'Ménage',
    modeService: 'a_domicile',
    photoLieuUrl: '/uploads/demo-menage.png',
    abonnementNom: 'Pro',
  },
  {
    telephone: '699000003',
    nom: 'Junior Talla',
    ville: 'Yaoundé',
    quartier: 'Bastos',
    adresse: 'Intervention a domicile sur Yaounde et environs',
    description:
      'Plombier experimente pour depannage, installation sanitaire et renovation de salle de bain, intervention rapide.',
    categorieNom: 'Plomberie',
    modeService: 'a_domicile',
    photoLieuUrl: '/uploads/demo-plomberie.png',
    abonnementNom: 'Pro',
  },
  {
    telephone: '699000004',
    nom: 'Aïcha Fouda',
    ville: 'Douala',
    quartier: 'Bonanjo',
    adresse: "Institut de beaute, Avenue de l'Independance, Bonanjo",
    description:
      'Institut de soins esthetiques haut de gamme : soins du visage, gommages et rituels de bien-etre sur mesure.',
    categorieNom: 'Esthétique',
    modeService: 'adresse_fixe',
    photoLieuUrl: '/uploads/demo-esthetique-spa.png',
    abonnementNom: 'Premium',
  },
  {
    telephone: '699000005',
    nom: 'Bruno Ateba',
    ville: 'Yaoundé',
    quartier: 'Nlongkak',
    adresse: 'Traiteur evenementiel, deplacement sur le lieu de reception',
    description:
      'Traiteur pour mariages, receptions et evenements d’entreprise : menus raffines et service haut de gamme sur site.',
    categorieNom: 'Traiteur',
    modeService: 'a_domicile',
    photoLieuUrl: '/uploads/demo-traiteur.png',
    abonnementNom: 'Premium',
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
      const licenceRequise = categoriesAvecLicence.has(nomCategorie);

      await prisma.categorie.upsert({
        where: { nom: nomCategorie },
        update: { domaineId: domaine.id, licenceRequise },
        create: {
          nom: nomCategorie,
          domaineId: domaine.id,
          licenceRequise,
        },
      });
    }
  }

  console.log('Abonnements seedes :', abonnements.map((a) => a.nom).join(', '));
  console.log(
    'Domaines/categories seedes :',
    domaines.map((d) => `${d.nom} (${d.categories.length})`).join(', '),
  );

  for (const demo of prestatairesDemo) {
    const categorie = await prisma.categorie.findUnique({ where: { nom: demo.categorieNom } });
    const abonnement = await prisma.abonnement.findUnique({ where: { nom: demo.abonnementNom } });

    if (!categorie || !abonnement) {
      console.warn(`Categorie ou abonnement introuvable pour le prestataire demo ${demo.nom}, ignore.`);
      continue;
    }

    const utilisateur = await prisma.utilisateur.upsert({
      where: { telephone: demo.telephone },
      update: { nom: demo.nom },
      create: { telephone: demo.telephone, nom: demo.nom },
    });

    await prisma.prestataire.upsert({
      where: { utilisateurId: utilisateur.id },
      update: {
        ville: demo.ville,
        quartier: demo.quartier,
        adresse: demo.adresse,
        description: demo.description,
        photoLieuUrl: demo.photoLieuUrl,
        photosBoutique: [demo.photoLieuUrl],
        modeService: demo.modeService,
        abonnementId: abonnement.id,
        verifie: true,
        categories: { set: [{ id: categorie.id }] },
      },
      create: {
        utilisateurId: utilisateur.id,
        ville: demo.ville,
        quartier: demo.quartier,
        adresse: demo.adresse,
        description: demo.description,
        photoLieuUrl: demo.photoLieuUrl,
        photosBoutique: [demo.photoLieuUrl],
        modeService: demo.modeService,
        abonnementId: abonnement.id,
        verifie: true,
        categories: { connect: [{ id: categorie.id }] },
      },
    });
  }

  console.log('Prestataires demo seedes :', prestatairesDemo.map((p) => p.nom).join(', '));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });