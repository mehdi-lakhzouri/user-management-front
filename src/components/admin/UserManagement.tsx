'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { userService, type User, type PaginationParams, type PaginatedUsersResponse } from '@/lib/api';
import { getAvatarUrl } from '@/lib/utils-avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { SimplePagination } from '@/components/ui/simple-pagination';
import { 
  Search, 
  Filter, 
  UserPlus, 
  Edit, 
  Trash2, 
  Eye, 
  UserCheck, 
  UserX,
  RefreshCw,
  Calendar,
  Mail,
  Crown,
  Shield,
  User as UserIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { UserEditDialog } from './UserEditDialog';
import { UserCreateDialog } from './UserCreateDialog';

interface UserManagementProps {
  userRole: 'ADMIN' | 'MODERATOR';
}

export function UserManagement({ userRole }: UserManagementProps) {
  const { user: currentUser, lastTokenRefresh, updateUser: updateCurrentUser } = useAuthStore();
  
  // Pagination state
  const [paginatedData, setPaginatedData] = useState<PaginatedUsersResponse>({
    users: [],
    total: 0,
    page: 1,
    limit: 5, // Changé de 10 à 5 pour voir la pagination plus facilement
    totalPages: 0
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Debounced search to avoid too many API calls
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Charger les utilisateurs avec pagination
  const loadUsers = useCallback(async (params: Partial<PaginationParams> = {}) => {
    try {
      setIsLoading(true);
      console.log('[UserManagement] Début du chargement des utilisateurs...');
      
      const requestParams: PaginationParams = {
        page: paginatedData.page,
        limit: paginatedData.limit,
        search: debouncedSearchTerm || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        ...params
      };
      
      const userData = await userService.getAllUsers(requestParams);
      console.log('[UserManagement] Données reçues:', userData);
      setPaginatedData(userData);
      toast.success(`${userData.total} utilisateurs trouvés`);
    } catch (error: unknown) {
      console.error('[UserManagement] Erreur lors du chargement des utilisateurs:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error('Erreur lors du chargement des utilisateurs: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [paginatedData.page, paginatedData.limit, debouncedSearchTerm, roleFilter, statusFilter]);

  // Recharger après refresh de token
  useEffect(() => {
    if (lastTokenRefresh) {
      console.log('[UserManagement] Token refreshé, rechargement des utilisateurs');
      loadUsers({ page: 1 }); // Reset to page 1 on token refresh
    }
  }, [lastTokenRefresh]);

  // Recharger quand les filtres changent
  useEffect(() => {
    loadUsers({ page: 1 }); // Reset to page 1 when filters change
  }, [debouncedSearchTerm, roleFilter, statusFilter]);

  // Charger les utilisateurs au montage
  useEffect(() => {
    loadUsers();
  }, []);

  // Gestion de la pagination
  const handlePageChange = (page: number) => {
    setPaginatedData(prev => ({ ...prev, page }));
    loadUsers({ page });
  };

  const handlePageSizeChange = (limit: number) => {
    setPaginatedData(prev => ({ ...prev, limit, page: 1 }));
    loadUsers({ page: 1, limit });
  };

  // Supprimer un utilisateur (Admin seulement)
  const handleDeleteUser = async (userId: string) => {
    if (userRole !== 'ADMIN') {
      toast.error('Seuls les administrateurs peuvent supprimer des utilisateurs');
      return;
    }

    try {
      await userService.deleteUser(userId);
      toast.success('Utilisateur supprimé avec succès');
      loadUsers();
      setShowDeleteDialog(false);
      setSelectedUser(null);
    } catch (error: unknown) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression de l\'utilisateur');
    }
  };

  // Obtenir le badge de rôle
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="destructive" className="gap-1"><Crown className="w-3 h-3" />Admin</Badge>;
      case 'MODERATOR':
        return <Badge variant="secondary" className="gap-1"><Shield className="w-3 h-3" />Modérateur</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><UserIcon className="w-3 h-3" />Utilisateur</Badge>;
    }
  };

  // Obtenir le badge de statut
  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <Badge variant="default" className="gap-1 bg-green-500"><UserCheck className="w-3 h-3" />Actif</Badge>
      : <Badge variant="secondary" className="gap-1"><UserX className="w-3 h-3" />Inactif</Badge>;
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Date inconnue';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* En-tête avec statistiques */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">{paginatedData.total}</div>
            <p className="text-xs sm:text-sm text-muted-foreground">Total utilisateurs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold text-green-600">
              {paginatedData.users.filter((u: User) => u.isActive).length}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">Utilisateurs actifs (page)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold text-purple-600">
              {paginatedData.users.filter((u: User) => u.role === 'ADMIN').length}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">Administrateurs (page)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold text-orange-600">
              {paginatedData.users.filter((u: User) => u.role === 'MODERATOR').length}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">Modérateurs (page)</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Barre d'outils */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <span className="text-base sm:text-lg">Gestion des utilisateurs</span>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={() => loadUsers()} 
                variant="outline" 
                size="sm"
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualiser</span>
                <span className="sm:hidden">Refresh</span>
              </Button>
              {userRole === 'ADMIN' && (
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Créer utilisateur</span>
                  <span className="sm:hidden">Créer</span>
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtres */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Filtrer par rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="USER">Utilisateurs</SelectItem>
                <SelectItem value="MODERATOR">Modérateurs</SelectItem>
                <SelectItem value="ADMIN">Administrateurs</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Lignes par page:</span>
              <Select
                value={paginatedData.limit.toString()}
                onValueChange={(value) => handlePageSizeChange(Number(value))}
                disabled={isLoading}
              >
                <SelectTrigger className="w-16 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Compteur d'utilisateurs */}
          <div className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center sm:justify-start">
            <Filter className="w-4 h-4 mr-2" />
            {paginatedData.users.length} utilisateur(s) sur cette page ({paginatedData.total} au total)
          </div>
        </CardContent>
      </Card>

      {/* Liste des utilisateurs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid gap-3 sm:gap-4"
      >
        {isLoading ? (
          <Card>
            <CardContent className="p-6 sm:p-8 text-center">
              <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm sm:text-base text-muted-foreground">Chargement des utilisateurs...</p>
            </CardContent>
          </Card>
        ) : !Array.isArray(paginatedData.users) || paginatedData.users.length === 0 ? (
          <Card>
            <CardContent className="p-6 sm:p-8 text-center">
              <UserIcon className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm sm:text-base text-muted-foreground">Aucun utilisateur trouvé</p>
            </CardContent>
          </Card>
        ) : (
          paginatedData.users.map((user: User) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                      <AvatarImage 
                        src={getAvatarUrl(user.avatar)} 
                        alt={user.fullname}
                        onError={(e) => {
                          console.error('Erreur chargement avatar utilisateur:', getAvatarUrl(user.avatar));
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <AvatarFallback className="text-xs sm:text-sm">
                        {user.fullname.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0">
                        <h3 className="font-semibold text-sm sm:text-base truncate">{user.fullname}</h3>
                        <div className="flex items-center space-x-2">
                          {getRoleBadge(user.role)}
                          {getStatusBadge(user.isActive)}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs sm:text-sm text-muted-foreground space-y-1 sm:space-y-0">
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <span className="hidden sm:inline">Inscrit le </span>
                          {formatDate(user.createdAt)}
                        </span>
                        <span className="hidden lg:inline">Âge: {user.age} ans</span>
                        <span className="hidden lg:inline">
                          {user.gender === 'male' ? 'Homme' : 
                           user.gender === 'female' ? 'Femme' : 'Autre'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowEditDialog(true);
                      }}
                      className="flex-1 sm:flex-none"
                    >
                      <Edit className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">Modifier</span>
                    </Button>
                    {userRole === 'ADMIN' && user.id !== currentUser?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDeleteDialog(true);
                        }}
                        className="text-destructive hover:text-destructive flex-1 sm:flex-none"
                      >
                        <Trash2 className="w-4 h-4 sm:mr-1" />
                        <span className="hidden sm:inline">Supprimer</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </motion.div>

      {/* Pagination Controls */}
      {!isLoading && paginatedData.totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <SimplePagination
                currentPage={paginatedData.page}
                totalPages={paginatedData.totalPages}
                totalItems={paginatedData.total}
                onPageChange={handlePageChange}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Dialogues */}
      {showEditDialog && selectedUser && (
        <UserEditDialog
          user={selectedUser}
          isOpen={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedUser(null);
          }}
          onUpdate={() => {
            // Recharger la liste des utilisateurs
            loadUsers({});
            
            // Si l'utilisateur modifié est l'utilisateur actuellement connecté, 
            // mettre à jour le store d'authentification
            if (currentUser && selectedUser && selectedUser.id === currentUser.id) {
              console.log('[UserManagement] Mise à jour de l\'utilisateur connecté détectée');
              // Récupérer les données mises à jour de l'utilisateur depuis l'API
              userService.getProfile()
                .then((updatedUser: User) => {
                  console.log('[UserManagement] Données utilisateur mises à jour:', updatedUser);
                  updateCurrentUser(updatedUser);
                })
                .catch((error: unknown) => {
                  console.error('[UserManagement] Erreur lors de la récupération du profil mis à jour:', error);
                });
            }
            
            setShowEditDialog(false);
            setSelectedUser(null);
          }}
          userRole={userRole}
        />
      )}

      {showCreateDialog && userRole === 'ADMIN' && (
        <UserCreateDialog
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onCreate={() => {
            loadUsers({});
            setShowCreateDialog(false);
          }}
        />
      )}

      {/* Dialogue de confirmation de suppression */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Êtes-vous sûr de vouloir supprimer l&apos;utilisateur <strong>{selectedUser?.fullname}</strong> ?
            </p>
            <p className="text-sm text-muted-foreground">
              Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setSelectedUser(null);
                }}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedUser && handleDeleteUser(selectedUser.id)}
              >
                Supprimer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
