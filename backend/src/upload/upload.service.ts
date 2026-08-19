import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UploadService {
  constructor(private prisma: PrismaService) {}

  // Verifie que le fichier prive demande appartient bien a l'utilisateur courant
  // (ses propres champs Utilisateur, ou ceux de son Prestataire/ProfilPrestatairePrive).
  async estProprietaire(utilisateurId: string, url: string): Promise<boolean> {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: {
        photoProfilUrl: true,
        cniRectoUrl: true,
        cniVersoUrl: true,
        prestataire: {
          select: {
            licenceUrl: true,
            profilPrive: {
              select: {
                photoProfilPriveeUrl: true,
                cniRectoUrl: true,
                cniVersoUrl: true,
              },
            },
          },
        },
      },
    });

    if (!utilisateur) {
      return false;
    }

    const urlsPossedees = [
      utilisateur.photoProfilUrl,
      utilisateur.cniRectoUrl,
      utilisateur.cniVersoUrl,
      utilisateur.prestataire?.licenceUrl,
      utilisateur.prestataire?.profilPrive?.photoProfilPriveeUrl,
      utilisateur.prestataire?.profilPrive?.cniRectoUrl,
      utilisateur.prestataire?.profilPrive?.cniVersoUrl,
    ];

    return urlsPossedees.includes(url);
  }
}
