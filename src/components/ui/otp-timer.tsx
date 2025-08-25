'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OtpTimerProps {
  duration: number; // en secondes
  onExpire?: () => void;
  onResend?: () => void;
  isResending?: boolean;
  className?: string;
  autoStart?: boolean;
}

export function OtpTimer({
  duration = 240, // 4 minutes par défaut
  onExpire,
  onResend,
  isResending = false,
  className,
  autoStart = true,
}: OtpTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(autoStart);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            setIsActive(false);
            setIsExpired(true);
            onExpire?.();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isActive, timeLeft, onExpire]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return ((duration - timeLeft) / duration) * 100;
  };

  const handleResend = () => {
    if (onResend && !isResending) {
      setTimeLeft(duration);
      setIsActive(true);
      setIsExpired(false);
      onResend();
    }
  };

  const getColorClass = () => {
    if (isExpired) return 'text-destructive';
    if (timeLeft <= 60) return 'text-orange-500';
    return 'text-muted-foreground';
  };

  return (
    <div className={cn('flex flex-col items-center space-y-3', className)}>
      {/* Minuterie circulaire */}
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
          {/* Cercle de fond */}
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-muted/20"
          />
          {/* Cercle de progression */}
          <motion.circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            className={cn(
              'transition-colors duration-300',
              isExpired 
                ? 'text-destructive' 
                : timeLeft <= 60 
                ? 'text-orange-500' 
                : 'text-primary'
            )}
            strokeDasharray={226.2} // 2 * π * 36
            strokeDashoffset={226.2 * (1 - getProgressPercentage() / 100)}
            initial={{ strokeDashoffset: 226.2 }}
            animate={{ 
              strokeDashoffset: 226.2 * (1 - getProgressPercentage() / 100)
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </svg>
        
        {/* Icône et temps au centre */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            animate={{ 
              scale: timeLeft <= 60 && !isExpired ? [1, 1.1, 1] : 1,
              rotate: isExpired ? 360 : 0
            }}
            transition={{ 
              scale: { duration: 0.5, repeat: timeLeft <= 60 && !isExpired ? Infinity : 0 },
              rotate: { duration: 0.5 }
            }}
          >
            <Clock className={cn('h-5 w-5', getColorClass())} />
          </motion.div>
          <motion.span
            className={cn('text-sm font-mono font-semibold', getColorClass())}
            animate={{ 
              scale: timeLeft <= 10 && !isExpired ? [1, 1.05, 1] : 1 
            }}
            transition={{ 
              duration: 0.3, 
              repeat: timeLeft <= 10 && !isExpired ? Infinity : 0 
            }}
          >
            {formatTime(timeLeft)}
          </motion.span>
        </div>
      </div>

      {/* Message d'état */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        {isExpired ? (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="space-y-2"
          >
            <p className="text-sm text-destructive font-medium">
              ⏰ Code expiré
            </p>
            <motion.button
              onClick={handleResend}
              disabled={isResending}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2',
                'text-sm font-medium text-primary hover:text-primary/80',
                'bg-primary/10 hover:bg-primary/20',
                'border border-primary/20 rounded-lg',
                'transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                animate={{ rotate: isResending ? 360 : 0 }}
                transition={{ 
                  duration: 1, 
                  repeat: isResending ? Infinity : 0,
                  ease: 'linear'
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </motion.div>
              {isResending ? 'Envoi en cours...' : 'Renvoyer le code'}
            </motion.button>
          </motion.div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Le code expire dans{' '}
            <span className={cn('font-medium', getColorClass())}>
              {formatTime(timeLeft)}
            </span>
          </p>
        )}
      </motion.div>

      {/* Barre de progression linéaire (optionnelle) */}
      <div className="w-full max-w-xs">
        <div className="w-full bg-muted rounded-full h-1.5">
          <motion.div
            className={cn(
              'h-1.5 rounded-full transition-colors duration-300',
              isExpired 
                ? 'bg-destructive' 
                : timeLeft <= 60 
                ? 'bg-orange-500' 
                : 'bg-primary'
            )}
            initial={{ width: '100%' }}
            animate={{ width: `${100 - getProgressPercentage()}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}
