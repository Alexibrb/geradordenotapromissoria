'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, doc, addDoc, Timestamp } from 'firebase/firestore';
import type { Client, PromissoryNoteData } from '@/types';
import { ProtectedRoute } from '@/firebase/auth/use-user';
import { PromissoryNoteForm } from '@/components/promissory-note-form';
import { PromissoryNoteDisplay } from '@/components/promissory-note-display';
import { CarneDisplay } from '@/components/carne-display';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Loader, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { format } from 'date-fns';

function AddNotePage() {
  const { clientId } = useParams();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const clientDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid, 'clients', clientId as string) : null, [firestore, user, clientId]);
  const { data: client, isLoading: isClientLoading } = useDoc<Client>(clientDocRef);
  
  const [generatedData, setGeneratedData] = useState<PromissoryNoteData | null>(null);

  const handleGenerateAndSave = async (formData: PromissoryNoteData) => {
    if (!user || !client) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Usuário ou cliente não encontrado.',
      });
      return;
    }
    
    const noteNumber = format(new Date(), 'yyyyMMddHHmmss');
    const dataWithNumber = { ...formData, noteNumber };
    setGeneratedData(dataWithNumber);
    
    const notesCollectionRef = collection(firestore, 'users', user.uid, 'clients', clientId as string, 'promissoryNotes');
    
    const noteToSave = {
      ...dataWithNumber,
      clientId: client.id,
      paymentDate: Timestamp.fromDate(dataWithNumber.paymentDate),
      value: dataWithNumber.totalValue,
      numberOfInstallments: dataWithNumber.installments,
      productServiceReference: dataWithNumber.productReference,
    };
    
    // Remove fields from PromissoryNoteData that are not in PromissoryNote
    delete (noteToSave as any).totalValue;
    delete (noteToSave as any).installments;
    delete (noteToSave as any).productReference;
    
    addDocumentNonBlocking(notesCollectionRef, noteToSave);

    toast({
      title: 'Nota Salva!',
      description: 'A nova nota promissória foi salva com sucesso.',
      className: 'bg-accent text-accent-foreground',
    });

    // Optional: Redirect back to client page after a delay
    setTimeout(() => {
        router.push(`/clients/${clientId}`);
    }, 2000);
  };

  if (isClientLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader className="animate-spin" /></div>;
  }

  if (!client) {
    return <div className="flex h-screen items-center justify-center">Cliente não encontrado.</div>;
  }

  return (
    <ProtectedRoute>
      <main className="min-h-full bg-background">
        <div className="container mx-auto px-4 py-8 md:py-12">
            <Button variant="ghost" onClick={() => router.push(`/clients/${clientId}`)} className="mb-4">
                <ArrowLeft className="mr-2" />
                Voltar para {client.name}
            </Button>
          <header className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight">
              GERAR NOTA PROMISSÓRIA
            </h1>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              Preencha os detalhes abaixo para criar e salvar uma nova nota promissória para {client.name}.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            <div className="lg:col-span-2">
              <PromissoryNoteForm onGenerate={handleGenerateAndSave} client={client} />
            </div>
            <div className="lg:col-span-3 space-y-8">
              {generatedData ? (
                <>
                  <PromissoryNoteDisplay data={generatedData} />
                  <CarneDisplay data={generatedData} />
                </>
              ) : (
                <Card className="h-full min-h-[500px] flex items-center justify-center border-dashed">
                  <CardContent className="text-center p-8">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      Os documentos gerados aparecerão aqui após salvar.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}

export default AddNotePage;
