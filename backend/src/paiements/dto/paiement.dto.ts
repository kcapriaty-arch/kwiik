import { IsEnum } from 'class-validator';

export enum ResultatSimulationDto {
  reussi = 'reussi',
  echoue = 'echoue',
}

export class SimulerPaiementDto {
  @IsEnum(ResultatSimulationDto, {
    message: 'resultat doit etre reussi ou echoue.',
  })
  resultat: ResultatSimulationDto;
}
