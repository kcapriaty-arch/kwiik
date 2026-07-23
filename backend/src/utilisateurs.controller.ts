import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UtilisateursService } from './utilisateurs.service';
import { MajProfilDto } from './dto/utilisateur.dto';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { UtilisateurCourant } from './auth/utilisateur-courant.decorator';

@Controller('utilisateurs')
export class UtilisateursController {
  constructor(private utilisateursService: UtilisateursService) {}

  // Route existante (création directe) — telle qu'elle est chez toi
  @Post()
  creer(@Body() body: { telephone: string; nom: string }) {
    return this.utilisateursService.creer(body.telephone, body.nom);
  }

  @Get()
  listerTous() {
    return this.utilisateursService.listerTous();
  }

  // --- Nouveau : profil de l'utilisateur connecté ---

  @UseGuards(JwtAuthGuard)
  @Get('moi')
  monProfil(@UtilisateurCourant() u: any) {
    return this.utilisateursService.monProfil(u.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('moi')
  majProfil(@UtilisateurCourant() u: any, @Body() dto: MajProfilDto) {
    return this.utilisateursService.majProfil(u.id, dto);
  }
}