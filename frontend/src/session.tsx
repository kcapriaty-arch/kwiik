import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { api } from './api';

export interface UtilisateurSession {
  id: string;
  nom: string;
  telephone: string | null;
  email: string | null;
  emailConfirme: boolean;
  creeLe: string;
  photoProfilUrl: string | null;
  cniRectoUrl: string | null;
  cniVersoUrl: string | null;
  estPrestataire: boolean;
  identiteComplete: boolean;
  prestataireOnboardingComplete: boolean;
}

interface SessionContextValue {
  utilisateur: UtilisateurSession | null;
  estPrestataire: boolean;
  chargement: boolean;
  recharger: () => Promise<void>;
  deconnexion: () => void;
}

interface SessionProviderProps {
  children: ReactNode;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: SessionProviderProps) {
  const [utilisateur, setUtilisateur] = useState<UtilisateurSession | null>(null);
  const [chargement, setChargement] = useState<boolean>(true);
  // Seul le tout premier chargement doit afficher l'ecran plein ecran "Chargement
  // de la session..." : un recharger() ulterieur (ex. apres avoir enregistre un
  // champ de profil) ne doit pas demonter/remonter l'ecran affiche, sous peine de
  // perdre l'etat local de ses composants (message de succes, etc.).
  const aDejaCharge = useRef(false);

  const recharger = useCallback(async (): Promise<void> => {
    const token = localStorage.getItem('kwiik_token');

    if (!token) {
      setUtilisateur(null);
      setChargement(false);
      aDejaCharge.current = true;
      return;
    }

    if (!aDejaCharge.current) {
      setChargement(true);
    }

    try {
      const { data } = await api.get<UtilisateurSession>('/auth/moi');
      setUtilisateur(data);
    } catch {
      localStorage.removeItem('kwiik_token');
      setUtilisateur(null);
    } finally {
      setChargement(false);
      aDejaCharge.current = true;
    }
  }, []);

  const deconnexion = useCallback((): void => {
    localStorage.removeItem('kwiik_token');
    setUtilisateur(null);
    setChargement(false);
  }, []);

  useEffect(() => {
    recharger();
  }, [recharger]);

  const valeur = useMemo<SessionContextValue>(
    () => ({
      utilisateur,
      estPrestataire: Boolean(utilisateur?.estPrestataire),
      chargement,
      recharger,
      deconnexion,
    }),
    [chargement, deconnexion, recharger, utilisateur],
  );

  return <SessionContext.Provider value={valeur}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const contexte = useContext(SessionContext);

  if (!contexte) {
    throw new Error('useSession doit être utilisé dans SessionProvider.');
  }

  return contexte;
}