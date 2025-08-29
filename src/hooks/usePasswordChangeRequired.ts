'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

export function usePasswordChangeRequired() {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // Vérifier si l'utilisateur connecté doit changer son mot de passe
    if (user?.mustChangePassword) {
      setShowChangePassword(true);
    }
  }, [user]);

  const handleChangePasswordClose = () => {
    // Ne rien faire si le changement est obligatoire
    // Le dialog sera configuré avec isRequired=true
  };

  const handleChangePasswordComplete = () => {
    setShowChangePassword(false);
  };

  return {
    showChangePassword,
    isRequired: user?.mustChangePassword || false,
    handleChangePasswordClose,
    handleChangePasswordComplete,
  };
}
