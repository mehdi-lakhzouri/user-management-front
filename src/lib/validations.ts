import { z } from 'zod';

// Schema pour la connexion
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

// Schema pour l'inscription
export const registerSchema = z.object({
  fullname: z
    .string()
    .min(1, 'Le nom complet est requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères'),
  age: z
    .number()
    .min(1, 'L\'âge est requis')
    .min(13, 'Vous devez avoir au moins 13 ans')
    .max(120, 'Âge invalide'),
  gender: z.enum(['male', 'female', 'other'], {
    message: 'Le genre est requis',
  }),
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'
    ),
  confirmPassword: z
    .string()
    .min(1, 'La confirmation du mot de passe est requise'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

// Schema pour mot de passe oublié
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
});

// Schema pour réinitialiser le mot de passe
export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'
    ),
  confirmPassword: z
    .string()
    .min(1, 'La confirmation du mot de passe est requise'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

// Schema pour demande OTP
export const requestOtpSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
});

// Schema pour vérification OTP
export const verifyOtpSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
  otp: z
    .string()
    .min(1, 'Le code OTP est requis')
    .length(6, 'Le code OTP doit contenir exactement 6 chiffres')
    .regex(/^\d{6}$/, 'Le code OTP ne doit contenir que des chiffres'),
});

// Schema pour la mise à jour du profil
export const updateProfileSchema = z.object({
  fullname: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .optional(),
  age: z
    .number()
    .min(13, 'Vous devez avoir au moins 13 ans')
    .max(120, 'Âge invalide')
    .optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
});

// Types TypeScript inférés des schemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type RequestOtpFormData = z.infer<typeof requestOtpSchema>;
export type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
