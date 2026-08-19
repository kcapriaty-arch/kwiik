import {
  Injectable,
  BadRequestException,
  ConflictException,
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

  private async signer(utilisateur: { id: string; email: string | null; role: string }) {
    return this.jwt.signAsync({
      sub: utilisateur.id,
      email: utilisateur.email,
      role: utilisateur.role,
    });
  }

  // Ne jamais renvoyer le hash du mot de passe au client.
  private sansMotDePasse<T extends { motDePasseHash?: string | null }>(
    utilisateur: T,
  ): Omit<T, 'motDePasseHash'> {
    const { motDePasseHash: _motDePasseHash, ...reste } = utilisateur;
    return reste;
  }

  async inscription(nom: string, email: string, motDePasse: string) {
    const existant = await this.prisma.utilisateur.findUnique({ where: { email } });
    if (existant) {
      throw new ConflictException('Un compte existe déjà avec cet email.');
    }

    const motDePasseHash = await bcrypt.hash(motDePasse, 10);
    const utilisateur = await this.prisma.utilisateur.create({
      data: { nom, email, motDePasseHash },
    });

    const token = await this.signer(utilisateur);
    return { token, utilisateur: this.sansMotDePasse(utilisateur), nouveau: true };
  }

  async connexion(email: string, motDePasse: string) {
    const utilisateur = await this.prisma.utilisateur.findUnique({ where: { email } });

    if (!utilisateur || !utilisateur.motDePasseHash) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.motDePasseHash);
    if (!motDePasseValide) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    const token = await this.signer(utilisateur);
    return { token, utilisateur: this.sansMotDePasse(utilisateur), nouveau: false };
  }

  // Connexion Apple simulee : aucune verification reelle aupres d'Apple,
  // le compte est retrouve/cree a partir de l'email fourni par le client.
  async appleSimule(nom: string, email: string) {
    const appleId = `apple_${email.toLowerCase()}`;
    let utilisateur = await this.prisma.utilisateur.findUnique({ where: { appleId } });

    let nouveau = false;
    if (!utilisateur) {
      const dejaUtiliseParEmail = await this.prisma.utilisateur.findUnique({ where: { email } });
      if (dejaUtiliseParEmail) {
        throw new ConflictException('Un compte existe déjà avec cet email.');
      }

      utilisateur = await this.prisma.utilisateur.create({
        data: { nom, email, appleId, emailConfirme: true },
      });
      nouveau = true;
    }

    const token = await this.signer(utilisateur);
    return { token, utilisateur: this.sansMotDePasse(utilisateur), nouveau };
  }

  async demandeConfirmationEmail(utilisateurId: string) {
    const utilisateur = await this.prisma.utilisateur.findUnique({ where: { id: utilisateurId } });
    if (!utilisateur?.email) {
      throw new BadRequestException('Aucun email associé à ce compte.');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHache = await bcrypt.hash(code, 10);
    const expireLe = new Date(Date.now() + DUREE_VALIDITE_MIN * 60 * 1000);

    await this.prisma.codeConfirmationEmail.updateMany({
      where: { email: utilisateur.email, utilise: false },
      data: { utilise: true },
    });

    await this.prisma.codeConfirmationEmail.create({
      data: { email: utilisateur.email, codeHache, expireLe },
    });

    await this.envoyerEmail(utilisateur.email, code);

    return {
      message: 'Code de confirmation envoyé.',
      ...(process.env.NODE_ENV !== 'production' && { codeDev: code }),
    };
  }

  async confirmerEmail(utilisateurId: string, code: string) {
    const utilisateur = await this.prisma.utilisateur.findUnique({ where: { id: utilisateurId } });
    if (!utilisateur?.email) {
      throw new BadRequestException('Aucun email associé à ce compte.');
    }

    const enregistrement = await this.prisma.codeConfirmationEmail.findFirst({
      where: { email: utilisateur.email, utilise: false },
      orderBy: { creeLe: 'desc' },
    });

    if (!enregistrement) {
      throw new BadRequestException('Aucun code en attente pour cet email.');
    }

    if (enregistrement.expireLe < new Date()) {
      throw new BadRequestException('Le code a expiré. Demandez-en un nouveau.');
    }

    if (enregistrement.tentatives >= MAX_TENTATIVES) {
      throw new BadRequestException('Trop de tentatives. Demandez un nouveau code.');
    }

    const codeValide = await bcrypt.compare(code, enregistrement.codeHache);

    if (!codeValide) {
      await this.prisma.codeConfirmationEmail.update({
        where: { id: enregistrement.id },
        data: { tentatives: { increment: 1 } },
      });
      throw new UnauthorizedException('Code incorrect.');
    }

    await this.prisma.codeConfirmationEmail.update({
      where: { id: enregistrement.id },
      data: { utilise: true },
    });

    await this.prisma.utilisateur.update({
      where: { id: utilisateurId },
      data: { emailConfirme: true },
    });

    return { message: 'Email confirmé.' };
  }

  async moi(utilisateurId: string) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: {
        id: true,
        nom: true,
        telephone: true,
        email: true,
        emailConfirme: true,
        creeLe: true,
        photoProfilUrl: true,
        cniRectoUrl: true,
        cniVersoUrl: true,
        prestataire: {
          select: {
            id: true,
            modeService: true,
            licenceUrl: true,
            proposeLocalAVendreOuLouer: true,
            factureElectriciteUrl: true,
            categories: { select: { licenceRequise: true } },
          },
        },
      },
    });

    if (!utilisateur) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    const estPrestataire = Boolean(utilisateur.prestataire);
    const identiteComplete = Boolean(utilisateur.nom?.trim());
    const licenceExigee =
      utilisateur.prestataire?.categories.some((c) => c.licenceRequise) ?? false;
    const factureExigee = utilisateur.prestataire?.proposeLocalAVendreOuLouer ?? false;
    const prestataireOnboardingComplete = estPrestataire
      ? Boolean(utilisateur.prestataire!.modeService) &&
        Boolean(utilisateur.cniRectoUrl && utilisateur.cniVersoUrl) &&
        (!licenceExigee || Boolean(utilisateur.prestataire!.licenceUrl)) &&
        (!factureExigee || Boolean(utilisateur.prestataire!.factureElectriciteUrl))
      : true;

    return {
      id: utilisateur.id,
      nom: utilisateur.nom,
      telephone: utilisateur.telephone,
      email: utilisateur.email,
      emailConfirme: utilisateur.emailConfirme,
      creeLe: utilisateur.creeLe,
      photoProfilUrl: utilisateur.photoProfilUrl,
      cniRectoUrl: utilisateur.cniRectoUrl,
      cniVersoUrl: utilisateur.cniVersoUrl,
      estPrestataire,
      identiteComplete,
      prestataireOnboardingComplete,
    };
  }

  // === MOCK EMAIL — a remplacer par un vrai fournisseur plus tard ===
  private async envoyerEmail(email: string, code: string) {
    console.log(`\n📧 [EMAIL MOCK] Code de confirmation pour ${email} : ${code}\n`);
  }
}
