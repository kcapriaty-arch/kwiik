import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { MajProfilDto } from './dto/utilisateur.dto';

@Injectable()
export class UtilisateursService {
  constructor(private prisma: PrismaService) {}

  creer(telephone: string, nom: string) {
    return this.prisma.utilisateur.create({
      data: { telephone, nom },
    });
  }

  listerTous() {
    return this.prisma.utilisateur.findMany();
  }

  async monProfil(utilisateurId: string) {
    return this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
    });
  }

  async majProfil(utilisateurId: string, dto: MajProfilDto) {
    return this.prisma.utilisateur.update({
      where: { id: utilisateurId },
      data: {
        ...(dto.nom !== undefined && { nom: dto.nom }),
        ...(dto.langue !== undefined && { langue: dto.langue }),
      },
    });
  }
}