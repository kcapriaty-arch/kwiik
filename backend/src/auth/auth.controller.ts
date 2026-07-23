import { Body, Controller, Post, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DemandeCodeDto, VerifieCodeDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UtilisateurCourant } from './utilisateur-courant.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('demande-code')
  demandeCode(@Body() dto: DemandeCodeDto) {
    return this.authService.demandeCode(dto.telephone);
  }

  @Post('verifie-code')
  verifieCode(@Body() dto: VerifieCodeDto) {
    return this.authService.verifieCode(dto.telephone, dto.code);
  }

  // Route protégée : nécessite un jeton valide
  @UseGuards(JwtAuthGuard)
  @Get('moi')
  moi(@UtilisateurCourant() utilisateur: any) {
    return this.authService.moi(utilisateur.id);
  }
}