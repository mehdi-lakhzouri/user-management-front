'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { loginSchema, type LoginFormData } from '@/lib/validations';

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    // Migration vers le système 2FA obligatoire
    // Redirection vers la page de connexion 2FA avec les données pré-remplies
    toast.info('Redirection vers connexion sécurisée', {
      description: 'Nous utilisons maintenant un système de connexion 2FA pour votre sécurité.',
    });
    
    // Stocker temporairement l'email pour pré-remplir le formulaire 2FA
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('prefill_email', data.email);
    }
    
    router.push('/login');
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
          <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
          <CardDescription>
            Connectez-vous à votre compte pour continuer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="link"
                className="px-0 text-sm"
                onClick={() => router.push('/forgot-password')}
              >
                Mot de passe oublié ?
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full"
            >
              Se connecter avec 2FA
            </Button>

            {/* Séparateur avec "OU" */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            {/* Connexion par OTP */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => router.push('/otp-login')}
            >
              Se connecter avec un code
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Pas encore de compte ?{' '}
                <Button
                  type="button"
                  variant="link"
                  className="px-0"
                  onClick={() => router.push('/register')}
                >
                  S&apos;inscrire
                </Button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
