'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { userService, type User } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Charger les utilisateurs
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const userData = await userService.getAllUsers();
      setUsers(userData);
      setFilteredUsers(userData);
    } catch (error: any) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrer les utilisateurs
  useEffect(() => {
    let filtered = users;

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par rôle
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? user.isActive : !user.isActive
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Charger les utilisateurs au montage
  useEffect(() => {
    loadUsers();
  }, []);

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
    } catch (error: any) {
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
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{Array.isArray(users) ? users.length : 0}</div>
            <p className="text-sm text-muted-foreground">Total utilisateurs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {Array.isArray(users) ? users.filter(u => u.isActive).length : 0}
            </div>
            <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {Array.isArray(users) ? users.filter(u => u.role === 'ADMIN').length : 0}
            </div>
            <p className="text-sm text-muted-foreground">Administrateurs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {Array.isArray(users) ? users.filter(u => u.role === 'MODERATOR').length : 0}
            </div>
            <p className="text-sm text-muted-foreground">Modérateurs</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Barre d'outils */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Gestion des utilisateurs</span>
            <div className="flex gap-2">
              <Button 
                onClick={loadUsers} 
                variant="outline" 
                size="sm"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              {userRole === 'ADMIN' && (
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  size="sm"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Créer utilisateur
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtres */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
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
              <SelectTrigger>
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              {Array.isArray(filteredUsers) ? filteredUsers.length : 0} utilisateur(s)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des utilisateurs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid gap-4"
      >
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Chargement des utilisateurs...</p>
            </CardContent>
          </Card>
        ) : !Array.isArray(filteredUsers) || filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <UserIcon className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar} alt={user.fullname} />
                      <AvatarFallback>
                        {user.fullname.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{user.fullname}</h3>
                        {getRoleBadge(user.role)}
                        {getStatusBadge(user.isActive)}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Inscrit le {formatDate(user.createdAt)}
                        </span>
                        <span>Âge: {user.age} ans</span>
                        <span>
                          {user.gender === 'male' ? 'Homme' : 
                           user.gender === 'female' ? 'Femme' : 'Autre'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowEditDialog(true);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                    {userRole === 'ADMIN' && user.id !== currentUser?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDeleteDialog(true);
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Supprimer
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </motion.div>

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
            loadUsers();
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
            loadUsers();
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
              Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{selectedUser?.fullname}</strong> ?
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
