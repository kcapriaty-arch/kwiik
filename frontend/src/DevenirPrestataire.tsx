import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { api } from './api';
import { uploaderImage } from './upload';
import { Badge, EnteteEcran, EtatVide } from './ui';

interface DevenirPrestataireProps {
  onCree: () => void;
}

interface CategorieOption {
  id: string;
  nom: string;
}

interface DomaineOption {
  id: string;
  nom: string;
  categories: CategorieOption[];
}

interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string | string[];
    };
  };
}

const urlBackend = 'http://localhost:3000';
const champClasse = 'w-full rounded-xl border border-line bg-surface-1 px-3 py-3 text-sm text-ink outline-none transition placeholder:text-[#9A988F] focus:border-kwiik focus:bg-white';
const libelleClasse = 'grid gap-1.5 text-xs font-semibold text-muted';

function lireMessageErreur(error: unknown): string {
  const message = (error as ApiErrorResponse).response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(' ');
  }

  return message ?? 'Une erreur est survenue.';
}

export function DevenirPrestataire({ onCree }: DevenirPrestataireProps) {
  const [domaines, setDomaines] = useState<DomaineOption[]>([]);
  const [categorieIds, setCategorieIds] = useState<string[]>([]);
  const [ville, setVille] = useState<string>('');
  const [quartier, setQuartier] = useState<string>('');
  const [adresse, setAdresse] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [photoLieuUrl, setPhotoLieuUrl] = useState<string>('');
  const [chargement, setChargement] = useState<boolean>(false);
  const [chargementDomaines, setChargementDomaines] = useState<boolean>(true);
  const [uploadEnCours, setUploadEnCours] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [erreur, setErreur] = useState<string>('');

  const formulaireValide =
    categorieIds.length > 0 && ville.trim().length >= 2 && !uploadEnCours;

  useEffect(() => {
    async function chargerDomaines(): Promise<void> {
      setChargementDomaines(true);
      setErreur('');

      try {
        const { data } = await api.get<DomaineOption[]>('/prestataires/domaines');
        setDomaines(data);
      } catch (error: unknown) {
        setErreur(lireMessageErreur(error));
      } finally {
        setChargementDomaines(false);
      }
    }

    chargerDomaines();
  }, []);

  function basculerCategorie(categorieId: string): void {
    setCategorieIds((ids: string[]) => {
      if (ids.includes(categorieId)) {
        return ids.filter((id: string) => id !== categorieId);
      }

      return [...ids, categorieId];
    });
  }

  async function choisirPhotoLieu(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const fichier = event.target.files?.[0];

    if (!fichier) {
      return;
    }

    setUploadEnCours(true);
    setMessage('');
    setErreur('');

    try {
      const url = await uploaderImage(fichier);
      setPhotoLieuUrl(url);
      setMessage('Image du lieu envoyée.');
    } catch (error: unknown) {
      setPhotoLieuUrl('');
      setErreur(lireMessageErreur(error));
    } finally {
      setUploadEnCours(false);
    }
  }

  async function creerVitrine(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!formulaireValide || chargement) {
      return;
    }

    setChargement(true);
    setMessage('');
    setErreur('');

    try {
      await api.post('/prestataires', {
        categorieIds,
        ville: ville.trim(),
        quartier: quartier.trim() || undefined,
        adresse: adresse.trim() || undefined,
        description: description.trim() || undefined,
        photoLieuUrl: photoLieuUrl || undefined,
      });
      setMessage('Vitrine créée avec succès.');
      window.setTimeout(onCree, 700);
    } catch (error: unknown) {
      setErreur(lireMessageErreur(error));
    } finally {
      setChargement(false);
    }
  }

  return (
    <section className="min-h-full bg-surface-2 text-left text-ink">
      <EnteteEcran
        sousTitre="Créez votre vitrine pour apparaître dans la découverte KWIIK."
        titre="Devenir prestataire"
      />

      <form className="grid gap-4 px-5 py-4" onSubmit={creerVitrine}>
        <fieldset className="grid gap-3 rounded-xl border border-line bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <legend className="text-sm font-semibold text-ink">Catégories</legend>
            <Badge variante={categorieIds.length > 0 ? 'kwiik' : 'neutral'}>
              {categorieIds.length} sélectionnée{categorieIds.length > 1 ? 's' : ''}
            </Badge>
          </div>

          {chargementDomaines && (
            <p className="m-0 text-sm text-muted">Chargement des catégories...</p>
          )}

          {!chargementDomaines && domaines.length === 0 && (
            <EtatVide
              message="Impossible de créer une vitrine tant qu'aucune catégorie n'est disponible."
              titre="Aucune catégorie disponible"
            />
          )}

          {domaines.map((domaine: DomaineOption) => (
            <div className="grid gap-2" key={domaine.id}>
              <strong className="text-[13px] font-semibold text-ink">{domaine.nom}</strong>
              <div className="flex flex-wrap gap-2">
                {domaine.categories.map((categorie: CategorieOption) => {
                  const cochee = categorieIds.includes(categorie.id);

                  return (
                    <label
                      className={`cursor-pointer rounded-full px-3 py-2 text-xs font-semibold transition ${
                        cochee ? 'bg-ink text-white' : 'bg-surface-1 text-muted'
                      }`}
                      key={categorie.id}
                    >
                      <input
                        checked={cochee}
                        className="sr-only"
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
        </fieldset>

        <div className="grid gap-3 rounded-xl border border-line bg-white p-3">
          <label className={libelleClasse}>
            Ville
            <input
              className={champClasse}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setVille(event.target.value)}
              placeholder="Douala, Yaoundé"
              value={ville}
            />
          </label>

          <label className={libelleClasse}>
            Quartier
            <input
              className={champClasse}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setQuartier(event.target.value)}
              placeholder="Bonamoussadi, Bastos..."
              value={quartier}
            />
          </label>

          <label className={libelleClasse}>
            Adresse
            <input
              className={champClasse}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setAdresse(event.target.value)}
              placeholder="Adresse précise du lieu"
              value={adresse}
            />
          </label>

          <label className={libelleClasse}>
            Description
            <textarea
              className={`${champClasse} min-h-28 resize-y`}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setDescription(event.target.value)}
              placeholder="Présentez votre activité, vos services et votre zone d'intervention."
              rows={5}
              value={description}
            />
          </label>
        </div>

        <div className="grid gap-3 rounded-xl border border-line bg-white p-3">
          <label className={libelleClasse}>
            Image du lieu
            <input
              accept="image/*"
              className={champClasse}
              disabled={uploadEnCours || chargement}
              onChange={choisirPhotoLieu}
              type="file"
            />
          </label>

          {uploadEnCours && <p className="m-0 text-sm text-muted">Envoi de l'image...</p>}

          {photoLieuUrl && (
            <img
              alt="Aperçu du lieu"
              className="h-44 w-full rounded-xl border border-line object-cover"
              src={`${urlBackend}${photoLieuUrl}`}
            />
          )}
        </div>

        <button
          className="h-11 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition disabled:bg-[#9A988F]"
          disabled={!formulaireValide || chargement}
          type="submit"
        >
          {chargement ? 'Création...' : 'Créer ma vitrine'}
        </button>

        {message && <p className="m-0 rounded-xl bg-success-soft p-3 text-sm font-semibold text-success-strong">{message}</p>}
        {erreur && <p className="m-0 rounded-xl bg-danger-soft p-3 text-sm font-semibold text-danger-strong">{erreur}</p>}
      </form>
    </section>
  );
}