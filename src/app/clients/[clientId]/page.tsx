
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { Client, PromissoryNote, Payment } from '@/types';
import { ProtectedRoute } from '@/firebase/auth/use-user';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader, ArrowLeft, Plus, FileText, Receipt, StickyNote } from 'lucide-react';
import { PromissoryNoteDisplay } from '@/components/promissory-note-display';
import { CarneDisplay } from '@/components/carne-display';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { PromissoryNoteCard } from '@/components/promissory-note-card';

function ClientDetailPage() {
  const { clientId } = useParams();
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [selectedNote, setSelectedNote] = useState<PromissoryNote | null>(null);
  const [activeView, setActiveView] = useState<'note' | 'slips'>('note');
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  const clientDocRef = useMemoFirebase(() => 
    user ? doc(firestore, 'users', user.uid, 'clients', clientId as string) : null
  , [firestore, user, clientId]);
  const { data: client, isLoading: isClientLoading } = useDoc<Client>(clientDocRef);

  const notesQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, 'users', user.uid, 'clients', clientId as string, 'promissoryNotes'), orderBy('paymentDate', 'desc')) : null
  , [firestore, user, clientId]);
  const { data: notes, isLoading: areNotesLoading } = useCollection<PromissoryNote>(notesQuery);

  useEffect(() => {
    if (!user || !notes) return;

    const fetchPayments = async () => {
        setLoadingPayments(true);
        const paymentsData: Payment[] = [];
        for (const note of notes) {
            const paymentsRef = collection(firestore, 'users', user.uid, 'clients', clientId as string, 'promissoryNotes', note.id, 'payments');
            const paymentsSnapshot = await getDocs(paymentsRef);
            paymentsSnapshot.forEach(doc => {
                paymentsData.push({ id: doc.id, ...doc.data() } as Payment);
            });
        }
        setAllPayments(paymentsData);
        setLoadingPayments(false);
    };

    fetchPayments();
  }, [user, firestore, notes, clientId]);

  const handleSelectNote = (note: PromissoryNote) => {
    setSelectedNote(note);
    setActiveView('note');
  };

  const handleDeleteNote = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if (!user || !noteId) return;

    if (userProfile?.plan === 'free') {
        toast({
            variant: 'destructive',
            title: 'Funcionalidade Pro',
            description: 'Faça upgrade para o plano Pro para excluir notas.',
        });
        router.push('/upgrade');
        return;
    }

    const noteDocRef = doc(firestore, 'users', user.uid, 'clients', clientId as string, 'promissoryNotes', noteId);
    const paymentsRef = collection(noteDocRef, 'payments');
    const paymentsSnapshot = await getDocs(paymentsRef);
    paymentsSnapshot.forEach((paymentDoc) => {
        deleteDocumentNonBlocking(paymentDoc.ref);
    });

    deleteDocumentNonBlocking(noteDocRef);

    toast({
      title: 'Nota excluída',
      description: 'A nota promissória e todos os seus pagamentos foram removidos.',
    });
    
    if (selectedNote && selectedNote.id === noteId) {
      setSelectedNote(null);
    }
  };

  const handleEditNote = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if (userProfile?.plan === 'free') {
        toast({
            variant: 'destructive',
            title: 'Funcionalidade Pro',
            description: 'Faça upgrade para o plano Pro para editar notas.',
        });
        router.push('/upgrade');
        return;
    }
    router.push(`/clients/${clientId}/edit-note/${noteId}`);
  };

  const handlePaymentStatusChange = (isPaid: boolean, installmentNumber: number, value: number, isDownPayment: boolean) => {
     if (!user || !selectedNote) return;

     const paymentsRef = collection(firestore, 'users', user.uid, 'clients', clientId as string, 'promissoryNotes', selectedNote.id, 'payments');

     if (isPaid) {
        const paymentData: Omit<Payment, 'id'> = {
            promissoryNoteId: selectedNote.id,
            paymentDate: new Date(),
            amount: value,
            installmentNumber: installmentNumber,
            isDownPayment: isDownPayment
        };
        
        addDocumentNonBlocking(paymentsRef, paymentData).then((docRef) => {
          if (docRef) {
             const newPayment = { id: docRef.id, ...paymentData } as Payment;
             setAllPayments(prev => [...prev, newPayment]);
          }
        });

        toast({
            title: `Confirmado: ${installmentNumber === 0 ? 'Entrada' : `Parcela ${installmentNumber}`} Paga`,
            description: `O pagamento de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} foi registrado.`,
            className: 'bg-green-600 text-white',
        });
     } else {
        const q = query(paymentsRef, where("installmentNumber", "==", installmentNumber));
        getDocs(q).then(querySnapshot => {
          querySnapshot.forEach((docSnap) => {
              deleteDocumentNonBlocking(docSnap.ref);
              setAllPayments(prev => prev.filter(p => p.id !== docSnap.id));
          });
          
          toast({
              title: `Pagamento Estornado`,
              description: `O status da ${installmentNumber === 0 ? 'Entrada' : `Parcela ${installmentNumber}`} voltou para pendente.`,
              variant: 'destructive',
          });
        });
     }
  };
  
  const getNoteData = (note: PromissoryNote | null) => {
    if (!note) return null;
    return {
        header: note.header,
        clientName: note.clientName,
        clientAddress: note.clientAddress,
        clientCpf: note.clientCpf,
        clientContact: note.clientContact,
        creditorName: note.creditorName,
        creditorCpf: note.creditorCpf,
        creditorAddress: note.creditorAddress,
        paymentDate: note.paymentDate.toDate(),
        firstInstallmentDate: note.firstInstallmentDate ? note.firstInstallmentDate.toDate() : undefined,
        totalValue: note.value,
        installments: note.numberOfInstallments,
        productReference: note.productServiceReference,
        noteNumber: note.noteNumber,
        paymentType: note.paymentType || 'a-prazo',
        hasDownPayment: note.hasDownPayment || false,
        downPaymentValue: note.downPaymentValue || 0,
        latePaymentClause: note.latePaymentClause || '',
    };
  }
  
  const handleAddNoteClick = () => {
    if (userProfile?.plan === 'free') {
      toast({
        variant: 'destructive',
        title: 'Funcionalidade Pro',
        description: 'Faça upgrade para o plano Pro para adicionar novas notas.',
      });
      router.push('/upgrade');
    } else {
      router.push(`/clients/${clientId}/add-note`);
    }
  };
  
  const selectedNoteData = getNoteData(selectedNote);
  const selectedNotePayments = selectedNote ? allPayments.filter(p => p.promissoryNoteId === selectedNote.id) : [];

  if (isClientLoading || areNotesLoading || loadingPayments) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex h-screen items-center justify-center text-center">
        <div>
            <h2 className="text-2xl font-bold">Cliente não encontrado</h2>
            <Button onClick={() => router.push('/clients')} className="mt-4">
                Voltar para Clientes
            </Button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.push('/clients')} className="mb-4 hover:bg-secondary">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Clientes
        </Button>

        <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">{client.name}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              {client.address}
            </p>
          </div>
          <Button className="mt-4 md:mt-0 shadow-md" onClick={handleAddNoteClick}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Nota
          </Button>
        </header>

        <div className="flex flex-col gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-l-4 border-primary pl-3">Notas Promissórias</h2>
            {notes && notes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notes.map((note) => {
                const notePayments = allPayments.filter(p => p.promissoryNoteId === note.id);
                return (
                  <PromissoryNoteCard
                    key={note.id}
                    note={note}
                    payments={notePayments}
                    isSelected={selectedNote?.id === note.id}
                    onSelect={() => handleSelectNote(note)}
                    onEdit={(e) => handleEditNote(e, note.id)}
                    onDelete={(e) => handleDeleteNote(e, note.id)}
                  />
                );
              })}
              </div>
            ) : (
              <div className="text-center py-10 bg-secondary/20 rounded-lg border-2 border-dashed">
                <p className="text-muted-foreground text-sm">Nenhuma nota encontrada para este cliente.</p>
              </div>
            )}
          </div>
          
          <div className="space-y-8">
            {selectedNoteData ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex gap-2 mb-6 p-1 bg-secondary rounded-lg w-fit mx-auto sm:mx-0">
                    <Button 
                      onClick={() => setActiveView('note')} 
                      variant={activeView === 'note' ? 'default' : 'ghost'} 
                      className="flex-1 sm:flex-none"
                    >
                        <StickyNote className="mr-2 h-4 w-4"/>
                        Nota Promissória
                    </Button>
                    <Button 
                      onClick={() => setActiveView('slips')} 
                      variant={activeView === 'slips' ? 'default' : 'ghost'} 
                      className="flex-1 sm:flex-none"
                    >
                        <Receipt className="mr-2 h-4 w-4"/>
                        Comprovantes
                    </Button>
                </div>
                {activeView === 'note' && (
                    <PromissoryNoteDisplay data={selectedNoteData} />
                )}
                {activeView === 'slips' && (
                    <CarneDisplay 
                        data={selectedNoteData} 
                        payments={selectedNotePayments}
                        onPaymentStatusChange={handlePaymentStatusChange}
                    />
                )}
              </div>
            ) : (
              <Card className="h-full min-h-[400px] flex items-center justify-center border-dashed border-2 bg-secondary/10">
                <CardContent className="text-center p-8">
                  <FileText className="mx-auto h-16 w-16 text-muted-foreground opacity-20" />
                  <p className="mt-4 text-sm text-muted-foreground font-medium">
                    Selecione uma nota acima para visualizar os detalhes e gerenciar pagamentos.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default ClientDetailPage;
