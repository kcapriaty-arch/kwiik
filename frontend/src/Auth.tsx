import { useMemo, useState } from 'react';
import type { AxiosError } from 'axios';
import { api } from './api';

export type IntentionConnexion = 'client' | 'prestataire';

export interface ResultatConnexion {
  intention: IntentionConnexion;
  estPrestataire: boolean;
}

interface AuthProps {
  onConnecte: (resultat: ResultatConnexion) => void | Promise<void>;
}

interface SessionAuth {
  estPrestataire: boolean;
}

interface ApiErreur {
  message?: string | string[];
}

interface IconeProps {
  nom: 'phone' | 'shield' | 'briefcase' | 'calendar' | 'spark' | 'arrow' | 'check';
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

  if (nom === 'phone') {
    return (
      <svg {...props}>
        <rect height="18" rx="3" width="12" x="6" y="3" />
        <path d="M10 18h4" />
      </svg>
    );
  }

  if (nom === 'shield') {
    return (
      <svg {...props}>
        <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
        <path d="m9 12 2 2 4-5" />
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

export function Auth({ onConnecte }: AuthProps) {
  const [etape, setEtape] = useState<'telephone' | 'code'>('telephone');
  const [intention, setIntention] = useState<IntentionConnexion>('client');
  const [telephone, setTelephone] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [codeDev, setCodeDev] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [chargement, setChargement] = useState<boolean>(false);

  const telephoneNettoye = telephone.replace(/\D/g, '').slice(0, 12);
  const codeNettoye = code.replace(/\D/g, '').slice(0, 6);
  const peutDemanderCode = telephoneNettoye.length >= 8;
  const peutVerifierCode = codeNettoye.length === 6;

  const contenuProfil = useMemo(() => {
    if (intention === 'prestataire') {
      return {
        titre: 'Developpez votre activite sur KWIIK',
        sousTitre: 'Creez votre vitrine, publiez vos services et recevez des demandes en ligne.',
        libelleAction: 'Continuer comme prestataire',
      };
    }

    return {
      titre: 'Trouvez un service fiable pres de chez vous',
      sousTitre: 'Reservez rapidement un pro verifie pour vos besoins du quotidien.',
      libelleAction: 'Continuer comme client',
    };
  }, [intention]);

  async function demanderCode(): Promise<void> {
    if (!peutDemanderCode) {
      return;
    }

    setMessage('');
    setChargement(true);

    try {
      const { data } = await api.post<{ codeDev?: string }>('/auth/demande-code', {
        telephone: telephoneNettoye,
      });
      setCodeDev(data.codeDev ?? null);
      setCode('');
      setEtape('code');
    } catch (error: unknown) {
      setMessage(extraireMessageErreur(error, "Erreur lors de l'envoi du code."));
    } finally {
      setChargement(false);
    }
  }

  async function verifierCode(): Promise<void> {
    if (!peutVerifierCode) {
      return;
    }

    setMessage('');
    setChargement(true);

    try {
      const { data } = await api.post<{ token: string }>('/auth/verifie-code', {
        telephone: telephoneNettoye,
        code: codeNettoye,
      });
      localStorage.setItem('kwiik_token', data.token);
      const session = await api.get<SessionAuth>('/auth/moi');
      await onConnecte({
        intention,
        estPrestataire: Boolean(session.data.estPrestataire),
      });
    } catch (error: unknown) {
      setMessage(extraireMessageErreur(error, 'Code incorrect.'));
    } finally {
      setChargement(false);
    }
  }

  return (
    <section className="flex min-h-full flex-col bg-surface-2 text-left">
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

        <div className="relative z-10 mt-8 grid grid-cols-2 gap-2 rounded-[22px] bg-white/12 p-1 ring-1 ring-white/15">
          <button
            className={`rounded-[18px] px-3 py-3 text-sm font-black transition ${
              intention === 'client' ? 'bg-white text-kwiik shadow-sm' : 'text-white/75'
            }`}
            onClick={() => setIntention('client')}
            type="button"
          >
            Client
          </button>
          <button
            className={`rounded-[18px] px-3 py-3 text-sm font-black transition ${
              intention === 'prestataire' ? 'bg-white text-kwiik shadow-sm' : 'text-white/75'
            }`}
            onClick={() => setIntention('prestataire')}
            type="button"
          >
            Prestataire
          </button>
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

          {etape === 'telephone' ? (
            <div>
              <div className="mb-4">
                <p className="m-0 text-lg font-black text-ink">Connexion rapide</p>
                <p className="m-0 mt-1 text-sm leading-5 text-muted">
                  Un code de verification sera envoye sur votre telephone.
                </p>
              </div>

              <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-muted" htmlFor="telephone">
                Numero de telephone
              </label>
              <div className="flex items-center gap-3 rounded-[20px] border border-line bg-surface-1 px-4 py-3 focus-within:border-kwiik focus-within:bg-white">
                <Icone className="h-5 w-5 flex-none text-kwiik" nom="phone" />
                <span className="text-sm font-black text-ink">+237</span>
                <input
                  className="min-w-0 flex-1 border-0 bg-transparent text-base font-bold text-ink outline-none placeholder:text-[#A9A59B]"
                  id="telephone"
                  inputMode="tel"
                  onChange={(event) => setTelephone(event.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="690000000"
                  value={telephoneNettoye}
                />
              </div>

              <button
                className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] bg-ink px-4 text-sm font-black text-white shadow-[0_12px_25px_rgba(26,26,24,0.18)] transition active:scale-[0.99] disabled:bg-[#B8B4AA] disabled:shadow-none"
                disabled={chargement || !peutDemanderCode}
                onClick={() => void demanderCode()}
                type="button"
              >
                {chargement ? 'Envoi en cours...' : contenuProfil.libelleAction}
                <Icone className="h-4 w-4" nom="arrow" />
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-11 w-11 flex-none items-center justify-center rounded-[18px] bg-kwiik-light text-kwiik-dark">
                  <Icone className="h-5 w-5" nom="shield" />
                </div>
                <div>
                  <p className="m-0 text-lg font-black text-ink">Verifier le code</p>
                  <p className="m-0 mt-1 text-sm leading-5 text-muted">Code envoye au +237 {telephoneNettoye}</p>
                </div>
              </div>

              {codeDev && (
                <button
                  className="mb-3 w-full rounded-[16px] bg-warning-soft px-4 py-3 text-left text-xs font-bold leading-5 text-warning-strong"
                  onClick={() => setCode(codeDev)}
                  type="button"
                >
                  Mode dev : code {codeDev}. Toucher pour remplir automatiquement.
                </button>
              )}

              <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-muted" htmlFor="code">
                Code de verification
              </label>
              <input
                className="h-14 w-full rounded-[20px] border border-line bg-surface-1 px-4 text-center text-xl font-black tracking-[0.45em] text-ink outline-none focus:border-kwiik focus:bg-white"
                id="code"
                inputMode="numeric"
                maxLength={6}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                value={codeNettoye}
              />

              <button
                className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] bg-ink px-4 text-sm font-black text-white shadow-[0_12px_25px_rgba(26,26,24,0.18)] transition active:scale-[0.99] disabled:bg-[#B8B4AA] disabled:shadow-none"
                disabled={chargement || !peutVerifierCode}
                onClick={() => void verifierCode()}
                type="button"
              >
                {chargement ? 'Verification...' : 'Se connecter'}
                <Icone className="h-4 w-4" nom="arrow" />
              </button>

              <button
                className="mt-3 w-full rounded-[16px] px-4 py-3 text-sm font-bold text-muted transition hover:bg-surface-1"
                onClick={() => {
                  setEtape('telephone');
                  setCode('');
                  setMessage('');
                }}
                type="button"
              >
                Changer de numero
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
