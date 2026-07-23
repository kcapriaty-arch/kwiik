import { useEffect, useMemo, useState } from 'react';
import { api } from './api';

interface VitrineProps {
  prestataireId: string;
  onRetour: () => void;
}

interface UtilisateurPrestataire {
  nom: string;
}

interface Abonnement {
  nom: string;
}

interface DomaineCategorie {
  id: string;
  nom: string;
  ordre?: number;
}

interface CategoriePrestataire {
  id: string;
  nom: string;
  domaine?: DomaineCategorie | null;
}

interface Prestation {
  id: string;
  titre: string;
  description?: string | null;
  photoUrl?: string | null;
  prix: number;
  dureeMin: number;
}

interface Creneau {
  id: string;
  debut: string;
  fin: string;
  statut: string;
}

interface PrestataireDetail {
  id: string;
  categories: CategoriePrestataire[];
  ville: string;
  quartier: string | null;
  adresse?: string | null;
  description: string | null;
  photoLieuUrl?: string | null;
  photosBoutique?: string[] | null;
  utilisateur: UtilisateurPrestataire;
  abonnement: Abonnement | null;
  prestations: Prestation[];
  creneaux: Creneau[];
}

interface MoyenneAvis {
  moyenne: number | null;
  nombreAvis: number;
}

interface AvisPrestataire {
  id?: string;
  note: number;
  commentaire: string | null;
  creeLe: string;
  reservation?: {
    client?: {
      nom?: string | null;
    } | null;
  } | null;
}

interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string | string[];
    };
  };
}

interface HoraireJour {
  nom: string;
  actif: boolean;
  debut: string;
  fin: string;
}

type OngletVitrine = 'rdv' | 'offrir' | 'avis' | 'apropos';
type IconName = 'back' | 'right' | 'down' | 'heart' | 'location' | 'clock' | 'gift' | 'map' | 'user';

const urlBackend = 'http://localhost:3000';
const nomsJours: string[] = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const ordreJours: number[] = [1, 2, 3, 4, 5, 6, 0];
const onglets: Array<{ id: OngletVitrine; libelle: string }> = [
  { id: 'rdv', libelle: 'Prendre RDV' },
  { id: 'offrir', libelle: 'Offrir' },
  { id: 'avis', libelle: 'Avis' },
  { id: 'apropos', libelle: 'A-propos' },
];

const formatFcfa = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const formatDateLong = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });
const formatDateAvis = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });
const formatJourCourt = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' });
const formatJourNombre = new Intl.DateTimeFormat('fr-FR', { day: '2-digit' });
const formatHeure = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
const formatNote = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  const props = {
    'aria-hidden': true,
    className,
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 2,
    viewBox: '0 0 24 24',
  };

  if (name === 'back') {
    return <svg {...props}><path d="m15 18-6-6 6-6" /></svg>;
  }

  if (name === 'right') {
    return <svg {...props}><path d="m9 18 6-6-6-6" /></svg>;
  }

  if (name === 'down') {
    return <svg {...props}><path d="m6 9 6 6 6-6" /></svg>;
  }

  if (name === 'heart') {
    return <svg {...props}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" /></svg>;
  }

  if (name === 'location') {
    return <svg {...props}><path d="M12 21s7-5.3 7-12a7 7 0 0 0-14 0c0 6.7 7 12 7 12Z" /><circle cx="12" cy="9" r="2.5" /></svg>;
  }

  if (name === 'clock') {
    return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
  }

  if (name === 'gift') {
    return <svg {...props}><path d="M20 12v8H4v-8" /><path d="M2 7h20v5H2z" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7Z" /><path d="M12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7Z" /></svg>;
  }

  if (name === 'map') {
    return <svg {...props}><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" /><path d="M9 3v15" /><path d="M15 6v15" /></svg>;
  }

  return <svg {...props}><circle cx="9" cy="7" r="4" /><path d="M3 21a6 6 0 0 1 12 0" /><path d="m16 11 2 2 4-5" /></svg>;
}

function prix(prixFcfa: number): string {
  return `${formatFcfa.format(prixFcfa)} FCFA`;
}

