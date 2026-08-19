import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class InscriptionDto {
  @IsString()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères.' })
  nom: string;

  @IsEmail({}, { message: 'Adresse email invalide.' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  motDePasse: string;
}

export class ConnexionDto {
  @IsEmail({}, { message: 'Adresse email invalide.' })
  email: string;

  @IsString()
  motDePasse: string;
}

export class AppleSimuleDto {
  @IsString()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères.' })
  nom: string;

  @IsEmail({}, { message: 'Adresse email invalide.' })
  email: string;
}

export class DemandeConfirmationEmailDto {}

export class ConfirmerEmailDto {
  @IsString()
  @Length(6, 6, { message: 'Le code doit contenir 6 chiffres.' })
  code: string;
}
