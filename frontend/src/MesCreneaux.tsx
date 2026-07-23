import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';
import { api } from './api';
import { Badge, Carte, EtatVide, type BadgeVariant } from './ui';

type StatutCreneau = 'libre' | 'reserve' | 'indisponible';

interface Creneau {
  id: string;
  debut: string;
  fin: string;
  statut: StatutCreneau;
}

interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string | string[];
    };
  };
}

const champClasse = 'w-full rounded-xl border border-line bg-surface-1 px-3 py-3 text-sm text-ink outline-none transition placeholder:text-[#9A988F] focus:border-kwiik focus:bg-white';
const libelleClasse = 'grid gap-1.5 text-xs font-semibold text-muted';

const formatteurDateHeure: Intl.DateTimeFormat = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const libellesStatut: Record<StatutCreneau, string> = {
  libre: 'Libre',
  reserve: 'Réservé',
  indisponible: 'Indisponible',
};

const variantesStatut: Record<StatutCreneau, BadgeVariant> = {
  libre: 'success',
  reserve: 'warning',
  indisponible: 'neutral',
};

function formatDateHeure(dateIso: string): string {
  return formatteurDateHeure.format(new Date(dateIso));
}

function lireMessageErreur(error: unknown): string {
  const erreurApi = error as ApiErrorResponse;
  const message = erreurApi.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(' ');
  }

  return message ?? 'Une erreur est survenue.';
}

export function MesCreneaux() {
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [chargement, setChargement] = useState<boolean>(true);
  const [actionEnCours, setActionEnCours] = useState<boolean>(false);
  const [erreur, setErreur] = useState<string>('');
  const [messageSucces, setMessageSucces] = useState<string>('');
  const [debut, setDebut] = useState<string>('');
  const [fin, setFin] = useState<string>('');

  async function chargerCreneaux(): Promise<void> {
    setChargement(true);
    setErreur('');

    try {
      const { data } = await api.get<Creneau[]>('/creneaux/mes-creneaux');
      setCreneaux(data);
    } catch (error: unknown) {
      setErreur(lireMessageErreur(error));
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    chargerCreneaux();
  }, []);

  async function ajouterCreneau(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const dateDebut = new Date(debut);
    const dateFin = new Date(fin);

    if (Number.isNaN(dateDebut.getTime()) || Number.isNaN(dateFin.getTime())) {
      setErreur('Renseignez un début et une fin valides.');
      return;
    }

    setActionEnCours(true);
    setErreur('');
    setMessageSucces('');

    try {
      await api.post('/creneaux', {
        debut: dateDebut.toISOString(),
        fin: dateFin.toISOString(),
      });
      setDebut('');
      setFin('');
      setMessageSucces('Créneau ajouté.');
      await chargerCreneaux();
    } catch (error: unknown) {
      setErreur(lireMessageErreur(error));
    } finally {
      setActionEnCours(false);
    }
  }

  async function supprimerCreneau(id: string): Promise<void> {
    setActionEnCours(true);
    setErreur('');
    setMessageSucces('');

    try {
      await api.delete(`/creneaux/${id}`);
      setMessageSucces('Créneau supprimé.');
      await chargerCreneaux();
    } catch (error: unknown) {
      setErreur(lireMessageErreur(error));
    } finally {
      setActionEnCours(false);
    }
  }

  const formulaireValide = debut.length > 0 && fin.length > 0 && !actionEnCours;

  return (
    <div className="grid gap-4">
      <form className="grid gap-3 rounded-xl border border-line bg-white p-3" onSubmit={ajouterCreneau}>
        <h2 className="m-0 text-[15px] font-semibold tracking-normal text-ink">Ajouter un créneau</h2>

        <div className="grid gap-3">
          <label className={libelleClasse}>
            Début
            <input
              className={champClasse}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setDebut(event.target.value)}
              required
              type="datetime-local"
              value={debut}
            />
          </label>

          <label className={libelleClasse}>
            Fin
            <input
              className={champClasse}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setFin(event.target.value)}
              required
              type="datetime-local"
              value={fin}
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

      {chargement && <p className="m-0 text-sm text-muted">Chargement des créneaux...</p>}
      {erreur && <p className="m-0 rounded-xl bg-danger-soft p-3 text-sm font-semibold text-danger-strong">{erreur}</p>}
      {messageSucces && <p className="m-0 rounded-xl bg-success-soft p-3 text-sm font-semibold text-success-strong">{messageSucces}</p>}

      {!chargement && creneaux.length === 0 && !erreur && (
        <EtatVide
          message="Publiez vos disponibilités pour permettre aux clients de réserver votre vitrine."
          titre="Aucun créneau pour le moment"
        />
      )}

      {!chargement && creneaux.length > 0 && (
        <div className="grid gap-3">
          {creneaux.map((creneau: Creneau) => (
            <Carte key={creneau.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-[13px] font-semibold leading-5 text-ink">
                    {formatDateHeure(creneau.debut)}
                  </p>
                  <p className="m-0 mt-0.5 text-xs leading-5 text-muted">
                    Jusqu'à {formatDateHeure(creneau.fin)}
                  </p>
                </div>
                <Badge variante={variantesStatut[creneau.statut]}>
                  {libellesStatut[creneau.statut]}
                </Badge>
              </div>

              {creneau.statut === 'libre' && (
                <div className="mt-3 border-t border-line pt-3">
                  <button
                    className="h-9 rounded-xl border border-danger-strong bg-white px-3 text-xs font-semibold text-danger-strong disabled:border-[#9A988F] disabled:text-[#9A988F]"
                    disabled={actionEnCours}
                    onClick={() => supprimerCreneau(creneau.id)}
                    type="button"
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </Carte>
          ))}
        </div>
      )}
    </div>
  );
}