import { Body, Controller, Post, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  InscriptionDto,
  ConnexionDto,
  AppleSimuleDto,
  ConfirmerEmailDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UtilisateurCourant } from './utilisateur-courant.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('inscription')
  inscription(@Body() dto: InscriptionDto) {
    return this.authService.inscription(dto.nom, dto.email, dto.motDePasse);
  }

  @Post('connexion')
  connexion(@Body() dto: ConnexionDto) {
    return this.authService.connexion(dto.email, dto.motDePasse);
  }

  @Post('apple-simule')
  appleSimule(@Body() dto: AppleSimuleDto) {
    return this.authService.appleSimule(dto.nom, dto.email);
  }

  @UseGuards(JwtAuthGuard)
  @Post('email/demande-confirmation')
  demandeConfirmationEmail(@UtilisateurCourant() utilisateur: any) {
    return this.authService.demandeConfirmationEmail(utilisateur.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('email/confirme')
  confirmerEmail(@UtilisateurCourant() utilisateur: any, @Body() dto: ConfirmerEmailDto) {
    return this.authService.confirmerEmail(utilisateur.id, dto.code);
  }

  // Route protégée : nécessite un jeton valide
  @UseGuards(JwtAuthGuard)
  @Get('moi')
  moi(@UtilisateurCourant() utilisateur: any) {
    return this.authService.moi(utilisateur.id);
  }
}
