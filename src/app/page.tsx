"use client";

import { useState } from 'react';
import type { PromissoryNoteData } from '@/types';
import { PromissoryNoteForm } from '@/components/promissory-note-form';
import { PromissoryNoteDisplay } from '@/components/promissory-note-display';
import { CarneDisplay } from '@/components/carne-display';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<PromissoryNoteData | null>(null);

  const handleGenerate = (formData: PromissoryNoteData) => {
    setData(null);
    // Use um pequeno timeout para permitir que os componentes antigos sejam desmontados e depois montar os novos com uma animação sutil.
    setTimeout(() => {
      setData(formData);
    }, 100);
  };

  return (
    <main className="min-h-full bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight">
            Gerador de Nota Promissória
          </h1>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Crie e imprima notas promissórias e carnês de pagamento profissionais com facilidade. Preencha os detalhes abaixo para começar.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-2">
            <PromissoryNoteForm onGenerate={handleGenerate} key={data ? 'form-filled' : 'form-empty'} />
          </div>
          <div className="lg:col-span-3 space-y-8">
            {data ? (
              <>
                <PromissoryNoteDisplay data={data} />
                <CarneDisplay data={data} />
              </>
            ) : (
              <Card className="h-full min-h-[500px] flex items-center justify-center border-dashed">
                <CardContent className="text-center p-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Seus documentos gerados aparecerão aqui.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
