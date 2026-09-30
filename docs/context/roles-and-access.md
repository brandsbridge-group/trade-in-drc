# Rôles, zones et contrôle d'accès — contexte de référence

> Mis à jour le 2026-09-30. À lire avant de toucher à l'authentification, au proxy
> (`src/proxy.ts`), à la console du personnel (`/console`) ou au dashboard entreprise
> (`/dashboard`). Les identifiants de code restent en anglais.

## 1. En bref

- Le produit a **trois rôles connectés** : **Super Admin** et **Modérateur** (l'équipe
  TradeInDRC) et **Admin**, c'est-à-dire **une entreprise inscrite** qui gère son propre espace.
- Chaque groupe a **sa zone**, et le proxy empêche d'entrer dans celle des autres :
  - personnel → **`/console`** (anciennement `/admin`) ;
  - entreprises → **`/dashboard`**.
- Le type de compte d'une entreprise (**congolaise** ou **internationale**) est **attribué
  automatiquement selon le pays de son entreprise**, par un trigger en base (migration 00051).
- Le Modérateur partage la console, mais **pas** la gestion des utilisateurs ni les paramètres,
  qui sont réservés au Super Admin.

> ⚠️ **Vocabulaire.** Dans le produit, « Admin » désigne **l'entreprise**. Dans le code, pour
> des raisons historiques, `admin` désigne encore souvent **le personnel** (`isAdmin()`,
> `requireAdmin()`, SQL `is_admin()`, `profiles.role = 'admin'`). Voir §8.

## 2. Modèle des rôles

| Rôle produit | Qui | Stockage en base (`profiles`) | Zone | Page d'accueil |
|---|---|---|---|---|
| **Super Admin** | Équipe TradeInDRC | `staff_role = 'super_admin'` (ou ancien `role = 'admin'` sans `staff_role`) | `/console` (toute) | `/console` |
| **Modérateur** | Équipe TradeInDRC | `staff_role = 'moderator'` | `/console`, sauf les sections super-admin | `/console` |
| **Admin (entreprise congolaise)** | Propriétaire d'une entreprise en RDC | `account_type = 'congolese_company'` | `/dashboard` | `/dashboard/companies` |
| **Admin (entreprise internationale)** | Propriétaire d'une entreprise hors RDC | `account_type = 'international_business'` | `/dashboard` | `/dashboard/companies` |
| *(connecté sans entreprise)* | Vient de s'inscrire, pas encore d'entreprise | `account_type = NULL`, `staff_role = NULL` | `/dashboard` | `/dashboard/companies` |
| *Visiteur* | Non connecté | pas de session | pages publiques | — |

- `staff_role` est la source de vérité pour les droits du personnel. `profiles.role`
  (`'user' | 'admin'`) est un ancien champ conservé pour compatibilité.
- Les prédicats côté application sont dans `src/constants/roles.ts` :
  - `isAdmin()` = tout le personnel ;
  - `hasSuperAdminAccess()` = super-admin, y compris l'ancien `role = 'admin'` sans `staff_role` ;
  - `isModerator()` ;
  - `resolveRole()` ;
  - `roleHomePath()`.
- Côté SQL (migration 00013), les équivalents sont `is_admin()`, `is_moderator()` et `is_super_admin()`.
- `role`, `staff_role` et `account_type` ne sont **modifiables que par la clé service-role**
  (migration 00037). Un utilisateur ne peut jamais s'attribuer un rôle lui-même.

## 3. Attribution automatique du type de compte (migration 00051)

Fichier : `supabase/migrations/00051_profiles_account_type_from_country.sql`, appliqué sur la
base liée le 2026-09-30.

- **Règle :** si le pays de l'entreprise est `'Democratic Republic of the Congo'` (identique à
  `HOME_COUNTRY` dans `src/config/geo.ts` et au défaut de la colonne défini en 00035), le
  propriétaire devient `congolese_company`. Tout autre pays donne `international_business`.
- **Plusieurs entreprises :** le propriétaire est congolais dès qu'**une** de ses entreprises
  est en RDC. Le résultat ne dépend donc pas de l'ordre d'écriture.
- **Déclenchement :** trigger `companies_sync_owner_account_type` sur la table `companies`,
  `AFTER INSERT OR UPDATE OF country, owner_id`. Il couvre tous les chemins de création :
  - l'assistant d'inscription `registerCompany` ;
  - la conversion d'un prospect Premium ;
  - l'édition dans le dashboard ;
  - les scripts de seed.
