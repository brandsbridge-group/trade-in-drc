# Rapport — Fonctionnement des statistiques

**Date :** 2 octobre 2026
**Périmètre :** les statistiques de fréquentation montrées aux entreprises (dashboard) et à l'équipe (console) : ce qui est compté, comment, où c'est affiché, et ce qui reste à faire.

## 1. Conclusion

Le comptage des vues fonctionne et vient d'être fiabilisé : une vue par visiteur, par page et par jour. Les trois autres mesures sont moins solides :

- **Demandes de contact** : le formulaire public de la fiche entreprise n'est pas compté. Seuls les messages envoyés par la messagerie le sont.
- **Apparitions dans la recherche** : aucune n'est enregistrée en base à ce jour, alors que le code d'enregistrement existe. La cause n'est pas établie.
- **Mots recherchés** : le texte de la recherche n'est pas conservé. On sait quelle fiche est apparue, pas pour quel mot.

La base contient aujourd'hui 29 événements, tous des vues, créés pendant les essais (9 vues d'entreprise, 20 vues de produit). Il n'y a donc pas encore de statistiques réelles à protéger : c'est le bon moment pour corriger les règles.

## 2. Comment ça marche

### 2.1 Reconnaître un visiteur
À la première visite, le site dépose un cookie `visitor_id` : un identifiant anonyme, valable un an. Il ne contient aucune donnée personnelle et n'est pas lisible par les scripts de la page. C'est lui qui permet de dire « même visiteur ».

Conséquence : un visiteur qui change de navigateur, d'appareil, ou qui efface ses cookies compte comme un nouveau visiteur.

### 2.2 Ce qui est enregistré
Chaque action comptée ajoute une ligne dans une table unique, `analytics_events`. Une ligne dit : quelle fiche (entreprise ou produit), quelle action, quel visiteur, quand.

| Mesure | Déclencheur | État |
|---|---|---|
| Vue d'une fiche entreprise | Ouverture de la page publique de l'entreprise | Fonctionne |
| Vue d'un produit | Ouverture de la page publique du produit | Fonctionne |
| Apparition dans la recherche | Une fiche sort dans les résultats de la recherche globale (page de recherche, recherche de l'accueil, palette Ctrl+K) | Code présent, aucune ligne en base |
| Demande de contact | Un membre connecté démarre une conversation avec l'entreprise | Code présent, aucune ligne en base ; formulaire public non compté |

### 2.3 La règle de comptage des vues
- **Une vue par visiteur, par page et par jour calendaire.** Recharger la page ou l'ouvrir dans un second onglet le même jour n'ajoute rien.
- **Le jour commence à minuit, heure de Kinshasa**, pour tous les visiteurs.
- Deux contrôles appliquent cette règle : un dans le navigateur, un sur le serveur avant l'écriture.

Avant ce travail, chaque rechargement ajoutait une vue, et en mode développement chaque visite en ajoutait deux.

### 2.4 Qui peut lire les chiffres
Une entreprise ne lit jamais la table directement : elle n'en a pas le droit. Les chiffres passent par des fonctions de la base qui ne renvoient que des totaux, limités aux fiches et produits de l'entreprise connectée. L'équipe a sa propre fonction, pour l'ensemble du site.

### 2.5 Où les chiffres sont affichés

| Écran | Ce qu'il montre |
|---|---|
| Accueil du dashboard | Vues du profil, taux de contact (demandes ÷ vues), courbe par jour, produits les plus vus |
| Dashboard › Statistiques | Vues du profil, apparitions dans la recherche, fiches les plus trouvées |
| Dashboard › Produits | Vues et apparitions par produit, avec la période précédente |
| Accueil de la console | Vues de profils et de produits, apparitions, demandes de contact, pour tout le site |

Chaque total est comparé à la période précédente de même durée. La période va de 7 à 90 jours.

## 3. Ce qui reste à faire

### 3.1 À corriger (les chiffres sont faux ou vides)

| Sujet | Constat | Action proposée |
|---|---|---|
| Demandes de contact du formulaire public | Le formulaire « Demander un contact » de la fiche entreprise n'enregistre rien. Le « taux de contact » de l'accueil est donc sous-estimé. | Enregistrer une demande de contact à chaque envoi du formulaire |
| Apparitions dans la recherche | Zéro ligne en base. Soit personne n'a encore cherché, soit l'enregistrement échoue. | Faire une recherche réelle et vérifier la base ; corriger si rien ne s'écrit |
| Listes du marché | Les pages « Produits » et « Entreprises » avec leurs filtres n'enregistrent aucune apparition. Seule la recherche globale est branchée. | Décider si une présence dans ces listes compte comme une apparition |
| Palette Ctrl+K | Elle enregistre une série d'apparitions à chaque recherche lancée pendant la frappe. Un seul mot tapé peut compter plusieurs fois. | Appliquer la même règle que les vues : une fois par visiteur, par fiche et par jour |
| Découpage des jours | Les vues sont dédoublonnées sur le jour de Kinshasa, mais les courbes découpent les jours à l'heure universelle (une heure d'écart). | Aligner les courbes sur l'heure de Kinshasa |
| Lignes inutiles | Chaque apparition écrit une seconde ligne « mot recherché » qui ne contient pas le mot. Elle double le volume sans rien apporter. | Supprimer cette écriture, ou stocker réellement le mot (voir 3.3) |

