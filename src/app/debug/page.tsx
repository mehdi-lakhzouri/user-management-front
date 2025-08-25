import { APIDiagnostic } from '@/components/APIDiagnostic';
import { TokenDebugger } from '@/components/TokenDebugger';

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-8">
      <div className="container mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center mb-8">Debug & Diagnostics</h1>
        <APIDiagnostic />
        <TokenDebugger />
      </div>
    </div>
  );
}
