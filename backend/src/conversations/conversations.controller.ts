import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UtilisateurCourant } from '../auth/utilisateur-courant.decorator';
import { ConversationsService } from './conversations.service';
import { DemarrerConversationDto, EnvoyerMessageDto } from './dto/conversation.dto';

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private conversationsService: ConversationsService) {}

  @Post('demarrer')
  demarrer(
    @UtilisateurCourant() utilisateur: any,
    @Body() dto: DemarrerConversationDto,
  ) {
    return this.conversationsService.demarrer(utilisateur.id, dto.prestataireId);
  }

  @Get()
  mesConversations(@UtilisateurCourant() utilisateur: any) {
    return this.conversationsService.mesConversations(utilisateur.id);
  }

  @Get(':id/messages')
  messages(@UtilisateurCourant() utilisateur: any, @Param('id') id: string) {
    return this.conversationsService.messages(utilisateur.id, id);
  }

  @Post(':id/messages')
  envoyerMessage(
    @UtilisateurCourant() utilisateur: any,
    @Param('id') id: string,
    @Body() dto: EnvoyerMessageDto,
  ) {
    return this.conversationsService.envoyerMessage(utilisateur.id, id, dto.contenu);
  }
}
