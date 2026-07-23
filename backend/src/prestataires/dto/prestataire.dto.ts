import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreerPrestataireDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'Au moins une categorie est requise.' })
  @IsUUID('4', { each: true, message: 'Categorie invalide.' })
  categorieIds: string[];

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
}

export class ModifierPrestataireDto {
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
}