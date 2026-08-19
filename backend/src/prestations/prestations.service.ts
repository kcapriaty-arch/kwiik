import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreerPrestationDto, ModifierPrestationDto } from './dto/prestation.dto';

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

  async modifier(
    utilisateurId: string,
    prestationId: string,
    dto: ModifierPrestationDto,
  ) {
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

    return this.prisma.prestation.update({
      where: { id: prestationId },
      data: {
        ...(dto.titre !== undefined && { titre: dto.titre }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.photoUrl !== undefined && { photoUrl: dto.photoUrl }),
        ...(dto.prix !== undefined && { prix: dto.prix }),
        ...(dto.dureeMin !== undefined && { dureeMin: dto.dureeMin }),
      },
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