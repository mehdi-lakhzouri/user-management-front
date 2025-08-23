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
import { userService } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Schema de validation pour le profil
const profileSchema = z.object({
  fullname: z.string().min(2, 'Le nom complet doit contenir au moins 2 caractères'),
  email: z.string().email('Format d\'email invalide'),
  age: z.number().min(13, 'L\'âge doit être d\'au moins 13 ans').max(120, 'L\'âge ne peut pas dépasser 120 ans'),
  gender: z.enum(['male', 'female', 'other']).optional(),
  avatar: z.string().url('Veuillez entrer une URL valide').optional().or(z.literal('')),
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
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    try {
      setIsLoading(true);
      console.log('Données du profil à envoyer:', data);

      const response = await userService.updateProfile(data);
      console.log('Réponse de mise à jour du profil:', response);

      // Mettre à jour l'utilisateur dans le store
      onUpdate(response);
      
      toast.success('Profil mis à jour avec succès');
      onClose();
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      toast.error(error?.response?.data?.message || 'Erreur lors de la mise à jour du profil');
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
            <Label htmlFor="avatar">Avatar (URL)</Label>
            <Input
              id="avatar"
              type="url"
              {...register('avatar')}
              placeholder="https://example.com/votre-avatar.jpg"
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
