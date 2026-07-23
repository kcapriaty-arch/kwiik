import { IsInt, Min, Max, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreerAvisDto {
  @IsUUID('4', { message: 'reservationId doit être un UUID valide.' })
  reservationId: string;

  @IsInt({ message: 'La note doit être un entier.' })
  @Min(1, { message: 'La note minimale est 1.' })
  @Max(5, { message: 'La note maximale est 5.' })
  note: number;

  @IsString()
  @IsOptional()
  commentaire?: string;
}