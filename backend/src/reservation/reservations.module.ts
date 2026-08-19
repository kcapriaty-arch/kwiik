import { Module } from '@nestjs/common';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { PrismaService } from '../prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaiementsModule } from '../paiements/paiements.module';

@Module({
  imports: [NotificationsModule, PaiementsModule],
  controllers: [ReservationsController],
  providers: [ReservationsService, PrismaService],
})
export class ReservationsModule {}