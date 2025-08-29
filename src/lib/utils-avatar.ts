/**
 * Utilitaires pour la gestion des URLs d'avatars
 */

/**
 * Construit l'URL complète pour un avatar
 */
export function getAvatarUrl(avatar?: string | null): string | undefined {
  if (!avatar) return undefined;
  if (avatar.startsWith('blob:')) return avatar;
  
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    // Ajouter un timestamp pour éviter le cache des avatars
    const timestamp = Date.now();
    const separator = avatar.includes('?') ? '&' : '?';
    return `${avatar}${separator}t=${timestamp}`;
  }
  
  // Utiliser la configuration centralisée
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  const apiOrigin = apiBaseUrl.replace('/api', '');
  
  // Pour les chemins relatifs, s'assurer qu'ils commencent par /api/uploads/
  if (avatar.startsWith('/uploads/')) {
    const timestamp = Date.now();
    return `${apiOrigin}/api${avatar}?t=${timestamp}`;
  }
  
  if (avatar.startsWith('/api/uploads/')) {
    const timestamp = Date.now();
    return `${apiOrigin}${avatar}?t=${timestamp}`;
  }
  
  // Si l'avatar ne commence pas par /, on ajoute /uploads/avatars/
  if (!avatar.startsWith('/')) {
    const timestamp = Date.now();
    return `${apiOrigin}/api/uploads/avatars/${avatar}?t=${timestamp}`;
  }
  
  const timestamp = Date.now();
  return `${apiOrigin}/api${avatar}?t=${timestamp}`;
}

/**
 * Obtient l'origine de l'API de manière centralisée
 */
export function getApiOrigin(): string {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const url = new URL(apiBaseUrl);
    return url.origin;
  } catch (e) {
    return 'http://localhost:3000';
  }
}
