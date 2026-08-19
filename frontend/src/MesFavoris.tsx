import { useEffect, useState } from 'react';
import { api, urlImage } from './api';
import { Badge, Carte, EnteteEcran, EtatVide, initialesDepuisNom } from './ui';

interface MesFavorisProps {
  onSelectionner: (id: string) => void;
}

interface CategorieFavori {
  id: string;
  nom: string;
}

interface PrestataireFavori {
  id: string;
  ville: string;
  quartier?: string | null;
  photoLieuUrl?: string | null;
  categories: CategorieFavori[];
  utilisateur: { nom: string };
  noteMoyenne: number | null;
  nombreAvis: number;
  verifie?: boolean;
}

interface ApiErrorResponse {
  response?: { data?: { message?: string | string[] } };
}

function lireMessageErreur(error: unknown): string {
  const message = (error as ApiErrorResponse).response?.data?.message;
  return Array.isArray(message) ? message.join(' ') : message ?? 'Une erreur est survenue.';
}

export function MesFavoris({ onSelectionner }: MesFavorisProps) {
  const [favoris, setFavoris] = useState<PrestataireFavori[]>([]);
  const [chargement, setChargement] = useState<boolean>(true);
  const [erreur, setErreur] = useState<string>('');

  async function charger(): Promise<void> {
    setChargement(true);
    setErreur('');

    try {
      const { data } = await api.get<PrestataireFavori[]>('/favoris');
      setFavoris(data);
    } catch (error: unknown) {
      setErreur(lireMessageErreur(error));
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    charger();
  }, []);

  async function retirer(prestataireId: string): Promise<void> {
    setFavoris((liste) => liste.filter((p) => p.id !== prestataireId));
    try {
      await api.post(`/favoris/${prestataireId}`);
    } catch {
      await charger();
    }
  }

  return (
    <section className="min-h-full bg-surface-0 text-left text-ink">
      <EnteteEcran sousTitre="Vos prestataires enregistres" titre="Mes favoris" />

      <div className="px-5 py-4">
        {chargement && <p className="m-0 text-sm text-muted">Chargement de vos favoris...</p>}
        {erreur && <p className="m-0 rounded-xl bg-danger-soft p-3 text-sm font-semibold text-danger-strong">{erreur}</p>}

        {!chargement && !erreur && favoris.length === 0 && (
          <EtatVide
            message="Ajoutez un prestataire en favori depuis sa fiche pour le retrouver ici rapidement."
            titre="Aucun favori pour le moment"
          />
        )}

        {!chargement && favoris.length > 0 && (
          <div className="grid gap-3">
            {favoris.map((prestataire) => (
              <Carte ariaLabel={prestataire.utilisateur.nom} key={prestataire.id} onClick={() => onSelectionner(prestataire.id)}>
                <div className="flex items-center gap-3">
                  <div className="flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-xl bg-soft-map text-lg font-black text-kwiik-dark">
                    {prestataire.photoLieuUrl ? (
                      <img alt={prestataire.utilisateur.nom} className="h-full w-full object-cover" src={urlImage(prestataire.photoLieuUrl)} />
                    ) : (
                      initialesDepuisNom(prestataire.utilisateur.nom, 'KW')
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 flex items-center gap-1.5 truncate text-sm font-bold text-ink">
                      {prestataire.utilisateur.nom}
                      {prestataire.verifie && <Badge variante="kwiik">Verifie</Badge>}
                    </p>
                    <p className="m-0 mt-0.5 truncate text-xs font-semibold text-muted">
                      {prestataire.categories[0]?.nom ?? 'Service'} · {prestataire.ville}
                    </p>
                    {prestataire.nombreAvis > 0 && prestataire.noteMoyenne !== null ? (
                      <p className="m-0 mt-1 text-xs font-bold text-amber-star">
                        ★ {prestataire.noteMoyenne.toFixed(1)} <span className="font-semibold text-muted">({prestataire.nombreAvis})</span>
                      </p>
                    ) : (
                      <p className="m-0 mt-1 text-xs font-semibold text-muted">Pas encore d'avis</p>
                    )}
                  </div>
                  <button
                    aria-label="Retirer des favoris"
                    className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-surface-1 text-danger-strong"
                    onClick={(event) => {
                      event.stopPropagation();
                      void retirer(prestataire.id);
                    }}
                    type="button"
                  >
                    ✕
                  </button>
                </div>
              </Carte>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
