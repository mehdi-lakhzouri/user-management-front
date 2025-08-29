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
import { userService, type CreateUserData, type CreateUserResponse } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, User as UserIcon, Eye, EyeOff } from 'lucide-react';

// Schema de validation pour la création d'utilisateur
const userCreateSchema = z.object({
  fullname: z.string().min(2, 'Le nom complet doit contenir au moins 2 caractères'),
  email: z.string().email('Format d\'email invalide'),
  age: z.number().min(13, 'L\'âge doit être d\'au moins 13 ans').max(120, 'L\'âge ne peut pas dépasser 120 ans'),
  gender: z.enum(['male', 'female', 'other']),
  role: z.enum(['USER', 'MODERATOR', 'ADMIN']),
  isActive: z.boolean(),
  useTemporaryPassword: z.boolean(), // Enlevé le default pour éviter le conflit de type
  password: z.string().optional(),
}).refine((data) => {
  // Si on n'utilise pas de mot de passe temporaire, un mot de passe doit être fourni
  if (!data.useTemporaryPassword && (!data.password || data.password.length === 0)) {
    return false;
  }
  // Si un mot de passe est fourni, il doit faire au moins 8 caractères
  if (data.password && data.password.length > 0 && data.password.length < 8) {
    return false;
  }
  return true;
}, {
  message: "Un mot de passe d'au moins 8 caractères est requis si vous ne générez pas de mot de passe temporaire",
  path: ["password"],
});

type UserCreateFormData = z.infer<typeof userCreateSchema>;

interface UserCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: () => void;
}

