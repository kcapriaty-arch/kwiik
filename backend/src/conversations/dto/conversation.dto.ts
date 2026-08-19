import { IsString, IsUUID, MinLength } from 'class-validator';

export class DemarrerConversationDto {
  @IsUUID('4', { message: 'prestataireId doit etre un UUID valide.' })
  prestataireId: string;
}

export class EnvoyerMessageDto {
  @IsString()
  @MinLength(1, { message: 'Le message ne peut pas etre vide.' })
  contenu: string;
}
