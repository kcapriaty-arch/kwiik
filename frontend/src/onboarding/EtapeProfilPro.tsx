import type { DefinitionEtape, EtapeProps } from './types';

const champClasse =
  'w-full rounded-xl border border-line bg-surface-1 px-3 py-3 text-sm text-ink outline-none transition placeholder:text-[#9A988F] focus:border-kwiik focus:bg-white';
const libelleClasse = 'grid gap-1.5 text-xs font-semibold text-muted';

function EtapeProfilPro({ etat, majEtat, suivant, estDerniere, envoi }: EtapeProps) {
  const adresseRequise = etat.modeService === 'adresse_fixe';
  const peutContinuer = etat.ville.trim().length >= 2 && (!adresseRequise || etat.adresse.trim().length >= 2);

  return (
    <div>
      <div className="mb-4">
        <p className="m-0 text-lg font-black text-ink">Votre profil professionnel</p>
        <p className="m-0 mt-1 text-sm leading-5 text-muted">Ces informations aident les clients a vous retrouver.</p>
      </div>

      <div className="grid gap-3">
        <label className={libelleClasse}>
          Ville
          <input
            className={champClasse}
            onChange={(event) => majEtat({ ville: event.target.value })}
            placeholder="Douala, Yaounde..."
            value={etat.ville}
          />
        </label>

        <label className={libelleClasse}>
          Quartier
          <input
            className={champClasse}
            onChange={(event) => majEtat({ quartier: event.target.value })}
            placeholder="Bonamoussadi, Bastos..."
            value={etat.quartier}
          />
        </label>

        <label className={libelleClasse}>
          Adresse de la boutique{etat.modeService === 'adresse_fixe' ? '' : ' (optionnel)'}
          <input
            className={champClasse}
            onChange={(event) => majEtat({ adresse: event.target.value })}
            placeholder="Adresse precise du lieu"
            value={etat.adresse}
          />
        </label>

        <label className={libelleClasse}>
          Telephone professionnel
          <input
            className={champClasse}
            onChange={(event) => majEtat({ telephonePro: event.target.value })}
            placeholder="Ex. 690000000"
            value={etat.telephonePro}
          />
        </label>

        <label className={libelleClasse}>
          Description (optionnel)
          <textarea
            className={`${champClasse} min-h-28 resize-y`}
            onChange={(event) => majEtat({ description: event.target.value })}
            placeholder="Presentez votre activite, vos services et votre zone d'intervention."
            rows={5}
            value={etat.description}
          />
        </label>
      </div>

      <button
        className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] bg-ink px-4 text-sm font-black text-white shadow-[0_12px_25px_rgba(26,26,24,0.18)] transition active:scale-[0.99] disabled:bg-[#B8B4AA] disabled:shadow-none"
        disabled={!peutContinuer}
        onClick={() => void suivant()}
        type="button"
      >
        {envoi ? 'Envoi...' : estDerniere ? 'Terminer' : 'Continuer'}
      </button>
    </div>
  );
}

export const etapeProfilPro: DefinitionEtape = {
  id: 'profilPro',
  titre: 'Profil professionnel',
  estApplicable: () => true,
  estComplete: (etat) =>
    etat.ville.trim().length >= 2 && (etat.modeService !== 'adresse_fixe' || etat.adresse.trim().length >= 2),
  Composant: EtapeProfilPro,
};
