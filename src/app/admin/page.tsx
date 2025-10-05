'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, getDocs, deleteDoc } from 'firebase/firestore';
import type { AppUser, UserPlan } from '@/types';
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from '@/components/ui/badge';
import { Loader, ShieldCheck, Users, ArrowLeft, Trash2 } from 'lucide-react';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

function AdminPage() {
  const firestore = useFirestore();
  const { user: adminUser } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const usersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users, isLoading: areUsersLoading } = useCollection<AppUser>(usersQuery);

  const handlePlanChange = (userId: string, newPlan: UserPlan) => {
    if (userId === adminUser?.uid) {
        toast({
            variant: "destructive",
            title: "Ação não permitida",
            description: "O administrador não pode alterar o próprio plano.",
        });
        // We need to refresh the component to reset the select value, a bit of a hack
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

  const handleDeleteUser = async (userToDelete: AppUser) => {
    if (userToDelete.id === adminUser?.uid) {
        toast({
            variant: "destructive",
            title: "Ação não permitida",
            description: "O administrador não pode excluir a própria conta.",
        });
        return;
    }

    try {
        // This is a simplified deletion process. It removes Firestore data.
        // For a full user deletion, you'd need a Firebase Function to delete the auth user.
        const userDocRef = doc(firestore, 'users', userToDelete.id);

        // 1. Delete all promissory notes and their payments for all clients of the user
        const clientsSnapshot = await getDocs(collection(userDocRef, 'clients'));
        for (const clientDoc of clientsSnapshot.docs) {
            const notesSnapshot = await getDocs(collection(clientDoc.ref, 'promissoryNotes'));
            for (const noteDoc of notesSnapshot.docs) {
                const paymentsSnapshot = await getDocs(collection(noteDoc.ref, 'payments'));
                paymentsSnapshot.forEach(paymentDoc => deleteDocumentNonBlocking(paymentDoc.ref));
                deleteDocumentNonBlocking(noteDoc.ref);
            }
            // 2. Delete the client
            deleteDocumentNonBlocking(clientDoc.ref);
        }

        // 3. Delete user settings
        const settingsDocRef = doc(userDocRef, 'settings', 'appSettings');
        deleteDocumentNonBlocking(settingsDocRef);
        
        // 4. Delete the user document itself
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
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-full bg-background">
        <div className="container mx-auto px-4 py-8 md:py-12">
           <Button variant="ghost" onClick={() => router.push('/clients')} className="mb-4">
                <ArrowLeft className="mr-2" />
                Voltar para Clientes
            </Button>
          <header className="text-center mb-10">
            <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
            <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight mt-4">
              Administração de Usuários
            </h1>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              Gerencie os planos e permissões dos usuários do sistema.
            </p>
          </header>

          {areUsersLoading ? (
            <div className="flex justify-center">
              <Loader className="animate-spin" />
            </div>
          ) : users ? (
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
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={user.role === 'admin'}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. Isso irá remover permanentemente todos os dados do usuário <span className="font-bold">{user.email}</span>, incluindo seus clientes, notas e pagamentos.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(user)}>
                                    Sim, excluir dados
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
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
        </div>
      </main>
    </ProtectedRoute>
  );
}

export default AdminPage;

    