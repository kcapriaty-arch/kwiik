import { useMemo, useState } from 'react';
import { api, urlImage } from './api';

export interface CreneauSheet {
  id: string;
  debut: string;
  fin: string;
}

export interface PrestationSheet {
  id: string;
  titre: string;
  prix: number;
}

interface SheetReservationProps {
  nomPrestataire: string;
  photoPrestataire?: string | null;
  initialesPrestataire: string;
  categoriePrestataire: string;
  prestation: PrestationSheet;
  creneaux: CreneauSheet[];
  onFermer: () => void;
  onReserve: (payload: {
    creneauId: string;
    modePaiement: 'a_la_livraison' | 'en_ligne';
    operateur?: 'orange_money' | 'mtn_momo';
    note?: string;
  }) => Promise<{ reservationId: string }>;
}

type Etape = 'date' | 'recap' | 'confirmation';

const formatteurFcfa = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const formatteurJourCourt = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' });
const formatteurJourNombre = new Intl.DateTimeFormat('fr-FR', { day: '2-digit' });
const formatteurMois = new Intl.DateTimeFormat('fr-FR', { month: 'short' });
const formatteurHeure = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
const formatteurDateComplete = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' });

function formatPrix(prix: number): string {
  return `${formatteurFcfa.format(prix)} FCFA`;
}

