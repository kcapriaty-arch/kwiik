import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreerPrestationDto } from './dto/prestation.dto';

@Injectable()
export class PrestationsService {
  constructor(private prisma: PrismaService) {}

  private async getPrestataire(utilisateurId: string) {
    const prestataire = await this.prisma.prestataire.findUnique({
      where: { utilisateurId },
    });
    if (!prestataire) {
      throw new ForbiddenException(
        'Vous devez être prestataire pour gérer des prestations.',
      );
    }
    return prestataire;
  }

  async creer(utilisateurId: string, dto: CreerPrestationDto) {
    const prestataire = await this.getPrestataire(utilisateurId);

    return this.prisma.prestation.create({
      data: {
        prestataireId: prestataire.id,
        titre: dto.titre,
        description: dto.description,
        photoUrl: dto.photoUrl,
        prix: dto.prix,
        dureeMin: dto.dureeMin,
      },
    });
  }

  async mesPrestations(utilisateurId: string) {
    const prestataire = await this.getPrestataire(utilisateurId);
    return this.prisma.prestation.findMany({
      where: { prestataireId: prestataire.id },
      orderBy: { titre: 'asc' },
    });
  }

  async supprimer(utilisateurId: string, prestationId: string) {
    const prestataire = await this.getPrestataire(utilisateurId);

    const prestation = await this.prisma.prestation.findUnique({
      where: { id: prestationId },
    });
    if (!prestation) {
      throw new NotFoundException('Prestation introuvable.');
    }
    if (prestation.prestataireId !== prestataire.id) {
      throw new ForbiddenException('Cette prestation ne vous appartient pas.');
    }

    await this.prisma.prestation.delete({ where: { id: prestationId } });
    return { message: 'Prestation supprimée.' };
  }
}