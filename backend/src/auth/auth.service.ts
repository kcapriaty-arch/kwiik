import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';

const DUREE_VALIDITE_MIN = 5; // le code expire au bout de 5 minutes
const MAX_TENTATIVES = 5; // nombre d'essais avant blocage

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  // Étapes 1-3 du flux : génère un code, le stocke haché, l'"envoie"
  async demandeCode(telephone: string) {
    // Génère un code à 6 chiffres
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHache = await bcrypt.hash(code, 10);
    const expireLe = new Date(Date.now() + DUREE_VALIDITE_MIN * 60 * 1000);

    // Invalide les anciens codes non utilisés pour ce numéro
    await this.prisma.codeVerification.updateMany({
      where: { telephone, utilise: false },
      data: { utilise: true },
    });

    await this.prisma.codeVerification.create({
      data: { telephone, codeHache, expireLe },
    });
// === ENVOI DU SMS (mock) ===
    // Plus tard : remplacer par un vrai appel à un fournisseur SMS.
    await this.envoyerSms(telephone, code);

    // En mode dev uniquement : on renvoie le code dans la réponse pour tester
    // facilement. À RETIRER avant la production.
    return {
      message: 'Code envoyé.',
      ...(process.env.NODE_ENV !== 'production' && { codeDev: code }),
    };
  }

  // Étapes 4-6 : vérifie le code, crée/retrouve l'utilisateur, renvoie un JWT
  async verifieCode(telephone: string, code: string) {
    const enregistrement = await this.prisma.codeVerification.findFirst({
      where: { telephone, utilise: false },
      orderBy: { creeLe: 'desc' },
    });

    if (!enregistrement) {
      throw new BadRequestException('Aucun code en attente pour ce numéro.');
    }

    if (enregistrement.expireLe < new Date()) {
      throw new BadRequestException('Le code a expiré. Demandez-en un nouveau.');
    }

    if (enregistrement.tentatives >= MAX_TENTATIVES) {
      throw new BadRequestException('Trop de tentatives. Demandez un nouveau code.');
    }

    const codeValide = await bcrypt.compare(code, enregistrement.codeHache);

    if (!codeValide) {
      await this.prisma.codeVerification.update({
        where: { id: enregistrement.id },
        data: { tentatives: { increment: 1 } },
      });
      throw new UnauthorizedException('Code incorrect.');
    }

    // Code bon : on le marque utilisé
    await this.prisma.codeVerification.update({
      where: { id: enregistrement.id },
      data: { utilise: true },
    });

    // Crée l'utilisateur s'il n'existe pas, sinon le retrouve
    let utilisateur = await this.prisma.utilisateur.findUnique({
      where: { telephone },
    });

    let nouveau = false;
    if (!utilisateur) {
      utilisateur = await this.prisma.utilisateur.create({
        data: { telephone, nom: '' }, // nom rempli plus tard à l'onboarding
      });
      nouveau = true;
    }

    // Génère le jeton JWT
    const token = await this.jwt.signAsync({
      sub: utilisateur.id,
      telephone: utilisateur.telephone,
      role: utilisateur.role,
    });

    return { token, utilisateur, nouveau };
  }

  async moi(utilisateurId: string) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: {
        id: true,
        nom: true,
        telephone: true,
        prestataire: { select: { id: true } },
      },
    });

    if (!utilisateur) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    return {
      id: utilisateur.id,
      nom: utilisateur.nom,
      telephone: utilisateur.telephone,
      estPrestataire: Boolean(utilisateur.prestataire),
    };
  }
  // === MOCK SMS — à remplacer par un vrai fournisseur plus tard ===
  private async envoyerSms(telephone: string, code: string) {
    console.log(`\n📱 [SMS MOCK] Code pour ${telephone} : ${code}\n`);
  }
}