# Gestion de projet Agile — KWIIK

> Pilotage DevOps du développement : méthodologie, backlog, planning, gestion des compromis coûts/délais/qualité/risques, et procédures utilisateurs formalisées avec leurs résultats attendus. Reconstruit à partir de l'historique réel du projet (migrations de base de données, commits), pas d'un exemple générique.

## 1. Méthodologie et organisation

KWIIK est développé par un **développeur unique** (conception, code, tests, documentation) — il n'y a pas d'équipe de développement à coordonner. Le pilotage Agile ici ne consiste donc pas à répartir des tâches entre développeurs, mais à structurer le travail solo en incréments vérifiables et à interagir avec une **équipe de communication distincte**, en charge de la vulgarisation et de la promotion du projet à partir de son lancement (voir §5.1).

KWIIK est piloté en cycles courts de type **Scrum allégé** : chaque cycle livre un incrément fonctionnel vérifiable (compilation propre + test de bout en bout réel avant de passer au suivant), avec un point de contrôle explicite validé avant d'enchaîner sur le cycle suivant — pas de développement en silo sur plusieurs semaines sans revue.

Trois contraintes sont arbitrées à chaque cycle :
- **Coûts** : pas de dépendance à un service payant tant que la valeur n'est pas démontrée (paiement, email, SMS : tous simulés jusqu'à preuve de traction).
- **Délais** : cycles volontairement courts (un cycle = une fonctionnalité livrable), pour détecter les dérives tôt plutôt qu'en fin de projet.
- **Qualité** : aucun cycle n'est considéré terminé sans vérification de compilation (`tsc --noEmit`) ET un test de bout en bout réel (navigateur, pas juste unitaire) — voir `docs/PLAN_DE_TESTS.md`.

## 2. Planning réel du projet (reconstruit depuis les migrations de base de données)

```mermaid
gantt
    dateFormat YYYY-MM-DD
    title Planning reel KWIIK (dates des migrations Prisma)
    section Fondations
    Modele utilisateurs et donnees      :done, f1, 2026-07-15, 1d
    Code de verification (OTP initial)  :done, f2, 2026-07-15, 1d
    section Cœur metier prestataire
    Creneaux multi-demandes             :done, m1, 2026-07-16, 1d
    Localisation prestataire            :done, m2, 2026-07-16, 1d
    Photos et adresse                   :done, m3, 2026-07-16, 1d
    Multi-categories                    :done, m4, 2026-07-16, 1d
    Profil prive + galerie              :done, m5, 2026-07-20, 1d
    section Refonte onboarding
    Onboarding KYC + mode de service     :done, o1, 2026-08-04, 1d
    section Backlog post-audit (phases A-G)
    Favoris                             :done, b1, 2026-08-04, 1d
    Notifications                       :done, b2, 2026-08-04, 1d
    Messagerie                          :done, b3, 2026-08-04, 1d
    section Refonte authentification
    Email + mot de passe + Apple simule :done, a1, 2026-08-18, 1d
    section Refonte visuelle
    V5 (maquette Figma propagee)        :done, v1, 2026-08-18, 1d
```

## 3. Backlog produit (epics → user stories)

| Epic | User stories (extrait représentatif) | Statut |
|---|---|---|
| Authentification | En tant qu'utilisateur, je veux créer un compte par email/mot de passe ou Apple pour accéder à KWIIK sans dépendre d'un numéro de téléphone. | ✅ Livré |
| Onboarding prestataire | En tant que prestataire, je veux qu'on me demande uniquement les documents pertinents pour mon activité (licence, facture d'électricité) pour ne pas être bloqué par des démarches inutiles. | ✅ Livré |
| Réservation fiable | En tant que client, je veux être certain qu'un créneau réservé ne peut pas être attribué deux fois. | ✅ Livré |
| Paiement | En tant que client, je veux pouvoir choisir de payer en ligne ou à la livraison. | ✅ Livré (simulé) |
| Messagerie | En tant que client, je veux contacter un prestataire directement depuis sa fiche. | ✅ Livré |
| Découverte | En tant que client, je veux filtrer les prestataires par prix, note et mode de service. | ✅ Livré |
| Refonte visuelle | En tant que porteur de projet, je veux une identité visuelle professionnelle alignée sur une maquette de référence. | ✅ Livré (V5) |

## 4. Tableau Kanban (état actuel)

```mermaid
flowchart LR
    subgraph Termine["Termine"]
        direction TB
        T1["Auth email/mdp/Apple"]
        T2["Moteur documents dynamique"]
        T3["Refonte visuelle V5"]
        T4["Favoris / Notifications / Messagerie"]
    end
    subgraph EnCours["A traiter (risques ouverts)"]
        direction TB
        E1["Procedure sauvegarde DB (R7)"]
        E2["Rate-limiting connexion (R8)"]
        E3["Moderation des documents prestataire (R6)"]
    end
    subgraph Backlog["Backlog futur"]
        direction TB
        B1["Paiement operateur reel"]
        B2["Envoi d'email reel"]
        B3["Interface d'administration"]
    end
```

