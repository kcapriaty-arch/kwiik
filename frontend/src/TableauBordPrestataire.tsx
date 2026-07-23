import { useEffect, useState } from 'react';
import { api } from './api';
import { MesCreneaux } from './MesCreneaux';
import { MesPrestations } from './MesPrestations';
import { Badge, Carte, CarteStat, EnteteEcran, EtatVide, type BadgeVariant } from './ui';

type StatutReservation =
  | 'en_attente'
  | 'confirmee'
  | 'en_cours'
  | 'terminee'
  | 'validee'
  | 'payee_cloturee'
  | 'annulee'
  | 'litige';

type ActionReservation = 'confirmer' | 'refuser' | 'demarrer' | 'terminer';
export type OngletPrestataire = 'demandes' | 'prestations' | 'creneaux';

interface PrestationReservation {
  titre: string;
  prix?: number;
}

interface CreneauReservation {
  debut: string;
  fin: string;
}

interface ClientReservation {
  nom?: string | null;
  telephone?: string | null;
}

interface DemandeReservation {
  id: string;
  statut: StatutReservation;
  modePaiement: string;
  prestation: PrestationReservation;
  creneau: CreneauReservation;
  client: ClientReservation;
}

interface TableauBordPrestataireProps {
  ongletInitial?: OngletPrestataire;
  masquerOnglets?: boolean;
}

interface ApiErrorResponse {
  response?: {
    status?: number;
    data?: {
      message?: string | string[];
    };
  };
}

const formatteurFcfa: Intl.NumberFormat = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

const formatteurDateHeure: Intl.DateTimeFormat = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const libellesStatut: Record<StatutReservation, string> = {
  en_attente: 'En attente',
  confirmee: 'Confirmée',
  en_cours: 'En cours',
  terminee: 'Terminée',
  validee: 'Validée',
  payee_cloturee: 'Payée et clôturée',
  annulee: 'Annulée',
  litige: 'Litige',
};

const variantesStatut: Record<StatutReservation, BadgeVariant> = {
  en_attente: 'warning',
  confirmee: 'kwiik',
  en_cours: 'kwiik',
  terminee: 'amber',
  validee: 'success',
  payee_cloturee: 'success',
  annulee: 'neutral',
  litige: 'danger',
};

const libellesAction: Record<ActionReservation, string> = {
  confirmer: 'Confirmer',
  refuser: 'Refuser',
  demarrer: 'Démarrer',
  terminer: 'Terminer',
};

const libellesOnglets: Record<OngletPrestataire, string> = {
  demandes: 'Demandes reçues',
  prestations: 'Mes prestations',
  creneaux: 'Mes créneaux',
};

function formatPrixFcfa(prix?: number): string {
  if (typeof prix !== 'number') {
    return 'Prix non renseigné';
  }

  return `${formatteurFcfa.format(prix)} FCFA`;
}

function formatDateHeure(dateIso: string): string {
  return formatteurDateHeure.format(new Date(dateIso));
}

function nomClient(client: ClientReservation): string {
  const nom = client.nom?.trim();
  if (nom) {
    return nom;
  }

  return client.telephone ?? 'Client';
}

function libellerModePaiement(modePaiement: string): string {
  if (modePaiement === 'a_la_livraison') {
    return 'À la livraison';
  }

  if (modePaiement === 'en_ligne') {
    return 'En ligne';
  }

  return modePaiement;
}

function lireMessageErreur(error: unknown): string {
  const erreurApi = error as ApiErrorResponse;

  if (erreurApi.response?.status === 403) {
    return "Vous n'êtes pas encore prestataire";
  }

  const message = erreurApi.response?.data?.message;
  if (Array.isArray(message)) {
    return message.join(' ');
  }

  return message ?? 'Une erreur est survenue.';
}

function actionsDisponibles(statut: StatutReservation): ActionReservation[] {
  if (statut === 'en_attente') {
    return ['confirmer', 'refuser'];
  }

  if (statut === 'confirmee') {
    return ['demarrer'];
  }

  if (statut === 'en_cours') {
    return ['terminer'];
  }

  return [];
}

