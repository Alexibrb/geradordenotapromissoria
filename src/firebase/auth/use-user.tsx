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

  const isLoading = isAuthLoading || (!!user && isProfileLoading);

  return { user, userProfile, isLoading, userError };
}

export function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { user, userProfile, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) {
      return; // Não faça nada enquanto carrega
    }

    if (!user) {
      router.replace('/login');
      return;
    }
    
    if (adminOnly && userProfile?.role !== 'admin') {
      router.replace('/clients');
      return;
    }

    if (userProfile?.role === 'admin' && pathname === '/clients') {
      router.replace('/admin');
      return;
    }
  }, [isLoading, user, userProfile, adminOnly, router, pathname]);
  
  // 1. Mostrar loader enquanto `isLoading` for true. Esta é a verificação primária.
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 2. Após o carregamento, se as condições de permissão forem atendidas, renderize o conteúdo.
  // O useEffect acima cuidará dos redirecionamentos necessários.
  if (user && (!adminOnly || (adminOnly && userProfile?.role === 'admin'))) {
     // Condição especial para não renderizar /clients para admin, mesmo que por um instante
    if (userProfile?.role === 'admin' && pathname === '/clients') {
        return (
             <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    return <>{children}</>;
  }

  // 3. Se nenhuma das condições acima for atendida (ex: user se tornou null), renderize o loader
  // enquanto o useEffect redireciona. Isso evita "piscar" a tela.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
