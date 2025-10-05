'use client';

import { ArrowLeft, CheckCircle, Gem } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedRoute } from '@/firebase/auth/use-user';
import { useUser } from '@/firebase';

function UpgradePage() {
  const router = useRouter();
  const { userProfile } = useUser();

  const handleUpgradeClick = () => {
    // Aqui você integraria com seu provedor de pagamento (Stripe, etc.)
    // Por enquanto, vamos apenas simular um link externo.
    window.open('https://wa.me/5569992686894', '_blank');
  };

  return (
    <ProtectedRoute>
      <main className="min-h-full bg-background">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <Button variant="ghost" onClick={() => router.push('/clients')} className="mb-6">
            <ArrowLeft className="mr-2" />
            Voltar para Clientes
          </Button>

          <header className="text-center mb-10">
            <Gem className="mx-auto h-12 w-12 text-blue-500" />
            <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight mt-4">
              Faça Upgrade para o Plano Pro
            </h1>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              Desbloqueie todo o potencial do sistema com clientes, notas e funcionalidades ilimitadas.
            </p>
          </header>

          <div className="flex justify-center">
            <Card className="w-full max-w-md shadow-2xl">
              <CardHeader className="text-center bg-secondary/30 p-6">
                <CardTitle className="text-2xl font-bold">Plano Pro</CardTitle>
                <CardDescription>Acesso completo e sem limites.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="text-center">
                  <span className="text-4xl font-extrabold">R$29,90</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <ul className="space-y-4 text-sm">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Clientes ilimitados</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Emissão de notas ilimitadas</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Sem limite de tempo de uso</span>
                  </li>
                   <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Suporte prioritário</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleUpgradeClick}
                  disabled={userProfile?.plan === 'pro'}
                >
                  {userProfile?.plan === 'pro' ? 'Você já é Pro!' : 'Fazer Upgrade Agora'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}

export default UpgradePage;
