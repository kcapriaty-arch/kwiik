# Plan de tests et jeux d'essai — KWIIK

> Formalisation des jeux d'essai exécutés sur ce projet : préconditions, étapes, résultat attendu, résultat obtenu. Tous les cas listés ici ont été **réellement exécutés** (navigateur Playwright ou appels API directs), pas rédigés à priori sans vérification.

## 1. Méthode et outillage

- **Tests de bout en bout** : Chromium piloté par Playwright, sur les mêmes serveurs de développement que ceux utilisés par un utilisateur réel (backend NestJS sur le port 3000, frontend Vite sur le port 5173) — pas de mock du navigateur.
- **Tests d'API directs** : requêtes HTTP réelles (`fetch`/`curl`) contre le backend, utilisées quand le cas de test porte sur la logique serveur pure (ex. concurrence, validation).
- **Principe** : chaque jeu d'essai envisage un cas nominal ET au moins un cas limite/anormal (email déjà utilisé, créneau déjà pris, champ manquant), conformément à l'exigence de "préparer des jeux d'essai en envisageant toutes les possibilités".
- **Numéros de téléphone / emails de test** : systématiquement uniques par exécution, pour ne jamais rejouer un test sur un compte déjà dans un état incompatible (piège rencontré et documenté : la réutilisation d'un même identifiant fait sauter l'onboarding et fausse le résultat).

## 2. Matrice des cas de test

| ID | Fonctionnalité | Précondition | Étapes | Résultat attendu | Résultat obtenu |
|---|---|---|---|---|---|
| CT-01 | Concurrence sur la confirmation de réservation | Un créneau libre, une prestation publiée | Envoyer 8 requêtes `PATCH /reservations/:id/confirmer` simultanées sur la même réservation | Exactement 1 succès, 7 réponses `409 Conflict` | ✅ Conforme (1 succès, 7 rejets propres) |
| CT-02 | Inscription email/mot de passe — cas nominal | Aucun | `POST /auth/inscription` avec nom/email/mot de passe valides | `201`, token JWT renvoyé, aucun champ `motDePasseHash` dans la réponse | ✅ Conforme |
| CT-03 | Inscription — email déjà utilisé | Un compte existe déjà avec cet email | `POST /auth/inscription` avec le même email | `409 Conflict` avec message explicite (pas de 500) | ✅ Conforme |
| CT-04 | Parcours client complet (inscription → Accueil) | Aucun | Créer un compte via l'UI, suivre le parcours jusqu'à l'écran d'accueil | Atterrissage direct sur Accueil, sans étape CNI/téléphone bloquante | ✅ Conforme (0 erreur console) |
| CT-05 | Paramètres du compte — téléphone + confirmation email | Compte client connecté | Renseigner un numéro, l'enregistrer ; demander un code de confirmation email, le saisir, confirmer | Message "Numéro enregistré." puis "Email confirmé." affichés sans que l'écran ne se réinitialise | ✅ Conforme (après correction d'un bug de re-rendu, voir §3) |
| CT-06 | Onboarding prestataire — moteur de documents dynamique | Compte prestataire fraîchement créé | Choisir la catégorie "Esthétique" (licence requise) + cocher "local à vendre/louer" en mode "adresse fixe" | Les étapes CNI, Licence et Facture d'électricité apparaissent toutes les trois ; l'étape Profil pro exige l'adresse | ✅ Conforme |
| CT-07 | Doublon de téléphone sur `/utilisateurs/moi` | Un compte utilise déjà le numéro X | `PATCH /utilisateurs/moi` avec le numéro X depuis un autre compte | `409 Conflict` avec message explicite (pas de 500) | ✅ Conforme (après correction, voir §3) |
| CT-08 | Filtres de recherche (Découverte) | Plusieurs prestataires en base avec prix et modes de service différents | Ouvrir le panneau de filtres, trier par "Meilleures notes", filtrer par "À domicile", appliquer | La liste se met à jour, le badge du bouton Filtres affiche le nombre de filtres actifs | ✅ Conforme |
| CT-09 | Paiement en ligne simulé | Prestation + créneau disponibles | Réserver avec "Payer en ligne", puis déclencher la simulation de paiement | Statut passe de "en attente" à "réussi" | ✅ Conforme |
| CT-10 | Accessibilité — navigation clavier des cartes Découverte | Aucun | Naviguer au clavier (Tab) jusqu'à une carte prestataire, activer avec Entrée | La fiche prestataire s'ouvre, sans utiliser la souris | ✅ Conforme (carte convertie en vrai `<button>`) |

## 3. Anomalies trouvées pendant les tests (et non de simples "échecs de script")

Deux anomalies **réelles**, dans l'application et non dans le script de test, ont été trouvées en préparant ces jeux d'essai — la distinction est volontairement tracée ici, car confondre bug de test et bug d'application est une erreur classique à éviter :

1. **Re-rendu complet de l'application sur chaque rafraîchissement de session** (`frontend/src/session.tsx`) : la fonction `recharger()` faisait basculer un indicateur de chargement global à chaque appel, pas seulement au premier chargement. Conséquence : après avoir enregistré un numéro de téléphone, tout l'écran "Paramètres du compte" se démontait et se remontait, effaçant le message de succès avant qu'il ne soit visible. Corrigé en limitant l'affichage de l'écran de chargement plein-écran au tout premier chargement de la session.
2. **Erreur 500 brute sur doublon de téléphone/email** (`backend/src/utilisateurs.service.ts`) : une contrainte unique violée en base remontait telle quelle comme une erreur serveur générique. Corrigé par l'interception explicite du code d'erreur Prisma `P2002` (voir `docs/GESTION_DES_RISQUES.md`, risque R3).

## 4. Couverture non testée (transparence, pas de faux sentiment de complétude)

- Pas de test de charge au-delà de 8 requêtes concurrentes (CT-01) — un test à plus grande échelle (100+ requêtes) n'a pas été mené.
- Pas de test avec un vrai lecteur d'écran (voir `docs/ACCESSIBILITE.md` §5).
- Pas de test sur connexion réseau dégradée / mode hors-ligne.
