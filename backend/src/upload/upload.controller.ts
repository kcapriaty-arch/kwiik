import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UtilisateurCourant } from '../auth/utilisateur-courant.decorator';
import { UploadService } from './upload.service';

const dossierUploads = join(process.cwd(), 'uploads');
const dossierUploadsPrives = join(process.cwd(), 'uploads-prives');

[dossierUploads, dossierUploadsPrives].forEach((dossier) => {
  if (!existsSync(dossier)) {
    mkdirSync(dossier, { recursive: true });
  }
});

interface FichierUpload {
  filename: string;
}

function nomUnique(nomOriginal: string): string {
  const extension = extname(nomOriginal).toLowerCase();
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
}

function filtrerImage(_request: unknown, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) {
  if (!file.mimetype.startsWith('image/')) {
    callback(new BadRequestException('Seuls les fichiers image sont acceptes.'), false);
    return;
  }

  callback(null, true);
}

@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('fichier', {
      storage: diskStorage({
        destination: dossierUploads,
        filename: (_request, file, callback) => callback(null, nomUnique(file.originalname)),
      }),
      fileFilter: filtrerImage,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  envoyer(@UploadedFile() fichier?: FichierUpload) {
    if (!fichier) {
      throw new BadRequestException('Aucun fichier image recu.');
    }

    return { url: `/uploads/${fichier.filename}` };
  }

  @UseGuards(JwtAuthGuard)
  @Post('prive')
  @UseInterceptors(
    FileInterceptor('fichier', {
      storage: diskStorage({
        destination: dossierUploadsPrives,
        filename: (_request, file, callback) => callback(null, nomUnique(file.originalname)),
      }),
      fileFilter: filtrerImage,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  envoyerPrive(@UploadedFile() fichier?: FichierUpload) {
    if (!fichier) {
      throw new BadRequestException('Aucun fichier image recu.');
    }

    return { url: `/uploads-prives/${fichier.filename}` };
  }

  // Les fichiers prives ne sont pas servis en statique : on verifie que le
  // demandeur est bien le proprietaire avant de renvoyer le fichier.
  @UseGuards(JwtAuthGuard)
  @Get('prive/:filename')
  async voirPrive(
    @Param('filename') filename: string,
    @UtilisateurCourant() utilisateur: { id: string },
    @Res() res: Response,
  ) {
    const url = `/uploads-prives/${filename}`;
    const autorise = await this.uploadService.estProprietaire(utilisateur.id, url);

    if (!autorise) {
      throw new ForbiddenException();
    }

    const chemin = join(dossierUploadsPrives, filename);

    if (!existsSync(chemin)) {
      throw new NotFoundException('Fichier introuvable.');
    }

    res.sendFile(chemin);
  }
}