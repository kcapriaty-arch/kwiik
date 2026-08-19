# Accessibilité et normes de présentation — KWIIK

> Document de référence : conformité aux recommandations d'accessibilité (WCAG 2.1), méthode de maquettage utilisée, et vérifications concrètes menées sur l'interface KWIIK — pas une déclaration de principe, des mesures réelles.

## 1. Niveau visé et méthode

KWIIK vise le niveau **WCAG 2.1 AA**, le niveau attendu pour la majorité des services numériques grand public. La démarche suivie n'est pas déclarative : chaque couleur de la palette a été vérifiée par calcul de contraste réel (formule de luminance relative WCAG), pas à l'œil.

**Outils de maquettage utilisés** : maquette de référence conçue et validée sur Figma Make (voir `docs/CAHIER_DES_CHARGES.md` §8), puis les jetons de couleur qui en sont extraits sont centralisés dans un unique fichier de thème (`frontend/src/index.css`, bloc `@theme`) — un seul point de vérité, ce qui permet de revalider l'accessibilité de toute l'application en une seule vérification plutôt qu'écran par écran.

## 2. Vérification des contrastes (calcul réel, formule WCAG)

| Paire | Contraste calculé | Seuil requis | Statut |
|---|---|---|---|
| Texte principal `#0D0D12` / fond `#F5F4F1` | **17.62:1** | 4.5:1 (AA texte normal) | ✅ Largement conforme (AAA) |
| Texte blanc / bouton indigo `#2D1FE8` | **8.49:1** | 4.5:1 | ✅ Conforme (AAA) |
| Texte `#0D0D12` / badge lime `#C8FF47` | **16.48:1** | 4.5:1 | ✅ Conforme (AAA) |
| Texte secondaire (`muted`) `#6E6D6A` / fond `#F5F4F1` | **4.70:1** | 4.5:1 | ✅ Conforme AA (à ne pas utiliser sous 14px pour rester confortable) |
| Lien indigo `#2D1FE8` / fond blanc | **8.49:1** | 4.5:1 | ✅ Conforme (AAA) |
| Étoile de notation, valeur initiale `#F5A623` / blanc | **2.03:1** | 4.5:1 | ❌ **Non conforme — corrigé** |
| Étoile de notation, valeur corrigée `#976600` / blanc | **4.98:1** | 4.5:1 | ✅ Conforme AA |

**Anomalie réelle trouvée et corrigée pendant cet audit** : la couleur ambrée utilisée pour l'affichage des notes (`★ 4.9`) ne passait pas le seuil AA sur fond blanc (2.03:1, très en dessous du minimum). Elle a été remplacée par un ambre plus soutenu (`#976600`, 4.98:1) dans `frontend/src/index.css` (jeton `--color-amber-star`) — un seul changement, propagé partout où la note est affichée grâce à la centralisation des jetons de couleur.

## 3. Structure sémantique et navigation clavier

- **Boutons réels plutôt que des `div` cliquables** : les cartes prestataire de l'écran Découverte étaient initialement des `<article role="button">` — remplacées par de vrais éléments `<button>`, ce qui donne gratuitement le focus clavier, l'activation par `Entrée`/`Espace`, et la sémantique correcte aux lecteurs d'écran, sans JavaScript supplémentaire.
- **Labels sur les boutons icône uniquement** : 8 fichiers du frontend portent des attributs `aria-label` (24 occurrences au total) sur les boutons qui n'ont pas de texte visible (retour, notifications, favoris, fermeture de panneau, filtres actifs).
- **États de chargement annoncés** : le composant `SquelettesCartes` (`frontend/src/ui.tsx`) porte `role="status"` et `aria-label="Chargement en cours"`, pour que les lecteurs d'écran signalent l'attente au lieu de rester silencieux.
- **Modales correctement balisées** : le panneau de filtres (Découverte) et les fenêtres de confirmation utilisent `role="dialog"` + `aria-modal="true"`.

## 4. Adaptabilité aux différents niveaux de handicap

| Type de handicap | Mesure prise |
|---|---|
| Visuel (basse vision) | Contrastes vérifiés (§2), tailles de police jamais en dessous de 11px, aucune information transmise par la couleur seule (les badges "Vérifié"/"Premium" portent aussi du texte, pas juste une pastille colorée). |
| Visuel (cécité, lecteur d'écran) | Boutons réels, `aria-label` sur les icônes, `alt` sur les images de profil/lieu, `aria-hidden="true"` sur les icônes strictement décoratives pour ne pas polluer la lecture. |
| Moteur (navigation clavier/switch) | Tous les éléments interactifs sont des `<button>`/`<input>`/`<a>` natifs, focusables par tabulation, sans piège au clavier dans les modales (fermeture par bouton dédié). |
| Cognitif | Messages d'erreur explicites et actionnables (ex. "Cette adresse email est déjà utilisée" plutôt qu'un code d'erreur), pas de jargon technique exposé à l'utilisateur final. |

## 5. Limites connues (transparence)

- Pas encore de test avec un lecteur d'écran réel (NVDA/VoiceOver) au-delà de l'inspection du DOM et des attributs ARIA — à prévoir avant une mise en production.
- Le contraste `muted` (4.70:1) est conforme AA mais pas AAA (7:1) : acceptable pour du texte secondaire, à surveiller s'il est réutilisé pour du texte plus petit que 14px.
