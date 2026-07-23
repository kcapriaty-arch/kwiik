import { Module } from '@nestjs/common';
import { AvisController } from './avis.controller';
import { AvisService } from './avis.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [AvisController],
  providers: [AvisService, PrismaService],
})
export class AvisModule {}