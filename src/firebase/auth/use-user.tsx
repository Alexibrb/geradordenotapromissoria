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

  useEffect(() => {
    // Apenas toma decisões de redirecionamento quando o carregamento estiver concluído.
    if (!isLoading) {
      if (!user) {
        // Se não houver usuário, redirecione para o login.
        router.replace('/login');
      } else if (adminOnly && userProfile?.role !== 'admin') {
        // Se for uma rota de admin e o usuário não for admin, redirecione para clientes.
        router.replace('/clients');
      }
    }
  }, [isLoading, user, userProfile, adminOnly, router]);

  // Exibe um loader enquanto o estado de autenticação e perfil está sendo carregado.
  // Isso previne qualquer renderização ou redirecionamento prematuro.
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se passou do carregamento e não houve redirecionamento no useEffect,
  // significa que o usuário tem permissão. Renderiza o conteúdo protegido.
  // A verificação final garante que não haja um flash de conteúdo indesejado.
  if (adminOnly && userProfile?.role !== 'admin') {
    // Ainda pode estar redirecionando, então continue mostrando o loader
    // para evitar que o conteúdo da página de destino apareça antes da transição da URL.
    return (
       <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    // O mesmo caso para o login.
     return (
       <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se todas as verificações passaram, o usuário está autenticado e autorizado.
  return <>{children}</>;
}
