import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type Operateur = 'orange_money' | 'mtn_momo';

@Injectable()
export class PaiementsService {
  constructor(private prisma: PrismaService) {}

  // Appele par ReservationsService uniquement pour les reservations en_ligne.
  // Aucun vrai fournisseur de paiement n'est branche : la ligne Paiement sert
  // a rendre le concept reel (statut suivi, historique) en attendant une
  // integration Orange Money / MTN MoMo reelle.
  async creerPourReservation(reservationId: string, montant: number, operateur?: Operateur) {
    return this.prisma.paiement.create({
      data: {
        reservationId,
        montant,
        operateur,
        statut: 'en_attente',
      },
    });
  }

  async parReservation(utilisateurId: string, reservationId: string) {
    const paiement = await this.prisma.paiement.findUnique({
      where: { reservationId },
      include: { reservation: true },
    });
    if (!paiement) {
      throw new NotFoundException('Aucun paiement en ligne pour cette réservation.');
    }
    if (paiement.reservation.clientId !== utilisateurId) {
      throw new ForbiddenException("Ce paiement n'est pas le vôtre.");
    }
    return paiement;
  }

  // Endpoint de developpement : simule la reponse d'un operateur de paiement
  // mobile (comme le code SMS mocke de AuthService), en attendant une vraie
  // integration Orange Money / MTN MoMo.
  async simuler(utilisateurId: string, paiementId: string, resultat: 'reussi' | 'echoue') {
    const paiement = await this.prisma.paiement.findUnique({
      where: { id: paiementId },
      include: { reservation: true },
    });
    if (!paiement) {
      throw new NotFoundException('Paiement introuvable.');
    }
    if (paiement.reservation.clientId !== utilisateurId) {
      throw new ForbiddenException("Ce paiement n'est pas le vôtre.");
    }
    if (paiement.statut !== 'en_attente') {
      throw new BadRequestException('Ce paiement a déjà été traité.');
    }

    return this.prisma.paiement.update({
      where: { id: paiementId },
      data: { statut: resultat },
    });
  }
}
