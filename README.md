# Tatanouille — Mon Espace Personnel

Application web progressive (PWA-ready) pour gérer sa discipline, ses projets et ses dépenses. Données synchronisées en temps réel via Firebase Realtime Database.

## ✨ Fonctionnalités

### ⚡ Discipline
- Ajout de tâches récurrentes
- Cocher les tâches chaque jour
- Résumé en % avec message motivant
- Diagramme camembert (tâches faites vs à faire)
- Historique des 7 derniers jours (barres)

### ◈ Projets
- Créer des projets avec icône aléatoire
- Ouvrir un projet pour voir son contenu
- Ajouter du texte, des images, des vidéos, des fichiers
- Supprimer un projet ou un élément

### ◎ Dépenses
- Définir un capital de départ
- Affichage du capital initial, du solde actuel et du profit/perte
- Ajouter des transactions nommées (dépôt ou retrait)
- Historique des transactions trié par date

## 🚀 Déploiement sur GitHub Pages

### Prérequis
- Compte GitHub
- Projet Firebase configuré (Realtime Database activé, règles en lecture/écriture ouvertes en dev)

### Étapes

1. **Créer un dépôt GitHub** (public ou privé)

2. **Uploader tous les fichiers** dans la branche `main` :
   ```
   tatanouille/
   ├── index.html
   ├── css/
   │   └── style.css
   ├── js/
   │   ├── firebase.js
   │   ├── app.js
   │   ├── discipline.js
   │   ├── projets.js
   │   └── depenses.js
   └── README.md
   ```

3. **Activer GitHub Pages** :
   - Aller dans `Settings > Pages`
   - Source : `Deploy from a branch`
   - Branch : `main` / `/ (root)`
   - Cliquer sur **Save**

4. **Accéder à l'app** via `https://<ton-username>.github.io/<nom-du-repo>/`

### Règles Firebase (dev)
Dans la console Firebase > Realtime Database > Règles :
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
> ⚠️ Ces règles sont ouvertes. Pour la prod, ajoute une authentification Firebase.

## 🔧 Configuration Firebase
Le fichier `js/firebase.js` contient déjà la configuration du projet Firebase. Si tu changes de projet Firebase, mets à jour l'objet `firebaseConfig`.

## 📱 Responsive
L'interface s'adapte aux écrans mobiles (sidebar horizontale, grilles en colonne).

## 🛠️ Stack technique
- HTML / CSS / JS vanilla (ES Modules)
- Firebase Realtime Database (SDK v10, modules ESM)
- Google Fonts (Syne + DM Sans)
- Canvas API (diagramme camembert)
- Aucun framework, aucun build tool nécessaire
