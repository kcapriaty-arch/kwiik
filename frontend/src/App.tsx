import { useState } from 'react';
import { Accueil } from './Accueil';
import { Auth } from './Auth';
import { DevenirPrestataire } from './DevenirPrestataire';
import { Decouverte } from './Decouverte';
import { MesReservations } from './MesReservations';
import { MonProfilPrestataire } from './MonProfilPrestataire';
import { Messages } from './Messages';
import {
  TableauBordPrestataire,
  type OngletPrestataire,
} from './TableauBordPrestataire';
import { useSession } from './session';
import { initialesDepuisNom } from './ui';
import { Vitrine } from './Vitrine';

type Mode = 'client' | 'pro';
type Vue = 'accueil' | 'decouverte' | 'reservations' | 'messages' | 'prestataire' | 'devenir-prestataire' | 'profil';
type OngletPro = 'tableau' | 'demandes' | 'prestations' | 'creneaux' | 'profil';
type IconeNavigation = 'home' | 'search' | 'calendar' | 'briefcase' | 'user' | 'plus' | 'logout' | 'message' | 'list' | 'clock';

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
  { onglet: 'creneaux', libelle: 'CrÃ©neaux', icone: 'clock' },
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

  function reinitialiserNavigation(): void {
    setMode('client');
    setVue('accueil');
    setOngletPro('tableau');
    setRechercheDecouverte({ nomCategorie: '', ville: '' });
    setPrestataireSelectionne(null);
  }

  function gererDeconnexion(): void {
    reinitialiserNavigation();
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
    setVue(nouvelOnglet === 'profil' ? 'profil' : 'prestataire');
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

  function afficherProfil() {
    const nomAffiche = utilisateur?.nom?.trim() || 'Utilisateur KWIIK';
    const initiales = initialesDepuisNom(utilisateur?.nom || utilisateur?.telephone, 'KW');

    return (
      <section className="min-h-full bg-cream text-left">
        <div className="bg-coral px-5 py-8 text-center text-white">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-[22px] bg-white/18 text-xl font-black text-white ring-1 ring-white/25">
            {initiales}
          </div>
          <h2 className="m-0 text-lg font-bold text-white">{nomAffiche}</h2>
          <p className="m-0 mt-1 text-xs font-semibold text-white/75">{utilisateur?.telephone}</p>
        </div>

        <div className="px-5 py-4">
          <p className="m-0 mb-2 text-xs font-bold text-muted">Vous utilisez KWIIK en tant que :</p>
          <div className="grid grid-cols-2 gap-2 rounded-[18px] bg-white p-1 shadow-[0_10px_25px_rgba(26,26,24,0.06)]">
            <button
              className={`h-10 rounded-[14px] text-sm font-bold transition ${mode === 'client' ? 'bg-ink text-white' : 'text-muted'}`}
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
              className={`h-10 rounded-[14px] text-sm font-bold transition ${mode === 'pro' ? 'bg-ink text-white' : 'text-muted'}`}
              onClick={activerModePro}
              type="button"
            >
              Prestataire
            </button>
          </div>
          {!estPrestataire && (
            <p className="m-0 mt-2 text-xs leading-5 text-muted">
              CrÃ©ez votre vitrine pour activer l'espace prestataire.
            </p>
          )}
        </div>

        <div className="py-2">
          {mode === 'client' ? (
            <button
              className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-semibold text-ink transition hover:bg-white"
              onClick={() => naviguerClient('reservations')}
              type="button"
            >
              <Icone className="h-5 w-5 text-muted" nom="calendar" />
              <span className="flex-1">Mes rendez-vous</span>
              <span className="text-muted">&gt;</span>
            </button>
          ) : (
            <>
              <button className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-semibold text-ink transition hover:bg-white" onClick={() => naviguerPro('tableau')} type="button">
                <Icone className="h-5 w-5 text-muted" nom="briefcase" />
                <span className="flex-1">Tableau de bord</span>
                <span className="text-muted">&gt;</span>
              </button>
              <button className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-semibold text-ink transition hover:bg-white" onClick={() => naviguerPro('prestations')} type="button">
                <Icone className="h-5 w-5 text-muted" nom="plus" />
                <span className="flex-1">Mes prestations</span>
                <span className="text-muted">&gt;</span>
              </button>
              <button className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-semibold text-ink transition hover:bg-white" onClick={() => naviguerPro('creneaux')} type="button">
                <Icone className="h-5 w-5 text-muted" nom="clock" />
                <span className="flex-1">Mes crÃ©neaux</span>
                <span className="text-muted">&gt;</span>
              </button>
            </>
          )}

          {!estPrestataire && (
            <button
              className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-semibold text-ink transition hover:bg-white"
              onClick={() => naviguerClient('devenir-prestataire')}
              type="button"
            >
              <Icone className="h-5 w-5 text-coral-dark" nom="plus" />
              <span className="flex-1">Devenir prestataire</span>
              <span className="text-muted">&gt;</span>
            </button>
          )}

          <button
            className="mt-2 flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-bold text-danger-strong transition hover:bg-danger-soft"
            onClick={gererDeconnexion}
            type="button"
          >
            <Icone className="h-5 w-5" nom="logout" />
            <span>Se dÃ©connecter</span>
          </button>
        </div>
      </section>
    );
  }

  const contenu = prestataireSelectionne ? (
    <Vitrine onRetour={() => setPrestataireSelectionne(null)} prestataireId={prestataireSelectionne} />
  ) : vue === 'devenir-prestataire' ? (
    <DevenirPrestataire onCree={() => void apresCreationPrestataire()} />
  ) : mode === 'pro' && vue === 'prestataire' ? (
    <TableauBordPrestataire masquerOnglets={ongletPro !== 'tableau'} ongletInitial={ongletProVersOngletPrestataire(ongletPro)} />
  ) : mode === 'pro' && vue === 'profil' ? (
    <MonProfilPrestataire />
  ) : vue === 'profil' ? (
    afficherProfil()
  ) : vue === 'accueil' ? (
    <Accueil onDevenirPrestataire={() => naviguerClient('devenir-prestataire')} onRechercher={rechercher} />
  ) : vue === 'reservations' ? (
    <MesReservations />
  ) : vue === 'messages' ? (
    <Messages />
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
          <Auth onConnecte={() => void recharger()} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-0 px-0 py-0 sm:px-3 sm:py-6">
      <div className="mx-auto flex h-screen min-h-[720px] w-full max-w-[420px] flex-col overflow-hidden rounded-none border-line bg-surface-2 shadow-[0_12px_40px_rgba(0,0,0,0.10)] sm:h-[calc(100svh-48px)] sm:rounded-[30px] sm:border">
        <main className="flex-1 overflow-y-auto bg-cream">{contenu}</main>

        {!prestataireSelectionne && (
          <nav className="grid grid-cols-5 border-t border-line bg-white/95 px-2 py-1.5 backdrop-blur">
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
                      <span className="truncate">{onglet.libelle}</span>
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
                      <span className="truncate">{onglet.libelle}</span>
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