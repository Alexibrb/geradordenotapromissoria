'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, Timestamp } from 'firebase/firestore';
import type { Client, PromissoryNote, PromissoryNoteData, UserSettings } from '@/types';
import { ProtectedRoute } from '@/firebase/auth/use-user';
import { PromissoryNoteForm } from '@/components/promissory-note-form';
import { Card, CardContent } from '@/components/ui/card';
import { Loader, ArrowLeft, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { PromissoryNoteDisplay } from '@/components/promissory-note-display';
import { CarneDisplay } from '@/components/carne-display';

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

  const settingsDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid, 'settings', 'appSettings') : null, [firestore, user]);
  const { data: settings, isLoading: areSettingsLoading } = useDoc<UserSettings>(settingsDocRef);
  
  const [formData, setFormData] = useState<PromissoryNoteData | null>(null);

  useEffect(() => {
    if (note) {
      const noteData: PromissoryNoteData = {
        header: note.header,
        clientName: note.clientName,
        clientAddress: note.clientAddress,
        clientCpf: note.clientCpf,
        clientContact: note.clientContact,
        creditorName: note.creditorName,
        creditorCpf: note.creditorCpf,
        creditorAddress: note.creditorAddress,
        totalValue: note.value,
        installments: note.numberOfInstallments,
        paymentDate: note.paymentDate.toDate(),
        productReference: note.productServiceReference,
        noteNumber: note.noteNumber,
        paymentType: note.paymentType || 'a-prazo',
        hasDownPayment: note.hasDownPayment || false,
        downPaymentValue: note.downPaymentValue || 0,
        latePaymentClause: note.latePaymentClause || '',
      };
      setFormData(noteData);
    }
  }, [note]);

  const handleUpdate = async (updatedFormData: PromissoryNoteData) => {
    if (!user || !note || !noteDocRef) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Usuário ou nota não encontrada.',
      });
      return;
    }
    
    // Preserve the original noteNumber
    const finalFormData = { ...updatedFormData, noteNumber: note.noteNumber };
    setFormData(finalFormData);

    const noteToUpdate = {
      ...finalFormData,
      clientContact: finalFormData.clientContact || '',
      clientId: clientId as string,
      paymentDate: Timestamp.fromDate(finalFormData.paymentDate),
      value: finalFormData.totalValue,
      numberOfInstallments: finalFormData.installments,
      productServiceReference: finalFormData.productReference,
      header: finalFormData.header || '',
      creditorAddress: finalFormData.creditorAddress || '',
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

  if (isNoteLoading || isClientLoading || areSettingsLoading) {
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
              EDITAR NOTA PROMISSÓRIA {note.noteNumber ? `(Nº ${note.noteNumber})` : ''}
            </h1>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              Altere os detalhes da nota promissória para {client.name}.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            <div className="lg:col-span-2">
              {formData ? (
                 <PromissoryNoteForm onGenerate={handleUpdate} client={client} initialData={formData} settings={settings || undefined} isEditing />
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
             <div className="lg:col-span-3 space-y-8">
              {formData ? (
                <>
                  <PromissoryNoteDisplay data={formData} />
                  <CarneDisplay data={formData} />
                </>
              ) : (
                <Card className="h-full min-h-[500px] flex items-center justify-center border-dashed">
                  <CardContent className="text-center p-8">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      A visualização do documento aparecerá aqui.
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

    