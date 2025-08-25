'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut, User, Users, Settings, Shield, Crown, Eye } from 'lucide-react';
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
import { ProfileEditDialog } from '@/components/forms/ProfileEditForm';
import { UserManagement } from '@/components/admin/UserManagement';

function DashboardContent() {
  const { user, clearAuth, updateUser, isAuthenticated, setUser } = useAuthStore();
  const { canManageUsers, isAdmin, isModerator } = usePermissions();
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'users'>('profile');
  const router = useRouter();

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
      const usersData = await userService.getAllUsers();
      setUsers(usersData);
    } catch (error: any) {
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
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold">Dashboard</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <div className="flex items-center space-x-2">
                <Avatar>
                  {user.avatar && (
                    <img 
                      src={`http://localhost:3000${user.avatar}`} 
                      alt={user.fullname}
                      className="w-full h-full object-cover rounded-full"
                    />
                  )}
                  <AvatarFallback>{getInitials(user.fullname)}</AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">{user.fullname}</p>
                  <div className="flex items-center space-x-1">
                    {getRoleIcon(user.role)}
                    <p className="text-xs text-muted-foreground">{user.role}</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Navigation par onglets pour les administrateurs/modérateurs */}
        {canManageUsers && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardContent className="p-0">
                <div className="flex border-b">
                  <Button
                    variant={activeTab === 'profile' ? 'default' : 'ghost'}
                    className="rounded-none flex-1 justify-start"
                    onClick={() => setActiveTab('profile')}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Mon Profil
                  </Button>
                  <Button
                    variant={activeTab === 'users' ? 'default' : 'ghost'}
                    className="rounded-none flex-1 justify-start"
                    onClick={() => setActiveTab('users')}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Gestion des Utilisateurs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Contenu du profil utilisateur */}
        {activeTab === 'profile' && (
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <User className="h-5 w-5" />
                        <span>Mon Profil</span>
                      </CardTitle>
                      <CardDescription>Informations de votre compte</CardDescription>
                    </div>
                    <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center space-x-1">
                      {getRoleIcon(user.role)}
                      <span>{user.role}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Section Avatar */}
                  <div className="flex justify-center mb-6">
                    <div className="text-center space-y-2">
                      <Avatar className="w-24 h-24 mx-auto border-4 border-background shadow-lg">
                        {user.avatar && (
                          <img 
                            src={`http://localhost:3000${user.avatar}`} 
                            alt={user.fullname}
                            className="w-full h-full object-cover rounded-full"
                          />
                        )}
                        <AvatarFallback className="text-2xl font-bold">
                          {getInitials(user.fullname)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm text-muted-foreground">
                        {user.avatar ? 'Avatar personnalisé' : 'Aucun avatar'}
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nom complet</p>
                      <p className="text-lg">{user.fullname}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="text-lg">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Âge</p>
                      <p className="text-lg">{user.age} ans</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Genre</p>
                      <p className="text-lg">
                        {user.gender === 'male' ? 'Homme' : 
                         user.gender === 'female' ? 'Femme' : 'Autre'}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Membre depuis</span>
                    <span>
                      <DateClientOnly dateString={user.createdAt} />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Actions Rapides</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setIsEditingProfile(true)}
              >
                <User className="h-4 w-4 mr-2" />
                Modifier mon profil
              </Button>
              
              {canManageUsers && (
                <Button variant="outline" className="w-full justify-start" onClick={loadUsers}>
                  <Eye className="h-4 w-4 mr-2" />
                  Actualiser la liste des utilisateurs
                </Button>
              )}
              
              <Separator />
              
              <Button variant="outline" className="w-full justify-start text-destructive" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Se déconnecter
              </Button>
            </CardContent>
          </Card>
        </motion.div>

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
