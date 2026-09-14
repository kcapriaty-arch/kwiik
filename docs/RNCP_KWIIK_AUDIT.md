# Audit RNCP KWIIK — Rapport final

Audit réalisé le 2026-09-14 sur le dépôt réel (5 commits Git, `ee84a9c`→`fb9b169`), en lecture puis en tests reproductibles. Aucune fonctionnalité n'a été créée après coup pour faire croire qu'elle existait historiquement ; les seuls ajouts sont des tests, un script de preuve, un script d'ERD, et une correction de configuration Jest (documentés en section D).

## A. Résumé exécutif

| Statut | Nombre d'affirmations |
|---|---|
| VERIFIED | 14 |
| PARTIAL | 12 |
| NOT FOUND | 8 |
| PROJECTED | 2 |

Le projet est globalement solide et cohérent avec le dossier RNCP. Les écarts trouvés sont presque tous des **formulations trop fortes ou des chiffres légèrement inexacts**, pas des affirmations fausses sur le fond. Le point le plus important à corriger : **Playwright et les 10 cas de test ne sont pas automatisés dans le dépôt**, malgré la formulation du plan de tests qui le laisse penser.

## B. Matrice des affirmations

| Compétence | Affirmation | Statut | Preuve code | Test | Capture | Correction dossier |
|---|---|---|---|---|---|---|
| Architecture | Chaîne Controller→Guard→Service→Prisma, aucun SQL brut | VERIFIED | `reservations.controller.ts:15-16`, `reservations.service.ts:16` | build backend OK | 01-architecture | RolesGuard utilisé sur 1 seule route ; à ne pas présenter comme RBAC généralisé |
| Architecture | 16 modèles Prisma (vs "~12") | PARTIAL | `schema.prisma` (16 `model`) | script ERD | 03-modele-donnees-erd | Corriger "12" → "16" |
| Architecture | Portabilité SGBDR sans réécriture métier | PARTIAL | `Prestataire.photosBoutique: String[]` (PostgreSQL-only) | — | — | Nuancer : config + adaptation ciblée du schéma |
| Concurrence | 8 requêtes concurrentes → 1 succès, 7×409, 0 double réservation | VERIFIED | `reservations.service.ts:119-196` + trigger DB | `ct01-concurrence-reservation.ts` exécuté 2× | 02-concurrence-reservation | Aucune — confirmé tel quel |
| Sécurité | Hash bcrypt jamais renvoyé | VERIFIED (code actuel) | `auth.service.ts:31-36`, `utilisateurs.service.ts:6-19` | 2 tests unitaires + capture API réelle | 04-securite-hash | — |
| Sécurité | "Vulnérabilité corrigée" (implique un incident) | NOT FOUND (comme incident réel) | `git log -S motDePasse` → 1 seul commit | — | — | Reformuler en "vulnérabilité anticipée et neutralisée dès la conception", pas "incident corrigé" |
| Accessibilité | Contraste étoile 2,03:1 → 4,98:1 | VERIFIED | `index.css:36-37` | `contraste-wcag.js` | 05-accessibilite | Aucune |
| Accessibilité | ~24 aria-label / ~8 fichiers | PARTIAL | grep réel : 27/9 | — | 05-accessibilite | Corriger les chiffres |
| Accessibilité | Cartes = vrais `<button>` (généralisé) | PARTIAL | vrai sur Découverte seulement | — | — | Préciser le périmètre |
| Accessibilité | Pas de piège clavier sur les modales | **PARTIAL confirmé par test réel** | pas de handler Echap trouvé | test clavier Playwright réel (2026-09-14) : Echap ne ferme pas la modale | `05-accessibilite/resultat-test-clavier.txt` | Ne pas affirmer "sans piège clavier" sans réserve ; fermeture fonctionne au clic (bouton croix) mais pas au clavier Echap |
| Risques | R1-R8, criticité = P×I | VERIFIED | `GESTION_DES_RISQUES.md`, recalcul manuel | — | 06-gestion-risques | Aucune |
| Tests | CT-01 à CT-10 "réellement exécutés via Playwright" | NOT FOUND | aucun fichier Playwright dans le dépôt | — | 07-plan-de-tests | Reformuler : "vérifiés manuellement / via API directe" |
| Tests | CT-01 (concurrence) | VERIFIED | mécanisme + trigger DB | test réel exécuté | 02-concurrence-reservation | — |
| Tests | CT-06 (moteur de documents) règle exacte | VERIFIED (logique) / NOT FOUND (auto) | seed.ts:85, EtapeLicence.tsx:72, auth.service.ts:197-204 | aucun test auto | 09-moteur-documents-ct06 | Préciser "vérifié manuellement" |
| CT-05 | Bug `recharger()` / unmount / perte du message | VERIFIED (mécanisme) | `session.tsx`, `App.tsx:516` | — | 08-bug-session-ct05 | — |
| CT-05 | "commit avant buggé" + "commit de fix" distincts | PARTIAL | même commit unique `9964c3f` | `git show` | 08-bug-session-ct05 | Reformuler : bug et fix découverts/corrigés dans la même session de travail |
| CT-05 | Fit RNCP "modifier un algorithme sans régression" | PARTIAL (avis) | diff minimal (1 `if` + 1 `ref`) | — | — | ACCEPTABLE FIT, pas STRONG FIT — voir section E |
| Projet | "Scrum allégé" | PARTIAL | pas d'artefact Scrum indépendant | — | 10-gestion-projet | Reformuler : "Agile en cycles courts, backlog, suivi reconstitué" |
| Projet | Kanban tenu | NOT FOUND (outil réel) | seulement Mermaid a posteriori | — | 10-gestion-projet | Présenter comme reconstitution, pas suivi en temps réel |
| Projet | "7 étapes, 15/07→18/08/2026" | PARTIAL | 15 migrations réelles, dernière le 19/08 | — | 10-gestion-projet | Corriger les bornes et le décompte |
| Onboarding | "Compte créé en moins de 3 étapes" | PARTIAL | 1 écran de formulaire, mais 3 écrans de navigation avant | — | — | Préciser la définition d'"étape" |
| Numérotation compétence | 3.4 vs 4.4 | NOT FOUND (dans ce dépôt) | absent de `docs/` | — | — | Vérifier dans le dossier RNCP externe, hors dépôt |
| ERD | `prisma-erd-generator` "installable proprement" | PROJECTED | non installé, compat Prisma 7 incertaine | script maison utilisé à la place | 03-modele-donnees-erd | Ne pas citer cet outil précis ; mentionner le script de génération réel |

