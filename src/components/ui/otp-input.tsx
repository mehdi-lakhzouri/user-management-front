'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
  className,
}: OtpInputProps) {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialiser les refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  const handleChange = (index: number, inputValue: string) => {
    // Ne garder que les chiffres
    const numericValue = inputValue.replace(/\D/g, '');
    
    if (numericValue.length > 1) {
      // Si on colle plusieurs chiffres, les distribuer
      const newValue = value.split('');
      const pastedDigits = numericValue.slice(0, length - index);
      
      for (let i = 0; i < pastedDigits.length && index + i < length; i++) {
        newValue[index + i] = pastedDigits[i];
      }
      
      const finalValue = newValue.join('').slice(0, length);
      onChange(finalValue);
      
      // Focuser sur le prochain input vide ou le dernier
      const nextIndex = Math.min(index + pastedDigits.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
      
      if (finalValue.length === length) {
        onComplete?.(finalValue);
      }
    } else if (numericValue.length === 1) {
      // Un seul chiffre
      const newValue = value.split('');
      newValue[index] = numericValue;
      const finalValue = newValue.join('');
      
      onChange(finalValue);
      
      // Passer au suivant
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
      
      if (finalValue.length === length) {
        onComplete?.(finalValue);
      }
    } else {
      // Effacement
      const newValue = value.split('');
      newValue[index] = '';
      onChange(newValue.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (value[index]) {
        // Effacer le chiffre actuel
        const newValue = value.split('');
        newValue[index] = '';
        onChange(newValue.join(''));
      } else if (index > 0) {
        // Aller au précédent et l'effacer
        const newValue = value.split('');
        newValue[index - 1] = '';
        onChange(newValue.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
    // Sélectionner le contenu pour faciliter la saisie
    inputRefs.current[index]?.select();
  };

  const handleBlur = () => {
    setFocusedIndex(-1);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    
    if (pastedData) {
      const newValue = pastedData.slice(0, length);
      onChange(newValue);
      
      // Focuser sur le dernier input rempli
      const lastIndex = Math.min(newValue.length - 1, length - 1);
      if (lastIndex >= 0) {
        inputRefs.current[lastIndex]?.focus();
      }
      
      if (newValue.length === length) {
        onComplete?.(newValue);
      }
    }
  };

  return (
    <div className={cn('flex gap-2 justify-center', className)}>
      {Array.from({ length }, (_, index) => (
        <motion.div
          key={index}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.input
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={length} // Permettre le collage de plusieurs chiffres
            value={value[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onFocus={() => handleFocus(index)}
            onBlur={handleBlur}
            onPaste={handlePaste}
            disabled={disabled}
            className={cn(
              'w-12 h-12 text-center text-lg font-semibold',
              'border-2 rounded-lg',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              'bg-background',
              error
                ? 'border-destructive focus:border-destructive focus:ring-destructive'
                : focusedIndex === index
                ? 'border-primary focus:border-primary focus:ring-primary'
                : 'border-input hover:border-muted-foreground',
              disabled && 'opacity-50 cursor-not-allowed',
              'placeholder:text-muted-foreground'
            )}
            animate={{
              borderColor: error
                ? 'rgb(239 68 68)' // red-500
                : focusedIndex === index
                ? 'rgb(59 130 246)' // blue-500
                : 'rgb(209 213 219)', // gray-300
              scale: focusedIndex === index ? 1.05 : 1,
            }}
            transition={{ duration: 0.2 }}
          />
          
          {/* Indicateur de focus animé */}
          <AnimatePresence>
            {focusedIndex === index && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                exit={{ scaleX: 0 }}
                className="h-0.5 bg-primary mt-1 rounded-full"
                transition={{ duration: 0.2 }}
              />
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}
