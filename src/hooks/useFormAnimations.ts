import { useCallback } from 'react';
import { FieldErrors, FieldValues } from 'react-hook-form';

interface UseFormAnimationsOptions<T extends FieldValues> {
  errors: FieldErrors<T>;
  resetTrigger?: unknown;
}

export function useFormAnimations<T extends FieldValues = FieldValues>({ errors, resetTrigger }: UseFormAnimationsOptions<T>) {
  // Détecte si un champ a une erreur
  const hasError = useCallback((name: keyof T | string) => {
    return Boolean(errors && errors[name as string]);
  }, [errors]);

  // Récupère le message d'erreur d'un champ
  const getErrorMessage = useCallback((name: keyof T | string) => {
    return errors && errors[name as string]?.message ? String(errors[name as string]?.message) : '';
  }, [errors]);

  // Détecte si un champ doit "shaker" (ex: après submit raté)
  const shouldShake = useCallback((name: keyof T | string) => {
    return hasError(name);
  }, [hasError, resetTrigger]);

  return { hasError, getErrorMessage, shouldShake };
}
