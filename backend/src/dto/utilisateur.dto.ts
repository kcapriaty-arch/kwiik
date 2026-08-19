import { IsString, IsOptional, MinLength, IsEnum, IsEmail, Matches } from 'class-validator';

export enum LangueDto {
  fr = 'fr',
  en = 'en',
}

export class MajProfilDto {
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Le nom doit faire au moins 2 caractères.' })
  nom?: string;

  @IsEnum(LangueDto, { message: 'La langue doit être "fr" ou "en".' })
  @IsOptional()
  langue?: LangueDto;

  @IsEmail({}, { message: 'Adresse e-mail invalide.' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  photoProfilUrl?: string;

  @IsString()
  @IsOptional()
  cniRectoUrl?: string;

  @IsString()
  @IsOptional()
  cniVersoUrl?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{8,15}$/, {
    message: 'Le numéro de téléphone doit contenir entre 8 et 15 chiffres.',
  })
  telephone?: string;
}