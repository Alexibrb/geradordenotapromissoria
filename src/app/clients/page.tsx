'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, UserPlus, Loader, User as UserIcon, MoreHorizontal, Trash2, LogOut, Edit, Settings } from 'lucide-react';
import { ProtectedRoute, useUser } from '@/firebase/auth/use-user';
import { useCollection, useDoc, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import type { Client, UserSettings } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
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
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useRouter } from 'next/navigation';


function ClientsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const clientsCollection = useMemoFirebase(() => 
    user ? collection(firestore, 'users', user.uid, 'clients') : null
  , [firestore, user]);
  const { data: clients, isLoading } = useCollection<Client>(clientsCollection);

  const settingsDocRef = useMemoFirebase(() =>
    user ? doc(firestore, 'users', user.uid, 'settings', 'appSettings') : null
  , [firestore, user]);
  const { data: settings } = useDoc<UserSettings>(settingsDocRef);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);

  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientCpf, setClientCpf] = useState('');
  const [clientContact, setClientContact] = useState('');

  const [settingsHeader, setSettingsHeader] = useState('');
  const [settingsCreditorName, setSettingsCreditorName] = useState('');
  const [settingsCreditorCpf, setSettingsCreditorCpf] = useState('');

  useEffect(() => {
    if (settings) {
      setSettingsHeader(settings.header || '');
      setSettingsCreditorName(settings.creditorName || '');
      setSettingsCreditorCpf(settings.creditorCpf || '');
    }
  }, [settings]);


  const resetForm = () => {
    setClientName('');
    setClientAddress('');
    setClientCpf('');
    setClientContact('');
    setCurrentClient(null);
  };

  const handleAddClient = async () => {
    if (!user || !clientsCollection) return;
    if (clientName.trim() === '' || clientAddress.trim() === '' || clientCpf.trim() === '') {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Nome, endereço e CPF do cliente são obrigatórios.',
      });
      return;
    }

    const clientData = {
      name: clientName,
      address: clientAddress,
      cpf: clientCpf,
      contactInformation: clientContact,
    };
    
    addDocumentNonBlocking(clientsCollection, clientData);

    toast({
      title: 'Sucesso!',
      description: 'Novo cliente adicionado.',
      className: 'bg-accent text-accent-foreground',
    });

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditClient = (client: Client) => {
    setCurrentClient(client);
    setClientName(client.name);
    setClientAddress(client.address);
    setClientCpf(client.cpf);
    setClientContact(client.contactInformation || '');
    setIsEditDialogOpen(true);
  };

  const handleUpdateClient = async () => {
    if (!user || !currentClient) return;
     if (clientName.trim() === '' || clientAddress.trim() === '' || clientCpf.trim() === '') {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Nome, endereço e CPF do cliente são obrigatórios.',
      });
      return;
    }

    const clientDocRef = doc(firestore, 'users', user.uid, 'clients', currentClient.id);
    const updatedData = {
      name: clientName,
      address: clientAddress,
      cpf: clientCpf,
      contactInformation: clientContact,
    };
    
    setDocumentNonBlocking(clientDocRef, updatedData, { merge: true });

    toast({
      title: 'Sucesso!',
      description: 'Cliente atualizado.',
      className: 'bg-accent text-accent-foreground',
    });

    resetForm();
    setIsEditDialogOpen(false);
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!user) return;
    // TODO: Implement cascading delete for subcollections if needed
    const clientDocRef = doc(firestore, 'users', user.uid, 'clients', clientId);
    deleteDocumentNonBlocking(clientDocRef);
    toast({
      title: 'Cliente excluído',
      description: 'O cliente e suas notas foram removidos.',
    });
  };

  const handleSaveSettings = async () => {
    if (!user || !settingsDocRef) return;
    const settingsData = {
      header: settingsHeader,
      creditorName: settingsCreditorName,
      creditorCpf: settingsCreditorCpf,
    };
    setDocumentNonBlocking(settingsDocRef, settingsData, { merge: true });
    toast({
      title: 'Sucesso!',
      description: 'Configurações salvas.',
      className: 'bg-accent text-accent-foreground',
    });
    setIsSettingsDialogOpen(false);
  };
  
  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Meus Clientes</h1>
          <div className="flex items-center gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) resetForm(); }}>
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
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="João da Silva"
                    />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="client-cpf">CPF</Label>
                    <Input
                      id="client-cpf"
                      value={clientCpf}
                      onChange={(e) => setClientCpf(e.target.value)}
                      placeholder="123.456.789-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-address">Endereço</Label>
                    <Input
                      id="client-address"
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      placeholder="Rua Exemplo, 123"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-contact">Contato (Email/Telefone)</Label>
                    <Input
                      id="client-contact"
                      value={clientContact}
                      onChange={(e) => setClientContact(e.target.value)}
                      placeholder="contato@email.com"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => { setIsAddDialogOpen(false); resetForm(); }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleAddClient}>Salvar Cliente</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Settings Dialog */}
            <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <Settings className="mr-2" />
                        Configurações
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configurações da Nota</DialogTitle>
                        <DialogDescription>
                            Defina as informações padrão para o credor e o cabeçalho das notas.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="settings-header">Cabeçalho (Opcional)</Label>
                            <Input id="settings-header" value={settingsHeader} onChange={(e) => setSettingsHeader(e.target.value)} placeholder="Nome da sua empresa ou serviço" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="settings-creditor-name">Nome do Credor</Label>
                            <Input id="settings-creditor-name" value={settingsCreditorName} onChange={(e) => setSettingsCreditorName(e.target.value)} placeholder="Sua Empresa LTDA" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="settings-creditor-cpf">CPF/CNPJ do Credor</Label>
                            <Input id="settings-creditor-cpf" value={settingsCreditorCpf} onChange={(e) => setSettingsCreditorCpf(e.target.value)} placeholder="00.000.000/0001-00" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveSettings}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Button onClick={handleLogout} variant="outline">
              <LogOut className="mr-2" />
              Sair
            </Button>
          </div>
        </header>

        {/* Edit Client Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
              <DialogDescription>
                Atualize as informações do cliente.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="edit-client-name">Nome do Cliente</Label>
                    <Input id="edit-client-name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="edit-client-cpf">CPF</Label>
                    <Input id="edit-client-cpf" value={clientCpf} onChange={(e) => setClientCpf(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="edit-client-address">Endereço</Label>
                    <Input id="edit-client-address" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="edit-client-contact">Contato</Label>
                    <Input id="edit-client-contact" value={clientContact} onChange={(e) => setClientContact(e.target.value)} />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>Cancelar</Button>
                <Button onClick={handleUpdateClient}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {isLoading ? (
          <div className="flex justify-center">
            <Loader className="h-8 w-8 animate-spin" />
          </div>
        ) : clients && clients.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {clients.map((client) => (
              <Card key={client.id} className="hover:shadow-lg transition-shadow flex flex-col">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-medium">
                      {client.name}
                    </CardTitle>
                  </div>
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 flex-shrink-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                       <DropdownMenuItem onClick={() => handleEditClient(client)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteClient(client.id)} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground truncate">{client.address}</p>
                    <p className="text-sm text-muted-foreground truncate">CPF: {client.cpf}</p>
                  </div>
                  <Link href={`/clients/${client.id}`} passHref>
                    <Button variant="link" className="px-0 pt-4 mt-auto">
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
             <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) resetForm(); }}>
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

    