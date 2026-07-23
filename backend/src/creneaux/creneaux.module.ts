import { Module } from '@nestjs/common';
import { CreneauxController } from './creneaux.controller';
import { CreneauxService } from './creneaux.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [CreneauxController],
  providers: [CreneauxService, PrismaService],
})
export class CreneauxModule {}