import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PrestatairesService } from './prestataires.service';
import { CreerPrestataireDto, ModifierPrestataireDto } from './dto/prestataire.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UtilisateurCourant } from '../auth/utilisateur-courant.decorator';

@Controller('prestataires')
export class PrestatairesController {
  constructor(private prestatairesService: PrestatairesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  devenirPrestataire(
    @UtilisateurCourant() utilisateur: any,
    @Body() dto: CreerPrestataireDto,
  ) {
    return this.prestatairesService.devenirPrestataire(utilisateur.id, dto);
  }

  @Get('categories')
  categories() {
    return this.prestatairesService.categories();
  }

  @Get('villes')
  villes() {
    return this.prestatairesService.villes();
  }

  @Get('domaines')
  domaines() {
    return this.prestatairesService.domaines();
  }

  @UseGuards(JwtAuthGuard)
  @Get('moi')
  maVitrine(@UtilisateurCourant() utilisateur: any) {
    return this.prestatairesService.maVitrine(utilisateur.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('moi')
  modifierMaVitrine(
    @UtilisateurCourant() utilisateur: any,
    @Body() dto: ModifierPrestataireDto,
  ) {
    return this.prestatairesService.modifierMaVitrine(utilisateur.id, dto);
  }

  @Get()
  lister(
    @Query('categorie') categorie?: string,
    @Query('ville') ville?: string,
  ) {
    return this.prestatairesService.lister(categorie, ville);
  }

  @Get(':id')
  vitrinePublique(@Param('id') id: string) {
    return this.prestatairesService.vitrinePublique(id);
  }
}