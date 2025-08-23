'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { motion } from 'framer-motion';
import { Users, ArrowRight, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const features = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Sécurisé",
      description: "Authentification JWT avec refresh tokens"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Gestion des utilisateurs",
      description: "Système complet de gestion des rôles et permissions"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Moderne",
      description: "Interface utilisateur moderne avec Next.js 15"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="absolute top-4 right-4">
        <ThemeToggle />
      </header>

      <main className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-8"
        >
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-8">
              <Users className="h-8 w-8 text-primary-foreground" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              User Management
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Système complet d'authentification et de gestion d'utilisateurs 
              avec Next.js 15 et NestJS
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => router.push('/login')}
              className="group"
            >
              Se connecter
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => router.push('/register')}
            >
              Créer un compte
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full max-w-4xl"
        >
          {features.map((feature, index) => (
            <Card key={index} className="backdrop-blur-sm bg-background/50 border-border/50">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 text-center text-sm text-muted-foreground"
        >
          <p>
            Développé avec ❤️ avec Next.js 15, TypeScript & TailwindCSS
          </p>
        </motion.div>
      </main>
    </div>
  );
}
