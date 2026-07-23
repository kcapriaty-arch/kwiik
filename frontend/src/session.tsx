import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from './api';

export interface UtilisateurSession {
  id: string;
  nom: string;
  telephone: string;
  estPrestataire: boolean;
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

  const recharger = useCallback(async (): Promise<void> => {
    const token = localStorage.getItem('kwiik_token');

    if (!token) {
      setUtilisateur(null);
      setChargement(false);
      return;
    }

    setChargement(true);

    try {
      const { data } = await api.get<UtilisateurSession>('/auth/moi');
      setUtilisateur(data);
    } catch {
      localStorage.removeItem('kwiik_token');
      setUtilisateur(null);
    } finally {
      setChargement(false);
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