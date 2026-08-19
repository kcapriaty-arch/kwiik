import { useEffect, useState } from 'react';
import { api } from '../api';
import { useSession } from '../session';
import { OnboardingWizard } from './OnboardingWizard';
import { etapeCni } from './etapesPartagees';
import { etapeCategories } from './EtapeCategories';
import { etapeModeService } from './EtapeModeService';
import { etapeLicence } from './EtapeLicence';
import { etapeFactureElectricite } from './EtapeFactureElectricite';
import { etapeProfilPro } from './EtapeProfilPro';
import { etatOnboardingInitial, type EtatOnboarding, type ModeServiceValeur } from './types';

interface OnboardingPrestataireProps {
  onTermine: () => void | Promise<void>;
}

interface CategorieExistante {
  id: string;
  licenceRequise: boolean;
}

interface PrestataireExistant {
  categories: CategorieExistante[];
  ville: string;
  quartier?: string | null;
  adresse?: string | null;
  description?: string | null;
  modeService?: ModeServiceValeur | null;
  licenceUrl?: string | null;
  proposeLocalAVendreOuLouer?: boolean;
  factureElectriciteUrl?: string | null;
  profilPrive?: { telephonePro?: string | null } | null;
}

// Ordre : la boutique (prestations + mode de service) determine d'abord quels
// documents sont demandes, puis on les collecte (CNI toujours, licence et
// facture d'electricite selon le cas), enfin le profil professionnel.
const etapes = [
  etapeCategories,
  etapeModeService,
  etapeCni,
  etapeLicence,
  etapeFactureElectricite,
  etapeProfilPro,
];

export function OnboardingPrestataire({ onTermine }: OnboardingPrestataireProps) {
  const { utilisateur } = useSession();
  const [etatInitial, setEtatInitial] = useState<EtatOnboarding | null>(null);
  const [dejaPrestataire, setDejaPrestataire] = useState<boolean>(false);

  useEffect(() => {
    async function charger(): Promise<void> {
      const base = etatOnboardingInitial({
        nom: utilisateur?.nom ?? '',
        email: utilisateur?.email ?? '',
        photoProfilUrl: utilisateur?.photoProfilUrl ?? '',
        cniRectoUrl: utilisateur?.cniRectoUrl ?? '',
        cniVersoUrl: utilisateur?.cniVersoUrl ?? '',
        telephonePro: utilisateur?.telephone ?? '',
      });

      try {
        const { data } = await api.get<PrestataireExistant>('/prestataires/moi');
        setDejaPrestataire(true);
        setEtatInitial({
          ...base,
          categorieIds: data.categories.map((c) => c.id),
          licenceRequisePourSelection: data.categories.some((c) => c.licenceRequise),
          ville: data.ville || base.ville,
          quartier: data.quartier ?? '',
          adresse: data.adresse ?? '',
          description: data.description ?? '',
          telephonePro: data.profilPrive?.telephonePro ?? base.telephonePro,
          modeService: data.modeService ?? '',
          licenceUrl: data.licenceUrl ?? '',
          proposeLocalAVendreOuLouer: data.proposeLocalAVendreOuLouer ?? false,
          factureElectriciteUrl: data.factureElectriciteUrl ?? '',
        });
      } catch {
        setDejaPrestataire(false);
        setEtatInitial(base);
      }
    }

    void charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ne recharge pas a chaque frappe de utilisateur
  }, []);

  async function terminer(etat: EtatOnboarding): Promise<void> {
    const donneesVitrine = {
      categorieIds: etat.categorieIds,
      modeService: etat.modeService || undefined,
      ville: etat.ville.trim(),
      quartier: etat.quartier.trim() || undefined,
      adresse: etat.adresse.trim() || undefined,
      description: etat.description.trim() || undefined,
      licenceUrl: etat.licenceUrl || undefined,
      proposeLocalAVendreOuLouer: etat.proposeLocalAVendreOuLouer,
      factureElectriciteUrl: etat.factureElectriciteUrl || undefined,
    };
    const telephonePro = etat.telephonePro.trim() || undefined;

    if (dejaPrestataire) {
      await api.patch('/prestataires/moi', { ...donneesVitrine, telephonePro });
    } else {
      await api.post('/prestataires', donneesVitrine);

      if (telephonePro) {
        await api.patch('/prestataires/moi', { telephonePro });
      }
    }

    await api.patch('/utilisateurs/moi', {
      cniRectoUrl: etat.cniRectoUrl || undefined,
      cniVersoUrl: etat.cniVersoUrl || undefined,
    });

    await onTermine();
  }

  if (!etatInitial) {
    return (
      <div className="flex flex-1 items-center justify-center bg-surface-2 px-5 text-sm text-muted">
        Chargement...
      </div>
    );
  }

  return (
    <OnboardingWizard etapes={etapes} etatInitial={etatInitial} onTermine={terminer} titre="Devenir prestataire" />
  );
}
