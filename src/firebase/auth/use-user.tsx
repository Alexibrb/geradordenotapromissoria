'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { Loader } from 'lucide-react';
import type { AppUser } from '@/types';
import { doc } from 'firebase/firestore';

export function useUser() {
  const { user, isUserLoading: isAuthLoading, userError } = useAuthUser();
  const firestore = useFirestore();
  
  const userProfileRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);

  const isLoading = isAuthLoading || isProfileLoading;

  return { user, userProfile, isLoading, userError };
}

export function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { user, userProfile, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) {
      return; 
    }

    if (!user) {
      router.replace('/login');
      return;
    }
    
    // Se o usuário é admin e está tentando acessar a página de clientes, redireciona para o admin
    if (userProfile?.role === 'admin' && pathname === '/clients') {
        router.replace('/admin');
        return;
    }

    // Se a rota é apenas para admin e o usuário não é admin, redireciona para clientes
    if (adminOnly && userProfile?.role !== 'admin') {
      router.replace('/clients');
      return;
    }

  }, [isLoading, user, userProfile, adminOnly, router, pathname]);
  
  // Exibe o loader enquanto os dados estão sendo carregados
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Verifica se as condições de renderização são atendidas após o carregamento
  if (!user) {
      return null; // ou um loader, enquanto o redirecionamento acontece
  }

  // Se for admin, não deve renderizar a página de clientes
  if (userProfile?.role === 'admin' && pathname === '/clients') {
      return null; // ou um loader
  }

  // Se for uma rota de admin e o usuário não for admin
  if (adminOnly && userProfile?.role !== 'admin') {
      return null; // ou um loader
  }


  // Se todas as condições foram atendidas, renderiza o conteúdo da página.
  return <>{children}</>;
}
