import type { IntentionConnexion } from '../Auth';
import { EnteteEcran } from '../ui';

interface ChoixRoleProps {
  onChoisir: (intention: IntentionConnexion) => void;
  onRetour: () => void;
}

interface OptionRole {
  intention: IntentionConnexion;
  titre: string;
  description: string;
}

const options: OptionRole[] = [
  {
    intention: 'client',
    titre: 'Trouver des prestations',
    description: 'Reservez un prestataire fiable pres de chez vous : coiffure, menage, plomberie, et bien plus.',
  },
  {
    intention: 'prestataire',
    titre: 'Devenir prestataire',
    description: 'Publiez votre vitrine, choisissez vos categories et recevez des demandes en ligne.',
  },
];

export function ChoixRole({ onChoisir, onRetour }: ChoixRoleProps) {
  return (
    <section className="flex flex-1 flex-col bg-surface-2 text-left">
      <EnteteEcran onRetour={onRetour} sousTitre="Vous pourrez toujours activer l'autre profil plus tard." titre="Que voulez-vous faire ?" />

      <div className="grid flex-1 gap-4 px-5 py-6">
        {options.map((option) => (
          <button
            className="rounded-[24px] border border-line bg-white p-5 text-left shadow-[0_10px_30px_rgba(26,26,24,0.06)] transition active:scale-[0.99]"
            key={option.intention}
            onClick={() => onChoisir(option.intention)}
            type="button"
          >
            <p className="m-0 text-lg font-black text-ink">{option.titre}</p>
            <p className="m-0 mt-2 text-sm leading-6 text-muted">{option.description}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