- **Personnel exclu :** un profil avec `staff_role` renseigné, ou avec l'ancien `role = 'admin'`,
  n'est jamais modifié.
- **Pas de rétrogradation :** si une entreprise est supprimée, `account_type` est conservé.
- **Remplissage initial :** exécuté dans la migration. Au 2026-09-30, les 28 entreprises de la
  base appartenaient à 2 comptes du personnel, donc **aucun profil n'a été modifié**. Le trigger
  s'appliquera aux inscriptions suivantes.
- La fonction `sync_owner_account_type(uuid)` est `SECURITY DEFINER` et son `EXECUTE` est
  révoqué pour `PUBLIC`, `anon` et `authenticated`.
- Un Super Admin peut toujours forcer un type à la main depuis `/console/users`. Le trigger le
  recalculera à la prochaine création d'entreprise ou au prochain changement de pays.

## 4. Matrice d'accès (appliquée par `src/proxy.ts`)

Les chemins sont donnés sans le préfixe de langue (`/fr`, `/en`…). Chaque zone couvre toutes
les pages en dessous (`isUnderRoute`).

| Chemin | Non connecté | Entreprise / sans entreprise | Modérateur | Super Admin |
|---|---|---|---|---|
| Pages publiques | ✅ | ✅ | ✅ | ✅ |
| `/dashboard/settings/**` | → `/login?redirect=…` | ✅ | ✅ (paramètres du compte) | ✅ (paramètres du compte) |
| `/dashboard/**` (reste) | → `/login?redirect=…` | ✅ | → `/console` | → `/console` |
| `/console/**` | → `/login?redirect=…` | → `/dashboard/companies` | ✅ | ✅ |
| `/console/users/**`, `/console/settings/**` | → `/login?redirect=…` | → `/dashboard/companies` | → `/console?error=super_admin_only` | ✅ |
| `/admin/**` (ancien nom) | redirection 308 → `/console/**` (`next.config.ts`) | idem | idem | idem |

Les constantes sont dans `src/constants/routes.ts` :

- `COMPANY_AREA`, `STAFF_AREA` ;
- `STAFF_ALLOWED_COMPANY_ROUTES` : l'exception qui laisse le personnel ouvrir ses paramètres de compte ;
- `SUPER_ADMIN_ROUTES` : aussi lue par le menu latéral de la console ;
- `isUnderRoute()`.

Le proxy lit `profiles` **une fois par requête**, et seulement quand la requête vise `/dashboard`
ou `/console`.

## 5. Couches de défense

La défense est en profondeur : chaque couche suppose que la précédente peut être contournée.

1. **Proxy** (`src/proxy.ts`) : aiguillage par zone et redirections. Sert à l'expérience et au cloisonnement.
2. **Gardes de layout** (serveur) :
   - `/dashboard` → `requireAuth()` (`src/lib/auth/require-auth.ts`) ;
   - `/console` → `requireStaff()` (`src/lib/auth/require-admin.ts`). Elle renvoie
     `{ user, isSuperAdmin }` et transmet `isSuperAdmin` au menu latéral (`AdminLayoutClient`),
     qui masque les sections réservées.
3. **Gardes des server actions :**
   - `requireAdmin(locale)` : tout le personnel. Utilisée pour les vérifications, les
     opportunités, les demandes, le contenu, etc.
   - `requireSuperAdmin(locale)` : **obligatoire** pour tout ce qui donne des droits ou
     modifie la plateforme. Aujourd'hui : toutes les actions de `src/lib/admin/users-actions.ts`
     (rôles, suspension, réactivation, historique) et de `src/app/[locale]/console/settings/actions.ts`.
   - `requireCallerAdmin()` : variante booléenne qui ne redirige pas.
   - **Pas d'action sur soi-même :** `setUserRole` et `suspendUser` refusent si la cible est
     l'auteur de la demande (code d'erreur `self_action`, message traduit
     `Admin.users.selfActionError`). Cela évite qu'un Super Admin se rétrograde ou se bloque.
4. **RLS et droits sur les colonnes** (la vraie source de vérité) :
   - `is_admin()` dans les policies ;
   - colonnes de confiance des entreprises protégées (00011, 00013, 00023) ;
   - colonnes de rôle des profils protégées (00037).
   - ⚠️ Aucune policy RLS n'utilise encore `is_super_admin()`. La distinction entre Modérateur
     et Super Admin est donc appliquée **au niveau de l'application** (proxy, layout, server
     actions), pas en base.