## C. Tests exécutés

### 1. Test de concurrence CT-01
- **Commande** : `cd backend && npx tsx scripts/ct01-concurrence-reservation.ts`
- **Environnement** : NestJS `start:dev` local + conteneur Docker Postgres 16 dédié et isolé (`kwiik-test-db`, détruit après usage), 15 migrations Prisma appliquées via `prisma migrate deploy`
- **Date** : 2026-09-14
- **Résultat** : 2 exécutions, chacune `1 succès (200) / 7 conflits (409) / 0 autres`, `RESULTAT : CONFORME`
- **Observation** : le mécanisme applicatif (transaction + `updateMany` conditionnel) suffit à lui seul ; un trigger Postgres redondant (`trg_empecher_double_reservation_creneau`) constitue une seconde ligne de défense au niveau base de données, non mentionnée dans l'audit initial de la Phase 1.

### 2. Tests unitaires anti-fuite du hash bcrypt
- **Commande** : `cd backend && npm test`
- **Résultat** : `Test Suites: 3 passed, 3 total` / `Tests: 4 passed, 4 total`
- **Détail** : 2 nouveaux tests créés (`auth.service.hash.spec.ts`, `utilisateurs.service.hash.spec.ts`) + le test boilerplate existant

### 3. Vérification API réelle (sans hash)
- **Commande** : `curl` sur `/auth/inscription`, `/auth/moi`, `/utilisateurs/moi` (backend local + DB de test)
- **Résultat** : `grep -o "motDePasse[A-Za-z]*"` sur les 3 réponses → aucune occurrence
- **Preuve** : `docs/captures/rncp/04-securite-hash/reponses-api-sans-hash.json` (données factices, anonymisées)

