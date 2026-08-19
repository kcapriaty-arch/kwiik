import { useEffect, useState } from 'react';
import { api } from '../api';
import { EnteteEcran, EtatVide } from '../ui';

interface NotificationsProps {
  onRetour: () => void;
}

interface NotificationItem {
  id: string;
  type: 'reservation' | 'message' | 'systeme';
  titre: string;
  corps: string;
  lu: boolean;
  creeLe: string;
}

const formatteurDate = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function Notifications({ onRetour }: NotificationsProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [chargement, setChargement] = useState<boolean>(true);
  const [erreur, setErreur] = useState<string>('');

  async function charger(): Promise<void> {
    setChargement(true);
    setErreur('');

    try {
      const { data } = await api.get<NotificationItem[]>('/notifications');
      setNotifications(data);
    } catch {
      setErreur('Impossible de charger les notifications.');
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    charger();
  }, []);

  async function marquerLue(notification: NotificationItem): Promise<void> {
    if (notification.lu) {
      return;
    }

    setNotifications((liste) =>
      liste.map((n) => (n.id === notification.id ? { ...n, lu: true } : n)),
    );

    try {
      await api.patch(`/notifications/${notification.id}/lu`);
    } catch {
      await charger();
    }
  }

  async function toutMarquerLu(): Promise<void> {
    setNotifications((liste) => liste.map((n) => ({ ...n, lu: true })));

    try {
      await api.post('/notifications/tout-lire');
    } catch {
      await charger();
    }
  }

  const nombreNonLues = notifications.filter((n) => !n.lu).length;

  return (
    <section className="min-h-full bg-surface-0 text-left text-ink">
      <EnteteEcran
        action={
          nombreNonLues > 0 ? (
            <button className="text-xs font-bold text-kwiik" onClick={() => void toutMarquerLu()} type="button">
              Tout marquer lu
            </button>
          ) : undefined
        }
        onRetour={onRetour}
        sousTitre={nombreNonLues > 0 ? `${nombreNonLues} non lue${nombreNonLues > 1 ? 's' : ''}` : 'Vous etes a jour'}
        titre="Notifications"
      />

      <div className="px-5 py-4">
        {chargement && <p className="m-0 text-sm text-muted">Chargement...</p>}
        {erreur && <p className="m-0 rounded-xl bg-danger-soft p-3 text-sm font-semibold text-danger-strong">{erreur}</p>}

        {!chargement && !erreur && notifications.length === 0 && (
          <EtatVide message="Vous serez notifie ici des mises a jour de vos reservations et de vos messages." titre="Aucune notification" />
        )}

        {!chargement && notifications.length > 0 && (
          <div className="grid gap-2">
            {notifications.map((notification) => (
              <button
                className={`rounded-xl border p-3 text-left transition ${notification.lu ? 'border-line bg-white' : 'border-kwiik/30 bg-kwiik-light'}`}
                key={notification.id}
                onClick={() => void marquerLue(notification)}
                type="button"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="m-0 text-sm font-bold text-ink">{notification.titre}</p>
                  {!notification.lu && <span className="mt-1 h-2 w-2 flex-none rounded-full bg-kwiik" />}
                </div>
                <p className="m-0 mt-1 text-xs leading-5 text-muted">{notification.corps}</p>
                <p className="m-0 mt-2 text-[11px] font-semibold text-muted">{formatteurDate.format(new Date(notification.creeLe))}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
