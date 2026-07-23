import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreerCreneauDto } from './dto/creneau.dto';

@Injectable()
export class CreneauxService {
  constructor(private prisma: PrismaService) {}

  private async getPrestataire(utilisateurId: string) {
    const prestataire = await this.prisma.prestataire.findUnique({
      where: { utilisateurId },
    });
    if (!prestataire) {
      throw new ForbiddenException(
        'Vous devez être prestataire pour gérer des créneaux.',
      );
    }
    return prestataire;
  }

  async creer(utilisateurId: string, dto: CreerCreneauDto) {
    const prestataire = await this.getPrestataire(utilisateurId);

    const debut = new Date(dto.debut);
    const fin = new Date(dto.fin);

    // Contrôle 1 : la fin doit être strictement après le début
    if (fin <= debut) {
      throw new BadRequestException('La fin doit être après le début.');
    }

    // Contrôle 2 : aucun chevauchement avec un créneau existant du prestataire
    // Deux intervalles [a,b] et [c,d] se chevauchent si a < d ET c < b
    const chevauchement = await this.prisma.creneau.findFirst({
      where: {
        prestataireId: prestataire.id,
        debut: { lt: fin },
        fin: { gt: debut },
      },
    });
    if (chevauchement) {
      throw new BadRequestException(
        'Ce créneau en chevauche un autre déjà existant.',
      );
    }

    return this.prisma.creneau.create({
      data: {
        prestataireId: prestataire.id,
        debut,
        fin,
        // statut = "libre" par défaut (défini dans le schéma)
      },
    });
  }

  async mesCreneaux(utilisateurId: string) {
    const prestataire = await this.getPrestataire(utilisateurId);
    return this.prisma.creneau.findMany({
      where: { prestataireId: prestataire.id },
      orderBy: { debut: 'asc' },
    });
  }

  // Créneaux libres d'un prestataire donné (pour la réservation côté client)
  async creneauxLibres(prestataireId: string) {
    return this.prisma.creneau.findMany({
      where: { prestataireId, statut: 'libre' },
      orderBy: { debut: 'asc' },
    });
  }

  async supprimer(utilisateurId: string, creneauId: string) {
    const prestataire = await this.getPrestataire(utilisateurId);

    const creneau = await this.prisma.creneau.findUnique({
      where: { id: creneauId },
    });
    if (!creneau) {
      throw new NotFoundException('Créneau introuvable.');
    }
    if (creneau.prestataireId !== prestataire.id) {
      throw new ForbiddenException('Ce créneau ne vous appartient pas.');
    }
    // On empêche de supprimer un créneau déjà réservé
    if (creneau.statut === 'reserve') {
      throw new BadRequestException(
        'Impossible de supprimer un créneau réservé.',
      );
    }

    await this.prisma.creneau.delete({ where: { id: creneauId } });
    return { message: 'Créneau supprimé.' };
  }
}