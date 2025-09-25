'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, Timestamp, setDoc } from 'firebase/firestore';
import type { Client, PromissoryNote, PromissoryNoteData } from '@/types';
import { ProtectedRoute } from '@/firebase/auth/use-user';
import { PromissoryNoteForm } from '@/components/promissory-note-form';
import { Card, CardContent } from '@/components/ui/card';
import { Loader, ArrowLeft, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

function EditNotePage() {
  const { clientId, noteId } = useParams();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const noteDocRef = useMemoFirebase(() => 
    user ? doc(firestore, 'users', user.uid, 'clients', clientId as string, 'promissoryNotes', noteId as string) : null,
    [firestore, user, clientId, noteId]
  );
  const { data: note, isLoading: isNoteLoading } = useDoc<PromissoryNote>(noteDocRef);

  const clientDocRef = useMemoFirebase(() => 
    user ? doc(firestore, 'users', user.uid, 'clients', clientId as string) : null,
    [firestore, user, clientId]
  );
  const { data: client, isLoading: isClientLoading } = useDoc<Client>(clientDocRef);
  
  const [initialData, setInitialData] = useState<PromissoryNoteData | null>(null);

  useEffect(() => {
    if (note) {
      setInitialData({
        ...note,
        totalValue: note.value,
        installments: note.numberOfInstallments,
        paymentDate: note.paymentDate.toDate(),
        productReference: note.productServiceReference,
      });
    }
  }, [note]);

  const handleUpdate = async (formData: PromissoryNoteData) => {
    if (!user || !note) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Usuário ou nota não encontrada.',
      });
      return;
    }
    
    const noteToUpdate = {
      ...formData,
      clientId: clientId as string,
      paymentDate: Timestamp.fromDate(formData.paymentDate),
      value: formData.totalValue,
      numberOfInstallments: formData.installments,
      productServiceReference: formData.productReference,
    };
    
    // Remove fields from PromissoryNoteData that are not in PromissoryNote
    delete (noteToUpdate as any).totalValue;
    delete (noteToUpdate as any).installments;
    delete (noteToUpdate as any).productReference;
    
    setDocumentNonBlocking(noteDocRef, noteToUpdate, { merge: true });

    toast({
      title: 'Nota Atualizada!',
      description: 'A nota promissória foi atualizada com sucesso.',
      className: 'bg-accent text-accent-foreground',
    });

    setTimeout(() => {
        router.push(`/clients/${clientId}`);
    }, 1500);
  };

  if (isNoteLoading || isClientLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader className="animate-spin" /></div>;
  }

  if (!note || !client) {
    return <div className="flex h-screen items-center justify-center">Nota ou cliente não encontrado.</div>;
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
              EDITAR NOTA PROMISSÓRIA
            </h1>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              Altere os detalhes da nota promissória para {client.name}.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="lg:col-span-2">
              {initialData ? (
                 <PromissoryNoteForm onGenerate={handleUpdate} client={client} initialData={initialData} isEditing />
              ) : (
                <Card className="h-full min-h-[500px] flex items-center justify-center border-dashed">
                    <CardContent className="text-center p-8">
                        <Loader className="mx-auto h-12 w-12 text-muted-foreground animate-spin" />
                        <p className="mt-4 text-sm text-muted-foreground">
                        Carregando dados da nota...
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

export default EditNotePage;
