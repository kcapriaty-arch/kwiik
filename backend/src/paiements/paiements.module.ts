import { Module } from '@nestjs/common';
import { PaiementsController } from './paiements.controller';
import { PaiementsService } from './paiements.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [PaiementsController],
  providers: [PaiementsService, PrismaService],
  exports: [PaiementsService],
})
export class PaiementsModule {}
