import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class FavorisService {
  constructor(private prisma: PrismaService) {}

  async basculer(utilisateurId: string, prestataireId: string) {
    const prestataire = await this.prisma.prestataire.findUnique({
      where: { id: prestataireId },
    });
    if (!prestataire) {
      throw new NotFoundException('Prestataire introuvable.');
    }

    const existant = await this.prisma.favori.findUnique({
      where: { utilisateurId_prestataireId: { utilisateurId, prestataireId } },
    });

    if (existant) {
      await this.prisma.favori.delete({ where: { id: existant.id } });
      return { favori: false };
    }

    await this.prisma.favori.create({ data: { utilisateurId, prestataireId } });
    return { favori: true };
  }

  async mesFavoris(utilisateurId: string) {
    const favoris = await this.prisma.favori.findMany({
      where: { utilisateurId },
      orderBy: { creeLe: 'desc' },
      include: {
        prestataire: {
          include: {
            abonnement: true,
            categories: { include: { domaine: true } },
            prestations: true,
            utilisateur: { select: { nom: true } },
          },
        },
      },
    });

    return Promise.all(
      favoris.map(async ({ prestataire }) => {
        const agg = await this.prisma.avis.aggregate({
          where: { reservation: { prestation: { prestataireId: prestataire.id } } },
          _avg: { note: true },
          _count: { note: true },
        });
        return {
          ...prestataire,
          noteMoyenne: agg._avg.note,
          nombreAvis: agg._count.note,
        };
      }),
    );
  }

  async mesIdsFavoris(utilisateurId: string): Promise<string[]> {
    const favoris = await this.prisma.favori.findMany({
      where: { utilisateurId },
      select: { prestataireId: true },
    });
    return favoris.map((f) => f.prestataireId);
  }
}