function cleJour(dateIso: string): string {
  return new Date(dateIso).toISOString().slice(0, 10);
}

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function CloseIcon({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function SheetReservation({
  nomPrestataire,
  photoPrestataire,
  initialesPrestataire,
  categoriePrestataire,
  prestation,
  creneaux,
  onFermer,
  onReserve,
}: SheetReservationProps) {
  const [etape, setEtape] = useState<Etape>('date');
  const [jourActif, setJourActif] = useState<string>('');
  const [creneauId, setCreneauId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [modePaiement, setModePaiement] = useState<'a_la_livraison' | 'en_ligne'>('a_la_livraison');
  const [operateur, setOperateur] = useState<'orange_money' | 'mtn_momo'>('orange_money');
  const [envoiEnCours, setEnvoiEnCours] = useState<boolean>(false);
  const [erreur, setErreur] = useState<string>('');
  const [paiement, setPaiement] = useState<{ id: string; statut: string } | null>(null);
  const [simulationEnCours, setSimulationEnCours] = useState<boolean>(false);
  const [confirmee, setConfirmee] = useState<{ debut: string } | null>(null);

  const jours = useMemo<CreneauSheet[]>(() => {
    const vus = new Set<string>();
    return creneaux.filter((creneau) => {
      const cle = cleJour(creneau.debut);
      if (vus.has(cle)) return false;
      vus.add(cle);
      return true;
    });
  }, [creneaux]);

  const jourEffectif = jourActif || (jours[0] ? cleJour(jours[0].debut) : '');
  const creneauxDuJour = useMemo<CreneauSheet[]>(
    () => creneaux.filter((creneau) => cleJour(creneau.debut) === jourEffectif),
    [creneaux, jourEffectif],
  );
  const creneauActif = creneaux.find((c) => c.id === creneauId);
  const progression = etape === 'date' ? 1 : etape === 'recap' ? 2 : 3;

  async function confirmer(): Promise<void> {
    if (!creneauActif || envoiEnCours) {
      return;
    }

    setEnvoiEnCours(true);
    setErreur('');

    try {
      const resultat = await onReserve({
        creneauId: creneauActif.id,
        modePaiement,
        ...(modePaiement === 'en_ligne' && { operateur }),
        ...(note.trim() && { note: note.trim() }),
      });

      if (modePaiement === 'en_ligne') {
        const { data } = await api.get<{ id: string; statut: string }>(`/paiements/reservation/${resultat.reservationId}`);
        setPaiement({ id: data.id, statut: data.statut });
      }

      setConfirmee({ debut: creneauActif.debut });
      setEtape('confirmation');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message;
      setErreur(Array.isArray(message) ? message.join(' ') : message ?? 'Une erreur est survenue.');
    } finally {
      setEnvoiEnCours(false);
    }
  }

  async function simulerPaiement(): Promise<void> {
    if (!paiement || simulationEnCours) {
      return;
    }

    setSimulationEnCours(true);
    try {
      const { data } = await api.post<{ statut: string }>(`/paiements/${paiement.id}/simuler`, { resultat: 'reussi' });
      setPaiement((p) => (p ? { ...p, statut: data.statut } : p));
    } catch {
      // Echec silencieux : le statut reste affiche tel quel, l'utilisateur peut reessayer.
    } finally {
      setSimulationEnCours(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" role="presentation">
      <button aria-label="Fermer" className="absolute inset-0 cursor-default" onClick={onFermer} type="button" />
      <div className="relative z-10 max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-[24px] bg-white pb-7" role="dialog" aria-modal="true" aria-label="Réserver">
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-line" />

        <div className="flex items-center gap-3 px-5 pt-4">
          <div className="flex h-11 w-11 flex-none items-center justify-center overflow-hidden rounded-full bg-kwiik-light text-sm font-bold text-kwiik">
            {photoPrestataire ? (
              <img alt="" className="h-full w-full object-cover" src={urlImage(photoPrestataire)} />
            ) : (
              initialesPrestataire
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-sm font-bold text-ink">{nomPrestataire}</p>
            <p className="m-0 mt-0.5 truncate text-xs text-muted">
              {categoriePrestataire} · <span className="font-semibold text-kwiik">{formatPrix(prestation.prix)}</span>
            </p>
          </div>
          <button aria-label="Fermer" className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-surface-1 text-ink" onClick={onFermer} type="button">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex gap-1 px-5">
          {[1, 2, 3].map((n) => (
            <span className={`h-1 flex-1 rounded-full ${n <= progression ? 'bg-kwiik' : 'bg-line'}`} key={n} />
          ))}
        </div>

        {etape === 'date' && (
          <div className="px-5 pt-5">
            <p className="m-0 mb-2 text-sm font-bold text-ink">Choisissez une date</p>
            {jours.length === 0 ? (
              <p className="m-0 rounded-xl bg-surface-1 p-3 text-sm text-muted">Aucun créneau disponible pour le moment.</p>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {jours.map((creneau) => {
                  const cle = cleJour(creneau.debut);
                  const actif = jourEffectif === cle;
                  const date = new Date(creneau.debut);
                  return (
                    <button
                      className={`min-w-[64px] flex-none rounded-xl border px-2 py-2 text-center transition active:scale-[0.98] ${actif ? 'border-kwiik bg-kwiik text-white' : 'border-line bg-white text-ink'}`}
                      key={cle}
                      onClick={() => {
                        setJourActif(cle);
                        setCreneauId('');
                      }}
                      type="button"
                    >
                      <span className="block text-[10px] font-bold uppercase opacity-80">{formatteurJourCourt.format(date).replace('.', '')}</span>
                      <span className="block text-lg font-black leading-tight">{formatteurJourNombre.format(date)}</span>
                      <span className="block text-[10px] opacity-80">{formatteurMois.format(date).replace('.', '')}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {creneauxDuJour.length > 0 && (
              <>
                <p className="m-0 mb-2 mt-5 text-sm font-bold text-ink">Choisissez un horaire</p>
                <div className="grid grid-cols-3 gap-2">
                  {creneauxDuJour.map((creneau) => {
                    const actif = creneauId === creneau.id;
                    return (
                      <button
                        className={`h-11 rounded-xl border text-sm font-semibold transition active:scale-[0.98] ${actif ? 'border-kwiik bg-kwiik-light text-kwiik-dark' : 'border-line bg-white text-ink'}`}
                        key={creneau.id}
                        onClick={() => setCreneauId(creneau.id)}
                        type="button"
                      >
                        {formatteurHeure.format(new Date(creneau.debut))}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <button
              className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-kwiik text-sm font-bold text-white transition active:scale-[0.98] disabled:bg-[#B8B4AA]"
              disabled={!creneauId}
              onClick={() => setEtape('recap')}
              type="button"
            >
              Continuer
            </button>
          </div>
        )}

        {etape === 'recap' && creneauActif && (
          <div className="px-5 pt-5">
            <div className="grid gap-3 rounded-2xl border border-line p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">Prestataire</span>
                <span className="font-bold text-ink">{nomPrestataire}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Date</span>
                <span className="font-bold text-ink">{formatteurDateComplete.format(new Date(creneauActif.debut))}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Heure</span>
                <span className="font-bold text-ink">{formatteurHeure.format(new Date(creneauActif.debut))}</span>
              </div>
              <div className="flex items-center justify-between border-t border-line pt-3">
                <span className="text-muted">Total estimé</span>
                <span className="font-black text-kwiik">{formatPrix(prestation.prix)}</span>
              </div>
            </div>

            <p className="m-0 mb-2 mt-5 text-sm font-bold text-ink">Mode de paiement</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                className={`h-10 rounded-xl text-xs font-bold transition ${modePaiement === 'a_la_livraison' ? 'bg-ink text-white' : 'bg-surface-1 text-muted'}`}
                onClick={() => setModePaiement('a_la_livraison')}
                type="button"
              >
                À la livraison
              </button>
              <button
                className={`h-10 rounded-xl text-xs font-bold transition ${modePaiement === 'en_ligne' ? 'bg-ink text-white' : 'bg-surface-1 text-muted'}`}
                onClick={() => setModePaiement('en_ligne')}
                type="button"
              >
                Payer en ligne
              </button>
            </div>
            {modePaiement === 'en_ligne' && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  className={`h-9 rounded-xl border text-xs font-bold transition ${operateur === 'orange_money' ? 'border-kwiik bg-kwiik-light text-kwiik-dark' : 'border-line bg-white text-muted'}`}
                  onClick={() => setOperateur('orange_money')}
                  type="button"
                >
                  Orange Money
                </button>
                <button
                  className={`h-9 rounded-xl border text-xs font-bold transition ${operateur === 'mtn_momo' ? 'border-kwiik bg-kwiik-light text-kwiik-dark' : 'border-line bg-white text-muted'}`}
                  onClick={() => setOperateur('mtn_momo')}
                  type="button"
                >
                  MTN MoMo
                </button>
              </div>
            )}

            <p className="m-0 mb-2 mt-5 text-sm font-bold text-ink">Note pour le prestataire</p>
            <textarea
              className="min-h-[80px] w-full resize-y rounded-xl border border-line bg-surface-1 p-3 text-sm text-ink outline-none focus:border-kwiik focus:bg-white"
              onChange={(event) => setNote(event.target.value.slice(0, 500))}
              placeholder="Décrivez votre demande, précisez vos besoins..."
              value={note}
            />

            {erreur && <p className="m-0 mt-3 rounded-xl bg-danger-soft p-3 text-xs font-semibold text-danger-strong">{erreur}</p>}

            <div className="mt-5 flex gap-2">
              <button
                className="h-12 flex-1 rounded-full border border-line bg-white text-sm font-bold text-ink transition active:scale-[0.98]"
                onClick={() => setEtape('date')}
                type="button"
              >
                Retour
              </button>
              <button
                className="h-12 flex-[2] rounded-full bg-kwiik text-sm font-bold text-white transition active:scale-[0.98] disabled:bg-[#B8B4AA]"
                disabled={envoiEnCours}
                onClick={() => void confirmer()}
                type="button"
              >
                {envoiEnCours ? 'Envoi...' : `Confirmer — ${formatPrix(prestation.prix)}`}
              </button>
            </div>
          </div>
        )}

        {etape === 'confirmation' && confirmee && (
          <div className="px-5 pt-8 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime text-lime-dark">
              <CheckIcon className="h-8 w-8" />
            </span>
            <h2 className="m-0 mt-4 text-xl font-black text-ink">C'est réservé !</h2>
            <p className="m-0 mt-2 text-sm text-muted">{nomPrestataire} vous attend</p>
            <p className="m-0 mt-1 text-sm font-bold text-ink">
              {formatteurDateComplete.format(new Date(confirmee.debut))} à {formatteurHeure.format(new Date(confirmee.debut))}
            </p>

            {paiement ? (
              <div className="mt-5 rounded-xl border border-line bg-surface-1 p-3 text-left">
                <p className="m-0 text-xs font-bold text-ink">
                  Paiement en ligne :{' '}
                  {paiement.statut === 'reussi' ? (
                    <span className="text-success-strong">réussi ✓</span>
                  ) : paiement.statut === 'echoue' ? (
                    <span className="text-danger-strong">échoué</span>
                  ) : (
                    <span className="text-warning-strong">en attente</span>
                  )}
                </p>
                {paiement.statut === 'en_attente' && (
                  <button
                    className="mt-2 h-11 w-full rounded-xl bg-kwiik text-sm font-black text-white disabled:bg-[#B8B4AA]"
                    disabled={simulationEnCours}
                    onClick={() => void simulerPaiement()}
                    type="button"
                  >
                    {simulationEnCours ? 'Paiement en cours...' : 'Payer maintenant (simulation)'}
                  </button>
                )}
              </div>
            ) : (
              <p className="m-0 mt-5 text-xs leading-5 text-muted">
                Le prestataire recevra votre demande et vous contactera sous peu.
              </p>
            )}

            <button
              className="mt-6 h-12 w-full rounded-full bg-kwiik text-sm font-bold text-white transition active:scale-[0.98]"
              onClick={onFermer}
              type="button"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
