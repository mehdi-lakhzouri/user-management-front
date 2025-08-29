'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

interface DiagnosticResult {
  status: 'success' | 'error' | 'warning';
  message: string;
  details: string;
}

export function APIDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostic = async () => {
    setIsRunning(true);
    const newResults: DiagnosticResult[] = [];

    // Test 1: Vérifier la connectivité de base avec l'API
    try {
      const response = await api.get('/health');
      newResults.push({
        status: 'success',
        message: 'API Backend accessible',
        details: `Status: ${response.status}`
      });
    } catch (error: unknown) {
      newResults.push({
        status: 'error',
        message: 'API Backend inaccessible',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }

    // Test 2: Vérifier la documentation API (Swagger)
    try {
      await api.get('/api-docs');
      newResults.push({
        status: 'success',
        message: 'Documentation API accessible',
        details: 'Swagger UI disponible'
      });
    } catch (error: unknown) {
      newResults.push({
        status: 'warning',
        message: 'Documentation API non accessible',
        details: 'Normal si Swagger n&apos;est pas configuré'
      });
    }

    // Test 3: Tester l'endpoint d'inscription (avec données invalides pour tester la validation)
    try {
      await api.post('/auth/register', {
        email: 'test-invalid'
      });
    } catch (error: unknown) {
      // Vérification du type d'erreur Axios
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 400) {
          newResults.push({
            status: 'success',
            message: 'Endpoint d&apos;inscription fonctionne',
            details: 'Validation côté serveur active'
          });
        } else {
          newResults.push({
            status: 'warning',
            message: 'Endpoint d&apos;inscription accessible mais erreur inattendue',
            details: `Status: ${axiosError.response?.status || 'inconnu'}`
          });
        }
      } else {
        newResults.push({
          status: 'error',
          message: 'Problème avec l&apos;endpoint d&apos;inscription',
          details: error instanceof Error ? error.message : 'Erreur inconnue'
        });
      }
    }

    // Test 4: Vérifier la configuration CORS avec l'API centralisée
    try {
      await api.options('/');
      newResults.push({
        status: 'success',
        message: 'CORS configuré',
        details: 'Preflight requests acceptées'
      });
    } catch (error: unknown) {
      // Si OPTIONS n'est pas supporté, essayer avec une requête HEAD
      try {
        await api.head('/');
        newResults.push({
          status: 'success',
          message: 'CORS configuré',
          details: 'API accessible via instance centralisée'
        });
      } catch (headError: unknown) {
        newResults.push({
          status: 'error',
          message: 'Problème CORS détecté',
          details: headError instanceof Error ? headError.message : 'Erreur de connexion'
        });
      }
    }

    setResults(newResults);
    setIsRunning(false);
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      warning: 'outline'
    } as const;

    return (
      <Badge variant={variants[status]} className="ml-auto">
        {status === 'success' ? 'OK' : status === 'error' ? 'ERREUR' : 'ATTENTION'}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Diagnostic API Backend</CardTitle>
        <CardDescription>
          Vérification de la connectivité et du bon fonctionnement de l&apos;API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostic} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'Diagnostic en cours...' : 'Lancer le diagnostic'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Résultats:</h3>
            {results.map((result, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{result.message}</span>
                    {getStatusBadge(result.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {result.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}