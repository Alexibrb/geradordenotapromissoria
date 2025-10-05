'use client';

import { useState, useEffect } from 'react';
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, getDocs, deleteDoc } from 'firebase/firestore';
import type { AppUser, UserPlan, AppSettings } from '@/types';
import { ProtectedRoute } from '@/firebase/auth/use-user';
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
import { Loader, ShieldCheck, Users, Trash2, Save, Phone, LogOut } from 'lucide-react';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';

function AdminPage() {
  const firestore = useFirestore();
  const { user: adminUser } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const usersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users, isLoading: areUsersLoading } = useCollection<AppUser>(usersQuery);

  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const appSettingsRef = useMemoFirebase(() => doc(firestore, 'app_settings', 'general'), [firestore]);
  const { data: appSettings, isLoading: areAppSettingsLoading } = useDoc<AppSettings>(appSettingsRef);

  useEffect(() => {
    if (appSettings?.upgradeWhatsappNumber) {
      setWhatsappNumber(appSettings.upgradeWhatsappNumber);
    }
  }, [appSettings]);


  const handlePlanChange = (userId: string, newPlan: UserPlan) => {
    if (userId === adminUser?.uid) {
        toast({
            variant: "destructive",
            title: "Ação não permitida",
            description: "O administrador não pode alterar o próprio plano.",
        });
        router.refresh(); 
        return;
    }
    const userDocRef = doc(firestore, 'users', userId);
    setDocumentNonBlocking(userDocRef, { plan: newPlan }, { merge: true });
    toast({
      title: 'Plano Atualizado',
      description: `O plano do usuário foi alterado para ${newPlan}.`,
      className: 'bg-accent text-accent-foreground',
    });
  };

  const openDeleteDialog = (user: AppUser) => {
    setUserToDelete(user);
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    if (userToDelete.id === adminUser?.uid) {
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
        const clientsSnapshot = await getDocs(collection(userDocRef, 'clients'));
        for (const clientDoc of clientsSnapshot.docs) {
            const notesSnapshot = await getDocs(collection(clientDoc.ref, 'promissoryNotes'));
            for (const noteDoc of notesSnapshot.docs) {
                const paymentsSnapshot = await getDocs(collection(noteDoc.ref, 'payments'));
                paymentsSnapshot.forEach(paymentDoc => deleteDocumentNonBlocking(paymentDoc.ref));
                deleteDocumentNonBlocking(noteDoc.ref);
            }
            deleteDocumentNonBlocking(clientDoc.ref);
        }

        const settingsDocRef = doc(userDocRef, 'settings', 'appSettings');
        deleteDocumentNonBlocking(settingsDocRef);
        deleteDocumentNonBlocking(userDocRef);

        toast({
            title: "Dados do Usuário Excluídos",
            description: `Todos os dados de ${userToDelete.email} foram removidos do banco de dados.`,
        });

    } catch (error) {
        console.error("Error deleting user data: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao Excluir",
            description: "Não foi possível remover os dados do usuário.",
        });
    } finally {
        setUserToDelete(null);
    }
  };
  
  const handleSaveAppSettings = () => {
    setDocumentNonBlocking(appSettingsRef, { upgradeWhatsappNumber: whatsappNumber }, { merge: true });
    toast({
      title: 'Configurações Salvas',
      description: 'O número de WhatsApp para upgrade foi atualizado.',
      className: 'bg-accent text-accent-foreground',
    });
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  };

  const isLoading = areUsersLoading || areAppSettingsLoading;

  return (
    <ProtectedRoute adminOnly={true}>
      <main className="min-h-full bg-background">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <header className="flex flex-col md:flex-row justify-between items-center text-center mb-10">
            <div className='flex items-center gap-4'>
                <ShieldCheck className="h-12 w-12 text-primary" />
                <div>
                    <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-left">
                    Painel de Administração
                    </h1>
                    <p className="text-muted-foreground mt-1 max-w-2xl text-left">
                    Gerencie os usuários e as configurações globais do sistema.
                    </p>
                </div>
            </div>
            <Button onClick={handleLogout} variant="outline" className="mt-4 md:mt-0">
              <LogOut className="mr-2" />
              Sair
            </Button>
          </header>

          {isLoading ? (
            <div className="flex justify-center">
              <Loader className="animate-spin" />
            </div>
          ) : (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações Gerais</CardTitle>
                  <CardDescription>Ajustes que afetam todo o sistema.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="space-y-2">
                    <Label htmlFor="whatsapp-number" className="flex items-center"><Phone className="mr-2"/>Número do WhatsApp para Upgrade</Label>
                    <div className="flex gap-2">
                      <Input
                        id="whatsapp-number"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        placeholder="5569992686894"
                      />
                       <Button onClick={handleSaveAppSettings}>
                          <Save className="mr-2" />
                          Salvar
                       </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Este número será usado no link da página de upgrade. Use o formato internacional, ex: 55 DDD NÚMERO.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                 <CardHeader>
                  <CardTitle>Gerenciamento de Usuários</CardTitle>
                  <CardDescription>Gerencie os planos e permissões dos usuários.</CardDescription>
                </CardHeader>
                <CardContent>
                  {users && users.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email do Usuário</TableHead>
                            <TableHead>Plano Atual</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Alterar Plano</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.email}</TableCell>
                              <TableCell>
                                <Badge variant={user.plan === 'pro' ? 'default' : 'secondary'}>
                                  {user.plan}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={user.role === 'admin' ? 'destructive' : 'outline'}>
                                  {user.role}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={user.plan}
                                  onValueChange={(value) => handlePlanChange(user.id, value as UserPlan)}
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
                            Ainda não há usuários cadastrados no sistema.
                        </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        
        {userToDelete && (
             <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso irá remover permanentemente todos os dados do usuário <span className="font-bold">{userToDelete.email}</span>, incluindo seus clientes, notas e pagamentos.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteUser}>
                        Sim, excluir dados
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}

      </main>
    </ProtectedRoute>
  );
}

export default AdminPage;
