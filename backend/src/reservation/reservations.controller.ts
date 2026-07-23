import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreerReservationDto } from './dto/reservation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UtilisateurCourant } from '../auth/utilisateur-courant.decorator';

@UseGuards(JwtAuthGuard)
@Controller('reservations')
export class ReservationsController {
  constructor(private reservationsService: ReservationsService) {}

  @Post()
  creer(@UtilisateurCourant() u: any, @Body() dto: CreerReservationDto) {
    return this.reservationsService.creer(u.id, dto);
  }

  @Get('mes-reservations')
  mesReservations(@UtilisateurCourant() u: any) {
    return this.reservationsService.mesReservations(u.id);
  }

  @Get('demandes-recues')
  demandesRecues(@UtilisateurCourant() u: any) {
    return this.reservationsService.demandesRecues(u.id);
  }

  @Patch(':id/confirmer')
  confirmer(@UtilisateurCourant() u: any, @Param('id') id: string) {
    return this.reservationsService.confirmer(u.id, id);
  }

  @Patch(':id/refuser')
  refuser(@UtilisateurCourant() u: any, @Param('id') id: string) {
    return this.reservationsService.refuser(u.id, id);
  }

  @Patch(':id/demarrer')
  demarrer(@UtilisateurCourant() u: any, @Param('id') id: string) {
    return this.reservationsService.demarrer(u.id, id);
  }

  @Patch(':id/terminer')
  terminer(@UtilisateurCourant() u: any, @Param('id') id: string) {
    return this.reservationsService.terminer(u.id, id);
  }

  @Patch(':id/valider')
  valider(@UtilisateurCourant() u: any, @Param('id') id: string) {
    return this.reservationsService.valider(u.id, id);
  }

  @Patch(':id/annuler')
  annuler(@UtilisateurCourant() u: any, @Param('id') id: string) {
    return this.reservationsService.annuler(u.id, id);
  }
}