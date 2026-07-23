import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AvisService } from './avis.service';
import { CreerAvisDto } from './dto/avis.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UtilisateurCourant } from '../auth/utilisateur-courant.decorator';

@Controller('avis')
export class AvisController {
  constructor(private avisService: AvisService) {}

  // Route PROTÉGÉE : déposer un avis
  @UseGuards(JwtAuthGuard)
  @Post()
  creer(@UtilisateurCourant() u: any, @Body() dto: CreerAvisDto) {
    return this.avisService.creer(u.id, dto);
  }

  // Routes PUBLIQUES
  @Get('prestataire/:id/moyenne')
  moyenne(@Param('id') id: string) {
    return this.avisService.moyenne(id);
  }

  @Get('prestataire/:id')
  avisPrestataire(@Param('id') id: string) {
    return this.avisService.avisPrestataire(id);
  }
}