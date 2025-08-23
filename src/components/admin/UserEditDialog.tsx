'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { userService, type User } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Schema de validation pour l'édition d'utilisateur
const userEditSchema = z.object({
  fullname: z.string().min(2, 'Le nom complet doit contenir au moins 2 caractères'),
  email: z.string().email('Format d\'email invalide'),
  age: z.number().min(13, 'L\'âge doit être d\'au moins 13 ans').max(120, 'L\'âge ne peut pas dépasser 120 ans'),
  gender: z.enum(['male', 'female', 'other']),
  role: z.enum(['USER', 'MODERATOR', 'ADMIN']),
  isActive: z.boolean(),
  avatar: z.string().url('Veuillez entrer une URL valide').optional().or(z.literal('')),
});

type UserEditFormData = z.infer<typeof userEditSchema>;

interface UserEditDialogProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  userRole: 'ADMIN' | 'MODERATOR';
}

export function UserEditDialog({ user, isOpen, onClose, onUpdate, userRole }: UserEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<UserEditFormData>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      fullname: user.fullname,
      email: user.email,
      age: user.age,
      gender: user.gender,
      role: user.role,
      isActive: user.isActive,
      avatar: user.avatar || '',
    },
  });

  // Réinitialiser les valeurs quand l'utilisateur change
  React.useEffect(() => {
    if (user) {
      reset({
        fullname: user.fullname,
        email: user.email,
        age: user.age,
        gender: user.gender,
        role: user.role,
        isActive: user.isActive,
        avatar: user.avatar || '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: UserEditFormData) => {
    try {
      setIsLoading(true);
      console.log('Données utilisateur à modifier:', data);

      // Vérifier les permissions
      if (userRole === 'MODERATOR' && data.role !== user.role) {
        toast.error('Les modérateurs ne peuvent pas modifier les rôles');
        return;
      }

      await userService.updateUser(user.id, data);
      
      toast.success('Utilisateur modifié avec succès');
      onUpdate();
    } catch (error: any) {
      console.error('Erreur lors de la modification de l\'utilisateur:', error);
      toast.error(error?.response?.data?.message || 'Erreur lors de la modification de l\'utilisateur');
    } finally {
      setIsLoading(false);
    }
  };

  const roleValue = watch('role');
  const genderValue = watch('gender');
  const isActiveValue = watch('isActive');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'utilisateur</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullname">Nom complet *</Label>
            <Input
              id="fullname"
              {...register('fullname')}
              placeholder="Nom complet de l'utilisateur"
            />
            {errors.fullname && (
              <p className="text-sm text-destructive">{errors.fullname.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="email@example.com"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar">Avatar (URL)</Label>
            <Input
              id="avatar"
              type="url"
              {...register('avatar')}
              placeholder="https://example.com/avatar.jpg"
            />
            {errors.avatar && (
              <p className="text-sm text-destructive">{errors.avatar.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Âge *</Label>
              <Input
                id="age"
                type="number"
                {...register('age', { valueAsNumber: true })}
                placeholder="25"
                min="13"
                max="120"
              />
              {errors.age && (
                <p className="text-sm text-destructive">{errors.age.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Genre *</Label>
              <Select value={genderValue} onValueChange={(value: string) => setValue('gender', value as 'male' | 'female' | 'other')}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Homme</SelectItem>
                  <SelectItem value="female">Femme</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-sm text-destructive">{errors.gender.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Rôle *</Label>
              <Select 
                value={roleValue} 
                onValueChange={(value: string) => setValue('role', value as 'USER' | 'MODERATOR' | 'ADMIN')}
                disabled={userRole === 'MODERATOR'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Utilisateur</SelectItem>
                  <SelectItem value="MODERATOR">Modérateur</SelectItem>
                  <SelectItem value="ADMIN">Administrateur</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role.message}</p>
              )}
              {userRole === 'MODERATOR' && (
                <p className="text-xs text-muted-foreground">
                  Seuls les administrateurs peuvent modifier les rôles
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="isActive">Statut</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="isActive"
                  checked={isActiveValue}
                  onCheckedChange={(checked) => setValue('isActive', checked)}
                />
                <Label htmlFor="isActive" className="text-sm">
                  {isActiveValue ? 'Utilisateur actif' : 'Utilisateur inactif'}
                </Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sauvegarder
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
