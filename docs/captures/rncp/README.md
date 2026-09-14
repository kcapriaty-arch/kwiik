# Index des preuves RNCP — KWIIK

Ce dossier centralise les preuves techniques utilisées pour la soutenance RNCP 36463 (CDAN, niveau 6). Chaque preuve est reliée à une affirmation du dossier, à une source vérifiable dans le dépôt, et à un statut honnête.

Statuts possibles : **VERIFIED** (démontrable tel quel) · **PARTIAL** (vrai mais formulation à corriger/nuancer) · **NOT FOUND** (aucune preuve retrouvée) · **PROJECTED** (documenté/prévu mais pas réellement exécuté).

Voir aussi le rapport complet : [`docs/RNCP_KWIIK_AUDIT.md`](../../RNCP_KWIIK_AUDIT.md).

---

## 01 — Architecture en couches (Controller → Guards → Services → PrismaService → PostgreSQL)

| | |
|---|---|
| Affirmation | Architecture en couches respectée, aucun SQL brut hors Prisma |
| Fichiers source | `backend/src/reservation/reservations.controller.ts:15-16`, `reservations.service.ts:16`, `backend/src/auth/jwt-auth.guard.ts`, `backend/src/auth/roles.guard.ts`, `backend/src/prisma.service.ts` |
| Commande | `grep -rn "queryRaw\|executeRaw" backend/src/` (doit ne rien retourner) |
| Résultat attendu | Aucune occurrence de SQL brut ; chaîne Controller→Guard→Service→Prisma visible dans le code |
| Capture à prendre | `reservations.controller.ts` (lignes 1-40) côte à côte avec `reservations.service.ts` (lignes 1-40) dans l'éditeur |
| Statut | **VERIFIED** (nuance : `RolesGuard` utilisé sur une seule route — voir audit) |

## 02 — Concurrence de réservation (double-booking) — CT-01

