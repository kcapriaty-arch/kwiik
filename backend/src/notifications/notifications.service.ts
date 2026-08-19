import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type TypeNotification = 'reservation' | 'message' | 'systeme';

interface CreerNotificationInput {
  utilisateurId: string;
  type: TypeNotification;
  titre: string;
  corps: string;
  lienType?: string;
  lienId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // Utilisee par d'autres services (reservations, messages...) pour creer une
  // notification en plus de leur propre ecriture metier, sans dependre d'eux.
  async creer(input: CreerNotificationInput) {
    return this.prisma.notification.create({
      data: {
        utilisateurId: input.utilisateurId,
        type: input.type,
        titre: input.titre,
        corps: input.corps,
        lienType: input.lienType,
        lienId: input.lienId,
      },
    });
  }

  async mesNotifications(utilisateurId: string) {
    return this.prisma.notification.findMany({
      where: { utilisateurId },
      orderBy: { creeLe: 'desc' },
    });
  }

  async marquerLue(utilisateurId: string, notificationId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, utilisateurId },
      data: { lu: true },
    });
    return { message: 'Notification marquee comme lue.' };
  }

  async toutMarquerLu(utilisateurId: string) {
    await this.prisma.notification.updateMany({
      where: { utilisateurId, lu: false },
      data: { lu: true },
    });
    return { message: 'Toutes les notifications ont ete marquees comme lues.' };
  }
}
