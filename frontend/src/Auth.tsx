import { useState } from 'react';
import { api } from './api';

export function Auth({ onConnecte }: { onConnecte: () => void }) {
  const [etape, setEtape] = useState<'telephone' | 'code'>('telephone');
  const [telephone, setTelephone] = useState('');
  const [code, setCode] = useState('');
  const [codeDev, setCodeDev] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [chargement, setChargement] = useState(false);

  async function demanderCode() {
    setMessage('');
    setChargement(true);
    try {
      const { data } = await api.post('/auth/demande-code', { telephone });
      setCodeDev(data.codeDev ?? null); // en mode dev, le code est renvoyé
      setEtape('code');
    } catch (e: any) {
      setMessage(
        e.response?.data?.message ?? "Erreur lors de l'envoi du code.",
      );
    } finally {
      setChargement(false);
    }
  }

  async function verifierCode() {
    setMessage('');
    setChargement(true);
    try {
      const { data } = await api.post('/auth/verifie-code', {
        telephone,
        code,
      });
      localStorage.setItem('kwiik_token', data.token); // on stocke le jeton
      onConnecte();
    } catch (e: any) {
      setMessage(e.response?.data?.message ?? 'Code incorrect.');
    } finally {
      setChargement(false);
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '80px auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>KWIIK</h1>

      {etape === 'telephone' && (
        <>
          <p>Entrez votre numéro de téléphone</p>
          <input
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            placeholder="690000000"
            style={{ width: '100%', padding: 10, fontSize: 16 }}
          />
          <button
            onClick={demanderCode}
            disabled={chargement || telephone.length < 8}
            style={{ width: '100%', padding: 12, marginTop: 12, fontSize: 16 }}
          >
            {chargement ? 'Envoi…' : 'Recevoir le code'}
          </button>
        </>
      )}

      {etape === 'code' && (
        <>
          <p>Entrez le code reçu par SMS</p>
          {codeDev && (
            <p style={{ color: 'gray', fontSize: 13 }}>
              (mode dev — code : <strong>{codeDev}</strong>)
            </p>
          )}
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            maxLength={6}
            style={{ width: '100%', padding: 10, fontSize: 16 }}
          />
          <button
            onClick={verifierCode}
            disabled={chargement || code.length !== 6}
            style={{ width: '100%', padding: 12, marginTop: 12, fontSize: 16 }}
          >
            {chargement ? 'Vérification…' : 'Se connecter'}
          </button>
          <button
            onClick={() => setEtape('telephone')}
            style={{ width: '100%', padding: 8, marginTop: 8, background: 'none', border: 'none', color: 'gray', cursor: 'pointer' }}
          >
            ← Changer de numéro
          </button>
        </>
      )}

      {message && <p style={{ color: 'crimson', marginTop: 12 }}>{message}</p>}
    </div>
  );
}