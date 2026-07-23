import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreneauxService } from './creneaux.service';
import { CreerCreneauDto } from './dto/creneau.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UtilisateurCourant } from '../auth/utilisateur-courant.decorator';

@UseGuards(JwtAuthGuard)
@Controller('creneaux')
export class CreneauxController {
  constructor(private creneauxService: CreneauxService) {}

  @Post()
  creer(@UtilisateurCourant() utilisateur: any, @Body() dto: CreerCreneauDto) {
    return this.creneauxService.creer(utilisateur.id, dto);
  }

  @Get('mes-creneaux')
  mesCreneaux(@UtilisateurCourant() utilisateur: any) {
    return this.creneauxService.mesCreneaux(utilisateur.id);
  }

  @Get('prestataire/:id')
  creneauxLibres(@Param('id') id: string) {
    return this.creneauxService.creneauxLibres(id);
  }

  @Delete(':id')
  supprimer(@UtilisateurCourant() utilisateur: any, @Param('id') id: string) {
    return this.creneauxService.supprimer(utilisateur.id, id);
  }
}