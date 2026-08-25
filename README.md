# ECENA — paquet Netlify securise

Ce dossier est le paquet a deposer sur Netlify. Le dossier `site` est le seul contenu public. L'interface passe par `/api/ecena`, une fonction Netlify qui verifie Firebase avant de contacter Apps Script.

## 1. Apps Script

1. Remplacer le code du projet Apps Script par `apps-script/Code.gs`.
2. Dans **Parametres du projet > Proprietes du script**, creer les proprietes suivantes :
   - `HSMS_CLIENT_ID`
   - `HSMS_CLIENT_SECRET`
   - `HSMS_TOKEN`
   - `ECENA_BACKEND_SECRET` : une longue valeur aleatoire unique (au moins 32 caracteres).
3. Mettre a jour le deploiement **Application Web** existant. Il doit s'executer sous le compte proprietaire et etre accessible par toute personne, car seule la fonction Netlify l'appelle. Copier son URL `/exec`.

## 2. Netlify

Importer ce dossier comme projet Netlify (ou le deposer dans un depot Git connecte a Netlify). Ajouter dans les variables d'environnement Netlify, avec la portee **Functions**, les valeurs suivantes :

- `APPS_SCRIPT_URL` : URL `/exec` du deploiement Apps Script
- `ECENA_BACKEND_SECRET` : exactement la meme valeur que dans Apps Script
- `ECENA_ALLOWED_EMAILS` : les trois e-mails autorises, separes par des virgules
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` : la cle privee du compte de service Firebase ; conserver les `\\n` dans la valeur

Creer le compte de service dans Firebase / Google Cloud, puis telecharger sa cle JSON. Copier ses champs `project_id`, `client_email` et `private_key` dans les trois variables ci-dessus. Ne jamais mettre ce JSON dans ce dossier ni dans le HTML.

Netlify installe automatiquement `firebase-admin` avec le fichier `package.json`.

## 3. Firebase et controle final

Dans Firebase Authentication, ajouter le domaine Netlify (et le domaine personnalise le cas echeant) a la liste des domaines autorises.

Apres le deploiement, tester avec un des trois comptes : connexion, lecture de liste, ajout fictif, modification d'un versement puis envoi d'un SMS de test. Un utilisateur non autorise doit voir l'acces refuse et un appel direct a l'URL Apps Script doit renvoyer `Non autorise`.

## Important

Les identifiants SMS precemment presents dans le code doivent etre renouveles chez le fournisseur avant d'etre ajoutes aux Proprietes Apps Script.
