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
import { AnimatedInput } from '@/components/ui/animated-input';
import { FormField } from '@/components/ui/form-field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { registerSchema, type RegisterFormData } from '@/lib/validations';
import { authService, userService } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useFormAnimations } from '@/hooks/useFormAnimations';

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
  const [submitSuccess, setSubmitSuccess] = useState(0);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const { shouldShake, hasError, getErrorMessage } = useFormAnimations({ 
    errors, 
    resetTrigger: submitSuccess 
  });

  const selectedGender = watch('gender');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setAvatarError(undefined);
    
    try {
      let avatarUrl = '';
      
      // Upload avatar si un fichier est sélectionné
      if (avatarFile) {
        try {
          const uploadResult = await userService.uploadAvatar(avatarFile);
          avatarUrl = uploadResult.avatarUrl;
        } catch (uploadError) {
          console.error('Erreur upload avatar:', uploadError);
          setAvatarError('Erreur lors de l\'upload de l\'avatar');
          return;
        }
      }

      // Créer le compte avec l'avatar
      const registerData = {
        ...data,
        avatar: avatarUrl || undefined,
      };

      const response = await authService.register(registerData);
      setAuth(response.user, response.accessToken, response.refreshToken);
      
      toast.success('Inscription réussie !', {
        description: `Bienvenue ${response.user.fullname}`,
      });
      
      setSubmitSuccess(prev => prev + 1);
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard');
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const errorMessage = axiosError.response?.data?.message || 'Erreur lors de l\'inscription';
      toast.error('Échec de l\'inscription', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    setAvatarFile(file);
    setAvatarError(undefined);
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setAvatarPreview(undefined);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-lg mx-auto px-4 sm:px-0"
    >
      <Card className="backdrop-blur-sm bg-background/95 border-border/50 shadow-lg">
        <CardHeader className="text-center space-y-2 pb-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Inscription
            </CardTitle>
          </motion.div>
          <CardDescription className="text-sm sm:text-base text-muted-foreground">
            Créez votre compte pour commencer
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar */}
            <FormField
              label="Photo de profil"
              description="Ajoutez une photo de profil (optionnel)"
            >
              <AvatarDropzone
                onFileSelect={handleFileSelect}
                previewUrl={avatarPreview}
                error={avatarError}
              />
            </FormField>

            {/* Nom complet */}
            <FormField
              label="Nom complet"
              htmlFor="fullname"
              required
              error={hasError('fullname')}
              errorMessage={getErrorMessage('fullname')}
              shake={shouldShake('fullname')}
            >
              <AnimatedInput
                id="fullname"
                type="text"
                placeholder="Votre nom complet"
                autoComplete="name"
                error={hasError('fullname')}
                errorMessage={getErrorMessage('fullname')}
                shake={shouldShake('fullname')}
                className="h-11 sm:h-12 text-base"
                {...register('fullname')}
              />
            </FormField>

            {/* Email */}
            <FormField
              label="Email"
              htmlFor="email"
              required
              error={hasError('email')}
              errorMessage={getErrorMessage('email')}
              shake={shouldShake('email')}
            >
              <AnimatedInput
                id="email"
                type="email"
                placeholder="votre.email@exemple.com"
                autoComplete="email"
                error={hasError('email')}
                errorMessage={getErrorMessage('email')}
                shake={shouldShake('email')}
                className="h-11 sm:h-12 text-base"
                {...register('email')}
              />
            </FormField>

            {/* Âge et Genre */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Âge"
                htmlFor="age"
                required
                error={hasError('age')}
                errorMessage={getErrorMessage('age')}
                shake={shouldShake('age')}
              >
                <AnimatedInput
                  id="age"
                  type="number"
                  placeholder="25"
                  min="13"
                  max="120"
                  error={hasError('age')}
                  errorMessage={getErrorMessage('age')}
                  shake={shouldShake('age')}
                  className="h-11 sm:h-12 text-base"
                  {...register('age', { valueAsNumber: true })}
                />
              </FormField>

              <FormField
                label="Genre"
                htmlFor="gender"
                required
                error={hasError('gender')}
                errorMessage={getErrorMessage('gender')}
                shake={shouldShake('gender')}
              >
                <motion.div
                  animate={shouldShake('gender') ? { x: [-10, 10, -10, 10, -5, 5, 0] } : { x: 0 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  <Select
                    value={selectedGender}
                    onValueChange={(value) => setValue('gender', value as 'male' | 'female' | 'other')}
                  >
                    <SelectTrigger className={`h-11 sm:h-12 text-base ${hasError('gender') ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Sélectionnez votre genre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Homme</SelectItem>
                      <SelectItem value="female">Femme</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              </FormField>
            </div>

            {/* Mot de passe */}
            <FormField
              label="Mot de passe"
              htmlFor="password"
              required
              error={hasError('password')}
              errorMessage={getErrorMessage('password')}
              shake={shouldShake('password')}
              description="Au moins 8 caractères avec majuscules, minuscules et chiffres"
            >
              <div className="relative">
                <AnimatedInput
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  error={hasError('password')}
                  errorMessage={getErrorMessage('password')}
                  shake={shouldShake('password')}
                  className="h-11 sm:h-12 text-base pr-12"
                  {...register('password')}
                />
                <motion.button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </motion.button>
              </div>
            </FormField>

            {/* Confirmation mot de passe */}
            <FormField
              label="Confirmer le mot de passe"
              htmlFor="confirmPassword"
              required
              error={hasError('confirmPassword')}
              errorMessage={getErrorMessage('confirmPassword')}
              shake={shouldShake('confirmPassword')}
            >
              <div className="relative">
                <AnimatedInput
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  error={hasError('confirmPassword')}
                  errorMessage={getErrorMessage('confirmPassword')}
                  shake={shouldShake('confirmPassword')}
                  className="h-11 sm:h-12 text-base pr-12"
                  {...register('confirmPassword')}
                />
                <motion.button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </motion.button>
              </div>
            </FormField>

            {/* Bouton d'inscription */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="pt-4"
            >
              <Button
                type="submit"
                className="w-full h-11 sm:h-12 text-base font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <motion.div
                    className="flex items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Inscription en cours...
                  </motion.div>
                ) : (
                  'S\'inscrire'
                )}
              </Button>
            </motion.div>

            {/* Lien vers connexion */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Déjà un compte ? </span>
              <motion.button
                type="button"
                onClick={() => router.push('/login')}
                className="text-primary hover:underline font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Se connecter
              </motion.button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
