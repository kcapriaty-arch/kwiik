import { useEffect, useState } from 'react';
import { Accueil } from './Accueil';
import { Auth, type IntentionConnexion, type ResultatConnexion } from './Auth';
import { Decouverte } from './Decouverte';
import { MesFavoris } from './MesFavoris';
import { MesReservations } from './MesReservations';
import { MonProfilPrestataire } from './MonProfilPrestataire';
import { Messages } from './Messages';
import { Notifications } from './notifications/Notifications';
import { ParametresCompte } from './ParametresCompte';
import { Bienvenue } from './onboarding/Bienvenue';
import { ChoixRole } from './onboarding/ChoixRole';
import { OnboardingClient } from './onboarding/OnboardingClient';
import { OnboardingPrestataire } from './onboarding/OnboardingPrestataire';
import {
  TableauBordPrestataire,
  type OngletPrestataire,
} from './TableauBordPrestataire';
import { api, urlImage } from './api';
import { useSession } from './session';
import { initialesDepuisNom } from './ui';
import { Vitrine } from './Vitrine';

type Mode = 'client' | 'pro';
type Vue = 'accueil' | 'decouverte' | 'reservations' | 'messages' | 'prestataire' | 'devenir-prestataire' | 'profil' | 'favoris' | 'notifications' | 'compte';
type OngletPro = 'tableau' | 'demandes' | 'prestations' | 'creneaux' | 'messages' | 'profil';
type IconeNavigation = 'home' | 'search' | 'calendar' | 'briefcase' | 'user' | 'plus' | 'logout' | 'message' | 'list' | 'clock' | 'heart';

interface RechercheDecouverte {
  nomCategorie: string;
  ville: string;
}

interface IconeProps {
  nom: IconeNavigation;
  className?: string;
}

interface OngletClientNavigation {
  vue: Vue;
  libelle: string;
  icone: IconeNavigation;
}

interface OngletProNavigation {
  onglet: OngletPro;
  libelle: string;
  icone: IconeNavigation;
}

const ongletsClient: OngletClientNavigation[] = [
  { vue: 'accueil', libelle: 'Accueil', icone: 'home' },
  { vue: 'decouverte', libelle: 'Recherche', icone: 'search' },
  { vue: 'reservations', libelle: 'RDV', icone: 'calendar' },
  { vue: 'messages', libelle: 'Messages', icone: 'message' },
  { vue: 'profil', libelle: 'Profil', icone: 'user' },
];

const ongletsPro: OngletProNavigation[] = [
  { onglet: 'tableau', libelle: 'Tableau', icone: 'briefcase' },
  { onglet: 'demandes', libelle: 'Demandes', icone: 'list' },
  { onglet: 'prestations', libelle: 'Prestations', icone: 'plus' },
  { onglet: 'creneaux', libelle: 'Creneaux', icone: 'clock' },
  { onglet: 'messages', libelle: 'Messages', icone: 'message' },
  { onglet: 'profil', libelle: 'Profil', icone: 'user' },
];

