'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
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
import { Loader, Users, Trash2 } from 'lucide-react';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function AdminUsersPage() {
  const firestore = useFirestore();
  const { user: adminUser, userProfile } = useUser();
  const { toast } = useToast();

  const usersQuery = useMemoFirebase(() => 
    userProfile?.role === 'admin' ? collection(firestore, 'users') : null, 
    [firestore, userProfile]
  );
  const { data: users, isLoading: areUsersLoading } = useCollection<AppUser>(usersQuery);

  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);

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
        // Deletar o documento do usuário. As subcoleções se tornarão órfãs,
        // mas inacessíveis pelas regras de segurança atuais.
        const userDocRef = doc(firestore, 'users', userToDelete.id);
        deleteDocumentNonBlocking(userDocRef);

        toast({
            title: "Usuário Excluído",
            description: `O registro do usuário ${userToDelete.email} foi removido. Seus dados associados (clientes, notas) não são mais acessíveis.`,
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
      )}

      {userToDelete && (
           <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
              <AlertDialogContent>
                  <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isso irá remover o registro do usuário <span className="font-bold">{userToDelete.email}</span>. Os dados associados (clientes, notas) se tornarão inacessíveis.
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
