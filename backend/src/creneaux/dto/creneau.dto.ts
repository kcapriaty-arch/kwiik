import { IsDateString } from 'class-validator';

export class CreerCreneauDto {
  // Dates au format ISO 8601, ex. "2026-07-20T09:00:00.000Z"
  @IsDateString({}, { message: 'Le début doit être une date valide (ISO).' })
  debut: string;

  @IsDateString({}, { message: 'La fin doit être une date valide (ISO).' })
  fin: string;
}