### 4. Recalcul des contrastes WCAG
- **Commande** : `node docs/captures/rncp/scripts/contraste-wcag.js`
- **Résultat** : les 7 ratios recalculés correspondent exactement (à 0,01 près) aux valeurs du dossier, y compris 2,03:1 → 4,98:1

### 5. Génération de l'ERD
- **Commande** : `node docs/captures/rncp/scripts/generer-erd.mjs` puis `npx @mermaid-js/mermaid-cli`
- **Résultat** : `docs/erd.svg` et `docs/erd.png` générés, 16 entités avec PK/UK visibles

### 6. Build backend
- **Commande** : `cd backend && npm run build` (et `npx tsc --noEmit`)
- **Résultat** : succès, aucune erreur

### 7. Build frontend
- **Commande** : `cd frontend && npm run build`
- **Résultat** : succès (`✓ built in 571ms`, `dist/assets/index-*.js` généré)

### 8. Captures d'écran réelles de l'application (2026-09-14)
- **Environnement** : backend + frontend + Postgres de test seedé, lancés localement ; navigation pilotée par Playwright/Chromium (Edge en tant que binaire, téléchargement du Chromium officiel bloqué par le réseau du sandbox)
- **Résultat** : 8 captures produites (voir `docs/captures/rncp/05-accessibilite/`, `08-bug-session-ct05/`, `09-moteur-documents-ct06/`), données 100% fictives
- **Finding supplémentaire découvert pendant ce test** : la modale de réservation ne se ferme pas avec la touche **Echap** (testé réellement : Tab, Tab, Echap → dialog toujours visible). La fermeture au clic sur le bouton croix fonctionne. Ce point était suspecté en Phase 1 (absence de handler dans le code) et est maintenant **confirmé par exécution réelle**.

## D. Éléments créés (Phase 2)

- `docs/captures/rncp/` — structure de 10 dossiers de preuves + `README.md` index
- `docs/captures/rncp/scripts/contraste-wcag.js` — script de recalcul WCAG
- `docs/captures/rncp/scripts/generer-erd.mjs` — générateur d'ERD depuis `schema.prisma`
- `docs/captures/rncp/02-concurrence-reservation/resultat-ct01.txt` — sortie réelle du test de concurrence (2 exécutions)
- `docs/captures/rncp/04-securite-hash/reponses-api-sans-hash.json` — captures API anonymisées
- `docs/erd.mmd`, `docs/erd.svg`, `docs/erd.png` — diagramme entité-relation généré depuis le schéma réel
- `backend/scripts/ct01-concurrence-reservation.ts` — script de test de concurrence reproductible (nouveau)
- `backend/scripts/fixture-avis-demo.ts` — script ponctuel créant un avis de démonstration (donnée fictive) pour que l'étoile de notation soit visible lors des captures d'écran (nouveau)
- `docs/captures/rncp/05-accessibilite/`, `08-bug-session-ct05/`, `09-moteur-documents-ct06/` — 8 captures d'écran réelles de l'application (nouveau, voir section C.8)
- `backend/src/auth/auth.service.hash.spec.ts` — test unitaire (nouveau)
- `backend/src/utilisateurs.service.hash.spec.ts` — test unitaire (nouveau)
- `backend/package.json` — ajout d'un `moduleNameMapper` Jest (correction de configuration nécessaire pour que `ts-jest` résolve les imports `.js` du client Prisma 7 en mode `nodenext` ; sans cela, aucun test ne pouvait s'exécuter)
- `docs/RNCP_KWIIK_AUDIT.md` — le présent rapport

Aucune logique métier existante n'a été modifiée.

## E. Affirmations à corriger dans le dossier

**TEXTE ACTUEL** : "Le modèle de données compte une douzaine d'entités."
**PROBLÈME** : 16 modèles Prisma réels.
**FORMULATION RECOMMANDÉE** : "Le modèle de données compte 16 entités."

