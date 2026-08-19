import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export enum ModeServiceDto {
  adresse_fixe = 'adresse_fixe',
  a_domicile = 'a_domicile',
  en_ligne = 'en_ligne',
}

export class CreerPrestataireDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'Au moins une categorie est requise.' })
  @ArrayMaxSize(5, { message: 'Vous pouvez choisir au maximum 5 categories.' })
  @IsUUID('4', { each: true, message: 'Categorie invalide.' })
  categorieIds: string[];

  @IsEnum(ModeServiceDto, { message: 'Mode de service invalide.' })
  modeService: ModeServiceDto;

  @IsString()
  @IsOptional()
  licenceUrl?: string;

  @IsString()
  @MinLength(2, { message: 'La ville est requise.' })
  ville: string;

  @IsString()
  @IsOptional()
  quartier?: string;

  @IsString()
  @IsOptional()
  adresse?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  photoLieuUrl?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photosBoutique?: string[];

  @IsBoolean()
  @IsOptional()
  proposeLocalAVendreOuLouer?: boolean;

  @IsString()
  @IsOptional()
  factureElectriciteUrl?: string;
}

export class ModifierPrestataireDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'Au moins une categorie est requise.' })
  @ArrayMaxSize(5, { message: 'Vous pouvez choisir au maximum 5 categories.' })
  @IsUUID('4', { each: true, message: 'Categorie invalide.' })
  @IsOptional()
  categorieIds?: string[];

  @IsEnum(ModeServiceDto, { message: 'Mode de service invalide.' })
  @IsOptional()
  modeService?: ModeServiceDto;

  @IsString()
  @IsOptional()
  licenceUrl?: string;

  @IsString()
  @IsOptional()
  ville?: string;

  @IsString()
  @IsOptional()
  quartier?: string;

  @IsString()
  @IsOptional()
  adresse?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  photoLieuUrl?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photosBoutique?: string[];

  @IsString()
  @IsOptional()
  telephonePro?: string;

  @IsEmail({}, { message: 'Adresse e-mail invalide.' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  photoProfilPriveeUrl?: string;

  @IsString()
  @IsOptional()
  cniRectoUrl?: string;

  @IsString()
  @IsOptional()
  cniVersoUrl?: string;

  @IsBoolean()
  @IsOptional()
  proposeLocalAVendreOuLouer?: boolean;

  @IsString()
  @IsOptional()
  factureElectriciteUrl?: string;
}