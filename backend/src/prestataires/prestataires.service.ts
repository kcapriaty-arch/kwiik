import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreerPrestataireDto, ModifierPrestataireDto } from './dto/prestataire.dto';

@Injectable()
export class PrestatairesService {
  constructor(private prisma: PrismaService) {}

  private donneesProfilPrive(dto: ModifierPrestataireDto) {
    const donnees: Record<string, string> = {};

    if (dto.telephonePro !== undefined) {
      donnees.telephonePro = dto.telephonePro;
    }
    if (dto.email !== undefined) {
      donnees.email = dto.email;
    }
    if (dto.photoProfilPriveeUrl !== undefined) {
      donnees.photoProfilPriveeUrl = dto.photoProfilPriveeUrl;
    }
    if (dto.cniRectoUrl !== undefined) {
      donnees.cniRectoUrl = dto.cniRectoUrl;
    }
    if (dto.cniVersoUrl !== undefined) {
      donnees.cniVersoUrl = dto.cniVersoUrl;
    }

    return donnees;
  }

  async devenirPrestataire(utilisateurId: string, dto: CreerPrestataireDto) {
    const existant = await this.prisma.prestataire.findUnique({
      where: { utilisateurId },
    });
    if (existant) {
      throw new ConflictException('Vous etes deja prestataire.');
    }

    const decouverte = await this.prisma.abonnement.findUnique({
      where: { nom: 'Decouverte' },
    });

    return this.prisma.prestataire.create({
      data: {
        utilisateurId,
        categories: {
          connect: dto.categorieIds.map((id: string) => ({ id })),
        },
        ville: dto.ville,
        quartier: dto.quartier,
        adresse: dto.adresse,
        description: dto.description,
        photoLieuUrl: dto.photoLieuUrl,
        photosBoutique: dto.photosBoutique ?? [],
        abonnementId: decouverte?.id,
      },
      include: {
        abonnement: true,
        categories: { include: { domaine: true } },
      },
    });
  }

  async maVitrine(utilisateurId: string) {
    const prestataire = await this.prisma.prestataire.findUnique({
      where: { utilisateurId },
      include: {
        abonnement: true,
        prestations: true,
        creneaux: true,
        categories: { include: { domaine: true } },
        utilisateur: { select: { nom: true, telephone: true } },
        profilPrive: true,
      },
    });
    if (!prestataire) {
      throw new NotFoundException("Vous n'etes pas encore prestataire.");
    }
    return prestataire;
  }

  async modifierMaVitrine(utilisateurId: string, dto: ModifierPrestataireDto) {
    const prestataire = await this.prisma.prestataire.findUnique({
      where: { utilisateurId },
      select: { id: true },
    });

    if (!prestataire) {
      throw new NotFoundException("Vous n'etes pas encore prestataire.");
    }

    const donneesPrivees = this.donneesProfilPrive(dto);
    const data: any = {};

    if (dto.ville !== undefined) {
      data.ville = dto.ville;
    }
    if (dto.quartier !== undefined) {
      data.quartier = dto.quartier;
    }
    if (dto.adresse !== undefined) {
      data.adresse = dto.adresse;
    }
    if (dto.description !== undefined) {
      data.description = dto.description;
    }
    if (dto.photoLieuUrl !== undefined) {
      data.photoLieuUrl = dto.photoLieuUrl;
    }
    if (dto.photosBoutique !== undefined) {
      data.photosBoutique = dto.photosBoutique;
    }

    if (Object.keys(donneesPrivees).length > 0) {
      data.profilPrive = {
        upsert: {
          create: donneesPrivees,
          update: donneesPrivees,
        },
      };
    }

    return this.prisma.prestataire.update({
      where: { id: prestataire.id },
      data,
      include: {
        abonnement: true,
        prestations: true,
        creneaux: true,
        categories: { include: { domaine: true } },
        utilisateur: { select: { nom: true, telephone: true } },
        profilPrive: true,
      },
    });
  }

  async lister(categorie?: string, ville?: string) {
    const prestataires = await this.prisma.prestataire.findMany({
      where: {
        ...(categorie && {
          categories: {
            some: {
              nom: { equals: categorie, mode: 'insensitive' },
            },
          },
        }),
        ...(ville && { ville: { contains: ville, mode: 'insensitive' } }),
      },
      include: {
        abonnement: true,
        categories: { include: { domaine: true } },
        prestations: true,
        utilisateur: { select: { nom: true } },
      },
      orderBy: [
        { abonnement: { prioriteRang: 'desc' } },
        { creeLe: 'asc' },
      ],
    });

    const avecNotes = await Promise.all(
      prestataires.map(async (p) => {
        const agg = await this.prisma.avis.aggregate({
          where: { reservation: { prestation: { prestataireId: p.id } } },
          _avg: { note: true },
          _count: { note: true },
        });
        return {
          ...p,
          noteMoyenne: agg._avg.note,
          nombreAvis: agg._count.note,
        };
      }),
    );

    return avecNotes;
  }

  async categories() {
    return this.prisma.categorie.findMany({
      include: { domaine: true },
      orderBy: [{ domaine: { ordre: 'asc' } }, { nom: 'asc' }],
    });
  }

  async villes() {
    const resultats = await this.prisma.prestataire.findMany({
      distinct: ['ville'],
      select: { ville: true },
      orderBy: { ville: 'asc' },
    });
    return resultats.map((r) => r.ville);
  }

  async domaines() {
    return this.prisma.domaine.findMany({
      include: {
        categories: { orderBy: { nom: 'asc' } },
      },
      orderBy: [{ ordre: 'asc' }, { nom: 'asc' }],
    });
  }

  async vitrinePublique(id: string) {
    const prestataire = await this.prisma.prestataire.findUnique({
      where: { id },
      include: {
        abonnement: true,
        categories: { include: { domaine: true } },
        prestations: true,
        utilisateur: { select: { nom: true } },
        creneaux: {
          where: { statut: 'libre' },
          orderBy: { debut: 'asc' },
        },
      },
    });
    if (!prestataire) {
      throw new NotFoundException('Prestataire introuvable.');
    }
    return prestataire;
  }
}