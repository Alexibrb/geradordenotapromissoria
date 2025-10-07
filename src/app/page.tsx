'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Gem, Star, Video, Loader } from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { AppSettings } from '@/types';
import { doc } from 'firebase/firestore';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();

  const appSettingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'general') : null, [firestore]);
  const { data: appSettings, isLoading: areAppSettingsLoading } = useDoc<AppSettings>(appSettingsRef);

  const handleSubscriptionClick = (planName: string) => {
    const whatsappNumber = appSettings?.upgradeWhatsappNumber || '5569992686894';
    let message = `Olá, gostaria de assinar o plano ${planName.toUpperCase()} do aplicativo Gerador de nota promissória`;

    if (user && user.email) {
      message += `, meu e-mail é ${user.email}`;
    }

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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Gerador de Nota Promissória</h1>
        <div className="flex items-center gap-2">
          {areAppSettingsLoading ? (
            <Loader className="animate-spin h-5 w-5" />
          ) : (
            appSettings?.tutorialVideoUrl && (
               <a href={appSettings.tutorialVideoUrl} target="_blank" rel="noopener noreferrer">
                 <Button variant="outline">
                   <Video className="mr-2" />
                   Ver Tutorial em Vídeo
                 </Button>
               </a>
            )
          )}
          <Button variant="ghost" onClick={() => router.push('/login')}>
            Entrar
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-7xl md:text-8xl font-extrabold tracking-tight">
            Simples, Rápido e Profissional
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Crie, gerencie e imprima notas promissórias e carnês de pagamento com facilidade. Escolha o plano que melhor se adapta a você.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {/* Free Plan Card */}
            <Card className="flex flex-col">
              <CardHeader className="text-left">
                 <div className="flex items-center gap-2">
                    <Star className="h-6 w-6" />
                    <CardTitle className="text-2xl">Gratuito</CardTitle>
                 </div>
                <CardDescription>Perfeito para experimentar.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4 text-left">
                 <p className="text-3xl font-bold">R$0<span className="text-sm font-normal text-muted-foreground">/para sempre</span></p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Até 3 clientes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Período de teste de 30 dias</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Geração de Nota e Carnê em PDF</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline" onClick={() => router.push('/login')}>
                  Começar a Testar
                </Button>
              </CardFooter>
            </Card>

            {/* Monthly Plan Card */}
            <Card className="flex flex-col">
              <CardHeader className="text-left">
                <div className="flex items-center gap-2">
                    <Gem className="h-6 w-6 text-primary" />
                    <CardTitle className="text-2xl">Mensal</CardTitle>
                </div>
                <CardDescription>Flexibilidade total.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4 text-left">
                 <p className="text-3xl font-bold">R$10<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                <ul className="space-y-2 text-sm">
                   {proFeatures.map(feature => (
                     <li key={feature} className="flex items-start gap-2">
                       <Check className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                       <span>{feature}</span>
                     </li>
                   ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => handleSubscriptionClick('Mensal')}>
                  Assinar Plano Mensal
                </Button>
              </CardFooter>
            </Card>

            {/* Semiannual Plan Card */}
            <Card className="border-primary flex flex-col shadow-lg relative">
               <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-full">MAIS POPULAR</div>
              <CardHeader className="text-left">
                <div className="flex items-center gap-2">
                    <Gem className="h-6 w-6 text-primary" />
                    <CardTitle className="text-2xl">Semestral</CardTitle>
                </div>
                <CardDescription>Ótimo custo-benefício.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4 text-left">
                 <p className="text-3xl font-bold">R$50<span className="text-sm font-normal text-muted-foreground">/semestre</span></p>
                <ul className="space-y-2 text-sm">
                   {proFeatures.map(feature => (
                     <li key={feature} className="flex items-start gap-2">
                       <Check className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                       <span>{feature}</span>
                     </li>
                   ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => handleSubscriptionClick('Semestral')}>
                  Assinar Plano Semestral
                </Button>
              </CardFooter>
            </Card>

             {/* Annual Plan Card */}
            <Card className="flex flex-col">
              <CardHeader className="text-left">
                <div className="flex items-center gap-2">
                    <Gem className="h-6 w-6 text-primary" />
                    <CardTitle className="text-2xl">Anual</CardTitle>
                </div>
                <CardDescription>Máxima economia.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4 text-left">
                 <p className="text-3xl font-bold">R$80<span className="text-sm font-normal text-muted-foreground">/ano</span></p>
                <ul className="space-y-2 text-sm">
                   {proFeatures.map(feature => (
                     <li key={feature} className="flex items-start gap-2">
                       <Check className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                       <span>{feature}</span>
                     </li>
                   ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => handleSubscriptionClick('Anual')}>
                  Assinar Plano Anual
                </Button>
              </CardFooter>
            </Card>

          </div>
        </div>
      </main>

       <footer className="container mx-auto px-4 py-6 text-center text-muted-foreground text-sm">
          <p>Versão 1.0.2025 - Desenvolvido por Alex Alves</p>
        </footer>
    </div>
  );
}
