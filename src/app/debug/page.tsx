import { APIDiagnostic } from '@/components/APIDiagnostic';
import { TokenDebugger } from '@/components/TokenDebugger';

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-8">
      <div className="container mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center mb-8">🔍 Debug & Diagnostics</h1>
        
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4">
          <h2 className="font-bold mb-2">Instructions de test :</h2>
          <ol className="list-decimal list-inside space-y-1">
            <li>Ouvrez la console du navigateur (F12 → Console)</li>
            <li>Connectez-vous via <a href="/login" className="underline font-medium">/login</a></li>
            <li>Regardez les messages "🔍 DEBUG" dans la console</li>
            <li>Revenez ici pour voir les données utilisateur actuelles</li>
          </ol>
        </div>
        
        <TokenDebugger />
        <APIDiagnostic />
      </div>
    </div>
  );
}
