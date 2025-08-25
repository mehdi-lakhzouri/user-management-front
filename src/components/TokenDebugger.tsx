'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useTokenMonitor } from '@/hooks/useTokenMonitor';
import { userService } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function TokenDebugger() {
  const { isAuthenticated, hasValidToken, hasRefreshToken } = useTokenMonitor();
  const { accessToken, refreshToken, lastTokenRefresh, error } = useAuthStore();
  const [testResult, setTestResult] = useState<string>('');
  const [isTestingApi, setIsTestingApi] = useState(false);

  const testApiCall = async () => {
    setIsTestingApi(true);
    try {
      console.log('🧪 Test API call - démarrage...');
      const profile = await userService.getProfile();
      console.log('🧪 Profil récupéré:', profile);
      
      if (profile && profile.fullname) {
        setTestResult(`✅ API Call réussie - Utilisateur: ${profile.fullname}`);
      } else {
        setTestResult(`⚠️ API Call réussie mais données incomplètes: ${JSON.stringify(profile)}`);
      }
    } catch (error: any) {
      console.error('🧪 Erreur test API:', error);
      let errorMessage = error.message || 'Erreur inconnue';
      
      if (error.response) {
        errorMessage = `${error.response.status} - ${error.response.data?.message || error.message}`;
      }
      
      setTestResult(`❌ API Call échouée: ${errorMessage}`);
    } finally {
      setIsTestingApi(false);
    }
  };

  const getTokenExpiry = () => {
    if (!accessToken) return 'N/A';
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const expiry = new Date(payload.exp * 1000);
      return expiry.toLocaleString();
    } catch {
      return 'Erreur de décodage';
    }
  };

  const getTimeUntilExpiry = () => {
    if (!accessToken) return 'N/A';
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const expiryTime = payload.exp * 1000;
      const currentTime = Date.now();
      const diff = expiryTime - currentTime;
      const minutes = Math.round(diff / 1000 / 60);
      return `${minutes} minutes`;
    } catch {
      return 'Erreur';
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>🔧 Token Debugger</CardTitle>
          <CardDescription>Utilisateur non authentifié</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🔧 Token Debugger</CardTitle>
        <CardDescription>Surveillance des tokens JWT en temps réel</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold">État d'authentification</h4>
            <div className={`p-2 rounded ${isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isAuthenticated ? '✅ Authentifié' : '❌ Non authentifié'}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">Token valide</h4>
            <div className={`p-2 rounded ${hasValidToken ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {hasValidToken ? '✅ Valide' : '❌ Invalide'}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Expiration du token</h4>
          <div className="bg-blue-50 p-2 rounded">
            <p><strong>Expire le:</strong> {getTokenExpiry()}</p>
            <p><strong>Temps restant:</strong> {getTimeUntilExpiry()}</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Refresh Token</h4>
          <div className={`p-2 rounded ${hasRefreshToken ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {hasRefreshToken ? '✅ Disponible' : '❌ Manquant'}
          </div>
        </div>

        {lastTokenRefresh && (
          <div className="space-y-2">
            <h4 className="font-semibold">Dernier refresh</h4>
            <div className="bg-yellow-50 p-2 rounded">
              {new Date(lastTokenRefresh).toLocaleString()}
            </div>
          </div>
        )}

        {error && (
          <div className="space-y-2">
            <h4 className="font-semibold">Erreur</h4>
            <div className="bg-red-50 p-2 rounded text-red-800">
              {error}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-semibold">Test API</h4>
          <Button 
            onClick={testApiCall} 
            disabled={isTestingApi}
            className="w-full"
          >
            {isTestingApi ? 'Test en cours...' : 'Tester un appel API'}
          </Button>
          {testResult && (
            <div className="bg-gray-50 p-2 rounded">
              {testResult}
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 mt-4">
          <p><strong>Access Token (premiers 50 chars):</strong></p>
          <p className="break-all">{accessToken?.substring(0, 50)}...</p>
        </div>
      </CardContent>
    </Card>
  );
}