**TEXTE ACTUEL** : "Chaque exécution des tests a été réellement menée via Playwright/Chromium."
**PROBLÈME** : Playwright n'est installé nulle part dans le dépôt ; aucun fichier `.spec.ts` E2E n'existe.
**FORMULATION RECOMMANDÉE** : "Les scénarios CT-01 à CT-10 ont été vérifiés manuellement et par appels API directs ; leur automatisation via Playwright est une piste identifiée mais non réalisée." (Sauf si vous automatisez CT-01 réellement — auquel cas citez le script `ct01-concurrence-reservation.ts` créé lors de cet audit.)

**TEXTE ACTUEL** : "Une vulnérabilité a été identifiée puis corrigée : le hash du mot de passe pouvait être retourné dans les réponses API."
**PROBLÈME** : Aucune trace Git d'un état où le champ `motDePasseHash` existait sans être protégé — le champ et sa protection ont été introduits dans le même commit.
**FORMULATION RECOMMANDÉE** : "Le risque de fuite du hash a été anticipé et neutralisé dès l'introduction du champ `motDePasseHash` (select Prisma explicite + DTO dédié), sans qu'une exposition n'ait été commise dans le code versionné."

**TEXTE ACTUEL** : "Le bug de rechargement de session a été corrigé (commit de correction après un commit buggé)."
**PROBLÈME** : Le bug latent existait dès le premier commit, mais l'écran qui l'aurait révélé et son correctif sont arrivés dans le même commit.
**FORMULATION RECOMMANDÉE** : "Le bug a été diagnostiqué et corrigé au sein de la même session de développement ayant introduit l'écran concerné (commit unique) ; le raisonnement avant/après reste démontrable via le diff de ce commit."

**TEXTE ACTUEL** : "~24 aria-label répartis sur ~8 fichiers."
**PROBLÈME** : Comptage réel = 27 occurrences sur 9 fichiers.
**FORMULATION RECOMMANDÉE** : "27 `aria-label` répartis sur 9 fichiers."

**TEXTE ACTUEL** : "Approche Scrum allégé avec suivi Kanban."
**PROBLÈME** : Aucun artefact Scrum indépendant (sprints, rétrospectives) ; le Kanban est un diagramme Mermaid reconstitué a posteriori, pas un outil utilisé en temps réel.
**FORMULATION RECOMMANDÉE** : "Approche Agile en cycles courts, avec backlog en epics/user stories et suivi reconstitué a posteriori à partir de l'historique Git et des migrations (pas d'outil Kanban opérationnel utilisé en temps réel)."

**TEXTE ACTUEL** : "7 étapes entre le 15 juillet et le 18 août 2026."
**PROBLÈME** : 15 migrations réelles réparties sur 5 journées ; la dernière migration date du 19 août, pas du 18.
**FORMULATION RECOMMANDÉE** : "Chronologie reconstituée à partir de 15 migrations Prisma, entre le 15 juillet et le 19 août 2026."

**TEXTE ACTUEL** : "Changer de SGBDR n'impose aucune réécriture de la logique métier."
**PROBLÈME** : Un champ (`Prestataire.photosBoutique: String[]`) est un type PostgreSQL-only.
**FORMULATION RECOMMANDÉE** : "Changer de SGBDR affecterait principalement la configuration (adapter Prisma) et n'impose pas de réécriture de la logique métier applicative, mais nécessiterait une adaptation ciblée du schéma de données pour au moins un champ non portable."

**TEXTE ACTUEL** : "Compte créé en moins de trois étapes."
**PROBLÈME** : Le formulaire d'inscription est bien une étape unique, mais il est précédé de 2 écrans de navigation (Bienvenue, Choix du rôle).
**FORMULATION RECOMMANDÉE** : "Le formulaire d'inscription est une étape unique (un seul écran, un seul envoi) ; il est précédé de deux écrans de présentation/orientation."

## F. Preuves PowerPoint

