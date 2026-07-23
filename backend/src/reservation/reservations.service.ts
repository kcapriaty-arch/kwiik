import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreerReservationDto } from './dto/reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(private prisma: PrismaService) {}

  async creer(clientId: string, dto: CreerReservationDto) {
    const prestation = await this.prisma.prestation.findUnique({
      where: { id: dto.prestationId },
    });
    if (!prestation) throw new NotFoundException('Prestation introuvable.');

    const creneau = await this.prisma.creneau.findUnique({
      where: { id: dto.creneauId },
    });
    if (!creneau) throw new NotFoundException('Créneau introuvable.');

    if (prestation.prestataireId !== creneau.prestataireId) {
      throw new BadRequestException(
        'Cette prestation et ce créneau ne sont pas du même prestataire.',
      );
    }
    if (creneau.statut !== 'libre') {
      throw new BadRequestException("Ce créneau n'est plus disponible.");
    }

    const prestataire = await this.prisma.prestataire.findUnique({
      where: { id: prestation.prestataireId },
    });
    if (prestataire?.utilisateurId === clientId) {
      throw new BadRequestException(
        'Vous ne pouvez pas réserver votre propre prestation.',
      );
    }

    return this.prisma.reservation.create({
      data: {
        clientId,
        prestationId: dto.prestationId,
        creneauId: dto.creneauId,
        modePaiement: dto.modePaiement,
      },
      include: { prestation: true, creneau: true },
    });
  }

  async mesReservations(clientId: string) {
    return this.prisma.reservation.findMany({
      where: { clientId },
      orderBy: { creeLe: 'desc' },
      include: { prestation: true, creneau: true },
    });
  }

  async demandesRecues(utilisateurId: string) {
    const prestataire = await this.getPrestataire(utilisateurId);
    return this.prisma.reservation.findMany({
      where: { prestation: { prestataireId: prestataire.id } },
      orderBy: { creeLe: 'desc' },
      include: { prestation: true, creneau: true, client: true },
    });
  }

  async confirmer(utilisateurId: string, reservationId: string) {
    const { reservation, prestataire } = await this.chargerPourPrestataire(
      utilisateurId,
      reservationId,
    );
    if (reservation.statut !== 'en_attente') {
      throw new BadRequestException(
        'Seule une réservation en attente peut être confirmée.',
      );
    }

    const prestataireComplet = await this.prisma.prestataire.findUnique({
      where: { id: prestataire.id },
      include: { abonnement: true },
    });
    const estDecouverte =
      !prestataireComplet?.abonnement ||
      prestataireComplet.abonnement.nom === 'Découverte';

    if (estDecouverte && (prestataireComplet?.rdvGratuitsRestants ?? 0) <= 0) {
      throw new BadRequestException(
        'Quota de 10 réservations gratuites atteint. Passez à un abonnement Pro ou Premium pour continuer.',
      );
    }

    const operations: any[] = [
      this.prisma.reservation.update({
        where: { id: reservationId },
        data: { statut: 'confirmee' },
        include: { prestation: true, creneau: true },
      }),
      this.prisma.creneau.update({
        where: { id: reservation.creneauId },
        data: { statut: 'reserve' },
      }),
      this.prisma.reservation.updateMany({
        where: {
          creneauId: reservation.creneauId,
          statut: 'en_attente',
          id: { not: reservationId },
        },
        data: { statut: 'annulee' },
      }),
    ];

    if (estDecouverte) {
      operations.push(
        this.prisma.prestataire.update({
          where: { id: prestataire.id },
          data: { rdvGratuitsRestants: { decrement: 1 } },
        }),
      );
    }

    const [confirmee] = await this.prisma.$transaction(operations);
    return confirmee;
  }

  async refuser(utilisateurId: string, reservationId: string) {
    const { reservation } = await this.chargerPourPrestataire(
      utilisateurId,
      reservationId,
    );
    if (reservation.statut !== 'en_attente') {
      throw new BadRequestException(
        'Seule une réservation en attente peut être refusée.',
      );
    }
    return this.prisma.reservation.update({
      where: { id: reservationId },
      data: { statut: 'annulee' },
    });
  }

  async demarrer(utilisateurId: string, reservationId: string) {
    const { reservation } = await this.chargerPourPrestataire(
      utilisateurId,
      reservationId,
    );
    if (reservation.statut !== 'confirmee') {
      throw new BadRequestException(
        'Seule une réservation confirmée peut être démarrée.',
      );
    }
    return this.prisma.reservation.update({
      where: { id: reservationId },
      data: { statut: 'en_cours' },
    });
  }

  async terminer(utilisateurId: string, reservationId: string) {
    const { reservation } = await this.chargerPourPrestataire(
      utilisateurId,
      reservationId,
    );
    if (reservation.statut !== 'en_cours') {
      throw new BadRequestException(
        'Seule une réservation en cours peut être terminée.',
      );
    }
    return this.prisma.reservation.update({
      where: { id: reservationId },
      data: { statut: 'terminee' },
    });
  }

  async valider(clientId: string, reservationId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) throw new NotFoundException('Réservation introuvable.');
    if (reservation.clientId !== clientId) {
      throw new ForbiddenException("Cette réservation n'est pas la vôtre.");
    }
    if (reservation.statut !== 'terminee') {
      throw new BadRequestException(
        'Seule une réservation terminée peut être validée.',
      );
    }
    return this.prisma.reservation.update({
      where: { id: reservationId },
      data: { statut: 'validee' },
    });
  }

  async annuler(utilisateurId: string, reservationId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { prestation: true },
    });
    if (!reservation) throw new NotFoundException('Réservation introuvable.');

    const estClient = reservation.clientId === utilisateurId;
    const prestataire = await this.prisma.prestataire.findUnique({
      where: { id: reservation.prestation.prestataireId },
    });
    const estPrestataire = prestataire?.utilisateurId === utilisateurId;

    if (!estClient && !estPrestataire) {
      throw new ForbiddenException(
        "Vous n'êtes pas concerné par cette réservation.",
      );
    }
    if (!['en_attente', 'confirmee'].includes(reservation.statut)) {
      throw new BadRequestException(
        'Impossible d’annuler une réservation déjà démarrée.',
      );
    }

    const operations: any[] = [
      this.prisma.reservation.update({
        where: { id: reservationId },
        data: { statut: 'annulee' },
      }),
    ];
    if (reservation.statut === 'confirmee') {
      operations.push(
        this.prisma.creneau.update({
          where: { id: reservation.creneauId },
          data: { statut: 'libre' },
        }),
      );
    }
    const [annulee] = await this.prisma.$transaction(operations);
    return annulee;
  }

  private async getPrestataire(utilisateurId: string) {
    const prestataire = await this.prisma.prestataire.findUnique({
      where: { utilisateurId },
    });
    if (!prestataire) {
      throw new ForbiddenException('Vous devez être prestataire.');
    }
    return prestataire;
  }

  private async chargerPourPrestataire(
    utilisateurId: string,
    reservationId: string,
  ) {
    const prestataire = await this.getPrestataire(utilisateurId);
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { prestation: true },
    });
    if (!reservation) throw new NotFoundException('Réservation introuvable.');
    if (reservation.prestation.prestataireId !== prestataire.id) {
      throw new ForbiddenException(
        'Cette réservation ne concerne pas votre activité.',
      );
    }
    return { reservation, prestataire };
  }
}