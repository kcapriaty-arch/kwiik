import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreerPrestationDto {
  @IsString()
  @MinLength(2, { message: 'Le titre est requis.' })
  titre: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;

  @Type(() => Number)
  @IsInt({ message: 'Le prix doit etre un nombre entier en FCFA.' })
  @Min(0, { message: 'Le prix ne peut pas etre negatif.' })
  prix: number;

  @Type(() => Number)
  @IsInt({ message: 'La duree doit etre un nombre entier en minutes.' })
  @Min(1, { message: 'La duree doit etre d au moins 1 minute.' })
  dureeMin: number;
}