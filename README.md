# 🚀 User Management System - Frontend

Un système complet d'authentification et de gestion d'utilisateurs développé avec **Next.js 15**, **TypeScript**, et une interface utilisateur moderne.

## 🎯 Aperçu

Cette application frontend moderne s'intègre parfaitement avec le backend NestJS pour offrir :
- ✅ Authentification JWT sécurisée avec refresh tokens
- ✅ Gestion des rôles et permissions (USER, MODERATOR, ADMIN)
- ✅ Interface utilisateur responsive et moderne
- ✅ Mode sombre/clair
- ✅ Formulaires avec validation en temps réel
- ✅ Notifications toast élégantes

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Langage**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **Gestion d'état**: Zustand
- **Formulaires**: React Hook Form + Zod
- **HTTP**: Axios avec intercepteurs
- **Animations**: Framer Motion
- **Notifications**: Sonner
- **Thèmes**: next-themes

## 📂 Structure du Projet

```
src/
├── app/                    # Routes Next.js (App Router)
│   ├── (auth)/            # Groupe de routes d'authentification
│   │   ├── login/         # Page de connexion
│   │   ├── register/      # Page d'inscription
│   │   ├── forgot-password/ # Mot de passe oublié
│   │   └── reset-password/  # Réinitialisation
│   ├── dashboard/         # Dashboard principal
│   ├── layout.tsx         # Layout racine
│   └── page.tsx          # Page d'accueil
├── components/            # Composants réutilisables
│   ├── ui/               # Composants shadcn/ui
│   ├── forms/            # Formulaires d'authentification
│   └── providers/        # Providers (Thème, etc.)
├── lib/                  # Utilitaires et configuration
│   ├── api.ts           # Configuration Axios & services API
│   ├── validations.ts   # Schémas de validation Zod
│   └── utils.ts         # Utilitaires généraux
├── store/               # Gestion d'état Zustand
│   └── useAuthStore.ts  # Store d'authentification
└── hooks/               # Hooks personnalisés
    └── useAuth.ts       # Hooks d'authentification
```

## 🚀 Installation & Démarrage

### Prérequis

- Node.js 18+
- npm ou yarn
- Backend NestJS en cours d'exécution sur `http://localhost:3000`

### Installation

```bash
# Installer les dépendances
npm install

# Configurer l'environnement
# Le fichier .env.local est déjà configuré
```

### Configuration

Le fichier `.env.local` est configuré avec :

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Démarrage

```bash
# Mode développement
npm run dev

# Construction pour production
npm run build

# Démarrage en production
npm start
```

L'application sera accessible sur `http://localhost:3001` (pour éviter les conflits avec le backend sur le port 3000).

## 🔐 Authentification

### Flux d'authentification

1. **Inscription/Connexion** → Récupération des tokens JWT
2. **Storage sécurisé** → Tokens stockés avec Zustand + LocalStorage
3. **Auto-refresh** → Renouvellement automatique des tokens expirés
4. **Protection des routes** → Middleware Next.js + composants protégés

### Gestion des rôles

- **USER** : Accès au profil personnel
- **MODERATOR** : Visualisation des utilisateurs
- **ADMIN** : CRUD complet sur les utilisateurs

## 📱 Pages & Fonctionnalités

### 🏠 Page d'accueil (`/`)
- Landing page moderne avec présentation des fonctionnalités
- Redirection automatique vers le dashboard si connecté
- Boutons d'accès rapide vers login/register

### 🔑 Authentification

#### Connexion (`/login`)
- Formulaire email + mot de passe
- Validation en temps réel
- Gestion des erreurs avec toasts
- Lien vers mot de passe oublié

#### Inscription (`/register`)
- Formulaire complet : nom, âge, genre, email, mot de passe
- Validation stricte avec Zod
- Confirmation du mot de passe
- Redirection automatique après succès

#### Mot de passe oublié (`/forgot-password`)
- Formulaire d'envoi d'email
- Feedback UX-friendly (toujours succès pour la sécurité)

#### Réinitialisation (`/reset-password`)
- Validation du token dans l'URL
- Formulaire nouveau mot de passe
- Confirmation et redirection

### 📊 Dashboard (`/dashboard`)
- **Profil utilisateur** : Affichage des informations personnelles
- **Gestion des utilisateurs** : Liste des users (selon permissions)
- **Actions rapides** : Déconnexion, actualisation
- **Interface adaptative** : Selon le rôle de l'utilisateur

## 🎨 Interface Utilisateur

### Design System
- **shadcn/ui** : Composants modernes et accessibles
- **TailwindCSS** : Styling utilitaire et responsive
- **Mode sombre** : Toggle automatique avec persistance
- **Animations** : Micro-interactions avec Framer Motion

### Responsivité
- **Mobile-first** : Optimisé pour tous les écrans
- **Grid adaptative** : Layouts qui s'ajustent automatiquement
- **Navigation tactile** : UX optimisée pour mobile

## 🔄 Gestion d'État

### Store Zustand (`useAuthStore`)

```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Actions disponibles
setAuth(user, accessToken, refreshToken)
clearAuth()
updateUser(userData)
setLoading(isLoading)
```

### Persistance
- **LocalStorage** : Tokens et informations utilisateur
- **Hydratation** : Restauration automatique au chargement
- **Sécurité** : Validation des tokens au démarrage

## 🌐 API Integration

### Configuration Axios

```typescript
// Intercepteur automatique pour l'authentification
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Refresh automatique des tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Auto-refresh logic
    }
  }
);
```

### Services disponibles

- `authService.login(credentials)`
- `authService.register(userData)`
- `authService.logout()`
- `authService.refreshToken(token)`
- `userService.getProfile()`
- `userService.getAllUsers()` (Admin/Moderator)

## 🛡️ Sécurité

### Protection des routes
- **Middleware Next.js** : Vérification côté serveur
- **Composant ProtectedRoute** : Protection côté client
- **Hooks de vérification** : `useRequireAuth`, `usePermissions`

### Gestion des tokens
- **Refresh automatique** : Avant expiration
- **Logout en cas d'échec** : Si refresh impossible
- **Storage sécurisé** : Pas d'exposition des tokens

## 🎯 Bonnes Pratiques

### Code Quality
- **TypeScript strict** : Typage complet
- **ESLint + Prettier** : Formatage automatique
- **Composants modulaires** : Réutilisabilité maximale
- **Hooks personnalisés** : Logique métier isolée

### Performance
- **Code splitting** : Chargement à la demande
- **Optimisation images** : Next.js Image
- **Lazy loading** : Composants et routes
- **Caching intelligent** : Zustand persist

### UX/UI
- **Loading states** : Feedback visuel constant
- **Error handling** : Messages d'erreur clairs
- **Accessibility** : ARIA labels et navigation clavier
- **Responsive design** : Toutes tailles d'écran

## 🚀 Déploiement

### Vercel (Recommandé)

```bash
# Connecter à Vercel
npx vercel

# Ou déploiement automatique via Git
git push origin main
```

### Variables d'environnement

```env
NEXT_PUBLIC_API_URL=https://votre-api.com/api
```

### Build de production

```bash
npm run build
npm run start
```

## 📝 Scripts disponibles

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run start        # Serveur de production
npm run lint         # Vérification ESLint
```

---

**Stack technique complète** : Next.js 15, TypeScript, TailwindCSS, shadcn/ui, Zustand, React Hook Form, Zod, Axios, Framer Motion, Sonner