function dateLong(dateIso: string): string {
  return formatDateLong.format(new Date(dateIso));
}

function heure(dateIso: string): string {
  return formatHeure.format(new Date(dateIso));
}

function cleJour(dateIso: string): string {
  return new Date(dateIso).toISOString().slice(0, 10);
}

function note(noteValeur: number): string {
  return formatNote.format(noteValeur);
}

function imageUrl(url: string): string {
  return url.startsWith('http://') || url.startsWith('https://') ? url : `${urlBackend}${url}`;
}

function estImage(url: string | null | undefined): url is string {
  return Boolean(url);
}

function lireErreur(error: unknown): string {
  const message = (error as ApiErrorResponse).response?.data?.message;
  return Array.isArray(message) ? message.join(' ') : message ?? 'Une erreur est survenue.';
}

function nomPrestataire(prestataire: PrestataireDetail): string {
  return prestataire.utilisateur.nom.trim() || prestataire.categories[0]?.nom || 'Prestataire KWIIK';
}

function initiales(nom: string): string {
  const morceaux = nom.trim().split(/\s+/).filter(Boolean);
  return morceaux.length > 0 ? morceaux.slice(0, 2).map((morceau) => morceau[0]?.toUpperCase()).join('') : 'KW';
}

function lieuPrestataire(prestataire: PrestataireDetail): string {
  if (prestataire.adresse?.trim()) {
    return prestataire.adresse.trim();
  }

  return [prestataire.quartier, prestataire.ville].filter(Boolean).join(', ') || 'Lieu a confirmer';
}

function nomClient(avis: AvisPrestataire): string {
  return avis.reservation?.client?.nom?.trim() || 'Client';
}

function minutes(dateIso: string): number {
  const date = new Date(dateIso);
  return date.getHours() * 60 + date.getMinutes();
}

