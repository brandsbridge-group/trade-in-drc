# Rapport — Circuit de vérification des entreprises

**Date :** 2 octobre 2026
**Périmètre :** l'envoi du dossier par l'entreprise, son arrivée dans la console, le suivi par l'entreprise, la décision de l'équipe, et les fonctions de la console liées à la vérification.

## 1. Conclusion

Le circuit fonctionne maintenant de bout en bout : une entreprise envoie son dossier, il arrive dans la console, l'équipe l'examine et décide, et l'entreprise suit chaque étape.

Il ne fonctionnait pas avant ce travail. Cinq défauts le bloquaient ou le faussaient ; ils sont corrigés et listés en section 3.

**Ce qui a été vérifié.** Un test réel sur la base, avec trois comptes temporaires (entreprise, modérateur, autre entreprise), parcourt tout le circuit : 33 contrôles sur 33 passent. Les comptes et les données de test ont été supprimés à la fin.

**Ce qui n'a pas été vérifié.** Les écrans n'ont pas été parcourus avec un compte connecté. Le test exécute les mêmes écritures que l'application, avec les mêmes droits, mais sans passer par l'interface. Un essai manuel reste à faire (section 6).

## 2. Le circuit, étape par étape

| Étape | Qui | Ce qui se passe | Statut de l'entreprise |
|---|---|---|---|
| 1. Inscription | Entreprise | La fiche est créée, sans dossier | Documents à envoyer |
| 2. Préparation | Entreprise | Saisie de l'identité légale, dépôt des documents | Documents à envoyer |
| 3. Envoi | Entreprise | « Envoyer pour vérification » : le dossier part dans la console | En revue |
| 4. Examen | Équipe | Lecture du dossier, acceptation ou refus de chaque document | En revue |
| 5a. Complément | Équipe | « Demander plus d'informations », avec un message | En revue, en attente de l'entreprise |
| 5b. Renvoi | Entreprise | Correction puis renvoi : le dossier revient à l'équipe | En revue |
| 6a. Approbation | Équipe | L'entreprise et ses produits deviennent publics | Vérifiée |
| 6b. Refus | Équipe | L'entreprise reste ou redevient invisible ; elle peut corriger et renvoyer | Refusée |

Chaque envoi et chaque décision laisse une trace datée, visible des deux côtés.

## 3. Défauts trouvés et corrigés

### 3.1 Un modérateur ne pouvait pas examiner un dossier
Vingt-deux règles d'accès anciennes ne reconnaissaient que l'ancien rôle « admin ». Or les comptes de l'équipe portent aujourd'hui un rôle « modérateur » ou « super admin ». Résultat : sous sa propre session, un modérateur ne voyait ni les documents ni l'historique d'un dossier, et accepter ou refuser un document ne modifiait rien.

Le seul compte d'équipe en base est dans ce cas. Le défaut touchait aussi la gestion des secteurs et catégories, la modération des produits et des demandes, les conversations et la lecture des statistiques.

**Correction :** les 22 règles reconnaissent maintenant les rôles de l'équipe (migration 00060). Personne ne perd d'accès.

### 3.2 Le premier envoi ne laissait aucune trace
Rien n'était enregistré quand une entreprise envoyait son dossier pour la première fois. La console affichait donc la date d'inscription comme date d'envoi, l'historique commençait à la première décision, et le délai d'attente n'était pas mesurable.

**Correction :** un événement « dossier envoyé » est enregistré à chaque envoi (migration 00058).

### 3.3 Une entreprise pouvait valider ses propres documents
La règle d'accès laissait l'entreprise modifier ses documents, y compris leur statut « accepté / refusé », réservé à l'examinateur.

**Correction :** seule l'équipe peut modifier un document (migration 00058). L'entreprise peut toujours en ajouter et en retirer.

### 3.4 Enregistrer le rapport de confiance effaçait l'identité légale
Dans la fiche d'une entreprise côté console, l'enregistrement du rapport de confiance remplaçait tout le dossier interne : les numéros légaux et les réponses d'inscription étaient perdus. Il changeait aussi le niveau de vérification sans trace ni mise à jour du statut, ce qui pouvait donner un badge « vérifié » à une entreprise encore en revue.

**Correction :** l'enregistrement fusionne les données au lieu de les remplacer, et tout changement de niveau passe par le chemin tracé.

### 3.5 La file ne distinguait pas « à examiner » de « en attente de l'entreprise »
Après une demande de complément, l'entreprise garde le statut « en revue ». Un dossier en attente de l'entreprise ressemblait donc exactement à un dossier à examiner.

**Correction :** l'étape se déduit du dernier événement du dossier. Le même défaut existait sur l'accueil du dashboard de l'entreprise, qui n'affichait jamais « complément demandé » ; il est corrigé aussi.

## 4. Fonctions de la console

