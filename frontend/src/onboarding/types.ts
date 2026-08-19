import type { ReactNode } from 'react';

export type ModeServiceValeur = 'adresse_fixe' | 'a_domicile' | 'en_ligne';

export interface EtatOnboarding {
  nom: string;
  email: string;
  photoProfilUrl: string;
  cniRectoUrl: string;
  cniVersoUrl: string;
  categorieIds: string[];
  licenceRequisePourSelection: boolean;
  modeService: ModeServiceValeur | '';
  proposeLocalAVendreOuLouer: boolean;
  factureElectriciteUrl: string;
  ville: string;
  quartier: string;
  adresse: string;
  telephonePro: string;
  description: string;
  licenceUrl: string;
}

export interface EtapeProps {
  etat: EtatOnboarding;
  majEtat: (partiel: Partial<EtatOnboarding>) => void;
  suivant: () => void | Promise<void>;
  precedent: () => void;
  estPremiere: boolean;
  estDerniere: boolean;
  envoi: boolean;
}

// Registre d'etapes : chaque wizard fournit sa propre liste, filtree/ordonnee
// selon `estApplicable`. Ajouter une etape future (ex. questionnaire immobilier)
// se fait en ajoutant une entree ici, pas en reecrivant le shell du wizard.
export interface DefinitionEtape {
  id: string;
  titre: string;
  estApplicable: (etat: EtatOnboarding) => boolean;
  estComplete: (etat: EtatOnboarding) => boolean;
  Composant: (props: EtapeProps) => ReactNode;
}

export function etatOnboardingInitial(partiel: Partial<EtatOnboarding> = {}): EtatOnboarding {
  return {
    nom: '',
    email: '',
    photoProfilUrl: '',
    cniRectoUrl: '',
    cniVersoUrl: '',
    categorieIds: [],
    licenceRequisePourSelection: false,
    modeService: '',
    proposeLocalAVendreOuLouer: false,
    factureElectriciteUrl: '',
    ville: 'Douala',
    quartier: '',
    adresse: '',
    telephonePro: '',
    description: '',
    licenceUrl: '',
    ...partiel,
  };
}
