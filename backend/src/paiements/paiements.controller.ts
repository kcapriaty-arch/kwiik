import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UtilisateurCourant } from '../auth/utilisateur-courant.decorator';
import { PaiementsService } from './paiements.service';
import { SimulerPaiementDto } from './dto/paiement.dto';

@UseGuards(JwtAuthGuard)
@Controller('paiements')
export class PaiementsController {
  constructor(private paiementsService: PaiementsService) {}

  @Get('reservation/:reservationId')
  parReservation(
    @UtilisateurCourant() utilisateur: any,
    @Param('reservationId') reservationId: string,
  ) {
    return this.paiementsService.parReservation(utilisateur.id, reservationId);
  }

  @Post(':id/simuler')
  simuler(
    @UtilisateurCourant() utilisateur: any,
    @Param('id') id: string,
    @Body() dto: SimulerPaiementDto,
  ) {
    return this.paiementsService.simuler(utilisateur.id, id, dto.resultat);
  }
}
