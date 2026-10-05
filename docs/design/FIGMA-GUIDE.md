# Guide de maquette Figma — Trade in DRC

> Direction visuelle : **« Document commercial »** (encre `#0A1E33`, or `#C9A227`, blanc `#F6F4EF`, filet `#D6D2C8`)
> Version 2 · 2026-09-24 · Remplace la v1 (serif + rouge tampon, abandonnée).
> Sources : audit du code (`src/app/[locale]/**`, `src/components/**`, `src/app/globals.css`, `src/config/navigation.ts`) et document de décisions *Trade in DRC — Contexte du projet* (§3 à §9).
> Fichier Figma de référence (structurel, pas la direction finale) : `Acum7uOE9NA3phegWOSleH`.

Ce guide sert à produire **une nouvelle maquette Figma** qui devient la source de vérité visuelle. Les maquettes existantes restent des gabarits structurels : on reprend leur contenu et leur ordre, pas leur habillage.

---

## 1. Inventaire de l'existant

### 1.1 Pages (102 `page.tsx`) et devenir dans la nouvelle arborescence

| Groupe actuel | Routes | Devenir | Maquette |
|---|---|---|---|
| Accueil | `/`, `/home-classic` | Accueil refondu en 11 sections ; `home-classic` supprimé | **Oui** |
| Produits | `/products`, `/products/[id]`, `/products/standards`, `/products/export-guide` | → `/market` (hub) ; fiche produit → **fiche d'offre** ; normes et guide → page « Se conformer » | **Oui** |
| Marché | `/market`, `/market/[segment]` | Hub bidirectionnel + listes import / export | **Oui** |
| Entreprises | `/companies`, `/companies/[id]`, `/trust`, `/trust/[companySlug]` | → `/market/entreprises` ; la page trust est fusionnée dans la fiche entreprise (bloc vérification en 4 points) | **Oui** |
| Opportunités | `/opportunities`, `/opportunities/[category]/[slug]`, `/rfq` | → `/appels-offres` (appels d'offres + investissement) ; approvisionnement / export partent au marché | **Oui** |
| Demande | `/request` | → `/besoin` (formulaire 5 champs, sans compte) | **Oui** |
| Données | `/data-hub`, `/data-hub/prices/*`, `/data-hub/reports/*` | → `/donnees` (bibliothèque + tableau de bord 3 séries) ; fiche rapport conservée | **Oui** |
| Institutions | `/contact-points/*`, `/local-contacts/*` | → `/market/institutions` (gabarit « S'orienter ») | Via le gabarit |
| Services / tarifs | `/services`, `/pricing` | → `/accompagnement`, `/accompagnement/tarifs` | **Oui** |
| Inscription entreprise | `/register-company` | Formulaire « Publier une offre » (3 étapes) | **Oui** |
| Auth | `/login`, `/signup`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password` | Fusion `register` + `signup` ; vérification par **code à 6 chiffres** | **Oui** |
| Tableau de bord | 20 routes `/dashboard/**` (entreprises, produits, services, RFQ, opportunités, inbox, analytics, settings) | 4 états (vide / acheteur / vendeur / observateur) ; **Produits + Services → Offres** | **Oui** |
| Admin | 30 routes `/admin/**` | Nouvel écran **file de traitement unique** ; le reste garde son gabarit restylé par les composants | File + 1 gabarit liste/édition |
| Éditorial | `/news`, `/blog`, `/events`, `/help`, `/faq`, `/resources/[slug]`, `/about/*`, `/sectors`, `/search` | Gabarits génériques « liste » et « article » ; événements en pied de page | 2 gabarits |
| Légal | `/terms`, `/privacy`, `/cookies`, `/contact` | Gabarit article | Via le gabarit |

**À maquetter réellement : environ 30 écrans uniques** (§4). Tout le reste découle de 4 gabarits (liste, article, gabarit « chaîne de métiers », gabarit admin).

### 1.2 Composants (≈ 180 fichiers dans `src/components/`)

| Dossier | Fichiers | Constat |
|---|---|---|
| `ui/` (shadcn) | 25 | Base saine. Seule couche à restyler en profondeur (Button, Input, Select, Tabs, Table, Badge, Dialog, Sheet). |
| `home/` + `home/landing/` + `home/market/` | 23 + 15 + 6 | L'accueil actuel empile **2 heros** (`LandingHero` + `MarketHero`) et **~20 sections**. La moitié sort de la page (§4.1). |
| `design/` | 20 | Ébauche d'un kit (`company-row`, `product-card-design`, `opportunity-card-design`, `filter-chip`, `stat`, `empty-state`, `page-header`). Bonne base de nommage à reprendre. |
| `layout/` | 13 | Doublons : `hero.tsx`, `stats.tsx`, `features.tsx`, `cta-section.tsx`, `page-header.tsx` font doublon avec `design/` et `home/`. |
| `list-pages/` | 11 | Filtres (secteur, lieu, vérification, certification, segment), tri, barre de filtres actifs : à regrouper en un seul composant **FilterRail**. |
| `marketplace/` | 11 | Onglets, contacts et références entreprise ; `segment-badge`, `segment-shelf`. |
| `dashboard/` | 11 | Formulaires produit, service et RFQ séparés, à regrouper sous **Offre**. |
| Autres (`admin`, `data-hub`, `opportunities`, `messaging`, `pricing`, `trust`, `search`…) | ~40 | Écrans spécifiques ; ils héritent du kit une fois `ui/` restylé. |

**Formulaires de demande en doublon** : `/request`, `/rfq`, `dashboard/rfq/new`, `home/market/buying-request-actions`, `opportunities/contact-button` (+ `register/market`, `requests/market`). Il en faut **un seul** composant `Form/Besoin`, décliné selon le contexte.

### 1.3 Dette visuelle mesurée (ce que la maquette doit trancher)

| # | Constat | Mesure | Décision de la maquette |
|---|---|---|---|
| D1 | 3 palettes concurrentes dans `globals.css` (`drc-*`, `landing-*`, `market-*`) : 3 bleu marine, 3 ors, 3 rouges | l. 50-68 | Une seule palette de 4 couleurs de base + 2 fonctionnelles (§2.1) |
| D2 | `market-navy` utilisé 354 fois, `market-red` 70, `market-gold` 56 | grep `.tsx` | Le navy devient l'encre `#0A1E33` ; **le rouge disparaît** de la marque (réservé à l'erreur) |
| D3 | 57 couleurs hex en dur dans les `.tsx` | grep | Zéro hex dans la maquette : tout passe par des variables |
| D4 | `--radius: 0.5rem`, 123 `rounded-full`, 68 `rounded-2xl+` | grep | Rayon 2 px partout, `full` seulement pour avatars et pastilles de statut |
| D5 | 49 `uppercase` (étiquettes en capitales espacées) | grep | Libellés en casse normale (§2.2) |
| D6 | 12 `bg-gradient` | grep | Aucun dégradé, sauf éventuellement le hero |
| D7 | 3 polices (Geist, Geist Mono, Sora) ; Sora limitée au marketing | `layout.tsx` | 1 grotesque + 1 mono pour les références |
| D8 | 52 occurrences de « official / officiel » dans les messages | `en.json`, `fr.json` | Mot retiré des maquettes (sauf aval institutionnel réel) |
| D9 | Navigation actuelle : Request, About, Products, Partnering Opportunities, Local Contact Points, News & Events… | `navigation.ts` | 6 entrées : Marché · Entreprises · Appels d'offres · Données · Accompagnement · À propos |

---

## 2. Fondations (variables et styles Figma)

### 2.1 Couleurs

**Collection `Primitives`** (valeurs brutes, jamais appliquées directement sur un calque) :

| Variable | Hex | Rôle |
|---|---|---|
| `ink/900` | `#0A1E33` | Encre : texte, structure, bouton principal sombre |
| `ink/700` | `#2A3B4F` | Texte secondaire (≈ 10:1 sur blanc cassé, à vérifier) |
| `ink/500` | `#5B6878` | Métadonnées, aide de champ (≥ 4,5:1 à vérifier) |
| `ink/400` | `#767C84` | **Bordure de champ** (≥ 3:1, obligatoire pour un contrôle) |
| `paper/100` | `#F6F4EF` | Blanc cassé : fond de page |
| `paper/0` | `#FFFFFF` | Surface de champ, panneau posé sur le blanc cassé |
| `rule/300` | `#D6D2C8` | Filet : séparateurs, lignes de tableau |
| `gold/500` | `#C9A227` | Or : accent **unique** |
| `gold/600` | `#A8871C` | Or au survol |
| `signal/success` | `#2F6B3A` | Validation (usage fonctionnel seulement) |
| `signal/error` | `#A3312A` | Erreur de formulaire (usage fonctionnel seulement) |

**Collection `Semantic`** (ce qu'on applique aux calques) :

| Variable | Valeur | Usage |
|---|---|---|
| `bg/page` | `paper/100` | Fond de toutes les pages |
| `bg/surface` | `paper/0` | Champs, panneau latéral, fiche d'offre |
| `bg/inverse` | `ink/900` | Hero, pied de page, bandeau accompagnement |
| `text/primary` | `ink/900` | |
| `text/secondary` | `ink/700` | |
| `text/muted` | `ink/500` | |
| `text/on-inverse` | `paper/100` | |
| `border/rule` | `rule/300` | Filets **décoratifs** uniquement |
| `border/control` | `ink/400` | Contour des champs, cases, boutons secondaires |
| `border/strong` | `ink/900` | Filet de tête de section, onglet actif |
| `action/primary` | `gold/500` + texte `ink/900` | **Publier un besoin** (1 par écran) |
| `action/secondary` | `ink/900` + texte `paper/100` | Inscrire mon entreprise, envoyer |
| `focus/ring` | `ink/900`, 2 px, décalage 2 px | Tous les éléments focusables |

**Règles de contraste (à vérifier dans Figma avec Stark ou Contrast)**
- Encre sur blanc cassé : environ 15:1 ✅. Encre sur or : environ 7:1 ✅.
- **Or sur blanc cassé : environ 2,2:1 ❌.** Jamais de texte or sur fond clair. L'or s'emploie en **fond** (bouton, pastille) avec texte encre, ou en **filet de 2 à 3 px**. Sur fond encre, l'or peut servir de texte (≈ 7:1 ✅).
- Le filet `#D6D2C8` (≈ 1,3:1) ne peut **pas** délimiter un champ : utiliser `border/control`.

**Dosage** : environ 80 % blanc cassé et blanc, 17 % encre, **3 % or au maximum**. Si l'or apparaît plus de deux fois dans un écran (hors hero), il perd sa fonction.

**Mode sombre** : hors périmètre pour cette refonte. Nommer les variables sémantiquement dès maintenant pour pouvoir l'ajouter plus tard. Attention, le plan Starter de Figma ne permet qu'un seul mode par collection.

### 2.2 Typographie

**Principe** : une seule grotesque à forte personnalité (pas Inter, pas Geist) avec **chiffres tabulaires** (`tnum`) activés sur tous les chiffres alignés : prix, quantités, compteurs, dates, tableaux.

**Candidates à tester côte à côte** sur le hero, une ligne de tableau et un bouton, en FR (accents, « œ », guillemets « »), chacune avec `tnum` :

| Police | Licence | Pour | Contre |
|---|---|---|---|
| **Schibsted Grotesk** | Gratuite (Google Fonts) | Caractère éditorial, bon rendu en titres serrés | Graisses limitées (400-900) |
| **Hanken Grotesk** | Gratuite (Google Fonts) | Très lisible en petit, sobre | Moins de personnalité en titre |
| **Söhne** (Klim) | Payante | Référence du registre « document commercial » | Coût de licence web |

Recommandation : partir sur **Schibsted Grotesk** (gratuite, chargeable via `next/font`) ; ne passer sur Söhne que si le budget le permet après validation. Garder **Geist Mono** (déjà chargée) uniquement pour les identifiants : `BES-2026-0183`, code SH `7403.11`.

Dans Figma, activer les chiffres tabulaires : panneau Texte, *Type details*, *Numbers*, *Tabular*. Créer les styles `…/tabular` comme styles distincts.

**Styles de texte** (base 16, ratio ≈ 1,25) :

| Style | Taille / interligne | Graisse | Approche | Usage |
|---|---|---|---|---|
| `display/hero` | 64 / 64 (mobile 40 / 44) | 600 | −2 % | Titre du hero, **une fois par site** |
| `display/page` | 44 / 48 (mobile 32 / 36) | 600 | −1,5 % | Titre de page |
| `heading/h2` | 30 / 36 | 600 | −1 % | Titre de section |
| `heading/h3` | 22 / 28 | 600 | 0 | Titre de bloc, de fiche |
| `heading/h4` | 17 / 24 | 600 | 0 | Petit titre, titre de ligne |
| `body/lead` | 19 / 30 | 400 | 0 | Chapô |
| `body/md` | 16 / 26 | 400 | 0 | Texte courant |
| `body/sm` | 14 / 20 | 400 | 0 | Métadonnées, tableaux |
| `label/md` | 14 / 20 | 500 | 0 | **Libellé de champ, en casse normale** |
| `figure/xl/tabular` | 48 / 48 | 500 | −2 % | Chiffres de la plateforme et de la RDC |
| `figure/md/tabular` | 20 / 28 | 500 | 0 | Prix, quantités, compteurs de catégorie |
| `mono/ref` | 13 / 20 | 500 | 0 | Identifiants |

**Règles éditoriales imposées par le contexte (§9)** :
- ❌ Étiquettes en capitales espacées (« EXPORT · VÉRIFIÉ »). ✅ « Export », « Vérifié », en `label/md`.
- ❌ Point médian comme séparateur de méta. ✅ Espacement de 16 px ou filet vertical 1 px `border/rule`.
- ❌ Flèche collée au lien (« Voir tout→ »). ✅ Lien seul, ou flèche en icône séparée de 6 px, au sein d'une zone cliquable.
- ❌ « Officiel » dans les textes de maquette.
- Prévoir **+25 % de longueur en français** : concevoir d'abord en FR.

### 2.3 Grille, espacement, rayons, élévation

- **Espacement** (échelle 4) : `4, 8, 12, 16, 24, 32, 48, 64, 96, 128`. Entre sections de page : 96 (desktop) / 64 (mobile).
- **Grille** : desktop 1440, contenu **1200 max**, 12 colonnes, gouttière 24, marges 120. Tablette 768 : 8 colonnes, gouttière 16, marges 32. Mobile 390 : 4 colonnes, gouttière 16, **marges 16**.
- **Rayons** : `radius/none 0` (sections, tableaux, listes) · `radius/sm 2` (boutons, champs, pastilles, panneau) · `radius/full` (avatars, points de statut). Rien d'autre.
- **Filets plutôt que cartes** : un élément de liste = une rangée séparée par un filet 1 px `border/rule` ; une section = un filet 1 px `border/strong` en tête + titre. Pas de carte à fond blanc sur fond crème, sauf pour les objets « posés » (panneau latéral, fiche d'offre, dialogue).
- **Élévation** : aucune ombre décorative. Une seule ombre, `shadow/overlay`, pour les menus, panneaux et dialogues : `0 12px 32px -12px rgba(10,30,51,.28)`.
- **Un seul geste spectaculaire par page** : le hero (fond encre, grand titre, éventuellement une photo documentaire). Tout le reste est calme.

### 2.4 Iconographie et images

- **Lucide** (déjà dans le code), trait 1,5 px, tailles 16 / 20 / 24, couleur `text/secondary`.
- Photos documentaires (port de Matadi, entrepôts, cultures, ateliers), pas de photo de banque d'images générique. Recadrages larges, légère désaturation, jamais de texte posé sur une photo sans aplat encre.
- Drapeaux des pays d'origine (sens import) : 16 × 12, rayon 0, contour 1 px `border/rule`.

---

## 3. Composants réutilisables et variantes

Nommer les composants comme les fichiers du code (`Button`, `Input`, `Tabs`…) pour brancher **Code Connect** ensuite. Auto Layout partout, propriétés booléennes pour les icônes, propriétés texte pour les libellés.

### 3.1 Primitives (restylage de `src/components/ui/`)

| Composant | Variantes (propriétés Figma) | Notes |
|---|---|---|
| **Button** | `variant` : primary-gold / primary-ink / secondary (contour) / ghost / link · `size` : sm 32, md 40, lg 48 · `state` : default, hover, focus, disabled, loading · `icon` : none, leading, trailing | Rayon 2. Un seul `primary-gold` par écran |
| **Input** | `state` : default, focus, filled, error, disabled · `hasLabel`, `hasHelp`, `hasPrefix` (indicatif pays, unité) | Libellé au-dessus, aide en dessous ; fond `bg/surface` |
| **Textarea**, **Select**, **Combobox** (pays) | Mêmes états qu'Input | `country-combobox` : drapeau à gauche |
| **Checkbox**, **Radio**, **Switch** | checked / unchecked / indeterminate × default / focus / disabled | Case carrée, rayon 2 |
| **SegmentedChoice** | 2 à 4 options, `selected` | Choix « Import / Export », « Acheteur / Vendeur » : gros boutons de choix, pas de liste déroulante |
| **Chip** (filtre) | default / selected / with-count / removable | Rayon 2, pas de pilule |
| **Tabs** | `style` : underline · `count` 2 à 6 | Onglet actif souligné 2 px encre |
| **Badge** | `tone` : neutral / gold / success / error / muted | Casse normale, 12-13 px, rayon 2 |
| **Table** | Rangée : header / row / row-hover / row-selected · Cellule : text / number-tabular / ref-mono / status / action | Filets horizontaux seulement, chiffres alignés à droite |
| **Dialog**, **Sheet** (panneau latéral) | `size` : sm / md / lg · `side` : right / bottom (mobile) | `shadow/overlay`, rayon 2 |
| **Toast** (Sonner) | success / error / info | |
| **Skeleton** | text-line / row / figure | Pour chaque liste |
| **Avatar** | image / initiales · 24 / 32 / 40 | Seul élément rond avec le point de statut |
| **Breadcrumb**, **Pagination**, **Tooltip**, **Accordion** (FAQ) | Standard | Accordion : filets, signe « + » à droite |

### 3.2 Composants métier

| Composant | Variantes | Écrans |
|---|---|---|
| **Nav/Header** | `auth` : anonyme / connecté (avatar) · `scrolled` : oui / non · `breakpoint` : desktop / mobile (menu) · `locale` : FR / EN | Toutes les pages |
| **Footer** | desktop / mobile | Toutes ; contient Événements |
| **TrustStrip** | 3 éléments : vérification 4 points, délai de 48 h, 26 provinces | Accueil, marché |
| **DirectionToggle** | Import / Export | Hub marché, listes, formulaire besoin |
| **OfferRow** | `direction` : import / export · `verified` : oui / non · `layout` : row (desktop) / stacked (mobile) · `hasImage` | Listes marché, « Ce qui circule », fiche entreprise |
| **NeedRow** (demande anonymisée) | `direction` · `deadline` : lointaine / proche (< 7 j, or) / clôturée | Hub marché, accueil, tableau de bord vendeur |
| **TenderRow** (appel d'offres) | `kind` : appel d'offres / investissement · `status` : ouvert / clôturé | `/appels-offres` |
| **CompanyRow** | `tier` : aucun / basique / vérifié / premium · `direction` | Annuaire, accueil |
| **VerificationBlock** | 4 critères (légalité, capacité, références, visite) × état : validé / en cours / non demandé | Fiche d'offre, fiche entreprise |
| **VerifiedMark** | `size` : 16 / 20 · `showLabel` | **À trancher** (§6) : pastille sobre (coche + « Vérifié ») plutôt que sceau |
| **CategoryRow** | avec compteur tabulaire / sans compteur (masquée si 0) | Accueil, hub marché |
| **FilterRail** | `direction` : import (pays d'origine) / export (province) · desktop latéral / mobile en panneau | Listes marché, annuaire |
| **FigureBlock** | `source` : oui / non · `date` · `empty` (« Collecte en cours ») | Chiffres plateforme, « Pourquoi la RDC », tableau de bord Données |
| **ReportRow** | note sectorielle / profil provincial / jeu de données · `gated` (contre e-mail) | `/donnees` |
| **Stepper** | 2 à 5 étapes · current / done / upcoming | Tous les formulaires |
| **ChainCard** (chaîne de métiers) | Transporter / Financer / Se conformer / S'orienter | Accueil, hub marché |
| **DelegatePanel** (« Confier l'opération ») | form / sent (avec créneaux de rappel) | 4 pages chaîne de métiers |
| **CallbackSlots** | 3 à 6 créneaux · selected | Confirmation |
| **AnonymityNotice** | inline | Formulaire besoin, **avant** le bouton d'envoi |
| **OtpInput** | 6 cases · default / error / success · lien « Recevoir par WhatsApp » | Vérification de compte |
| **EmptyState** | illustration : non · question d'orientation / message + action | Tableau de bord vide, listes vides |
| **QueueRow** (admin) | `type` : besoin / vérification / avis / revendication · `urgency` : dans les délais / < 12 h / dépassé | File admin |
| **SlaBar** | respecté / à risque / dépassé | Bas de la file admin |
| **PlanColumn** (tarifs) | local / international entrée / international / international+ · `highlighted` | `/accompagnement/tarifs` |
| **SocialProof** | logos seuls / logos + témoignage | Accueil. **Masqué tant qu'il n'y a rien de réel** |

### 3.3 Formulaires (répertoire unique, §5 du contexte)

Un seul gabarit `Form/Shell` (colonne 560 px, stepper en tête, récapitulatif à droite en desktop) décliné en :

| Formulaire | Étapes | Compte | Particularité |
|---|---|---|---|
| **Publier un besoin** | 1 écran, 5 champs (sens, produit en texte libre, quantité, lieu de livraison, contact) | Non | `AnonymityNotice` avant l'envoi |
| **Demander un devis** | 2 étapes | Non | Coordonnées jamais publiées |
| **Publier une offre** | 3 étapes (produit, conditions, entreprise + compte) | À la fin | MOQ, Incoterm, délai, paiement |
| **Soumettre un avis** | 1 écran | Non | Pièce jointe **ou** lien ; mention de modération |
| **Demander une étude / Confier une opération** | 2-3 champs | Non | « Honoraires sur devis » |

Pour chaque formulaire : états **vide, rempli, erreur, envoi en cours, confirmation**.

---

## 4. Pages à maquetter

Chaque écran en **Desktop 1440 + Mobile 390**, en **FR d'abord**, puis EN pour les écrans P0.

### 4.1 Accueil (11 sections entre la nav et le pied de page, contexte §8)

| # | Section | Composants | Remplace (code actuel) |
|---|---|---|---|
| 1 | Nav | `Nav/Header` | `navbar`, `mega-menu` |
| 2 | Hero : *« Votre porte d'entrée vers des affaires de confiance en RDC »*, un seul bouton plein + lien texte « ou publier un besoin », **sans recherche** | `display/hero`, `Button` | `LandingHero`, `MarketHero`, `HeroBackdrop`, `LandingFeatures` |
| 3 | Bandeau de confiance | `TrustStrip` | `LandingTrustRibbon`, `MarketStatsBand` |
| 4 | 3 portes : Acheter / Vendre / Investir | 3 colonnes séparées par filets | `MarketBanners` |
| 5 | Zone marché : recherche + « Ce qui circule » (offres + demandes) + catégories avec compteurs | `DirectionToggle`, `OfferRow`, `NeedRow`, `CategoryRow` | `MarketShowcase`, `MarketRail`, `HomeSearchBand`, `HomeCarousel` |
| 6 | Fournisseurs vérifiés | `CompanyRow` × 4-6 | `FeaturedCompaniesStrip` |
| 7 | Chiffres plateforme (20+ produits, 15 entreprises, 11 vérifiés, 26 provinces, 17 catégories) | `FigureBlock` tabulaire | `stats-strip` |
| 8 | Preuve sociale (masquée tant que vide) | `SocialProof` | — |
| 9 | 3 étapes | Liste numérotée à filets | `LandingHowItWorks` |
| 10 | Chaîne de métiers | `ChainCard` × 4 | — |
| 11 | Pourquoi la RDC : 4 chiffres **sourcés** | `FigureBlock` avec source et date | `LandingWhyDrc` |
| 12 | Bandeau accompagnement | Aplat encre, `primary-gold` | `LandingJoinCta`, `LandingTransformBanner` |
| 13 | Pied de page enrichi | `Footer` | `site-footer` |

Supprimés de l'accueil : `LandingAboutIntro`, `LandingMissionBanner`, `LandingValueCards`, `LandingSectors` (→ À propos), widget à compteurs nuls, bloc de recherche à 3 filtres, formulaire d'achat.

### 4.2 Liste des écrans et priorités

| Priorité | Écran | Route cible | Pourquoi maintenant |
|---|---|---|---|
| **P0** | Fondations + composants §3.1 | — | Tout en dépend |
| **P0** | Accueil | `/` | Vitrine, porte le message |
| **P0** | Publier un besoin (+ confirmation) | `/besoin` | **Conversion prioritaire** : objectif de 30 besoins réels avant lancement |
| **P0** | Hub marché | `/market` | Aiguillage import / export, demandes en cours |
| **P1** | Liste import, liste export | `/market/import`, `/market/export` | Filtres qui changent selon le sens |
| **P1** | Fiche d'offre + demande de devis (2 étapes) | `/market/offre/[id]` | Deuxième point de conversion |
| **P1** | Annuaire + fiche entreprise | `/market/entreprises`, `/[id]` | Fusion avec la page trust |
| **P1** | Appels d'offres (liste + détail) + Soumettre un avis | `/appels-offres` | |
| **P2** | Gabarit chaîne de métiers (Transporter), décliné sur Financer / Se conformer / S'orienter | `/market/transporter`… | 1 gabarit, 4 jeux de données |
| **P2** | Panneau « Confier l'opération » + confirmation avec créneaux | — | |
| **P2** | Données : bibliothèque, rapport vedette contre e-mail, tableau de bord 3 séries (dont état vide « prix de référence ») | `/donnees` | |
| **P2** | Accompagnement + Tarifs | `/accompagnement`, `/tarifs` | Grille : local réduit, entrée internationale, 3 600 $, 6 000 $ ; engagement de résultat |
| **P2** | Publier une offre (3 étapes) | `/offre/nouvelle` | |
| **P3** | Connexion, inscription, code à 6 chiffres, « nous avons retrouvé 3 demandes » | `/login`, `/signup`, `/verify` | |
| **P3** | Tableau de bord : 4 états (vide / acheteur / vendeur / observateur) | `/dashboard` | |
| **P3** | Admin : file de traitement unique + bande de délai | `/admin` | |
| **P4** | Gabarits liste et article (actualités, blog, aide, FAQ, légal, À propos), 404, recherche | — | Découlent du kit |

**États à produire pour chaque liste** : vide, chargement (skeleton), erreur, 1 élément, contenu FR long, filtre sans résultat.

---

## 5. Arborescence du fichier Figma

**Nouveau fichier** : `TradeInDRC — Refonte « Document commercial »`. Le fichier existant `Acum7uOE9NA3phegWOSleH` reste la référence structurelle ; on y pointe depuis la couverture.

### 5.1 Structure recommandée (plan Professional)

```
00 Couverture          nom, version, statut par écran, liens (repo, staging, fichier structurel)
01 Audit               captures du site actuel annotées avec D1 à D9
02 Fondations          variables (Primitives, Semantic), styles de texte, grilles, rayons, ombre
03 Composants          §3.1 primitives, une section par composant, toutes les variantes
04 Composants métier   §3.2 et §3.3
05 Accueil             desktop FR, mobile FR, desktop EN
06 Marché              hub, listes, fiche d'offre, devis, entreprises, chaîne de métiers
07 Formulaires         besoin, offre, avis, étude, confier (tous les états)
08 Appels d'offres & Données
09 Accompagnement & Tarifs
10 Compte              auth, 4 états du tableau de bord
11 Admin               file de traitement
12 Prototype           parcours §5.3
99 Archive
```

### 5.2 Si le compte reste en plan Starter

Le plan Starter limite le nombre de pages par fichier et de modes par collection, et ne permet pas de publier une bibliothèque partagée (limites à confirmer sur la page tarifs de Figma). Dans ce cas :
- **Fichier A, « Kit »** : page 1 Fondations, page 2 Composants (primitives + métier en **sections** Figma), page 3 Couverture et audit.
- **Fichier B, « Écrans »** : page 1 Public (accueil, marché, formulaires, appels d'offres, données, accompagnement, un bloc de sections par groupe), page 2 Compte et admin, page 3 Prototype.
- Sans bibliothèque partagée, garder composants et écrans **dans le même fichier** ou copier le kit : préférer passer en Professional avant la phase P1.

### 5.3 Conventions

- Cadres nommés `Route — Breakpoint — Langue — État` (ex. `/besoin — 390 — FR — erreur`).
- Composants nommés `Catégorie/Nom` (`Form/Input`, `Market/OfferRow`, `Admin/QueueRow`).
- **Zéro valeur de couleur brute** sur un calque : uniquement des variables `Semantic`.
- Textes réels et bilingues (reprendre `src/config/messages/fr.json`), jamais de *lorem ipsum* : la longueur du FR fait partie du test.
- Parcours à prototyper :
  1. Accueil, « ou publier un besoin », formulaire besoin, confirmation.
  2. Hub marché, Import, fiche d'offre, devis 2 étapes, confirmation.
  3. Chaîne de métiers « Transporter », « Confier l'opération », créneaux de rappel.
  4. Inscription par action (téléchargement d'un rapport), code à 6 chiffres, « nous avons retrouvé 3 demandes », retour au point de départ.

### 5.4 Motion dans le prototype (`docs/MOTION.md`)

Survol ≤ 180 ms, apparition ≤ 300 ms (fondu + 8 px), entrée du hero ≤ 500 ms. Panneau latéral : glissement 240 ms `ease-out`. Pas d'effet décoratif ailleurs.

---

## 6. Priorités de conception et décisions ouvertes

### 6.1 Ordre de travail

1. **Semaine 1, fondations** : tester les 3 polices sur 3 échantillons, poser les variables, régler la question du rayon et du badge (ci-dessous). Livrable : page Fondations validée.
2. **Semaine 2, kit** : primitives §3.1, puis `OfferRow`, `NeedRow`, `CompanyRow`, `FilterRail`, `Form/Shell`.
3. **Semaine 3, P0** : accueil + formulaire besoin + hub marché, desktop et mobile, FR puis EN. Revue avec l'équipe BrandsBridge.
4. **Semaines 4-5, P1 et P2**, qui s'assemblent à partir du kit.
5. **Semaine 6, P3** : compte, tableau de bord, admin, puis prototype.

### 6.2 À trancher avant ou pendant la semaine 1

| Question | Options | Recommandation |
|---|---|---|
| Rayon des boutons | 0 / 2 px | **2 px** : reste net, évite l'aspect coupé au cutter sur mobile |
| Badge de vérification | Retiré / pastille sobre / sceau | **Pastille sobre** (coche + « Vérifié », 16 px) sur les rangées ; le détail en 4 points vit dans `VerificationBlock` sur la fiche. C'est la promesse du produit : ne pas l'enlever |
| Police | Schibsted / Hanken / Söhne | Schibsted, sauf budget de licence |
| Messagerie (contexte §10) | Réponse libre / formulaire qualifié | Impacte le tableau de bord vendeur : maquetter le tableau de bord **après** l'arbitrage |
| Chiffres « Pourquoi la RDC » | — | Maquetter avec l'emplacement de la source visible ; tant qu'une source manque, le chiffre ne s'affiche pas |

---

## 7. Après la maquette : impacts sur le code

1. `globals.css` : remplacer `drc-*`, `landing-*`, `market-*` par les variables §2.1 ; aligner `--primary` sur l'encre ; `--radius: 2px`.
2. Remplacer les 57 hex en dur, les 49 `uppercase`, les `rounded-full` / `rounded-2xl` hors avatars.
3. `layout.tsx` : charger la grotesque retenue via `next/font`, retirer Sora ; `font-variant-numeric: tabular-nums` sur les classes de chiffres.
4. Réduire `src/app/[locale]/page.tsx` aux 11 sections ; supprimer `home-classic`.
5. Réduire les formulaires de demande à un seul composant `Form/Besoin`.
6. Réécrire `navigation.ts` (6 entrées) et poser les redirections 301 du contexte §3.
7. Retirer « officiel / official » des messages `fr.json` et `en.json`.
8. Brancher Code Connect entre les composants Figma et `src/components/ui/`.