### PREUVE P01
**Compétence** : Architecture logicielle
**Titre** : Séparation en couches Controller → Guard → Service → Prisma
**Ce qu'elle démontre** : respect d'une architecture en couches, aucun SQL brut
**Écran/fichier à ouvrir** : `backend/src/reservation/reservations.controller.ts` (lignes 1-40) et `reservations.service.ts` (lignes 119-196)
**Commande éventuelle** : aucune
**Zone exacte à capturer** : le décorateur `@UseGuards(JwtAuthGuard)` du contrôleur + la méthode `confirmer()` avec sa transaction
**Informations à masquer** : aucune (pas de donnée personnelle)
**Légende recommandée** : "Chaîne Controller → Guard → Service → PrismaService, sans accès SQL direct"

### PREUVE P02
**Compétence** : Gestion de la concurrence / intégrité des données
**Titre** : Protection contre le double-booking (CT-01)
**Ce qu'elle démontre** : garantie transactionnelle + trigger DB, testée avec 8 requêtes concurrentes
**Écran/fichier à ouvrir** : terminal, sortie de `npx tsx scripts/ct01-concurrence-reservation.ts`
**Commande éventuelle** : `cd backend && npx tsx scripts/ct01-concurrence-reservation.ts` (nécessite Postgres de test)
**Zone exacte à capturer** : le bloc de résultats (8 requêtes + bilan HTTP + vérification en base)
**Informations à masquer** : aucune (données de test fictives)
**Légende recommandée** : "1 succès, 7 rejets 409, 0 double réservation — testé réellement"

### PREUVE P03
**Compétence** : Modélisation de données
**Titre** : ERD généré depuis le schéma Prisma réel
**Ce qu'elle démontre** : modèle de données réel à 16 entités
**Écran/fichier à ouvrir** : `docs/erd.png`
**Commande éventuelle** : `node docs/captures/rncp/scripts/generer-erd.mjs`
**Zone exacte à capturer** : recadrage sur le cœur métier (Utilisateur, Prestataire, Reservation, Creneau, Prestation) pour la lisibilité en slide
**Informations à masquer** : aucune
**Légende recommandée** : "Modèle de données KWIIK — 16 entités (généré automatiquement depuis schema.prisma)"

### PREUVE P04
**Compétence** : Sécurité des données
**Titre** : Le hash du mot de passe n'est jamais exposé
**Ce qu'elle démontre** : `select` Prisma explicite + DTO, vérifié par test unitaire et appel API réel
**Écran/fichier à ouvrir** : `docs/captures/rncp/04-securite-hash/reponses-api-sans-hash.json`
**Commande éventuelle** : `cd backend && npm test`
**Zone exacte à capturer** : le JSON de réponse `/auth/moi` (sans `motDePasseHash`)
**Informations à masquer** : données déjà fictives/anonymisées
**Légende recommandée** : "Aucune donnée sensible dans les réponses API — vérifié par test automatisé"

### PREUVE P05
**Compétence** : Accessibilité
**Titre** : Correction de contraste WCAG (2,03:1 → 4,98:1)
**Ce qu'elle démontre** : application réelle de la formule de luminance relative WCAG
**Écran/fichier à ouvrir** : terminal, sortie de `contraste-wcag.js` + écran Vitrine (étoile de notation)
**Commande éventuelle** : `node docs/captures/rncp/scripts/contraste-wcag.js`
**Zone exacte à capturer** : la ligne "Etoile notation" avant/après dans le terminal
**Informations à masquer** : aucune
**Légende recommandée** : "Contraste recalculé indépendamment : conforme WCAG AA après correction"

### PREUVE P07
**Compétence** : Accessibilité / moteur métier dynamique
**Titre** : Parcours d'onboarding CT-06 réellement rejoué
**Ce qu'elle démontre** : la règle "Esthétique + local à vendre/louer → CNI + Licence + Facture" fonctionne réellement à l'écran, pas seulement dans le code
**Écran/fichier à ouvrir** : `docs/captures/rncp/09-moteur-documents-ct06/02-mode-service-local-vendre-louer.png` et `04-etape-licence.png`
**Commande éventuelle** : aucune (captures déjà produites)
**Zone exacte à capturer** : la case cochée "Je propose aussi un local à vendre ou à louer" + la barre de progression 4/6 sur l'étape Licence
**Informations à masquer** : aucune (compte de démonstration fictif)
**Légende recommandée** : "Parcours d'onboarding rejoué réellement : les 3 documents (CNI, Licence, Facture) sont bien demandés selon la catégorie et l'option choisies"

