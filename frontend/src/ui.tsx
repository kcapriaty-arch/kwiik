import type { KeyboardEvent, ReactNode } from 'react';

export type BadgeVariant = 'neutral' | 'kwiik' | 'success' | 'warning' | 'danger' | 'amber';

interface EnteteEcranProps {
  titre: string;
  sousTitre?: string;
  onRetour?: () => void;
  action?: ReactNode;
}

interface BadgeProps {
  children: ReactNode;
  variante?: BadgeVariant;
  className?: string;
}

interface CarteProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
}

interface CarteStatProps {
  valeur: ReactNode;
  libelle: string;
  variante?: BadgeVariant;
}

interface EtatVideProps {
  titre: string;
  message: string;
  action?: ReactNode;
}

const variantesBadge: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-1 text-muted',
  kwiik: 'bg-kwiik-light text-kwiik-dark',
  success: 'bg-success-soft text-success-strong',
  warning: 'bg-warning-soft text-warning-strong',
  danger: 'bg-danger-soft text-danger-strong',
  amber: 'bg-warning-soft text-amber-star',
};

const variantesStat: Record<BadgeVariant, string> = {
  neutral: 'text-ink',
  kwiik: 'text-kwiik',
  success: 'text-success-strong',
  warning: 'text-warning-strong',
  danger: 'text-danger-strong',
  amber: 'text-amber-star',
};

export function initialesDepuisNom(valeur: string | null | undefined, fallback = 'KW'): string {
  const texte = valeur?.trim();

  if (!texte) {
    return fallback;
  }

  const morceaux = texte.split(/\s+/).filter(Boolean);
  const initiales = morceaux.slice(0, 2).map((morceau: string) => morceau[0]?.toUpperCase()).join('');

  return initiales || fallback;
}

export function EnteteEcran({ titre, sousTitre, onRetour, action }: EnteteEcranProps) {
  return (
    <header className="border-b border-line bg-surface-1 px-5 py-4 text-left">
      <div className="flex items-center gap-3">
        {onRetour && (
          <button
            aria-label="Retour"
            className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white text-ink ring-1 ring-line transition active:scale-[0.98]"
            onClick={onRetour}
            type="button"
          >
            {'<'}
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="m-0 truncate text-lg font-semibold tracking-normal text-ink">{titre}</h1>
          {sousTitre && <p className="m-0 mt-1 text-xs leading-5 text-muted">{sousTitre}</p>}
        </div>
        {action && <div className="flex-none">{action}</div>}
      </div>
    </header>
  );
}

export function Badge({ children, variante = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${variantesBadge[variante]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Carte({ children, className = '', onClick, ariaLabel }: CarteProps) {
  function gererClavier(event: KeyboardEvent<HTMLElement>): void {
    if (!onClick) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  }

  const interactive = Boolean(onClick);

  return (
    <article
      aria-label={ariaLabel}
      className={`rounded-xl border border-line bg-white p-3 ${interactive ? 'cursor-pointer transition active:scale-[0.99]' : ''} ${className}`}
      onClick={onClick}
      onKeyDown={gererClavier}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      {children}
    </article>
  );
}

export function CarteStat({ valeur, libelle, variante = 'neutral' }: CarteStatProps) {
  return (
    <div className="rounded-xl bg-surface-1 p-3 text-center">
      <div className={`text-lg font-semibold ${variantesStat[variante]}`}>{valeur}</div>
      <div className="text-[11px] text-[#9A988F]">{libelle}</div>
    </div>
  );
}

export function EtatVide({ titre, message, action }: EtatVideProps) {
  return (
    <div className="rounded-xl bg-surface-1 p-4 text-left">
      <h2 className="m-0 text-sm font-semibold tracking-normal text-ink">{titre}</h2>
      <p className="m-0 mt-1 text-sm leading-6 text-muted">{message}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}