'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, UserPlus, Loader, User as UserIcon, MoreHorizontal, Trash2, LogOut, Edit, Settings, Search, ShieldCheck, Gem } from 'lucide-react';
import { ProtectedRoute, useUser } from '@/firebase/auth/use-user';
import { useCollection, useDoc, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { collection, doc, collectionGroup, query, where, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import type { Client, UserSettings, PromissoryNote, Payment, AppUser } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
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
import { DashboardStats } from '@/components/dashboard-stats';
import { DateRange } from 'react-day-picker';
import { startOfDay, endOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';


function ClientsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile } = useDoc<AppUser>(userProfileRef);

  const clientsCollection = useMemoFirebase(() => 
    user ? collection(firestore, 'users', user.uid, 'clients') : null
  , [firestore, user]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsCollection);

  const [allNotes, setAllNotes] = useState<PromissoryNote[] | null>(null);
  const [allPayments, setAllPayments] = useState<Payment[] | null>(null);
  const [isLoadingAggregates, setIsLoadingAggregates] = useState(true);

  useEffect(() => {
    if (!user || isLoadingClients) {
      return;
    }

    const fetchAggregates = async () => {
      setIsLoadingAggregates(true);
      if (!clients || clients.length === 0) {
        setAllNotes([]);
        setAllPayments([]);
        setIsLoadingAggregates(false);
        return;
      }

      try {
        const notesPromises = clients.map(client =>
          getDocs(collection(firestore, 'users', user.uid, 'clients', client.id, 'promissoryNotes'))
        );
        const notesSnapshots = await Promise.all(notesPromises);
        const fetchedNotes = notesSnapshots.flatMap(snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromissoryNote)));
        setAllNotes(fetchedNotes);

        if (fetchedNotes.length > 0) {
          const paymentsPromises = fetchedNotes.map(note =>
            getDocs(collection(firestore, 'users', user.uid, 'clients', note.clientId, 'promissoryNotes', note.id, 'payments'))
          );
          const paymentsSnapshots = await Promise.all(paymentsPromises);
          const fetchedPayments = paymentsSnapshots.flatMap(snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment)));
          setAllPayments(fetchedPayments);
        } else {
          setAllPayments([]);
        }
      } catch (error) {
        console.error("Error fetching aggregated data:", error);
        setAllNotes([]);
        setAllPayments([]);
      } finally {
        setIsLoadingAggregates(false);
      }
    };

    fetchAggregates();
  }, [user, firestore, clients, isLoadingClients]);


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
  const [settingsCreditorAddress, setSettingsCreditorAddress] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClients, setFilteredClients] = useState<Client[] | null>(null);

  // Dashboard state
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [filteredNotes, setFilteredNotes] = useState<PromissoryNote[] | null>(null);
  const [filteredPayments, setFilteredPayments] = useState<Payment[] | null>(null);

  useEffect(() => {
    if (settings) {
      setSettingsHeader(settings.header || '');
      setSettingsCreditorName(settings.creditorName || '');
      setSettingsCreditorCpf(settings.creditorCpf || '');
      setSettingsCreditorAddress(settings.creditorAddress || '');
    }
  }, [settings]);
  
  useEffect(() => {
    // Initially set filtered clients to the full list
    if (clients) {
        setFilteredClients(clients);
    }
  }, [clients]);

  useEffect(() => {
    if (!clients) return;
    const lowercasedFilter = searchTerm.toLowerCase().trim();
      if (!lowercasedFilter) {
        setFilteredClients(clients);
        return;
      }
      const filteredData = clients.filter(client =>
        client.name.toLowerCase().includes(lowercasedFilter) ||
        client.cpf.replace(/[.\-]/g, '').includes(lowercasedFilter.replace(/[.\-]/g, ''))
      );
      setFilteredClients(filteredData);
  }, [searchTerm, clients]);

  useEffect(() => {
    const finalNotes = allNotes || [];
    const finalPayments = allPayments || [];

    const from = dateRange?.from ? startOfDay(dateRange.from) : null;
    const to = dateRange?.to ? endOfDay(dateRange.to) : null;

    if (!from && !to) {
        setFilteredNotes(finalNotes);
        setFilteredPayments(finalPayments);
        return;
    }
    
    // Filter notes based on their creation date (paymentDate)
    const notesInRange = finalNotes.filter(note => {
      const noteDate = note.paymentDate.toDate();
      if (from && to) return noteDate >= from && noteDate <= to;
      if (from) return noteDate >= from;
      if (to) return noteDate <= to;
      return true;
    });
    setFilteredNotes(notesInRange);

    // Filter payments based on their payment date
    const paymentsInRange = finalPayments.filter(payment => {
       const paymentDate = (payment.paymentDate as any).toDate();
       if (from && to) return paymentDate >= from && paymentDate <= to;
       if (from) return paymentDate >= from;
       if (to) return paymentDate <= to;
       return true;
    });
    setFilteredPayments(paymentsInRange);
    
  }, [dateRange, allNotes, allPayments]);


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
    // Before deleting the client, delete all their promissory notes and payments
    const notesSnapshot = await getDocs(query(collection(firestore, 'users', user.uid, 'clients', clientId, 'promissoryNotes')));
    for (const noteDoc of notesSnapshot.docs) {
      const paymentsSnapshot = await getDocs(collection(noteDoc.ref, 'payments'));
      paymentsSnapshot.forEach(paymentDoc => {
        deleteDocumentNonBlocking(paymentDoc.ref);
      });
      deleteDocumentNonBlocking(noteDoc.ref);
    }
    
    const clientDocRef = doc(firestore, 'users', user.uid, 'clients', clientId);
    deleteDocumentNonBlocking(clientDocRef);

    toast({
      title: 'Cliente excluído',
      description: 'O cliente e todas as suas notas foram removidos.',
    });
  };

  const handleSaveSettings = async () => {
    if (!user || !settingsDocRef) return;
    const settingsData = {
      header: settingsHeader,
      creditorName: settingsCreditorName,
      creditorCpf: settingsCreditorCpf,
      creditorAddress: settingsCreditorAddress,
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
  
  const isLoading = isLoadingClients || isLoadingAggregates;

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <header className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4 md:gap-0">
          <h1 className="text-3xl font-bold tracking-tight">Meus Clientes</h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
             {userProfile?.plan && (
                <div className="flex items-center gap-2">
                    <Gem className={`h-5 w-5 ${userProfile.plan === 'pro' ? 'text-blue-500' : 'text-gray-400'}`} />
                    <Badge variant={userProfile.plan === 'pro' ? 'default' : 'secondary'} className="capitalize">
                        Plano {userProfile.plan}
                    </Badge>
                </div>
            )}
             {userProfile?.role === 'admin' && (
              <Button onClick={() => router.push('/admin')} variant="secondary">
                <ShieldCheck className="mr-2" />
                Admin
              </Button>
            )}
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
                            <Label htmlFor="settings-creditor-address">Endereço do Credor</Label>
                            <Input id="settings-creditor-address" value={settingsCreditorAddress} onChange={(e) => setSettingsCreditorAddress(e.target.value)} placeholder="Endereço da sua empresa" />
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

        <div className="mb-8">
            <DashboardStats 
                notes={filteredNotes || []} 
                payments={filteredPayments || []} 
                dateRange={dateRange}
                onDateChange={setDateRange}
                isLoading={isLoading}
            />
        </div>
        
        <div className="mb-8">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Buscar cliente por nome ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                />
            </div>
        </div>

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
        ) : filteredClients && filteredClients.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredClients.map((client) => (
              <Card key={client.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                    <div className='flex-1 min-w-[200px]'>
                        <Link href={`/clients/${client.id}`} className="font-semibold truncate hover:underline">{client.name}</Link>
                        <p className="text-sm text-muted-foreground truncate">CPF: {client.cpf}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                         <Link href={`/clients/${client.id}`} passHref>
                            <Button variant="outline" size="sm">
                              Ver Notas
                            </Button>
                          </Link>
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
                    </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
             <UserIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">{clients && clients.length > 0 ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {clients && clients.length > 0 ? 'Tente uma busca diferente ou adicione um novo cliente.' : 'Comece adicionando seu primeiro cliente para criar notas promissórias.'}
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

    