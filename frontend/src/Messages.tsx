import { useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { initialesDepuisNom } from './ui';

type StatutReservation =
  | 'en_attente'
  | 'confirmee'
  | 'en_cours'
  | 'terminee'
  | 'validee'
  | 'payee_cloturee'
  | 'annulee'
  | 'litige';

type OngletMessages = 'en_cours' | 'archives';

interface PrestationReservation {
  titre: string;
}

interface CreneauReservation {
  debut: string;
  fin: string;
}

interface ReservationMessage {
  id: string;
  statut: StatutReservation;
  creeLe?: string;
  prestation: PrestationReservation;
  creneau: CreneauReservation;
}

interface Conversation {
  id: string;
  titre: string;
  apercu: string;
  dateReference: string;
  archivee: boolean;
  nonLus: number;
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

const formatteurRelatif = new Intl.RelativeTimeFormat('fr-FR', {
  numeric: 'auto',
});

function BellIcon({ className = '' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function MessageIcon({ className = '' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

function SearchIcon({ className = '' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function lireMessageErreur(error: unknown): string {
  const message = (error as ApiErrorResponse).response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(' ');
  }

  return message ?? 'Impossible de charger les messages.';
}

function estArchivee(reservation: ReservationMessage): boolean {
  if (['annulee', 'validee', 'payee_cloturee'].includes(reservation.statut)) {
    return true;
  }

  return new Date(reservation.creneau.fin).getTime() < Date.now();
}

function apercuDepuisReservation(reservation: ReservationMessage): string {
  if (reservation.statut === 'en_attente') {
    return 'KWIIK : votre demande a bien été envoyée.';
  }

  if (reservation.statut === 'confirmee') {
    return 'KWIIK : votre rendez-vous est confirmé.';
  }

  if (reservation.statut === 'en_cours') {
    return 'KWIIK : la prestation est en cours.';
  }

  if (reservation.statut === 'terminee') {
    return 'KWIIK : la prestation est terminée, vous pouvez la valider.';
  }

  if (reservation.statut === 'annulee') {
    return 'KWIIK : cette réservation a été annulée.';
  }

  if (reservation.statut === 'validee' || reservation.statut === 'payee_cloturee') {
    return 'Vous : prestation validée, merci pour votre retour.';
  }

  return 'KWIIK : nouveau message lié à votre réservation.';
}

function conversationDepuisReservation(reservation: ReservationMessage): Conversation {
  return {
    id: reservation.id,
    titre: reservation.prestation.titre,
    apercu: apercuDepuisReservation(reservation),
    dateReference: reservation.creeLe ?? reservation.creneau.debut,
    archivee: estArchivee(reservation),
    nonLus: reservation.statut === 'en_attente' || reservation.statut === 'confirmee' ? 1 : 0,
  };
}

function libellerTemps(dateIso: string): string {
  const date = new Date(dateIso);
  const maintenant = new Date();
  const differenceMs = date.getTime() - maintenant.getTime();
  const differenceAbs = Math.abs(differenceMs);
  const minute = 60 * 1000;
  const heure = 60 * minute;
  const jour = 24 * heure;
  const mois = 30 * jour;

  if (differenceAbs < heure) {
    return formatteurRelatif.format(Math.round(differenceMs / minute), 'minute');
  }

  if (differenceAbs < jour) {
    return formatteurRelatif.format(Math.round(differenceMs / heure), 'hour');
  }

  if (differenceAbs < mois) {
    return formatteurRelatif.format(Math.round(differenceMs / jour), 'day');
  }

  return formatteurRelatif.format(Math.round(differenceMs / mois), 'month');
}

export function Messages() {
  const [ongletActif, setOngletActif] = useState<OngletMessages>('en_cours');
  const [recherche, setRecherche] = useState<string>('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [chargement, setChargement] = useState<boolean>(true);
  const [erreur, setErreur] = useState<string>('');

  useEffect(() => {
    async function chargerConversations(): Promise<void> {
      setChargement(true);
      setErreur('');

      try {
        const { data } = await api.get<ReservationMessage[]>('/reservations/mes-reservations');
        setConversations(data.map((reservation: ReservationMessage) => conversationDepuisReservation(reservation)));
      } catch (error: unknown) {
        setErreur(lireMessageErreur(error));
      } finally {
        setChargement(false);
      }
    }

    chargerConversations();
  }, []);

  const conversationsEnCours = useMemo<Conversation[]>(
    () => conversations.filter((conversation: Conversation) => !conversation.archivee),
    [conversations],
  );

  const conversationsArchivees = useMemo<Conversation[]>(
    () => conversations.filter((conversation: Conversation) => conversation.archivee),
    [conversations],
  );

  const conversationsAffichees = useMemo<Conversation[]>(() => {
    const source = ongletActif === 'en_cours' ? conversationsEnCours : conversationsArchivees;
    const filtre = recherche.trim().toLowerCase();

    if (!filtre) {
      return source;
    }

    return source.filter((conversation: Conversation) => {
      return conversation.titre.toLowerCase().includes(filtre) || conversation.apercu.toLowerCase().includes(filtre);
    });
  }, [conversationsArchivees, conversationsEnCours, ongletActif, recherche]);

  return (
    <section className="min-h-full bg-white text-left text-ink">
      <header className="px-5 pb-4 pt-7">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="m-0 text-[42px] font-black leading-none tracking-normal text-ink">Messages</h1>
          <button
            aria-label="Notifications"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-1 text-ink"
            type="button"
          >
            <BellIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-2 rounded-[18px] bg-surface-1 p-1 shadow-inner">
          <button
            className={`h-12 rounded-[15px] text-base font-bold transition ${ongletActif === 'en_cours' ? 'bg-white text-ink shadow-sm' : 'text-muted'}`}
            onClick={() => setOngletActif('en_cours')}
            type="button"
          >
            En cours
          </button>
          <button
            className={`h-12 rounded-[15px] text-base font-bold transition ${ongletActif === 'archives' ? 'bg-white text-ink shadow-sm' : 'text-muted'}`}
            onClick={() => setOngletActif('archives')}
            type="button"
          >
            Archivés
          </button>
        </div>

        <label className="mt-4 flex h-11 items-center gap-3 rounded-2xl bg-surface-1 px-4 text-sm text-muted">
          <SearchIcon className="h-4 w-4 flex-none" />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink outline-none placeholder:text-[#9A988F]"
            onChange={(event) => setRecherche(event.target.value)}
            placeholder="Rechercher une conversation"
            type="text"
            value={recherche}
          />
        </label>
      </header>

      <div className="border-t border-line">
        {chargement && <p className="m-0 px-5 py-5 text-sm text-muted">Chargement des messages...</p>}
        {erreur && <p className="m-5 rounded-2xl bg-danger-soft p-4 text-sm font-semibold text-danger-strong">{erreur}</p>}

        {!chargement && !erreur && conversationsAffichees.length === 0 && (
          <div className="px-5 py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-1 text-muted">
              <MessageIcon className="h-7 w-7" />
            </div>
            <h2 className="m-0 mt-4 text-lg font-bold text-ink">Aucune conversation</h2>
            <p className="m-0 mt-2 text-sm leading-6 text-muted">
              Les échanges avec vos prestataires apparaîtront ici quand la messagerie sera branchée.
            </p>
          </div>
        )}

        {!chargement && !erreur && conversationsAffichees.length > 0 && (
          <div>
            {conversationsAffichees.map((conversation: Conversation) => {
              const initiales = initialesDepuisNom(conversation.titre, 'KW');

              return (
                <button
                  className="flex w-full items-center gap-4 border-b border-line px-5 py-4 text-left transition active:bg-surface-1"
                  key={conversation.id}
                  type="button"
                >
                  <span className="relative flex h-[58px] w-[58px] flex-none items-center justify-center rounded-full bg-surface-1 text-base font-black text-muted">
                    {initiales}
                    {conversation.nonLus > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-ink px-1.5 text-[11px] font-bold text-white">
                        {conversation.nonLus > 9 ? '+9' : conversation.nonLus}
                      </span>
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0 truncate text-[17px] font-black leading-6 text-ink">{conversation.titre}</span>
                      <span className="flex-none text-sm font-medium text-muted">{libellerTemps(conversation.dateReference)}</span>
                    </span>
                    <span className="mt-1 block truncate text-[15px] leading-6 text-muted">{conversation.apercu}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}