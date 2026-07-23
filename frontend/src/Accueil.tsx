import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from './api';

interface AccueilProps {
  onRechercher: (nomCategorie: string, ville: string) => void;
  onDevenirPrestataire?: () => void;
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

function LocationIcon({ className = '' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 21s7-5.3 7-12a7 7 0 0 0-14 0c0 6.7 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
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
  'bg-coral-soft text-coral-dark',
  'bg-teal-soft text-teal-dark',
  'bg-kwiik-light text-kwiik-dark',
  'bg-warning-soft text-warning-strong',
  'bg-soft-map text-kwiik-dark',
  'bg-success-soft text-success-strong',
];

export function Accueil({ onRechercher, onDevenirPrestataire }: AccueilProps) {
  const [categorie, setCategorie] = useState<string>('');
  const [ville, setVille] = useState<string>('');
  const [categoriesPopulaires, setCategoriesPopulaires] = useState<CategorieOption[]>([]);
  const [chargementCategories, setChargementCategories] = useState<boolean>(true);
  const [erreurCategories, setErreurCategories] = useState<string>('');

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

  const categoriesAffichees = useMemo<CategorieOption[]>(
    () => categoriesPopulaires.slice(0, 8),
    [categoriesPopulaires],
  );

  function rechercher(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onRechercher(categorie.trim(), ville.trim());
  }

  return (
    <section className="min-h-full bg-cream text-left text-ink">
      <header className="relative overflow-hidden rounded-b-[34px] bg-coral px-5 pb-24 pt-5 text-white shadow-[0_18px_40px_rgba(242,95,92,0.24)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="m-0 text-[12px] font-semibold uppercase text-white/75">KWIIK</p>
            <h1 className="m-0 mt-1 text-[25px] font-bold leading-tight text-white">
              Trouvez un service près de chez vous
            </h1>
          </div>
          <button
            aria-label="Notifications"
            className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-white/18 text-white ring-1 ring-white/25 transition active:scale-[0.98]"
            type="button"
          >
            <BellIcon className="h-5 w-5" />
          </button>
        </div>
        <p className="m-0 mt-3 max-w-[300px] text-sm leading-6 text-white/85">
          Réservez un pro fiable pour la beauté, la maison, les réparations et les services du quotidien.
        </p>
        <div className="absolute -bottom-20 right-[-54px] h-48 w-48 rounded-full bg-white/14" />
        <div className="absolute -bottom-10 left-[-42px] h-32 w-32 rounded-full bg-coral-dark/30" />
      </header>

      <div className="relative z-10 -mt-16 px-5">
        <form
          className="rounded-[24px] bg-white p-4 shadow-[0_18px_45px_rgba(26,26,24,0.14)]"
          onSubmit={rechercher}
        >
          <label className="flex h-12 items-center gap-3 rounded-[16px] bg-surface-1 px-3 text-sm text-muted focus-within:ring-2 focus-within:ring-coral/30">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-coral-soft text-coral-dark">
              <SearchIcon className="h-4 w-4" />
            </span>
            <input
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink outline-none placeholder:text-[#9A988F]"
              onChange={(event) => setCategorie(event.target.value)}
              placeholder="Que cherchez-vous ?"
              type="text"
              value={categorie}
            />
          </label>

          <label className="mt-3 flex h-12 items-center gap-3 rounded-[16px] bg-surface-1 px-3 text-sm text-muted focus-within:ring-2 focus-within:ring-teal/25">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-soft text-teal-dark">
              <LocationIcon className="h-4 w-4" />
            </span>
            <input
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink outline-none placeholder:text-[#9A988F]"
              onChange={(event) => setVille(event.target.value)}
              placeholder="Où ? Ville ou quartier"
              type="text"
              value={ville}
            />
          </label>

          <button
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[16px] bg-ink text-sm font-bold text-white shadow-[0_12px_24px_rgba(26,26,24,0.18)] transition active:scale-[0.98]"
            type="submit"
          >
            Rechercher
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </form>
      </div>

      <section className="px-5 pt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="m-0 text-[16px] font-bold tracking-normal text-ink">Catégories populaires</h2>
          <button className="text-xs font-bold text-coral-dark" onClick={() => onRechercher('', '')} type="button">
            Voir tout
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
                <span className={`mx-auto flex h-[62px] w-[62px] items-center justify-center rounded-[20px] ${fondsCategories[index % fondsCategories.length]}`}>
                  <CategoryGlyph index={index} />
                </span>
                <span className="mt-2 block truncate text-[11px] font-semibold text-muted">
                  {categoriePopulaire.nom}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="px-5 py-6">
        <div className="rounded-[22px] bg-soft-map p-4 shadow-[0_12px_30px_rgba(24,95,165,0.10)]">
          <div className="flex items-center gap-4">
            <div className="relative h-[88px] w-[96px] flex-none overflow-hidden rounded-[20px] bg-white">
              <div className="absolute left-4 top-5 h-10 w-10 rounded-full bg-teal" />
              <div className="absolute bottom-4 right-4 h-9 w-12 rounded-[14px] bg-coral" />
              <div className="absolute left-7 top-8 h-12 w-12 rounded-full border-[6px] border-white bg-kwiik" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="m-0 text-[11px] font-bold uppercase text-kwiik">Pour les pros</p>
              <h2 className="m-0 mt-1 text-[16px] font-bold leading-snug text-ink">Recevez vos demandes et remplissez votre agenda</h2>
              <p className="m-0 mt-1 text-xs leading-5 text-muted">Créez une vitrine avec photos, prestations et créneaux.</p>
            </div>
          </div>
          {onDevenirPrestataire && (
            <button
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[15px] bg-teal text-sm font-bold text-white transition active:scale-[0.98]"
              onClick={onDevenirPrestataire}
              type="button"
            >
              <BriefcaseIcon className="h-4 w-4" />
              Devenir prestataire
            </button>
          )}
        </div>
      </section>
    </section>
  );
}