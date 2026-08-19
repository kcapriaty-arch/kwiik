import { useState, type ChangeEvent } from 'react';
import { uploaderImagePrivee } from '../upload';
import { extraireMessageErreur } from './erreurApi';
import type { DefinitionEtape, EtapeProps } from './types';

const boutonClasse =
  'mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] bg-ink px-4 text-sm font-black text-white shadow-[0_12px_25px_rgba(26,26,24,0.18)] transition active:scale-[0.99] disabled:bg-[#B8B4AA] disabled:shadow-none';

function libelleBouton(estDerniere: boolean, envoi: boolean, texteEnvoi: string, texteDefaut: string): string {
  if (envoi) {
    return texteEnvoi;
  }

  return estDerniere ? 'Terminer' : texteDefaut;
}

function EtapeCni({ etat, majEtat, suivant, estDerniere, envoi }: EtapeProps) {
  const [uploadEnCours, setUploadEnCours] = useState<string>('');
  const [erreur, setErreur] = useState<string>('');

  const cniComplete = Boolean(etat.cniRectoUrl && etat.cniVersoUrl);

  async function envoyerCni(event: ChangeEvent<HTMLInputElement>, cote: 'recto' | 'verso'): Promise<void> {
    const fichier = event.target.files?.[0];

    if (!fichier) {
      return;
    }

    setUploadEnCours(cote);
    setErreur('');

    try {
      const url = await uploaderImagePrivee(fichier);
      majEtat(cote === 'recto' ? { cniRectoUrl: url } : { cniVersoUrl: url });
    } catch (error: unknown) {
      setErreur(extraireMessageErreur(error, "Erreur lors de l'envoi de la CNI."));
    } finally {
      setUploadEnCours('');
    }
  }

  return (
    <div>
      <div className="mb-4">
        <p className="m-0 text-lg font-black text-ink">Piece d'identite</p>
        <p className="m-0 mt-1 text-sm leading-5 text-muted">
          Une CNI camerounaise valide (recto et verso) est necessaire pour publier votre vitrine prestataire.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="grid cursor-pointer place-items-center rounded-xl border border-dashed border-line bg-surface-1 p-4 text-center text-xs font-black text-muted">
          Recto CNI
          <input
            accept="image/*"
            capture="environment"
            className="sr-only"
            disabled={Boolean(uploadEnCours)}
            onChange={(event) => void envoyerCni(event, 'recto')}
            type="file"
          />
        </label>
        <label className="grid cursor-pointer place-items-center rounded-xl border border-dashed border-line bg-surface-1 p-4 text-center text-xs font-black text-muted">
          Verso CNI
          <input
            accept="image/*"
            capture="environment"
            className="sr-only"
            disabled={Boolean(uploadEnCours)}
            onChange={(event) => void envoyerCni(event, 'verso')}
            type="file"
          />
        </label>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {etat.cniRectoUrl && (
          <p className="m-0 rounded-xl bg-success-soft p-3 text-center text-xs font-bold text-success-strong">Recto ajoute</p>
        )}
        {etat.cniVersoUrl && (
          <p className="m-0 rounded-xl bg-success-soft p-3 text-center text-xs font-bold text-success-strong">Verso ajoute</p>
        )}
      </div>

      {uploadEnCours && <p className="m-0 mt-3 text-sm text-muted">Envoi en cours...</p>}
      {erreur && <p className="m-0 mt-3 rounded-xl bg-danger-soft p-3 text-sm font-semibold text-danger-strong">{erreur}</p>}

      <button
        className={boutonClasse}
        disabled={!cniComplete || Boolean(uploadEnCours)}
        onClick={() => void suivant()}
        type="button"
      >
        {libelleBouton(estDerniere, envoi, 'Envoi...', 'Continuer')}
      </button>
    </div>
  );
}

export const etapeCni: DefinitionEtape = {
  id: 'cni',
  titre: "Piece d'identite",
  estApplicable: () => true,
  estComplete: (etat) => Boolean(etat.cniRectoUrl && etat.cniVersoUrl),
  Composant: EtapeCni,
};
