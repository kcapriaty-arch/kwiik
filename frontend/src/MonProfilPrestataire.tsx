import { useEffect, useMemo, useState, type ChangeEvent, type CSSProperties, type FormEvent } from 'react';
import { api } from './api';
import { uploaderImage, uploaderImagePrivee } from './upload';

interface UtilisateurPro {
  nom: string;
  telephone: string;
}

interface ProfilPrive {
  telephonePro?: string | null;
  email?: string | null;
  photoProfilPriveeUrl?: string | null;
  cniRectoUrl?: string | null;
  cniVersoUrl?: string | null;
}

interface PrestationPro {
  id: string;
}

interface CreneauPro {
  id: string;
}

interface PrestatairePro {
  id: string;
  ville: string;
  quartier?: string | null;
  adresse?: string | null;
  description?: string | null;
  photoLieuUrl?: string | null;
  photosBoutique?: string[] | null;
  verifie?: boolean;
  utilisateur: UtilisateurPro;
  profilPrive?: ProfilPrive | null;
  prestations: PrestationPro[];
  creneaux: CreneauPro[];
}

interface ApiErrorResponse {
  response?: {
    status?: number;
    data?: {
      message?: string | string[];
    };
  };
}

interface IconProps {
  className?: string;
}

const urlBackend = 'http://localhost:3000';
const champClasse = 'w-full rounded-xl border border-line bg-white px-3 py-3 text-sm text-ink outline-none transition placeholder:text-[#9A988F] focus:border-kwiik';
const libelleClasse = 'grid gap-1.5 text-xs font-bold text-muted';

