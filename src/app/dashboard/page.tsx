'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut, User, Users, Shield, Crown, Calendar } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DateClientOnly } from '@/components/ui/DateClientOnly';
import { HydrationGuard } from '@/components/HydrationGuard';

import { useAuthStore, usePermissions } from '@/store/useAuthStore';
import { authService, userService, type User as UserType } from '@/lib/api';
import { getAvatarUrl } from '@/lib/utils-avatar';
import { ProfileEditDialog } from '@/components/forms/ProfileEditForm';
import { UserManagement } from '@/components/admin/UserManagement';
import { ChangePasswordDialog } from '@/components/forms/ChangePasswordDialog';
import { usePasswordChangeRequired } from '@/hooks/usePasswordChangeRequired';

function DashboardContent() {
  const { user, clearAuth, updateUser, isAuthenticated, setUser, lastTokenRefresh } = useAuthStore();
  const { canManageUsers, isAdmin, isModerator } = usePermissions();
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'users'>('profile');
  const router = useRouter();

  // Hook pour gérer le changement de mot de passe obligatoire
  const {
    showChangePassword,
    isRequired,
    handleChangePasswordClose,
    handleChangePasswordComplete,
  } = usePasswordChangeRequired();

  // Check automatique pour restaurer l'utilisateur si token présent
  useEffect(() => {
    console.log('[DEBUG] Dashboard useEffect', { isAuthenticated, user });
    if (isAuthenticated && !user) {
      console.log('[DEBUG] Tentative de restauration du profil utilisateur via /users/profile');
      userService.getProfile()
        .then((profile) => {
          console.log('[DEBUG] Profil restauré avec succès', profile);
          setUser(profile);
        })
        .catch((err) => {
          console.error('[DEBUG] Échec restauration profil ou refresh token', err);
          clearAuth();
          router.push('/login');
        });
    }
  }, [isAuthenticated, user, setUser, clearAuth, router]);

  // Recharger les données après un refresh de token
  useEffect(() => {
    if (lastTokenRefresh && user && canManageUsers) {
      console.log('[DEBUG] Token refreshé, rechargement des données utilisateur');
      loadUsers();
    }
  }, [lastTokenRefresh]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      clearAuth();
      toast.success('Déconnexion réussie');
      router.push('/login');
    } catch (error) {
      clearAuth();
      router.push('/login');
    }
  };

  const loadUsers = async () => {
    if (!canManageUsers) return;
    
    setIsLoading(true);
    try {
      const usersData = await userService.getAllUsers({ page: 1, limit: 100 }); // Get first 100 users for stats
      setUsers(usersData.users); // Use the users array from paginated response
    } catch (error: unknown) {
      toast.error('Erreur', {
        description: 'Impossible de charger la liste des utilisateurs',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canManageUsers) {
      loadUsers();
    }
  }, [canManageUsers]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Crown className="h-4 w-4" />;
      case 'MODERATOR':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case 'ADMIN':
        return 'destructive';
      case 'MODERATOR':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getInitials = (fullname: string) => {
    return fullname
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold">Dashboard</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <ThemeToggle />
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                  {user.avatar && (
                    <img 
                      src={getAvatarUrl(user.avatar)} 
                      alt={user.fullname}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        console.error('Erreur chargement avatar:', getAvatarUrl(user.avatar));
                        e.currentTarget.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log('✅ Avatar chargé avec succès:', getAvatarUrl(user.avatar));
                      }}
                    />
                  )}
                  <AvatarFallback className="text-xs sm:text-sm bg-gradient-to-br from-primary/20 to-primary/10">
                    {getInitials(user.fullname)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:block">
                  <p className="text-sm font-medium">{user.fullname}</p>
                  <div className="flex items-center space-x-1">
                    {getRoleIcon(user.role)}
                    <p className="text-xs text-muted-foreground">{user.role}</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="hidden sm:flex">
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Déconnexion</span>
                <span className="md:hidden">Exit</span>
              </Button>
              {/* Menu burger pour mobile */}
              <Button variant="outline" size="sm" onClick={handleLogout} className="sm:hidden">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Navigation par onglets pour les administrateurs/modérateurs */}
        {canManageUsers && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="overflow-hidden bg-gradient-to-r from-background to-muted/30 border-border/50 shadow-lg">
              <CardContent className="p-1">
                <div className="relative flex bg-muted/30 rounded-lg p-1">
                  {/* Indicateur de l'onglet actif */}
                  <motion.div
                    className="absolute top-1 bottom-1 bg-primary rounded-md shadow-md"
                    layoutId="activeTab"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{
                      left: activeTab === 'profile' ? '4px' : '50%',
                      width: 'calc(50% - 4px)',
                    }}
                  />
                  
                  <button
                    className={`relative z-10 flex-1 flex items-center justify-center sm:justify-start px-3 sm:px-4 py-2.5 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 ${
                      activeTab === 'profile'
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setActiveTab('profile')}
                  >
                    <motion.div
                      className="flex items-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <User className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden xs:inline">Mon Profil</span>
                      <span className="xs:hidden">Profil</span>
                    </motion.div>
                  </button>
                  
                  <button
                    className={`relative z-10 flex-1 flex items-center justify-center sm:justify-start px-3 sm:px-4 py-2.5 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 ${
                      activeTab === 'users'
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setActiveTab('users')}
                  >
                    <motion.div
                      className="flex items-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Users className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden xs:inline">Gestion des Utilisateurs</span>
                      <span className="xs:hidden">Utilisateurs</span>
                    </motion.div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Contenu du profil utilisateur */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Carte de profil administrateur avec badge spécial */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="relative overflow-hidden border-l-4 border-l-primary bg-gradient-to-br from-background via-background to-muted/20 shadow-xl">
                {/* Effet de brillance subtil */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-full animate-pulse" />
                
                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          {user.role === 'ADMIN' ? (
                            <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500 drop-shadow-lg" />
                          ) : (
                            <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 drop-shadow-lg" />
                          )}
                        </motion.div>
                        <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                          Profil {user.role === 'ADMIN' ? 'Administrateur' : 'Modérateur'}
                        </span>
                      </CardTitle>
                      <CardDescription className="text-sm sm:text-base mt-1">
                        {user.role === 'ADMIN' 
                          ? 'Accès complet à la gestion du système' 
                          : 'Accès à la visualisation et modération'
                        }
                      </CardDescription>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Badge 
                        variant={getRoleBadgeVariant(user.role)} 
                        className="flex items-center space-x-1 shadow-md border border-border/50 px-3 py-1"
                      >
                        {getRoleIcon(user.role)}
                        <span className="font-semibold">{user.role}</span>
                      </Badge>
                    </motion.div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Section Avatar */}
                  <div className="flex justify-center mb-4 sm:mb-6">
                    <motion.div
                      className="text-center space-y-3"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <div className="relative">
                        <Avatar className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 mx-auto border-4 border-background shadow-2xl ring-2 ring-primary/20">
                          {user.avatar && (
                            <img 
                              src={getAvatarUrl(user.avatar)} 
                              alt={user.fullname}
                              className="w-full h-full object-cover rounded-full"
                              onError={(e) => {
                                console.error('Erreur chargement avatar profil:', getAvatarUrl(user.avatar));
                                e.currentTarget.style.display = 'none';
                              }}
                              onLoad={() => {
                                console.log('Avatar profil chargé avec succès:', getAvatarUrl(user.avatar));
                              }}
                            />
                          )}
                          <AvatarFallback className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-br from-primary/20 to-primary/10">
                            {getInitials(user.fullname)}
                          </AvatarFallback>
                        </Avatar>
                        {/* Indicateur de statut en ligne */}
                        <div className="absolute bottom-1 right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 border-2 border-background rounded-full shadow-md"></div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {user.avatar ? 'Avatar personnalisé' : 'Avatar par défaut'}
                        </p>
                        <p className="text-xs text-primary/60">En ligne</p>
                      </div>
                    </motion.div>
                  </div>
                  
                  <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <motion.div
                      className="space-y-3 sm:space-y-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="group p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-200">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Nom complet</p>
                        <p className="text-base sm:text-lg font-semibold break-words group-hover:text-primary transition-colors">
                          {user.fullname}
                        </p>
                      </div>
                      <div className="group p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-200">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Email</p>
                        <p className="text-base sm:text-lg break-all group-hover:text-primary transition-colors">
                          {user.email}
                        </p>
                      </div>
                    </motion.div>
                    <motion.div
                      className="space-y-3 sm:space-y-4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="group p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-200">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Âge</p>
                        <p className="text-base sm:text-lg group-hover:text-primary transition-colors">
                          {user.age} ans
                        </p>
                      </div>
                      <div className="group p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-200">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Genre</p>
                        <p className="text-base sm:text-lg group-hover:text-primary transition-colors">
                          {user.gender === 'male' ? 'Homme' : 
                           user.gender === 'female' ? 'Femme' : 'Autre'}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                  
                  <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />
                  
                  <motion.div
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-muted-foreground space-y-2 sm:space-y-0 p-3 rounded-lg bg-muted/20"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-primary" />
                      Membre depuis
                    </span>
                    <span className="font-medium">
                      <DateClientOnly dateString={user.createdAt} />
                    </span>
                  </motion.div>

                  {/* Bouton Modifier le profil */}
                  <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />
                  
                  <motion.div
                    className="flex justify-center pt-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <Button 
                      onClick={() => setIsEditingProfile(true)}
                      className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200"
                      size="lg"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Modifier mon profil
                    </Button>
                  </motion.div>

                  {/* Statistiques pour les admins */}
                  {canManageUsers && (
                    <>
                      <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />
                      <motion.div
                        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, staggerChildren: 0.1 }}
                      >
                        <motion.div
                          className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all duration-200"
                          whileHover={{ scale: 1.02 }}
                          variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 }
                          }}
                        >
                          <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {Array.isArray(users) ? users.length : 0}
                          </div>
                          <p className="text-xs text-blue-700/70 dark:text-blue-300/70">Utilisateurs</p>
                        </motion.div>
                        
                        <motion.div
                          className="text-center p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border border-green-200 dark:border-green-800 hover:shadow-md transition-all duration-200"
                          whileHover={{ scale: 1.02 }}
                          variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 }
                          }}
                        >
                          <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                            {Array.isArray(users) ? users.filter(u => u.isActive).length : 0}
                          </div>
                          <p className="text-xs text-green-700/70 dark:text-green-300/70">Actifs</p>
                        </motion.div>
                        
                        <motion.div
                          className="text-center p-3 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/30 border border-amber-200 dark:border-amber-800 hover:shadow-md transition-all duration-200"
                          whileHover={{ scale: 1.02 }}
                          variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 }
                          }}
                        >
                          <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
                            {Array.isArray(users) ? users.filter(u => u.role === 'ADMIN').length : 0}
                          </div>
                          <p className="text-xs text-amber-700/70 dark:text-amber-300/70">Admins</p>
                        </motion.div>
                        
                        <motion.div
                          className="text-center p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border border-purple-200 dark:border-purple-800 hover:shadow-md transition-all duration-200"
                          whileHover={{ scale: 1.02 }}
                          variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 }
                          }}
                        >
                          <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {Array.isArray(users) ? users.filter(u => u.role === 'MODERATOR').length : 0}
                          </div>
                          <p className="text-xs text-purple-700/70 dark:text-purple-300/70">Modos</p>
                        </motion.div>
                      </motion.div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Onglet gestion des utilisateurs pour admin/modérateur */}
        {activeTab === 'users' && canManageUsers && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <UserManagement userRole={user?.role as 'ADMIN' | 'MODERATOR'} />
          </motion.div>
        )}
      </main>

      {/* Modal de modification du profil */}
      <ProfileEditDialog 
        isOpen={isEditingProfile} 
        onClose={() => setIsEditingProfile(false)} 
        user={user} 
        onUpdate={(updatedUser) => updateUser(updatedUser)} 
      />

      {/* Dialog de changement de mot de passe obligatoire */}
      <ChangePasswordDialog
        isOpen={showChangePassword}
        onClose={handleChangePasswordClose}
        isRequired={isRequired}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
