import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreerReservationDto } from './dto/reservation.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { PaiementsService } from '../paiements/paiements.service';

@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private paiements: PaiementsService,
  ) {}

  // Une notification ratee ne doit jamais faire echouer l'action metier
  // (confirmation, annulation...) qui vient de reussir.
  private async notifier(
    utilisateurId: string,
    titre: string,
    corps: string,
    reservationId: string,
  ): Promise<void> {
    try {
      await this.notifications.creer({
        utilisateurId,
        type: 'reservation',
        titre,
        corps,
        lienType: 'reservation',
        lienId: reservationId,
      });
    } catch {
      // Echec silencieux : la reservation elle-meme a deja ete traitee avec succes.
    }
  }

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
    if (creneau.debut < new Date()) {
      throw new BadRequestException('Ce créneau est déjà passé.');
    }

    const prestataire = await this.prisma.prestataire.findUnique({
      where: { id: prestation.prestataireId },
    });
    if (prestataire?.utilisateurId === clientId) {
      throw new BadRequestException(
        'Vous ne pouvez pas réserver votre propre prestation.',
      );
    }

    const nouvelle = await this.prisma.reservation.create({
      data: {
        clientId,
        prestationId: dto.prestationId,
        creneauId: dto.creneauId,
        modePaiement: dto.modePaiement,
        note: dto.note?.trim() || undefined,
      },
      include: { prestation: true, creneau: true },
    });

    if (dto.modePaiement === 'en_ligne') {
      await this.paiements.creerPourReservation(nouvelle.id, prestation.prix, dto.operateur);
    }

    if (prestataire) {
      await this.notifier(
        prestataire.utilisateurId,
        'Nouvelle demande de réservation',
        `Vous avez reçu une nouvelle demande pour "${prestation.titre}".`,
        nouvelle.id,
      );
    }

    return nouvelle;
  }

  async mesReservations(clientId: string) {
    return this.prisma.reservation.findMany({
      where: { clientId },
      orderBy: { creeLe: 'desc' },
      include: { prestation: true, creneau: true, avis: true },
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

    return this.prisma.$transaction(async (tx) => {
      // Verrou optimiste : ne bascule le creneau que s'il est encore libre.
      // Si une autre confirmation concurrente l'a deja pris, count === 0.
      const creneauVerrouille = await tx.creneau.updateMany({
        where: { id: reservation.creneauId, statut: 'libre' },
        data: { statut: 'reserve' },
      });
      if (creneauVerrouille.count === 0) {
        throw new ConflictException(
          'Ce créneau vient d’être confirmé pour une autre réservation.',
        );
      }

      // Meme principe sur la reservation elle-meme, au cas ou elle aurait
      // deja ete traitee entre le chargement et l'entree dans la transaction.
      const reservationVerrouillee = await tx.reservation.updateMany({
        where: { id: reservationId, statut: 'en_attente' },
        data: { statut: 'confirmee' },
      });
      if (reservationVerrouillee.count === 0) {
        throw new ConflictException('Cette réservation a déjà été traitée.');
      }

      await tx.reservation.updateMany({
        where: {
          creneauId: reservation.creneauId,
          statut: 'en_attente',
          id: { not: reservationId },
        },
        data: { statut: 'annulee' },
      });

      if (estDecouverte) {
        await tx.prestataire.update({
          where: { id: prestataire.id },
          data: { rdvGratuitsRestants: { decrement: 1 } },
        });
      }

      return tx.reservation.findUniqueOrThrow({
        where: { id: reservationId },
        include: { prestation: true, creneau: true },
      });
    }).then(async (confirmee) => {
      await this.notifier(
        confirmee.clientId,
        'Réservation confirmée',
        `Votre réservation pour "${confirmee.prestation.titre}" a été confirmée.`,
        confirmee.id,
      );
      return confirmee;
    });
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
    const refusee = await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { statut: 'annulee' },
    });

    await this.notifier(
      reservation.clientId,
      'Réservation refusée',
      `Votre demande pour "${reservation.prestation.titre}" a été refusée par le prestataire.`,
      reservation.id,
    );

    return refusee;
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
    const terminee = await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { statut: 'terminee' },
    });

    await this.notifier(
      reservation.clientId,
      'Service terminé',
      `Votre prestation "${reservation.prestation.titre}" est terminée. Pensez à laisser un avis !`,
      reservation.id,
    );

    return terminee;
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

    if (estClient && prestataire) {
      await this.notifier(
        prestataire.utilisateurId,
        'Réservation annulée',
        `Le client a annulé sa réservation pour "${reservation.prestation.titre}".`,
        reservation.id,
      );
    } else if (estPrestataire) {
      await this.notifier(
        reservation.clientId,
        'Réservation annulée',
        `Le prestataire a annulé la réservation pour "${reservation.prestation.titre}".`,
        reservation.id,
      );
    }

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