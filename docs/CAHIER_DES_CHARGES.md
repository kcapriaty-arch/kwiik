# Cahier des charges — KWIIK

> Document de référence du projet. Objectif : que n'importe quel contributeur, même peu expérimenté, puisse comprendre le projet, reprendre le travail en cours ou y participer sans avoir à interroger quelqu'un d'autre au préalable.
>
> **Statut :** backlog fonctionnel complet et vérifié de bout en bout. Authentification email/mot de passe + Apple (simulée) et moteur de documents dynamique prestataire implémentés et vérifiés (voir §3). Refonte visuelle V5 (calquée sur une maquette Figma précise) propagée à l'ensemble des écrans et vérifiée de bout en bout (voir §8).

## Sommaire

1. [Vision & contexte](#1-vision--contexte)
2. [Utilisateurs & rôles](#2-utilisateurs--rôles)
3. [Parcours d'inscription](#3-parcours-dinscription)
4. [Fonctions côté client](#4-fonctions-côté-client)
5. [Fonctions côté prestataire](#5-fonctions-côté-prestataire)
6. [Architecture technique](#6-architecture-technique)
7. [Modèle de données](#7-modèle-de-données)
8. [Historique de la direction visuelle](#8-historique-de-la-direction-visuelle)
9. [Ce qui est verrouillé](#9-ce-qui-est-verrouillé)
10. [Points ouverts](#10-points-ouverts)
11. [Documents complémentaires](#11-documents-complémentaires)

---

## 1. Vision & contexte

KWIIK est un **projet personnel**, porté par un développeur unique, qui vise à transposer le modèle de Planity — plateforme de référence en France pour la réservation de prestations de beauté et de bien-être — vers les marchés africains (Cameroun en premier lieu : Douala, Yaoundé...), en l'adaptant à leurs **exigences de conformité propres** plutôt qu'en copiant tel quel un modèle pensé pour un contexte réglementaire européen. C'est cette adaptation qui explique des choix produit qui n'ont pas d'équivalent chez Planity : pièce d'identité obligatoire pour tout prestataire, licence professionnelle conditionnelle selon le métier, justificatif de propriété/location pour les prestataires qui présentent un local (voir §3).

L'objectif est de sortir du "carnet de contacts WhatsApp" pour offrir une vraie vitrine professionnelle aux prestataires — photos, catalogue de prestations, agenda, avis vérifiés — et une expérience de réservation simple et rassurante côté client.

Le positionnement visé n'est pas low-cost : l'ambition est un rendu **haut de gamme**, qui inspire confiance à des prestataires qualifiés (donc capable d'attirer des professionnels sérieux) et rassure des clients qui n'ont pas l'habitude de réserver un service en ligne.

**Gouvernance du projet** : développement intégralement assuré par un développeur unique (conception, code, tests, documentation). Une équipe de communication distincte est en charge de la vulgarisation et de la promotion du projet à partir de son lancement — elle n'intervient pas sur le développement, mais consomme la documentation produit (ce cahier des charges notamment) pour construire son discours externe. Cette séparation des rôles est reprise dans `docs/GESTION_DE_PROJET.md` (§1, §5.1).

## 2. Utilisateurs & rôles

### Client
- Recherche un service par catégorie et ville
- Consulte une vitrine prestataire (photos, avis, catalogue)
- Réserve un créneau, paie en ligne (simulé) ou à la livraison
- Met des prestataires en favoris, échange par messagerie
- Reçoit des notifications, laisse un avis après la prestation

### Prestataire
- Crée une vitrine (1 à 5 catégories, mode de service)
- Gère son catalogue de prestations et son agenda de créneaux
- Reçoit les demandes, confirme / refuse / démarre / termine
- Échange par messagerie, reçoit des notifications
- Peut obtenir un badge "vérifié" (attribué manuellement, voir §5)

Un même compte peut être client et prestataire à la fois (deux espaces distincts accessibles depuis la même session). L'inscription se fait par email + mot de passe (ou Apple), voir §3 — le téléphone n'est plus demandé qu'ensuite, dans le profil.

## 3. Parcours d'inscription

> **Changement d'architecture, implémenté et vérifié (remplace la V1 téléphone/OTP décrite plus haut dans l'historique du projet).** L'inscription par numéro de téléphone + code OTP a été retirée du parcours d'inscription et remplacée par email + mot de passe (ou Apple simulé). Le téléphone est un champ optionnel demandé depuis l'écran "Paramètres du compte" (Profil → Paramètres du compte), avec confirmation d'email et changement de photo de profil au même endroit. Testé de bout en bout : inscription client (atterrissage direct sur Accueil, sans CNI), inscription prestataire avec le moteur de documents dynamique (boutique → mode de service + case "local à vendre/louer" → CNI → licence conditionnelle → facture d'électricité conditionnelle → profil pro).

### Client
1. **Bienvenue** — écran d'accueil avant connexion, puis choix du rôle (client / prestataire).
2. **Créer un compte / se connecter** — nom, prénom, email, mot de passe ; ou "Continuer avec Apple". Ni l'envoi d'email réel ni Apple Sign-In réel ne sont câblés pour l'instant : les deux sont **simulés** sur le même principe que l'ancien code SMS (`codeDev`) — un code de confirmation s'affiche directement dans l'interface en dev, et le bouton Apple simule une connexion sans compte Apple réel.
3. **Accueil** — atterrissage direct sur l'écran d'accueil client. Téléphone, confirmation d'email et photo de profil sont désormais des étapes **facultatives**, proposées depuis l'écran Profil (pas bloquantes à l'inscription) :
   - **Numéro de téléphone** — optionnel, ajouté depuis le profil.
   - **Confirmation d'email** — recommandée pour recevoir les notifications ; simulée en dev (code affiché dans l'UI).
   - **Photo de profil** — optionnelle.

### Prestataire
1. **Créer un compte / se connecter** — étape commune avec le parcours client (email + mot de passe, ou Apple).
2. **Boutique — choix des prestations** — le prestataire choisit toutes les prestations qu'il réalise (jusqu'à 5 catégories). C'est ce choix qui détermine dynamiquement les documents demandés à l'étape suivante (voir tableau ci-dessous), pas une étape "licence" isolée comme avant.
3. **Documents requis (dynamique)** — calculés à partir des prestations choisies :

   | Document | Condition |
   |---|---|
   | CNI recto/verso | Toujours requis, pour tout prestataire |
   | Licence professionnelle | Si une des catégories choisies l'exige réglementairement (ex. esthétique, massage, électricité, soins à domicile) |
   | Adresse de la boutique | Si le mode de service est "à une adresse fixe" (local physique) |
   | Facture d'électricité à son nom | Si le prestataire présente un local à la manière d'un Airbnb, ou propose de vendre/louer un local |

4. **Mode de service** — à une adresse fixe, à domicile (chez le client), ou en ligne.
5. **Profil pro** — ville, description, photo du lieu / de la boutique.
6. **Tableau de bord** — atterrissage sur l'espace prestataire (demandes, prestations, créneaux, messages).

Le magasin d'étapes reste conçu pour être **reprenable** : si l'utilisateur quitte en cours de route, il reprend exactement à la première étape incomplète à la prochaine connexion.

## 4. Fonctions côté client

- **Recherche & découverte** — recherche par mot-clé/catégorie et ville, avec un panneau de filtres : tri (pertinence, prix croissant/décroissant, meilleures notes) et filtre par mode de service.
- **Vitrine prestataire** — photos, catalogue de prestations avec prix et durée, avis avec note moyenne, badge "vérifié" le cas échéant, bouton favoris, bouton "Contacter".
- **Réservation** — choix d'une prestation puis d'un créneau libre ; paiement à la livraison ou en ligne (simulé, choix de l'opérateur Orange Money / MTN MoMo, sans vrai appel opérateur).
- **Favoris** — liste dédiée des prestataires enregistrés.
- **Messagerie** — conversation réelle par prestataire (pas de WebSocket, rafraîchissement par sondage ~5s).
- **Notifications** — centre de notifications dans l'app (réservation confirmée/refusée/terminée, nouveau message) ; pas de notification push téléphone.
- **Avis** — laissé après qu'une prestation soit marquée terminée.

## 5. Fonctions côté prestataire

- **Tableau de bord** — demandes reçues avec actions confirmer / refuser / démarrer / terminer.
- **Prestations** — création et modification (titre, description, prix, durée, photo).
- **Créneaux** — création de disponibilités ; un créneau passé ou déjà réservé ne peut pas être re-proposé (protection anti-double-réservation en base).
- **Messagerie & notifications** — mêmes écrans que côté client, accessibles depuis la navigation prestataire.
- **Abonnements** — trois paliers (Découverte, Pro, Premium) qui influencent la priorité d'affichage dans les résultats de recherche.
- **Vérification** — badge "vérifié" activable via un endpoint réservé aux comptes admin (attribués manuellement en base pour l'instant, aucune interface d'administration dédiée).

## 6. Architecture technique

### Backend
- NestJS (modules / contrôleurs / services)
- Prisma ORM + PostgreSQL
- Authentification JWT, garde de rôles (`@Roles()`)
- Upload de fichiers (CNI, photos) sur disque local

### Frontend
- React + TypeScript, Vite
- Tailwind CSS v4 (thème via jetons `@theme`)
- Pas de librairie de state global — hooks + contexte de session
- "Temps réel" par sondage (notifications 20 s, messages 5 s)

Le paiement et les notifications push ne sont volontairement pas connectés à de vrais services externes à ce stade (voir §10) — le reste de l'application fonctionne sur de vraies données, sans mock.

## 7. Modèle de données (résumé)

| Entité | Rôle |
|---|---|
| `Utilisateur` | Compte, téléphone, rôle, CNI, photo de profil |
| `Prestataire` | Vitrine liée à un utilisateur : catégories, ville, mode de service, abonnement, badge vérifié |
| `Categorie` / `Domaine` | Métiers proposés, regroupés par domaine (ex. Beauté, Maison) |
| `Prestation` | Service facturable : titre, prix, durée, photo |
| `Creneau` | Disponibilité horaire d'un prestataire (statut libre / réservé) |
| `Reservation` | Demande client sur un créneau + une prestation, avec statut et mode de paiement |
| `Paiement` | Ligne de paiement simulée liée à une réservation en ligne |
| `Avis` | Note + commentaire client après prestation terminée |
| `Favori` | Association utilisateur ↔ prestataire |
| `Notification` | Événement notifiable (réservation, message, système) |
| `Conversation` / `Message` | Fil de discussion client ↔ prestataire |
| `Abonnement` | Palier prestataire (Découverte / Pro / Premium) |

## 8. Historique de la direction visuelle

Le fonctionnel est stable ; c'est l'habillage visuel qui a changé plusieurs fois et qui reste à arbitrer.

| Version | Statut | Description |
|---|---|---|
| **V1** | remplacée | Terracotta / orange / or — inspiration "Findora". Palette chaude façon immobilier haut de gamme. Jugée finalement trop générique/template. |
| **V2** | remplacée | Minimaliste noir / blanc / bronze — inspiration Apple / Linear. Un seul accent, cartes à bordures fines. Jugée trop froide / pas assez à l'image du secteur. |
| **V3** | remplacée | Éditorial photographique — inspiration Planity seule. Photographie réelle en pleine largeur, titres en serif, filet d'accent fin, liens discrets soulignés. Jugée encore trop éloignée de la référence réelle. |
| **V4** | remplacée | Mélange Planity + Airbnb (recherche en pilule, cartes façon Airbnb, ton éditorial Planity). Corail `#FF385C`. Remplacée dès qu'une maquette Figma précise et complète a été fournie (V5). |
| **V5** | en cours | Calquée sur une maquette Figma Make complète et interactive fournie par l'utilisateur (4 écrans réels : Accueil, Explorer, Réservations, Profil). Jetons de couleur et police extraits par inspection directe du DOM de la maquette (`getComputedStyle`), pas estimés à l'œil. Voir détail ci-dessous. |

### V5 — spécification précise

**Source :** maquette Figma Make "Marketplace avec réservation en ligne" (lien fourni par l'utilisateur, capturée et inspectée en direct — 4 écrans : Accueil, Explorer, Réservations, Profil).

**Jetons exacts extraits de la maquette :**
- Police : **Outfit** (Google Font), poids 900 pour les titres et boutons, 600 pour les libellés secondaires.
- Accent primaire (indigo électrique) : `#2D1FE8` — utilisé pour les boutons "Réserver", le prix, les icônes actives, les liens "Voir tout".
- Accent secondaire (lime) : `#C8FF47` — réservé aux badges/mises en avant ponctuelles (bannière "Pour les pros", badge "Compte vérifié"), jamais en fond général.
- Fond de page : `#F5F4F1` (blanc cassé chaud) ; cartes en blanc pur `#FFFFFF`.
- Texte principal : `#0D0D12` (quasi noir) ; texte secondaire : `#6E6D6A`.
- Rayons très arrondis (boutons ~18px, tuiles de catégories en carré arrondi, avatars en cercle parfait).

**Composants observés et repris :**
- Catégories : tuiles carrées à coins arrondis, chacune sur un fond pastel distinct (rose, lavande, bleu pâle, jaune pâle, pêche, vert pâle) avec icône de la même teinte plus foncée — pas un ton neutre unique.
- Bannière promotionnelle : aplat indigo plein (pas de photo), libellé en majuscules lime, titre blanc, bouton pilule lime.
- Cartes prestataire : photo, badge (disponibilité ou vérification), nom en gras + note en étoile ambrée sur la même ligne, sous-titre gris (métier · ville), prix en gras indigo, bouton "Réserver" pilule indigo pleine largeur.
- Navigation basse à 4/5 onglets avec icône + libellé, item actif en indigo.

Ce standard V5 est propagé à l'ensemble des écrans (Accueil, Découverte, Vitrine, Mes réservations/créneaux/prestations, Tableau de bord prestataire, Messages, notifications, favoris, profil) et vérifié en conditions réelles côté client et côté prestataire, sans erreur console. Au passage, un vrai bug d'affichage a été corrigé : le libellé des onglets de navigation basse (mode prestataire, 6 onglets) débordait et se chevauchait au lieu de tronquer proprement — le `truncate` CSS n'avait aucun effet tant que l'élément n'était pas explicitement contraint en largeur.

## 9. Ce qui est verrouillé

Validé et testé de bout en bout (parcours complets côté client et côté prestataire, sans erreur console ni régression) :

- Correction de la concurrence sur la confirmation de réservation (deux confirmations simultanées ne peuvent plus toutes les deux réussir)
- Édition de prestation, retrait des faux boutons, gestion des créneaux déjà pris
- Badge de vérification prestataire (endpoint admin)
- Favoris, centre de notifications, messagerie réelle
- Paiement en ligne simulé (statut en attente → simulation → réussi)
- Squelettes de chargement, filtres de recherche, passe d'accessibilité
- Authentification email + mot de passe + Apple simulé, téléphone/confirmation email/photo déplacés dans "Paramètres du compte"
- Moteur de documents dynamique prestataire (CNI, licence conditionnelle, adresse conditionnelle, facture d'électricité conditionnelle)
- Deux failles de sécurité corrigées au passage : le hash du mot de passe fuitait dans les réponses de `/auth/*` et `/utilisateurs/moi` ; un doublon de téléphone/email provoquait une erreur 500 brute au lieu d'un message propre
- Refonte visuelle V5 propagée à l'ensemble des écrans (voir §8), y compris la correction du chevauchement des libellés de la navigation basse en mode prestataire

## 10. Points ouverts

### Décisions à prendre maintenant
- **Photographie** — seulement 5 photos de démonstration existent (coiffure, ménage, plomberie, esthétique, traiteur) ; une direction très photo-dépendante demandera d'en obtenir davantage.
- **Risques ouverts non traités** — procédure de sauvegarde/restauration de la base (R7), limitation des tentatives sur `/auth/connexion` (R8), modération humaine des documents prestataire (R6). Détail dans `docs/GESTION_DES_RISQUES.md`.

### Hors périmètre pour l'instant (choix assumé, pas un oubli)
- Paiement réel (Orange Money / MTN MoMo) — nécessite des identifiants opérateur
- Envoi d'email réel et Apple Sign-In réel — nécessiteraient un fournisseur email et un compte développeur Apple ; tous deux simulés pour l'instant, sur le principe du mock SMS d'origine
- Notifications push téléphone — nécessiterait une PWA/app native
- Carte interactive sur la vitrine — nécessiterait une clé API (Google Maps/Mapbox)
- Interface d'administration complète — la promotion en admin reste une commande manuelle en base

## 11. Documents complémentaires

Ce cahier des charges couvre le produit (fonctionnel, parcours, données). Les aspects architecture, qualité, sécurité, accessibilité, gestion de projet et tests sont détaillés dans des documents dédiés, tous dans `docs/` :

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — architecture en couches, indépendance au mode de stockage, normes de qualité, diagramme entité-association, traitement d'un cas de concurrence réel.
- [`ACCESSIBILITE.md`](./ACCESSIBILITE.md) — conformité WCAG 2.1 AA, contrastes vérifiés par calcul, structure sémantique et navigation clavier.
- [`GESTION_DES_RISQUES.md`](./GESTION_DES_RISQUES.md) — registre des risques, matrice de criticité, mesures prises ou prévues.
- [`GESTION_DE_PROJET.md`](./GESTION_DE_PROJET.md) — méthodologie Agile, planning réel, backlog, procédures utilisateurs formalisées avec résultats attendus.
- [`PLAN_DE_TESTS.md`](./PLAN_DE_TESTS.md) — jeux d'essai exécutés, résultats obtenus, anomalies trouvées et corrigées.
- [`SUIVI_CHARGE.md`](./SUIVI_CHARGE.md) — outil de suivi utilisé, écarts entre disponibilité théorique et réelle, avancement du backlog.
