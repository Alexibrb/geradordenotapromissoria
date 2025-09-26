'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, getDocs, collectionGroup, orderBy } from 'firebase/firestore';
import type { Client, PromissoryNote, Payment } from '@/types';
import { ProtectedRoute } from '@/firebase/auth/use-user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader, ArrowLeft, Plus, FileText, Receipt, StickyNote } from 'lucide-react';
import { PromissoryNoteDisplay } from '@/components/promissory-note-display';
import { CarneDisplay } from '@/components/carne-display';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { PromissoryNoteCard } from '@/components/promissory-note-card';

function ClientDetailPage() {
  const { clientId } = useParams();
  const { user } = useUser();
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
        if (notes.length > 0) {
            const noteIds = notes.map(n => n.id);
            // Firestore 'in' query is limited to 30 items. If more notes, we need multiple queries.
            const chunks = [];
            for (let i = 0; i < noteIds.length; i += 30) {
                chunks.push(noteIds.slice(i, i + 30));
            }

            for (const chunk of chunks) {
                 const paymentsQuery = query(
                    collectionGroup(firestore, 'payments'),
                    where('promissoryNoteId', 'in', chunk)
                );
                const paymentsSnapshot = await getDocs(paymentsQuery);
                paymentsSnapshot.forEach(doc => {
                    paymentsData.push({ id: doc.id, ...doc.data() } as Payment);
                });
            }
        }
        setAllPayments(paymentsData);
        setLoadingPayments(false);
    };

    fetchPayments();
  }, [user, firestore, notes]);

  const handleSelectNote = (note: PromissoryNote) => {
    setSelectedNote(note);
    setActiveView('note'); // Reset to note view when a new note is selected
  };

  const handleDeleteNote = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if (!user || !noteId) return;

    const noteDocRef = doc(firestore, 'users', user.uid, 'clients', clientId as string, 'promissoryNotes', noteId);
    
    // Delete associated payments first
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
    router.push(`/clients/${clientId}/edit-note/${noteId}`);
  };

  const handlePaymentStatusChange = async (isPaid: boolean, installmentNumber: number, value: number, isDownPayment: boolean) => {
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
        const newPayment = await addDoc(paymentsRef, paymentData);
        setAllPayments([...allPayments, { id: newPayment.id, ...paymentData }]);
         toast({
            title: `Parcela ${installmentNumber === 0 ? 'de Entrada' : installmentNumber} Paga!`,
            description: 'O pagamento foi registrado com sucesso.',
            className: 'bg-accent text-accent-foreground',
        });
     } else {
        // Find and delete the payment document
        const q = query(paymentsRef, where("installmentNumber", "==", installmentNumber));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            deleteDocumentNonBlocking(doc.ref);
            setAllPayments(allPayments.filter(p => p.id !== doc.id));
             toast({
                title: `Pagamento da Parcela ${installmentNumber === 0 ? 'de Entrada' : installmentNumber} Revertido`,
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
  
  const selectedNoteData = getNoteData(selectedNote);
  const selectedNotePayments = selectedNote ? allPayments.filter(p => p.promissoryNoteId === selectedNote.id) : [];

  if (isClientLoading || areNotesLoading || loadingPayments) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="animate-spin" />
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
        <Button variant="ghost" onClick={() => router.push('/clients')} className="mb-4">
          <ArrowLeft className="mr-2" />
          Voltar para Clientes
        </Button>

        <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
            <p className="text-muted-foreground">{client.address}</p>
          </div>
          <Link href={`/clients/${clientId}/add-note`} passHref>
            <Button className="mt-4 md:mt-0">
              <Plus className="mr-2" />
              Adicionar Nota
            </Button>
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold">Notas Promissórias</h2>
            {notes && notes.length > 0 ? (
              notes.map((note) => {
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
              })
            ) : (
              <p className="text-muted-foreground text-sm">Nenhuma nota encontrada para este cliente.</p>
            )}
          </div>
          <div className="lg:col-span-3 space-y-8">
            {selectedNoteData ? (
              <div>
                <div className="flex gap-2 mb-4">
                    <Button onClick={() => setActiveView('note')} variant={activeView === 'note' ? 'secondary' : 'outline'} className="w-full">
                        <StickyNote className="mr-2"/>
                        Ver Nota Promissória
                    </Button>
                    <Button onClick={() => setActiveView('slips')} variant={activeView === 'slips' ? 'secondary' : 'outline'} className="w-full">
                        <Receipt className="mr-2"/>
                        Ver Comprovantes
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
              <Card className="h-full min-h-[500px] flex items-center justify-center border-dashed">
                <CardContent className="text-center p-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Selecione uma nota para visualizar os detalhes ou adicione uma nova.
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
