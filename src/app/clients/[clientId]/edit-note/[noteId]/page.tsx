
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { Client, PromissoryNote, PromissoryNoteData, UserSettings, Payment } from '@/types';
import { ProtectedRoute } from '@/firebase/auth/use-user';
import { PromissoryNoteForm } from '@/components/promissory-note-form';
import { Card, CardContent } from '@/components/ui/card';
import { Loader, ArrowLeft, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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

  const paymentsQuery = useMemoFirebase(() =>
    noteDocRef ? query(collection(noteDocRef, 'payments')) : null,
    [noteDocRef]
  );
  const { data: payments, isLoading: arePaymentsLoading } = useCollection<Payment>(paymentsQuery);


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
        firstInstallmentDate: note.firstInstallmentDate ? note.firstInstallmentDate.toDate() : undefined,
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

  const handleUpdate = (updatedFormData: PromissoryNoteData) => {
    if (!user || !note || !noteDocRef) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Usuário ou nota não encontrada.',
      });
      return;
    }
    
    const finalFormData = { ...updatedFormData, noteNumber: note.noteNumber };
    setFormData(finalFormData);

    const noteToUpdate = {
      ...finalFormData,
      clientContact: finalFormData.clientContact || '',
      clientId: clientId as string,
      paymentDate: Timestamp.fromDate(finalFormData.paymentDate),
      firstInstallmentDate: finalFormData.firstInstallmentDate ? Timestamp.fromDate(finalFormData.firstInstallmentDate) : null,
      value: finalFormData.totalValue,
      numberOfInstallments: finalFormData.installments,
      productServiceReference: finalFormData.productReference,
      header: finalFormData.header || '',
      creditorAddress: finalFormData.creditorAddress || '',
    };
    
    delete (noteToUpdate as any).totalValue;
    delete (noteToUpdate as any).installments;
    delete (noteToUpdate as any).productReference;
    
    setDocumentNonBlocking(noteDocRef, noteToUpdate, { merge: true });

    toast({
      title: 'Nota Atualizada!',
      description: 'As alterações foram salvas com sucesso.',
      className: 'bg-accent text-accent-foreground',
    });

    setTimeout(() => {
        router.push(`/clients/${clientId}`);
    }, 1500);
  };
  
    const handlePaymentStatusChange = (isPaid: boolean, installmentNumber: number, value: number, isDownPayment: boolean) => {
     if (!user || !note) return;

     const paymentsRef = collection(firestore, 'users', user.uid, 'clients', clientId as string, 'promissoryNotes', note.id, 'payments');

     if (isPaid) {
        const paymentData: Omit<Payment, 'id'> = {
            promissoryNoteId: note.id,
            paymentDate: new Date(),
            amount: value,
            installmentNumber: installmentNumber,
            isDownPayment: isDownPayment
        };
        addDocumentNonBlocking(paymentsRef, paymentData);
        toast({
            title: `Pagamento Confirmado`,
            description: `${installmentNumber === 0 ? 'Entrada' : `Parcela ${installmentNumber}`} marcada como paga.`,
            className: 'bg-green-600 text-white',
        });
     } else {
        const q = query(paymentsRef, where("installmentNumber", "==", installmentNumber));
        getDocs(q).then(querySnapshot => {
          querySnapshot.forEach((docSnap) => {
              deleteDocumentNonBlocking(docSnap.ref);
          });
          toast({
              title: `Pagamento Estornado`,
              description: `O status da parcela voltou para pendente.`,
              variant: 'destructive',
          });
        });
     }
  };


  if (isNoteLoading || isClientLoading || areSettingsLoading || arePaymentsLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  if (!note || !client) {
    return <div className="flex h-screen items-center justify-center">Nota ou cliente não encontrado.</div>;
  }

  return (
    <ProtectedRoute>
      <main className="min-h-full bg-background">
        <div className="container mx-auto px-4 py-8 md:py-12">
            <Button variant="ghost" onClick={() => router.push(`/clients/${clientId}`)} className="mb-4 hover:bg-secondary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para {client.name}
            </Button>
          <header className="mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-primary">
              EDITAR NOTA PROMISSÓRIA {note.noteNumber ? `(Nº ${note.noteNumber})` : ''}
            </h1>
            <p className="text-muted-foreground mt-1">
              Altere os detalhes da nota para {client.name}.
            </p>
          </header>

          <div className="flex flex-col gap-10">
            <div>
              {formData ? (
                 <PromissoryNoteForm onGenerate={handleUpdate} client={client} initialData={formData} settings={settings || undefined} isEditing />
              ) : (
                <Card className="h-[400px] flex items-center justify-center border-dashed border-2">
                    <CardContent className="text-center p-8">
                        <Loader className="mx-auto h-10 w-10 text-muted-foreground animate-spin" />
                        <p className="mt-4 text-sm text-muted-foreground">
                        Carregando dados da nota...
                        </p>
                    </CardContent>
                </Card>
              )}
            </div>
             <div className="space-y-10">
              {formData ? (
                <>
                  <PromissoryNoteDisplay data={formData} />
                  <CarneDisplay 
                    data={formData} 
                    payments={payments || []}
                    onPaymentStatusChange={handlePaymentStatusChange}
                   />
                </>
              ) : (
                <Card className="h-[400px] flex items-center justify-center border-dashed border-2">
                  <CardContent className="text-center p-8">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
                    <p className="mt-4 text-sm text-muted-foreground font-medium">
                      Aguardando carregamento...
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
