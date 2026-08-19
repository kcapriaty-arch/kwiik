import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ConversationsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async demarrer(utilisateurId: string, prestataireId: string) {
    const prestataire = await this.prisma.prestataire.findUnique({
      where: { id: prestataireId },
    });
    if (!prestataire) {
      throw new NotFoundException('Prestataire introuvable.');
    }
    if (prestataire.utilisateurId === utilisateurId) {
      throw new BadRequestException(
        'Vous ne pouvez pas démarrer une conversation avec vous-même.',
      );
    }

    return this.prisma.conversation.upsert({
      where: {
        clientId_prestataireId: { clientId: utilisateurId, prestataireId },
      },
      update: {},
      create: { clientId: utilisateurId, prestataireId },
    });
  }

  async mesConversations(utilisateurId: string) {
    const prestataire = await this.prisma.prestataire.findUnique({
      where: { utilisateurId },
    });

    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [
          { clientId: utilisateurId },
          ...(prestataire ? [{ prestataireId: prestataire.id }] : []),
        ],
      },
      orderBy: { creeLe: 'desc' },
      include: {
        client: { select: { nom: true } },
        prestataire: { include: { utilisateur: { select: { nom: true } } } },
        messages: { orderBy: { creeLe: 'desc' as const }, take: 1 },
      },
    });

    return Promise.all(
      conversations.map(async (conversation) => {
        const estClient = conversation.clientId === utilisateurId;
        const nonLus = await this.prisma.message.count({
          where: {
            conversationId: conversation.id,
            lu: false,
            expediteurId: { not: utilisateurId },
          },
        });

        return {
          id: conversation.id,
          autrePartie: estClient
            ? conversation.prestataire.utilisateur.nom
            : conversation.client.nom,
          prestataireId: conversation.prestataireId,
          dernierMessage: conversation.messages[0] ?? null,
          nonLus,
        };
      }),
    );
  }

  private async verifierParticipant(utilisateurId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { prestataire: true },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation introuvable.');
    }

    const estClient = conversation.clientId === utilisateurId;
    const estPrestataire = conversation.prestataire.utilisateurId === utilisateurId;

    if (!estClient && !estPrestataire) {
      throw new ForbiddenException('Vous ne participez pas à cette conversation.');
    }

    return { conversation, estClient, estPrestataire };
  }

  async messages(utilisateurId: string, conversationId: string) {
    await this.verifierParticipant(utilisateurId, conversationId);

    // Les messages de l'autre personne sont consideres lus des qu'on ouvre la conversation.
    await this.prisma.message.updateMany({
      where: { conversationId, expediteurId: { not: utilisateurId }, lu: false },
      data: { lu: true },
    });

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { creeLe: 'asc' },
    });
  }

  async envoyerMessage(utilisateurId: string, conversationId: string, contenu: string) {
    const { conversation, estClient } = await this.verifierParticipant(
      utilisateurId,
      conversationId,
    );

    const message = await this.prisma.message.create({
      data: { conversationId, expediteurId: utilisateurId, contenu },
    });

    const destinataireId = estClient
      ? conversation.prestataire.utilisateurId
      : conversation.clientId;

    try {
      await this.notifications.creer({
        utilisateurId: destinataireId,
        type: 'message',
        titre: 'Nouveau message',
        corps: contenu.length > 80 ? `${contenu.slice(0, 80)}...` : contenu,
        lienType: 'conversation',
        lienId: conversationId,
      });
    } catch {
      // Echec silencieux : le message est deja envoye avec succes.
    }

    return message;
  }
}