| | |
|---|---|
| Affirmation | 8 requêtes concurrentes sur le même créneau → 1 succès, 7 rejets 409, aucune double réservation |
| Fichier source | `backend/src/reservation/reservations.service.ts:119-196` (méthode `confirmer`), trigger DB `backend/prisma/migrations/20260819090000_trigger_anti_double_reservation_creneau/migration.sql` |
| Commande | `cd backend && npx tsx scripts/ct01-concurrence-reservation.ts` (nécessite un Postgres de test, voir en-tête du script) |
| Résultat attendu | `1 succes (200) / 7 conflits (409) / 0 autres`, `RESULTAT : CONFORME` |
| Sortie déjà enregistrée | [`02-concurrence-reservation/resultat-ct01.txt`](02-concurrence-reservation/resultat-ct01.txt) (2 exécutions réelles) |
| Capture à prendre | Terminal montrant la sortie du script (déjà capturée en texte, une capture d'écran du terminal est optionnelle) |
| Statut | **VERIFIED** — exécuté réellement le 2026-09-14, reproductible |

## 00 bis — Captures d'écran réelles (produites le 2026-09-14)

L'application a été lancée réellement (backend + frontend + Postgres de test seedé) et pilotée avec Playwright/Chromium pour produire ces captures. Données 100% fictives (`*.local`).

| Fichier | Ce qu'il montre |
|---|---|
| `05-accessibilite/01-decouverte-etoile-notation.png` | Écran Découverte avec l'étoile de notation réelle (★ 5,0) sur une carte prestataire |
| `05-accessibilite/03-zoom-etoile-notation.png` | Gros plan sur l'étoile ambrée (#976600) pour la preuve de contraste |
| `05-accessibilite/02-modale-reservation.png` | Modale de réservation ouverte (`role="dialog"`, `aria-modal="true"`) |
| `05-accessibilite/resultat-test-clavier.txt` | **Test clavier réel** : Tab/Tab/Echap exécuté sur la modale — **confirmé : Echap ne ferme pas la modale** (fermeture fonctionnelle uniquement via le bouton croix) |
| `08-bug-session-ct05/01-parametres-message-succes.png` | Écran Paramètres après enregistrement du téléphone : message "Numero enregistre." affiché sans réinitialisation de l'écran |
| `09-moteur-documents-ct06/01-choix-categorie-esthetique.png` | Sélection de la catégorie "Esthétique" à l'onboarding |
| `09-moteur-documents-ct06/02-mode-service-local-vendre-louer.png` | Mode "Adresse fixe" + case "local à vendre ou à louer" cochée |
| `09-moteur-documents-ct06/03-etape-cni.png` | Étape CNI (toujours requise) |
| `09-moteur-documents-ct06/04-etape-licence.png` | Étape Licence (requise par la catégorie Esthétique) — barre de progression 4/6 |
| `09-moteur-documents-ct06/05-etape-facture-electricite.png` | Étape Facture d'électricité (requise par le local à vendre/louer) — barre de progression 5/6 |

## 03 — Modèle de données et ERD

| | |
|---|---|
| Affirmation | Modèle de données cohérent (~12 entités annoncées) |
| Fichier source | `backend/prisma/schema.prisma` (16 `model` réels) |
| Commande | `node docs/captures/rncp/scripts/generer-erd.mjs` puis `npx @mermaid-js/mermaid-cli -i docs/erd.mmd -o docs/erd.png` |
| Résultat attendu | `docs/erd.png` / `docs/erd.svg` avec 16 entités, clés primaires (PK) et uniques (UK) |
| Capture à prendre | `docs/erd.png` en entier, ou un recadrage sur le cœur métier (Utilisateur, Prestataire, Reservation, Creneau, Prestation) pour un slide plus lisible |
| Statut | **VERIFIED** (16 entités, pas ~12 — corriger le chiffre dans le dossier) |

## 04 — Sécurité : exclusion du hash bcrypt des réponses API

| | |
|---|---|
| Affirmation | Le hash du mot de passe n'est jamais renvoyé au client |
| Fichiers source | `backend/src/auth/auth.service.ts:31-36` (`sansMotDePasse`), `backend/src/utilisateurs.service.ts:6-19` (`selectSansMotDePasse`) |
| Tests automatisés | `backend/src/auth/auth.service.hash.spec.ts`, `backend/src/utilisateurs.service.hash.spec.ts` |
| Commande | `cd backend && npm test` |
| Résultat attendu | `Test Suites: 3 passed`, `Tests: 4 passed` |
| Preuve API réelle | [`04-securite-hash/reponses-api-sans-hash.json`](04-securite-hash/reponses-api-sans-hash.json) (inscription, `/auth/moi`, `/utilisateurs/moi` — données anonymisées) |
| Capture à prendre | Le fichier JSON ci-dessus, ou la sortie `npm test` |
| Statut | **VERIFIED** pour l'état actuel du code. **PARTIAL/NOT FOUND** pour l'affirmation d'un "incident corrigé" — aucune trace Git d'une fuite réelle (le champ a été introduit protégé dès le départ, même commit) |

## 05 — Accessibilité WCAG 2.1 AA

| | |
|---|---|
| Affirmation | Contraste étoile de notation corrigé de 2,03:1 à 4,98:1 ; ~24 aria-label sur ~8 fichiers |
| Fichier source | `frontend/src/index.css:36-37`, `docs/ACCESSIBILITE.md` |
| Commande | `node docs/captures/rncp/scripts/contraste-wcag.js` |
| Résultat attendu | `Etoile notation - AVANT correction  2.03:1  NON CONFORME` / `APRES correction  4.98:1  CONFORME` |
| Capture à prendre | Voir `03-zoom-etoile-notation.png` (déjà produite) |
| Statut | **VERIFIED** pour les contrastes (recalcul indépendant identique) et pour le rendu réel de l'étoile en application. **PARTIAL** pour "~24 aria-label / 8 fichiers" (réel : 27 / 9). **Nouveau finding réel** : la modale de réservation ne se ferme pas avec Echap (voir `resultat-test-clavier.txt`) — à corriger ou à formuler avec réserve dans le dossier |

## 06 — Registre des risques

| | |
|---|---|
| Affirmation | 8 risques (R1-R8), criticité = probabilité × impact (échelle 1-3) |
| Fichier source | `docs/GESTION_DES_RISQUES.md` |
| Commande | Lecture directe du document |
| Résultat attendu | Tableau R1-R8 avec calcul P×I cohérent partout |
| Capture à prendre | Le tableau des risques du document, éventuellement le diagramme Mermaid quadrant |
| Statut | **VERIFIED** — cohérence arithmétique confirmée, corroborée par le code (R3 : `utilisateurs.service.ts:58-65` ; R8 : `auth.service.ts:13`) |

## 07 — Plan de tests CT-01 à CT-10

| | |
|---|---|
| Affirmation | 10 cas de test réellement exécutés via Playwright |
| Fichier source | `docs/PLAN_DE_TESTS.md` |
| Commande | `grep -ril playwright .` (hors node_modules) |
| Résultat attendu (réel) | Aucun fichier Playwright dans le dépôt |
| Capture à prendre | Le tableau CT-01→CT-10 du document, annoté avec la colonne "automatisé aujourd'hui" (voir audit) |
| Statut | **PARTIAL/NOT FOUND** — la logique métier de CT-01 et CT-06 est vérifiée dans le code ; aucun des 10 cas n'a de script Playwright versionné. À reformuler : "scénarios vérifiés manuellement / via API directe", sauf automatisation ultérieure |

## 08 — Bug de rechargement de session (CT-05)

| | |
|---|---|
| Affirmation | `recharger()` provoquait un démontage complet de l'écran Paramètres, effaçant le message de succès ; corrigé |
| Fichiers source | `frontend/src/session.tsx` (garde `aDejaCharge`), `frontend/src/App.tsx:516` (rendu conditionnel plein écran) |
| Commande | `git show 9964c3f -- frontend/src/session.tsx` |
| Résultat attendu | Diff montrant l'ajout de `aDejaCharge` |
| Capture à prendre | Voir `08-bug-session-ct05/01-parametres-message-succes.png` (déjà produite) + le diff Git ci-dessus |
| Statut | **VERIFIED** pour le mécanisme technique **et pour le comportement réel observé** (message affiché sans réinitialisation de l'écran, testé en conditions réelles). **PARTIAL** pour la narration "commit buggé puis commit de fix" (même commit unique) |

## 09 — Moteur dynamique de documents (CT-06)

| | |
|---|---|
| Affirmation | Catégorie "Esthétique" + "local à vendre/louer" → CNI + Licence + Facture d'électricité |
| Fichiers source | `backend/prisma/seed.ts:85`, `frontend/src/onboarding/EtapeLicence.tsx:72`, `EtapeFactureElectricite.tsx:72`, `backend/src/auth/auth.service.ts:197-204` |
| Commande | Lecture des fichiers ci-dessus (pas de test automatisé existant) |
| Résultat attendu | Les 3 conditions (`licenceRequise`, `proposeLocalAVendreOuLouer`) pilotent bien l'affichage des étapes et la vérification serveur |
| Capture à prendre | Voir `01` à `05` dans `09-moteur-documents-ct06/` (déjà produites) |
| Statut | **VERIFIED** dans le code (front + back) **et à l'exécution réelle** (parcours complet rejoué avec Playwright : catégorie → mode de service → CNI → Licence → Facture d'électricité) |

## 10 — Gestion de projet / chronologie

| | |
|---|---|
| Affirmation | "Scrum allégé", 7 étapes du 15/07 au 18/08/2026 |
| Fichier source | `docs/GESTION_DE_PROJET.md`, `backend/prisma/migrations/` (15 migrations réelles) |
| Commande | `git log --all --format="%h %ad %s" --date=short` |
| Résultat attendu | 5 commits (23/07 et 19/08/2026), 15 migrations réparties sur 5 journées (15/16/20 juillet, 4 et 18/19 août) |
| Capture à prendre | Le tableau chronologique reconstitué (voir `RNCP_KWIIK_AUDIT.md` section B) |
| Statut | **PARTIAL** — dates cohérentes mais "7 étapes"/"18 août" à corriger en "15 migrations"/"19 août" |

---

## Scripts de preuve reproductibles

- [`scripts/contraste-wcag.js`](scripts/contraste-wcag.js) — recalcul indépendant des ratios WCAG
- [`scripts/generer-erd.mjs`](scripts/generer-erd.mjs) — génère `docs/erd.mmd` depuis `schema.prisma`
- `backend/scripts/ct01-concurrence-reservation.ts` — test de concurrence réel (8 requêtes)
- `backend/src/auth/auth.service.hash.spec.ts`, `backend/src/utilisateurs.service.hash.spec.ts` — tests unitaires anti-fuite du hash

## Ce qui reste manuel (à faire vous-même avant la soutenance)

- Captures d'écran de l'application (nécessite de lancer frontend + backend + Postgres localement)
- Test de navigation clavier réel (Tab/Entrée/Echap) sur la modale de réservation — parcours détaillé dans `RNCP_KWIIK_AUDIT.md`
- Aucun test avec lecteur d'écran (NVDA) n'a été effectué — à faire manuellement si le jury le demande
