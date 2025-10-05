'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
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
import { Badge } from '@/components/ui/badge';
import { Loader, ShieldCheck, Users } from 'lucide-react';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

function AdminPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const usersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users, isLoading: areUsersLoading } = useCollection<AppUser>(usersQuery);

  const handlePlanChange = (userId: string, newPlan: UserPlan) => {
    const userDocRef = doc(firestore, 'users', userId);
    setDocumentNonBlocking(userDocRef, { plan: newPlan }, { merge: true });
    toast({
      title: 'Plano Atualizado',
      description: `O plano do usuário foi alterado para ${newPlan}.`,
      className: 'bg-accent text-accent-foreground',
    });
  };

  return (
    <ProtectedRoute>
      <main className="min-h-full bg-background">
        <div className="container mx-auto px-4 py-8 md:py-12">
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
                    <TableHead className="text-right">Alterar Plano</TableHead>
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
                      <TableCell className="text-right">
                        <Select
                          defaultValue={user.plan}
                          onValueChange={(value) => handlePlanChange(user.id, value as UserPlan)}
                          disabled={user.role === 'admin'}
                        >
                          <SelectTrigger className="w-[180px] ml-auto">
                            <SelectValue placeholder="Mudar plano" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                          </SelectContent>
                        </Select>
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
