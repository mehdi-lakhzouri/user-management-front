# 🎬 Guide de Démonstration

## 🚀 Démarrage Rapide

### 1. Prérequis
Assurez-vous que le backend NestJS est en cours d'exécution sur `http://localhost:3000`

### 2. Lancement du Frontend
```bash
npm run dev
```
L'application sera disponible sur `http://localhost:3001`

## 🎯 Scénarios de Test

### Scenario 1: Nouvel Utilisateur
1. Aller sur `http://localhost:3001`
2. Cliquer sur "Créer un compte"
3. Remplir le formulaire d'inscription :
   - **Nom complet**: Jean Dupont
   - **Âge**: 30
   - **Genre**: Homme
   - **Email**: jean@exemple.com
   - **Mot de passe**: Password123
4. Confirmer l'inscription → Redirection automatique vers le dashboard

### Scenario 2: Connexion Existante
1. Aller sur `http://localhost:3001/login`
2. Se connecter avec :
   - **Email**: jean@exemple.com
   - **Mot de passe**: Password123
3. Accès au dashboard personnalisé selon le rôle

### Scenario 3: Mot de Passe Oublié
1. Sur la page de connexion, cliquer "Mot de passe oublié ?"
2. Entrer l'email : jean@exemple.com
3. Message de confirmation (même si l'email n'existe pas pour la sécurité)

### Scenario 4: Test des Permissions
1. Se connecter en tant qu'ADMIN pour voir la gestion des utilisateurs
2. Se connecter en tant qu'USER pour voir un accès limité
3. Tester la déconnexion et la persistance de session

## 🎨 Fonctionnalités à Tester

### Interface Utilisateur
- ✅ **Mode sombre/clair** : Toggle en haut à droite
- ✅ **Responsive** : Tester sur mobile/tablette/desktop
- ✅ **Animations** : Transitions fluides entre les pages
- ✅ **Notifications** : Toasts pour succès/erreurs

### Authentification
- ✅ **Validation formulaires** : Erreurs en temps réel
- ✅ **Sécurité** : Protection des routes
- ✅ **Persistance** : Rechargement de page conserve la session
- ✅ **Auto-refresh** : Tokens renouvelés automatiquement

### Dashboard
- ✅ **Profil utilisateur** : Affichage des informations
- ✅ **Gestion des utilisateurs** : Selon les permissions
- ✅ **Navigation** : Menu responsive
- ✅ **Déconnexion** : Clean logout

## 🐛 Points de Test Critiques

### Sécurité
1. Accéder à `/dashboard` sans être connecté → Redirection vers `/login`
2. Token expiré → Auto-refresh ou déconnexion
3. Manipulation manuelle du localStorage → Validation côté API

### UX/UI
1. Formulaires invalides → Messages d'erreur clairs
2. Chargement → Indicateurs visuels
3. Erreurs réseau → Gestion gracieuse
4. Navigation → Breadcrumbs et retours

### Performance
1. Chargement initial rapide
2. Navigation entre pages fluide
3. Pas de rechargement inutile
4. Optimisation des images

## 📱 Test Responsive

### Mobile (375px)
- Navigation burger menu
- Formulaires adaptés
- Boutons facilement cliquables
- Texte lisible

### Tablette (768px)
- Layout en grille adaptatif
- Sidebar qui se replie
- Interactions tactiles optimisées

### Desktop (1200px+)
- Pleine utilisation de l'espace
- Hover effects
- Sidebar fixe
- Multi-colonnes

## 🔍 Validation API

### Endpoints Testés
- `POST /api/auth/login` ✅
- `POST /api/auth/register` ✅
- `POST /api/auth/refresh` ✅
- `GET /api/users/profile` ✅
- `POST /api/auth/logout` ✅
- `GET /api/users` ✅ (Admin/Moderator)

### Gestion d'Erreurs
- 400 Bad Request → Affichage erreur spécifique
- 401 Unauthorized → Auto-refresh ou déconnexion
- 403 Forbidden → Message d'accès refusé
- 500 Server Error → Message générique
- Timeout → Message de timeout

## 🎯 Checklist de Validation

### ✅ Authentification
- [ ] Inscription avec validation
- [ ] Connexion avec persistance
- [ ] Déconnexion propre
- [ ] Mot de passe oublié
- [ ] Auto-refresh des tokens

### ✅ Interface
- [ ] Design moderne et cohérent
- [ ] Mode sombre/clair
- [ ] Animations fluides
- [ ] Responsive design
- [ ] Accessibilité

### ✅ Fonctionnalités
- [ ] Dashboard adaptatif selon rôle
- [ ] Gestion des utilisateurs (Admin)
- [ ] Profil utilisateur
- [ ] Navigation intuitive
- [ ] Messages d'erreur clairs

### ✅ Performance
- [ ] Chargement rapide
- [ ] Navigation fluide
- [ ] Optimisation des ressources
- [ ] Gestion mémoire

## 🚀 Prêt pour Production

L'application est maintenant prête pour :
- ✅ Déploiement Vercel
- ✅ Intégration CI/CD
- ✅ Tests automatisés
- ✅ Monitoring production

## 📞 Support

En cas de problème :
1. Vérifier que le backend NestJS fonctionne
2. Contrôler les variables d'environnement
3. Vider le cache navigateur si nécessaire
4. Consulter la console développeur pour les erreurs
