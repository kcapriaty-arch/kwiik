import { Module } from '@nestjs/common';
import { UtilisateursService } from './utilisateurs.service';
import { UtilisateursController } from './utilisateurs.controller';
import { PrismaService } from './prisma.service';

@Module({
  controllers: [UtilisateursController],
  providers: [UtilisateursService, PrismaService],
})
export class UtilisateursModule {}
