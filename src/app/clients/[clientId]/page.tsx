'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import type { Client, PromissoryNote, PromissoryNoteData } from '@/types';
import { ProtectedRoute } from '@/firebase/auth/use-user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader, ArrowLeft, Plus, FileText, Trash2, MoreHorizontal, Edit } from 'lucide-react';
import { PromissoryNoteDisplay } from '@/components/promissory-note-display';
import { CarneDisplay } from '@/components/carne-display';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';


function ClientDetailPage() {
  const { clientId } = useParams();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [selectedNote, setSelectedNote] = useState<PromissoryNoteData | null>(null);

  const clientDocRef = useMemoFirebase(() => 
    user ? doc(firestore, 'users', user.uid, 'clients', clientId as string) : null
  , [firestore, user, clientId]);
  const { data: client, isLoading: isClientLoading } = useDoc<Client>(clientDocRef);

  const notesCollectionRef = useMemoFirebase(() => 
    user ? collection(firestore, 'users', user.uid, 'clients', clientId as string, 'promissoryNotes') : null
  , [firestore, user, clientId]);
  const { data: notes, isLoading: areNotesLoading } = useCollection<PromissoryNote>(notesCollectionRef);

  const handleSelectNote = (note: PromissoryNote) => {
    setSelectedNote({
      clientName: note.clientName,
      clientAddress: note.clientAddress,
      clientCpf: note.clientCpf,
      creditorName: note.creditorName,
      creditorCpf: note.creditorCpf,
      paymentDate: note.paymentDate.toDate(),
      totalValue: note.value,
      installments: note.numberOfInstallments,
      productReference: note.productServiceReference,
      noteNumber: note.noteNumber,
      paymentType: note.paymentType || 'a-prazo',
      hasDownPayment: note.hasDownPayment || false,
      downPaymentValue: note.downPaymentValue || 0,
      latePaymentClause: note.latePaymentClause || '',
    });
  };

  const handleDeleteNote = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if (!user || !noteId) return;
    const noteDocRef = doc(firestore, 'users', user.uid, 'clients', clientId as string, 'promissoryNotes', noteId);
    deleteDocumentNonBlocking(noteDocRef);
    toast({
      title: 'Nota excluída',
      description: 'A nota promissória foi removida.',
    });
    if (selectedNote && selectedNote.noteNumber === notes?.find(n => n.id === noteId)?.noteNumber) {
      setSelectedNote(null);
    }
  };

  const handleEditNote = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    router.push(`/clients/${clientId}/edit-note/${noteId}`);
  };

  if (isClientLoading || areNotesLoading) {
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
              notes.map((note) => (
                <Card
                  key={note.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${selectedNote && selectedNote.noteNumber === note.noteNumber ? 'border-primary' : ''}`}
                  onClick={() => handleSelectNote(note)}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-md font-medium">
                      Nota #{note.noteNumber}
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => handleEditNote(e, note.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleDeleteNote(e, note.id)} className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                     <p className="text-sm text-muted-foreground">
                      {note.productServiceReference}
                    </p>
                    <p className="text-sm font-bold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(note.value)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Vencimento inicial: {format(note.paymentDate.toDate(), 'dd/MM/yyyy')}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">Nenhuma nota encontrada para este cliente.</p>
            )}
          </div>
          <div className="lg:col-span-3 space-y-8">
            {selectedNote ? (
              <>
                <PromissoryNoteDisplay data={selectedNote} />
                <CarneDisplay data={selectedNote} />
              </>
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
