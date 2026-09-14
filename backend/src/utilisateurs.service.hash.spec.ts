import { Test, TestingModule } from '@nestjs/testing';
import { UtilisateursService } from './utilisateurs.service';
import { PrismaService } from './prisma.service';

// Preuve RNCP : verifie que les requetes Prisma emises par UtilisateursService
// n'incluent jamais motDePasseHash dans leur clause `select`, quel que soit le
// contenu reel de la base (protection au niveau de la requete, pas seulement
// du DTO de sortie).
describe('UtilisateursService - select Prisma sans motDePasseHash', () => {
  let service: UtilisateursService;
  const findMany = jest.fn().mockResolvedValue([]);
  const findUnique = jest.fn().mockResolvedValue(null);

  beforeEach(async () => {
    findMany.mockClear();
    findUnique.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UtilisateursService,
        {
          provide: PrismaService,
          useValue: { utilisateur: { findMany, findUnique } },
        },
      ],
    }).compile();

    service = module.get<UtilisateursService>(UtilisateursService);
  });

  it("listerTous() n'inclut pas motDePasseHash dans le select Prisma", async () => {
    await service.listerTous();

    expect(findMany).toHaveBeenCalledTimes(1);
    const { select } = findMany.mock.calls[0][0];
    expect(select).toBeDefined();
    expect(select).not.toHaveProperty('motDePasseHash');
  });

  it("monProfil() n'inclut pas motDePasseHash dans le select Prisma", async () => {
    await service.monProfil('u1');

    expect(findUnique).toHaveBeenCalledTimes(1);
    const { select } = findUnique.mock.calls[0][0];
    expect(select).toBeDefined();
    expect(select).not.toHaveProperty('motDePasseHash');
  });
});
