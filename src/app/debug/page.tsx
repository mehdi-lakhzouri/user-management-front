import { APIDiagnostic } from '@/components/APIDiagnostic';

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Debug API Backend</h1>
        <APIDiagnostic />
      </div>
    </div>
  );
}
