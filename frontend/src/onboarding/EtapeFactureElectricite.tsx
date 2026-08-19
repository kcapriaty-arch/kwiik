import { useState, type ChangeEvent } from 'react';
import { uploaderImagePrivee } from '../upload';
import { extraireMessageErreur } from './erreurApi';
import type { DefinitionEtape, EtapeProps } from './types';

function EtapeFactureElectricite({ etat, majEtat, suivant, estDerniere, envoi }: EtapeProps) {
  const [uploadEnCours, setUploadEnCours] = useState<boolean>(false);
  const [erreur, setErreur] = useState<string>('');

  async function envoyerFacture(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const fichier = event.target.files?.[0];

    if (!fichier) {
      return;
    }

    setUploadEnCours(true);
    setErreur('');

    try {
      const url = await uploaderImagePrivee(fichier);
      majEtat({ factureElectriciteUrl: url });
    } catch (error: unknown) {
      setErreur(extraireMessageErreur(error, "Erreur lors de l'envoi de la facture."));
    } finally {
      setUploadEnCours(false);
    }
  }

  return (
    <div>
      <div className="mb-4">
        <p className="m-0 text-lg font-black text-ink">Facture d'electricite</p>
        <p className="m-0 mt-1 text-sm leading-5 text-muted">
          Pour un local propose a la vente ou a la location, une facture d'electricite a votre nom justifie votre lien avec le bien.
        </p>
      </div>

      <label className="grid cursor-pointer place-items-center rounded-xl border border-dashed border-line bg-surface-1 p-4 text-center text-xs font-black text-muted">
        Ajouter la facture
        <input
          accept="image/*"
          capture="environment"
          className="sr-only"
          disabled={uploadEnCours}
          onChange={(event) => void envoyerFacture(event)}
          type="file"
        />
      </label>

      {uploadEnCours && <p className="m-0 mt-3 text-sm text-muted">Envoi en cours...</p>}
      {etat.factureElectriciteUrl && (
        <p className="m-0 mt-3 rounded-xl bg-success-soft p-3 text-center text-xs font-bold text-success-strong">Facture ajoutee</p>
      )}
      {erreur && <p className="m-0 mt-3 rounded-xl bg-danger-soft p-3 text-sm font-semibold text-danger-strong">{erreur}</p>}

      <button
        className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] bg-ink px-4 text-sm font-black text-white shadow-[0_12px_25px_rgba(26,26,24,0.18)] transition active:scale-[0.99] disabled:bg-[#B8B4AA] disabled:shadow-none"
        disabled={!etat.factureElectriciteUrl || uploadEnCours}
        onClick={() => void suivant()}
        type="button"
      >
        {envoi ? 'Envoi...' : estDerniere ? 'Terminer' : 'Continuer'}
      </button>
    </div>
  );
}

export const etapeFactureElectricite: DefinitionEtape = {
  id: 'factureElectricite',
  titre: "Facture d'electricite",
  estApplicable: (etat) => etat.proposeLocalAVendreOuLouer,
  estComplete: (etat) => Boolean(etat.factureElectriciteUrl),
  Composant: EtapeFactureElectricite,
};
