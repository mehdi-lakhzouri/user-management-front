'use client';

import { useState } from 'react';
import { AvatarDropzone } from './AvatarDropzone';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { registerSchema, type RegisterFormData } from '@/lib/validations';
import { authService } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
  const [avatarError, setAvatarError] = useState<string | undefined>(undefined);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setAvatarError(undefined);
    try {
      // Validation côté client : avatar obligatoire ?
      // (optionnel, sinon commenter la ligne suivante)
      // if (!avatarFile) throw new Error("Veuillez sélectionner un avatar.");

      const { confirmPassword, ...registerData } = data;
      const formData = new FormData();
      Object.entries(registerData).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      // Utiliser le service Axios pour l'inscription avec avatar
      const result = await authService.registerWithAvatar(formData);
      setAuth(result.user, result.accessToken, result.refreshToken);
      toast.success('Inscription réussie !', {
        description: `Bienvenue ${result.user.fullname}`,
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      let errorMessage = 'Erreur lors de l\'inscription';
      if (error.message) errorMessage = error.message;
      setAvatarError(errorMessage);
      toast.error('Échec de l\'inscription', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="backdrop-blur-sm bg-background/95 border-border/50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Inscription</CardTitle>
          <CardDescription>
            Créez votre compte pour commencer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Champ d'upload d'avatar avec drag & drop, preview, micro-interaction */}
            <div className="space-y-2">
              <Label>Avatar</Label>
              <AvatarDropzone
                onFileSelect={(file) => {
                  setAvatarFile(file);
                  setAvatarError(undefined);
                  const url = URL.createObjectURL(file);
                  setAvatarPreview(url);
                }}
                previewUrl={avatarPreview}
                error={avatarError}
              />
              {avatarError && (
                <p className="text-xs text-destructive mt-1">{avatarError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullname">Nom complet</Label>
              <Input
                id="fullname"
                type="text"
                placeholder="Jean Dupont"
                {...register('fullname')}
                className={errors.fullname ? 'border-destructive' : ''}
              />
              {errors.fullname && (
                <p className="text-sm text-destructive">{errors.fullname.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Âge</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="25"
                  {...register('age', { valueAsNumber: true })}
                  className={errors.age ? 'border-destructive' : ''}
                />
                {errors.age && (
                  <p className="text-sm text-destructive">{errors.age.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Genre</Label>
                <select
                  id="gender"
                  {...register('gender')}
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                    errors.gender ? 'border-destructive' : ''
                  }`}
                >
                  <option value="">Sélectionner</option>
                  <option value="male">Homme</option>
                  <option value="female">Femme</option>
                  <option value="other">Autre</option>
                </select>
                {errors.gender && (
                  <p className="text-sm text-destructive">{errors.gender.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre.email@exemple.com"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={`pr-10 ${errors.password ? 'border-destructive' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  className={`pr-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inscription en cours...
                </>
              ) : (
                'S\'inscrire'
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Déjà un compte ?{' '}
                <Button
                  type="button"
                  variant="link"
                  className="px-0"
                  onClick={() => router.push('/login')}
                >
                  Se connecter
                </Button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
