import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { api, urlImage } from './api';
import { useNotificationsNonLues } from './notifications/useNotificationsNonLues';
import { useSession } from './session';
import { initialesDepuisNom } from './ui';

interface AccueilProps {
  onRechercher: (nomCategorie: string, ville: string) => void;
  onDevenirPrestataire?: () => void;
  onSelectionnerPrestataire?: (id: string) => void;
  onOuvrirNotifications?: () => void;
}

interface DomaineCategorie {
  id: string;
  nom: string;
  ordre?: number;
}

interface CategorieOption {
  id: string;
  nom: string;
  domaine?: DomaineCategorie | null;
}

interface UtilisateurRecommande {
  nom: string;
}

interface Prestation {
  prix: number;
}

interface PrestataireRecommande {
  id: string;
  ville: string;
  photoLieuUrl?: string | null;
  categories: CategorieOption[];
  prestations: Prestation[];
  utilisateur: UtilisateurRecommande;
  noteMoyenne: number | null;
  nombreAvis: number;
  verifie?: boolean;
}

interface IconProps {
  className?: string;
}

function SearchIcon({ className = '' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function BellIcon({ className = '' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
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

function BriefcaseIcon({ className = '' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1" />
      <rect height="14" rx="3" width="18" x="3" y="6" />
      <path d="M3 12h18" />
    </svg>
  );
}

function ArrowRightIcon({ className = '' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function CategoryGlyph({ index }: { index: number }) {
  const variante = index % 6;

  if (variante === 0) {
    return (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M4 14h16" />
        <path d="M6 14v5" />
        <path d="M18 14v5" />
        <path d="M8 10a4 4 0 0 1 8 0v4H8z" />
      </svg>
    );
  }

  if (variante === 1) {
    return (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M4 18h16" />
        <path d="M7 18V9a5 5 0 0 1 10 0v9" />
        <path d="M10 9h4" />
      </svg>
    );
  }

  if (variante === 2) {
    return (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M7 21h10" />
        <path d="M12 17v4" />
        <path d="M5 9a7 7 0 0 1 14 0v4a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z" />
      </svg>
    );
  }

  if (variante === 3) {
    return (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M5 12h14" />
        <path d="M7 12v7" />
        <path d="M17 12v7" />
        <path d="M9 12V7a3 3 0 0 1 6 0v5" />
      </svg>
    );
  }

  if (variante === 4) {
    return (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M4 20h16" />
        <path d="M6 20V8l6-4 6 4v12" />
        <path d="M10 20v-6h4v6" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-7 w-7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  );
}

const fondsCategories = [
  'bg-[#FCE4EC] text-[#C2185B]',
  'bg-[#F1E9FE] text-[#7C4DFF]',
  'bg-[#E3F2FD] text-[#3B6E91]',
  'bg-[#FFF6D9] text-[#C98A12]',
  'bg-[#FFE9DC] text-[#D9722A]',
  'bg-[#E8F7E9] text-[#3E8E4F]',
];

function prixDepart(prestataire: PrestataireRecommande): string | null {
  if (prestataire.prestations.length === 0) {
    return null;
  }

  const minimum = Math.min(...prestataire.prestations.map((prestation: Prestation) => prestation.prix));
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(minimum)} FCFA`;
}

export function Accueil({ onRechercher, onDevenirPrestataire, onSelectionnerPrestataire, onOuvrirNotifications }: AccueilProps) {
  const { utilisateur } = useSession();
  const notificationsNonLues = useNotificationsNonLues();
  const [categorie, setCategorie] = useState<string>('');
  const [categoriesPopulaires, setCategoriesPopulaires] = useState<CategorieOption[]>([]);
  const [chargementCategories, setChargementCategories] = useState<boolean>(true);
  const [erreurCategories, setErreurCategories] = useState<string>('');
  const [prestatairesRecommandes, setPrestatairesRecommandes] = useState<PrestataireRecommande[]>([]);
  const [chargementRecommandes, setChargementRecommandes] = useState<boolean>(true);
  const [idsFavoris, setIdsFavoris] = useState<Set<string>>(new Set());
  const [favoriEnCours, setFavoriEnCours] = useState<string>('');

  useEffect(() => {
    async function chargerCategories(): Promise<void> {
      setChargementCategories(true);
      setErreurCategories('');

      try {
        const { data } = await api.get<CategorieOption[]>('/prestataires/categories');
        setCategoriesPopulaires(data);
      } catch {
        setErreurCategories('Impossible de charger les catégories populaires.');
      } finally {
        setChargementCategories(false);
      }
    }

    chargerCategories();
  }, []);

  useEffect(() => {
    async function chargerRecommandes(): Promise<void> {
      setChargementRecommandes(true);

      try {
        const { data } = await api.get<PrestataireRecommande[]>('/prestataires');
        setPrestatairesRecommandes(data.slice(0, 6));
      } catch {
        setPrestatairesRecommandes([]);
      } finally {
        setChargementRecommandes(false);
      }
    }

    chargerRecommandes();
  }, []);

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

  const categoriesAffichees = useMemo<CategorieOption[]>(
    () => categoriesPopulaires.slice(0, 8),
    [categoriesPopulaires],
  );

  const nomAffiche = utilisateur?.nom?.trim() || 'Utilisateur KWIIK';
  const initiales = initialesDepuisNom(utilisateur?.nom || utilisateur?.telephone, 'KW');

  function rechercher(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onRechercher(categorie.trim(), '');
  }

  return (
    <section className="min-h-full bg-surface-0 text-left text-ink">
      <header className="flex items-center justify-between gap-4 px-5 pt-7">
        <div className="min-w-0">
          <p className="m-0 text-xs font-semibold text-muted">Bonjour 👋</p>
          <p className="m-0 truncate text-lg font-black tracking-tight text-ink">{nomAffiche}</p>
        </div>
        <div className="flex flex-none items-center gap-2">
          <button
            aria-label="Notifications"
            className="relative flex h-10 w-10 flex-none items-center justify-center rounded-full bg-surface-1 text-ink transition hover:bg-surface-2 active:scale-[0.98]"
            onClick={onOuvrirNotifications}
            type="button"
          >
            <BellIcon className="h-5 w-5" />
            {notificationsNonLues > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-strong px-1 text-[9px] font-bold text-white">
                {notificationsNonLues > 9 ? '9+' : notificationsNonLues}
              </span>
            )}
          </button>
          <div className="flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-full border border-line bg-white text-xs font-semibold text-ink">
            {utilisateur?.photoProfilUrl ? (
              <img alt="" className="h-full w-full object-cover" src={urlImage(utilisateur.photoProfilUrl)} />
            ) : (
              initiales
            )}
          </div>
        </div>
      </header>

      <div className="px-5 pt-5">
        <form onSubmit={rechercher}>
          <label className="flex h-12 items-center gap-2 rounded-full bg-white px-4 text-sm text-muted shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <SearchIcon className="h-4 w-4 flex-none text-muted" />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink outline-none placeholder:text-muted"
              onChange={(event) => setCategorie(event.target.value)}
              placeholder="Quel service cherchez-vous ?"
              type="text"
              value={categorie}
            />
          </label>
        </form>
      </div>

      <section className="px-5 pt-7">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="m-0 text-base font-black tracking-tight text-ink">Catégories</h2>
          <button className="flex items-center gap-1 text-xs font-bold text-kwiik" onClick={() => onRechercher('', '')} type="button">
            Voir tout
            <ArrowRightIcon className="h-3 w-3" />
          </button>
        </div>

        {chargementCategories && <p className="m-0 text-sm text-muted">Chargement des catégories...</p>}
        {erreurCategories && <p className="m-0 text-sm font-semibold text-danger-strong">{erreurCategories}</p>}

        {categoriesAffichees.length > 0 && (
          <div className="grid grid-cols-4 gap-3">
            {categoriesAffichees.map((categoriePopulaire: CategorieOption, index: number) => (
              <button
                className="min-w-0 text-center transition active:scale-[0.98]"
                key={categoriePopulaire.id}
                onClick={() => onRechercher(categoriePopulaire.nom, '')}
                type="button"
              >
                <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] ${fondsCategories[index % fondsCategories.length]}`}>
                  <CategoryGlyph index={index} />
                </span>
                <span className="mt-2 block truncate text-[11px] font-medium text-muted">
                  {categoriePopulaire.nom}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="px-5 py-7">
        <div className="relative overflow-hidden rounded-2xl bg-kwiik p-5">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <p className="relative m-0 text-[11px] font-black uppercase tracking-wide text-lime">Pour les pros</p>
          <h2 className="relative m-0 mt-1.5 max-w-[220px] text-lg font-black leading-snug text-white">
            Recevez vos demandes et remplissez votre agenda
          </h2>

          {onDevenirPrestataire && (
            <button
              className="relative mt-4 flex h-10 items-center justify-center gap-2 rounded-full bg-lime px-5 text-sm font-black text-lime-dark transition active:scale-[0.98]"
              onClick={onDevenirPrestataire}
              type="button"
            >
              <BriefcaseIcon className="h-4 w-4" />
              Devenir prestataire
            </button>
          )}
        </div>
      </section>

      <section className="px-5 pb-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="m-0 text-base font-black tracking-tight text-ink">Disponibles maintenant</h2>
          <button className="flex items-center gap-1 text-xs font-bold text-kwiik" onClick={() => onRechercher('', '')} type="button">
            Voir tout
            <ArrowRightIcon className="h-3 w-3" />
          </button>
        </div>

        {chargementRecommandes && <p className="m-0 text-sm text-muted">Chargement...</p>}

        {!chargementRecommandes && prestatairesRecommandes.length > 0 && (
          <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
            {prestatairesRecommandes.map((prestataire: PrestataireRecommande) => {
              const prix = prixDepart(prestataire);

              const estFavori = idsFavoris.has(prestataire.id);

              return (
                <div className="relative w-[172px] flex-none overflow-hidden rounded-2xl bg-white" key={prestataire.id}>
                  <button
                    aria-label={estFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-kwiik shadow-sm transition active:scale-[0.9] disabled:opacity-60"
                    disabled={favoriEnCours === prestataire.id}
                    onClick={() => void basculerFavori(prestataire.id)}
                    type="button"
                  >
                    <HeartIcon className="h-4 w-4" rempli={estFavori} />
                  </button>
                  <button
                    className="block w-full text-left transition active:scale-[0.98]"
                    onClick={() => onSelectionnerPrestataire?.(prestataire.id)}
                    type="button"
                  >
                    <div className="relative h-[140px] overflow-hidden rounded-2xl bg-soft-map">
                      {prestataire.photoLieuUrl ? (
                        <img alt={prestataire.utilisateur.nom} className="h-full w-full object-cover" src={urlImage(prestataire.photoLieuUrl)} />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-ink">
                          {initialesDepuisNom(prestataire.utilisateur.nom, 'KW')}
                        </div>
                      )}
                      {prestataire.verifie && (
                        <span aria-label="Prestataire verifie" className="absolute left-2.5 top-2.5 flex h-6 items-center gap-1 rounded-full bg-white/90 px-2 text-[10px] font-bold text-kwiik-dark">
                          ✓ Vérifié
                        </span>
                      )}
                    </div>
                    <div className="px-0.5 pt-2">
                      <p className="m-0 flex items-center justify-between gap-2 text-[13px] font-bold tracking-tight text-ink">
                        <span className="truncate">{prestataire.utilisateur.nom || 'Prestataire KWIIK'}</span>
                        {prestataire.nombreAvis > 0 && prestataire.noteMoyenne !== null && (
                          <span className="flex flex-none items-center gap-0.5 text-[12px] font-semibold text-amber-star">
                            ★ {prestataire.noteMoyenne.toFixed(1)}
                          </span>
                        )}
                      </p>
                      <p className="m-0 mt-0.5 truncate text-[12px] text-muted">
                        {prestataire.categories[0]?.nom ?? 'Service'} · {prestataire.ville}
                      </p>
                    </div>
                  </button>
                  <div className="px-0.5 pb-0.5 pt-2">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[13px] font-black text-kwiik">{prix ?? 'Sur devis'}</span>
                    </div>
                    <button
                      className="flex h-9 w-full items-center justify-center rounded-full bg-kwiik text-xs font-bold text-white transition active:scale-[0.98]"
                      onClick={() => onSelectionnerPrestataire?.(prestataire.id)}
                      type="button"
                    >
                      Réserver
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
