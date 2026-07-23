import { IsString, Matches, Length } from 'class-validator';

export class DemandeCodeDto {
  @IsString()
  @Matches(/^[0-9]{8,15}$/, {
    message: 'Le numéro de téléphone doit contenir entre 8 et 15 chiffres.',
  })
  telephone: string;
}

export class VerifieCodeDto {
  @IsString()
  @Matches(/^[0-9]{8,15}$/)
  telephone: string;

  @IsString()
  @Length(6, 6, { message: 'Le code doit contenir 6 chiffres.' })
  code: string;
}