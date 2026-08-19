import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { api, urlImage } from './api';
import { SquelettesCartes } from './ui';

interface DecouverteProps {
  onSelectionner: (id: string) => void;
  categorieInitiale?: string;
  villeInitiale?: string;
}

interface UtilisateurPrestataire {
  nom: string;
}

interface Abonnement {
  nom: string;
}

interface DomaineCategorie {
  id: string;
  nom: string;
  ordre?: number;
}

interface CategoriePrestataire {
  id: string;
  nom: string;
  domaine?: DomaineCategorie | null;
}

interface Prestation {
  id: string;
  titre: string;
  prix: number;
  dureeMin: number;
}

type ModeService = 'adresse_fixe' | 'a_domicile' | 'en_ligne';

interface Prestataire {
  id: string;
  categories: CategoriePrestataire[];
  ville: string;
  quartier: string | null;
  adresse?: string | null;
  description: string | null;
  photoLieuUrl?: string | null;
  utilisateur: UtilisateurPrestataire;
  abonnement: Abonnement | null;
  prestations: Prestation[];
  noteMoyenne: number | null;
  nombreAvis: number;
  verifie?: boolean;
  modeService?: ModeService | null;
}

type Tri = 'pertinence' | 'prix_asc' | 'prix_desc' | 'note_desc';

const libellesModeService: Record<ModeService, string> = {
  adresse_fixe: 'À une adresse fixe',
  a_domicile: 'À domicile',
  en_ligne: 'En ligne',
};

const libellesTri: Record<Tri, string> = {
  pertinence: 'Pertinence',
  prix_asc: 'Prix croissant',
  prix_desc: 'Prix décroissant',
  note_desc: 'Meilleures notes',
};

interface IconProps {
  className?: string;
}

const formatteurFcfa: Intl.NumberFormat = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

