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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AvatarDropzone } from '@/components/forms/AvatarDropzone';
import { userService, type User } from '@/lib/api';
import { getAvatarUrl } from '@/lib/utils-avatar';
import { toast } from 'sonner';
import { Loader2, User as UserIcon } from 'lucide-react';

// Schema de validation pour l'édition d'utilisateur
const userEditSchema = z.object({
  fullname: z.string().min(2, 'Le nom complet doit contenir au moins 2 caractères'),
  email: z.string().email('Format d\'email invalide'),
  age: z.number().min(13, 'L\'âge doit être d\'au moins 13 ans').max(120, 'L\'âge ne peut pas dépasser 120 ans'),
  gender: z.enum(['male', 'female', 'other']),
  role: z.enum(['USER', 'MODERATOR', 'ADMIN']),
  isActive: z.boolean(),
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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [avatarError, setAvatarError] = useState<string>('');
  const previousObjectUrl = React.useRef<string | null>(null);

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
      });
      setAvatarPreview(getAvatarUrl(user.avatar) || '');
      setAvatarFile(null);
      setAvatarError('');
    }
    return () => {
      if (previousObjectUrl.current) {
        try { URL.revokeObjectURL(previousObjectUrl.current); } catch (e) {}
        previousObjectUrl.current = null;
      }
    };
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

      // Étape 1: Mettre à jour les informations de base
      await userService.updateUser(user.id, data);

      // Étape 2: Si un nouvel avatar a été sélectionné, l'uploader
      if (avatarFile) {
        try {
          const avatarResult = await userService.uploadAvatarUnified(avatarFile, user.id);
          console.log('Avatar uploadé pour l\'utilisateur:', avatarResult);
          
          // L'avatar a été directement mis à jour côté backend, pas besoin de mettre à jour à nouveau
          // await userService.updateUser(user.id, { avatar: avatarResult.avatarUrl });
          
          toast.success('Utilisateur et avatar mis à jour avec succès', {
            description: `Les informations de ${data.fullname} ont été mises à jour.`,
          });
        } catch (avatarError: unknown) {
          console.error('Erreur upload avatar:', avatarError);
          toast.warning('Utilisateur mis à jour, mais erreur avec l\'avatar', {
            description: 'Les informations ont été sauvegardées mais l\'avatar n\'a pas pu être mis à jour.',
          });
        }
      } else {
        toast.success('Utilisateur modifié avec succès', {
          description: `Les informations de ${data.fullname} ont été mises à jour.`,
        });
      }
      
      onUpdate();
      onClose();
    } catch (error: unknown) {
      console.error('Erreur lors de la modification de l\'utilisateur:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      const errorMessage = axiosError?.response?.data?.message || 'Erreur lors de la modification de l\'utilisateur';
      toast.error('Échec de la modification', {
        description: errorMessage,
      });
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

          <div className="space-y-4">
            <Label>Avatar de l'utilisateur</Label>
            
            {/* Affichage de l'avatar actuel */}
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
              <div className="flex flex-col items-center gap-2">
                <Label className="text-xs text-muted-foreground">Avatar actuel</Label>
                <Avatar className="w-16 h-16">
                    <AvatarImage src={getAvatarUrl(user.avatar)} alt={user.fullname} />
                  <AvatarFallback>
                    <UserIcon className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
              </div>
              
              {avatarFile && avatarPreview && (
                <>
                  <div className="text-muted-foreground">→</div>
                  <div className="flex flex-col items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Nouvel avatar</Label>
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={avatarPreview} alt="Aperçu" />
                      <AvatarFallback>
                        <UserIcon className="w-8 h-8" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </>
              )}
            </div>

            {/* Drag & Drop d'avatar */}
            <div className="space-y-2">
              <Label>Changer l'avatar (optionnel)</Label>
              <AvatarDropzone
                onFileSelect={(file) => {
                  // Nettoyer l'ancien blob URL s'il existe
                  if (previousObjectUrl.current) {
                    try { URL.revokeObjectURL(previousObjectUrl.current); } catch (e) {}
                  }
                  
                  setAvatarFile(file);
                  setAvatarError('');
                  const url = URL.createObjectURL(file);
                  previousObjectUrl.current = url;
                  setAvatarPreview(url);
                }}
                previewUrl={avatarFile ? avatarPreview : undefined}
                error={avatarError}
              />
              {avatarError && (
                <p className="text-sm text-destructive">{avatarError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Glissez-déposez une nouvelle image ou cliquez pour sélectionner (JPG, PNG, max 5MB)
              </p>
            </div>
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
