import { Module } from '@nestjs/common';
import { PrestatairesController } from './prestataires.controller';
import { PrestatairesService } from './prestataires.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [PrestatairesController],
  providers: [PrestatairesService, PrismaService],
})
export class PrestatairesModule {}