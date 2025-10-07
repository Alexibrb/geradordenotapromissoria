'use client';

import { ArrowLeft, CheckCircle, Gem, Loader, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedRoute } from '@/firebase/auth/use-user';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import type { AppSettings } from '@/types';
import { doc } from 'firebase/firestore';

function UpgradePage() {
  const router = useRouter();
  const { user, userProfile } = useUser();
  const firestore = useFirestore();

  const appSettingsRef = useMemoFirebase(() => user ? doc(firestore, 'app_settings', 'general') : null, [firestore, user]);
  const { data: appSettings, isLoading: areAppSettingsLoading } = useDoc<AppSettings>(appSettingsRef);

  const handleUpgradeClick = (planName: string) => {
    if (!user) return;
    
    const whatsappNumber = appSettings?.upgradeWhatsappNumber || '5569992686894';
    const message = `Olá, gostaria de assinar o plano ${planName.toUpperCase()} do aplicativo Gerador de nota promissória, meu e-mail é ${user.email}`;
    const encodedMessage = encodeURIComponent(message);
    
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
  };

  const proFeatures = [
    "Clientes ilimitados",
    "Emissão de notas ilimitadas",
    "Geração de notas promissórias em PDF",
    "Geração de carnê de pagamento em PDF",
    "Controle de pagamentos",
    "Dashboard com resumo das transações",
    "Suporte prioritário e muito mais!",
  ];

  const plans = [
    { name: 'Mensal', price: 'R$10', period: '/mês', description: 'Flexibilidade total.' },
    { name: 'Semestral', price: 'R$50', period: '/semestre', description: 'Ótimo custo-benefício.', popular: true },
    { name: 'Anual', price: 'R$80', period: '/ano', description: 'Máxima economia.' },
  ];

  if (areAppSettingsLoading && !!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="animate-spin" />
      </div>
    );
  }

  if (userProfile?.plan === 'pro' || userProfile?.role === 'admin') {
      return (
        <ProtectedRoute>
            <main className="min-h-full bg-background">
                <div className="container mx-auto px-4 py-8 md:py-12 text-center">
                     <Button variant="ghost" onClick={() => router.back()} className="mb-6">
                        <ArrowLeft className="mr-2" />
                        Voltar
                    </Button>
                    <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                    <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight mt-4">
                        Você já é Pro!
                    </h1>
                     <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
                        Sua conta já tem acesso a todas as funcionalidades ilimitadas.
                    </p>
                </div>
            </main>
        </ProtectedRoute>
      )
  }

  return (
    <ProtectedRoute>
      <main className="min-h-full bg-background">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="mr-2" />
            Voltar
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

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
             {plans.map((plan) => (
              <Card key={plan.name} className={`flex flex-col ${plan.popular ? 'border-primary shadow-lg relative' : ''}`}>
                 {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-full">MAIS POPULAR</div>}
                <CardHeader className="text-left">
                  <div className="flex items-center gap-2">
                      <Gem className="h-6 w-6 text-primary" />
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4 text-left">
                   <p className="text-3xl font-bold">{plan.price}<span className="text-sm font-normal text-muted-foreground">{plan.period}</span></p>
                    <div className="text-center bg-green-100 text-green-800 p-2 rounded-lg">
                        <p className="font-semibold text-md">Pagamento via PIX</p>
                    </div>
                  <ul className="space-y-2 text-sm pt-4">
                     {proFeatures.map(feature => (
                       <li key={feature} className="flex items-start gap-2">
                         <CheckCircle className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                         <span>{feature}</span>
                       </li>
                     ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" size="lg" onClick={() => handleUpgradeClick(plan.name)}>
                    <MessageSquare className="mr-2"/>
                    Assinar Plano {plan.name}
                  </Button>
                </CardFooter>
              </Card>
             ))}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}

export default UpgradePage;
