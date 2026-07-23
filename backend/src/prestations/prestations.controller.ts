import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UtilisateurCourant } from '../auth/utilisateur-courant.decorator';
import { CreerPrestationDto } from './dto/prestation.dto';
import { PrestationsService } from './prestations.service';

@UseGuards(JwtAuthGuard)
@Controller('prestations')
export class PrestationsController {
  constructor(private prestationsService: PrestationsService) {}

  @Post()
  creer(
    @UtilisateurCourant() utilisateur: any,
    @Body() dto: CreerPrestationDto,
  ) {
    return this.prestationsService.creer(utilisateur.id, dto);
  }

  @Get('mes-prestations')
  mesPrestations(@UtilisateurCourant() utilisateur: any) {
    return this.prestationsService.mesPrestations(utilisateur.id);
  }

  @Delete(':id')
  supprimer(@UtilisateurCourant() utilisateur: any, @Param('id') id: string) {
    return this.prestationsService.supprimer(utilisateur.id, id);
  }
}
