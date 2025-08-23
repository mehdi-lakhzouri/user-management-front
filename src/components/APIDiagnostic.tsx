'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface DiagnosticResult {
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export function APIDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

  const runDiagnostics = async () => {
    setIsLoading(true);
    const newResults: DiagnosticResult[] = [];

    // Test 1: Vérifier la connectivité de base sur /api
    try {
      const response = await axios.get(`${apiBaseUrl}`);
      newResults.push({
        status: 'success',
        message: 'API Backend accessible',
        details: `Status: ${response.status}`
      });
    } catch (error: any) {
      newResults.push({
        status: 'error',
        message: 'API Backend inaccessible',
        details: error.message
      });
    }

    // Test 2: Vérifier l'endpoint API docs
    try {
      const response = await axios.get(`${apiBaseUrl.replace('/api', '')}/api/docs`);
      newResults.push({
        status: 'success',
        message: 'Documentation API accessible',
        details: 'Swagger UI disponible'
      });
    } catch (error: any) {
      newResults.push({
        status: 'warning',
        message: 'Documentation API non accessible',
        details: 'Normal si Swagger n\'est pas configuré'
      });
    }

    // Test 3: Test d'inscription avec des données invalides (pour vérifier la validation)
    try {
      await axios.post(`${apiBaseUrl}/auth/register`, {
        email: 'test-invalid'
      });
    } catch (error: any) {
      if (error.response?.status === 400) {
        newResults.push({
          status: 'success',
          message: 'Endpoint d\'inscription fonctionne',
          details: 'Validation côté serveur active'
        });
      } else {
        newResults.push({
          status: 'error',
          message: 'Problème avec l\'endpoint d\'inscription',
          details: `Status: ${error.response?.status}, Message: ${error.response?.data?.message || error.message}`
        });
      }
    }

    // Test 4: Vérifier la configuration CORS
    try {
      const response = await fetch(`${apiBaseUrl}/auth/register`, {
        method: 'OPTIONS'
      });
      newResults.push({
        status: 'success',
        message: 'CORS configuré',
        details: 'Preflight requests acceptées'
      });
    } catch (error: any) {
      newResults.push({
        status: 'error',
        message: 'Problème CORS détecté',
        details: error.message
      });
    }

    setResults(newResults);
    setIsLoading(false);
  };

  const getIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Diagnostic API Backend</CardTitle>
        <CardDescription>
          Vérification de la connectivité avec {apiBaseUrl}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDiagnostics} disabled={isLoading} className="w-full">
          {isLoading ? 'Diagnostic en cours...' : 'Lancer le diagnostic'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Résultats du diagnostic :</h3>
            {results.map((result, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                {getIcon(result.status)}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{result.message}</span>
                    <Badge variant={getBadgeVariant(result.status)}>
                      {result.status}
                    </Badge>
                  </div>
                  {result.details && (
                    <p className="text-sm text-muted-foreground">{result.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground mt-4">
          <p><strong>URL API configurée :</strong> {apiBaseUrl}</p>
          <p><strong>Variables d'environnement :</strong> NEXT_PUBLIC_API_URL = {process.env.NEXT_PUBLIC_API_URL || 'non définie'}</p>
        </div>
      </CardContent>
    </Card>
  );
}