## 6. Connexion et redirections

- **Formulaire de connexion** (`src/components/auth/login-form.tsx`) :
  - lit `role, staff_role, account_type` ;
  - le personnel va vers `roleHomePath(profile)`, soit `/console`, **en ignorant `?redirect=`**
    (un lien piégé ne peut pas envoyer le personnel ailleurs) ;
  - les autres suivent `?redirect=` ou `?next=` (validés par `resolveSafeRedirect`), avec
    `/dashboard/companies` par défaut.
- **Paramètres de retour :** le proxy envoie `?redirect=`, alors que `requireAuth` et
  `requireAdmin` envoient `?next=`. Le formulaire de connexion accepte les deux.
- **OAuth** (`(auth)/callback/route.ts`), **confirmation d'email** et **page d'inscription** :
  ils utilisent `resolvePostAuthRedirect`, qui ne connaît pas les rôles. Un membre du personnel
  qui arrive sur `/dashboard/companies` est renvoyé vers `/console` par le proxy.
- **Changement d'email :** le callback renvoie vers `/dashboard/settings/account?changed=1`,
  qui reste accessible au personnel grâce à `STAFF_ALLOWED_COMPANY_ROUTES`.
- **Menu du site** (`src/components/layout/navbar.tsx`) :
  - personnel : uniquement l'entrée « Console » (libellé `Nav.adminPanel`), sans « Publier une offre » ;
  - entreprises : « Dashboard », « Inscrire une entreprise » et « Publier une offre ».

## 7. Renommage `/admin` → `/console` (2026-09-30)

Objectif : libérer le mot « admin » pour l'entreprise et rendre la séparation visible dans les URL.

