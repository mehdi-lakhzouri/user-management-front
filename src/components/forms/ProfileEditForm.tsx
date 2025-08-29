'use client';

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarDropzone } from './AvatarDropzone';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { userService } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { getAvatarUrl } from '@/lib/utils-avatar';

// Schema de validation pour le profil
const profileSchema = z.object({
  fullname: z.string().min(2, 'Le nom complet doit contenir au moins 2 caractères'),
  email: z.string().email('Format d\'email invalide'),
  age: z.number().min(13, 'L\'âge doit être d\'au moins 13 ans').max(120, 'L\'âge ne peut pas dépasser 120 ans'),
  gender: z.enum(['male', 'female', 'other']).optional(),
  avatar: z.string().optional(), // on gère la validation côté UI
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface User {
  id: string;
  fullname: string;
  age: number;
  email: string;
  gender?: 'male' | 'female' | 'other';
  avatar?: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProfileEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUpdate: (user: User) => void;
}

export function ProfileEditDialog({ isOpen, onClose, user, onUpdate }: ProfileEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user?.avatar);
  const [avatarError, setAvatarError] = useState<string | undefined>(undefined);
  const [avatarDeleted, setAvatarDeleted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullname: user?.fullname || '',
      email: user?.email || '',
      age: user?.age || 18,
      gender: user?.gender || undefined,
      avatar: user?.avatar || '',
    },
  });

  // Réinitialiser les valeurs quand l'utilisateur change
  React.useEffect(() => {
    if (user) {
      reset({
        fullname: user.fullname,
        email: user.email,
        age: user.age,
        gender: user.gender || undefined,
        avatar: user.avatar || '',
      });
      setAvatarPreview(user.avatar || undefined);
      setAvatarFile(null);
      setAvatarDeleted(false);
      setAvatarError(undefined);
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    try {
      setIsLoading(true);
      let updatedUser;
      
      // Gestion spéciale pour la suppression d'avatar
      if (avatarDeleted && user.avatar && !avatarFile) {
        try {
          await userService.deleteAvatar();
          // Mettre à jour le profil sans avatar
          updatedUser = await userService.updateProfile({
            fullname: data.fullname,
            email: data.email,
            age: data.age,
            gender: data.gender,
          });
        } catch (error) {
          console.warn('Erreur lors de la suppression de l\'avatar:', error);
          throw error;
        }
      } else {
        // Préparer les données FormData (toujours, car le backend utilise FileInterceptor)
        const formData = new FormData();
        formData.append('fullname', data.fullname);
        formData.append('email', data.email);
        formData.append('age', String(data.age));
        if (data.gender) formData.append('gender', data.gender);
        
        // Ajouter le fichier avatar s'il est présent
        if (avatarFile) {
          formData.append('avatar', avatarFile);
        }
        
        console.log('Envoi FormData avec:', {
          fullname: data.fullname,
          email: data.email,
          age: data.age,
          gender: data.gender,
          hasAvatar: !!avatarFile
        });
        
        // Utiliser le service API centralisé
        updatedUser = await userService.updateProfileWithFormData(formData);
      }
      
      onUpdate(updatedUser);
      toast.success('Profil mis à jour avec succès');
      onClose();
    } catch (error: unknown) {
      console.error('Erreur mise à jour profil:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du profil';
      setAvatarError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const genderValue = watch('gender');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier mon profil</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullname">Nom complet *</Label>
            <Input
              id="fullname"
              {...register('fullname')}
              placeholder="Votre nom complet"
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
              placeholder="votre@email.com"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Avatar</Label>
            <div className="flex flex-col items-center space-y-4">
              {/* Affichage avatar actuel ou prévisualisation */}
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-muted">
                  {(avatarPreview && !avatarDeleted) && (
                    <img 
                      src={getAvatarUrl(avatarPreview)} 
                      alt="Avatar prévisualisation"
                      className="w-full h-full object-cover rounded-full"
                    />
                  )}
                  <AvatarFallback className="text-xl">
                    {user?.fullname?.split(' ').map(n => n[0]).join('').toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              {/* Boutons de gestion avatar */}
              <div className="flex gap-2">
                {(user?.avatar && !avatarDeleted && !avatarFile) && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => {
                      setAvatarDeleted(true);
                      setAvatarPreview(undefined);
                      setAvatarFile(null);
                      setAvatarError(undefined);
                    }}
                  >
                    Supprimer l&apos;avatar
                  </Button>
                )}
                
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Trigger file input click
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/jpeg,image/jpg,image/png';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        // Valider le fichier
                        if (file.size > 5 * 1024 * 1024) {
                          setAvatarError('Le fichier ne doit pas dépasser 5MB');
                          return;
                        }
                        if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
                          setAvatarError('Seuls les formats JPG et PNG sont acceptés');
                          return;
                        }
                        
                        setAvatarFile(file);
                        setAvatarPreview(URL.createObjectURL(file));
                        setAvatarDeleted(false);
                        setAvatarError(undefined);
                      }
                    };
                    input.click();
                  }}
                >
                  {user?.avatar ? 'Changer l\'avatar' : 'Ajouter un avatar'}
                </Button>
                
                {(avatarFile || avatarDeleted) && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setAvatarFile(null);
                      setAvatarDeleted(false);
                      setAvatarPreview(user?.avatar || undefined);
                      setAvatarError(undefined);
                    }}
                  >
                    Annuler
                  </Button>
                )}
              </div>
              
              {/* Message d'état */}
              <div className="text-center">
                {avatarDeleted && (
                  <p className="text-sm text-destructive">Avatar sera supprimé</p>
                )}
                {avatarFile && (
                  <p className="text-sm text-green-600">Nouvel avatar sélectionné</p>
                )}
                {!user?.avatar && !avatarFile && !avatarDeleted && (
                  <p className="text-sm text-muted-foreground">Aucun avatar</p>
                )}
                {avatarError && (
                  <p className="text-sm text-destructive">{avatarError}</p>
                )}
              </div>
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
              <Label htmlFor="gender">Genre</Label>
              <Select value={genderValue} onValueChange={(value: string) => setValue('gender', value as 'male' | 'female' | 'other')}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez votre genre" />
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
