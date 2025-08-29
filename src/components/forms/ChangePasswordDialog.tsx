'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, EyeOff, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

// Schema de validation pour le changement de mot de passe
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
  newPassword: z.string()
    .min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'),
  confirmPassword: z.string().min(1, 'La confirmation du mot de passe est requise'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
}).refine((data) => data.newPassword !== data.currentPassword, {
  message: "Le nouveau mot de passe doit être différent de l'ancien",
  path: ["newPassword"],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

interface ChangePasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isRequired?: boolean; 
  onSuccess?: () => void; 
}

export function ChangePasswordDialog({ isOpen, onClose, isRequired = false, onSuccess }: ChangePasswordDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setAuth = useAuthStore((state) => state.setAuth);
  const { user, accessToken, refreshToken } = useAuthStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      setIsLoading(true);
      
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      toast.success('Mot de passe modifié avec succès', {
        description: isRequired 
          ? 'Votre mot de passe temporaire a été modifié. Redirection en cours...'
          : 'Vous allez être déconnecté pour des raisons de sécurité.',
      });

      
      if (isRequired && user && accessToken && refreshToken) {
        
        const updatedUser = { ...user, mustChangePassword: false };
        setAuth(updatedUser, accessToken, refreshToken);
        console.log('🔍 DEBUG: mustChangePassword mis à false après changement réussi');
      }

      
      reset();
      
      
      if (isRequired && onSuccess) {
        // Fermer le dialog immédiatement
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000); // Réduire le délai à 1 seconde
      } else {
        
        setTimeout(() => {
          clearAuth();
          router.push('/login');
        }, 2000);
      }

    } catch (error: unknown) {
      console.error('Erreur lors du changement de mot de passe:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erreur lors du changement de mot de passe';
      
      toast.error('Échec du changement de mot de passe', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isRequired) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-[500px]" 
        onPointerDownOutside={(e) => {
          if (isRequired) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (isRequired) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isRequired && <AlertTriangle className="h-5 w-5 text-orange-500" />}
            {isRequired ? 'Changement de mot de passe obligatoire' : 'Changer le mot de passe'}
          </DialogTitle>
          {isRequired && (
            <p className="text-sm text-muted-foreground">
              Vous devez changer votre mot de passe temporaire avant de continuer.
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Mot de passe actuel */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Mot de passe actuel *</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                {...register('currentPassword')}
                placeholder="Entrez votre mot de passe actuel"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.currentPassword && (
              <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
            )}
          </div>

          {/* Nouveau mot de passe */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nouveau mot de passe *</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                {...register('newPassword')}
                placeholder="Entrez votre nouveau mot de passe"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.newPassword && (
              <p className="text-sm text-destructive">{errors.newPassword.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Le mot de passe doit contenir au moins 8 caractères avec majuscule, minuscule, chiffre et caractère spécial.
            </p>
          </div>

          {/* Confirmation du nouveau mot de passe */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                placeholder="Confirmez votre nouveau mot de passe"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          {isRequired && (
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-md">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-orange-800">
                    Changement obligatoire
                  </p>
                  <p className="text-sm text-orange-700">
                    Votre mot de passe actuel est temporaire. Pour des raisons de sécurité, 
                    vous devez le changer maintenant. Toutes vos sessions seront déconnectées 
                    après le changement.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            {!isRequired && (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Annuler
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Changer le mot de passe
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
