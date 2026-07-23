import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreerAvisDto } from './dto/avis.dto';

@Injectable()
export class AvisService {
  constructor(private prisma: PrismaService) {}

  async creer(clientId: string, dto: CreerAvisDto) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: dto.reservationId },
      include: { avis: true },
    });
    if (!reservation) {
      throw new NotFoundException('Réservation introuvable.');
    }
    // Seul le client de la réservation peut la noter
    if (reservation.clientId !== clientId) {
      throw new ForbiddenException("Cette réservation n'est pas la vôtre.");
    }
    // On ne note qu'une prestation réellement reçue
    if (!['validee', 'payee_cloturee'].includes(reservation.statut)) {
      throw new BadRequestException(
        'Vous ne pouvez noter qu’une réservation validée.',
      );
    }
    // Un seul avis par réservation
    if (reservation.avis) {
      throw new ConflictException('Cette réservation a déjà un avis.');
    }

    return this.prisma.avis.create({
      data: {
        reservationId: dto.reservationId,
        note: dto.note,
        commentaire: dto.commentaire,
      },
    });
  }

  // PUBLIC : les avis d'un prestataire (via ses prestations -> réservations)
  async avisPrestataire(prestataireId: string) {
    return this.prisma.avis.findMany({
      where: {
        reservation: { prestation: { prestataireId } },
      },
      orderBy: { creeLe: 'desc' },
      include: {
        reservation: {
          include: {
            prestation: { select: { titre: true } },
            client: { select: { nom: true } },
          },
        },
      },
    });
  }

  // PUBLIC : note moyenne d'un prestataire
  async moyenne(prestataireId: string) {
    const resultat = await this.prisma.avis.aggregate({
      where: {
        reservation: { prestation: { prestataireId } },
      },
      _avg: { note: true },
      _count: { note: true },
    });
    return {
      moyenne: resultat._avg.note ?? null,
      nombreAvis: resultat._count.note,
    };
  }
}