const formatteurNote: Intl.NumberFormat = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function SearchIcon({ className = '' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function LocationIcon({ className = '' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 21s7-5.3 7-12a7 7 0 0 0-14 0c0 6.7 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function FilterIcon({ className = '' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M4 7h16" />
      <path d="M7 12h10" />
      <path d="M10 17h4" />
    </svg>
  );
}

function HeartIcon({ rempli = false, className = '' }: IconProps & { rempli?: boolean }) {
  return (
    <svg aria-hidden="true" className={className} fill={rempli ? 'currentColor' : 'none'} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 21s-7.5-4.6-10-9.3C.5 8.2 2.3 5 5.6 5c1.9 0 3.4 1 4.4 2.4C11 6 12.5 5 14.4 5 17.7 5 19.5 8.2 22 11.7 19.5 16.4 12 21 12 21Z" />
    </svg>
  );
}

function formatPrixFcfa(prix: number): string {
  return `${formatteurFcfa.format(prix)} FCFA`;
}

function formatNote(note: number): string {
  return formatteurNote.format(note);
}

function estAbonnementDecouverte(abonnement: Abonnement | null): boolean {
  if (!abonnement) {
    return true;
  }

  return abonnement.nom.toLowerCase().includes('couverte');
}

function nomPrestataire(prestataire: Prestataire): string {
  const nomUtilisateur = prestataire.utilisateur.nom.trim();

  if (nomUtilisateur) {
    return nomUtilisateur;
  }

  return prestataire.categories[0]?.nom ?? 'Prestataire';
}

function initialesPrestataire(nom: string): string {
  const parties = nom.trim().split(/\s+/).filter(Boolean);

  if (parties.length === 0) {
    return 'KW';
  }

  return parties.slice(0, 2).map((partie: string) => partie[0]?.toUpperCase()).join('');
}

function libelleCategories(prestataire: Prestataire): string {
  if (prestataire.categories.length === 0) {
    return 'Prestataire';
  }

  return prestataire.categories.map((categorie: CategoriePrestataire) => categorie.nom).join(' · ');
}

function prixMinimum(prestataire: Prestataire): number | null {
  if (prestataire.prestations.length === 0) {
    return null;
  }

  return Math.min(...prestataire.prestations.map((prestation: Prestation) => prestation.prix));
}

function prixDepart(prestataire: Prestataire): string | null {
  const minimum = prixMinimum(prestataire);
  return minimum === null ? null : formatPrixFcfa(minimum);
}

export function Decouverte({
  onSelectionner,
  categorieInitiale = '',
  villeInitiale = '',
}: DecouverteProps) {
  const categorieDepart = categorieInitiale.trim();
  const villeDepart = villeInitiale.trim();
  const [categories, setCategories] = useState<CategoriePrestataire[]>([]);
  const [villes, setVilles] = useState<string[]>([]);
  const [categorieActive, setCategorieActive] = useState<string | null>(categorieDepart || null);
  const [villeActive, setVilleActive] = useState<string>(villeDepart);
  const [prestataires, setPrestataires] = useState<Prestataire[]>([]);
  const [chargement, setChargement] = useState<boolean>(true);
  const [erreurCategories, setErreurCategories] = useState<string>('');
  const [erreurVilles, setErreurVilles] = useState<string>('');
  const [erreurPrestataires, setErreurPrestataires] = useState<string>('');
  const [panneauFiltresOuvert, setPanneauFiltresOuvert] = useState<boolean>(false);
  const [tri, setTri] = useState<Tri>('pertinence');
  const [modeServiceActif, setModeServiceActif] = useState<ModeService | null>(null);
  const [recherche, setRecherche] = useState<string>('');
  const [idsFavoris, setIdsFavoris] = useState<Set<string>>(new Set());
  const [favoriEnCours, setFavoriEnCours] = useState<string>('');

  useEffect(() => {
    async function chargerFavoris(): Promise<void> {
      try {
        const { data } = await api.get<string[]>('/favoris/ids');
        setIdsFavoris(new Set(data));
      } catch {
        setIdsFavoris(new Set());
      }
    }

    chargerFavoris();
  }, []);

  async function basculerFavori(prestataireId: string): Promise<void> {
    setFavoriEnCours(prestataireId);

    try {
      const { data } = await api.post<{ favori: boolean }>(`/favoris/${prestataireId}`);
      setIdsFavoris((precedent) => {
        const suivant = new Set(precedent);
        if (data.favori) {
          suivant.add(prestataireId);
        } else {
          suivant.delete(prestataireId);
        }
        return suivant;
      });
    } catch {
      // Echec silencieux : l'etat visuel ne change simplement pas.
    } finally {
      setFavoriEnCours('');
    }
  }

  useEffect(() => {
    setCategorieActive(categorieDepart || null);
    setVilleActive(villeDepart);
  }, [categorieDepart, villeDepart]);

  useEffect(() => {
    async function chargerCategories(): Promise<void> {
      try {
        const { data } = await api.get<CategoriePrestataire[]>('/prestataires/categories');
        setCategories(data);
      } catch {
        setErreurCategories('Impossible de charger les catégories.');
      }
    }

    chargerCategories();
  }, []);

  useEffect(() => {
    async function chargerVilles(): Promise<void> {
      try {
        const { data } = await api.get<string[]>('/prestataires/villes');
        setVilles(data);
      } catch {
        setErreurVilles('Impossible de charger les villes.');
      }
    }

    chargerVilles();
  }, []);

  useEffect(() => {
    async function chargerPrestataires(): Promise<void> {
      setChargement(true);
      setErreurPrestataires('');

      try {
        const params: { categorie?: string; ville?: string } = {};

        if (categorieActive) {
          params.categorie = categorieActive;
        }
        if (villeActive) {
          params.ville = villeActive;
        }

        const { data } = await api.get<Prestataire[]>('/prestataires', { params });
        setPrestataires(data);
      } catch {
        setErreurPrestataires('Impossible de charger les prestataires.');
      } finally {
        setChargement(false);
      }
    }

    chargerPrestataires();
  }, [categorieActive, villeActive]);

  const nombreFiltresActifs = (tri !== 'pertinence' ? 1 : 0) + (modeServiceActif ? 1 : 0);

  const prestatairesAffiches = useMemo<Prestataire[]>(() => {
    const rechercheNettoyee = recherche.trim().toLowerCase();

    const filtres = prestataires
      .filter((prestataire: Prestataire) => (modeServiceActif ? prestataire.modeService === modeServiceActif : true))
      .filter((prestataire: Prestataire) => {
        if (!rechercheNettoyee) {
          return true;
        }

        const nom = nomPrestataire(prestataire).toLowerCase();
        const categories = libelleCategories(prestataire).toLowerCase();
        const prestations = prestataire.prestations.map((p: Prestation) => p.titre.toLowerCase()).join(' ');

        return nom.includes(rechercheNettoyee) || categories.includes(rechercheNettoyee) || prestations.includes(rechercheNettoyee);
      });

    if (tri === 'pertinence') {
      return filtres;
    }

    const tries = [...filtres];

    if (tri === 'prix_asc' || tri === 'prix_desc') {
      tries.sort((a: Prestataire, b: Prestataire) => {
        const prixA = prixMinimum(a);
        const prixB = prixMinimum(b);
        if (prixA === null && prixB === null) return 0;
        if (prixA === null) return 1;
        if (prixB === null) return -1;
        return tri === 'prix_asc' ? prixA - prixB : prixB - prixA;
      });
    } else if (tri === 'note_desc') {
      tries.sort((a: Prestataire, b: Prestataire) => (b.noteMoyenne ?? 0) - (a.noteMoyenne ?? 0));
    }

    return tries;
  }, [prestataires, tri, modeServiceActif, recherche]);

  function reinitialiserFiltres(): void {
    setTri('pertinence');
    setModeServiceActif(null);
  }

  return (
    <section className="min-h-full bg-surface-0 text-left text-ink">
      <header className="px-5 pb-4 pt-7">
        <h1 className="m-0 text-2xl font-black tracking-tight text-ink">Explorer</h1>

        <div className="mt-4 flex items-center gap-2">
          <label className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-4 text-sm text-muted shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <SearchIcon className="h-4 w-4 flex-none text-muted" />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink outline-none placeholder:text-muted"
              onChange={(event: ChangeEvent<HTMLInputElement>) => setRecherche(event.target.value)}
              placeholder="Service, nom, compétence..."
              type="text"
              value={recherche}
            />
          </label>
          <button
            aria-label={`Filtres${nombreFiltresActifs > 0 ? ` (${nombreFiltresActifs} actifs)` : ''}`}
            className="relative flex h-12 w-12 flex-none items-center justify-center rounded-full bg-white text-ink shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition active:scale-[0.96]"
            onClick={() => setPanneauFiltresOuvert(true)}
            type="button"
          >
            <FilterIcon className="h-4 w-4" />
            {nombreFiltresActifs > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-kwiik text-[10px] font-bold text-white">
                {nombreFiltresActifs}
              </span>
            )}
          </button>
        </div>

        <label className="mt-3 flex h-10 items-center gap-2 rounded-full border border-line bg-white px-3 text-xs text-muted">
          <LocationIcon className="h-3.5 w-3.5 flex-none text-muted" />
          <select
            className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-ink outline-none"
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setVilleActive(event.target.value)}
            value={villeActive}
          >
            <option value="">Toutes les villes</option>
            {villes.map((ville: string) => (
              <option key={ville} value={ville}>
                {ville}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="flex gap-2 overflow-x-auto px-5 py-3">
        <button
          className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition active:scale-[0.98] ${
            categorieActive === null ? 'bg-ink text-white' : 'bg-white text-muted shadow-[0_8px_18px_rgba(26,26,24,0.06)]'
          }`}
          onClick={() => setCategorieActive(null)}
          type="button"
        >
          Tous
        </button>
        {categories.map((categorie: CategoriePrestataire) => (
          <button
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition active:scale-[0.98] ${
              categorieActive === categorie.nom ? 'bg-coral text-white' : 'bg-white text-muted shadow-[0_8px_18px_rgba(26,26,24,0.06)]'
            }`}
            key={categorie.id}
            onClick={() => setCategorieActive(categorie.nom)}
            type="button"
          >
            {categorie.nom}
          </button>
        ))}
      </div>

      <div className="px-5 pb-5">
        {erreurCategories && <p className="m-0 mb-2 text-sm font-semibold text-danger-strong">{erreurCategories}</p>}
        {erreurVilles && <p className="m-0 mb-2 text-sm font-semibold text-danger-strong">{erreurVilles}</p>}
        {chargement && <SquelettesCartes />}
        {erreurPrestataires && <p className="m-0 text-sm font-semibold text-danger-strong">{erreurPrestataires}</p>}

        {!chargement && !erreurPrestataires && prestatairesAffiches.length === 0 && (
          <p className="m-0 rounded-[18px] bg-white p-4 text-sm text-muted shadow-[0_10px_25px_rgba(26,26,24,0.06)]">
            {prestataires.length === 0
              ? 'Aucun prestataire trouvé. Essayez une autre ville ou une autre catégorie.'
              : 'Aucun résultat avec ces filtres. Essayez de les modifier ou de les réinitialiser.'}
          </p>
        )}

        {!chargement && !erreurPrestataires && prestatairesAffiches.length > 0 && (
          <>
            <p className="m-0 mb-3 text-xs font-semibold text-muted">{prestatairesAffiches.length} prestataire{prestatairesAffiches.length > 1 ? 's' : ''}</p>
            <div className="grid grid-cols-2 gap-3">
            {prestatairesAffiches.map((prestataire: Prestataire) => {
              const nom = nomPrestataire(prestataire);
              const prix = prixDepart(prestataire);
              const estFavori = idsFavoris.has(prestataire.id);

              return (
                <div className="relative overflow-hidden rounded-2xl bg-white shadow-[0_10px_25px_rgba(26,26,24,0.06)]" key={prestataire.id}>
                  <button
                    aria-label={estFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-kwiik shadow-sm transition active:scale-[0.9] disabled:opacity-60"
                    disabled={favoriEnCours === prestataire.id}
                    onClick={() => void basculerFavori(prestataire.id)}
                    type="button"
                  >
                    <HeartIcon className="h-3.5 w-3.5" rempli={estFavori} />
                  </button>
                  <button
                    aria-label={`Voir le profil de ${nom}`}
                    className="block w-full text-left transition active:scale-[0.98]"
                    onClick={() => onSelectionner(prestataire.id)}
                    type="button"
                  >
                    <div className="relative h-[110px] bg-soft-map">
                      {prestataire.photoLieuUrl ? (
                        <img
                          alt={`Lieu ${nom}`}
                          className="h-full w-full object-cover"
                          src={urlImage(prestataire.photoLieuUrl)}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-coral-soft via-white to-teal-soft text-2xl font-black text-coral-dark">
                          {initialesPrestataire(nom)}
                        </div>
                      )}
                      {prestataire.verifie && (
                        <span aria-label="Prestataire verifie" className="absolute left-2 top-2 flex h-6 items-center gap-1 rounded-full bg-white/90 px-2 text-[10px] font-bold text-kwiik-dark">
                          ✓ Vérifié
                        </span>
                      )}
                      {!estAbonnementDecouverte(prestataire.abonnement) && (
                        <span className="absolute bottom-2 right-2 rounded-full bg-lime px-2 py-1 text-[10px] font-bold text-lime-dark">
                          {prestataire.abonnement?.nom}
                        </span>
                      )}
                    </div>

                    <div className="px-3 pt-2">
                      <p className="m-0 flex items-center justify-between gap-2 text-[13px] font-bold tracking-tight text-ink">
                        <span className="truncate">{nom}</span>
                        {prestataire.nombreAvis > 0 && prestataire.noteMoyenne !== null && (
                          <span className="flex flex-none items-center gap-0.5 text-[12px] font-semibold text-amber-star">
                            ★ {formatNote(prestataire.noteMoyenne)}
                          </span>
                        )}
                      </p>
                      <p className="m-0 mt-0.5 truncate text-[12px] text-muted">
                        {libelleCategories(prestataire)} · {prestataire.ville}
                      </p>
                    </div>
                  </button>

                  <div className="px-3 pb-3 pt-2">
                    <p className="m-0 mb-2 text-[13px] font-black text-kwiik">
                      {prix ?? 'Sur devis'}
                    </p>
                    <button
                      className="flex h-9 w-full items-center justify-center rounded-full bg-kwiik text-xs font-bold text-white transition active:scale-[0.98]"
                      onClick={() => onSelectionner(prestataire.id)}
                      type="button"
                    >
                      Réserver
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          </>
        )}
      </div>

      {panneauFiltresOuvert && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" role="presentation">
          <button
            aria-label="Fermer les filtres"
            className="absolute inset-0 cursor-default"
            onClick={() => setPanneauFiltresOuvert(false)}
            type="button"
          />
          <div className="relative z-10 w-full max-w-md rounded-t-[24px] bg-white p-5 pb-7" role="dialog" aria-modal="true" aria-label="Filtres et tri">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="m-0 text-base font-bold tracking-normal text-ink">Filtres et tri</h2>
              <button
                aria-label="Fermer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-1 text-ink"
                onClick={() => setPanneauFiltresOuvert(false)}
                type="button"
              >
                ✕
              </button>
            </div>

            <p className="m-0 mb-2 text-xs font-bold uppercase text-muted">Trier par</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {(Object.keys(libellesTri) as Tri[]).map((option: Tri) => (
                <button
                  className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold transition active:scale-[0.98] ${
                    tri === option ? 'bg-ink text-white' : 'bg-surface-1 text-muted'
                  }`}
                  key={option}
                  onClick={() => setTri(option)}
                  type="button"
                >
                  {libellesTri[option]}
                </button>
              ))}
            </div>

            <p className="m-0 mb-2 text-xs font-bold uppercase text-muted">Mode de service</p>
            <div className="mb-5 flex flex-wrap gap-2">
              <button
                className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold transition active:scale-[0.98] ${
                  modeServiceActif === null ? 'bg-ink text-white' : 'bg-surface-1 text-muted'
                }`}
                onClick={() => setModeServiceActif(null)}
                type="button"
              >
                Tous
              </button>
              {(Object.keys(libellesModeService) as ModeService[]).map((option: ModeService) => (
                <button
                  className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold transition active:scale-[0.98] ${
                    modeServiceActif === option ? 'bg-coral text-white' : 'bg-surface-1 text-muted'
                  }`}
                  key={option}
                  onClick={() => setModeServiceActif(option)}
                  type="button"
                >
                  {libellesModeService[option]}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                className="h-11 flex-1 rounded-[15px] bg-surface-1 text-sm font-bold text-ink transition active:scale-[0.98]"
                onClick={reinitialiserFiltres}
                type="button"
              >
                Réinitialiser
              </button>
              <button
                className="h-11 flex-1 rounded-[15px] bg-ink text-sm font-bold text-white transition active:scale-[0.98]"
                onClick={() => setPanneauFiltresOuvert(false)}
                type="button"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}