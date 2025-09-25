'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, UserPlus, Loader, User as UserIcon, MoreHorizontal, Trash2 } from 'lucide-react';
import { ProtectedRoute, useUser } from '@/firebase/auth/use-user';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import type { Client } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

function ClientsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const clientsCollection = useMemoFirebase(() => 
    user ? collection(firestore, 'users', user.uid, 'clients') : null
  , [firestore, user]);
  
  const { data: clients, isLoading } = useCollection<Client>(clientsCollection);

  const [newClientName, setNewClientName] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [newClientContact, setNewClientContact] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddClient = async () => {
    if (!user) return;
    if (newClientName.trim() === '' || newClientAddress.trim() === '') {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Nome e endereço do cliente são obrigatórios.',
      });
      return;
    }

    const clientData = {
      name: newClientName,
      address: newClientAddress,
      contactInformation: newClientContact,
    };
    
    addDocumentNonBlocking(clientsCollection!, clientData);

    toast({
      title: 'Sucesso!',
      description: 'Novo cliente adicionado.',
      className: 'bg-accent text-accent-foreground',
    });

    setNewClientName('');
    setNewClientAddress('');
    setNewClientContact('');
    setIsDialogOpen(false);
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!user) return;
    const clientDocRef = doc(firestore, 'users', user.uid, 'clients', clientId);
    deleteDocumentNonBlocking(clientDocRef);
    toast({
      title: 'Cliente excluído',
      description: 'O cliente e suas notas foram removidos.',
    });
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Meus Clientes</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2" />
                Adicionar Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                <DialogDescription>
                  Insira as informações do novo cliente.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="client-name">Nome do Cliente</Label>
                  <Input
                    id="client-name"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="João da Silva"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-address">Endereço</Label>
                  <Input
                    id="client-address"
                    value={newClientAddress}
                    onChange={(e) => setNewClientAddress(e.target.value)}
                    placeholder="Rua Exemplo, 123"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-contact">Contato (Email/Telefone)</Label>
                  <Input
                    id="client-contact"
                    value={newClientContact}
                    onChange={(e) => setNewClientContact(e.target.value)}
                    placeholder="contato@email.com"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleAddClient}>Salvar Cliente</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        {isLoading ? (
          <div className="flex justify-center">
            <Loader className="h-8 w-8 animate-spin" />
          </div>
        ) : clients && clients.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {clients.map((client) => (
              <Card key={client.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium">
                    {client.name}
                  </CardTitle>
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDeleteClient(client.id)} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground truncate">{client.address}</p>
                  <Link href={`/clients/${client.id}`} passHref>
                    <Button variant="link" className="px-0 pt-4">
                      Ver Notas Promissórias
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
             <UserIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Nenhum cliente encontrado</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Comece adicionando seu primeiro cliente para criar notas promissórias.
            </p>
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="mt-4">
                        <UserPlus className="mr-2" />
                        Adicionar Cliente
                    </Button>
                </DialogTrigger>
             </Dialog>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

export default ClientsPage;