### PREUVE P06 (secondaire)
**Compétence** : Modification d'un algorithme existant sans régression
**Titre** : Correction du bug de rechargement de session
**Ce qu'elle démontre** : diagnostic d'un effet de bord React, correction ciblée
**Écran/fichier à ouvrir** : `git show 9964c3f -- frontend/src/session.tsx`
**Commande éventuelle** : `git show 9964c3f -- frontend/src/session.tsx`
**Zone exacte à capturer** : le diff montrant l'ajout de `aDejaCharge`
**Informations à masquer** : aucune
**Légende recommandée** : "Diagnostic et correction d'un effet de bord de rendu React — voir note de fit ACCEPTABLE en annexe"

## G. Preuves dossier (annexes)

| Preuve | Type | Annexe recommandée |
|---|---|---|
| ERD complet (`docs/erd.svg`) | Diagramme | Annexe "Modèle de données" |
| Tableau de contrastes recalculés | Tableau | Annexe "Accessibilité" |
| Sortie du test CT-01 (2 exécutions) | Sortie de test | Annexe "Tests et qualité" |
| Extrait `reservations.service.ts:144-186` | Extrait de code | Annexe "Architecture / concurrence" |
| Diff `git show 9964c3f` (session.tsx) | Avant/après | Annexe "Résolution de bug" |
| Registre des risques R1-R8 | Matrice | Annexe "Gestion des risques" |
| Tableau chronologique (15 migrations) | Tableau | Annexe "Gestion de projet" |
| JSON API sans hash | Capture | Annexe "Sécurité" |

## H. Éléments impossibles à prouver

- **Test avec lecteur d'écran réel (NVDA/VoiceOver)** : NVDA non disponible dans cet environnement CLI ; aucun test de ce type n'a été (ni ne peut être) effectué ici. À faire manuellement avant la soutenance si possible.
- **Exécution historique réelle de Playwright** : jamais committée, donc impossible à reconstituer après coup sans la fabriquer — ce qui est explicitement exclu par la règle de non-fabrication.
- **Preuve Git d'un cycle bug→fix en deux commits distincts pour CT-05** : le dépôt ne contient que 5 commits, et bug + fix sont dans le même commit. Impossible de présenter une paire avant/après distincte sans reconstituer artificiellement un faux historique.
- **Numérotation exacte de la compétence RNCP (3.4 vs 4.4)** : ce référentiel n'existe pas dans le dépôt de code ; à vérifier directement dans le dossier RNCP / la fiche de compétences officielle.
- **Preuve qu'un outil Kanban a été utilisé en temps réel pendant le projet** : aucune trace (pas d'export Trello/Jira/GitHub Projects) ; seul un diagramme récapitulatif a posteriori peut être présenté, explicitement étiqueté comme tel.

---

## Contrôle final de l'environnement (Phase 2)

- Backend : `npm run build` → succès, aucune erreur de compilation
- Backend : `npx tsc --noEmit` → succès
- Backend : `npm test` → 3 suites, 4 tests, tous passés
- Frontend : `npm run build` → succès (`vite build`, 571ms)
- Prisma : `npx prisma migrate deploy` → 15 migrations appliquées sans erreur sur une base de test isolée
- Conteneur de test Postgres (`kwiik-test-db`) : détruit après usage, aucune trace laissée
- `.env` de test : créé temporairement pour les tests, supprimé après usage (le vrai `.env` n'a jamais été commité ni modifié — `.gitignore` le couvre)
- `git status` : fichiers créés listés en section D ; `backend/package.json` et les deux `package-lock.json` modifiés (ajout de `moduleNameMapper` Jest + résolution de dépendances `npm install`) — **rien n'a été committé ni poussé**
- Aucune donnée personnelle réelle dans les preuves produites (données de test fictives, emails `*.local`, IDs générés)
- Aucun secret ajouté au dépôt
