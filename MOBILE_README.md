# Guide : Exécuter l'application (Étudiant / Professeur) sur Mobile

Ce guide explique comment tester et utiliser les interfaces Étudiant et Professeur sur un appareil mobile.

## Option 1 : Tester la version Web (React) sur votre téléphone via le réseau local

Puisque votre frontend React est "responsive" (adaptable aux écrans de téléphones), vous pouvez y accéder directement depuis le navigateur de votre téléphone sans rien installer, à condition que votre PC et votre téléphone soient sur le **même réseau Wi-Fi**.

### Étape 1 : Récupérer l'adresse IP locale de votre PC
1. Ouvrez un terminal PowerShell sur votre PC.
2. Tapez la commande `ipconfig` et appuyez sur Entrée.
3. Cherchez la ligne **Adresse IPv4** (ex: `192.168.1.15`).

### Étape 2 : Lancer le Backend (Laravel) sur l'IP locale
Par défaut, `php artisan serve` n'est accessible que depuis `localhost`. Pour l'ouvrir au réseau local :
```bash
cd backend
php artisan serve --host=0.0.0.0 --port=8000
```
*(Votre API sera maintenant accessible depuis `http://192.168.1.15:8000`)*

### Étape 3 : Lancer le Frontend (React) sur l'IP locale
Si vous utilisez **Vite.js**, lancez la commande suivante pour exposer le serveur sur le réseau :
```bash
cd frontend
npm run dev -- --host
```
*(Le terminal vous affichera une URL de type "Network: http://192.168.1.15:5173/")*

**Important :** Vous devrez peut-être modifier temporairement l'URL de l'API dans votre frontend (ex: dans `.env` ou `src/lib/axios.js`) pour pointer vers `http://192.168.1.15:8000/api` au lieu de `http://localhost:8000/api`.

### Étape 4 : Tester sur le téléphone
1. Ouvrez Safari ou Chrome sur votre téléphone.
2. Allez sur l'URL "Network" fournie par Vite (ex: `http://192.168.1.15:5173`).
3. Connectez-vous avec un compte **Étudiant** ou **Professeur**. L'interface s'adaptera automatiquement à l'écran de votre téléphone !

---

## Option 2 : Si vous développez une application mobile native (Flutter)

Si la partie Étudiant/Professeur est développée dans un projet **Flutter** séparé, voici comment la lancer et la connecter au backend Laravel.

### 1. Prérequis
- Installer Flutter SDK et Android Studio (ou Xcode pour iOS).
- Un émulateur lancé, ou un téléphone physique branché en USB (avec le débogage USB activé).

### 2. Configuration de l'API dans Flutter
Si vous utilisez l'émulateur Android, `localhost` ne fonctionnera pas car l'émulateur a son propre réseau. 
- Pour un **émulateur Android**, l'URL de votre API Laravel doit être : `http://10.0.2.2:8000/api`
- Pour un **téléphone physique en USB/Wi-Fi**, utilisez l'IP de votre PC : `http://192.168.1.15:8000/api`

### 3. Lancer l'application Flutter
Ouvrez un terminal dans le dossier de votre projet Flutter et exécutez :
```bash
flutter pub get
flutter run
```
Sélectionnez votre appareil cible (votre téléphone physique ou l'émulateur). L'application sera compilée et installée sur l'appareil.
