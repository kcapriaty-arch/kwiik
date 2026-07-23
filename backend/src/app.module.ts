import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UtilisateursModule } from './utilisateurs.module';
import { AuthModule } from './auth/auth.module';
import { PrestatairesModule } from './prestataires/prestataires.module';
import { PrestationsModule } from './prestations/prestations.module';
import { CreneauxModule } from './creneaux/creneaux.module';
import { ReservationsModule } from './reservation/reservations.module';
import { AvisModule } from './avis/avis.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    UtilisateursModule,
    AuthModule,
    PrestatairesModule,
    PrestationsModule,
    CreneauxModule,
    ReservationsModule,
    AvisModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}