import { useMemo, useState } from 'react';
import { EnteteEcran } from '../ui';
import { extraireMessageErreur } from './erreurApi';
import type { DefinitionEtape, EtatOnboarding } from './types';

interface OnboardingWizardProps {
  titre: string;
  etapes: DefinitionEtape[];
  etatInitial: EtatOnboarding;
  onTermine: (etat: EtatOnboarding) => Promise<void>;
}

interface ProgressionEtapesProps {
  total: number;
  actuel: number;
}

function ProgressionEtapes({ total, actuel }: ProgressionEtapesProps) {
  return (
    <div className="flex items-center gap-1.5 px-5 pt-3" role="progressbar" aria-valuenow={actuel + 1} aria-valuemin={1} aria-valuemax={total}>
      {Array.from({ length: total }, (_, i) => i).map((i) => (
        <span
          className={`h-1.5 flex-1 rounded-full transition-colors ${i <= actuel ? 'bg-kwiik' : 'bg-surface-1'}`}
          key={i}
        />
      ))}
    </div>
  );
}

export function OnboardingWizard({ titre, etapes, etatInitial, onTermine }: OnboardingWizardProps) {
  const [etat, setEtat] = useState<EtatOnboarding>(etatInitial);
  const [envoi, setEnvoi] = useState<boolean>(false);
  const [erreur, setErreur] = useState<string>('');

  const etapesApplicables = useMemo(
    () => etapes.filter((etape) => etape.estApplicable(etat)),
    [etapes, etat],
  );

  const [index, setIndex] = useState<number>(() => {
    const premierIncomplet = etapes
      .filter((etape) => etape.estApplicable(etatInitial))
      .findIndex((etape) => !etape.estComplete(etatInitial));
    return premierIncomplet === -1 ? 0 : premierIncomplet;
  });

  const indexBorne = Math.min(index, Math.max(etapesApplicables.length - 1, 0));
  const etapeCourante = etapesApplicables[indexBorne];
  const estDerniere = indexBorne === etapesApplicables.length - 1;

  function majEtat(partiel: Partial<EtatOnboarding>): void {
    setEtat((precedent) => ({ ...precedent, ...partiel }));
  }

  function precedent(): void {
    setErreur('');
    setIndex((i) => Math.max(0, i - 1));
  }

  async function suivant(): Promise<void> {
    setErreur('');

    if (estDerniere) {
      setEnvoi(true);

      try {
        await onTermine(etat);
      } catch (error: unknown) {
        setErreur(extraireMessageErreur(error, "Une erreur est survenue, reessayez."));
      } finally {
        setEnvoi(false);
      }

      return;
    }

    setIndex((i) => i + 1);
  }

  if (!etapeCourante) {
    return null;
  }

  const Composant = etapeCourante.Composant;

  return (
    <section className="flex flex-1 flex-col bg-surface-2 text-left">
      <EnteteEcran onRetour={indexBorne > 0 ? precedent : undefined} sousTitre={etapeCourante.titre} titre={titre} />
      <ProgressionEtapes actuel={indexBorne} total={etapesApplicables.length} />

      <div className="flex-1 px-5 py-5">
        <Composant
          envoi={envoi}
          estDerniere={estDerniere}
          estPremiere={indexBorne === 0}
          etat={etat}
          majEtat={majEtat}
          precedent={precedent}
          suivant={suivant}
        />

        {erreur && (
          <p className="m-0 mt-4 rounded-[16px] bg-danger-soft px-4 py-3 text-sm font-bold leading-5 text-danger-strong">
            {erreur}
          </p>
        )}
      </div>
    </section>
  );
}
