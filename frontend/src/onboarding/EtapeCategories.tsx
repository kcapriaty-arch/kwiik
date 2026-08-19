import { useEffect, useState } from 'react';
import { api } from '../api';
import { Badge } from '../ui';
import { extraireMessageErreur } from './erreurApi';
import type { DefinitionEtape, EtapeProps } from './types';

const MAX_CATEGORIES = 5;

interface CategorieOption {
  id: string;
  nom: string;
  licenceRequise: boolean;
}

interface DomaineOption {
  id: string;
  nom: string;
  categories: CategorieOption[];
}

function EtapeCategories({ etat, majEtat, suivant, estDerniere, envoi }: EtapeProps) {
  const [domaines, setDomaines] = useState<DomaineOption[]>([]);
  const [chargement, setChargement] = useState<boolean>(true);
  const [erreur, setErreur] = useState<string>('');

  useEffect(() => {
    async function chargerDomaines(): Promise<void> {
      setChargement(true);
      setErreur('');

      try {
        const { data } = await api.get<DomaineOption[]>('/prestataires/domaines');
        setDomaines(data);
      } catch (error: unknown) {
        setErreur(extraireMessageErreur(error, 'Impossible de charger les categories.'));
      } finally {
        setChargement(false);
      }
    }

    void chargerDomaines();
  }, []);

  function licenceRequisePour(categorieIds: string[]): boolean {
    const toutesCategories = domaines.flatMap((domaine) => domaine.categories);
    return categorieIds.some((id) => toutesCategories.find((c) => c.id === id)?.licenceRequise);
  }

  function basculerCategorie(categorieId: string): void {
    const dejaChoisie = etat.categorieIds.includes(categorieId);

    if (!dejaChoisie && etat.categorieIds.length >= MAX_CATEGORIES) {
      return;
    }

    const categorieIds = dejaChoisie
      ? etat.categorieIds.filter((id) => id !== categorieId)
      : [...etat.categorieIds, categorieId];

    majEtat({ categorieIds, licenceRequisePourSelection: licenceRequisePour(categorieIds) });
  }

  const peutContinuer = etat.categorieIds.length > 0 && etat.categorieIds.length <= MAX_CATEGORIES;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="m-0 text-lg font-black text-ink">Votre boutique</p>
          <p className="m-0 mt-1 text-sm leading-5 text-muted">
            Choisissez de 1 a {MAX_CATEGORIES} prestations que vous realisez. Les documents demandes ensuite en dependent.
          </p>
        </div>
        <Badge variante={etat.categorieIds.length > 0 ? 'kwiik' : 'neutral'}>
          {etat.categorieIds.length}/{MAX_CATEGORIES}
        </Badge>
      </div>

      {chargement && <p className="m-0 text-sm text-muted">Chargement des categories...</p>}
      {erreur && <p className="m-0 rounded-xl bg-danger-soft p-3 text-sm font-semibold text-danger-strong">{erreur}</p>}

      <div className="grid gap-4">
        {domaines.map((domaine) => (
          <div className="grid gap-2" key={domaine.id}>
            <strong className="text-[13px] font-semibold text-ink">{domaine.nom}</strong>
            <div className="flex flex-wrap gap-2">
              {domaine.categories.map((categorie) => {
                const cochee = etat.categorieIds.includes(categorie.id);
                const desactivee = !cochee && etat.categorieIds.length >= MAX_CATEGORIES;

                return (
                  <label
                    className={`cursor-pointer rounded-full px-3 py-2 text-xs font-semibold transition ${
                      cochee ? 'bg-ink text-white' : desactivee ? 'bg-surface-1 text-[#C7C3B8]' : 'bg-surface-1 text-muted'
                    }`}
                    key={categorie.id}
                  >
                    <input
                      checked={cochee}
                      className="sr-only"
                      disabled={desactivee}
                      onChange={() => basculerCategorie(categorie.id)}
                      type="checkbox"
                    />
                    {categorie.nom}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] bg-ink px-4 text-sm font-black text-white shadow-[0_12px_25px_rgba(26,26,24,0.18)] transition active:scale-[0.99] disabled:bg-[#B8B4AA] disabled:shadow-none"
        disabled={!peutContinuer}
        onClick={() => void suivant()}
        type="button"
      >
        {envoi ? 'Envoi...' : estDerniere ? 'Terminer' : 'Continuer'}
      </button>
    </div>
  );
}

export const etapeCategories: DefinitionEtape = {
  id: 'categories',
  titre: 'Categories',
  estApplicable: () => true,
  estComplete: (etat) => etat.categorieIds.length > 0 && etat.categorieIds.length <= MAX_CATEGORIES,
  Composant: EtapeCategories,
};
