'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, Clock, Loader2, Mail, Shield } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OtpInput } from '@/components/ui/otp-input';

import { loginSchema, verifyOtpSchema, type LoginFormData, type VerifyOtpFormData } from '@/lib/validations';
import { authService } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

type Step = 'credentials' | 'otp' | 'success';

interface LoginForm2FAProps {
  onSuccess?: () => void;
}

export function LoginForm2FA({ onSuccess }: LoginForm2FAProps) {
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [timeLeft, setTimeLeft] = useState(240); // 4 minutes en secondes pour OTP
  
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  // Form pour les identifiants
  const credentialsForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Timer pour l'expiration de session
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (step === 'otp' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timeLeft]);

  // Vérifier s'il y a une session active au montage
  useEffect(() => {
    const sessionData = authService.getSessionData();
    if (sessionData) {
      setEmail(sessionData.email);
      setSessionToken(sessionData.sessionToken);
      setStep('otp');
      const remaining = Math.max(0, Math.floor((sessionData.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
    }
  }, []);

  const handleSessionExpired = () => {
    authService.clearSessionData();
    setStep('credentials');
    setOtp('');
    setOtpError('');
    setTimeLeft(240); // Reset timer to 4 minutes
    toast.error('Code expiré', {
      description: 'Le code OTP a expiré. Veuillez recommencer la connexion.',
    });
  };

  const handleCredentialsSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      const response = await authService.validateCredentials(data);
      setEmail(data.email);
      setSessionToken(response.sessionToken);
      setStep('otp');
      setTimeLeft(240); // Reset timer to 4 minutes
      
      toast.success('Identifiants validés', {
        description: 'Code de vérification envoyé par email (valide 4 minutes).',
      });
    } catch (error: unknown) {
      const axiosError = error as { 
        response?: { 
          data?: { message?: string; code?: string } 
        } 
      };
      
      const errorMessage = axiosError.response?.data?.message || 'Email ou mot de passe incorrect';
      toast.error('Erreur de connexion', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (otp.length !== 6) {
      setOtpError('Le code doit contenir 6 chiffres.');
      return;
    }

    setIsLoading(true);
    setOtpError('');
    
    try {
      const response = await authService.verifyOtpAndLogin(email, otp, sessionToken);
      
      // Stocker les informations d'authentification
      setAuth(response.user, response.accessToken, response.refreshToken);
      
      setStep('success');
      toast.success('Connexion réussie !', {
        description: `Bienvenue ${response.user.fullname}`,
      });
      
      // Redirection après délai
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/dashboard');
        }
      }, 2000);
      
    } catch (error: unknown) {
      const axiosError = error as { 
        response?: { 
          data?: { message?: string; code?: string } 
        } 
      };
      
      const errorData = axiosError.response?.data;
      const errorCode = errorData?.code;
      
      switch (errorCode) {
        case 'INVALID_OTP':
          setOtpError('Code de vérification incorrect');
          break;
        case 'EXPIRED_OTP':
          setOtpError('Code de vérification expiré');
          handleSessionExpired();
          break;
        case 'SESSION_EXPIRED':
          setOtpError('Session expirée');
          handleSessionExpired();
          break;
        case 'TOO_MANY_ATTEMPTS':
          setOtpError('Trop de tentatives. Attendez quelques minutes.');
          handleSessionExpired();
          break;
        default:
          setOtpError(errorData?.message || 'Code incorrect. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value: string) => {
    setOtp(value);
    setOtpError('');
  };

  const handleOtpComplete = (value: string) => {
    setOtp(value);
    // Auto-vérification quand le code est complet
    setTimeout(() => {
      if (value.length === 6) {
        handleOtpSubmit();
      }
    }, 100);
  };

  const handleBackToCredentials = () => {
    authService.clearSessionData();
    setStep('credentials');
    setOtp('');
    setOtpError('');
    setTimeLeft(240); // Reset timer to 4 minutes
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderCredentialsStep = () => (
    <motion.div
      key="credentials"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="backdrop-blur-sm bg-background/95 border-border/50">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Connexion sécurisée</CardTitle>
          <CardDescription>
            Étape 1/2 - Saisissez vos identifiants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={credentialsForm.handleSubmit(handleCredentialsSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre.email@exemple.com"
                {...credentialsForm.register('email')}
                className={credentialsForm.formState.errors.email ? 'border-destructive' : ''}
              />
              {credentialsForm.formState.errors.email && (
                <p className="text-sm text-destructive">{credentialsForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...credentialsForm.register('password')}
                className={credentialsForm.formState.errors.password ? 'border-destructive' : ''}
              />
              {credentialsForm.formState.errors.password && (
                <p className="text-sm text-destructive">{credentialsForm.formState.errors.password.message}</p>
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
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Continuer
                </>
              )}
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
                  S'inscrire
                </Button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderOtpStep = () => (
    <motion.div
      key="otp"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="backdrop-blur-sm bg-background/95 border-border/50">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Code de vérification</CardTitle>
          <CardDescription>
            Étape 2/2 - Entrez le code envoyé à<br />
            <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timer */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Code expire dans: </span>
              <span className={`font-mono font-medium ${timeLeft <= 60 ? 'text-orange-500' : 'text-primary'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* Input OTP */}
          <div className="space-y-4">
            <OtpInput
              value={otp}
              onChange={handleOtpChange}
              onComplete={handleOtpComplete}
              error={!!otpError}
              disabled={isLoading}
            />
            
            {otpError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-destructive text-center"
              >
                {otpError}
              </motion.div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleOtpSubmit}
              className="w-full"
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Se connecter
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={handleBackToCredentials}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux identifiants
            </Button>
          </div>

          {/* Informations */}
          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>⏰ Code valide pendant 4 minutes</p>
            <p>📧 Vérifiez vos spams si vous ne recevez pas l'email</p>
            <p>🔄 Vous pouvez demander un nouveau code en recommençant</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderSuccessStep = () => (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="backdrop-blur-sm bg-background/95 border-border/50">
        <CardHeader className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4"
          >
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </motion.div>
          <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
            ✅ Connexion réussie !
          </CardTitle>
          <CardDescription>
            Authentification sécurisée terminée. Redirection en cours...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 2 }}
            className="h-1 bg-primary rounded-full"
          />
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Indicateur de progression */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
            step === 'credentials' 
              ? 'bg-primary text-primary-foreground' 
              : step === 'otp' || step === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-muted text-muted-foreground'
          }`}>
            1
          </div>
          <div className={`w-16 h-1 rounded-full ${
            step === 'otp' || step === 'success' ? 'bg-green-500' : 'bg-muted'
          }`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
            step === 'otp' 
              ? 'bg-primary text-primary-foreground' 
              : step === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-muted text-muted-foreground'
          }`}>
            2
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'credentials' && renderCredentialsStep()}
        {step === 'otp' && renderOtpStep()}
        {step === 'success' && renderSuccessStep()}
      </AnimatePresence>
    </div>
  );
}