- Dossier : `src/app/[locale]/admin/` → `src/app/[locale]/console/` (avec `git mv`, l'historique est conservé).
- Constantes : `ROUTES.ADMIN*` → `ROUTES.CONSOLE*`. Il faut les utiliser au lieu de chaînes écrites en dur.
- Toutes les références de route ont été mises à jour : liens, `revalidatePath(...)`,
  redirections des gardes, imports `@/app/[locale]/console/...`, commentaires, tests.
- **Anciennes URL :** redirection permanente (308) dans `next.config.ts`, avec et sans préfixe
  de langue. Les favoris et les liens déjà envoyés continuent de fonctionner.
- **SEO :** `src/app/robots.ts` bloque `/dashboard`, `/console`, `/admin` et leurs variantes
  préfixées par la langue (`/*/…`). Avant, les chemins préfixés n'étaient pas couverts.
- `layout-shell.tsx` masque le menu et le pied de page du site sur `/console` (variable `isConsole`).

## 8. Ce qui garde volontairement le nom « admin » (personnel)

Ces éléments n'ont pas été renommés, pour limiter les changements. Ils désignent **le personnel** :

| Élément | Pourquoi il reste |
|---|---|
| `isAdmin()`, `requireAdmin()`, `requireCallerAdmin()` | Utilisés dans des dizaines de fichiers. Sens : « membre du personnel ». |
| SQL `is_admin()` | Référencé par de nombreuses policies RLS. |
| `profiles.role = 'admin'` | Ancien champ, écrit par `setUserRole` pour le personnel. **Ne jamais y mettre une entreprise.** |
| Namespace i18n `Admin.*` | Clés de traduction de la console, sans impact sur les URL. |
| `src/components/admin/`, `src/lib/admin/` | Composants et actions de la console. |
| `AdminLayoutClient.tsx` | Coque de la console. |
| `src/lib/supabase/admin.ts` | Client **service-role**, sans rapport avec les rôles. |

## 9. Recettes

- **Nouvelle page de console accessible aux modérateurs :** la créer sous
  `src/app/[locale]/console/…` ; le layout la protège déjà. Toute server action appelle
  `requireAdmin(locale)`. Ajouter le lien dans `sidebarLinks` (`AdminLayoutClient.tsx`) et une
  constante `ROUTES.CONSOLE_…`.
- **Nouvelle page réservée au Super Admin :** comme ci-dessus, et en plus ajouter la route à
  `SUPER_ADMIN_ROUTES` (le proxy et le menu la prennent en compte automatiquement) et utiliser
  `requireSuperAdmin(locale)` dans **chaque** server action. Si des écritures passent par RLS,
  prévoir une policy avec `is_super_admin()`.
- **Nouvelle page entreprise :** la créer sous `src/app/[locale]/dashboard/…`. Le proxy en
  écarte le personnel, sauf si elle est sous `/dashboard/settings`.
- **Nouvelle zone connectée :** l'ajouter au modèle de `routes.ts` et à la matrice du proxy,
  puis mettre ce document à jour.

## 10. Limites connues et travail restant

**Cloisonnement et rôles**
- La **taxonomie** (`/console/taxonomy`) est encore accessible aux modérateurs. Les écritures
  se font depuis le navigateur avec la policy `is_admin()` ; la réserver demanderait une policy
  avec `is_super_admin()`.
- **Modérateur et Super Admin ne sont pas distingués en base** (voir §5). Un modérateur qui
  appellerait directement l'API Supabase garde les droits `is_admin()`.
- Les **paramètres de compte du personnel** vivent encore dans `/dashboard/settings`. Prévoir
  `/console/account` et changer la cible du callback de changement d'email.
- Le **personnel possède toutes les entreprises de démonstration** (28 entreprises, 2 comptes).
  Pour tester le parcours entreprise, utiliser des comptes non-personnel. Envisager une
  contrainte « le personnel ne possède pas d'entreprise ».
- Un **compte sans entreprise** arrive sur `/dashboard/companies` au lieu d'un parcours
  d'inscription (`/onboarding`).
- Les redirections du proxy (`NextResponse.redirect`) ne recopient pas les cookies de session
  rafraîchis par `updateSession`. Ce comportement existait déjà et reste sans effet connu.
- **Plus tard :** sous-domaine dédié (`console.tradeindrc.net`), MFA obligatoire pour le
  personnel (niveau AAL2 vérifié dans `requireStaff`), page 403 explicite au lieu d'une
  redirection silencieuse.

**Constats de l'audit de la console (non traités)**
- Le tableau de bord et l'analytique chargent toutes les lignes `companies` et
  `analytics_events` côté client. Au-delà de 1000 lignes (plafond PostgREST), les chiffres
  seront faux. Il faut agréger en SQL.
- `listCompaniesForAdmin` fait un appel `auth.admin.getUserById` par propriétaire (N+1).
- `trust-profile-form.tsx` écrit `verification_tier` depuis le navigateur, sans trace dans
  `verification_reviews`, alors que `TierOverridePanel` passe par une action serveur qui garde l'historique.
- Aucune tâche n'applique `premium_expires_at`.
- Aucune notification (email ou dans l'application) n'est envoyée après une décision de
  vérification, d'opportunité ou de Premium.
- Tables sans écran dans la console : `contact_submissions` (les messages du formulaire de
  contact ne sont lisibles nulle part), produits, `institutions`, `opportunity_responses`,
  `kyc_individuals`, `kyp_checks`.

## 11. Vérifications effectuées (2026-09-30)

- `tsc --noEmit` : OK, après suppression des types générés périmés dans `.next/dev/types`.
- ESLint : 0 erreur ; 6 avertissements déjà présents, hors des fichiers modifiés.
- Vitest : 24 fichiers, **167 tests OK**.
- `npm run build` : OK ; les 33 routes `/[locale]/console/**` sont générées.
- Migration 00051 appliquée avec `supabase db push`. C'était la seule en attente.
- **Pas encore fait :** tests manuels en navigateur des parcours entreprise, modérateur et
  super-admin, et des redirections `/admin` → `/console`.

## 12. Fichiers clés

| Sujet | Fichier |
|---|---|
| Matrice d'accès | `src/proxy.ts` |
| Zones et constantes de routes | `src/constants/routes.ts` |
| Prédicats de rôle, page d'accueil par rôle | `src/constants/roles.ts` |
| Gardes serveur du personnel | `src/lib/auth/require-admin.ts` |
| Garde serveur entreprise | `src/lib/auth/require-auth.ts` |
| Redirections après connexion | `src/lib/auth/redirect-guard.ts`, `src/components/auth/login-form.tsx` |
| Gestion des utilisateurs (super-admin) | `src/lib/admin/users-actions.ts` |
| Coque de la console | `src/app/[locale]/console/layout.tsx`, `AdminLayoutClient.tsx` |
| Menu du site selon le rôle | `src/components/layout/navbar.tsx` |
| Anciennes URL, SEO | `next.config.ts`, `src/app/robots.ts` |
| Rôles en base | migrations `00013_rbac_roles`, `00037_profiles_privilege_lockdown`, `00051_profiles_account_type_from_country` |
