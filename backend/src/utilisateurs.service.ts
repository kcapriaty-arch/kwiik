import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from './prisma.service';
import { MajProfilDto } from './dto/utilisateur.dto';

// Ne jamais renvoyer le hash du mot de passe au client.
const selectSansMotDePasse = {
  id: true,
  nom: true,
  email: true,
  role: true,
  langue: true,
  creeLe: true,
  emailConfirme: true,
  telephone: true,
  photoProfilUrl: true,
  cniRectoUrl: true,
  cniVersoUrl: true,
} as const;

@Injectable()
export class UtilisateursService {
  constructor(private prisma: PrismaService) {}

  creer(telephone: string, nom: string) {
    return this.prisma.utilisateur.create({
      data: { telephone, nom },
    });
  }

  listerTous() {
    return this.prisma.utilisateur.findMany({ select: selectSansMotDePasse });
  }

  async monProfil(utilisateurId: string) {
    return this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: selectSansMotDePasse,
    });
  }

  async majProfil(utilisateurId: string, dto: MajProfilDto) {
    try {
      return await this.prisma.utilisateur.update({
        where: { id: utilisateurId },
        data: {
          ...(dto.nom !== undefined && { nom: dto.nom }),
          ...(dto.langue !== undefined && { langue: dto.langue }),
          ...(dto.email !== undefined && { email: dto.email }),
          ...(dto.photoProfilUrl !== undefined && { photoProfilUrl: dto.photoProfilUrl }),
          ...(dto.cniRectoUrl !== undefined && { cniRectoUrl: dto.cniRectoUrl }),
          ...(dto.cniVersoUrl !== undefined && { cniVersoUrl: dto.cniVersoUrl }),
          ...(dto.telephone !== undefined && { telephone: dto.telephone }),
        },
        select: selectSansMotDePasse,
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const champ = Array.isArray(error.meta?.target) ? error.meta.target[0] : 'valeur';
        const libelles: Record<string, string> = {
          telephone: 'Ce numéro de téléphone est déjà utilisé par un autre compte.',
          email: 'Cette adresse email est déjà utilisée par un autre compte.',
        };
        throw new ConflictException(libelles[champ] ?? 'Cette valeur est déjà utilisée par un autre compte.');
      }
      throw error;
    }
  }
}