## 5. Procédures utilisateurs formalisées et résultats attendus

### 5.1 Interaction avec l'équipe de communication

Le développeur unique n'est pas isolé : une équipe de communication, distincte de l'équipe technique (ici, réduite à une personne), est chargée de la vulgarisation et de la promotion du projet à partir de son lancement. Cette équipe ne lit pas le code — elle consomme la documentation produit (`docs/CAHIER_DES_CHARGES.md` en priorité) pour construire son discours externe (grand public, prestataires à recruter, partenaires locaux).

Cela impose une contrainte concrète sur la façon dont la documentation est rédigée : chaque document produit (cahier des charges, ce document de gestion de projet, l'audit d'accessibilité, etc.) doit rester compréhensible par un interlocuteur non-développeur, avec un vocabulaire fonctionnel avant technique — c'est la raison pour laquelle chaque document de ce projet commence par un paragraphe de contexte en langage clair avant d'entrer dans le détail technique. C'est une application directe de l'adaptation du discours à l'auditoire (décideurs, futurs utilisateurs, partenaires) plutôt qu'à un seul public de développeurs.

Formaliser une procédure, c'est documenter le déroulé réel *et* le critère qui permet de dire qu'elle a réussi — pas juste décrire l'écran.

### 5.2 Inscription et connexion

```mermaid
flowchart TD
    Start([Utilisateur ouvre KWIIK]) --> Bienvenue[Ecran de bienvenue]
    Bienvenue --> Role{Client ou prestataire ?}
    Role -->|Client| FormeClient[Nom + email + mot de passe<br/>ou Continuer avec Apple]
    Role -->|Prestataire| FormeClient
    FormeClient --> Verif{Email deja utilise ?}
    Verif -->|Oui| Erreur[Erreur 409 explicite]
    Verif -->|Non| Creation[Compte cree, mot de passe hache]
    Creation --> Token[JWT emis, connexion immediate]
    Token --> Accueil([Atterrissage sur Accueil ou Boutique])
```

**Résultat attendu** : un compte est créé en moins de 3 étapes, sans blocage sur une pièce d'identité côté client ; en cas d'email déjà utilisé, l'utilisateur reçoit un message actionnable (pas un code d'erreur brut). Vérifié par test de bout en bout (voir `docs/PLAN_DE_TESTS.md`, cas CT-04).

### 5.3 Réservation d'une prestation

```mermaid
flowchart TD
    A([Client sur la fiche prestataire]) --> B[Choisit une prestation]
    B --> C[Choisit un creneau libre]
    C --> D{Mode de paiement}
    D -->|A la livraison| E[Reservation creee, statut en_attente]
    D -->|En ligne| F[Reservation creee + ligne Paiement en_attente]
    E --> G[Prestataire notifie]
    F --> G
    G --> H{Prestataire confirme ?}
    H -->|Oui, dans la fenetre de concurrence| I[Creneau verrouille, autres tentatives rejetees proprement]
    H -->|Non / refuse| J[Client notifie du refus]
```

**Résultat attendu** : aucune double réservation possible sur un même créneau, quel que soit le nombre de tentatives simultanées ; le client est notifié à chaque changement de statut. Vérifié par test de charge réel (8 requêtes concurrentes, voir `docs/ARCHITECTURE.md` §4).

### 5.4 Devenir prestataire (moteur de documents dynamique)

```mermaid
flowchart TD
    A([Compte cree]) --> B[Boutique : choix des prestations, 1 a 5]
    B --> C[Mode de service]
    C --> D{Adresse fixe ?}
    D -->|Oui| E[Adresse obligatoire a l'etape Profil pro]
    D -->|Non| F[Adresse optionnelle]
    C --> G{Local a vendre/louer coche ?}
    G -->|Oui| H[Etape Facture d'electricite ajoutee]
    G -->|Non| I[Etape ignoree]
    B --> J{Categorie exige une licence ?}
    J -->|Oui| K[Etape Licence ajoutee]
    J -->|Non| L[Etape ignoree]
    E & F & H & I & K & L --> M[CNI recto/verso, toujours requis]
    M --> N([Tableau de bord prestataire])
```

**Résultat attendu** : seuls les documents pertinents pour l'activité choisie sont demandés — pas de licence exigée pour un métier qui n'en a pas besoin, pas de facture d'électricité demandée à un prestataire sans local à vendre/louer. Vérifié par test de bout en bout avec la catégorie "Esthétique" (licence requise) + case "local à vendre/louer" cochée (voir `docs/PLAN_DE_TESTS.md`, cas CT-06).

## 6. Clôture et validation (rappel des pratiques déjà en place)

Chaque livraison de cycle suit un même protocole de clôture, aligné sur les bonnes pratiques CFTL de recette : compilation vérifiée des deux côtés (backend/frontend), scénario de bout en bout rejoué dans un navigateur réel, et un point de contrôle explicite communiqué avant de considérer le cycle terminé (voir les points de contrôle successifs documentés dans l'historique de ce projet).