function minutesEnHeure(valeur: number): string {
  const h = Math.floor(valeur / 60).toString().padStart(2, '0');
  const m = (valeur % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function Vitrine({ prestataireId, onRetour }: VitrineProps) {
  const [prestataire, setPrestataire] = useState<PrestataireDetail | null>(null);
  const [moyenneAvis, setMoyenneAvis] = useState<MoyenneAvis | null>(null);
  const [avis, setAvis] = useState<AvisPrestataire[]>([]);
  const [avisDisponibles, setAvisDisponibles] = useState<boolean>(false);
  const [prestationSelectionnee, setPrestationSelectionnee] = useState<string>('');
  const [creneauSelectionne, setCreneauSelectionne] = useState<string>('');
  const [jourActif, setJourActif] = useState<string>('');
  const [ongletActif, setOngletActif] = useState<OngletVitrine>('rdv');
  const [chargement, setChargement] = useState<boolean>(true);
  const [reservationEnCours, setReservationEnCours] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [erreur, setErreur] = useState<string>('');

  useEffect(() => {
    async function charger(): Promise<void> {
      setChargement(true);
      setErreur('');
      setMessage('');
      setPrestationSelectionnee('');
      setCreneauSelectionne('');
      setJourActif('');
      setOngletActif('rdv');
      setMoyenneAvis(null);
      setAvis([]);
      setAvisDisponibles(false);

      const [detail, moyenne, listeAvis] = await Promise.allSettled([
        api.get<PrestataireDetail>(`/prestataires/${prestataireId}`),
        api.get<MoyenneAvis>(`/avis/prestataire/${prestataireId}/moyenne`),
        api.get<AvisPrestataire[]>(`/avis/prestataire/${prestataireId}`),
      ]);

      try {
        if (detail.status === 'rejected') {
          throw detail.reason;
        }

        const vitrine = detail.value.data;
        setPrestataire(vitrine);
        setJourActif(vitrine.creneaux[0] ? cleJour(vitrine.creneaux[0].debut) : '');

        if (moyenne.status === 'fulfilled' && listeAvis.status === 'fulfilled') {
          setMoyenneAvis(moyenne.value.data);
          setAvis(listeAvis.value.data);
          setAvisDisponibles(true);
        }
      } catch (error: unknown) {
        setPrestataire(null);
        setErreur(lireErreur(error));
      } finally {
        setChargement(false);
      }
    }

    charger();
  }, [prestataireId]);

  const joursDisponibles = useMemo<Creneau[]>(() => {
    if (!prestataire) {
      return [];
    }

    const vus = new Set<string>();
    return prestataire.creneaux.filter((creneau) => {
      const cle = cleJour(creneau.debut);
      if (vus.has(cle)) {
        return false;
      }
      vus.add(cle);
      return true;
    });
  }, [prestataire]);

  const creneauxAffiches = useMemo<Creneau[]>(() => {
    if (!prestataire) {
      return [];
    }

    return jourActif ? prestataire.creneaux.filter((creneau) => cleJour(creneau.debut) === jourActif) : prestataire.creneaux;
  }, [jourActif, prestataire]);

  const horaires = useMemo<HoraireJour[]>(() => {
    const plages = new Map<number, { debut: number; fin: number }>();

    prestataire?.creneaux.forEach((creneau) => {
      const jour = new Date(creneau.debut).getDay();
      const debut = minutes(creneau.debut);
      const fin = minutes(creneau.fin);
      const existant = plages.get(jour);
      plages.set(jour, existant ? { debut: Math.min(existant.debut, debut), fin: Math.max(existant.fin, fin) } : { debut, fin });
    });

    return ordreJours.map((jour) => {
      const plage = plages.get(jour);
      return {
        nom: nomsJours[jour],
        actif: Boolean(plage),
        debut: plage ? minutesEnHeure(plage.debut) : '',
        fin: plage ? minutesEnHeure(plage.fin) : '',
      };
    });
  }, [prestataire]);

  const images = useMemo<string[]>(() => {
    if (!prestataire) {
      return [];
    }

    return [prestataire.photoLieuUrl, ...(prestataire.photosBoutique ?? []), ...prestataire.prestations.map((prestation) => prestation.photoUrl)].filter(estImage);
  }, [prestataire]);

  async function reserver(): Promise<void> {
    if (!prestationSelectionnee || !creneauSelectionne) {
      return;
    }

    setReservationEnCours(true);
    setErreur('');
    setMessage('');

    try {
      await api.post('/reservations', {
        prestationId: prestationSelectionnee,
        creneauId: creneauSelectionne,
        modePaiement: 'a_la_livraison',
      });
      setMessage('Reservation envoyee avec succes.');
    } catch (error: unknown) {
      setErreur(lireErreur(error));
    } finally {
      setReservationEnCours(false);
    }
  }
  if (chargement) {
    return (
      <section className="min-h-full bg-white text-left text-ink">
        <div className="flex h-20 items-center justify-between border-b border-line bg-white px-5">
          <button className="flex h-11 w-11 items-center justify-center rounded-full text-ink" onClick={onRetour} type="button">
            <Icon className="h-7 w-7" name="back" />
          </button>
          <h1 className="m-0 text-xl font-black tracking-[0.42em] text-ink">KWIIK</h1>
          <span className="h-11 w-11" />
        </div>
        <p className="m-0 p-5 text-sm text-muted">Chargement de la vitrine...</p>
      </section>
    );
  }

  if (!prestataire) {
    return (
      <section className="min-h-full bg-white text-left text-ink">
        <div className="flex h-20 items-center justify-between border-b border-line bg-white px-5">
          <button className="flex h-11 w-11 items-center justify-center rounded-full text-ink" onClick={onRetour} type="button">
            <Icon className="h-7 w-7" name="back" />
          </button>
          <h1 className="m-0 text-xl font-black tracking-[0.42em] text-ink">KWIIK</h1>
          <span className="h-11 w-11" />
        </div>
        {erreur && <p className="m-0 p-5 text-sm font-semibold text-danger-strong">{erreur}</p>}
      </section>
    );
  }

  const nom = nomPrestataire(prestataire);
  const lieu = lieuPrestataire(prestataire);
  const categoriePrincipale = prestataire.categories[0]?.nom ?? 'services';
  const noteMoyenne = moyenneAvis?.moyenne ?? null;
  const nombreAvis = moyenneAvis?.nombreAvis ?? 0;
  const prestationActive = prestataire.prestations.find((prestation) => prestation.id === prestationSelectionnee);
  const creneauActif = prestataire.creneaux.find((creneau) => creneau.id === creneauSelectionne);
  const reservationPossible = Boolean(prestationSelectionnee && creneauSelectionne && !reservationEnCours);

  return (
    <section className="min-h-full bg-[#F7F7F7] text-left text-ink">
      <header className="sticky top-0 z-30 bg-white">
        <div className="flex h-20 items-center justify-between border-b border-line px-5">
          <button aria-label="Retour" className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-ink" onClick={onRetour} type="button">
            <Icon className="h-7 w-7" name="back" />
          </button>
          <h1 className="m-0 text-xl font-black tracking-[0.42em] text-ink">KWIIK</h1>
          <button aria-label="Compte" className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-ink text-white" type="button">
            <Icon className="h-6 w-6" name="user" />
          </button>
        </div>

        <nav className="grid grid-cols-4 border-b border-line bg-white">
          {onglets.map((onglet) => {
            const actif = ongletActif === onglet.id;
            return (
              <button
                className={`relative h-16 text-sm font-bold transition ${actif ? 'text-ink' : 'text-muted'}`}
                key={onglet.id}
                onClick={() => setOngletActif(onglet.id)}
                type="button"
              >
                {onglet.libelle}
                {actif && <span className="absolute bottom-0 left-0 right-0 h-1 bg-ink" />}
              </button>
            );
          })}
        </nav>
      </header>

      {ongletActif === 'rdv' && (
        <>
          <section className="relative h-[250px] overflow-hidden bg-soft-map">
            {images[0] ? (
              <img alt={`Lieu ${nom}`} className="absolute inset-0 h-full w-full object-cover" src={imageUrl(images[0])} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-kwiik-light via-white to-coral-soft text-3xl font-black text-kwiik-dark">
                {initiales(nom)}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/25" />
            <button aria-label="Image precedente" className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur" type="button">
              <Icon className="h-7 w-7" name="back" />
            </button>
            <button aria-label="Image suivante" className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur" type="button">
              <Icon className="h-7 w-7" name="right" />
            </button>
            <button aria-label="Ajouter aux favoris" className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur" type="button">
              <Icon className="h-8 w-8" name="heart" />
            </button>
            <span className="absolute bottom-4 right-4 rounded-full bg-black/50 px-3 py-1 text-xs font-bold text-white">
              {images.length > 0 ? `1/${images.length}` : '0/0'}
            </span>
          </section>

          <section className="bg-white px-5 py-7">
            <h2 className="m-0 text-[32px] font-black leading-tight tracking-normal text-ink">{nom}</h2>
            <p className="m-0 mt-4 flex items-start gap-2 text-base leading-6 text-muted">
              <Icon className="mt-0.5 h-5 w-5 flex-none" name="location" />
              <span className="underline decoration-muted/50 underline-offset-4">{lieu}</span>
            </p>
            <p className="m-0 mt-3 text-base font-semibold text-muted">
              {noteMoyenne !== null && nombreAvis > 0 ? (
                <>
                  <span className="text-amber-star">*</span> {note(noteMoyenne)} ({nombreAvis} avis)
                </>
              ) : (
                'Pas encore d\'avis'
              )}
              <span className="mx-2 text-line">-</span>
              <span>{prestataire.abonnement?.nom ?? 'Decouverte'}</span>
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {prestataire.categories.map((categorie) => (
                <span className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink" key={categorie.id}>
                  {categorie.nom}
                </span>
              ))}
            </div>
            <button className="mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-lg border-2 border-ink bg-white text-base font-bold text-ink" type="button">
              <Icon className="h-5 w-5" name="gift" />
              Offrir
            </button>
          </section>

          <section className="px-5 py-7">
            <h2 className="m-0 text-[26px] font-black tracking-normal text-ink">Resultats pour {categoriePrincipale}</h2>
            <p className="m-0 mt-2 text-sm leading-6 text-muted">Choisissez une prestation, puis un creneau disponible pour envoyer votre demande de reservation.</p>
          </section>

          <section className="border-y border-line bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-5">
              <h3 className="m-0 text-xl font-black tracking-normal text-ink">Prestations disponibles</h3>
              <Icon className="h-5 w-5 text-muted" name="down" />
            </div>

            {prestataire.prestations.length === 0 ? (
              <p className="m-0 px-5 py-6 text-sm text-muted">Aucune prestation publiee pour le moment.</p>
            ) : (
              prestataire.prestations.map((prestation) => {
                const selectionnee = prestationSelectionnee === prestation.id;
                return (
                  <article className={`border-b border-line px-5 py-6 last:border-b-0 ${selectionnee ? 'bg-kwiik-light/50' : 'bg-white'}`} key={prestation.id}>
                    <div className="flex gap-4">
                      {prestation.photoUrl && <img alt={prestation.titre} className="h-20 w-20 flex-none rounded-lg object-cover" src={imageUrl(prestation.photoUrl)} />}
                      <div className="min-w-0 flex-1">
                        <h4 className="m-0 text-lg font-semibold leading-7 text-ink">{prestation.titre}</h4>
                        {prestation.description && <p className="m-0 mt-2 line-clamp-2 text-base leading-7 text-muted">{prestation.description}</p>}
                        <button className="mt-2 flex items-center gap-1 text-base font-semibold text-muted" type="button">
                          Plus de details <Icon className="h-4 w-4" name="down" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-4">
                      <div>
                        <p className="m-0 text-xl font-semibold text-ink">{prix(prestation.prix)}</p>
                        <p className="m-0 mt-1 flex items-center gap-1.5 text-sm font-semibold text-muted"><Icon className="h-4 w-4" name="clock" />{prestation.dureeMin} min</p>
                      </div>
                      <button
                        className={`h-12 rounded-xl px-6 text-base font-bold text-white transition active:scale-[0.98] ${selectionnee ? 'bg-kwiik' : 'bg-ink'}`}
                        onClick={() => {
                          setPrestationSelectionnee(prestation.id);
                          setCreneauSelectionne('');
                          setMessage('');
                          setErreur('');
                        }}
                        type="button"
                      >
                        {selectionnee ? 'Choisie' : 'Choisir'}
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </section>

          <section className="px-5 py-7">
            <h2 className="m-0 text-[26px] font-black tracking-normal text-ink">Creneaux libres</h2>
            {!prestationSelectionnee && <p className="m-0 mt-2 text-sm leading-6 text-muted">Selectionnez d'abord une prestation pour choisir votre horaire.</p>}
            {prestationSelectionnee && prestataire.creneaux.length === 0 && <p className="m-0 mt-4 rounded-lg bg-white p-4 text-sm text-muted shadow-sm">Aucun creneau libre pour le moment.</p>}
            {prestationSelectionnee && prestataire.creneaux.length > 0 && (
              <div className="mt-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {joursDisponibles.map((creneau) => {
                    const cle = cleJour(creneau.debut);
                    const actif = jourActif === cle;
                    return (
                      <button
                        className={`min-w-[78px] rounded-xl border px-3 py-3 text-center transition active:scale-[0.98] ${actif ? 'border-kwiik bg-white text-kwiik' : 'border-line bg-white text-muted'}`}
                        key={cle}
                        onClick={() => {
                          setJourActif(cle);
                          setCreneauSelectionne('');
                          setMessage('');
                          setErreur('');
                        }}
                        type="button"
                      >
                        <span className="block text-xs font-bold uppercase">{formatJourCourt.format(new Date(creneau.debut)).replace('.', '')}</span>
                        <span className="block text-xl font-black leading-tight">{formatJourNombre.format(new Date(creneau.debut))}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {creneauxAffiches.map((creneau) => {
                    const selectionne = creneauSelectionne === creneau.id;
                    return (
                      <button
                        className={`rounded-xl border px-4 py-3 text-center transition active:scale-[0.98] ${selectionne ? 'border-ink bg-ink text-white' : 'border-kwiik bg-white text-kwiik'}`}
                        key={creneau.id}
                        onClick={() => {
                          setCreneauSelectionne(creneau.id);
                          setMessage('');
                          setErreur('');
                        }}
                        type="button"
                      >
                        <span className="block text-base font-black">{heure(creneau.debut)}</span>
                        <span className="mt-1 block text-xs font-semibold opacity-70">fin {heure(creneau.fin)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {ongletActif === 'offrir' && (
        <section className="px-5 py-8">
          <h2 className="m-0 text-[34px] font-black tracking-normal text-ink">Offrir</h2>
          <p className="m-0 mt-4 text-xl leading-9 text-muted">Selectionnez une prestation a offrir. Les cartes cadeaux KWIIK seront activees lorsque le paiement en ligne sera pret.</p>
          <h3 className="m-0 mt-10 text-[28px] font-black tracking-normal text-ink">Toutes les cartes cadeaux</h3>
          <article className="mt-5 flex items-center justify-between gap-4 border-y border-line bg-white px-5 py-7">
            <div>
              <h4 className="m-0 text-xl font-semibold leading-8 text-ink">Carte cadeau KWIIK</h4>
              <p className="m-0 mt-2 text-base leading-7 text-muted">Utilisable sur les prestations de ce prestataire.</p>
              <p className="m-0 mt-2 text-base font-bold text-muted">Montant variable</p>
            </div>
            <button className="h-12 flex-none rounded-xl bg-[#B9B4AA] px-6 text-base font-bold text-white" disabled type="button">Bientot</button>
          </article>
          <div className="mt-6 border-y border-line bg-white">
            {prestataire.prestations.map((prestation) => (
              <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-5 last:border-b-0" key={prestation.id}>
                <div>
                  <p className="m-0 text-lg font-semibold leading-7 text-ink">{prestation.titre}</p>
                  <p className="m-0 mt-1 text-sm font-semibold text-muted">{prix(prestation.prix)}</p>
                </div>
                <Icon className="h-5 w-5 flex-none text-ink" name="down" />
              </div>
            ))}
          </div>
        </section>
      )}

      {ongletActif === 'avis' && (
        <section className="px-5 py-8">
          <h2 className="m-0 text-[34px] font-black tracking-normal text-ink">Avis</h2>
          {!avisDisponibles && <p className="m-0 mt-5 rounded-lg bg-white p-5 text-sm text-muted shadow-sm">Avis indisponibles pour le moment.</p>}
          {avisDisponibles && (
            <>
              {noteMoyenne !== null && nombreAvis > 0 ? (
                <div className="mt-6 overflow-hidden rounded-lg border border-line bg-white">
                  <div className="grid grid-cols-[104px_1fr]">
                    <div className="flex items-center justify-center bg-ink px-4 py-8 text-4xl font-black text-white">{note(noteMoyenne)}</div>
                    <div className="px-5 py-5">
                      <p className="m-0 text-lg leading-8 text-muted">Accueil <span className="font-bold text-ink">{note(noteMoyenne)} *</span></p>
                      <p className="m-0 text-lg leading-8 text-muted">Qualite <span className="font-bold text-ink">{note(noteMoyenne)} *</span></p>
                      <p className="m-0 mt-3 text-base font-semibold text-ink">{nombreAvis} client{nombreAvis > 1 ? 's' : ''} ont donne leur avis</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="m-0 mt-5 rounded-lg bg-white p-5 text-sm text-muted shadow-sm">Pas encore d'avis.</p>
              )}
              <div className="mt-7 bg-white px-5">
                {avis.map((avisItem, index) => (
                  <article className="border-b border-line py-6 last:border-b-0" key={avisItem.id ?? `${avisItem.creeLe}-${index}`}>
                    <p className="m-0 text-xl font-black text-muted">{note(avisItem.note)} <span className="text-ink">*</span></p>
                    {avisItem.commentaire && <p className="m-0 mt-3 text-lg leading-8 text-muted">{avisItem.commentaire}</p>}
                    <p className="m-0 mt-3 text-base text-muted">{formatDateAvis.format(new Date(avisItem.creeLe))}</p>
                    <p className="m-0 mt-1 text-sm font-semibold text-[#9A988F]">{nomClient(avisItem)}</p>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {ongletActif === 'apropos' && (
        <section className="pb-10">
          <div className="px-5 py-8">
            <h2 className="m-0 text-[30px] font-black tracking-normal text-ink">Ou se situe ce prestataire ?</h2>
            <p className="m-0 mt-4 flex items-start gap-2 text-lg leading-7 text-muted"><Icon className="mt-0.5 h-6 w-6 flex-none" name="location" /><span className="underline decoration-muted/50 underline-offset-4">{lieu}</span></p>
          </div>
          <div className="relative h-[210px] overflow-hidden bg-soft-map">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(24,95,165,0.12)_0_25%,transparent_25%_50%,rgba(63,157,135,0.13)_50%_75%,transparent_75%)] bg-[length:120px_120px] blur-[1px]" />
            <button className="absolute left-1/2 top-1/2 flex h-14 -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-xl bg-ink px-6 text-base font-bold text-white" type="button"><Icon className="h-5 w-5" name="map" />Afficher la carte</button>
          </div>
          <section className="px-5 py-8"><h2 className="m-0 text-[30px] font-black tracking-normal text-ink">Horaires d'ouverture</h2></section>
          <div className="border-y border-line bg-white px-5">
            {horaires.map((jour) => (
              <div className="flex items-center justify-between border-b border-line py-5 last:border-b-0" key={jour.nom}>
                <span className={`text-lg ${jour.actif ? 'font-black text-ink' : 'font-semibold text-muted'}`}>{jour.nom}</span>
                <span className="text-lg font-semibold text-ink">{jour.actif ? `${jour.debut} - ${jour.fin}` : 'Sur rendez-vous'}</span>
              </div>
            ))}
          </div>
          <section className="px-5 py-8"><h2 className="m-0 text-[30px] font-black tracking-normal text-ink">Informations</h2></section>
          <div className="border-y border-line bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-5"><h3 className="m-0 text-xl font-black tracking-normal text-ink">A-propos</h3><Icon className="h-5 w-5 text-ink" name="down" /></div>
            <p className="m-0 px-5 py-6 text-lg leading-8 text-muted">{prestataire.description || "Ce prestataire n'a pas encore ajoute de description detaillee."}</p>
          </div>
          <section className="px-5 py-8">
            <h2 className="m-0 text-[30px] font-black tracking-normal text-ink">Dans cet etablissement</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              {prestataire.categories.map((categorie) => <span className="rounded-full border border-line bg-white px-5 py-3 text-base font-semibold text-ink" key={categorie.id}>{categorie.nom} {prestataire.ville}</span>)}
            </div>
          </section>
        </section>
      )}

      {ongletActif === 'rdv' && (
        <div className="sticky bottom-0 z-20 border-t border-line bg-white/95 px-5 py-3 backdrop-blur">
          {message && <p className="m-0 mb-2 text-xs font-bold text-success-strong">{message}</p>}
          {erreur && <p className="m-0 mb-2 text-xs font-bold text-danger-strong">{erreur}</p>}
          <div className="mb-3 min-h-[34px] text-xs text-muted">
            {prestationActive && creneauActif ? (
              <p className="m-0"><span className="font-bold text-ink">{prestationActive.titre}</span> - {dateLong(creneauActif.debut)} a {heure(creneauActif.debut)}</p>
            ) : prestationActive ? (
              <p className="m-0">Prestation choisie : <span className="font-bold text-ink">{prestationActive.titre}</span>. Choisissez un creneau.</p>
            ) : (
              <p className="m-0">Choisissez une prestation et un creneau pour reserver.</p>
            )}
          </div>
          <button
            className={`h-12 w-full rounded-xl text-base font-black text-white shadow-[0_12px_24px_rgba(26,26,24,0.16)] transition ${reservationPossible ? 'bg-ink active:scale-[0.98]' : 'bg-[#B9B4AA]'}`}
            disabled={!reservationPossible}
            onClick={reserver}
            type="button"
          >
            {reservationEnCours ? 'Reservation...' : 'Reserver maintenant'}
          </button>
        </div>
      )}
    </section>
  );
}
