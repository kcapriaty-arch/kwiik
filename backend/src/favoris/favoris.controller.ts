import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UtilisateurCourant } from '../auth/utilisateur-courant.decorator';
import { FavorisService } from './favoris.service';

@UseGuards(JwtAuthGuard)
@Controller('favoris')
export class FavorisController {
  constructor(private favorisService: FavorisService) {}

  @Post(':prestataireId')
  basculer(
    @UtilisateurCourant() utilisateur: any,
    @Param('prestataireId') prestataireId: string,
  ) {
    return this.favorisService.basculer(utilisateur.id, prestataireId);
  }

  @Get()
  mesFavoris(@UtilisateurCourant() utilisateur: any) {
    return this.favorisService.mesFavoris(utilisateur.id);
  }

  @Get('ids')
  mesIdsFavoris(@UtilisateurCourant() utilisateur: any) {
    return this.favorisService.mesIdsFavoris(utilisateur.id);
  }
}
