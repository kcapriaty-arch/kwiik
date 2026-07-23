import { IsString, IsOptional, MinLength, IsEnum } from 'class-validator';

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
}