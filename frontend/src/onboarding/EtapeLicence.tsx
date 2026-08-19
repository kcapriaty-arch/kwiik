import { useState, type ChangeEvent } from 'react';
import { uploaderImagePrivee } from '../upload';
import { extraireMessageErreur } from './erreurApi';
import type { DefinitionEtape, EtapeProps } from './types';

function EtapeLicence({ etat, majEtat, suivant, estDerniere, envoi }: EtapeProps) {
  const [uploadEnCours, setUploadEnCours] = useState<boolean>(false);
  const [erreur, setErreur] = useState<string>('');

  async function envoyerLicence(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const fichier = event.target.files?.[0];

    if (!fichier) {
      return;
    }

    setUploadEnCours(true);
    setErreur('');

    try {
      const url = await uploaderImagePrivee(fichier);
      majEtat({ licenceUrl: url });
    } catch (error: unknown) {
      setErreur(extraireMessageErreur(error, "Erreur lors de l'envoi de la licence."));
    } finally {
      setUploadEnCours(false);
    }
  }

  return (
    <div>
      <div className="mb-4">
        <p className="m-0 text-lg font-black text-ink">Licence professionnelle</p>
        <p className="m-0 mt-1 text-sm leading-5 text-muted">
          Une des categories choisies exige une licence ou une certification. Ajoutez un justificatif.
        </p>
      </div>

      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface-1 px-4 py-4 text-sm font-black text-ink">
        Ajouter ma licence / certification
        <input
          accept="image/*"
          capture="environment"
          className="sr-only"
          disabled={uploadEnCours}
          onChange={(event) => void envoyerLicence(event)}
          type="file"
        />
      </label>

      {uploadEnCours && <p className="m-0 mt-3 text-sm text-muted">Envoi en cours...</p>}
      {etat.licenceUrl && (
        <p className="m-0 mt-3 rounded-xl bg-success-soft p-3 text-sm font-semibold text-success-strong">Licence ajoutee.</p>
      )}
      {erreur && <p className="m-0 mt-3 rounded-xl bg-danger-soft p-3 text-sm font-semibold text-danger-strong">{erreur}</p>}

      <button
        className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] bg-ink px-4 text-sm font-black text-white shadow-[0_12px_25px_rgba(26,26,24,0.18)] transition active:scale-[0.99] disabled:bg-[#B8B4AA] disabled:shadow-none"
        disabled={!etat.licenceUrl || uploadEnCours}
        onClick={() => void suivant()}
        type="button"
      >
        {envoi ? 'Envoi...' : estDerniere ? 'Terminer' : 'Continuer'}
      </button>
    </div>
  );
}

export const etapeLicence: DefinitionEtape = {
  id: 'licence',
  titre: 'Licence',
  estApplicable: (etat) => etat.licenceRequisePourSelection,
  estComplete: (etat) => Boolean(etat.licenceUrl),
  Composant: EtapeLicence,
};
