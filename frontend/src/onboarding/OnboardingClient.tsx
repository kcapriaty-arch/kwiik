import { useEffect, useRef } from 'react';

interface OnboardingClientProps {
  onTermine: () => void | Promise<void>;
}

// Le nom et l'email sont deja collectes a l'inscription (email + mot de passe,
// ou Apple) ; la CNI n'est plus exigee cote client. Ce composant ne devrait donc
// jamais rester affiche : il termine immediatement, en filet de securite pour
// un compte existant dont le nom serait vide.
export function OnboardingClient({ onTermine }: OnboardingClientProps) {
  const dejaAppele = useRef(false);

  useEffect(() => {
    if (dejaAppele.current) {
      return;
    }
    dejaAppele.current = true;
    void onTermine();
  }, [onTermine]);

  return null;
}
