import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';
import { api } from './api';
import { uploaderImage } from './upload';
import { Carte, EtatVide } from './ui';

interface Prestation {
  id: string;
  titre: string;
  description?: string | null;
  photoUrl?: string | null;
  prix: number;
  dureeMin: number;
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

const formatteurFcfa: Intl.NumberFormat = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

function formatPrixFcfa(prix: number): string {
  return `${formatteurFcfa.format(prix)} FCFA`;
}

function urlImageBackend(url: string): string {
  return `${urlBackend}${url}`;
}

function lireMessageErreur(error: unknown): string {
  const erreurApi = error as ApiErrorResponse;
  const message = erreurApi.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(' ');
  }

  return message ?? 'Une erreur est survenue.';
}

export function MesPrestations() {
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [chargement, setChargement] = useState<boolean>(true);
  const [actionEnCours, setActionEnCours] = useState<boolean>(false);
  const [uploadEnCours, setUploadEnCours] = useState<boolean>(false);
  const [erreur, setErreur] = useState<string>('');
  const [messageSucces, setMessageSucces] = useState<string>('');
  const [titre, setTitre] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [prix, setPrix] = useState<string>('');
  const [dureeMin, setDureeMin] = useState<string>('');

  async function chargerPrestations(): Promise<void> {
    setChargement(true);
    setErreur('');

    try {
      const { data } = await api.get<Prestation[]>('/prestations/mes-prestations');
      setPrestations(data);
    } catch (error: unknown) {
      setErreur(lireMessageErreur(error));
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    chargerPrestations();
  }, []);

  async function choisirPhotoPrestation(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const fichier = event.target.files?.[0];

    if (!fichier) {
      return;
    }

    setUploadEnCours(true);
    setErreur('');
    setMessageSucces('');

    try {
      const url = await uploaderImage(fichier);
      setPhotoUrl(url);
      setMessageSucces('Image de la prestation envoyée.');
    } catch (error: unknown) {
      setPhotoUrl('');
      setErreur(lireMessageErreur(error));
    } finally {
      setUploadEnCours(false);
    }
  }

  async function ajouterPrestation(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const prixNombre = Number(prix);
    const dureeNombre = Number(dureeMin);

    if (!Number.isInteger(prixNombre) || prixNombre < 0) {
      setErreur('Le prix doit être un nombre entier positif.');
      return;
    }

    if (!Number.isInteger(dureeNombre) || dureeNombre < 1) {
      setErreur('La durée doit être un nombre entier en minutes.');
      return;
    }

    setActionEnCours(true);
    setErreur('');
    setMessageSucces('');

    try {
      await api.post('/prestations', {
        titre: titre.trim(),
        description: description.trim() || undefined,
        photoUrl: photoUrl || undefined,
        prix: prixNombre,
        dureeMin: dureeNombre,
      });
      setTitre('');
      setDescription('');
      setPhotoUrl('');
      setPrix('');
      setDureeMin('');
      setMessageSucces('Prestation ajoutée.');
      await chargerPrestations();
    } catch (error: unknown) {
      setErreur(lireMessageErreur(error));
    } finally {
      setActionEnCours(false);
    }
  }

  async function supprimerPrestation(id: string): Promise<void> {
    setActionEnCours(true);
    setErreur('');
    setMessageSucces('');

    try {
      await api.delete(`/prestations/${id}`);
      setMessageSucces('Prestation supprimée.');
      await chargerPrestations();
    } catch (error: unknown) {
      setErreur(lireMessageErreur(error));
    } finally {
      setActionEnCours(false);
    }
  }

  const formulaireValide =
    titre.trim().length > 0 &&
    prix.length > 0 &&
    dureeMin.length > 0 &&
    !actionEnCours &&
    !uploadEnCours;

  return (
    <div className="grid gap-4">
      <form className="grid gap-3 rounded-xl border border-line bg-white p-3" onSubmit={ajouterPrestation}>
        <h2 className="m-0 text-[15px] font-semibold tracking-normal text-ink">Ajouter une prestation</h2>

        <label className={libelleClasse}>
          Titre
          <input
            className={champClasse}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setTitre(event.target.value)}
            placeholder="Coupe femme"
            required
            type="text"
            value={titre}
          />
        </label>

        <label className={libelleClasse}>
          Description
          <textarea
            className={`${champClasse} min-h-24 resize-y`}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setDescription(event.target.value)}
            placeholder="Détail de la prestation"
            rows={3}
            value={description}
          />
        </label>

        <label className={libelleClasse}>
          Image de la prestation
          <input
            accept="image/*"
            className={champClasse}
            disabled={uploadEnCours || actionEnCours}
            onChange={choisirPhotoPrestation}
            type="file"
          />
        </label>

        {uploadEnCours && <p className="m-0 text-sm text-muted">Envoi de l'image...</p>}

        {photoUrl && (
          <img
            alt="Aperçu de la prestation"
            className="h-40 w-full rounded-xl border border-line object-cover"
            src={urlImageBackend(photoUrl)}
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className={libelleClasse}>
            Prix (FCFA)
            <input
              className={champClasse}
              min={0}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setPrix(event.target.value)}
              required
              step={1}
              type="number"
              value={prix}
            />
          </label>

          <label className={libelleClasse}>
            Durée (minutes)
            <input
              className={champClasse}
              min={1}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setDureeMin(event.target.value)}
              required
              step={1}
              type="number"
              value={dureeMin}
            />
          </label>
        </div>

        <button
          className="h-10 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition disabled:bg-[#9A988F]"
          disabled={!formulaireValide}
          type="submit"
        >
          {actionEnCours ? 'Ajout...' : 'Ajouter'}
        </button>
      </form>

      {chargement && <p className="m-0 text-sm text-muted">Chargement des prestations...</p>}
      {erreur && <p className="m-0 rounded-xl bg-danger-soft p-3 text-sm font-semibold text-danger-strong">{erreur}</p>}
      {messageSucces && <p className="m-0 rounded-xl bg-success-soft p-3 text-sm font-semibold text-success-strong">{messageSucces}</p>}

      {!chargement && prestations.length === 0 && !erreur && (
        <EtatVide
          message="Ajoutez vos services avec prix, durée et photo pour rendre votre vitrine réservable."
          titre="Aucune prestation pour le moment"
        />
      )}

      {!chargement && prestations.length > 0 && (
        <div className="grid gap-3">
          {prestations.map((prestation: Prestation) => (
            <Carte key={prestation.id}>
              <div className="flex items-start gap-3">
                {prestation.photoUrl && (
                  <img
                    alt={prestation.titre}
                    className="h-20 w-24 flex-none rounded-xl border border-line object-cover"
                    src={urlImageBackend(prestation.photoUrl)}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="m-0 truncate text-[15px] font-semibold tracking-normal text-ink">{prestation.titre}</h3>
                  {prestation.description && (
                    <p className="m-0 mt-1 line-clamp-2 text-xs leading-5 text-muted">{prestation.description}</p>
                  )}
                  <p className="m-0 mt-1 text-[13px] font-semibold text-ink">
                    {formatPrixFcfa(prestation.prix)} · {prestation.dureeMin} min
                  </p>
                </div>
              </div>
              <div className="mt-3 border-t border-line pt-3">
                <button
                  className="h-9 rounded-xl border border-danger-strong bg-white px-3 text-xs font-semibold text-danger-strong disabled:border-[#9A988F] disabled:text-[#9A988F]"
                  disabled={actionEnCours}
                  onClick={() => supprimerPrestation(prestation.id)}
                  type="button"
                >
                  Supprimer
                </button>
              </div>
            </Carte>
          ))}
        </div>
      )}
    </div>
  );
}