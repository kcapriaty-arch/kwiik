import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api';
import { useNotificationsNonLues } from './notifications/useNotificationsNonLues';
import { useSession } from './session';
import { EnteteEcran, initialesDepuisNom, SquelettesCartes } from './ui';

interface MessagesProps {
  onOuvrirNotifications?: () => void;
  conversationInitiale?: { id: string; autrePartie: string } | null;
  onConversationInitialeConsommee?: () => void;
}

interface DernierMessage {
  contenu: string;
  creeLe: string;
  expediteurId: string;
}

interface ConversationApercu {
  id: string;
  autrePartie: string;
  prestataireId: string;
  dernierMessage: DernierMessage | null;
  nonLus: number;
}

interface MessageItem {
  id: string;
  conversationId: string;
  expediteurId: string;
  contenu: string;
  lu: boolean;
  creeLe: string;
}

interface ApiErrorResponse {
  response?: { data?: { message?: string | string[] } };
}

const INTERVALLE_POLLING_MS = 5000;

const formatteurRelatif = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' });
const formatteurHeure = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

interface IconProps {
  className?: string;
}

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

function SendIcon({ className = '' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="m5 12 14-7-7 14-2-5-5-2Z" />
    </svg>
  );
}

function lireMessageErreur(error: unknown): string {
  const message = (error as ApiErrorResponse).response?.data?.message;
  return Array.isArray(message) ? message.join(' ') : message ?? 'Une erreur est survenue.';
}

function libellerTemps(dateIso: string): string {
  const date = new Date(dateIso);
  const differenceMs = date.getTime() - Date.now();
  const differenceAbs = Math.abs(differenceMs);
  const minute = 60 * 1000;
  const heure = 60 * minute;
  const jour = 24 * heure;

  if (differenceAbs < minute) {
    return "à l'instant";
  }
  if (differenceAbs < heure) {
    return formatteurRelatif.format(Math.round(differenceMs / minute), 'minute');
  }
  if (differenceAbs < jour) {
    return formatteurRelatif.format(Math.round(differenceMs / heure), 'hour');
  }
  return formatteurRelatif.format(Math.round(differenceMs / jour), 'day');
}

