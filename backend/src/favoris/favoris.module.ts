import { Module } from '@nestjs/common';
import { FavorisController } from './favoris.controller';
import { FavorisService } from './favoris.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [FavorisController],
  providers: [FavorisService, PrismaService],
})
export class FavorisModule {}
