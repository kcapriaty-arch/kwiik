import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export enum ModePaiementDto {
  en_ligne = 'en_ligne',
  a_la_livraison = 'a_la_livraison',
}

export enum OperateurDto {
  orange_money = 'orange_money',
  mtn_momo = 'mtn_momo',
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

  @IsEnum(OperateurDto, { message: 'operateur doit etre orange_money ou mtn_momo.' })
  @IsOptional()
  operateur?: OperateurDto;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'La note ne peut pas depasser 500 caracteres.' })
  note?: string;
}
