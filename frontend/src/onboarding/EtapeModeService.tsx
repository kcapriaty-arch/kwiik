import type { DefinitionEtape, EtapeProps, ModeServiceValeur } from './types';

interface OptionModeService {
  valeur: ModeServiceValeur;
  titre: string;
  description: string;
}

const options: OptionModeService[] = [
  { valeur: 'adresse_fixe', titre: 'Adresse fixe', description: 'Les clients viennent a votre boutique ou salon.' },
  { valeur: 'a_domicile', titre: 'A domicile', description: 'Vous vous deplacez chez le client (ex. menage, coiffure a domicile).' },
  { valeur: 'en_ligne', titre: 'En ligne', description: 'Le service se fait entierement a distance.' },
];

function EtapeModeService({ etat, majEtat, suivant, estDerniere, envoi }: EtapeProps) {
  return (
    <div>
      <div className="mb-4">
        <p className="m-0 text-lg font-black text-ink">Mode de service</p>
        <p className="m-0 mt-1 text-sm leading-5 text-muted">Comment vos clients beneficient-ils de vos services ?</p>
      </div>

      <div className="grid gap-3">
        {options.map((option) => {
          const selectionne = etat.modeService === option.valeur;

          return (
            <label
              className={`cursor-pointer rounded-xl border p-4 transition ${
                selectionne ? 'border-kwiik bg-kwiik-light' : 'border-line bg-white'
              }`}
              key={option.valeur}
            >
              <input
                checked={selectionne}
                className="sr-only"
                onChange={() => majEtat({ modeService: option.valeur })}
                type="radio"
              />
              <p className={`m-0 text-sm font-black ${selectionne ? 'text-kwiik-dark' : 'text-ink'}`}>{option.titre}</p>
              <p className="m-0 mt-1 text-xs leading-5 text-muted">{option.description}</p>
            </label>
          );
        })}
      </div>

      {etat.modeService === 'adresse_fixe' && (
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface-1 p-4">
          <input
            checked={etat.proposeLocalAVendreOuLouer}
            className="mt-0.5"
            onChange={(event) => majEtat({ proposeLocalAVendreOuLouer: event.target.checked })}
            type="checkbox"
          />
          <span>
            <span className="block text-sm font-bold text-ink">Je propose aussi un local a vendre ou a louer</span>
            <span className="mt-1 block text-xs leading-5 text-muted">
              Comme un bien affiche a la maniere d'un Airbnb. Une facture d'electricite a votre nom sera demandee en plus.
            </span>
          </span>
        </label>
      )}

      <button
        className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] bg-ink px-4 text-sm font-black text-white shadow-[0_12px_25px_rgba(26,26,24,0.18)] transition active:scale-[0.99] disabled:bg-[#B8B4AA] disabled:shadow-none"
        disabled={!etat.modeService}
        onClick={() => void suivant()}
        type="button"
      >
        {envoi ? 'Envoi...' : estDerniere ? 'Terminer' : 'Continuer'}
      </button>
    </div>
  );
}

export const etapeModeService: DefinitionEtape = {
  id: 'modeService',
  titre: 'Mode de service',
  estApplicable: () => true,
  estComplete: (etat) => Boolean(etat.modeService),
  Composant: EtapeModeService,
};
