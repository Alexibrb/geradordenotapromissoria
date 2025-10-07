'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, Timestamp } from 'firebase/firestore';
import type { AppUser } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from '@/components/ui/badge';
import { Loader, Users, Trash2, Calendar as CalendarIcon, Gem, Fingerprint, ShieldCheck } from 'lucide-react';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';

function AdminUsersPage() {
  const firestore = useFirestore();
  const { user: adminUser, userProfile } = useUser();
  const { toast } = useToast();
  
  const [cpfFilter, setCpfFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('all');

  const usersQuery = useMemoFirebase(() => 
    userProfile?.role === 'admin' ? collection(firestore, 'users') : null, 
    [firestore, userProfile]
  );
  const { data: users, isLoading: areUsersLoading } = useCollection<AppUser>(usersQuery);

  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  const [planExpirationDate, setPlanExpirationDate] = useState<Date | undefined>();

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user => {
      const cpfMatch = cpfFilter ? user.cpf?.replace(/[.\-]/g, '').includes(cpfFilter.replace(/[.\-]/g, '')) : true;
      const planMatch = planFilter !== 'all' ? user.plan === planFilter : true;
      return cpfMatch && planMatch;
    });
  }, [users, cpfFilter, planFilter]);


  const planCounts = useMemo(() => {
    if (!users) {
      return { proCount: 0, freeCount: 0 };
    }
    const nonAdminUsers = users.filter(user => user.role !== 'admin');
    return {
      proCount: nonAdminUsers.filter(user => user.plan === 'pro').length,
      freeCount: nonAdminUsers.filter(user => user.plan === 'free').length,
    };
  }, [users]);

  const handlePlanChange = (userId: string, newPlan: AppUser['plan']) => {
    if (userId === adminUser?.uid) {
        toast({
            variant: "destructive",
            title: "Ação não permitida",
            description: "O administrador não pode alterar o próprio plano.",
        });
        return;
    }
    const userDocRef = doc(firestore, 'users', userId);
    const dataToUpdate: { plan: AppUser['plan'], planExpirationDate?: Timestamp | null } = { plan: newPlan };

    if (newPlan === 'pro') {
      const expiration = planExpirationDate || addDays(new Date(), 30);
      dataToUpdate.planExpirationDate = Timestamp.fromDate(expiration);
    } else {
      // If downgraded to free, remove the expiration date
      dataToUpdate.planExpirationDate = null;
    }

    setDocumentNonBlocking(userDocRef, dataToUpdate, { merge: true });
    
    toast({
      title: 'Plano Atualizado',
      description: `O plano do usuário foi alterado para ${newPlan}.`,
      className: 'bg-accent text-accent-foreground',
    });

    // Reset date picker for next use
    setPlanExpirationDate(undefined);
  };

  const openDeleteDialog = (user: AppUser) => {
    setUserToDelete(user);
  }

  const handleDeleteUser = async () => {
    if (!userToDelete || !adminUser) return;

    if (userToDelete.id === adminUser.uid) {
        toast({
            variant: "destructive",
            title: "Ação não permitida",
            description: "O administrador não pode excluir a própria conta.",
        });
        setUserToDelete(null);
        return;
    }

    try {
        const userDocRef = doc(firestore, 'users', userToDelete.id);
        deleteDocumentNonBlocking(userDocRef);

        toast({
            title: "Usuário Excluído",
            description: `O registro do usuário ${userToDelete.email} foi removido.`,
        });

    } catch (error) {
        console.error("Error deleting user: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao Excluir",
            description: "Não foi possível remover o registro do usuário.",
        });
    } finally {
        setUserToDelete(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-10">
        <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-left">
          Gerenciamento de Usuários
        </h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-left">
          Gerencie os planos e permissões dos usuários do sistema.
        </p>
      </header>
        
      {areUsersLoading ? (
        <div className="flex justify-center mb-8">
          <Loader className="animate-spin" />
        </div>
      ) : (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Resumo de Planos</CardTitle>
            <CardDescription>Contagem de usuários por plano (excluindo administradores).</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-secondary/50 p-4 rounded-lg flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Gem className="h-6 w-6 text-blue-500"/>
                  </div>
                  <div>
                      <p className="text-sm text-muted-foreground font-semibold">Usuários Pro</p>
                      <p className="text-2xl font-bold">{planCounts.proCount}</p>
                  </div>
              </div>
              <div className="bg-secondary/50 p-4 rounded-lg flex items-center gap-4">
                  <div className="bg-gray-100 p-3 rounded-full">
                    <Users className="h-6 w-6 text-gray-500"/>
                  </div>
                  <div>
                      <p className="text-sm text-muted-foreground font-semibold">Usuários Free</p>
                      <p className="text-2xl font-bold">{planCounts.freeCount}</p>
                  </div>
              </div>
          </CardContent>
        </Card>
      )}


      {areUsersLoading ? (
        <div className="flex justify-center">
          <Loader className="animate-spin" />
        </div>
      ) : (
        <Card>
           <CardHeader>
            <CardTitle>Lista de Usuários</CardTitle>
            <CardDescription>Visualize e gerencie todos os usuários cadastrados.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                <Input
                    placeholder="Filtrar por CPF..."
                    value={cpfFilter}
                    onChange={(e) => setCpfFilter(e.target.value)}
                    className="max-w-xs"
                />
                <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filtrar por plano" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Planos</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {filteredUsers && filteredUsers.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead className='text-center'>Alterar Plano</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                            <div className='flex flex-col gap-1.5'>
                                <div className='font-semibold'>{user.email}</div>
                                <div className='text-xs text-muted-foreground flex items-center gap-1'>
                                    <Fingerprint className="h-3 w-3"/>{user.cpf || 'N/A'}
                                </div>
                                 <Badge variant={user.role === 'admin' ? 'destructive' : 'outline'} className='gap-1 w-fit'>
                                    <ShieldCheck className='h-3 w-3'/>
                                    {user.role}
                                </Badge>
                            </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex flex-col gap-1'>
                            <Badge variant={user.plan === 'pro' ? 'default' : 'secondary'} className="flex items-center gap-1 w-fit">
                              <Gem className="h-3 w-3"/>{user.plan}
                            </Badge>
                             {user.plan === 'pro' && user.planExpirationDate && (
                              <Badge variant="outline" className="w-fit">
                                {`Expira: ${format(user.planExpirationDate.toDate(), 'dd/MM/yyyy')}`}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Select
                              value={user.plan}
                              onValueChange={(value) => handlePlanChange(user.id, value as AppUser['plan'])}
                              disabled={user.role === 'admin'}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Mudar plano" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="pro">Pro</SelectItem>
                              </SelectContent>
                            </Select>
                            {user.plan === 'free' && (
                               <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-[200px] justify-start text-left font-normal",
                                            !planExpirationDate && "text-muted-foreground"
                                        )}
                                        disabled={user.role === 'admin'}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {planExpirationDate ? format(planExpirationDate, "PPP", { locale: ptBR }) : <span>Data de Expiração</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={planExpirationDate}
                                        onSelect={setPlanExpirationDate}
                                        initialFocus
                                        locale={ptBR}
                                    />
                                </PopoverContent>
                            </Popover>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={user.role === 'admin'}
                            onClick={() => openDeleteDialog(user)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Nenhum usuário encontrado</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                      Ainda não há usuários cadastrados no sistema ou que correspondam ao seu filtro.
                  </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {userToDelete && (
           <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
              <AlertDialogContent>
                  <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isso irá remover o registro do usuário <span className="font-bold">{userToDelete.email}</span>.
                  </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteUser}>
                      Sim, excluir usuário
                  </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
      )}
    </div>
  );
}

export default AdminUsersPage;
