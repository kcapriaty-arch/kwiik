import { useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { EtatVide } from './ui';

type StatutReservation =
  | 'en_attente'
  | 'confirmee'
  | 'en_cours'
  | 'terminee'
  | 'validee'
  | 'payee_cloturee'
  | 'annulee'
  | 'litige';

type VueReservations = 'a_venir' | 'passees';

interface PrestataireReservation {
  ville?: string | null;
  quartier?: string | null;
  adresse?: string | null;
}

interface PrestationReservation {
  titre: string;
  prix: number;
  dureeMin?: number | null;
  photoUrl?: string | null;
  prestataire?: PrestataireReservation | null;
}

interface CreneauReservation {
  debut: string;
  fin: string;
}

interface Reservation {
  id: string;
  statut: StatutReservation;
  modePaiement: string;
  prestation: PrestationReservation;
  creneau: CreneauReservation;
}

interface GroupeReservations {
  cle: string;
  libelle: string;
  reservations: Reservation[];
}

interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string | string[];
    };
  };
}

interface IconProps {
  className?: string;
}

interface StatutUi {
  libelle: string;
  classe: string;
}

const urlBackend = 'http://localhost:3000';

const formatteurFcfa: Intl.NumberFormat = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

const formatteurDateTitre: Intl.DateTimeFormat = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
});

const formatteurDateRdv: Intl.DateTimeFormat = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

const formatteurHeure: Intl.DateTimeFormat = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
});

const statutsUi: Record<StatutReservation, StatutUi> = {
  en_attente: {
    libelle: 'En attente',
    classe: 'bg-warning-soft text-warning-strong',
  },
  confirmee: {
    libelle: 'Confirmée',
    classe: 'bg-kwiik-light text-kwiik-dark',
  },
  en_cours: {
    libelle: 'En cours',
    classe: 'bg-kwiik text-white',
  },
  terminee: {
    libelle: 'Terminée',
    classe: 'bg-warning-soft text-warning-strong',
  },
  validee: {
    libelle: 'Validée',
    classe: 'bg-success-soft text-success-strong',
  },
  payee_cloturee: {
    libelle: 'Payée',
    classe: 'bg-success-soft text-success-strong',
  },
  annulee: {
    libelle: 'Annulée',
    classe: 'bg-danger-soft text-danger-strong',
  },
  litige: {
    libelle: 'Litige',
    classe: 'bg-danger-soft text-danger-strong',
  },
};

function CalendarIcon({ className = '' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect height="18" rx="3" width="18" x="3" y="4" />
      <path d="M3 10h18" />
    </svg>
  );
}

