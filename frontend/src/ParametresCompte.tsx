import { useState, type ChangeEvent } from 'react';
import type { AxiosError } from 'axios';
import { api, urlImage } from './api';
import { useSession } from './session';
import { uploaderImage } from './upload';
import { EnteteEcran, initialesDepuisNom } from './ui';

interface ParametresCompteProps {
  onRetour: () => void;
}

interface ApiErreur {
  message?: string | string[];
}

function extraireMessageErreur(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<ApiErreur>;
  const message = axiosError.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(' ');
  }

  return message ?? fallback;
}

export function ParametresCompte({ onRetour }: ParametresCompteProps) {
  const { utilisateur, recharger } = useSession();
  const [telephone, setTelephone] = useState<string>(utilisateur?.telephone ?? '');
  const [enregistrementTelephone, setEnregistrementTelephone] = useState<boolean>(false);
  const [messageTelephone, setMessageTelephone] = useState<string>('');

  const [uploadPhotoEnCours, setUploadPhotoEnCours] = useState<boolean>(false);
  const [erreurPhoto, setErreurPhoto] = useState<string>('');

  const [codeDev, setCodeDev] = useState<string | null>(null);
  const [code, setCode] = useState<string>('');
  const [envoiCode, setEnvoiCode] = useState<boolean>(false);
  const [confirmationCode, setConfirmationCode] = useState<boolean>(false);
  const [messageEmail, setMessageEmail] = useState<string>('');

  const nomAffiche = utilisateur?.nom?.trim() || 'Utilisateur KWIIK';
  const initiales = initialesDepuisNom(utilisateur?.nom, 'KW');
  const telephoneNettoye = telephone.replace(/\D/g, '').slice(0, 15);
  const peutEnregistrerTelephone = telephoneNettoye.length >= 8 && telephoneNettoye !== (utilisateur?.telephone ?? '');

  async function choisirPhoto(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const fichier = event.target.files?.[0];
    if (!fichier) {
      return;
    }

    setUploadPhotoEnCours(true);
    setErreurPhoto('');

    try {
      const url = await uploaderImage(fichier);
      await api.patch('/utilisateurs/moi', { photoProfilUrl: url });
      await recharger();
    } catch (error: unknown) {
      setErreurPhoto(extraireMessageErreur(error, "Erreur lors de l'envoi de la photo."));
    } finally {
      setUploadPhotoEnCours(false);
    }
  }

  async function enregistrerTelephone(): Promise<void> {
    if (!peutEnregistrerTelephone) {
      return;
    }

    setEnregistrementTelephone(true);
    setMessageTelephone('');

    try {
      await api.patch('/utilisateurs/moi', { telephone: telephoneNettoye });
      await recharger();
      setMessageTelephone('Numero enregistre.');
    } catch (error: unknown) {
      setMessageTelephone(extraireMessageErreur(error, "Erreur lors de l'enregistrement."));
    } finally {
      setEnregistrementTelephone(false);
    }
  }

  async function demanderConfirmationEmail(): Promise<void> {
    setEnvoiCode(true);
    setMessageEmail('');

    try {
      const { data } = await api.post<{ codeDev?: string }>('/auth/email/demande-confirmation');
      setCodeDev(data.codeDev ?? null);
      setCode('');
    } catch (error: unknown) {
      setMessageEmail(extraireMessageErreur(error, "Erreur lors de l'envoi du code."));
    } finally {
      setEnvoiCode(false);
    }
  }

  async function confirmerEmail(): Promise<void> {
    if (code.replace(/\D/g, '').length !== 6) {
      return;
    }

    setConfirmationCode(true);
    setMessageEmail('');

    try {
      await api.post('/auth/email/confirme', { code: code.replace(/\D/g, '') });
      await recharger();
      setCodeDev(null);
      setCode('');
      setMessageEmail('Email confirme.');
    } catch (error: unknown) {
      setMessageEmail(extraireMessageErreur(error, 'Code incorrect.'));
    } finally {
      setConfirmationCode(false);
    }
  }

  return (
    <section className="min-h-full bg-surface-2 text-left text-ink">
      <EnteteEcran onRetour={onRetour} sousTitre="Photo, telephone et confirmation d'email" titre="Parametres du compte" />

      <div className="grid gap-5 px-5 py-5">
        <div className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4">
          <div className="relative h-16 w-16 flex-none overflow-hidden rounded-full border border-line bg-surface-1 text-lg font-semibold text-ink">
            {utilisateur?.photoProfilUrl ? (
              <img alt="" className="h-full w-full object-cover" src={urlImage(utilisateur.photoProfilUrl)} />
            ) : (
              <span className="flex h-full w-full items-center justify-center">{initiales}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-sm font-semibold text-ink">{nomAffiche}</p>
            <p className="m-0 mt-0.5 truncate text-xs text-muted">{utilisateur?.email}</p>
            <label className="mt-2 inline-flex cursor-pointer items-center text-xs font-semibold text-kwiik">
              {uploadPhotoEnCours ? 'Envoi en cours...' : 'Changer la photo'}
              <input
                accept="image/*"
                capture="user"
                className="sr-only"
                disabled={uploadPhotoEnCours}
                onChange={(event) => void choisirPhoto(event)}
                type="file"
              />
            </label>
          </div>
        </div>
        {erreurPhoto && <p className="m-0 -mt-3 text-xs font-semibold text-danger-strong">{erreurPhoto}</p>}

        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="m-0 text-sm font-semibold text-ink">Numero de telephone</p>
          <p className="m-0 mt-1 text-xs leading-5 text-muted">Optionnel. Utile pour que les prestataires puissent vous joindre.</p>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-surface-1 px-3 py-2.5">
            <span className="text-sm font-semibold text-muted">+237</span>
            <input
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink outline-none"
              inputMode="tel"
              onChange={(event) => setTelephone(event.target.value.replace(/\D/g, '').slice(0, 15))}
              placeholder="690000000"
              value={telephoneNettoye}
            />
          </div>
          <button
            className="mt-3 h-10 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition active:scale-[0.98] disabled:bg-[#B8B4AA]"
            disabled={!peutEnregistrerTelephone || enregistrementTelephone}
            onClick={() => void enregistrerTelephone()}
            type="button"
          >
            {enregistrementTelephone ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          {messageTelephone && <p className="m-0 mt-2 text-xs font-semibold text-muted">{messageTelephone}</p>}
        </div>

        <div className="rounded-2xl border border-line bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="m-0 text-sm font-semibold text-ink">Confirmation d'email</p>
            <span className={`rounded-md px-2 py-1 text-[11px] font-medium ${utilisateur?.emailConfirme ? 'bg-success-soft text-success-strong' : 'bg-warning-soft text-warning-strong'}`}>
              {utilisateur?.emailConfirme ? 'Confirme' : 'Non confirme'}
            </span>
          </div>
          <p className="m-0 mt-1 text-xs leading-5 text-muted">
            Confirmez votre email pour recevoir les notifications importantes de vos reservations.
          </p>

          {!utilisateur?.emailConfirme && (
            <div className="mt-3">
              {!codeDev ? (
                <button
                  className="h-10 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition active:scale-[0.98] disabled:bg-[#B8B4AA]"
                  disabled={envoiCode}
                  onClick={() => void demanderConfirmationEmail()}
                  type="button"
                >
                  {envoiCode ? 'Envoi...' : 'Envoyer un code de confirmation'}
                </button>
              ) : (
                <div>
                  <button
                    className="mb-3 w-full rounded-xl bg-warning-soft px-4 py-3 text-left text-xs font-semibold leading-5 text-warning-strong"
                    onClick={() => setCode(codeDev)}
                    type="button"
                  >
                    Mode dev : code {codeDev}. Toucher pour remplir automatiquement.
                  </button>
                  <div className="flex items-center gap-2">
                    <input
                      className="h-11 w-32 rounded-xl border border-line bg-surface-1 px-3 text-center text-lg font-bold tracking-[0.3em] text-ink outline-none focus:border-kwiik"
                      inputMode="numeric"
                      maxLength={6}
                      onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      value={code}
                    />
                    <button
                      className="h-11 flex-1 rounded-xl bg-ink text-sm font-semibold text-white transition active:scale-[0.98] disabled:bg-[#B8B4AA]"
                      disabled={code.length !== 6 || confirmationCode}
                      onClick={() => void confirmerEmail()}
                      type="button"
                    >
                      {confirmationCode ? 'Verification...' : 'Confirmer'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {messageEmail && <p className="m-0 mt-2 text-xs font-semibold text-muted">{messageEmail}</p>}
        </div>
      </div>
    </section>
  );
}