### 3.2 À décider (règles de comptage)

| Sujet | Constat | Question |
|---|---|---|
| Visites du propriétaire | Une entreprise qui ouvre sa propre fiche ajoute une vue. Les 9 vues d'entreprise en base viennent de là. | Exclure les visites du propriétaire ? |
| Visites de l'équipe | Un modérateur qui consulte une fiche ajoute une vue. | Exclure l'équipe ? |
| Robots | Les robots des moteurs de recherche n'exécutent en général pas le code de la page, donc ne comptent pas. Ce n'est pas garanti pour tous. | Ajouter un filtre sur les robots connus ? |
| Consentement aux cookies | Le cookie visiteur est déposé avant toute réponse au bandeau cookies, et un refus ne change rien. | Faut-il respecter le refus ? À valider avec votre conseil juridique |
| Anciennes lignes d'essai | 29 lignes d'essai, dont environ 8 doublons. | Vider la table avant la mise en ligne ? |

### 3.3 À construire (non commencé)

- **Mots recherchés** : conserver le texte de la recherche pour montrer à l'entreprise « on vous trouve avec ces mots ».
- **Visiteurs uniques** : la donnée existe (identifiant visiteur) mais aucun écran ne l'affiche ; seul le nombre de vues est montré.
- **Origine des visiteurs** : pays, site d'origine, type d'appareil. Rien n'est collecté.
- **Autres pages** : les opportunités, les actualités et les événements ne sont pas comptés.
- **Export** : pas de téléchargement des chiffres (CSV ou PDF).
- **Conservation** : aucune durée de conservation, aucun nettoyage automatique. La table grossit sans limite.

## 4. Vérifications faites

- Lecture du code qui écrit et lit les événements, et de la fonction de la base qui calcule les totaux d'une entreprise.
- Comptage des lignes en base par type.
- Tests automatiques de la règle « une vue par jour » : 4 tests réussis.

**Non vérifié :** le parcours dans le navigateur après la correction du double comptage, et la cause de l'absence d'apparitions dans la recherche.

## 5. Fichiers concernés

- `src/proxy.ts` : dépôt du cookie visiteur.
- `src/lib/analytics/track-event.ts` : écriture d'un événement, contrôle « une vue par jour ».
- `src/lib/analytics/track-view.ts`, `view-day.ts` : contrôle côté navigateur et définition du jour.
- `src/lib/search/analytics.ts` : apparitions dans la recherche.
- `src/lib/messaging/actions.ts` : demande de contact par la messagerie.
- `supabase/migrations/00052`, `00057`, `00059` : fonctions de calcul pour le dashboard, les produits et la console.