### File d'attente (`/console/verifications`)
- Quatre indicateurs : dossiers à examiner, ancienneté du plus ancien, dossiers en attente de l'entreprise, entreprises inscrites sans dossier.
- Trois onglets : à examiner, en attente de l'entreprise, tous.
- Recherche par nom d'entreprise ou par e-mail.
- Pour chaque dossier : date d'envoi, durée d'attente (signalée au-delà de 2 jours), dossier complet ou incomplet, étape.
- Tri du plus ancien au plus récent.

### Examen d'un dossier (`/console/verifications/[id]`)
- **Bandeau de complétude** : dossier complet, ou liste précise de ce qui manque.
- **Identité légale déclarée** : numéro RCCM, NIF, identification nationale, forme juridique, année, effectif. Elle n'était pas affichée avant.
- **Informations déclarées à l'inscription** : profil, nom commercial, personne de contact, siège et intérêts pour une entreprise étrangère.
- **Documents** : ouverture de chaque pièce, puis « Accepter » ou « Refuser » avec un motif obligatoire, visible par l'entreprise. Les pièces obligatoires manquantes sont signalées.
- **Décision** : approuver avec un niveau, demander un complément, refuser. Approuver un dossier incomplet demande de cocher une case de prise de responsabilité ; un avertissement s'affiche si des documents ont été refusés.
- **Historique** : tous les événements, avec la date, l'auteur (nom de l'examinateur ou « Entreprise ») et le message.

### Côté entreprise (`/dashboard/companies/[id]/verification`)
- Nouvelle carte « Suivi du dossier » : envoi, complément demandé, renvoi, vérification ou refus, avec le message de l'équipe.
- Le motif s'affiche sous un document refusé.

## 5. Ce que le test réel a confirmé

- **Avant l'envoi** : l'entreprise et son produit sont invisibles du public.
- **Garde-fous** : l'entreprise ne peut ni valider ses documents, ni écrire une décision, ni se vérifier elle-même.
- **Arrivée dans la console** : le dossier apparaît avec ses documents et sa trace ; le modérateur lit l'historique et ouvre un document.
- **Cloisonnement** : une autre entreprise ne voit ni les documents ni l'historique.
- **Examen** : le modérateur refuse un document avec un motif ; l'entreprise lit le refus et le motif.
- **Complément puis renvoi** : la trace se lit « envoyé, complément demandé, renvoyé ».
- **Approbation** : l'entreprise et son produit deviennent publics ; l'identité légale est toujours là.
- **Refus ultérieur** : l'entreprise et son produit redeviennent invisibles ; l'entreprise lit les cinq événements.

## 6. Limites et points à décider

| Sujet | État | Suite proposée |
|---|---|---|
| Parcours à l'écran | Non testé avec un compte connecté | Essai manuel : une entreprise envoie, un modérateur traite |
| Notification de l'entreprise | Aucun e-mail n'est envoyé après une décision ; le projet n'a pas d'outil d'envoi d'e-mails | Choisir un service d'e-mail, puis prévenir l'entreprise à chaque décision |
| Notification de l'équipe | Aucune alerte à l'arrivée d'un dossier | Même prérequis |
| Délai cible | 2 jours, fixé par moi pour signaler les retards | À confirmer |
| Pièces obligatoires | RCCM et NIF en RDC, certificat d'immatriculation ailleurs ; fixé par moi | À confirmer |
| Retrait d'un document pendant la revue | L'écran l'empêche, mais pas la règle d'accès | Verrouiller côté base si nécessaire |
| Décision sur une entreprise déjà vérifiée | Possible, sans confirmation supplémentaire | Ajouter une confirmation si souhaité |
| Autres règles d'accès corrigées (3.1) | Corrigées en base, non testées une à une hors vérification | Contrôle rapide de la taxonomie et de la modération par un modérateur |

## 7. Modifications apportées

**Base de données** (migrations appliquées, non commitées)
- `00058_verification_workflow.sql` : événement « envoyé », documents modifiables par l'équipe seulement, motif et auteur de l'examen d'un document.
- `00060_policies_use_is_admin.sql` : 22 règles d'accès reconnaissent les rôles de l'équipe.

**Code**
- `src/lib/verifications/workflow.ts` : règles du circuit (étape, date d'envoi, délai), avec tests.
- `src/lib/verifications/actions.ts` : file d'attente, dossier d'examen, examen d'un document, rapport de confiance, contrôle de complétude à l'approbation.
- `src/lib/verifications/owner-actions.ts` : enregistrement de chaque envoi.
- `src/app/[locale]/console/verifications/` : file d'attente et écran d'examen refaits.
- `src/components/admin/document-viewer.tsx`, `decision-panel.tsx` : examen des documents et décision.
- `src/components/verification/timeline.tsx` : historique partagé entre la console et l'entreprise.
- `src/components/dashboard/verification/verification-screen.tsx` : suivi du dossier côté entreprise.
- Textes ajoutés dans les cinq langues.

**Contrôles automatiques :** types corrects, aucune erreur de lint, 229 tests réussis.

**Note :** une migration `00059_console_dashboard_metrics.sql`, créée en parallèle hors de ce travail, était déjà appliquée ; la mienne a été numérotée 00060 pour éviter la collision.
