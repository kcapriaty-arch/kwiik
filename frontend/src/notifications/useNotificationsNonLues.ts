import { useEffect, useState } from 'react';
import { api } from '../api';

interface NotificationLegere {
  lu: boolean;
}

// Sondage simple (pas de WebSocket dans cette app) : suffisant pour un badge
// de compteur qui n'a pas besoin d'etre instantane.
const INTERVALLE_MS = 20000;

export function useNotificationsNonLues(): number {
  const [nonLues, setNonLues] = useState<number>(0);

  useEffect(() => {
    let annule = false;

    async function charger(): Promise<void> {
      try {
        const { data } = await api.get<NotificationLegere[]>('/notifications');
        if (!annule) {
          setNonLues(data.filter((n) => !n.lu).length);
        }
      } catch {
        // Echec silencieux : un badge de notification qui ne se met pas a jour
        // ne doit jamais bloquer l'ecran qui l'affiche.
      }
    }

    charger();
    const intervalle = setInterval(charger, INTERVALLE_MS);

    return () => {
      annule = true;
      clearInterval(intervalle);
    };
  }, []);

  return nonLues;
}
