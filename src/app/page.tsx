'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Gem, Star } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  const handleStart = (path: string) => {
    router.push(path);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tight">Gerador de Nota Promissória</h1>
        <Button variant="ghost" onClick={() => handleStart('/login')}>
          Entrar
        </Button>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Simples, Rápido e Profissional
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Crie, gerencie e imprima notas promissórias e carnês de pagamento com facilidade. Escolha o plano que melhor se adapta a você.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan Card */}
            <Card className="flex flex-col">
              <CardHeader className="text-left">
                 <div className="flex items-center gap-2">
                    <Star className="h-6 w-6" />
                    <CardTitle className="text-2xl">Plano Gratuito</CardTitle>
                 </div>
                <CardDescription>Perfeito para experimentar o sistema.</CardDescription>
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
                <Button className="w-full" variant="outline" onClick={() => handleStart('/login')}>
                  Começar a Testar
                </Button>
              </CardFooter>
            </Card>

            {/* Pro Plan Card */}
            <Card className="border-primary flex flex-col shadow-lg">
              <CardHeader className="text-left">
                <div className="flex items-center gap-2">
                    <Gem className="h-6 w-6 text-primary" />
                    <CardTitle className="text-2xl">Plano Pro</CardTitle>
                </div>
                <CardDescription>Acesso ilimitado a todas as funcionalidades.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4 text-left">
                 <p className="text-3xl font-bold">R$10,00<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                <ul className="space-y-2 text-sm">
                   <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Clientes ilimitados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Emissão de notas ilimitadas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Sem limite de tempo de uso</span>
                  </li>
                   <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Suporte prioritário</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => handleStart('/login')}>
                  Assinar Plano Pro
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
