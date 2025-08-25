'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OtpInput } from '@/components/ui/otp-input';
import { OtpTimer } from '@/components/ui/otp-timer';

import { requestOtpSchema, verifyOtpSchema, type RequestOtpFormData, type VerifyOtpFormData } from '@/lib/validations';
import { authService } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

type Step = 'email' | 'otp' | 'success';

export default function OtpLoginPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  
  const router = useRouter();
  const { setAuth } = useAuthStore();

  // Form pour l'email
  const emailForm = useForm<RequestOtpFormData>({
    resolver: zodResolver(requestOtpSchema),
    defaultValues: { email: '' },
  });

  // Form pour l'OTP (commenté car géré manuellement)
  // const otpForm = useForm<VerifyOtpFormData>({
  //   resolver: zodResolver(verifyOtpSchema),
  //   defaultValues: { email: '', otp: '' },
  // });

  const handleRequestOtp = async (data: RequestOtpFormData) => {
    setIsLoading(true);
    setOtpError('');
    
    try {
      await authService.requestOtp(data.email);
      setEmail(data.email);
      setStep('otp');
      toast.success('Code envoyé !', {
        description: 'Un code de vérification a été envoyé à votre adresse email.',
      });
    } catch (error: unknown) {
      console.error('Request OTP error:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      const errorMessage = axiosError.response?.data?.message || 'Erreur lors de l\'envoi du code. Veuillez réessayer.';
      toast.error('Erreur', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setOtpError('Le code doit contenir 6 chiffres.');
      return;
    }

    setIsLoading(true);
    setOtpError('');
    
    try {
      const response = await authService.verifyOtp(email, otp);
      
      // Stocker les informations d'authentification
      setAuth(response.user, response.accessToken, response.refreshToken);
      
      setStep('success');
      toast.success('Connexion réussie !', {
        description: `Bienvenue ${response.user.fullname}`,
      });
      
      // Redirection après délai
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (error: unknown) {
      console.error('Verify OTP error:', error);
      
      const axiosError = error as { 
        response?: { 
          status?: number;
          data?: { message?: string } 
        } 
      };
      const errorData = axiosError.response?.data;
      let errorMessage = 'Code incorrect. Veuillez réessayer.';
      
      if (errorData?.message) {
        errorMessage = errorData.message;
        // Extraire le nombre de tentatives restantes
        const match = errorData.message.match(/(\d+) attempt/);
        if (match) {
          setAttemptsLeft(parseInt(match[1]));
        }
      }
      
      setOtpError(errorMessage);
      
      if (axiosError.response?.status === 401 && errorData?.message?.includes('0 attempts')) {
        // Plus de tentatives
        toast.error('Trop de tentatives', {
          description: 'Veuillez demander un nouveau code.',
        });
        setStep('email');
        setOtp('');
        setAttemptsLeft(3);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    setOtpError('');
    setOtp('');
    setAttemptsLeft(3);
    
    try {
      await authService.requestOtp(email);
      toast.success('Nouveau code envoyé !', {
        description: 'Un nouveau code de vérification a été envoyé.',
      });
    } catch (error: unknown) {
      console.error('Resend OTP error:', error);
      toast.error('Erreur', {
        description: 'Erreur lors de l\'envoi du nouveau code.',
      });
    } finally {
      setIsResending(false);
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
        handleVerifyOtp();
      }
    }, 100);
  };

  const handleBackToEmail = () => {
    setStep('email');
    setOtp('');
    setOtpError('');
    setAttemptsLeft(3);
  };

  const renderEmailStep = () => (
    <motion.div
      key="email"
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
          <CardTitle className="text-2xl font-bold">Connexion par code</CardTitle>
          <CardDescription>
            Entrez votre email pour recevoir un code de connexion sécurisé
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={emailForm.handleSubmit(handleRequestOtp)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                {...emailForm.register('email')}
                className={emailForm.formState.errors.email ? 'border-destructive' : ''}
              />
              {emailForm.formState.errors.email && (
                <p className="text-sm text-destructive">{emailForm.formState.errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="mr-2"
                >
                  <Mail className="h-4 w-4" />
                </motion.div>
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              {isLoading ? 'Envoi en cours...' : 'Envoyer le code'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => router.push('/login')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la connexion classique
            </Button>
          </div>
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
          <CardTitle className="text-2xl font-bold">Vérifiez votre email</CardTitle>
          <CardDescription>
            Entrez le code à 6 chiffres envoyé à <br />
            <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timer */}
          <OtpTimer
            duration={240} // 4 minutes
            onExpire={() => {
              setOtpError('Le code a expiré. Veuillez demander un nouveau code.');
            }}
            onResend={handleResendOtp}
            isResending={isResending}
          />

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
                className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{otpError}</span>
              </motion.div>
            )}

            {attemptsLeft < 3 && attemptsLeft > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-sm text-orange-600"
              >
                ⚠️ {attemptsLeft} tentative{attemptsLeft > 1 ? 's' : ''} restante{attemptsLeft > 1 ? 's' : ''}
              </motion.div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleVerifyOtp}
              className="w-full"
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="mr-2"
                >
                  <CheckCircle className="h-4 w-4" />
                </motion.div>
              ) : null}
              {isLoading ? 'Vérification...' : 'Vérifier le code'}
            </Button>

            <Button
              variant="ghost"
              onClick={handleBackToEmail}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Changer d'adresse email
            </Button>
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
            Vous êtes maintenant connecté(e). Redirection en cours...
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 'email' && renderEmailStep()}
          {step === 'otp' && renderOtpStep()}
          {step === 'success' && renderSuccessStep()}
        </AnimatePresence>
      </div>
    </div>
  );
}