export function UserCreateDialog({ isOpen, onClose, onCreate }: UserCreateDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [avatarError, setAvatarError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const previousObjectUrl = React.useRef<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<UserCreateFormData>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: {
      fullname: '',
      email: '',
      age: 18,
      gender: 'other',
      role: 'USER',
      isActive: true,
      useTemporaryPassword: true,
      password: '',
    },
  });

  const onSubmit = async (data: UserCreateFormData) => {
    try {
      setIsLoading(true);
      console.log('Données utilisateur à créer:', data);

      // Préparer les données pour la création
      const createData: CreateUserData = {
        fullname: data.fullname,
        email: data.email,
        age: data.age,
        gender: data.gender,
        role: data.role,
        isActive: data.isActive,
      };

      // Ajouter le mot de passe seulement si l'utilisateur ne souhaite pas générer un mot de passe temporaire
      if (!data.useTemporaryPassword && data.password) {
        createData.password = data.password;
      }

      // Étape 1: Créer l'utilisateur
      const response: CreateUserResponse = await userService.createUser(createData);
      
      // Gérer l'affichage des messages en fonction du type de création
      if (response.temporaryPassword) {
        // Utilisateur créé avec mot de passe temporaire
        toast.success('Utilisateur créé avec mot de passe temporaire', {
          description: response.emailSent 
            ? `${data.fullname} a été créé. Un email avec le mot de passe temporaire a été envoyé.`
            : `${data.fullname} a été créé. Mot de passe temporaire: ${response.temporaryPassword}`,
        });
      } else {
        // Utilisateur créé avec mot de passe fourni
        toast.success('Utilisateur créé avec succès', {
          description: `${data.fullname} a été créé avec le mot de passe fourni.`,
        });
      }
      
      // Étape 2: Si un avatar a été sélectionné, l'uploader
      if (avatarFile && response.user) {
        try {
          const avatarResult = await userService.uploadAvatarUnified(avatarFile, response.user.id);
          console.log('Avatar uploadé:', avatarResult);
          
          toast.success('Avatar ajouté avec succès', {
            description: `L'avatar de ${data.fullname} a été mis à jour.`,
          });
        } catch (avatarError: unknown) {
          console.error('Erreur upload avatar:', avatarError);
          toast.warning('Utilisateur créé, mais erreur avec l\'avatar', {
            description: 'L\'utilisateur a été créé mais l\'avatar n\'a pas pu être uploadé.',
          });
        }
      }
      
      // Nettoyer les états
      reset();
      setAvatarFile(null);
      setAvatarPreview('');
      setAvatarError('');
      if (previousObjectUrl.current) {
        try { URL.revokeObjectURL(previousObjectUrl.current); } catch {
          // Ignore revoke errors
        }
        previousObjectUrl.current = null;
      }
      
      onCreate();
    } catch (error: unknown) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message
        : 'Erreur lors de la création de l\'utilisateur';
      
      toast.error('Échec de la création', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const roleValue = watch('role');
  const genderValue = watch('gender');
  const isActiveValue = watch('isActive');
  const useTemporaryPasswordValue = watch('useTemporaryPassword');

  // Nettoyage des blob URLs quand le composant se démonte ou le dialog se ferme
  React.useEffect(() => {
    if (!isOpen) {
      // Reset des états quand le dialog se ferme
      setAvatarFile(null);
      setAvatarPreview('');
      setAvatarError('');
      if (previousObjectUrl.current) {
        try { URL.revokeObjectURL(previousObjectUrl.current); } catch {
          // Ignore revoke errors
        }
        previousObjectUrl.current = null;
      }
    }
  }, [isOpen]);

  // Cleanup au démontage
  React.useEffect(() => {
    return () => {
      if (previousObjectUrl.current) {
        try { URL.revokeObjectURL(previousObjectUrl.current); } catch {
          // Ignore revoke errors
        }
        previousObjectUrl.current = null;
      }
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
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
            <Label>Avatar de l&apos;utilisateur (optionnel)</Label>
            
            {/* Affichage de l'avatar prévisualisé */}
            {avatarPreview && (
              <div className="flex justify-center mb-4">
                <div className="flex flex-col items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Aperçu</Label>
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={avatarPreview} alt="Aperçu" />
                    <AvatarFallback>
                      <UserIcon className="w-8 h-8" />
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            )}

            {/* Drag & Drop d'avatar */}
            <div className="space-y-2">
              <AvatarDropzone
                onFileSelect={(file) => {
                  // Nettoyer l'ancien blob URL s'il existe
                  if (previousObjectUrl.current) {
                    try { URL.revokeObjectURL(previousObjectUrl.current); } catch {
                      // Ignore revoke errors
                    }
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
                Glissez-déposez une image ou cliquez pour sélectionner (JPG, PNG, max 5MB)
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

          {/* Section de configuration du mot de passe */}
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="useTemporaryPassword">Configuration du mot de passe</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="useTemporaryPassword"
                  checked={useTemporaryPasswordValue}
                  onCheckedChange={(checked) => setValue('useTemporaryPassword', checked)}
                />
                <Label htmlFor="useTemporaryPassword" className="text-sm">
                  {useTemporaryPasswordValue 
                    ? 'Générer un mot de passe temporaire (recommandé)' 
                    : 'Fournir un mot de passe spécifique'
                  }
                </Label>
              </div>
            </div>

            {/* Champ mot de passe affiché seulement si on ne génère pas de mot de passe temporaire */}
            {!useTemporaryPasswordValue && (
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="Entrez le mot de passe"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Le mot de passe doit contenir au moins 8 caractères.
                </p>
              </div>
            )}
          </div>

          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm text-muted-foreground">
              {useTemporaryPasswordValue ? (
                <>
                  <strong>Mot de passe temporaire :</strong> Un mot de passe sécurisé sera généré automatiquement et envoyé par email à l&apos;utilisateur. L&apos;utilisateur devra le changer lors de sa première connexion.
                </>
              ) : (
                <>
                  <strong>Mot de passe fourni :</strong> L&apos;utilisateur pourra se connecter directement avec le mot de passe que vous avez défini.
                </>
              )}
            </p>
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
              Créer l&apos;utilisateur
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