function VueConversation({ conversationId, autrePartie, onRetour }: { conversationId: string; autrePartie: string; onRetour: () => void }) {
  const { utilisateur } = useSession();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [chargement, setChargement] = useState<boolean>(true);
  const [erreur, setErreur] = useState<string>('');
  const [brouillon, setBrouillon] = useState<string>('');
  const [envoiEnCours, setEnvoiEnCours] = useState<boolean>(false);
  const finDeListe = useRef<HTMLDivElement>(null);

  async function charger(): Promise<void> {
    try {
      const { data } = await api.get<MessageItem[]>(`/conversations/${conversationId}/messages`);
      setMessages(data);
      setErreur('');
    } catch (error: unknown) {
      setErreur(lireMessageErreur(error));
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    setChargement(true);
    charger();
    const intervalle = setInterval(charger, INTERVALLE_POLLING_MS);
    return () => clearInterval(intervalle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- charger() ferme sur conversationId via la closure du composant
  }, [conversationId]);

  useEffect(() => {
    finDeListe.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  async function envoyer(): Promise<void> {
    const contenu = brouillon.trim();
    if (!contenu || envoiEnCours) {
      return;
    }

    setEnvoiEnCours(true);
    setBrouillon('');

    try {
      const { data } = await api.post<MessageItem>(`/conversations/${conversationId}/messages`, { contenu });
      setMessages((liste) => [...liste, data]);
    } catch (error: unknown) {
      setErreur(lireMessageErreur(error));
      setBrouillon(contenu);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <section className="flex min-h-full flex-col bg-surface-2 text-left text-ink">
      <EnteteEcran onRetour={onRetour} titre={autrePartie} />

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {chargement && <SquelettesCartes nombre={4} />}
        {erreur && <p className="m-0 mb-3 rounded-xl bg-danger-soft p-3 text-sm font-semibold text-danger-strong">{erreur}</p>}

        {!chargement && messages.length === 0 && !erreur && (
          <p className="m-0 text-center text-sm text-muted">Debutez la conversation avec {autrePartie}.</p>
        )}

        <div className="grid gap-2">
          {messages.map((message) => {
            const estMoi = message.expediteurId === utilisateur?.id;
            return (
              <div className={`flex ${estMoi ? 'justify-end' : 'justify-start'}`} key={message.id}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${estMoi ? 'bg-kwiik text-white' : 'bg-white text-ink shadow-sm'}`}>
                  <p className="m-0 text-sm leading-6">{message.contenu}</p>
                  <p className={`m-0 mt-1 text-[10px] font-semibold ${estMoi ? 'text-white/70' : 'text-muted'}`}>
                    {formatteurHeure.format(new Date(message.creeLe))}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div ref={finDeListe} />
      </div>

      <div className="flex items-center gap-2 border-t border-line bg-white px-4 py-3">
        <input
          className="min-w-0 flex-1 rounded-full bg-surface-1 px-4 py-3 text-sm text-ink outline-none placeholder:text-[#9A988F]"
          onChange={(event) => setBrouillon(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              void envoyer();
            }
          }}
          placeholder="Ecrire un message..."
          value={brouillon}
        />
        <button
          aria-label="Envoyer"
          className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-ink text-white disabled:bg-[#B8B4AA]"
          disabled={!brouillon.trim() || envoiEnCours}
          onClick={() => void envoyer()}
          type="button"
        >
          <SendIcon className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}

export function Messages({ onOuvrirNotifications, conversationInitiale, onConversationInitialeConsommee }: MessagesProps) {
  const notificationsNonLues = useNotificationsNonLues();
  const [recherche, setRecherche] = useState<string>('');
  const [conversations, setConversations] = useState<ConversationApercu[]>([]);
  const [chargement, setChargement] = useState<boolean>(true);
  const [erreur, setErreur] = useState<string>('');
  const [conversationOuverte, setConversationOuverte] = useState<ConversationApercu | null>(
    conversationInitiale
      ? { id: conversationInitiale.id, autrePartie: conversationInitiale.autrePartie, prestataireId: '', dernierMessage: null, nonLus: 0 }
      : null,
  );

  async function chargerConversations(): Promise<void> {
    try {
      const { data } = await api.get<ConversationApercu[]>('/conversations');
      setConversations(data);
      setErreur('');
    } catch (error: unknown) {
      setErreur(lireMessageErreur(error));
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    chargerConversations();
    const intervalle = setInterval(chargerConversations, INTERVALLE_POLLING_MS);
    return () => clearInterval(intervalle);
  }, []);

  useEffect(() => {
    if (conversationInitiale) {
      onConversationInitialeConsommee?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ne doit s'executer qu'au montage, pas a chaque changement de prop
  }, []);

  const conversationsAffichees = useMemo<ConversationApercu[]>(() => {
    const filtre = recherche.trim().toLowerCase();
    if (!filtre) {
      return conversations;
    }
    return conversations.filter((conversation) => conversation.autrePartie.toLowerCase().includes(filtre));
  }, [conversations, recherche]);

  if (conversationOuverte) {
    return (
      <VueConversation
        autrePartie={conversationOuverte.autrePartie}
        conversationId={conversationOuverte.id}
        onRetour={() => {
          setConversationOuverte(null);
          void chargerConversations();
        }}
      />
    );
  }

  return (
    <section className="min-h-full bg-white text-left text-ink">
      <header className="px-5 pb-4 pt-7">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="m-0 text-[42px] font-black leading-none tracking-normal text-ink">Messages</h1>
          <button
            aria-label="Notifications"
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-surface-1 text-ink"
            onClick={onOuvrirNotifications}
            type="button"
          >
            <BellIcon className="h-6 w-6" />
            {notificationsNonLues > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-strong px-1 text-[9px] font-bold text-white">
                {notificationsNonLues > 9 ? '9+' : notificationsNonLues}
              </span>
            )}
          </button>
        </div>

        <label className="flex h-11 items-center gap-3 rounded-2xl bg-surface-1 px-4 text-sm text-muted">
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
        {chargement && (
          <div className="px-5 py-5">
            <SquelettesCartes nombre={2} />
          </div>
        )}
        {erreur && <p className="m-5 rounded-2xl bg-danger-soft p-4 text-sm font-semibold text-danger-strong">{erreur}</p>}

        {!chargement && !erreur && conversationsAffichees.length === 0 && (
          <div className="px-5 py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-1 text-muted">
              <MessageIcon className="h-7 w-7" />
            </div>
            <h2 className="m-0 mt-4 text-lg font-bold text-ink">Aucune conversation</h2>
            <p className="m-0 mt-2 text-sm leading-6 text-muted">
              Contactez un prestataire depuis sa fiche pour demarrer une conversation.
            </p>
          </div>
        )}

        {!chargement && !erreur && conversationsAffichees.length > 0 && (
          <div>
            {conversationsAffichees.map((conversation) => {
              const initiales = initialesDepuisNom(conversation.autrePartie, 'KW');

              return (
                <button
                  className="flex w-full items-center gap-4 border-b border-line px-5 py-4 text-left transition active:bg-surface-1"
                  key={conversation.id}
                  onClick={() => setConversationOuverte(conversation)}
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
                      <span className="min-w-0 truncate text-[17px] font-black leading-6 text-ink">{conversation.autrePartie}</span>
                      {conversation.dernierMessage && (
                        <span className="flex-none text-sm font-medium text-muted">{libellerTemps(conversation.dernierMessage.creeLe)}</span>
                      )}
                    </span>
                    <span className="mt-1 block truncate text-[15px] leading-6 text-muted">
                      {conversation.dernierMessage?.contenu ?? 'Aucun message pour le moment'}
                    </span>
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