function CameraIcon({ className = '' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function ShieldIcon({ className = '' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-5" />
    </svg>
  );
}

function EyeIcon({ className = '' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CheckIcon({ className = '' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="m20 6-11 11-5-5" />
    </svg>
  );
}

function UploadIcon({ className = '' }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m17 8-5-5-5 5" />
      <path d="M12 3v12" />
    </svg>
  );
}

function imageUrl(url: string): string {
  return url.startsWith('http://') || url.startsWith('https://') ? url : `${urlBackend}${url}`;
}

function lireMessageErreur(error: unknown): string {
  const erreurApi = error as ApiErrorResponse;

  if (erreurApi.response?.status === 404) {
    return "Vous n'etes pas encore prestataire.";
  }

  const message = erreurApi.response?.data?.message;
  return Array.isArray(message) ? message.join(' ') : message ?? 'Une erreur est survenue.';
}

function initialesDepuisNom(nom: string): string {
  const morceaux = nom.trim().split(/\s+/).filter(Boolean);
  return morceaux.length > 0 ? morceaux.slice(0, 2).map((morceau) => morceau[0]?.toUpperCase()).join('') : 'KW';
}

export function MonProfilPrestataire() {
  const [prestataire, setPrestataire] = useState<PrestatairePro | null>(null);
  const [chargement, setChargement] = useState<boolean>(true);
  const [sauvegarde, setSauvegarde] = useState<boolean>(false);
  const [uploadEnCours, setUploadEnCours] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [erreur, setErreur] = useState<string>('');

  const [ville, setVille] = useState<string>('');
  const [quartier, setQuartier] = useState<string>('');
  const [adresse, setAdresse] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [photoLieuUrl, setPhotoLieuUrl] = useState<string>('');
  const [photosBoutique, setPhotosBoutique] = useState<string[]>([]);
  const [telephonePro, setTelephonePro] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [photoProfilPriveeUrl, setPhotoProfilPriveeUrl] = useState<string>('');
  const [cniRectoUrl, setCniRectoUrl] = useState<string>('');
  const [cniVersoUrl, setCniVersoUrl] = useState<string>('');

  async function chargerProfil(): Promise<void> {
    setChargement(true);
    setErreur('');

    try {
      const { data } = await api.get<PrestatairePro>('/prestataires/moi');
      setPrestataire(data);
      setVille(data.ville ?? '');
      setQuartier(data.quartier ?? '');
      setAdresse(data.adresse ?? '');
      setDescription(data.description ?? '');
      setPhotoLieuUrl(data.photoLieuUrl ?? '');
      setPhotosBoutique(data.photosBoutique ?? []);
      setTelephonePro(data.profilPrive?.telephonePro ?? data.utilisateur.telephone ?? '');
      setEmail(data.profilPrive?.email ?? '');
      setPhotoProfilPriveeUrl(data.profilPrive?.photoProfilPriveeUrl ?? '');
      setCniRectoUrl(data.profilPrive?.cniRectoUrl ?? '');
      setCniVersoUrl(data.profilPrive?.cniVersoUrl ?? '');
    } catch (error: unknown) {
      setErreur(lireMessageErreur(error));
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    void chargerProfil();
  }, []);

  const taches = useMemo(() => [
    { libelle: 'Photo principale de la boutique', fait: Boolean(photoLieuUrl) },
    { libelle: 'Au moins 3 images boutique', fait: photosBoutique.length >= 3 },
    { libelle: 'Adresse complete', fait: adresse.trim().length >= 5 },
    { libelle: 'Description claire', fait: description.trim().length >= 30 },
    { libelle: 'Numero professionnel', fait: telephonePro.trim().length >= 6 },
    { libelle: 'E-mail de contact', fait: email.trim().length >= 5 },
    { libelle: 'Photo privee du responsable', fait: Boolean(photoProfilPriveeUrl) },
    { libelle: 'CNI recto et verso', fait: Boolean(cniRectoUrl && cniVersoUrl) },
    { libelle: 'Prestations publiees', fait: Boolean(prestataire && prestataire.prestations.length > 0) },
    { libelle: 'Creneaux disponibles', fait: Boolean(prestataire && prestataire.creneaux.length > 0) },
  ], [adresse, cniRectoUrl, cniVersoUrl, description, email, photoLieuUrl, photoProfilPriveeUrl, photosBoutique.length, prestataire, telephonePro]);

  const tachesFaites = taches.filter((tache) => tache.fait).length;
  const tauxOptimisation = Math.round((tachesFaites / taches.length) * 100);
  const scoreVisibilite = Math.max(0, tauxOptimisation - 35);

  async function envoyerImage(
    event: ChangeEvent<HTMLInputElement>,
    type: string,
    appliquer: (url: string) => void,
    prive: boolean = false,
  ): Promise<void> {
    const fichier = event.target.files?.[0];

    if (!fichier) {
      return;
    }

    setUploadEnCours(type);
    setMessage('');
    setErreur('');

    try {
      const url = prive ? await uploaderImagePrivee(fichier) : await uploaderImage(fichier);
      appliquer(url);
      setMessage('Image envoyee. Pensez a sauvegarder vos modifications.');
    } catch (error: unknown) {
      setErreur(lireMessageErreur(error));
    } finally {
      setUploadEnCours('');
      event.target.value = '';
    }
  }

  async function ajouterPhotosBoutique(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const fichiers = Array.from(event.target.files ?? []);

    if (fichiers.length === 0) {
      return;
    }

    setUploadEnCours('photosBoutique');
    setMessage('');
    setErreur('');

    try {
      const urls = await Promise.all(fichiers.map((fichier) => uploaderImage(fichier)));
      setPhotosBoutique((photos) => [...photos, ...urls]);
      setMessage('Images boutique envoyees. Pensez a sauvegarder vos modifications.');
    } catch (error: unknown) {
      setErreur(lireMessageErreur(error));
    } finally {
      setUploadEnCours('');
      event.target.value = '';
    }
  }

  function retirerPhotoBoutique(url: string): void {
    setPhotosBoutique((photos) => photos.filter((photo) => photo !== url));
  }

  async function sauvegarderProfil(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSauvegarde(true);
    setMessage('');
    setErreur('');

    try {
      const { data } = await api.patch<PrestatairePro>('/prestataires/moi', {
        ville: ville.trim(),
        quartier: quartier.trim(),
        adresse: adresse.trim(),
        description: description.trim(),
        photoLieuUrl: photoLieuUrl || undefined,
        photosBoutique,
        telephonePro: telephonePro.trim() || undefined,
        email: email.trim() || undefined,
        photoProfilPriveeUrl: photoProfilPriveeUrl || undefined,
        cniRectoUrl: cniRectoUrl || undefined,
        cniVersoUrl: cniVersoUrl || undefined,
      });
      setPrestataire(data);
      setMessage('Profil prestataire sauvegarde.');
    } catch (error: unknown) {
      setErreur(lireMessageErreur(error));
    } finally {
      setSauvegarde(false);
    }
  }

  if (chargement) {
    return (
      <section className="min-h-full bg-[#F4F4F5] px-5 py-6 text-left text-ink">
        <p className="m-0 text-sm text-muted">Chargement du profil prestataire...</p>
      </section>
    );
  }

  if (!prestataire) {
    return (
      <section className="min-h-full bg-[#F4F4F5] px-5 py-6 text-left text-ink">
        <h1 className="m-0 text-3xl font-black tracking-normal text-ink">Profil prestataire</h1>
        <p className="m-0 mt-4 rounded-2xl bg-white p-4 text-sm font-semibold text-danger-strong">{erreur}</p>
      </section>
    );
  }

  const nom = prestataire.utilisateur.nom.trim() || 'Prestataire KWIIK';
  const avatar = photoLieuUrl;

  return (
    <section className="min-h-full bg-[#F4F4F5] px-5 pb-8 pt-6 text-left text-ink">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative h-24 w-24 flex-none overflow-hidden rounded-full bg-white shadow-sm">
            {avatar ? (
              <img alt="Profil prive" className="h-full w-full object-cover" src={imageUrl(avatar)} />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-kwiik-light text-2xl font-black text-kwiik-dark">
                {initialesDepuisNom(nom)}
              </div>
            )}
            <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-success-strong text-white ring-4 ring-[#F4F4F5]">
              <CheckIcon className="h-4 w-4" />
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="m-0 truncate text-3xl font-black tracking-normal text-ink">{nom}</h1>
            <p className="m-0 mt-2 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink shadow-sm">
              <span className="text-amber-star">*</span>
              Profil pro
            </p>
          </div>
        </div>
        <button className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-white text-ink shadow-sm" type="button">
          <CameraIcon className="h-7 w-7" />
        </button>
      </div>

      <div className="mt-7 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-kwiik-light text-kwiik-dark">
              <EyeIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="m-0 text-2xl font-black text-ink">{scoreVisibilite} pts</p>
              <p className="m-0 text-sm text-muted">Score de visibilite estime</p>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-black ${scoreVisibilite >= 65 ? 'bg-success-soft text-success-strong' : 'bg-danger-soft text-danger-strong'}`}>
            {scoreVisibilite >= 65 ? 'Bon' : 'A ameliorer'}
          </span>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="m-0 text-2xl font-black tracking-normal text-ink">Optimisation du profil</h2>
        <div className="mt-5 flex items-center gap-5">
          <div className="grid h-24 w-24 place-items-center rounded-full bg-[conic-gradient(#185FA5_var(--progress),#E7E0D6_0)]" style={{ '--progress': `${tauxOptimisation}%` } as CSSProperties}>
            <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-xl font-black text-ink">{tauxOptimisation}%</div>
          </div>
          <div>
            <p className="m-0 text-sm text-muted">Taches a completer</p>
            <p className="m-0 text-3xl font-black text-ink">{taches.length - tachesFaites}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-2">
          {taches.filter((tache) => !tache.fait).slice(0, 4).map((tache) => (
            <p className="m-0 rounded-xl bg-surface-1 px-3 py-2 text-sm font-semibold text-muted" key={tache.libelle}>{tache.libelle}</p>
          ))}
        </div>
      </div>

      <form className="mt-5 grid gap-5" onSubmit={sauvegarderProfil}>
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="m-0 text-xl font-black tracking-normal text-ink">Vitrine publique</h2>
          <p className="m-0 mt-1 text-sm leading-6 text-muted">Ces informations peuvent apparaitre sur la page publique de votre boutique.</p>

          <div className="mt-4 grid gap-3">
            <label className={libelleClasse}>Ville<input className={champClasse} onChange={(event) => setVille(event.target.value)} value={ville} /></label>
            <label className={libelleClasse}>Quartier<input className={champClasse} onChange={(event) => setQuartier(event.target.value)} value={quartier} /></label>
            <label className={libelleClasse}>Adresse boutique<input className={champClasse} onChange={(event) => setAdresse(event.target.value)} placeholder="Adresse visible par les clients" value={adresse} /></label>
            <label className={libelleClasse}>Description<textarea className={`${champClasse} min-h-28 resize-y`} onChange={(event) => setDescription(event.target.value)} placeholder="Presentez votre boutique, vos specialites et votre zone d'intervention." rows={5} value={description} /></label>
          </div>

          <div className="mt-5 grid gap-3">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-kwiik bg-kwiik-light px-4 py-4 text-sm font-black text-kwiik-dark">
              <UploadIcon className="h-5 w-5" />
              Ajouter / remplacer la photo principale
              <input accept="image/*" className="sr-only" disabled={Boolean(uploadEnCours)} onChange={(event) => void envoyerImage(event, 'photoLieu', setPhotoLieuUrl)} type="file" />
            </label>
            {photoLieuUrl && <img alt="Photo principale boutique" className="h-44 w-full rounded-xl object-cover" src={imageUrl(photoLieuUrl)} />}
          </div>

          <div className="mt-5 grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="m-0 text-base font-black tracking-normal text-ink">Photos de la boutique</h3>
              <span className="rounded-full bg-surface-1 px-3 py-1 text-xs font-bold text-muted">{photosBoutique.length} image{photosBoutique.length > 1 ? 's' : ''}</span>
            </div>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-white px-4 py-4 text-sm font-black text-ink">
              <CameraIcon className="h-5 w-5" />
              Ajouter plusieurs images
              <input accept="image/*" className="sr-only" disabled={Boolean(uploadEnCours)} multiple onChange={(event) => void ajouterPhotosBoutique(event)} type="file" />
            </label>
            {photosBoutique.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {photosBoutique.map((photo) => (
                  <div className="relative overflow-hidden rounded-xl" key={photo}>
                    <img alt="Photo boutique" className="aspect-[4/3] w-full object-cover" src={imageUrl(photo)} />
                    <button className="absolute right-2 top-2 rounded-full bg-black/65 px-2 py-1 text-xs font-bold text-white" onClick={() => retirerPhotoBoutique(photo)} type="button">Retirer</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-warning-soft text-warning-strong">
              <ShieldIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="m-0 text-xl font-black tracking-normal text-ink">Dossier prive</h2>
              <p className="m-0 mt-1 text-sm leading-6 text-muted">Ces donnees servent a verifier et retrouver le responsable en cas de probleme. Elles ne sont pas affichees sur la vitrine publique.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <label className={libelleClasse}>Numero professionnel<input className={champClasse} onChange={(event) => setTelephonePro(event.target.value)} placeholder="Ex. 690000000" value={telephonePro} /></label>
            <label className={libelleClasse}>E-mail prive<input className={champClasse} onChange={(event) => setEmail(event.target.value)} placeholder="contact@exemple.com" type="email" value={email} /></label>
          </div>

          <div className="mt-5 grid gap-3">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-white px-4 py-4 text-sm font-black text-ink">
              <CameraIcon className="h-5 w-5" />
              Photo privee du responsable
              <input accept="image/*" className="sr-only" disabled={Boolean(uploadEnCours)} onChange={(event) => void envoyerImage(event, 'photoProfil', setPhotoProfilPriveeUrl, true)} type="file" />
            </label>
            {photoProfilPriveeUrl && <p className="m-0 rounded-xl bg-success-soft p-3 text-sm font-bold text-success-strong">Photo privee enregistree dans le dossier securise.</p>}
          </div>

          <div className="mt-5 grid gap-3">
            <h3 className="m-0 text-base font-black tracking-normal text-ink">CNI du responsable</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid cursor-pointer place-items-center rounded-xl border border-dashed border-line bg-surface-1 p-4 text-center text-xs font-black text-muted">
                Recto CNI
                <input accept="image/*" className="sr-only" disabled={Boolean(uploadEnCours)} onChange={(event) => void envoyerImage(event, 'cniRecto', setCniRectoUrl, true)} type="file" />
              </label>
              <label className="grid cursor-pointer place-items-center rounded-xl border border-dashed border-line bg-surface-1 p-4 text-center text-xs font-black text-muted">
                Verso CNI
                <input accept="image/*" className="sr-only" disabled={Boolean(uploadEnCours)} onChange={(event) => void envoyerImage(event, 'cniVerso', setCniVersoUrl, true)} type="file" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {cniRectoUrl && <p className="m-0 rounded-xl bg-success-soft p-3 text-center text-xs font-bold text-success-strong">Recto ajoute</p>}
              {cniVersoUrl && <p className="m-0 rounded-xl bg-success-soft p-3 text-center text-xs font-bold text-success-strong">Verso ajoute</p>}
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="m-0 text-xl font-black tracking-normal text-ink">Suggestions KWIIK</h2>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-muted">
            <p className="m-0">Ajoutez 3 a 6 photos reelles de la boutique : facade, poste de travail, salle d'attente, resultat avant/apres si votre metier s'y prete.</p>
            <p className="m-0">Gardez la CNI et la photo privee a jour pour accelerer la verification et rassurer l'equipe en cas de litige.</p>
            <p className="m-0">Completez les creneaux et au moins trois prestations pour ameliorer la visibilite dans la recherche.</p>
          </div>
        </section>

        {uploadEnCours && <p className="m-0 rounded-xl bg-kwiik-light p-3 text-sm font-bold text-kwiik-dark">Upload en cours...</p>}
        {message && <p className="m-0 rounded-xl bg-success-soft p-3 text-sm font-bold text-success-strong">{message}</p>}
        {erreur && <p className="m-0 rounded-xl bg-danger-soft p-3 text-sm font-bold text-danger-strong">{erreur}</p>}

        <button className="h-12 rounded-xl bg-ink px-4 text-base font-black text-white transition disabled:bg-[#9A988F]" disabled={sauvegarde || Boolean(uploadEnCours)} type="submit">
          {sauvegarde ? 'Sauvegarde...' : 'Sauvegarder mon profil'}
        </button>
      </form>
    </section>
  );
}