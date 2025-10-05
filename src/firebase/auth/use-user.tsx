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
    // Não faz nada enquanto os dados do usuário estão carregando.
    if (isLoading) {
      return;
    }

    // Após o carregamento, verifica as condições de redirecionamento.
    if (!user) {
      router.replace('/login');
      return;
    }
    
    // Se a rota é apenas para admin e o usuário não é admin, redireciona.
    if (adminOnly && userProfile?.role !== 'admin') {
      router.replace('/clients');
      return;
    }

    // Se o usuário é admin e tenta acessar /clients, redireciona para /admin.
    if (userProfile?.role === 'admin' && pathname === '/clients') {
      router.replace('/admin');
      return;
    }
  // A dependência do pathname é necessária para o redirecionamento do admin.
  // O router é estável, então não causa re-execuções desnecessárias.
  }, [isLoading, user, userProfile, adminOnly, pathname, router]);

  // Enquanto carrega, mostra um loader em tela cheia.
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se o usuário está logado e tem as permissões corretas, renderiza o conteúdo.
  // As verificações abaixo previnem a renderização do conteúdo por um frame antes do redirecionamento.
  if (user) {
    if (adminOnly && userProfile?.role === 'admin') {
      return <>{children}</>;
    }
    if (!adminOnly && userProfile?.role !== 'admin') {
      return <>{children}</>;
    }
  }

  // Se nenhuma das condições de renderização for atendida, mostra o loader
  // enquanto o useEffect cuida do redirecionamento.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
