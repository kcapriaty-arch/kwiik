import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma.service';

// Preuve RNCP : verifie que le hash bcrypt n'est jamais renvoye par AuthService,
// meme si un objet Prisma brut (avec motDePasseHash) est passe en entree.
describe('AuthService - exclusion du hash de mot de passe', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: {} },
        { provide: JwtService, useValue: { signAsync: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it("sansMotDePasse() retire le champ motDePasseHash de l'objet retourne", () => {
    const utilisateurBrut = {
      id: 'u1',
      email: 'test@example.com',
      role: 'client',
      motDePasseHash: '$2b$10$exempledehashbcrypt',
    };

    // sansMotDePasse est prive : accessible en test via cast, comme toute methode
    // privee TypeScript (restriction de compilation, pas d'encapsulation runtime).
    const resultat = (service as unknown as { sansMotDePasse: (u: unknown) => unknown }).sansMotDePasse(
      utilisateurBrut,
    );

    expect(resultat).not.toHaveProperty('motDePasseHash');
    expect(resultat).toMatchObject({ id: 'u1', email: 'test@example.com', role: 'client' });
  });
});
