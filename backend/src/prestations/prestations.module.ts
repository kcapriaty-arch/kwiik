import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PrestationsController } from './prestations.controller';
import { PrestationsService } from './prestations.service';

@Module({
  controllers: [PrestationsController],
  providers: [PrestationsService, PrismaService],
})
export class PrestationsModule {}