function normaliserVilleRecherche(ville: string): string {
  return ville.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function Icone({ nom, className = '' }: IconeProps) {
  const props = {
    'aria-hidden': true,
    className,
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 2,
    viewBox: '0 0 24 24',
  };

  if (nom === 'home') {
    return (
      <svg {...props}>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10" />
        <path d="M10 20v-6h4v6" />
      </svg>
    );
  }

  if (nom === 'search') {
    return (
      <svg {...props}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    );
  }

  if (nom === 'calendar') {
    return (
      <svg {...props}>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect height="18" rx="3" width="18" x="3" y="4" />
        <path d="M3 10h18" />
      </svg>
    );
  }

  if (nom === 'briefcase') {
    return (
      <svg {...props}>
        <path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1" />
        <rect height="14" rx="3" width="18" x="3" y="6" />
        <path d="M3 12h18" />
      </svg>
    );
  }

  if (nom === 'plus') {
    return (
      <svg {...props}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    );
  }

  if (nom === 'logout') {
    return (
      <svg {...props}>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M21 19V5" />
      </svg>
    );
  }

  if (nom === 'message') {
    return (
      <svg {...props}>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
      </svg>
    );
  }

  if (nom === 'list') {
    return (
      <svg {...props}>
        <path d="M8 6h13" />
        <path d="M8 12h13" />
        <path d="M8 18h13" />
        <path d="M3 6h.01" />
        <path d="M3 12h.01" />
        <path d="M3 18h.01" />
      </svg>
    );
  }

  if (nom === 'clock') {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }

  if (nom === 'heart') {
    return (
      <svg {...props}>
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function ongletProVersOngletPrestataire(onglet: OngletPro): OngletPrestataire {
  if (onglet === 'prestations') {
    return 'prestations';
  }

  if (onglet === 'creneaux') {
    return 'creneaux';
  }

  return 'demandes';
}

function App() {
  const { utilisateur, estPrestataire, chargement, recharger, deconnexion } = useSession();
  const [mode, setMode] = useState<Mode>('client');
  const [vue, setVue] = useState<Vue>('accueil');
  const [ongletPro, setOngletPro] = useState<OngletPro>('tableau');
  const [rechercheDecouverte, setRechercheDecouverte] = useState<RechercheDecouverte>({
    nomCategorie: '',
    ville: '',
  });
  const [prestataireSelectionne, setPrestataireSelectionne] = useState<string | null>(null);
  const [conversationAOuvrir, setConversationAOuvrir] = useState<{ id: string; autrePartie: string } | null>(null);
  const [etapePreAuth, setEtapePreAuth] = useState<'bienvenue' | 'choixRole' | 'auth'>('bienvenue');
  const [intentionChoisie, setIntentionChoisie] = useState<IntentionConnexion | null>(null);
  const [statsProfil, setStatsProfil] = useState<{ reservations: number; favoris: number; avis: number }>({
    reservations: 0,
    favoris: 0,
    avis: 0,
  });

  useEffect(() => {
    if (!utilisateur || mode !== 'client' || vue !== 'profil') {
      return;
    }

    let annule = false;

    async function chargerStats(): Promise<void> {
      try {
        const [reservationsRes, favorisRes] = await Promise.all([
          api.get<{ avis?: unknown }[]>('/reservations/mes-reservations'),
          api.get<unknown[]>('/favoris'),
        ]);
        if (annule) {
          return;
        }
        setStatsProfil({
          reservations: reservationsRes.data.length,
          favoris: favorisRes.data.length,
          avis: reservationsRes.data.filter((r) => Boolean(r.avis)).length,
        });
      } catch {
        // Echec silencieux : les compteurs restent a 0 plutot que de bloquer l'ecran.
      }
    }

    void chargerStats();

    return () => {
      annule = true;
    };
  }, [utilisateur, mode, vue]);

  function reinitialiserNavigation(): void {
    setMode('client');
    setVue('accueil');
    setOngletPro('tableau');
    setRechercheDecouverte({ nomCategorie: '', ville: '' });
    setPrestataireSelectionne(null);
  }

  function gererDeconnexion(): void {
    reinitialiserNavigation();
    setEtapePreAuth('bienvenue');
    setIntentionChoisie(null);
    deconnexion();
  }

  function naviguerClient(nouvelleVue: Vue): void {
    setMode('client');
    setVue(nouvelleVue);
    setPrestataireSelectionne(null);

    if (nouvelleVue === 'decouverte') {
      setRechercheDecouverte({ nomCategorie: '', ville: '' });
    }
  }

  function naviguerPro(nouvelOnglet: OngletPro): void {
    setMode('pro');
    setOngletPro(nouvelOnglet);
    setPrestataireSelectionne(null);

    if (nouvelOnglet === 'profil') {
      setVue('profil');
    } else if (nouvelOnglet === 'messages') {
      setVue('messages');
    } else {
      setVue('prestataire');
    }
  }

  function activerModePro(): void {
    if (!estPrestataire) {
      setMode('client');
      setVue('devenir-prestataire');
      setPrestataireSelectionne(null);
      return;
    }

    naviguerPro('profil');
  }

  function rechercher(nomCategorie: string, ville: string): void {
    setMode('client');
    setRechercheDecouverte({
      nomCategorie: nomCategorie.trim(),
      ville: normaliserVilleRecherche(ville),
    });
    setPrestataireSelectionne(null);
    setVue('decouverte');
  }

  async function apresCreationPrestataire(): Promise<void> {
    await recharger();
    setMode('pro');
    setOngletPro('tableau');
    setVue('prestataire');
    setPrestataireSelectionne(null);
  }

  async function gererConnexion(resultat: ResultatConnexion): Promise<void> {
    await recharger();
    setPrestataireSelectionne(null);

    if (resultat.intention === 'prestataire') {
      if (resultat.estPrestataire) {
        setMode('pro');
        setOngletPro('profil');
        setVue('profil');
        return;
      }

      setMode('client');
      setVue('devenir-prestataire');
      return;
    }

    setMode('client');
    setVue('accueil');
    setOngletPro('tableau');
    setRechercheDecouverte({ nomCategorie: '', ville: '' });
  }

  function afficherProfil() {
    const nomAffiche = utilisateur?.nom?.trim() || 'Utilisateur KWIIK';
    const initiales = initialesDepuisNom(utilisateur?.nom, 'KW');
    const membreDepuis = utilisateur?.creeLe
      ? new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(utilisateur.creeLe))
      : '';

    function ligneMenu(icone: IconeNavigation, titre: string, sousTitre: string, onClick: () => void, key?: string) {
      return (
        <button
          className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left transition active:scale-[0.99]"
          key={key}
          onClick={onClick}
          type="button"
        >
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-kwiik-light text-kwiik">
            <Icone className="h-5 w-5" nom={icone} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-ink">{titre}</span>
            <span className="block truncate text-xs text-muted">{sousTitre}</span>
          </span>
          <span className="flex-none text-muted">&gt;</span>
        </button>
      );
    }

    return (
      <section className="min-h-full bg-surface-0 text-left">
        <div className="bg-kwiik px-5 pb-8 pt-7 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 flex-none items-center justify-center overflow-hidden rounded-2xl bg-white/15 text-lg font-black text-white ring-2 ring-lime">
              {utilisateur?.photoProfilUrl ? (
                <img alt="" className="h-full w-full object-cover" src={urlImage(utilisateur.photoProfilUrl)} />
              ) : (
                initiales
              )}
            </div>
            <div className="min-w-0">
              <h2 className="m-0 truncate text-lg font-black text-white">{nomAffiche}</h2>
              {membreDepuis && <p className="m-0 mt-0.5 text-xs font-medium text-white/70">Membre depuis {membreDepuis}</p>}
              {utilisateur?.emailConfirme && (
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-lime">
                  ✓ Email confirmé
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="-mt-5 grid grid-cols-3 gap-2 px-5">
          <div className="rounded-2xl bg-white p-3 text-center shadow-[0_4px_14px_rgba(0,0,0,0.06)]">
            <p className="m-0 text-lg font-black text-ink">{statsProfil.reservations}</p>
            <p className="m-0 text-[11px] text-muted">Réservations</p>
          </div>
          <div className="rounded-2xl bg-white p-3 text-center shadow-[0_4px_14px_rgba(0,0,0,0.06)]">
            <p className="m-0 text-lg font-black text-ink">{statsProfil.favoris}</p>
            <p className="m-0 text-[11px] text-muted">Favoris</p>
          </div>
          <div className="rounded-2xl bg-white p-3 text-center shadow-[0_4px_14px_rgba(0,0,0,0.06)]">
            <p className="m-0 text-lg font-black text-ink">{statsProfil.avis}</p>
            <p className="m-0 text-[11px] text-muted">Avis donnés</p>
          </div>
        </div>

        <div className="px-5 py-5">
          <p className="m-0 mb-2 text-xs font-bold text-muted">Vous utilisez KWIIK en tant que :</p>
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1 shadow-[0_10px_25px_rgba(26,26,24,0.06)]">
            <button
              className={`h-10 rounded-xl text-sm font-bold transition ${mode === 'client' ? 'bg-ink text-white' : 'text-muted'}`}
              onClick={() => {
                setMode('client');
                setVue('profil');
                setPrestataireSelectionne(null);
              }}
              type="button"
            >
              Client
            </button>
            <button
              className={`h-10 rounded-xl text-sm font-bold transition ${mode === 'pro' ? 'bg-ink text-white' : 'text-muted'}`}
              onClick={activerModePro}
              type="button"
            >
              Prestataire
            </button>
          </div>
          {!estPrestataire && (
            <p className="m-0 mt-2 text-xs leading-5 text-muted">
              Creez votre vitrine pour activer l'espace prestataire.
            </p>
          )}
        </div>

        <div className="grid gap-2 px-5 pb-2">
          {mode === 'client' ? (
            <>
              {ligneMenu('calendar', 'Mes rendez-vous', 'Réservations à venir et historique', () => naviguerClient('reservations'), 'rdv')}
              {ligneMenu('heart', 'Mes favoris', `${statsProfil.favoris} prestataire${statsProfil.favoris > 1 ? 's' : ''}`, () => naviguerClient('favoris'), 'favoris')}
            </>
          ) : (
            <>
              {ligneMenu('briefcase', 'Tableau de bord', 'Demandes et activité', () => naviguerPro('tableau'), 'tableau')}
              {ligneMenu('plus', 'Mes prestations', 'Catalogue de services', () => naviguerPro('prestations'), 'prestations')}
              {ligneMenu('clock', 'Mes créneaux', 'Disponibilités', () => naviguerPro('creneaux'), 'creneaux')}
            </>
          )}

          {ligneMenu('user', 'Paramètres du compte', 'Téléphone, email, photo', () => setVue('compte'), 'compte')}

          {!estPrestataire && ligneMenu('plus', 'Devenir prestataire', 'Créer votre vitrine', () => naviguerClient('devenir-prestataire'), 'devenir-prestataire')}

          <button
            className="mt-2 flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left text-sm font-bold text-danger-strong transition hover:bg-danger-soft"
            onClick={gererDeconnexion}
            type="button"
          >
            <Icone className="h-5 w-5" nom="logout" />
            <span>Se deconnecter</span>
          </button>
        </div>
      </section>
    );
  }

  const contenu = prestataireSelectionne ? (
    <Vitrine
      onContacter={(conversation) => {
        setConversationAOuvrir(conversation);
        setPrestataireSelectionne(null);
        naviguerClient('messages');
      }}
      onRetour={() => setPrestataireSelectionne(null)}
      prestataireId={prestataireSelectionne}
    />
  ) : vue === 'devenir-prestataire' ? (
    <OnboardingPrestataire onTermine={() => void apresCreationPrestataire()} />
  ) : vue === 'notifications' ? (
    <Notifications onRetour={() => naviguerClient('accueil')} />
  ) : vue === 'compte' ? (
    <ParametresCompte onRetour={() => setVue('profil')} />
  ) : mode === 'pro' && vue === 'prestataire' ? (
    <TableauBordPrestataire masquerOnglets={ongletPro !== 'tableau'} ongletInitial={ongletProVersOngletPrestataire(ongletPro)} />
  ) : mode === 'pro' && vue === 'profil' ? (
    <MonProfilPrestataire />
  ) : vue === 'profil' ? (
    afficherProfil()
  ) : vue === 'accueil' ? (
    <Accueil
      onDevenirPrestataire={() => naviguerClient('devenir-prestataire')}
      onOuvrirNotifications={() => naviguerClient('notifications')}
      onRechercher={rechercher}
      onSelectionnerPrestataire={setPrestataireSelectionne}
    />
  ) : vue === 'reservations' ? (
    <MesReservations onOuvrirNotifications={() => naviguerClient('notifications')} />
  ) : vue === 'favoris' ? (
    <MesFavoris onSelectionner={setPrestataireSelectionne} />
  ) : vue === 'messages' ? (
    <Messages
      conversationInitiale={conversationAOuvrir}
      onConversationInitialeConsommee={() => setConversationAOuvrir(null)}
      onOuvrirNotifications={() => naviguerClient('notifications')}
    />
  ) : (
    <Decouverte
      categorieInitiale={rechercheDecouverte.nomCategorie}
      onSelectionner={setPrestataireSelectionne}
      villeInitiale={rechercheDecouverte.ville}
    />
  );

  if (chargement) {
    return (
      <div className="min-h-screen bg-surface-0 px-0 py-0 sm:px-3 sm:py-6">
        <div className="mx-auto flex min-h-screen w-full max-w-[420px] items-center justify-center overflow-hidden rounded-none border-line bg-surface-2 p-5 text-sm text-muted shadow-[0_12px_40px_rgba(0,0,0,0.10)] sm:min-h-[720px] sm:rounded-[30px] sm:border">
          Chargement de la session...
        </div>
      </div>
    );
  }

  if (!utilisateur) {
    return (
      <div className="min-h-screen bg-surface-0 px-0 py-0 sm:px-3 sm:py-6">
        <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col overflow-hidden rounded-none border-line bg-surface-2 shadow-[0_12px_40px_rgba(0,0,0,0.10)] sm:min-h-[720px] sm:rounded-[30px] sm:border">
          {etapePreAuth === 'bienvenue' ? (
            <Bienvenue onSuivant={() => setEtapePreAuth('choixRole')} />
          ) : etapePreAuth === 'choixRole' ? (
            <ChoixRole
              onChoisir={(intention) => {
                setIntentionChoisie(intention);
                setEtapePreAuth('auth');
              }}
              onRetour={() => setEtapePreAuth('bienvenue')}
            />
          ) : (
            <Auth intention={intentionChoisie ?? 'client'} onConnecte={(resultat) => void gererConnexion(resultat)} />
          )}
        </div>
      </div>
    );
  }

  const parcours = intentionChoisie ?? (estPrestataire ? 'prestataire' : 'client');

  if (parcours === 'client' && !utilisateur.identiteComplete) {
    return (
      <div className="min-h-screen bg-surface-0 px-0 py-0 sm:px-3 sm:py-6">
        <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col overflow-hidden rounded-none border-line bg-surface-2 shadow-[0_12px_40px_rgba(0,0,0,0.10)] sm:min-h-[720px] sm:rounded-[30px] sm:border">
          <OnboardingClient onTermine={async () => { await recharger(); }} />
        </div>
      </div>
    );
  }

  if (
    parcours === 'prestataire' &&
    (!utilisateur.identiteComplete || !estPrestataire || !utilisateur.prestataireOnboardingComplete)
  ) {
    return (
      <div className="min-h-screen bg-surface-0 px-0 py-0 sm:px-3 sm:py-6">
        <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col overflow-hidden rounded-none border-line bg-surface-2 shadow-[0_12px_40px_rgba(0,0,0,0.10)] sm:min-h-[720px] sm:rounded-[30px] sm:border">
          <OnboardingPrestataire onTermine={() => void apresCreationPrestataire()} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-0 px-0 py-0 sm:px-3 sm:py-6">
      <div className="mx-auto flex h-screen min-h-[720px] w-full max-w-[420px] flex-col overflow-hidden rounded-none border-line bg-surface-2 shadow-[0_12px_40px_rgba(0,0,0,0.10)] sm:h-[calc(100svh-48px)] sm:rounded-[30px] sm:border">
        <main className="flex-1 overflow-y-auto bg-cream">{contenu}</main>

        {!prestataireSelectionne && (
          <nav className={`grid border-t border-line bg-white/95 px-2 py-1.5 backdrop-blur ${mode === 'client' ? 'grid-cols-5' : 'grid-cols-6'}`}>
            {mode === 'client'
              ? ongletsClient.map((onglet: OngletClientNavigation) => {
                  const actif = vue === onglet.vue;

                  return (
                    <button
                      className={`flex min-w-0 flex-col items-center gap-1 rounded-[16px] px-1 py-2 text-[10px] font-bold transition ${
                        actif ? 'bg-coral-soft text-coral-dark' : 'text-[#9A988F] hover:text-muted'
                      }`}
                      key={onglet.vue}
                      onClick={() => naviguerClient(onglet.vue)}
                      type="button"
                    >
                      <Icone className="h-5 w-5" nom={onglet.icone} />
                      <span className="w-full truncate text-center">{onglet.libelle}</span>
                    </button>
                  );
                })
              : ongletsPro.map((onglet: OngletProNavigation) => {
                  const actif = ongletPro === onglet.onglet;

                  return (
                    <button
                      className={`flex min-w-0 flex-col items-center gap-1 rounded-[16px] px-1 py-2 text-[10px] font-bold transition ${
                        actif ? 'bg-teal-soft text-teal-dark' : 'text-[#9A988F] hover:text-muted'
                      }`}
                      key={onglet.onglet}
                      onClick={() => naviguerPro(onglet.onglet)}
                      type="button"
                    >
                      <Icone className="h-5 w-5" nom={onglet.icone} />
                      <span className="w-full truncate text-center">{onglet.libelle}</span>
                    </button>
                  );
                })}
          </nav>
        )}
      </div>
    </div>
  );
}

export default App;
