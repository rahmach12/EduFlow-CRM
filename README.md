# EduFlow CRM 🎓

> **Système de Gestion Universitaire Complet — Projet de Fin d'Études (PFE)**

[![Laravel](https://img.shields.io/badge/Laravel-13-FF2D20?style=flat&logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=flat&logo=mysql&logoColor=white)](https://mysql.com)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=flat&logo=json-web-tokens)](https://jwt.io)

---

## 📋 Description

**EduFlow CRM** est un système de gestion universitaire complet, développé dans le cadre d'un Projet de Fin d'Études (PFE). Il centralise la gestion administrative, pédagogique et financière d'une université dans une interface moderne, responsive et multi-rôles.

Le système suit la logique universitaire tunisienne, incluant :
- La règle des **30% d'absences** (élimination automatique)
- Le calcul des moyennes pondérées **(CC / DS / TP / Examen)**
- La gestion des **stages PFE, PFA et stages d'été**
- La génération de **bulletins PDF** et relevés de notes
- Des **notifications en temps réel** via WebSockets (Pusher)

---

## 🚀 Fonctionnalités par Rôle

| Rôle | Accès |
|------|-------|
| 👑 **Super Admin** | Gestion complète : utilisateurs, étudiants, enseignants, classes, notes, finances, stages |
| 👨‍🏫 **Enseignant** | Appel mobile-first, saisie des notes, gestion des absences |
| 🎓 **Étudiant** | Dashboard personnel, notes, absences, stages, documents |
| 💰 **Finance Officer** | Gestion des paiements, statuts, reçus PDF |
| 🗂️ **Internship Officer** | Validation des stages, planification des soutenances |
| 📚 **Scolarité** | Suivi des absences, éliminations, certificats |

---

## 🛠️ Stack Technique

### Backend
| Technologie | Version | Usage |
|------------|---------|-------|
| **Laravel** | 13 | Framework PHP — API REST |
| **MySQL** | 8 | Base de données relationnelle |
| **JWT Auth** | `tymon/jwt-auth` | Authentification sécurisée |
| **Pusher** | PHP Server | Notifications temps réel |

### Frontend
| Technologie | Version | Usage |
|------------|---------|-------|
| **React** | 19 | Interface utilisateur |
| **Vite** | 8 | Build tool ultra-rapide |
| **Tailwind CSS** | 4 | Système de design |
| **React Router** | v7 | Navigation client |
| **Axios** | — | Client HTTP |
| **Recharts** | — | Graphiques et analytics |
| **jsPDF + AutoTable** | — | Génération PDF |
| **xlsx** | — | Export Excel |
| **Pusher JS + Laravel Echo** | — | WebSockets temps réel |
| **lucide-react** | — | Icônes modernes |

---

## 📁 Structure du Projet

```text
pfe/
├── backend/                    # API Laravel REST
│   ├── app/
│   │   ├── Http/Controllers/   # 15 contrôleurs API
│   │   ├── Models/             # 16 modèles Eloquent
│   │   └── Events/             # Événements Pusher
│   ├── database/
│   │   ├── migrations/         # Schéma complet CRM
│   │   └── seeders/            # Données de démo
│   └── routes/api.php          # Tous les endpoints API
│
├── frontend/                   # Application React + Vite
│   └── src/
│       ├── contexts/           # AuthContext, NotificationContext, SearchContext
│       ├── layouts/            # DashboardLayout (sidebar + navbar)
│       ├── pages/              # 18 pages (Dashboard, Students, Notes...)
│       ├── components/         # SkeletonLoader, EmptyState, GlobalSearch, Modal
│       └── lib/                # Configuration Axios
│
└── README.md
```

---

## ⚙️ Installation

### Prérequis

- PHP **8.2+**
- Composer **2.0+**
- Node.js **18+**
- MySQL **8+** (via XAMPP ou standalone)

---

### 🔧 Backend (Laravel)

```bash
# 1. Aller dans le dossier backend
cd backend

# 2. Installer les dépendances PHP
composer install

# 3. Copier le fichier d'environnement
cp .env.example .env

# 4. Générer la clé d'application
php artisan key:generate

# 5. Générer la clé JWT
php artisan jwt:secret
```

**Configuration `.env` — Base de données :**
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=school_crm
DB_USERNAME=root
DB_PASSWORD=

JWT_SECRET=your_generated_secret

BROADCAST_DRIVER=pusher
PUSHER_APP_ID=your_app_id
PUSHER_APP_KEY=your_app_key
PUSHER_APP_SECRET=your_app_secret
PUSHER_APP_CLUSTER=mt1
```

```bash
# 6. Créer les tables
php artisan migrate

# 7. Remplir avec les données de démo
php artisan db:seed

# 8. Démarrer le serveur
php artisan serve
# → API disponible sur http://localhost:8000
```

---

### 💻 Frontend (React)

```bash
# 1. Aller dans le dossier frontend
cd frontend

# 2. Installer les dépendances Node
npm install

# 3. Démarrer le serveur de développement
npm run dev
# → Application disponible sur http://localhost:5173
```

---

## 🔐 Comptes de Démonstration

Après `php artisan db:seed` :

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| **Admin** | `admin@school.com` | `password123` |
| **Finance** | `finance@school.com` | `password123` |
| **Internship** | `internship@school.com` | `password123` |
| **Enseignant** | Généré par seed | `teacher` |
| **Étudiant** | Généré par seed | `student` |

> 💡 Les comptes Scolarité et Internship Officer peuvent être créés depuis **Super Admin → Gestion des Utilisateurs**.

---

## 🌐 API Endpoints Principaux

Base URL : `http://localhost:8000/api`

### Authentification
| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/login` | Connexion & retour du token JWT |
| `POST` | `/logout` | Déconnexion |
| `GET` | `/me` | Utilisateur connecté |

### Ressources (protégées par JWT)
| Ressource | Routes disponibles |
|-----------|-------------------|
| Students | `GET/POST/PUT/DELETE /students` |
| Teachers | `GET/POST/PUT/DELETE /teachers` |
| Classes | `GET/POST/PUT/DELETE /classes` |
| Subjects | `GET/POST/PUT/DELETE /subjects` |
| Notes | `GET/POST/PUT/DELETE /notes` |
| Payments | `GET/POST/PUT/DELETE /payments` |
| Internships | `GET/POST/PUT/DELETE /internships` |
| Users | `GET/POST/PUT/DELETE /users` *(Admin)* |

### Endpoints Spéciaux
| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/students/{id}/average` | Moyenne pondérée complète |
| `GET` | `/dashboard/stats` | Statistiques globales |
| `GET` | `/dashboard/internships` | Stats stages |
| `GET` | `/dashboard/scolarite` | Stats scolarité |
| `POST` | `/internships/{id}/status` | Approuver/Rejeter |
| `POST` | `/scolarite/eliminate/{student}` | Éliminer étudiant |
| `POST` | `/scolarite/reinstate/{student}` | Réintégrer étudiant |
| `GET` | `/roles` | Liste des rôles |

---

## ✨ Fonctionnalités UX

- 🔍 **Recherche Globale** `Ctrl+K` — Palette de commandes instant
- 💀 **Skeleton Loading** — Animations de chargement sur toutes les pages
- 📭 **Empty States** — États vides illustrés avec CTA
- 📅 **Année Académique** — Sélecteur persistant dans la navbar
- 📊 **Export Excel + PDF** — Sur toutes les listes
- 🔔 **Notifications Temps Réel** — Par rôle (Pusher WebSockets)
- 📱 **Responsive** — Mobile-first pour les enseignants

---

## 👩‍💻 Auteur

**Rahma Chrina**  
Projet de Fin d'Études — Génie Logiciel  
EduFlow CRM — Système de Gestion Universitaire

---

## 📄 Licence

Ce projet est réalisé dans un cadre académique (PFE). Tous droits réservés.
