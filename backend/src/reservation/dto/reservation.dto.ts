import { IsEnum, IsUUID } from 'class-validator';

export enum ModePaiementDto {
  en_ligne = 'en_ligne',
  a_la_livraison = 'a_la_livraison',
}

export class CreerReservationDto {
  @IsUUID('4', { message: 'prestationId doit etre un UUID valide.' })
  prestationId: string;

  @IsUUID('4', { message: 'creneauId doit etre un UUID valide.' })
  creneauId: string;

  @IsEnum(ModePaiementDto, {
    message: 'modePaiement doit etre en_ligne ou a_la_livraison.',
  })
  modePaiement: ModePaiementDto;
}
