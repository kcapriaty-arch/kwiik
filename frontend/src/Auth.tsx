import { useMemo, useState } from 'react';
import type { AxiosError } from 'axios';
import { api } from './api';

export type IntentionConnexion = 'client' | 'prestataire';

export interface ResultatConnexion {
  intention: IntentionConnexion;
  estPrestataire: boolean;
  nouveau: boolean;
}

interface AuthProps {
  intention: IntentionConnexion;
  onConnecte: (resultat: ResultatConnexion) => void | Promise<void>;
}

interface SessionAuth {
  estPrestataire: boolean;
}

interface ReponseAuth {
  token: string;
  nouveau: boolean;
}

interface ApiErreur {
  message?: string | string[];
}

type ModeFormulaire = 'connexion' | 'inscription';

interface IconeProps {
  nom: 'mail' | 'lock' | 'user' | 'apple' | 'briefcase' | 'calendar' | 'spark' | 'arrow' | 'check';
  className?: string;
}

const avantages: Record<IntentionConnexion, string[]> = {
  client: ['Reserver un service fiable', 'Suivre vos RDV', 'Retrouver vos avis'],
  prestataire: ['Publier votre vitrine', 'Gerer les demandes', 'Ajouter photos et creneaux'],
};

function extraireMessageErreur(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<ApiErreur>;
  const message = axiosError.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(' ');
  }

  return message ?? fallback;
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

  if (nom === 'mail') {
    return (
      <svg {...props}>
        <rect height="16" rx="2" width="20" x="2" y="4" />
        <path d="m2 6 10 7 10-7" />
      </svg>
    );
  }

  if (nom === 'lock') {
    return (
      <svg {...props}>
        <rect height="11" rx="2" width="16" x="4" y="11" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
    );
  }

  if (nom === 'user') {
    return (
      <svg {...props}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
      </svg>
    );
  }

  if (nom === 'apple') {
    return (
      <svg {...props} fill="currentColor" stroke="none" viewBox="0 0 24 24">
        <path d="M16.365 1.43c0 1.14-.44 2.06-1.05 2.78-.65.78-1.72 1.4-2.68 1.33-.12-1.1.44-2.2 1.05-2.9.65-.77 1.79-1.35 2.68-1.21ZM20.6 17.24c-.5 1.15-.74 1.66-1.38 2.68-.9 1.44-2.16 3.23-3.73 3.24-1.4.02-1.76-.9-3.66-.89-1.9.01-2.3.9-3.7.88-1.57-.02-2.76-1.63-3.66-3.07-2.51-4-2.77-8.7-1.22-11.2 1.1-1.78 2.85-2.82 4.5-2.82 1.68 0 2.73 1 4.12 1 1.34 0 2.16-1 4.12-1 1.48 0 3.05.8 4.16 2.2-3.66 2-3.07 7.2.45 9Z" />
      </svg>
    );
  }

  if (nom === 'briefcase') {
    return (
      <svg {...props}>
        <path d="M10 6V5a2 2 0 0 1 4 0v1" />
        <rect height="14" rx="3" width="18" x="3" y="6" />
        <path d="M3 12h18" />
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

  if (nom === 'arrow') {
    return (
      <svg {...props}>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    );
  }

  if (nom === 'check') {
    return (
      <svg {...props}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <path d="M12 2v5" />
      <path d="M12 17v5" />
      <path d="M4.22 4.22 7.76 7.76" />
      <path d="m16.24 16.24 3.54 3.54" />
      <path d="M2 12h5" />
      <path d="M17 12h5" />
      <path d="m4.22 19.78 3.54-3.54" />
      <path d="m16.24 7.76 3.54-3.54" />
    </svg>
  );
}

export function Auth({ intention, onConnecte }: AuthProps) {
  const [mode, setMode] = useState<ModeFormulaire>('inscription');
  const [nom, setNom] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [motDePasse, setMotDePasse] = useState<string>('');
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState<string>('');
  const [appleOuvert, setAppleOuvert] = useState<boolean>(false);
  const [appleNom, setAppleNom] = useState<string>('');
  const [appleEmail, setAppleEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [chargement, setChargement] = useState<boolean>(false);

  const emailValide = /\S+@\S+\.\S+/.test(email.trim());
  const peutSoumettre =
    mode === 'connexion'
      ? emailValide && motDePasse.length > 0
      : nom.trim().length >= 2 && emailValide && motDePasse.length >= 8 && motDePasse === confirmationMotDePasse;

  const appleEmailValide = /\S+@\S+\.\S+/.test(appleEmail.trim());
  const peutContinuerApple = appleNom.trim().length >= 2 && appleEmailValide;

  const contenuProfil = useMemo(() => {
    if (intention === 'prestataire') {
      return {
        titre: 'Developpez votre activite sur KWIIK',
        sousTitre: 'Creez votre vitrine, publiez vos services et recevez des demandes en ligne.',
      };
    }

    return {
      titre: 'Trouvez un service fiable pres de chez vous',
      sousTitre: 'Reservez rapidement un pro verifie pour vos besoins du quotidien.',
    };
  }, [intention]);

  async function apresConnexion(data: ReponseAuth): Promise<void> {
    localStorage.setItem('kwiik_token', data.token);
    const session = await api.get<SessionAuth>('/auth/moi');
    await onConnecte({
      intention,
      estPrestataire: Boolean(session.data.estPrestataire),
      nouveau: data.nouveau,
    });
  }

  async function soumettre(): Promise<void> {
    if (!peutSoumettre) {
      return;
    }

    setMessage('');
    setChargement(true);

    try {
      if (mode === 'inscription') {
        const { data } = await api.post<ReponseAuth>('/auth/inscription', {
          nom: nom.trim(),
          email: email.trim(),
          motDePasse,
        });
        await apresConnexion(data);
      } else {
        const { data } = await api.post<ReponseAuth>('/auth/connexion', {
          email: email.trim(),
          motDePasse,
        });
        await apresConnexion(data);
      }
    } catch (error: unknown) {
      setMessage(extraireMessageErreur(error, 'Une erreur est survenue.'));
    } finally {
      setChargement(false);
    }
  }

  async function continuerAvecApple(): Promise<void> {
    if (!peutContinuerApple) {
      return;
    }

    setMessage('');
    setChargement(true);

    try {
      const { data } = await api.post<ReponseAuth>('/auth/apple-simule', {
        nom: appleNom.trim(),
        email: appleEmail.trim(),
      });
      await apresConnexion(data);
    } catch (error: unknown) {
      setMessage(extraireMessageErreur(error, 'Une erreur est survenue.'));
    } finally {
      setChargement(false);
    }
  }

  return (
    <section className="flex flex-1 flex-col bg-surface-2 text-left">
      <div className="relative overflow-hidden bg-kwiik px-5 pb-24 pt-8 text-white">
        <div className="absolute inset-x-0 bottom-0 h-14 rounded-t-[44px] bg-surface-2" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="m-0 text-[11px] font-black uppercase tracking-[0.34em] text-white/65">KWIIK</p>
            <h1 className="m-0 mt-3 max-w-[250px] text-3xl font-black leading-[1.05] text-white">
              {contenuProfil.titre}
            </h1>
            <p className="m-0 mt-3 max-w-[280px] text-sm font-medium leading-6 text-white/78">
              {contenuProfil.sousTitre}
            </p>
          </div>

          <div className="hidden h-16 w-16 flex-none items-center justify-center rounded-[24px] bg-white/15 ring-1 ring-white/20 min-[380px]:flex">
            <Icone className="h-8 w-8 text-white" nom={intention === 'prestataire' ? 'briefcase' : 'calendar'} />
          </div>
        </div>
      </div>

      <div className="relative -mt-20 flex-1 px-5 pb-6">
        <div className="rounded-[28px] border border-line bg-white p-4 shadow-[0_18px_50px_rgba(26,26,24,0.12)]">
          <div className="mb-4 grid grid-cols-3 gap-2">
            {avantages[intention].map((avantage: string) => (
              <div className="rounded-[18px] bg-surface-1 px-2 py-3 text-center" key={avantage}>
                <Icone className="mx-auto mb-1 h-4 w-4 text-teal-dark" nom="check" />
                <p className="m-0 text-[10px] font-bold leading-4 text-muted">{avantage}</p>
              </div>
            ))}
          </div>

          <div className="mb-4 grid grid-cols-2 gap-1 rounded-[16px] bg-surface-1 p-1">
            <button
              className={`h-10 rounded-[12px] text-sm font-bold transition ${mode === 'inscription' ? 'bg-white text-ink shadow-sm' : 'text-muted'}`}
              onClick={() => {
                setMode('inscription');
                setMessage('');
              }}
              type="button"
            >
              Creer un compte
            </button>
            <button
              className={`h-10 rounded-[12px] text-sm font-bold transition ${mode === 'connexion' ? 'bg-white text-ink shadow-sm' : 'text-muted'}`}
              onClick={() => {
                setMode('connexion');
                setMessage('');
              }}
              type="button"
            >
              Se connecter
            </button>
          </div>

          {!appleOuvert ? (
            <div>
              {mode === 'inscription' && (
                <div className="mb-3">
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-muted" htmlFor="nom">
                    Nom et prenom
                  </label>
                  <div className="flex items-center gap-3 rounded-[20px] border border-line bg-surface-1 px-4 py-3 focus-within:border-kwiik focus-within:bg-white">
                    <Icone className="h-5 w-5 flex-none text-kwiik" nom="user" />
                    <input
                      className="min-w-0 flex-1 border-0 bg-transparent text-base font-bold text-ink outline-none placeholder:text-[#A9A59B]"
                      id="nom"
                      onChange={(event) => setNom(event.target.value)}
                      placeholder="Votre nom et prenom"
                      value={nom}
                    />
                  </div>
                </div>
              )}

              <div className="mb-3">
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-muted" htmlFor="email">
                  Email
                </label>
                <div className="flex items-center gap-3 rounded-[20px] border border-line bg-surface-1 px-4 py-3 focus-within:border-kwiik focus-within:bg-white">
                  <Icone className="h-5 w-5 flex-none text-kwiik" nom="mail" />
                  <input
                    className="min-w-0 flex-1 border-0 bg-transparent text-base font-bold text-ink outline-none placeholder:text-[#A9A59B]"
                    id="email"
                    inputMode="email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="vous@exemple.com"
                    type="email"
                    value={email}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-muted" htmlFor="motDePasse">
                  Mot de passe
                </label>
                <div className="flex items-center gap-3 rounded-[20px] border border-line bg-surface-1 px-4 py-3 focus-within:border-kwiik focus-within:bg-white">
                  <Icone className="h-5 w-5 flex-none text-kwiik" nom="lock" />
                  <input
                    className="min-w-0 flex-1 border-0 bg-transparent text-base font-bold text-ink outline-none placeholder:text-[#A9A59B]"
                    id="motDePasse"
                    onChange={(event) => setMotDePasse(event.target.value)}
                    placeholder={mode === 'inscription' ? 'Au moins 8 caracteres' : 'Votre mot de passe'}
                    type="password"
                    value={motDePasse}
                  />
                </div>
              </div>

              {mode === 'inscription' && (
                <div className="mb-1">
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-muted" htmlFor="confirmation">
                    Confirmer le mot de passe
                  </label>
                  <div className="flex items-center gap-3 rounded-[20px] border border-line bg-surface-1 px-4 py-3 focus-within:border-kwiik focus-within:bg-white">
                    <Icone className="h-5 w-5 flex-none text-kwiik" nom="lock" />
                    <input
                      className="min-w-0 flex-1 border-0 bg-transparent text-base font-bold text-ink outline-none placeholder:text-[#A9A59B]"
                      id="confirmation"
                      onChange={(event) => setConfirmationMotDePasse(event.target.value)}
                      placeholder="Retapez le mot de passe"
                      type="password"
                      value={confirmationMotDePasse}
                    />
                  </div>
                  {confirmationMotDePasse.length > 0 && motDePasse !== confirmationMotDePasse && (
                    <p className="m-0 mt-1.5 text-xs font-semibold text-danger-strong">Les mots de passe ne correspondent pas.</p>
                  )}
                </div>
              )}

              <button
                className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] bg-ink px-4 text-sm font-black text-white shadow-[0_12px_25px_rgba(26,26,24,0.18)] transition active:scale-[0.99] disabled:bg-[#B8B4AA] disabled:shadow-none"
                disabled={chargement || !peutSoumettre}
                onClick={() => void soumettre()}
                type="button"
              >
                {chargement ? 'Un instant...' : mode === 'inscription' ? 'Creer mon compte' : 'Se connecter'}
                <Icone className="h-4 w-4" nom="arrow" />
              </button>

              <div className="my-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-line" />
                <span className="text-xs font-bold text-muted">ou</span>
                <span className="h-px flex-1 bg-line" />
              </div>

              <button
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] border border-line bg-white px-4 text-sm font-black text-ink transition active:scale-[0.99]"
                onClick={() => setAppleOuvert(true)}
                type="button"
              >
                <Icone className="h-5 w-5" nom="apple" />
                Continuer avec Apple
              </button>
              <p className="m-0 mt-2 text-center text-[11px] leading-4 text-muted">
                Connexion Apple simulee pour l'instant (pas de compte Apple reel requis).
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-11 w-11 flex-none items-center justify-center rounded-[18px] bg-kwiik-light text-kwiik-dark">
                  <Icone className="h-5 w-5" nom="apple" />
                </div>
                <div>
                  <p className="m-0 text-lg font-black text-ink">Continuer avec Apple</p>
                  <p className="m-0 mt-1 text-sm leading-5 text-muted">Simulation : indiquez le nom et l'email a utiliser.</p>
                </div>
              </div>

              <div className="mb-3">
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-muted" htmlFor="appleNom">
                  Nom et prenom
                </label>
                <div className="flex items-center gap-3 rounded-[20px] border border-line bg-surface-1 px-4 py-3 focus-within:border-kwiik focus-within:bg-white">
                  <Icone className="h-5 w-5 flex-none text-kwiik" nom="user" />
                  <input
                    className="min-w-0 flex-1 border-0 bg-transparent text-base font-bold text-ink outline-none placeholder:text-[#A9A59B]"
                    id="appleNom"
                    onChange={(event) => setAppleNom(event.target.value)}
                    placeholder="Votre nom et prenom"
                    value={appleNom}
                  />
                </div>
              </div>

              <div className="mb-1">
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-muted" htmlFor="appleEmail">
                  Email
                </label>
                <div className="flex items-center gap-3 rounded-[20px] border border-line bg-surface-1 px-4 py-3 focus-within:border-kwiik focus-within:bg-white">
                  <Icone className="h-5 w-5 flex-none text-kwiik" nom="mail" />
                  <input
                    className="min-w-0 flex-1 border-0 bg-transparent text-base font-bold text-ink outline-none placeholder:text-[#A9A59B]"
                    id="appleEmail"
                    inputMode="email"
                    onChange={(event) => setAppleEmail(event.target.value)}
                    placeholder="vous@icloud.com"
                    type="email"
                    value={appleEmail}
                  />
                </div>
              </div>

              <button
                className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] bg-ink px-4 text-sm font-black text-white shadow-[0_12px_25px_rgba(26,26,24,0.18)] transition active:scale-[0.99] disabled:bg-[#B8B4AA] disabled:shadow-none"
                disabled={chargement || !peutContinuerApple}
                onClick={() => void continuerAvecApple()}
                type="button"
              >
                {chargement ? 'Un instant...' : 'Continuer'}
                <Icone className="h-4 w-4" nom="arrow" />
              </button>

              <button
                className="mt-3 w-full rounded-[16px] px-4 py-3 text-sm font-bold text-muted transition hover:bg-surface-1"
                onClick={() => {
                  setAppleOuvert(false);
                  setMessage('');
                }}
                type="button"
              >
                Retour
              </button>
            </div>
          )}

          {message && (
            <p className="m-0 mt-4 rounded-[16px] bg-danger-soft px-4 py-3 text-sm font-bold leading-5 text-danger-strong">
              {message}
            </p>
          )}
        </div>

        <div className="mt-4 rounded-[22px] bg-surface-1 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[16px] bg-teal-soft text-teal-dark">
              <Icone className="h-5 w-5" nom="spark" />
            </div>
            <p className="m-0 text-xs font-bold leading-5 text-muted">
              Le meme compte vous permet de reserver comme client ou de creer une vitrine prestataire.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