function ClockIcon({ className = '' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
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

function WalletIcon({ className = '' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M4 7a3 3 0 0 1 3-3h12v16H7a3 3 0 0 1-3-3Z" />
      <path d="M16 12h.01" />
      <path d="M4 8h15" />
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

function SparkleIcon({ className = '' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 3l1.9 5.2L19 10l-5.1 1.8L12 17l-1.9-5.2L5 10l5.1-1.8z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
    </svg>
  );
}

function formatPrixFcfa(prix: number): string {
  return `${formatteurFcfa.format(prix)} FCFA`;
}

function capitaliser(valeur: string): string {
  return valeur.charAt(0).toUpperCase() + valeur.slice(1);
}

function formatDateTitre(dateIso: string): string {
  return capitaliser(formatteurDateTitre.format(new Date(dateIso)));
}

function formatDateRdv(dateIso: string): string {
  return capitaliser(formatteurDateRdv.format(new Date(dateIso)));
}

function formatHeure(dateIso: string): string {
  return formatteurHeure.format(new Date(dateIso));
}

function cleDate(dateIso: string): string {
  return new Date(dateIso).toISOString().slice(0, 10);
}

function calculerDureeMinutes(reservation: Reservation): number | null {
  if (typeof reservation.prestation.dureeMin === 'number') {
    return reservation.prestation.dureeMin;
  }

  const debut = new Date(reservation.creneau.debut).getTime();
  const fin = new Date(reservation.creneau.fin).getTime();
  const difference = Math.round((fin - debut) / 60000);

  return Number.isFinite(difference) && difference > 0 ? difference : null;
}

function libellerDureeEtPrix(reservation: Reservation): string {
  const duree = calculerDureeMinutes(reservation);
  const prix = formatPrixFcfa(reservation.prestation.prix);

  if (!duree) {
    return prix;
  }

  return `${duree} min • ${prix}`;
}

function lireMessageErreur(error: unknown): string {
  const message = (error as ApiErrorResponse).response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(' ');
  }

  return message ?? 'Une erreur est survenue.';
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

function libellerLieu(reservation: Reservation): string {
  const prestataire = reservation.prestation.prestataire;

  if (!prestataire) {
    return 'Lieu à confirmer avec le prestataire';
  }

  if (prestataire.adresse?.trim()) {
    return prestataire.adresse.trim();
  }

  const morceaux = [prestataire.quartier, prestataire.ville]
    .map((morceau: string | null | undefined) => morceau?.trim())
    .filter(Boolean);

  return morceaux.length > 0 ? morceaux.join(', ') : 'Lieu à confirmer avec le prestataire';
}

function urlImageBackend(url: string): string {
  return `${urlBackend}${url}`;
}

function estReservationAVenir(reservation: Reservation): boolean {
  if (reservation.statut === 'annulee' || reservation.statut === 'validee' || reservation.statut === 'payee_cloturee') {
    return false;
  }

  return new Date(reservation.creneau.fin).getTime() >= Date.now();
}

function grouperParDate(reservations: Reservation[]): GroupeReservations[] {
  const groupes = new Map<string, GroupeReservations>();

  reservations.forEach((reservation: Reservation) => {
    const cle = cleDate(reservation.creneau.debut);
    const groupe = groupes.get(cle);

    if (groupe) {
      groupe.reservations.push(reservation);
      return;
    }

    groupes.set(cle, {
      cle,
      libelle: formatDateTitre(reservation.creneau.debut),
      reservations: [reservation],
    });
  });

  return Array.from(groupes.values());
}

export function MesReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [vueActive, setVueActive] = useState<VueReservations>('a_venir');
  const [chargement, setChargement] = useState<boolean>(true);
  const [actionEnCours, setActionEnCours] = useState<string>('');
  const [erreur, setErreur] = useState<string>('');

  async function chargerReservations(): Promise<void> {
    setChargement(true);
    setErreur('');

    try {
      const { data } = await api.get<Reservation[]>('/reservations/mes-reservations');
      setReservations(data);
    } catch (error: unknown) {
      setErreur(lireMessageErreur(error));
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    chargerReservations();
  }, []);

  const reservationsAVenir = useMemo<Reservation[]>(
    () => reservations.filter((reservation: Reservation) => estReservationAVenir(reservation)),
    [reservations],
  );

  const reservationsPassees = useMemo<Reservation[]>(
    () => reservations.filter((reservation: Reservation) => !estReservationAVenir(reservation)),
    [reservations],
  );

  const reservationsAffichees = vueActive === 'a_venir' ? reservationsAVenir : reservationsPassees;
  const groupes = useMemo<GroupeReservations[]>(
    () => grouperParDate(reservationsAffichees),
    [reservationsAffichees],
  );

  async function agirSurReservation(id: string, action: 'valider' | 'annuler'): Promise<void> {
    setActionEnCours(id);
    setErreur('');

    try {
      await api.patch(`/reservations/${id}/${action}`);
      await chargerReservations();
    } catch (error: unknown) {
      setErreur(lireMessageErreur(error));
    } finally {
      setActionEnCours('');
    }
  }

  return (
    <section className="min-h-full bg-surface-2 text-left text-ink">
      <header className="bg-white px-5 pb-5 pt-5">
        <div className="mb-7 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-muted">FR</div>
          <div className="text-center text-[22px] font-black tracking-[0.24em] text-ink">KWIIK</div>
          <button
            aria-label="Notifications"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-white"
            type="button"
          >
            <BellIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-[24px] bg-surface-1 p-4">
          <p className="m-0 text-center text-[27px] font-light leading-tight text-ink">
            Vos rendez-vous <span className="font-medium text-kwiik">KWIIK</span>
          </p>
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
            <SparkleIcon className="h-5 w-5 flex-none text-kwiik" />
            <p className="m-0 min-w-0 flex-1 text-sm text-muted">Suivez vos demandes, confirmations et prestations terminées.</p>
          </div>
        </div>
      </header>

      <div className="px-5 py-5">
        <h1 className="m-0 text-[28px] font-semibold tracking-normal text-ink">Mes rendez-vous</h1>
        <p className="m-0 mt-1 text-sm leading-6 text-muted">Retrouvez vos réservations à venir et votre historique.</p>

        <div className="mt-5 grid grid-cols-2 border-b border-line">
          <button
            className={`flex items-center justify-center gap-2 px-2 pb-3 text-sm font-semibold ${
              vueActive === 'a_venir' ? 'border-b-2 border-kwiik text-kwiik' : 'text-muted'
            }`}
            onClick={() => setVueActive('a_venir')}
            type="button"
          >
            <CalendarIcon className="h-4 w-4" />
            À venir ({reservationsAVenir.length})
          </button>
          <button
            className={`flex items-center justify-center gap-2 px-2 pb-3 text-sm font-semibold ${
              vueActive === 'passees' ? 'border-b-2 border-kwiik text-kwiik' : 'text-muted'
            }`}
            onClick={() => setVueActive('passees')}
            type="button"
          >
            <ClockIcon className="h-4 w-4" />
            Passés ({reservationsPassees.length})
          </button>
        </div>

        {chargement && <p className="m-0 mt-5 text-sm text-muted">Chargement des réservations...</p>}
        {erreur && <p className="m-0 mt-5 rounded-2xl bg-danger-soft p-4 text-sm font-semibold text-danger-strong">{erreur}</p>}

        {!chargement && reservations.length === 0 && !erreur && (
          <div className="mt-5">
            <EtatVide
              message="Vos demandes de réservation apparaîtront ici dès qu'un prestataire aura été sollicité."
              titre="Aucune réservation pour l'instant"
            />
          </div>
        )}

        {!chargement && reservations.length > 0 && reservationsAffichees.length === 0 && !erreur && (
          <p className="m-0 mt-5 rounded-2xl bg-white p-4 text-sm text-muted shadow-sm">
            Aucun rendez-vous dans cette section.
          </p>
        )}

        {!chargement && groupes.length > 0 && (
          <div className="mt-6 grid gap-7">
            {groupes.map((groupe: GroupeReservations) => (
              <section key={groupe.cle}>
                <h2 className="m-0 mb-3 text-[22px] font-semibold tracking-normal text-ink">{groupe.libelle}</h2>
                <div className="grid gap-4">
                  {groupe.reservations.map((reservation: Reservation) => {
                    const peutValider = reservation.statut === 'terminee';
                    const peutAnnuler = reservation.statut === 'en_attente' || reservation.statut === 'confirmee';
                    const actionDesactivee = actionEnCours === reservation.id;
                    const statut = statutsUi[reservation.statut];

                    return (
                      <article className="overflow-hidden rounded-[24px] border border-line bg-white shadow-sm" key={reservation.id}>
                        <div className="flex items-start gap-3 p-4">
                          {reservation.prestation.photoUrl ? (
                            <img
                              alt={reservation.prestation.titre}
                              className="h-[58px] w-[58px] flex-none rounded-2xl object-cover"
                              src={urlImageBackend(reservation.prestation.photoUrl)}
                            />
                          ) : (
                            <div className="flex h-[58px] w-[58px] flex-none items-center justify-center rounded-2xl bg-kwiik-light text-kwiik">
                              <SparkleIcon className="h-7 w-7" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <h3 className="m-0 text-[17px] font-semibold leading-6 text-ink">{reservation.prestation.titre}</h3>
                                <p className="m-0 mt-1 flex items-start gap-1.5 text-sm leading-5 text-muted">
                                  <LocationIcon className="mt-0.5 h-4 w-4 flex-none" />
                                  <span>{libellerLieu(reservation)}</span>
                                </p>
                              </div>
                              <div className="flex-none text-right">
                                <p className="m-0 text-[17px] font-semibold text-ink">{formatPrixFcfa(reservation.prestation.prix)}</p>
                                <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statut.classe}`}>
                                  {statut.libelle}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-line px-4 py-4">
                          <div className="grid gap-3 text-sm text-ink">
                            <p className="m-0 flex items-start gap-3 font-semibold">
                              <CalendarIcon className="mt-0.5 h-5 w-5 flex-none text-muted" />
                              <span>{formatDateRdv(reservation.creneau.debut)}</span>
                            </p>
                            <p className="m-0 flex items-start gap-3 font-semibold">
                              <ClockIcon className="mt-0.5 h-5 w-5 flex-none text-muted" />
                              <span>
                                {formatHeure(reservation.creneau.debut)} - {formatHeure(reservation.creneau.fin)}
                                <span className="font-normal text-muted"> ({calculerDureeMinutes(reservation) ?? '?'} min)</span>
                              </span>
                            </p>
                            <p className="m-0 flex items-start gap-3 text-muted">
                              <WalletIcon className="mt-0.5 h-5 w-5 flex-none" />
                              <span>{libellerDureeEtPrix(reservation)} • Paiement : {libellerModePaiement(reservation.modePaiement)}</span>
                            </p>
                          </div>

                          {(peutValider || peutAnnuler) && (
                            <div className="mt-5 grid gap-2">
                              {peutValider && (
                                <button
                                  className="h-12 rounded-2xl bg-ink px-4 text-sm font-semibold text-white disabled:bg-[#9A988F]"
                                  disabled={actionDesactivee}
                                  onClick={() => agirSurReservation(reservation.id, 'valider')}
                                  type="button"
                                >
                                  {actionDesactivee ? 'Action...' : 'Valider la prestation'}
                                </button>
                              )}

                              {peutAnnuler && (
                                <button
                                  className="h-12 rounded-2xl border border-line bg-white px-4 text-sm font-semibold text-muted disabled:text-[#9A988F]"
                                  disabled={actionDesactivee}
                                  onClick={() => agirSurReservation(reservation.id, 'annuler')}
                                  type="button"
                                >
                                  {actionDesactivee ? 'Action...' : 'Annuler'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}