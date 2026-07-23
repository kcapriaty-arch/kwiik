import { useEffect, useMemo, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { api } from './api';

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
}

interface IconProps {
  className?: string;
}

const urlBackend = 'http://localhost:3000';

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

function formatPrixFcfa(prix: number): string {
  return `${formatteurFcfa.format(prix)} FCFA`;
}

function formatNote(note: number): string {
  return formatteurNote.format(note);
}

function etoiles(note: number | null): string {
  const noteArrondie = Math.max(0, Math.min(5, Math.round(note ?? 0)));
  return `${'\u2605'.repeat(noteArrondie)}${'\u2606'.repeat(5 - noteArrondie)}`;
}

function urlImageBackend(url: string): string {
  return `${urlBackend}${url}`;
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

function prixDepart(prestataire: Prestataire): string | null {
  if (prestataire.prestations.length === 0) {
    return null;
  }

  const minimum = Math.min(...prestataire.prestations.map((prestation: Prestation) => prestation.prix));
  return formatPrixFcfa(minimum);
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

  const resumeRecherche = useMemo<string>(() => {
    const service = categorieActive ?? 'Tous les services';
    const ville = villeActive || 'Toutes les villes';
    return `${service} · ${ville}`;
  }, [categorieActive, villeActive]);

  function gererClavierCarte(event: KeyboardEvent<HTMLElement>, prestataireId: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectionner(prestataireId);
    }
  }

  return (
    <section className="min-h-full bg-cream text-left text-ink">
      <header className="bg-white px-5 pb-4 pt-5 shadow-[0_12px_30px_rgba(26,26,24,0.06)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="m-0 text-xs font-bold uppercase text-coral-dark">Résultats KWIIK</p>
            <h1 className="m-0 mt-1 truncate text-[22px] font-bold tracking-normal text-ink">Trouvez le bon pro</h1>
          </div>
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-coral-soft text-sm font-bold text-coral-dark">
            KW
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <div className="flex h-11 min-w-0 items-center gap-2 rounded-[15px] bg-surface-1 px-3 text-sm font-semibold text-ink">
            <SearchIcon className="h-4 w-4 flex-none text-coral-dark" />
            <span className="truncate">{resumeRecherche}</span>
          </div>
          <button
            aria-label="Filtres"
            className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-ink text-white transition active:scale-[0.98]"
            type="button"
          >
            <FilterIcon className="h-4 w-4" />
          </button>
        </div>

        <label className="mt-3 flex h-11 items-center gap-2 rounded-[15px] border border-line bg-white px-3 text-sm text-muted">
          <LocationIcon className="h-4 w-4 flex-none text-teal-dark" />
          <select
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink outline-none"
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
        {chargement && <p className="m-0 rounded-[18px] bg-white p-4 text-sm text-muted">Chargement des prestataires...</p>}
        {erreurPrestataires && <p className="m-0 text-sm font-semibold text-danger-strong">{erreurPrestataires}</p>}

        {!chargement && !erreurPrestataires && prestataires.length === 0 && (
          <p className="m-0 rounded-[18px] bg-white p-4 text-sm text-muted shadow-[0_10px_25px_rgba(26,26,24,0.06)]">
            Aucun prestataire trouvé. Essayez une autre ville ou une autre catégorie.
          </p>
        )}

        {!chargement && !erreurPrestataires && prestataires.length > 0 && (
          <div className="grid gap-4">
            {prestataires.map((prestataire: Prestataire) => {
              const nom = nomPrestataire(prestataire);
              const prix = prixDepart(prestataire);
              const deuxPrestations = prestataire.prestations.slice(0, 2);

              return (
                <article
                  className="overflow-hidden rounded-[22px] bg-white shadow-[0_14px_35px_rgba(26,26,24,0.10)] transition active:scale-[0.99]"
                  key={prestataire.id}
                  onClick={() => onSelectionner(prestataire.id)}
                  onKeyDown={(event: KeyboardEvent<HTMLElement>) => gererClavierCarte(event, prestataire.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="relative h-[136px] bg-soft-map">
                    {prestataire.photoLieuUrl ? (
                      <img
                        alt={`Lieu ${nom}`}
                        className="h-full w-full object-cover"
                        src={urlImageBackend(prestataire.photoLieuUrl)}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-coral-soft via-white to-teal-soft text-4xl font-black text-coral-dark">
                        {initialesPrestataire(nom)}
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/48 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
                      <div className="min-w-0 text-white">
                        <h2 className="m-0 truncate text-lg font-bold tracking-normal">{nom}</h2>
                        <p className="m-0 mt-0.5 truncate text-xs font-medium text-white/85">{libelleCategories(prestataire)}</p>
                      </div>
                      {!estAbonnementDecouverte(prestataire.abonnement) && (
                        <span className="flex-none rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-coral-dark">
                          {prestataire.abonnement?.nom}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                      {prestataire.nombreAvis > 0 && prestataire.noteMoyenne !== null ? (
                        <span aria-label={`Note moyenne ${formatNote(prestataire.noteMoyenne)} sur 5`} className="font-bold text-amber-star">
                          {etoiles(prestataire.noteMoyenne)} {formatNote(prestataire.noteMoyenne)}
                          <span className="font-semibold text-muted"> ({prestataire.nombreAvis} avis)</span>
                        </span>
                      ) : (
                        <span className="font-semibold text-muted">Pas encore d'avis</span>
                      )}
                      <span className="text-line">|</span>
                      <span className="font-semibold text-muted">
                        {prestataire.ville}{prestataire.quartier ? ` · ${prestataire.quartier}` : ''}
                      </span>
                    </div>

                    {prestataire.description && (
                      <p className="m-0 mb-3 line-clamp-2 text-[13px] leading-5 text-muted">{prestataire.description}</p>
                    )}

                    {deuxPrestations.length > 0 && (
                      <div className="mb-3 grid gap-2">
                        {deuxPrestations.map((prestation: Prestation) => (
                          <div className="flex items-center justify-between gap-3 rounded-[14px] bg-surface-1 px-3 py-2" key={prestation.id}>
                            <span className="min-w-0 truncate text-xs font-semibold text-ink">{prestation.titre}</span>
                            <span className="flex-none text-xs font-bold text-coral-dark">{formatPrixFcfa(prestation.prix)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13px] text-muted">
                        {prix ? <>Dès <strong className="font-bold text-ink">{prix}</strong></> : 'Catalogue à venir'}
                      </span>
                      <span className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-white">
                        Voir
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}