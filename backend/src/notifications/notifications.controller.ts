import { Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UtilisateurCourant } from '../auth/utilisateur-courant.decorator';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  mesNotifications(@UtilisateurCourant() utilisateur: any) {
    return this.notificationsService.mesNotifications(utilisateur.id);
  }

  @Patch(':id/lu')
  marquerLue(@UtilisateurCourant() utilisateur: any, @Param('id') id: string) {
    return this.notificationsService.marquerLue(utilisateur.id, id);
  }

  @Post('tout-lire')
  toutMarquerLu(@UtilisateurCourant() utilisateur: any) {
    return this.notificationsService.toutMarquerLu(utilisateur.id);
  }
}