export function TableauBordPrestataire({
  ongletInitial = 'demandes',
  masquerOnglets = false,
}: TableauBordPrestataireProps) {
  const [ongletActif, setOngletActif] = useState<OngletPrestataire>(ongletInitial);
  const [demandes, setDemandes] = useState<DemandeReservation[]>([]);
  const [chargement, setChargement] = useState<boolean>(true);
  const [actionEnCours, setActionEnCours] = useState<string>('');
  const [erreur, setErreur] = useState<string>('');

  async function chargerDemandes(): Promise<void> {
    setChargement(true);
    setErreur('');

    try {
      const { data } = await api.get<DemandeReservation[]>('/reservations/demandes-recues');
      setDemandes(data);
    } catch (error: unknown) {
      setErreur(lireMessageErreur(error));
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    chargerDemandes();
  }, []);

  useEffect(() => {
    setOngletActif(ongletInitial);
  }, [ongletInitial]);

  async function agirSurDemande(id: string, action: ActionReservation): Promise<void> {
    setActionEnCours(`${id}-${action}`);
    setErreur('');

    try {
      await api.patch(`/reservations/${id}/${action}`);
      await chargerDemandes();
    } catch (error: unknown) {
      setErreur(lireMessageErreur(error));
    } finally {
      setActionEnCours('');
    }
  }

  const totalDemandes = Math.round(demandes.length);
  const demandesEnAttente = Math.round(
    demandes.filter((demande: DemandeReservation) => demande.statut === 'en_attente').length,
  );
  const demandesConfirmees = Math.round(
    demandes.filter((demande: DemandeReservation) => demande.statut === 'confirmee').length,
  );
  const erreurNonPrestataire = erreur === "Vous n'êtes pas encore prestataire";

  return (
    <section className="min-h-full bg-surface-2 text-left text-ink">
      <EnteteEcran
        sousTitre="Suivez les demandes reçues, vos prestations et vos créneaux."
        titre="Espace prestataire"
      />

      <div className="px-5 py-4">
        <div className="mb-4 grid grid-cols-3 gap-2.5">
          <CarteStat libelle="demandes" valeur={totalDemandes} variante="kwiik" />
          <CarteStat libelle="en attente" valeur={demandesEnAttente} variante="warning" />
          <CarteStat libelle="confirmées" valeur={demandesConfirmees} variante="success" />
        </div>

        {!masquerOnglets && (
        <div className="mb-4 flex gap-2 overflow-x-auto" role="tablist">
          {(Object.keys(libellesOnglets) as OngletPrestataire[]).map((onglet: OngletPrestataire) => {
            const actif = ongletActif === onglet;

            return (
              <button
                aria-selected={actif}
                className={`h-10 whitespace-nowrap rounded-full px-4 text-xs font-semibold transition ${
                  actif ? 'bg-ink text-white' : 'bg-surface-1 text-muted'
                }`}
                key={onglet}
                onClick={() => setOngletActif(onglet)}
                role="tab"
                type="button"
              >
                {libellesOnglets[onglet]}
              </button>
            );
          })}
        </div>
        )}

        {ongletActif === 'demandes' && (
          <div role="tabpanel">
            {chargement && <p className="m-0 text-sm text-muted">Chargement des demandes...</p>}

            {erreur && !erreurNonPrestataire && (
              <p className="m-0 rounded-xl bg-danger-soft p-3 text-sm font-semibold text-danger-strong">{erreur}</p>
            )}

            {!chargement && erreurNonPrestataire && (
              <EtatVide
                message="Créez votre vitrine pour recevoir des demandes, gérer vos prestations et publier vos créneaux."
                titre="Vous n'êtes pas encore prestataire"
              />
            )}

            {!chargement && demandes.length === 0 && !erreur && (
              <EtatVide
                message="Les réservations envoyées par vos clients apparaîtront ici."
                titre="Aucune demande reçue"
              />
            )}

            {!chargement && demandes.length > 0 && (
              <div className="grid gap-3">
                {demandes.map((demande: DemandeReservation) => {
                  const actions = actionsDisponibles(demande.statut);

                  return (
                    <Carte key={demande.id}>
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h2 className="m-0 truncate text-[15px] font-semibold tracking-normal text-ink">
                            {demande.prestation.titre}
                          </h2>
                          <p className="m-0 mt-1 text-xs text-muted">Client : {nomClient(demande.client)}</p>
                        </div>
                        <Badge variante={variantesStatut[demande.statut]}>
                          {libellesStatut[demande.statut]}
                        </Badge>
                      </div>

                      <div className="grid gap-1.5 text-[13px] leading-5 text-muted">
                        <p className="m-0 font-semibold text-ink">{formatPrixFcfa(demande.prestation.prix)}</p>
                        <p className="m-0">{formatDateHeure(demande.creneau.debut)}</p>
                        <p className="m-0">Jusqu'à {formatDateHeure(demande.creneau.fin)}</p>
                        <p className="m-0">Paiement : {libellerModePaiement(demande.modePaiement)}</p>
                      </div>

                      {actions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                          {actions.map((action: ActionReservation) => {
                            const enCours = actionEnCours === `${demande.id}-${action}`;
                            const actionDanger = action === 'refuser';

                            return (
                              <button
                                className={`h-10 rounded-xl px-4 text-sm font-semibold disabled:bg-[#9A988F] disabled:text-white ${
                                  actionDanger
                                    ? 'border border-danger-strong bg-white text-danger-strong disabled:border-[#9A988F]'
                                    : 'bg-ink text-white'
                                }`}
                                disabled={Boolean(actionEnCours)}
                                key={action}
                                onClick={() => agirSurDemande(demande.id, action)}
                                type="button"
                              >
                                {enCours ? 'Action...' : libellesAction[action]}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </Carte>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {ongletActif === 'prestations' && (
          <div role="tabpanel">
            <MesPrestations />
          </div>
        )}

        {ongletActif === 'creneaux' && (
          <div role="tabpanel">
            <MesCreneaux />
          </div>
        )}
      </div>
    </section>
  );
}